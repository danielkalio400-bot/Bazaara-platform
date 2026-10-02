import { randomUUID } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { appendOutboxEvent } from "../outbox.js";
import { consumePromotionApplicationsTx, refreshCheckoutPromotions } from "./promotions.js";
import { createPaymentIntentTx } from "../payments/orchestration.js";
import { sellerOrderDueAt } from "./fulfillment.js";
import { paystackConfigured } from "../payments/paystack.js";
import { evaluateOrderRisk } from "../risk/service.js";
import { queueNotificationTx } from "../notifications/service.js";
import { calculateGroceryPricing, groceryPricingPolicy } from "./grocery-pricing.js";

const RESERVATION_TTL_MINUTES = 15;
const STANDARD_SHIPPING_PER_SELLER_MINOR = 150000n;
const FREE_SHIPPING_THRESHOLD_MINOR = 5000000n;

export type ShippingAddressInput = {
  fullName: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  district?: string;
  street?: string;
  building?: string;
  landmark?: string;
  deliveryInstructions?: string;
};

export type DeliveryMode = "STANDARD" | "EXPRESS" | "SCHEDULED" | "PICKUP";
export type CommerceVertical = "SHOPPING" | "GROCERY";

export type CheckoutDeliveryOptions = {
  deliveryMode?: DeliveryMode;
  scheduledFor?: Date;
  vertical?: CommerceVertical;
  pickupStoreId?: string;
  deliverySlotId?: string;
};

function storeSupportsDeliveryMode(store: { fulfillmentModes: string[]; groceryConfig?: any }, mode: DeliveryMode, vertical: CommerceVertical) {
  const modes = store.fulfillmentModes.map((value) => value.toUpperCase());
  if (mode === "STANDARD") return modes.length === 0 || modes.includes("STANDARD");
  if (mode === "PICKUP") return vertical === "GROCERY" && (store.groceryConfig?.pickupEnabled ?? modes.includes("PICKUP"));
  if (mode === "EXPRESS") return modes.includes("EXPRESS") && (vertical !== "GROCERY" || store.groceryConfig?.expressEnabled !== false);
  if (mode === "SCHEDULED") return modes.includes("SCHEDULED") && (vertical !== "GROCERY" || store.groceryConfig?.scheduledEnabled !== false);
  return false;
}

function moneyToNumber(value: bigint) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error("Money value exceeds safe JSON integer range");
  return number;
}

function orderNumber() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `BZ-${day}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function reservationStoreName(
  reservations: Array<{ inventoryItem: { store: { id: string; name: string } } }>,
  storeId: string,
) {
  return reservations.find((entry) => entry.inventoryItem.store.id === storeId)?.inventoryItem.store.name ?? "your Grocery branch";
}

const checkoutReadInclude = {
  items: { orderBy: { createdAt: "asc" as const }, include: { merchant: { include: { organization: true } } } },
  reservations: { where: { status: "ACTIVE" as const }, include: { inventoryItem: { include: { store: true } } } },
  promotionApplications: { where: { status: "ACTIVE" as const }, include: { promotion: true }, orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.ShoppingCheckoutInclude;

const orderReadInclude = {
  payment: true,
  paymentIntent: true,
  sellerOrders: {
    orderBy: { createdAt: "asc" as const },
    include: {
      merchant: { include: { organization: true } },
      store: true,
      items: { orderBy: { createdAt: "asc" as const } },
      groceryPickerSession: { include: { outcomes: { orderBy: { createdAt: "asc" as const } }, messages: { orderBy: { createdAt: "asc" as const } } } },
    },
  },
  returns: { orderBy: { createdAt: "desc" as const }, include: { items: true, evidence: true, events: { orderBy: { createdAt: "asc" as const } }, disputes: { orderBy: { createdAt: "desc" as const } }, paymentRefunds: true } },
  promotionApplications: { where: { status: "CONSUMED" as const }, include: { promotion: true }, orderBy: { createdAt: "asc" as const } },
  groceryPreferenceSnapshot: true,
  groceryIssues: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.ShoppingOrderInclude;

export function calculateSellerShippingMinor(subtotal: bigint) {
  return subtotal >= FREE_SHIPPING_THRESHOLD_MINOR ? 0n : STANDARD_SHIPPING_PER_SELLER_MINOR;
}

type CheckoutSellerGroup = {
  merchantId: string;
  sellerName: string;
  subtotalMinor: number;
  shippingMinor: number;
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }>;
};

function serializeCheckout(checkout: any) {
  const sellers = new Map<string, CheckoutSellerGroup>();
  for (const item of checkout.items) {
    const current: CheckoutSellerGroup = sellers.get(item.merchantId) ?? {
      merchantId: item.merchantId,
      sellerName: item.merchant.organization.displayName,
      subtotalMinor: 0,
      shippingMinor: 0,
      items: [],
    };
    const lineTotalMinor = moneyToNumber(item.lineTotalMinor);
    current.subtotalMinor += lineTotalMinor;
    current.items.push({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productTitle: item.productTitle,
      variantTitle: item.variantTitle,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceMinor: moneyToNumber(item.unitPriceMinor),
      lineTotalMinor,
    });
    sellers.set(item.merchantId, current);
  }
  for (const seller of sellers.values()) {
    seller.shippingMinor =
      checkout.vertical === "GROCERY" && checkout.deliveryMode === "EXPRESS"
        ? 0
        : checkout.shippingMinor === 0n
          ? 0
          : moneyToNumber(calculateSellerShippingMinor(BigInt(seller.subtotalMinor)));
  }
  return {
    id: checkout.id,
    vertical: checkout.vertical ?? "SHOPPING",
    pickupStoreId: checkout.pickupStoreId ?? null,
    deliverySlotId: checkout.groceryDeliverySlotId ?? null,
    status: checkout.status,
    currency: checkout.currency,
    subtotalMinor: moneyToNumber(checkout.subtotalMinor),
    serviceFeeBps: checkout.serviceFeeBps ?? 0,
    serviceFeeMinor: moneyToNumber(checkout.serviceFeeMinor ?? 0n),
    shippingMinor: moneyToNumber(checkout.shippingMinor),
    taxMinor: moneyToNumber(checkout.taxMinor),
    expressDeliveryFeeMinor: checkout.vertical === "GROCERY" && checkout.deliveryMode === "EXPRESS" ? moneyToNumber(checkout.shippingMinor) : 0,
    discountMinor: moneyToNumber(checkout.discountMinor),
    promotionCode: checkout.promotionCode,
    discounts: (checkout.promotionApplications ?? []).map((application: any) => ({
      id: application.promotionId,
      code: application.source === "CODE" ? application.promotion.code : null,
      name: application.promotion.name,
      type: application.promotion.type,
      source: application.source,
      discountMinor: moneyToNumber(application.discountMinor),
    })),
    totalMinor: moneyToNumber(checkout.totalMinor),
    shippingAddress: checkout.shippingAddress,
    deliveryMode: checkout.deliveryMode,
    scheduledFor: checkout.scheduledFor,
    paymentMethod: checkout.paymentMethod,
    paymentMethods: [
      { key: "PAY_ON_DELIVERY", label: "Pay on delivery", available: true },
      { key: "PAYSTACK_CARD", label: "Card", available: paystackConfigured(), ...(paystackConfigured() ? {} : { reason: "Card payments are not configured in this environment" }) },
      { key: "PAYSTACK_BANK", label: "Bank / transfer", available: paystackConfigured(), ...(paystackConfigured() ? {} : { reason: "Bank payments are not configured in this environment" }) },
      { key: "BAZAARA_PAY", label: "Wallet", available: false, reason: "Wallet checkout funding is not connected yet" },
    ],
    expiresAt: checkout.expiresAt,
    sellers: [...sellers.values()],
  };
}

function serializeOrder(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    vertical: order.vertical ?? "SHOPPING",
    pickupStoreId: order.pickupStoreId ?? null,
    deliverySlotId: order.groceryDeliverySlotId ?? null,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    subtotalMinor: moneyToNumber(order.subtotalMinor),
    serviceFeeBps: order.serviceFeeBps ?? 0,
    serviceFeeMinor: moneyToNumber(order.serviceFeeMinor ?? 0n),
    shippingMinor: moneyToNumber(order.shippingMinor),
    taxMinor: moneyToNumber(order.taxMinor),
    expressDeliveryFeeMinor: order.vertical === "GROCERY" && order.deliveryMode === "EXPRESS" ? moneyToNumber(order.shippingMinor) : 0,
    discountMinor: moneyToNumber(order.discountMinor),
    promotionCode: order.promotionCode,
    discounts: (order.promotionApplications ?? []).map((application: any) => ({
      id: application.promotionId,
      code: application.source === "CODE" ? application.promotion.code : null,
      name: application.promotion.name,
      type: application.promotion.type,
      source: application.source,
      discountMinor: moneyToNumber(application.discountMinor),
    })),
    totalMinor: moneyToNumber(order.totalMinor),
    shippingAddress: order.shippingAddress,
    deliveryMode: order.deliveryMode,
    scheduledFor: order.scheduledFor,
    placedAt: order.placedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    payment: order.payment ? {
      id: order.payment.id,
      reference: order.payment.internalReference,
      provider: order.payment.provider,
      status: order.payment.status,
      amountMinor: moneyToNumber(order.payment.amountMinor),
    } : null,
    paymentIntent: order.paymentIntent ? {
      id: order.paymentIntent.id,
      status: order.paymentIntent.status,
      provider: order.paymentIntent.provider,
      amountMinor: moneyToNumber(order.paymentIntent.amountMinor),
      capturedMinor: moneyToNumber(order.paymentIntent.capturedMinor),
      refundedMinor: moneyToNumber(order.paymentIntent.refundedMinor),
    } : null,
    sellerOrders: order.sellerOrders.map((sellerOrder: any) => ({
      id: sellerOrder.id,
      status: sellerOrder.status,
      seller: { slug: sellerOrder.merchant.slug, name: sellerOrder.merchant.organization.displayName },
      store: { id: sellerOrder.store.id, name: sellerOrder.store.name },
      subtotalMinor: moneyToNumber(sellerOrder.subtotalMinor),
      shippingMinor: moneyToNumber(sellerOrder.shippingMinor),
      totalMinor: moneyToNumber(sellerOrder.totalMinor),
      picker: sellerOrder.groceryPickerSession ? {
        id: sellerOrder.groceryPickerSession.id,
        status: sellerOrder.groceryPickerSession.status,
        startedAt: sellerOrder.groceryPickerSession.startedAt,
        completedAt: sellerOrder.groceryPickerSession.completedAt,
        outcomes: sellerOrder.groceryPickerSession.outcomes ?? [],
        messages: sellerOrder.groceryPickerSession.messages ?? [],
      } : null,
      items: sellerOrder.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceMinor: moneyToNumber(item.unitPriceMinor),
        lineTotalMinor: moneyToNumber(item.lineTotalMinor),
      })),
    })),
    groceryPreferences: order.groceryPreferenceSnapshot?.preferences ?? null,
    groceryIssues: (order.groceryIssues ?? []).map((issue: any) => ({ ...issue, requestedAmountMinor: issue.requestedAmountMinor == null ? null : moneyToNumber(issue.requestedAmountMinor), approvedAmountMinor: issue.approvedAmountMinor == null ? null : moneyToNumber(issue.approvedAmountMinor) })),
    returns: order.returns.map((returnCase: any) => ({
      id: returnCase.id,
      status: returnCase.status,
      reason: returnCase.reason,
      details: returnCase.details,
      requestedAt: returnCase.requestedAt,
      eligibilityExpiresAt: returnCase.eligibilityExpiresAt,
      requestedRefundMinor: returnCase.requestedRefundMinor == null ? null : moneyToNumber(returnCase.requestedRefundMinor),
      approvedRefundMinor: returnCase.approvedRefundMinor == null ? null : moneyToNumber(returnCase.approvedRefundMinor),
      returnCarrier: returnCase.returnCarrier,
      returnService: returnCase.returnService,
      returnTrackingId: returnCase.returnTrackingId,
      items: returnCase.items,
      evidence: returnCase.evidence ?? [],
      events: returnCase.events ?? [],
      disputes: returnCase.disputes ?? [],
      refunds: (returnCase.paymentRefunds ?? []).map((refund: any) => ({ ...refund, amountMinor: moneyToNumber(refund.amountMinor) })),
    })),
  };
}

async function releaseCheckoutTx(tx: Prisma.TransactionClient, checkoutId: string, checkoutStatus: "ABANDONED" | "EXPIRED") {
  const checkout = await tx.shoppingCheckout.findFirst({ where: { id: checkoutId, status: "ACTIVE" }, select: { id: true, groceryDeliverySlotId: true } });
  if (!checkout) return;
  const reservations = await tx.inventoryReservation.findMany({ where: { checkoutId, status: "ACTIVE" } });
  for (const reservation of reservations) {
    await tx.$executeRaw`
      UPDATE "InventoryItem"
      SET "quantityReserved" = GREATEST(0, "quantityReserved" - ${reservation.quantity}), "updatedAt" = NOW()
      WHERE "id" = ${reservation.inventoryItemId}
    `;
  }
  if (reservations.length) {
    await tx.inventoryReservation.updateMany({ where: { checkoutId, status: "ACTIVE" }, data: { status: checkoutStatus === "EXPIRED" ? "EXPIRED" : "RELEASED" } });
  }
  if (checkout.groceryDeliverySlotId) {
    await tx.groceryDeliverySlot.updateMany({ where: { id: checkout.groceryDeliverySlotId, reserved: { gt: 0 } }, data: { reserved: { decrement: 1 } } });
  }
  await tx.shoppingCheckout.updateMany({ where: { id: checkoutId, status: "ACTIVE" }, data: { status: checkoutStatus } });
}

async function releaseExpiredCheckouts(userId: string, vertical: CommerceVertical = "SHOPPING") {
  const expired = await db.shoppingCheckout.findMany({ where: { userId, vertical, status: "ACTIVE", expiresAt: { lte: new Date() } }, select: { id: true } });
  for (const checkout of expired) {
    await db.$transaction((tx) => releaseCheckoutTx(tx, checkout.id, "EXPIRED"));
  }
}

export async function createCheckout(userId: string, shippingAddress: ShippingAddressInput, options: CheckoutDeliveryOptions = {}) {
  const vertical: CommerceVertical = options.vertical ?? "SHOPPING";
  const deliveryMode: DeliveryMode = options.deliveryMode ?? "STANDARD";
  if (vertical === "SHOPPING" && deliveryMode === "PICKUP") throw new AppError("BAD_REQUEST", "Pickup is available through Grocery checkout", 400);

  let scheduledFor = deliveryMode === "SCHEDULED" ? options.scheduledFor : undefined;
  let selectedStoreId: string | undefined;
  let selectedStore: any = null;
  let selectedSlot: any = null;

  if (vertical === "GROCERY" && deliveryMode === "PICKUP") {
    if (!options.pickupStoreId) throw new AppError("BAD_REQUEST", "Choose a pickup branch", 400);
    selectedStore = await db.store.findFirst({ where: { id: options.pickupStoreId, status: "ACTIVE", merchant: { vertical: "GROCERY" } }, include: { merchant: true, groceryConfig: true } });
    if (!selectedStore) throw new AppError("NOT_FOUND", "Pickup branch not found", 404);
    if (!(selectedStore.groceryConfig?.pickupEnabled ?? selectedStore.fulfillmentModes.map((value: string) => value.toUpperCase()).includes("PICKUP"))) throw new AppError("CONFLICT", "Pickup is not enabled for this branch", 409);
    selectedStoreId = selectedStore.id;
  }

  if (deliveryMode === "SCHEDULED") {
    if (vertical === "GROCERY") {
      if (!options.deliverySlotId) throw new AppError("BAD_REQUEST", "Choose an available Grocery delivery slot", 400);
      selectedSlot = await db.groceryDeliverySlot.findFirst({
        where: { id: options.deliverySlotId, active: true, store: { status: "ACTIVE", merchant: { vertical: "GROCERY" } } },
        include: { store: { include: { merchant: true, groceryConfig: true } } },
      });
      if (!selectedSlot || selectedSlot.reserved >= selectedSlot.capacity) throw new AppError("CONFLICT", "That delivery slot is no longer available", 409);
      if (!(selectedSlot.store.groceryConfig?.scheduledEnabled ?? selectedSlot.store.fulfillmentModes.map((value: string) => value.toUpperCase()).includes("SCHEDULED"))) throw new AppError("CONFLICT", "Scheduled delivery is not enabled for this branch", 409);
      selectedStore = selectedSlot.store;
      selectedStoreId = selectedSlot.storeId;
      scheduledFor = selectedSlot.startsAt;
    }
    if (!scheduledFor) throw new AppError("BAD_REQUEST", "Choose a delivery time for scheduled delivery", 400);
    const scheduledAt = scheduledFor.getTime();
    const now = Date.now();
    if (!Number.isFinite(scheduledAt) || scheduledAt < now + 30 * 60 * 1000 || scheduledAt > now + 14 * 24 * 60 * 60 * 1000) {
      throw new AppError("BAD_REQUEST", "Scheduled delivery must be between 30 minutes and 14 days from now", 400);
    }
  }

  await releaseExpiredCheckouts(userId, vertical);

  const cart = await db.cart.findFirst({
    where: { userId, vertical, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              inventoryItems: { include: { store: { include: { groceryConfig: true } } }, orderBy: { updatedAt: "asc" } },
              product: { include: { merchant: { include: { organization: true } } } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) throw new AppError("BAD_REQUEST", "Your cart is empty", 400);
  for (const item of cart.items) {
    if (item.variant.product.merchant.vertical !== vertical) throw new AppError("CONFLICT", "Your cart contains an item from another Bazaara vertical", 409);
  }

  const currency = cart.currency;
  let subtotalMinor = 0n;
  const sellerSubtotals = new Map<string, bigint>();
  const sellerThresholds = new Map<string, bigint | null>();

  for (const item of cart.items) {
    if (!item.variant.active || item.variant.product.status !== "ACTIVE") throw new AppError("CONFLICT", `${item.variant.product.title} is no longer available`, 409);
    if (item.variant.currency !== currency) throw new AppError("CONFLICT", "Cart currency changed. Review your cart before checkout", 409);
    const eligibleInventory = item.variant.inventoryItems.filter((entry) => entry.store.status === "ACTIVE" && entry.store.merchantId === item.variant.product.merchantId && (!selectedStoreId || entry.storeId === selectedStoreId) && storeSupportsDeliveryMode(entry.store, deliveryMode, vertical));
    const eligibleAvailable = eligibleInventory.reduce((total, entry) => total + Math.max(0, entry.quantityOnHand - entry.quantityReserved), 0);
    if (eligibleAvailable < item.quantity) throw new AppError("CONFLICT", `${deliveryMode.toLowerCase()} fulfillment is not available for ${item.variant.product.title} at the requested quantity`, 409);
    const line = item.variant.priceMinor * BigInt(item.quantity);
    subtotalMinor += line;
    sellerSubtotals.set(item.variant.product.merchantId, (sellerSubtotals.get(item.variant.product.merchantId) ?? 0n) + line);
    const threshold = eligibleInventory.find((entry) => entry.store.groceryConfig?.freeDeliveryThresholdMinor != null)?.store.groceryConfig?.freeDeliveryThresholdMinor ?? null;
    sellerThresholds.set(item.variant.product.merchantId, threshold);
  }

  if (selectedStore) {
    const minimum = selectedStore.groceryConfig?.minimumOrderMinor ?? 0n;
    if (subtotalMinor < minimum) throw new AppError("CONFLICT", `This branch requires a minimum order of ₦${(Number(minimum) / 100).toLocaleString("en-NG")}`, 409);
    const activeStatuses = ["PLACED", "CONFIRMED", "PICKING", "PROCESSING", "PACKED", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY"] as any;
    const activeOrders = await db.shoppingSellerOrder.count({ where: { storeId: selectedStore.id, status: { in: activeStatuses }, order: { vertical: "GROCERY" } } });
    const capacity = selectedStore.groceryConfig?.maxActiveOrders ?? 40;
    if (activeOrders >= capacity) throw new AppError("CONFLICT", "This branch is at order capacity. Choose another branch or a later slot", 409);
  }

  const membership = vertical === "GROCERY" ? await db.groceryMembership.findUnique({ where: { userId } }) : null;
  const hasFreeDelivery = Boolean(membership?.freeDeliveryUntil && membership.freeDeliveryUntil > new Date());

  const standardShippingMinor =
    deliveryMode === "PICKUP"
      ? 0n
      : [...sellerSubtotals.entries()].reduce((total, [merchantId, sellerSubtotal]) => {
          const threshold = sellerThresholds.get(merchantId);
          if (threshold != null && sellerSubtotal >= threshold) return total;
          return total + calculateSellerShippingMinor(sellerSubtotal);
        }, 0n);

  const groceryPolicy =
    vertical === "GROCERY" ? await groceryPricingPolicy() : undefined;

  const groceryPricing =
    vertical === "GROCERY"
      ? calculateGroceryPricing({
          subtotalMinor,
          deliveryMode,
          standardShippingMinor,
          hasFreeDelivery,
          policy: groceryPolicy,
        })
      : {
          serviceFeeBps: 0,
          serviceFeeMinor: 0n,
          shippingMinor:
            deliveryMode === "PICKUP" || hasFreeDelivery
              ? 0n
              : standardShippingMinor,
          deliveryPlatformShareMinor: 0n,
          deliveryGoShareMinor: 0n,
        };

  const serviceFeeBps = groceryPricing.serviceFeeBps;
  const serviceFeeMinor = groceryPricing.serviceFeeMinor;
  const shippingMinor = groceryPricing.shippingMinor;
  const deliveryPlatformShareMinor = groceryPricing.deliveryPlatformShareMinor;
  const deliveryGoShareMinor = groceryPricing.deliveryGoShareMinor;
  const taxMinor = 0n;
  const discountMinor = 0n;
  const totalMinor = subtotalMinor + serviceFeeMinor + shippingMinor + taxMinor - discountMinor;

  if (vertical === "GROCERY") {
    const group = await db.groceryGroupCart.findFirst({
      where: { cartId: cart.id, status: "OPEN", expiresAt: { gt: new Date() } },
      include: { members: { where: { status: "ACTIVE" } } },
    });
    if (group) {
      if (group.hostUserId !== userId) throw new AppError("FORBIDDEN", "Only the group host can start checkout", 403);
      if (group.spendingLimitMinor != null && totalMinor > group.spendingLimitMinor) {
        throw new AppError("CONFLICT", "This group basket exceeds the host spending limit", 409);
      }
      const allocatedMinor = group.members.reduce((sum, member) => sum + (member.paymentAllocationMinor ?? 0n), 0n);
      if (allocatedMinor > totalMinor) {
        throw new AppError("CONFLICT", "Group payment allocations exceed the current order total", 409);
      }
    }
  }

  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

  const checkoutId = await db.$transaction(async (tx) => {
    const existing = await tx.shoppingCheckout.findMany({ where: { userId, cartId: cart.id, vertical, status: "ACTIVE" }, select: { id: true } });
    for (const checkout of existing) await releaseCheckoutTx(tx, checkout.id, "ABANDONED");

    if (selectedSlot) {
      const slotUpdate = await tx.groceryDeliverySlot.updateMany({
        where: { id: selectedSlot.id, active: true, reserved: { lt: selectedSlot.capacity }, startsAt: { gt: new Date() } },
        data: { reserved: { increment: 1 } },
      });
      if (slotUpdate.count !== 1) throw new AppError("CONFLICT", "That delivery slot just filled up. Choose another slot", 409);
    }

    const checkout = await tx.shoppingCheckout.create({
      data: {
        userId,
        cartId: cart.id,
        vertical,
        pickupStoreId: deliveryMode === "PICKUP" ? selectedStoreId : null,
        groceryDeliverySlotId: selectedSlot?.id ?? null,
        currency,
        subtotalMinor,
        serviceFeeBps,
        serviceFeeMinor,
        shippingMinor,
        deliveryPlatformShareMinor,
        deliveryGoShareMinor,
        taxMinor,
        discountMinor,
        totalMinor,
        shippingAddress: shippingAddress as Prisma.InputJsonObject,
        paymentMethod: "PAY_ON_DELIVERY",
        deliveryMode,
        scheduledFor,
        expiresAt,
      },
    });

    for (const cartItem of cart.items) {
      const variant = cartItem.variant;
      await tx.shoppingCheckoutItem.create({
        data: {
          checkoutId: checkout.id,
          merchantId: variant.product.merchantId,
          productId: variant.productId,
          variantId: variant.id,
          productTitle: variant.product.title,
          variantTitle: variant.title,
          sku: variant.sku,
          quantity: cartItem.quantity,
          unitPriceMinor: variant.priceMinor,
          lineTotalMinor: variant.priceMinor * BigInt(cartItem.quantity),
          currency: variant.currency,
        },
      });

      let remaining = cartItem.quantity;
      for (const inventory of variant.inventoryItems.filter((entry) => entry.store.status === "ACTIVE" && entry.store.merchantId === variant.product.merchantId && (!selectedStoreId || entry.storeId === selectedStoreId) && storeSupportsDeliveryMode(entry.store, deliveryMode, vertical))) {
        if (remaining <= 0) break;
        const observedAvailable = Math.max(0, inventory.quantityOnHand - inventory.quantityReserved);
        if (observedAvailable <= 0) continue;
        const reserve = Math.min(remaining, observedAvailable);
        const affected = await tx.$executeRaw`
          UPDATE "InventoryItem"
          SET "quantityReserved" = "quantityReserved" + ${reserve}, "updatedAt" = NOW()
          WHERE "id" = ${inventory.id}
            AND ("quantityOnHand" - "quantityReserved") >= ${reserve}
        `;
        if (affected === 1) {
          await tx.inventoryReservation.create({ data: { checkoutId: checkout.id, inventoryItemId: inventory.id, variantId: variant.id, quantity: reserve, expiresAt } });
          remaining -= reserve;
        }
      }
      if (remaining > 0) throw new AppError("CONFLICT", `Not enough stock is available for ${variant.product.title}`, 409);
    }

    return checkout.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await refreshCheckoutPromotions(userId, checkoutId);
  return getCheckout(userId, checkoutId, vertical);
}

export async function getCheckout(userId: string, checkoutId: string, vertical?: CommerceVertical) {
  await releaseExpiredCheckouts(userId, vertical ?? "SHOPPING");
  const checkout = await db.shoppingCheckout.findFirst({ where: { id: checkoutId, userId, ...(vertical ? { vertical } : {}) }, include: checkoutReadInclude });
  if (!checkout) throw new AppError("NOT_FOUND", "Checkout not found", 404);
  if (checkout.status === "EXPIRED") throw new AppError("CONFLICT", "This checkout expired. Return to your cart and try again", 409);
  return serializeCheckout(checkout);
}

export async function setCheckoutPaymentMethod(userId: string, checkoutId: string, paymentMethod: string, vertical?: CommerceVertical) {
  await releaseExpiredCheckouts(userId, vertical ?? "SHOPPING");
  const checkout = await db.shoppingCheckout.findFirst({ where: { id: checkoutId, userId, ...(vertical ? { vertical } : {}) } });
  if (!checkout) throw new AppError("NOT_FOUND", "Checkout not found", 404);
  if (checkout.status !== "ACTIVE" || checkout.expiresAt <= new Date()) throw new AppError("CONFLICT", "This checkout can no longer be changed", 409);
  const supported = ["PAY_ON_DELIVERY", "PAYSTACK_CARD", "PAYSTACK_BANK"];
  if (!supported.includes(paymentMethod)) throw new AppError("BAD_REQUEST", "Unsupported payment method", 400);
  if (paymentMethod.startsWith("PAYSTACK_") && !paystackConfigured()) throw new AppError("CONFLICT", "Online payments are not configured in this environment", 409);
  await db.shoppingCheckout.update({ where: { id: checkout.id }, data: { paymentMethod } });
  return getCheckout(userId, checkout.id, vertical);
}

export async function placeOrder(userId: string, checkoutId: string, vertical?: CommerceVertical) {
  const existing = await db.shoppingOrder.findFirst({ where: { checkoutId, userId, ...(vertical ? { vertical } : {}) }, include: orderReadInclude });
  if (existing) return serializeOrder(existing);

  await refreshCheckoutPromotions(userId, checkoutId);

  const checkout = await db.shoppingCheckout.findFirst({
    where: { id: checkoutId, userId, ...(vertical ? { vertical } : {}) },
    include: { items: true, reservations: { where: { status: "ACTIVE" }, include: { inventoryItem: { include: { store: true } } } } },
  });
  if (!checkout) throw new AppError("NOT_FOUND", "Checkout not found", 404);
  if (checkout.status !== "ACTIVE") throw new AppError("CONFLICT", "This checkout can no longer be submitted", 409);
  if (checkout.expiresAt <= new Date()) {
    await db.$transaction((tx) => releaseCheckoutTx(tx, checkout.id, "EXPIRED"));
    throw new AppError("CONFLICT", "This checkout expired. Return to your cart and try again", 409);
  }
  if (checkout.paymentMethod.startsWith("PAYSTACK_") && !paystackConfigured()) throw new AppError("CONFLICT", "The selected online payment method is not configured", 409);

  const order = await db.$transaction(async (tx) => {
    const lockedCheckout = await tx.shoppingCheckout.findUniqueOrThrow({
      where: { id: checkout.id },
      include: { items: true, reservations: { where: { status: "ACTIVE" }, include: { inventoryItem: { include: { store: true } } } }, promotionApplications: { where: { status: "ACTIVE" }, include: { promotion: true } } },
    });
    if (lockedCheckout.status !== "ACTIVE") {
      const already = await tx.shoppingOrder.findUnique({ where: { checkoutId: lockedCheckout.id }, include: orderReadInclude });
      if (already) return already;
      throw new AppError("CONFLICT", "This checkout can no longer be submitted", 409);
    }

    const expectedQuantity = lockedCheckout.items.reduce((total, item) => total + item.quantity, 0);
    const reservedQuantity = lockedCheckout.reservations.reduce((total, reservation) => total + reservation.quantity, 0);
    if (expectedQuantity !== reservedQuantity) throw new AppError("CONFLICT", "Inventory reservation is incomplete. Return to your cart and retry", 409);

    for (const reservation of lockedCheckout.reservations) {
      if (reservation.expiresAt <= new Date()) throw new AppError("CONFLICT", "Inventory reservation expired. Return to your cart and retry", 409);
      const affected = await tx.$executeRaw`
        UPDATE "InventoryItem"
        SET "quantityOnHand" = "quantityOnHand" - ${reservation.quantity},
            "quantityReserved" = "quantityReserved" - ${reservation.quantity},
            "updatedAt" = NOW()
        WHERE "id" = ${reservation.inventoryItemId}
          AND "quantityOnHand" >= ${reservation.quantity}
          AND "quantityReserved" >= ${reservation.quantity}
      `;
      if (affected !== 1) throw new AppError("CONFLICT", "Stock changed while the order was being placed. Return to your cart and retry", 409);
    }

    const payment = await tx.payment.create({
      data: {
        internalReference: `PAY-${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`,
        provider: lockedCheckout.paymentMethod === "PAY_ON_DELIVERY" ? "PAY_ON_DELIVERY" : "PAYSTACK",
        status: "PENDING",
        amountMinor: lockedCheckout.totalMinor,
        currency: lockedCheckout.currency,
      },
    });

    const createdOrder = await tx.shoppingOrder.create({
      data: {
        orderNumber: orderNumber(),
        userId,
        checkoutId: lockedCheckout.id,
        paymentId: payment.id,
        vertical: lockedCheckout.vertical,
        pickupStoreId: lockedCheckout.pickupStoreId,
        groceryDeliverySlotId: lockedCheckout.groceryDeliverySlotId,
        status: "PLACED",
        paymentStatus: "PENDING",
        currency: lockedCheckout.currency,
        subtotalMinor: lockedCheckout.subtotalMinor,
        serviceFeeBps: lockedCheckout.serviceFeeBps,
        serviceFeeMinor: lockedCheckout.serviceFeeMinor,
        shippingMinor: lockedCheckout.shippingMinor,
        deliveryPlatformShareMinor: lockedCheckout.deliveryPlatformShareMinor,
        deliveryGoShareMinor: lockedCheckout.deliveryGoShareMinor,
        taxMinor: lockedCheckout.taxMinor,
        discountMinor: lockedCheckout.discountMinor,
        promotionId: lockedCheckout.promotionId,
        promotionCode: lockedCheckout.promotionCode,
        totalMinor: lockedCheckout.totalMinor,
        shippingAddress: lockedCheckout.shippingAddress as Prisma.InputJsonValue,
        paymentMethod: lockedCheckout.paymentMethod,
        deliveryMode: lockedCheckout.deliveryMode,
        scheduledFor: lockedCheckout.scheduledFor,
      },
    });

    await createPaymentIntentTx(tx, {
      orderId: createdOrder.id,
      legacyPaymentId: payment.id,
      paymentMethod: lockedCheckout.paymentMethod,
      amountMinor: lockedCheckout.totalMinor,
      currency: lockedCheckout.currency,
    });

    await consumePromotionApplicationsTx(tx, lockedCheckout.id, createdOrder.id, userId);

    const checkoutItemsByVariant = new Map(lockedCheckout.items.map((item) => [item.variantId, item] as const));
    const groups = new Map<string, { merchantId: string; storeId: string; items: Array<{ checkoutItem: typeof lockedCheckout.items[number]; quantity: number }> }>();
    for (const reservation of lockedCheckout.reservations) {
      const checkoutItem = checkoutItemsByVariant.get(reservation.variantId);
      if (!checkoutItem) throw new AppError("CONFLICT", "Checkout item snapshot is missing", 409);
      const key = `${checkoutItem.merchantId}:${reservation.inventoryItem.storeId}`;
      const group = groups.get(key) ?? { merchantId: checkoutItem.merchantId, storeId: reservation.inventoryItem.storeId, items: [] };
      group.items.push({ checkoutItem, quantity: reservation.quantity });
      groups.set(key, group);
    }

    const merchantShipping = new Map<string, bigint>();
    for (const item of lockedCheckout.items) merchantShipping.set(item.merchantId, (merchantShipping.get(item.merchantId) ?? 0n) + item.lineTotalMinor);
    for (const [merchantId, subtotal] of merchantShipping) merchantShipping.set(merchantId, calculateSellerShippingMinor(subtotal));
    const shippingAllocated = new Set<string>();

    for (const group of groups.values()) {
      const subtotal = group.items.reduce((total, entry) => total + entry.checkoutItem.unitPriceMinor * BigInt(entry.quantity), 0n);
      const shipping =
        lockedCheckout.vertical === "GROCERY" && lockedCheckout.deliveryMode === "EXPRESS"
          ? 0n
          : lockedCheckout.shippingMinor === 0n
            ? 0n
            : shippingAllocated.has(group.merchantId)
              ? 0n
              : (merchantShipping.get(group.merchantId) ?? 0n);
      shippingAllocated.add(group.merchantId);
      const createdSellerOrder = await tx.shoppingSellerOrder.create({
        data: {
          orderId: createdOrder.id,
          merchantId: group.merchantId,
          storeId: group.storeId,
          subtotalMinor: subtotal,
          shippingMinor:
            lockedCheckout.vertical === "GROCERY" && lockedCheckout.deliveryMode === "EXPRESS"
              ? 0n
              : shipping,
          totalMinor:
            subtotal +
            (lockedCheckout.vertical === "GROCERY" && lockedCheckout.deliveryMode === "EXPRESS"
              ? 0n
              : shipping),
          fulfillmentDueAt: sellerOrderDueAt(createdOrder.placedAt),
          items: {
            create: group.items.map(({ checkoutItem, quantity }) => ({
              productId: checkoutItem.productId,
              variantId: checkoutItem.variantId,
              productTitle: checkoutItem.productTitle,
              variantTitle: checkoutItem.variantTitle,
              sku: checkoutItem.sku,
              quantity,
              unitPriceMinor: checkoutItem.unitPriceMinor,
              lineTotalMinor: checkoutItem.unitPriceMinor * BigInt(quantity),
              currency: checkoutItem.currency,
            })),
          },
        },
        include: { items: true },
      });
      if (lockedCheckout.vertical === "GROCERY") {
        await tx.groceryPickerSession.create({
          data: {
            sellerOrderId: createdSellerOrder.id,
            status: "QUEUED",
            outcomes: {
              create: group.items.map(({ checkoutItem, quantity }) => ({
                orderItemId: createdSellerOrder.items?.find?.((candidate: any) => candidate.variantId === checkoutItem.variantId)?.id ?? "",
                requestedQuantity: quantity,
              })).filter((entry: any) => entry.orderItemId),
            },
          },
        });

        const groceryBusiness = await tx.merchant.findUnique({
          where: { id: group.merchantId },
          select: {
            organization: {
              select: {
                displayName: true,
                members: {
                  where: { status: "ACTIVE" },
                  select: { userId: true },
                },
              },
            },
          },
        });

        for (const member of groceryBusiness?.organization.members ?? []) {
          await queueNotificationTx(tx, {
            userId: member.userId,
            category: "ORDER",
            title:
              lockedCheckout.paymentMethod === "PAY_ON_DELIVERY"
                ? "New Grocery order"
                : "Grocery order created — payment pending",
            body:
              lockedCheckout.paymentMethod === "PAY_ON_DELIVERY"
                ? `${createdOrder.orderNumber} is ready for branch stock confirmation and picking at ${reservationStoreName(lockedCheckout.reservations, group.storeId)}.`
                : `${createdOrder.orderNumber} was created for ${reservationStoreName(lockedCheckout.reservations, group.storeId)}. Wait for payment confirmation before fulfilment.`,
            resourceType: "ShoppingSellerOrder",
            resourceId: createdSellerOrder.id,
            channels: ["PUSH"],
          });
        }
      }
    }

    if (lockedCheckout.vertical === "GROCERY") {
      const preferences = await tx.groceryCustomerPreference.findUnique({ where: { userId } });
      const cartItemPreferences = await tx.groceryCartItemPreference.findMany({ where: { cartItem: { cartId: lockedCheckout.cartId } } });
      await tx.groceryOrderPreferenceSnapshot.create({ data: { orderId: createdOrder.id, preferences: { customer: preferences ?? null, items: cartItemPreferences } as Prisma.InputJsonValue } });
    }

    await tx.inventoryReservation.updateMany({ where: { checkoutId: lockedCheckout.id, status: "ACTIVE" }, data: { status: "CONSUMED" } });
    await tx.shoppingCheckout.update({ where: { id: lockedCheckout.id }, data: { status: "COMPLETED" } });
    await tx.cart.update({ where: { id: lockedCheckout.cartId }, data: { status: "CONVERTED" } });
    if (lockedCheckout.vertical === "GROCERY") await tx.groceryGroupCart.updateMany({ where: { cartId: lockedCheckout.cartId, status: "OPEN" }, data: { status: "ORDERED" } });
    await appendOutboxEvent(tx, {
      aggregateType: "ShoppingOrder",
      aggregateId: createdOrder.id,
      eventType: "OrderPlaced",
      payload: {
        groceryServiceFeeMinor: createdOrder.vertical === "GROCERY" ? createdOrder.serviceFeeMinor.toString() : "0",
        groceryExpressDeliveryFeeMinor: createdOrder.vertical === "GROCERY" && createdOrder.deliveryMode === "EXPRESS" ? createdOrder.shippingMinor.toString() : "0",
        groceryServiceFeeBps: createdOrder.vertical === "GROCERY" ? createdOrder.serviceFeeBps : 0,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        userId,
        currency: createdOrder.currency,
        totalMinor: createdOrder.totalMinor.toString(),
        serviceFeeMinor: createdOrder.serviceFeeMinor.toString(),
        shippingMinor: createdOrder.shippingMinor.toString(),
      },
    });

    if (lockedCheckout.vertical === "GROCERY") {
      await appendOutboxEvent(tx, {
        aggregateType: "ShoppingOrder",
        aggregateId: createdOrder.id,
        eventType: "GroceryFeesAllocated",
        payload: {
          orderId: createdOrder.id,
          serviceFeeBps: createdOrder.serviceFeeBps,
          serviceFeeMinor: createdOrder.serviceFeeMinor.toString(),
          deliveryMode: createdOrder.deliveryMode,
          deliveryFeeMinor: createdOrder.shippingMinor.toString(),
          deliveryPlatformShareMinor: createdOrder.deliveryPlatformShareMinor.toString(),
          deliveryGoShareMinor: createdOrder.deliveryGoShareMinor.toString(),
          expressRateBps: 1000,
          expressMinimumMinor: "100000",
          expressMaximumMinor: "500000",
        },
      });
    }
    await queueNotificationTx(tx, {
      userId, category: "ORDER",
      title: lockedCheckout.paymentMethod === "PAY_ON_DELIVERY" ? "Order placed" : "Order created — payment required",
      body: lockedCheckout.paymentMethod === "PAY_ON_DELIVERY" ? `Order ${createdOrder.orderNumber} is confirmed for pay on delivery.` : `Complete secure payment for order ${createdOrder.orderNumber} before seller fulfillment begins.`,
      resourceType: "ShoppingOrder", resourceId: createdOrder.id, channels: ["PUSH", "EMAIL"],
    });

    return tx.shoppingOrder.findUniqueOrThrow({ where: { id: createdOrder.id }, include: orderReadInclude });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  const serialized = serializeOrder(order);
  void evaluateOrderRisk(order.id).catch(() => undefined);
  return serialized;
}

export async function listOrders(userId: string, vertical?: CommerceVertical) {
  const orders = await db.shoppingOrder.findMany({ where: { userId, ...(vertical ? { vertical } : {}) }, orderBy: { createdAt: "desc" }, include: orderReadInclude, take: 100 });
  return { orders: orders.map(serializeOrder) };
}

export async function getOrder(userId: string, orderId: string, vertical?: CommerceVertical) {
  const order = await db.shoppingOrder.findFirst({ where: { id: orderId, userId, ...(vertical ? { vertical } : {}) }, include: orderReadInclude });
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  return serializeOrder(order);
}

export async function cancelOrder(userId: string, orderId: string, vertical?: CommerceVertical) {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.shoppingOrder.findFirst({ where: { id: orderId, userId, ...(vertical ? { vertical } : {}) }, include: orderReadInclude });
    if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
    if (order.status === "CANCELLED") return order;
    if (!["PLACED", "CONFIRMED"].includes(order.status)) throw new AppError("CONFLICT", "This order can no longer be cancelled automatically", 409);
    if (order.sellerOrders.some((sellerOrder) => !["PLACED", "CONFIRMED"].includes(sellerOrder.status))) throw new AppError("CONFLICT", "One or more sellers have already started processing this order", 409);

    for (const sellerOrder of order.sellerOrders) {
      for (const item of sellerOrder.items) {
        await tx.inventoryItem.update({
          where: { storeId_variantId: { storeId: sellerOrder.storeId, variantId: item.variantId } },
          data: { quantityOnHand: { increment: item.quantity } },
        });
      }
    }

    await tx.shoppingSellerOrder.updateMany({ where: { orderId: order.id }, data: { status: "CANCELLED" } });
    if (order.groceryDeliverySlotId) await tx.groceryDeliverySlot.updateMany({ where: { id: order.groceryDeliverySlotId, reserved: { gt: 0 } }, data: { reserved: { decrement: 1 } } });
    if (order.paymentId && order.payment?.status === "PENDING") await tx.payment.update({ where: { id: order.paymentId }, data: { status: "CANCELLED" } });
    await tx.shoppingOrder.update({ where: { id: order.id }, data: { status: "CANCELLED", paymentStatus: "CANCELLED", cancelledAt: new Date() } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingOrder", aggregateId: order.id, eventType: "OrderCancelled", payload: { orderId: order.id, userId } });
    return tx.shoppingOrder.findUniqueOrThrow({ where: { id: order.id }, include: orderReadInclude });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return serializeOrder(result);
}

export async function requestReturn(userId: string, orderId: string, input: { reason: string; details?: string; items: Array<{ orderItemId: string; quantity: number }> }) {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.shoppingOrder.findFirst({ where: { id: orderId, userId }, include: orderReadInclude });
    if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
    if (order.status !== "DELIVERED") throw new AppError("CONFLICT", "Returns can be requested after the order is delivered", 409);
    const allItems = order.sellerOrders.flatMap((sellerOrder) => sellerOrder.items);
    const itemMap = new Map(allItems.map((item) => [item.id, item] as const));
    for (const requested of input.items) {
      const item = itemMap.get(requested.orderItemId);
      if (!item) throw new AppError("BAD_REQUEST", "One of the selected return items is not part of this order", 400);
      if (requested.quantity < 1 || requested.quantity > item.quantity) throw new AppError("BAD_REQUEST", `Return quantity for ${item.productTitle} is invalid`, 400);
    }
    const returnCase = await tx.shoppingReturn.create({
      data: {
        orderId: order.id,
        reason: input.reason,
        details: input.details,
        items: { create: input.items.map((item) => ({ orderItemId: item.orderItemId, quantity: item.quantity })) },
      },
    });
    await tx.shoppingOrder.update({ where: { id: order.id }, data: { status: "RETURN_REQUESTED" } });
    const involvedIds = new Set(input.items.map((item) => item.orderItemId));
    const sellerOrderIds = order.sellerOrders.filter((sellerOrder) => sellerOrder.items.some((item) => involvedIds.has(item.id))).map((sellerOrder) => sellerOrder.id);
    if (sellerOrderIds.length) await tx.shoppingSellerOrder.updateMany({ where: { id: { in: sellerOrderIds } }, data: { status: "RETURN_REQUESTED" } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingReturn", aggregateId: returnCase.id, eventType: "ReturnRequested", payload: { returnId: returnCase.id, orderId: order.id, userId } });
    return tx.shoppingOrder.findUniqueOrThrow({ where: { id: order.id }, include: orderReadInclude });
  });
  return serializeOrder(result);
}

export const merchantStatusTransitions: Record<string, string[]> = {
  PLACED: ["CONFIRMED"],
  CONFIRMED: ["PICKING", "PROCESSING"],
  PICKING: ["PACKED"],
  PROCESSING: ["PACKED"],
  PACKED: ["READY_TO_SHIP"],
  READY_TO_SHIP: [],
  SHIPPED: [],
  OUT_FOR_DELIVERY: [],
};

export async function listBusinessShoppingOrders(userId: string) {
  const memberships = await db.organizationMember.findMany({
    where: { userId, status: "ACTIVE", organization: { merchants: { some: { vertical: "SHOPPING" } } } },
    select: { organizationId: true },
  });
  const memberOrganizationIds = memberships.map((entry) => entry.organizationId);
  if (memberOrganizationIds.length === 0) return { orders: [] };

  const hasGlobalRead = Boolean(await db.userRole.findFirst({
    where: {
      userId,
      organizationId: null,
      role: { permissions: { some: { permission: { key: "order.read" } } } },
    },
    select: { id: true },
  }));
  const allowedOrganizationIds = hasGlobalRead
    ? memberOrganizationIds
    : (await db.userRole.findMany({
        where: {
          userId,
          organizationId: { in: memberOrganizationIds },
          role: { permissions: { some: { permission: { key: "order.read" } } } },
        },
        select: { organizationId: true },
      }))
        .map((assignment) => assignment.organizationId)
        .filter((organizationId): organizationId is string => Boolean(organizationId));

  if (allowedOrganizationIds.length === 0) return { orders: [] };
  const sellerOrders = await db.shoppingSellerOrder.findMany({
    where: { merchant: { vertical: "SHOPPING", organizationId: { in: allowedOrganizationIds } } },
    orderBy: { createdAt: "desc" },
    include: { merchant: { include: { organization: true } }, store: true, items: true, order: true },
    take: 200,
  });
  return {
    orders: sellerOrders.map((sellerOrder) => ({
      id: sellerOrder.id,
      orderId: sellerOrder.orderId,
      orderNumber: sellerOrder.order.orderNumber,
      status: sellerOrder.status,
      paymentStatus: sellerOrder.order.paymentStatus,
      currency: sellerOrder.order.currency,
      totalMinor: moneyToNumber(sellerOrder.totalMinor),
      placedAt: sellerOrder.order.placedAt,
      seller: sellerOrder.merchant.organization.displayName,
      store: sellerOrder.store.name,
      itemCount: sellerOrder.items.reduce((total, item) => total + item.quantity, 0),
    })),
  };
}

export function canTransitionSellerOrder(current: string, next: string) {
  return (merchantStatusTransitions[current] ?? []).includes(next);
}

export async function businessShoppingOrderOrganization(userId: string, sellerOrderId: string) {
  const sellerOrder = await db.shoppingSellerOrder.findFirst({
    where: {
      id: sellerOrderId,
      merchant: { vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } },
    },
    select: { merchant: { select: { organizationId: true } } },
  });
  if (!sellerOrder) throw new AppError("NOT_FOUND", "Seller order not found", 404);
  return sellerOrder.merchant.organizationId;
}

export async function updateBusinessShoppingOrder(userId: string, sellerOrderId: string, status: string) {
  const sellerOrder = await db.shoppingSellerOrder.findFirst({
    where: { id: sellerOrderId, merchant: { vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } } },
    include: { order: true },
  });
  if (!sellerOrder) throw new AppError("NOT_FOUND", "Seller order not found", 404);
  if (!canTransitionSellerOrder(sellerOrder.status, status)) throw new AppError("CONFLICT", `Cannot move order from ${sellerOrder.status} to ${status}`, 409);

  await db.$transaction(async (tx) => {
    await tx.shoppingSellerOrder.update({ where: { id: sellerOrder.id }, data: { status: status as any } });
    const all = await tx.shoppingSellerOrder.findMany({ where: { orderId: sellerOrder.orderId }, select: { status: true } });
    let parentStatus: any = sellerOrder.order.status;
    if (all.every((entry) => entry.status === "DELIVERED")) parentStatus = "DELIVERED";
    else if (all.some((entry) => ["OUT_FOR_DELIVERY", "DELIVERED"].includes(entry.status))) parentStatus = "OUT_FOR_DELIVERY";
    else if (all.some((entry) => entry.status === "SHIPPED")) parentStatus = "SHIPPED";
    else if (all.some((entry) => entry.status === "PACKED")) parentStatus = "PACKED";
    else if (all.some((entry) => entry.status === "PROCESSING")) parentStatus = "PROCESSING";
    else if (all.every((entry) => entry.status === "CONFIRMED")) parentStatus = "CONFIRMED";
    await tx.shoppingOrder.update({ where: { id: sellerOrder.orderId }, data: { status: parentStatus, ...(parentStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}) } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingSellerOrder", aggregateId: sellerOrder.id, eventType: `SellerOrder${status}`, payload: { sellerOrderId: sellerOrder.id, orderId: sellerOrder.orderId, status } });
  });

  const refreshed = await db.shoppingSellerOrder.findUniqueOrThrow({ where: { id: sellerOrder.id }, include: { order: true, items: true, merchant: { include: { organization: true } }, store: true } });
  return {
    id: refreshed.id,
    orderNumber: refreshed.order.orderNumber,
    status: refreshed.status,
    seller: refreshed.merchant.organization.displayName,
    store: refreshed.store.name,
    totalMinor: moneyToNumber(refreshed.totalMinor),
  };
}

export async function listOperationalShoppingOrders() {
  const orders = await db.shoppingOrder.findMany({ orderBy: { createdAt: "desc" }, include: orderReadInclude, take: 200 });
  return { orders: orders.map(serializeOrder) };
}
