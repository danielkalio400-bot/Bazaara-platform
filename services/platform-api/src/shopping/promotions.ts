import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";

function moneyToNumber(value: bigint) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error("Money value exceeds safe JSON integer range");
  return number;
}

function minBigInt(a: bigint, b: bigint) { return a < b ? a : b; }

type PromotionRow = Prisma.PromotionGetPayload<Record<string, never>>;
type CheckoutForPromotion = Prisma.ShoppingCheckoutGetPayload<{
  include: {
    items: { include: { product: { select: { categoryId: true; merchantId: true } } } };
    user: { select: { id: true; createdAt: true; verificationLevel: true } };
    promotionApplications: { where: { status: "ACTIVE" }; include: { promotion: true } };
  };
}>;

export type PromotionRequestContext = { requestFingerprint?: string };

type Eligibility = { eligible: true; eligibleSubtotal: bigint } | { eligible: false; reason: string };

function addressPart(address: Prisma.JsonValue, key: string) {
  if (!address || typeof address !== "object" || Array.isArray(address)) return "";
  const value = (address as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function segmentMatches(promotion: PromotionRow, checkout: CheckoutForPromotion, priorOrders: number) {
  if (!promotion.customerSegments.length) return true;
  const level = checkout.user.verificationLevel;
  const segments = new Set<string>([
    priorOrders === 0 ? "FIRST_ORDER" : "RETURNING",
    level !== "GUEST" ? "VERIFIED" : "GUEST",
    level === "CONTACT_VERIFIED" ? "CONTACT_VERIFIED" : "",
    level === "IDENTITY_VERIFIED" ? "IDENTITY_VERIFIED" : "",
    level === "FINANCIAL_VERIFIED" ? "FINANCIAL_VERIFIED" : "",
    level === "BUSINESS_VERIFIED" ? "BUSINESS_VERIFIED" : "",
  ].filter(Boolean));
  return promotion.customerSegments.some((segment) => segments.has(segment.toUpperCase()));
}

function scopedEligibleSubtotal(checkout: CheckoutForPromotion, promotion: PromotionRow) {
  const included = checkout.items.filter((item) => {
    if (promotion.excludedProductIds.includes(item.productId)) return false;
    if (promotion.excludedCategoryIds.includes(item.product.categoryId)) return false;
    if (promotion.excludedMerchantIds.includes(item.merchantId)) return false;
    if (promotion.scope === "CATEGORY" && item.product.categoryId !== promotion.categoryId) return false;
    if (promotion.scope === "PRODUCT" && item.productId !== promotion.productId) return false;
    if (promotion.scope === "SELLER" && item.merchantId !== promotion.merchantId) return false;
    return true;
  });
  return included.reduce((sum, item) => sum + item.lineTotalMinor, 0n);
}

function requestedDiscount(checkout: CheckoutForPromotion, promotion: PromotionRow, eligibleSubtotal: bigint) {
  let discount = 0n;
  if (promotion.type === "FREE_DELIVERY") discount = checkout.shippingMinor;
  if (promotion.type === "FIXED_AMOUNT") discount = minBigInt(promotion.amountOffMinor ?? 0n, eligibleSubtotal);
  if (promotion.type === "PERCENTAGE") discount = eligibleSubtotal * BigInt(promotion.percentOff ?? 0) / 100n;
  if (promotion.maxDiscountMinor != null) discount = minBigInt(discount, promotion.maxDiscountMinor);
  return discount;
}

async function eligibility(
  checkout: CheckoutForPromotion,
  promotion: PromotionRow,
  options: { explicit: boolean; requestFingerprint?: string },
): Promise<Eligibility> {
  const now = new Date();
  if (promotion.status !== "ACTIVE" || promotion.startsAt > now || promotion.endsAt <= now) return { eligible: false, reason: "Campaign is not active" };
  if (checkout.subtotalMinor < promotion.minimumSubtotalMinor) return { eligible: false, reason: "Minimum spend has not been reached" };

  const country = addressPart(checkout.shippingAddress, "country");
  const region = addressPart(checkout.shippingAddress, "region");
  if (promotion.eligibleCountries.length && !promotion.eligibleCountries.map((value) => value.toUpperCase()).includes(country)) return { eligible: false, reason: "Delivery country is not eligible" };
  if (promotion.eligibleRegions.length && !promotion.eligibleRegions.map((value) => value.toUpperCase()).includes(region)) return { eligible: false, reason: "Delivery region is not eligible" };

  const [globalUsage, userUsage, spent, priorOrders] = await Promise.all([
    promotion.usageLimit == null ? Promise.resolve(0) : db.promotionApplication.count({ where: { promotionId: promotion.id, status: "CONSUMED" } }),
    db.promotionApplication.count({ where: { promotionId: promotion.id, userId: checkout.userId, status: "CONSUMED" } }),
    promotion.budgetMinor == null ? Promise.resolve({ _sum: { discountMinor: null as bigint | null } }) : db.promotionApplication.aggregate({ where: { promotionId: promotion.id, status: "CONSUMED" }, _sum: { discountMinor: true } }),
    (promotion.firstOrderOnly || promotion.customerSegments.length) ? db.shoppingOrder.count({ where: { userId: checkout.userId } }) : Promise.resolve(0),
  ]);

  if (promotion.usageLimit != null && globalUsage >= promotion.usageLimit) return { eligible: false, reason: "Campaign usage limit has been reached" };
  if (userUsage >= promotion.perUserLimit) return { eligible: false, reason: "Customer usage limit has been reached" };
  if (promotion.firstOrderOnly && priorOrders > 0) return { eligible: false, reason: "Campaign is for first orders only" };
  if (!segmentMatches(promotion, checkout, priorOrders)) return { eligible: false, reason: "Customer segment is not eligible" };

  const fraud = promotion.fraudRules && typeof promotion.fraudRules === "object" && !Array.isArray(promotion.fraudRules)
    ? promotion.fraudRules as Record<string, unknown>
    : {};
  const minAccountAgeDays = typeof fraud.minAccountAgeDays === "number" ? Math.max(0, Math.floor(fraud.minAccountAgeDays)) : 0;
  if (minAccountAgeDays > 0 && checkout.user.createdAt.getTime() > Date.now() - minAccountAgeDays * 86_400_000) return { eligible: false, reason: "Account age requirement has not been met" };
  if (fraud.requireVerified === true && checkout.user.verificationLevel === "GUEST") return { eligible: false, reason: "Verified BazID is required" };
  const maxAttemptsPerHour = typeof fraud.maxAttemptsPerHour === "number" ? Math.max(1, Math.floor(fraud.maxAttemptsPerHour)) : 0;
  if (options.explicit && maxAttemptsPerHour > 0 && options.requestFingerprint) {
    const attempts = await db.promotionAttempt.count({ where: { requestFingerprint: options.requestFingerprint, createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
    if (attempts >= maxAttemptsPerHour) return { eligible: false, reason: "Too many promotion attempts" };
  }

  const eligibleSubtotal = scopedEligibleSubtotal(checkout, promotion);
  if (eligibleSubtotal <= 0n && promotion.type !== "FREE_DELIVERY") return { eligible: false, reason: "Campaign does not apply to checkout items" };
  if (
    promotion.type === "FREE_DELIVERY" &&
    checkout.vertical === "GROCERY" &&
    checkout.deliveryMode === "EXPRESS"
  ) {
    return { eligible: false, reason: "Grocery Express uses a fixed delivery fee" };
  }
  if (promotion.type === "FREE_DELIVERY" && checkout.shippingMinor <= 0n) return { eligible: false, reason: "Delivery is already free" };

  const discount = requestedDiscount(checkout, promotion, eligibleSubtotal);
  if (discount <= 0n) return { eligible: false, reason: "Campaign does not produce a discount" };
  if (promotion.budgetMinor != null) {
    const alreadySpent = spent._sum.discountMinor ?? 0n;
    if (alreadySpent + discount > promotion.budgetMinor) return { eligible: false, reason: "Campaign budget has been exhausted" };
  }
  return { eligible: true, eligibleSubtotal };
}

async function loadCheckout(userId: string, checkoutId: string) {
  const checkout = await db.shoppingCheckout.findFirst({
    where: { id: checkoutId, userId, status: "ACTIVE" },
    include: {
      items: { include: { product: { select: { categoryId: true, merchantId: true } } } },
      user: { select: { id: true, createdAt: true, verificationLevel: true } },
      promotionApplications: { where: { status: "ACTIVE" }, include: { promotion: true } },
    },
  });
  if (!checkout) throw new AppError("NOT_FOUND", "Active checkout not found", 404);
  if (checkout.expiresAt <= new Date()) throw new AppError("CONFLICT", "This checkout has expired", 409);
  return checkout;
}

function chooseStack(candidates: Array<{ promotion: PromotionRow; source: "CODE" | "AUTOMATIC"; discountMinor: bigint }>) {
  const selected: typeof candidates = [];
  const stackGroups = new Set<string>();
  for (const candidate of candidates) {
    if (selected.length) {
      if (!candidate.promotion.allowStacking || selected.some((entry) => !entry.promotion.allowStacking)) continue;
      if (candidate.promotion.stackGroup && stackGroups.has(candidate.promotion.stackGroup)) continue;
    }
    selected.push(candidate);
    if (candidate.promotion.stackGroup) stackGroups.add(candidate.promotion.stackGroup);
  }
  return selected;
}

async function recalculateCheckout(
  checkout: CheckoutForPromotion,
  explicitPromotion: PromotionRow | undefined,
  context: PromotionRequestContext,
) {
  const automatic = await db.promotion.findMany({
    where: { activation: "AUTOMATIC", status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: 100,
  });

  const candidates: Array<{ promotion: PromotionRow; source: "CODE" | "AUTOMATIC"; discountMinor: bigint }> = [];
  if (explicitPromotion) {
    const check = await eligibility(checkout, explicitPromotion, { explicit: true, requestFingerprint: context.requestFingerprint });
    if (!check.eligible) throw new AppError("CONFLICT", check.reason, 409);
    candidates.push({ promotion: explicitPromotion, source: "CODE", discountMinor: requestedDiscount(checkout, explicitPromotion, check.eligibleSubtotal) });
  }
  for (const promotion of automatic) {
    if (promotion.id === explicitPromotion?.id) continue;
    const check = await eligibility(checkout, promotion, { explicit: false });
    if (!check.eligible) continue;
    candidates.push({ promotion, source: "AUTOMATIC", discountMinor: requestedDiscount(checkout, promotion, check.eligibleSubtotal) });
  }

  candidates.sort((a, b) => {
    if (a.source !== b.source) return a.source === "CODE" ? -1 : 1;
    return a.promotion.priority - b.promotion.priority;
  });
  const selected = chooseStack(candidates);
  const maxTotal =
    checkout.subtotalMinor +
    checkout.serviceFeeMinor +
    checkout.shippingMinor +
    checkout.taxMinor;
  let discountTotal = 0n;
  for (const candidate of selected) {
    const remaining = maxTotal - discountTotal;
    candidate.discountMinor = minBigInt(candidate.discountMinor, remaining);
    discountTotal += candidate.discountMinor;
  }

  const selectedIds = selected.map((entry) => entry.promotion.id);
  await db.$transaction(async (tx) => {
    await tx.promotionApplication.updateMany({
      where: { checkoutId: checkout.id, status: "ACTIVE", ...(selectedIds.length ? { promotionId: { notIn: selectedIds } } : {}) },
      data: { status: "REMOVED" },
    });
    for (const entry of selected) {
      await tx.promotionApplication.upsert({
        where: { checkoutId_promotionId: { checkoutId: checkout.id, promotionId: entry.promotion.id } },
        create: { checkoutId: checkout.id, promotionId: entry.promotion.id, userId: checkout.userId, source: entry.source, status: "ACTIVE", discountMinor: entry.discountMinor },
        update: { source: entry.source, status: "ACTIVE", discountMinor: entry.discountMinor },
      });
    }
    const primary = selected[0];
    const explicit = selected.find((entry) => entry.source === "CODE");
    await tx.shoppingCheckout.update({
      where: { id: checkout.id },
      data: {
        promotionId: primary?.promotion.id ?? null,
        promotionCode: explicit?.promotion.code ?? null,
        discountMinor: discountTotal,
        totalMinor: maxTotal - discountTotal,
      },
    });
  });

  return {
    checkoutId: checkout.id,
    currency: checkout.currency,
    subtotalMinor: moneyToNumber(checkout.subtotalMinor),
    serviceFeeMinor: moneyToNumber(checkout.serviceFeeMinor),
    shippingMinor: moneyToNumber(checkout.shippingMinor),
    taxMinor: moneyToNumber(checkout.taxMinor),
    discountMinor: moneyToNumber(discountTotal),
    totalMinor: moneyToNumber(maxTotal - discountTotal),
    promotionCode: selected.find((entry) => entry.source === "CODE")?.promotion.code ?? null,
    discounts: selected.map((entry) => ({
      id: entry.promotion.id,
      code: entry.source === "CODE" ? entry.promotion.code : null,
      name: entry.promotion.name,
      type: entry.promotion.type,
      source: entry.source,
      discountMinor: moneyToNumber(entry.discountMinor),
    })),
  };
}

async function recordAttempt(input: { promotionId?: string; checkoutId: string; userId: string; code?: string; outcome: string; reason?: string; requestFingerprint?: string }) {
  await db.promotionAttempt.create({ data: input }).catch(() => undefined);
}

export async function refreshCheckoutPromotions(userId: string, checkoutId: string, context: PromotionRequestContext = {}) {
  const checkout = await loadCheckout(userId, checkoutId);
  const currentCode = checkout.promotionApplications.find((entry) => entry.source === "CODE" && entry.status === "ACTIVE")?.promotion;
  return recalculateCheckout(checkout, currentCode, context);
}

export async function applyPromotionToCheckout(userId: string, checkoutId: string, rawCode: string, context: PromotionRequestContext = {}) {
  const code = rawCode.trim().toUpperCase();
  if (!code || code.length > 40) throw new AppError("BAD_REQUEST", "Enter a valid promotion code", 400);
  const checkout = await loadCheckout(userId, checkoutId);
  const promotion = await db.promotion.findUnique({ where: { code } });
  if (!promotion || promotion.activation !== "CODE") {
    await recordAttempt({ checkoutId, userId, code, outcome: "DENIED", reason: "INVALID_CODE", requestFingerprint: context.requestFingerprint });
    throw new AppError("BAD_REQUEST", "This promotion code is not active", 400);
  }
  try {
    const result = await recalculateCheckout(checkout, promotion, context);
    await recordAttempt({ promotionId: promotion.id, checkoutId, userId, code, outcome: "APPLIED", requestFingerprint: context.requestFingerprint });
    return { promotion: { code: promotion.code, name: promotion.name, type: promotion.type, scope: promotion.scope }, checkout: result };
  } catch (error) {
    await recordAttempt({ promotionId: promotion.id, checkoutId, userId, code, outcome: "DENIED", reason: error instanceof Error ? error.message : "INELIGIBLE", requestFingerprint: context.requestFingerprint });
    throw error;
  }
}

export async function clearPromotionFromCheckout(userId: string, checkoutId: string) {
  const checkout = await loadCheckout(userId, checkoutId);
  await db.promotionApplication.updateMany({ where: { checkoutId, source: "CODE", status: "ACTIVE" }, data: { status: "REMOVED" } });
  const result = await recalculateCheckout({ ...checkout, promotionApplications: checkout.promotionApplications.filter((entry) => entry.source !== "CODE") }, undefined, {});
  return { checkout: result };
}

export async function consumePromotionApplicationsTx(tx: Prisma.TransactionClient, checkoutId: string, orderId: string, userId: string) {
  const applications = await tx.promotionApplication.findMany({
    where: { checkoutId, userId, status: "ACTIVE" },
    include: { promotion: true },
    orderBy: { createdAt: "asc" },
  });
  const now = new Date();
  for (const application of applications) {
    const promotion = application.promotion;
    if (promotion.status !== "ACTIVE" || promotion.startsAt > now || promotion.endsAt <= now) throw new AppError("CONFLICT", `Promotion ${promotion.name} is no longer active`, 409);
    if (promotion.usageLimit != null) {
      const used = await tx.promotionApplication.count({ where: { promotionId: promotion.id, status: "CONSUMED" } });
      if (used >= promotion.usageLimit) throw new AppError("CONFLICT", `Promotion ${promotion.name} has reached its usage limit`, 409);
    }
    const userUsed = await tx.promotionApplication.count({ where: { promotionId: promotion.id, userId, status: "CONSUMED" } });
    if (userUsed >= promotion.perUserLimit) throw new AppError("CONFLICT", `Promotion ${promotion.name} has reached your usage limit`, 409);
    if (promotion.budgetMinor != null) {
      const spent = await tx.promotionApplication.aggregate({ where: { promotionId: promotion.id, status: "CONSUMED" }, _sum: { discountMinor: true } });
      if ((spent._sum.discountMinor ?? 0n) + application.discountMinor > promotion.budgetMinor) throw new AppError("CONFLICT", `Promotion ${promotion.name} budget was exhausted`, 409);
    }
  }
  for (const application of applications) {
    await tx.promotionApplication.update({ where: { id: application.id }, data: { orderId, status: "CONSUMED", consumedAt: now } });
  }
}
