import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { queueNotificationTx } from "../notifications/service.js";

const openStatuses = ["OPEN", "WAITING_CUSTOMER", "WAITING_STAFF", "ESCALATED"] as const;

type AttachmentUrl = string;

function validateAttachmentUrls(urls: AttachmentUrl[] = []) {
  if (urls.length > 8) throw new AppError("BAD_REQUEST", "A support message can contain at most 8 attachments", 400);
  for (const raw of urls) {
    let parsed: URL;
    try { parsed = new URL(raw); } catch { throw new AppError("BAD_REQUEST", "Attachment URL is invalid", 400); }
    const localDev = env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !(localDev && parsed.protocol === "http:")) throw new AppError("BAD_REQUEST", "Support attachments must use HTTPS", 400);
    if (raw.length > 2000) throw new AppError("BAD_REQUEST", "Attachment URL is too long", 400);
  }
  return urls;
}

async function verifyOwnedLinks(userId: string, input: { organizationId?: string; orderId?: string; foodOrderId?: string; foodRestaurantId?: string; productId?: string; paymentIntentId?: string; shipmentId?: string; shoppingReturnId?: string; driveRideId?: string; ledgerTransactionId?: string }) {
  const [order, foodOrder, foodRestaurant, product, paymentIntent, shipment, returnCase, driveRide, ledgerTransaction] = await Promise.all([
    input.orderId ? db.shoppingOrder.findFirst({ where: { id: input.orderId, userId }, select: { id: true } }) : null,
    input.foodOrderId ? db.foodOrder.findFirst({
      where: input.organizationId
        ? { id: input.foodOrderId, restaurant: { merchant: { organizationId: input.organizationId } } }
        : { id: input.foodOrderId, userId },
      select: { id: true, restaurantId: true },
    }) : null,
    input.foodRestaurantId ? db.foodRestaurant.findFirst({
      where: input.organizationId
        ? { id: input.foodRestaurantId, merchant: { organizationId: input.organizationId } }
        : { id: input.foodRestaurantId, orders: { some: { userId } } },
      select: { id: true },
    }) : null,
    input.productId ? db.product.findFirst({ where: { id: input.productId, status: "ACTIVE" }, select: { id: true } }) : null,
    input.paymentIntentId ? db.paymentIntent.findFirst({ where: { id: input.paymentIntentId, order: { userId } }, select: { id: true, orderId: true } }) : null,
    input.shipmentId ? db.shipment.findFirst({ where: { id: input.shipmentId, sellerOrder: { order: { userId } } }, select: { id: true, sellerOrder: { select: { orderId: true } } } }) : null,
    input.shoppingReturnId ? db.shoppingReturn.findFirst({ where: { id: input.shoppingReturnId, order: { userId } }, select: { id: true, orderId: true } }) : null,
    input.driveRideId ? db.driveRide.findFirst({ where: { id: input.driveRideId, OR: [{ riderUserId: userId }, { driverUserId: userId }] }, select: { id: true } }) : null,
    input.ledgerTransactionId ? db.ledgerTransaction.findFirst({ where: { id: input.ledgerTransactionId, entries: { some: { account: { wallet: { is: { userId } } } } } }, select: { id: true } }) : null,
  ]);
  if (input.orderId && !order) throw new AppError("NOT_FOUND", "Order not found", 404);
  if (input.foodOrderId && !foodOrder) throw new AppError("NOT_FOUND", "Food order not found", 404);
  if (input.foodRestaurantId && !foodRestaurant) throw new AppError("NOT_FOUND", "Food restaurant not found", 404);
  if (input.foodOrderId && input.foodRestaurantId && foodOrder?.restaurantId !== input.foodRestaurantId) throw new AppError("BAD_REQUEST", "Food order and restaurant do not match", 400);
  if (input.productId && !product) throw new AppError("NOT_FOUND", "Product not found", 404);
  if (input.paymentIntentId && !paymentIntent) throw new AppError("NOT_FOUND", "Payment not found", 404);
  if (input.shipmentId && !shipment) throw new AppError("NOT_FOUND", "Shipment not found", 404);
  if (input.shoppingReturnId && !returnCase) throw new AppError("NOT_FOUND", "Return not found", 404);
  if (input.driveRideId && !driveRide) throw new AppError("NOT_FOUND", "Drive ride not found", 404);
  if (input.ledgerTransactionId && !ledgerTransaction) throw new AppError("NOT_FOUND", "Wallet transaction not found", 404);
  const linkedOrderIds = [input.orderId, paymentIntent?.orderId, shipment?.sellerOrder.orderId, returnCase?.orderId].filter(Boolean);
  if (new Set(linkedOrderIds).size > 1) throw new AppError("BAD_REQUEST", "Linked support resources must belong to the same order", 400);
}

function caseInclude() {
  return {
    order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true, currency: true, totalMinor: true } },
    foodOrder: { select: {
      id: true, orderNumber: true, status: true, fulfillmentType: true, paymentStatus: true, currency: true,
      subtotalMinor: true, deliveryFeeMinor: true, serviceFeeMinor: true, tipMinor: true, discountMinor: true, totalMinor: true,
      courierUserId: true, courierAssignedAt: true, pickedUpAt: true, placedAt: true, deliveredAt: true, cancelledAt: true,
      restaurant: { select: { id: true, slug: true, acceptingOrders: true, estimatedDeliveryMin: true, estimatedDeliveryMax: true, merchant: { select: { organizationId: true, organization: { select: { displayName: true } } } } } },
      economics: { select: { serviceFeeBps: true, merchantCommissionBps: true, merchantCommissionMinor: true, merchantNetMinor: true, courierGrossMinor: true, goCommissionBps: true, goCommissionMinor: true, courierNetMinor: true } },
      trackingEvents: { orderBy: { createdAt: "desc" as const }, take: 8, select: { id: true, status: true, message: true, createdAt: true } },
    } },
    foodRestaurant: { select: { id: true, slug: true, acceptingOrders: true, deliveryEnabled: true, pickupEnabled: true, pauseUntil: true, merchant: { select: { organizationId: true, organization: { select: { displayName: true } } } } } },
    product: { select: { id: true, slug: true, title: true } },
    paymentIntent: { select: { id: true, status: true, provider: true, providerReference: true } },
    shipment: { select: { id: true, status: true, carrier: true, trackingIdentifier: true } },
    shoppingReturn: { select: { id: true, status: true, reason: true } },
    driveRide: { select: { id: true, status: true, fareFundingStatus: true, riderUserId: true, driverUserId: true, createdAt: true, updatedAt: true } },
    ledgerTransaction: { select: { id: true, reference: true, kind: true, currency: true, description: true, createdAt: true } },
    assignedTo: { select: { id: true, displayName: true } },
    messages: { orderBy: { createdAt: "asc" as const }, include: { author: { select: { id: true, displayName: true } } } },
  } satisfies Prisma.SupportCaseInclude;
}

function serializeCase(row: any, includeInternal: boolean) {
  return {
    ...row,
    order: row.order ? { ...row.order, totalMinor: Number(row.order.totalMinor) } : null,
    foodOrder: row.foodOrder ? {
      ...row.foodOrder,
      subtotalMinor: Number(row.foodOrder.subtotalMinor), deliveryFeeMinor: Number(row.foodOrder.deliveryFeeMinor),
      serviceFeeMinor: Number(row.foodOrder.serviceFeeMinor), tipMinor: Number(row.foodOrder.tipMinor), discountMinor: Number(row.foodOrder.discountMinor), totalMinor: Number(row.foodOrder.totalMinor),
      economics: row.foodOrder.economics ? {
        ...row.foodOrder.economics,
        merchantCommissionMinor: Number(row.foodOrder.economics.merchantCommissionMinor), merchantNetMinor: Number(row.foodOrder.economics.merchantNetMinor),
        courierGrossMinor: Number(row.foodOrder.economics.courierGrossMinor), goCommissionMinor: Number(row.foodOrder.economics.goCommissionMinor), courierNetMinor: Number(row.foodOrder.economics.courierNetMinor),
      } : null,
    } : null,
    messages: (row.messages ?? []).filter((message: any) => includeInternal || message.kind !== "INTERNAL"),
  };
}

export async function createSupportCase(userId: string, input: { category: string; subject: string; description: string; organizationId?: string; channel?: string; region?: string; currency?: string; context?: unknown; orderId?: string; foodOrderId?: string; foodRestaurantId?: string; productId?: string; paymentIntentId?: string; shipmentId?: string; shoppingReturnId?: string; driveRideId?: string; ledgerTransactionId?: string; attachmentUrls?: string[] }) {
  await verifyOwnedLinks(userId, input);
  const attachmentUrls = validateAttachmentUrls(input.attachmentUrls);
  const row = await db.supportCase.create({
    data: {
      userId,
      organizationId: input.organizationId,
      channel: input.channel ?? (input.organizationId ? "BUSINESS" : "CONSUMER"),
      region: input.region ?? env.REGION,
      currency: input.currency ?? env.CURRENCY,
      slaDueAt: new Date(Date.now() + 12 * 60 * 60_000),
      context: input.context === undefined ? undefined : (input.context as Prisma.InputJsonValue),
      orderId: input.orderId,
      foodOrderId: input.foodOrderId,
      foodRestaurantId: input.foodRestaurantId,
      productId: input.productId,
      paymentIntentId: input.paymentIntentId,
      shipmentId: input.shipmentId,
      shoppingReturnId: input.shoppingReturnId,
      driveRideId: input.driveRideId,
      ledgerTransactionId: input.ledgerTransactionId,
      category: input.category,
      subject: input.subject,
      description: input.description,
      status: "OPEN",
      messages: { create: { authorUserId: userId, kind: "CUSTOMER", body: input.description, attachmentUrls } },
    },
    include: caseInclude(),
  });
  if (input.category === "FOOD") {
    await runFoodSupportAi(row.id, { sendSafeReply: true }).catch(() => null);
    return getSupportCaseForAudience(row.id, false);
  }
  return { case: serializeCase(row, false) };
}

async function getSupportCaseForAudience(id: string, includeInternal: boolean) {
  const refreshed = await db.supportCase.findUnique({ where: { id }, include: caseInclude() });
  if (!refreshed) throw new AppError("NOT_FOUND", "Support case not found", 404);
  return { case: serializeCase(refreshed, includeInternal) };
}

export async function listCustomerSupportCases(userId: string) {
  const rows = await db.supportCase.findMany({ where: { userId }, orderBy: { lastActivityAt: "desc" }, take: 100, include: caseInclude() });
  return { cases: rows.map((row) => serializeCase(row, false)) };
}

export async function getCustomerSupportCase(userId: string, id: string) {
  const row = await db.supportCase.findFirst({ where: { id, userId }, include: caseInclude() });
  if (!row) throw new AppError("NOT_FOUND", "Support case not found", 404);
  return { case: serializeCase(row, false) };
}

export async function addCustomerMessage(userId: string, id: string, input: { body: string; attachmentUrls?: string[] }) {
  const supportCase = await db.supportCase.findFirst({ where: { id, userId } });
  if (!supportCase) throw new AppError("NOT_FOUND", "Support case not found", 404);
  if (["CLOSED"].includes(supportCase.status)) throw new AppError("CONFLICT", "This support case is closed", 409);
  const attachmentUrls = validateAttachmentUrls(input.attachmentUrls);
  await db.$transaction(async (tx) => {
    await tx.supportMessage.create({ data: { caseId: id, authorUserId: userId, kind: "CUSTOMER", body: input.body, attachmentUrls } });
    await tx.supportCase.update({ where: { id }, data: { status: supportCase.status === "RESOLVED" ? "OPEN" : "WAITING_STAFF", resolvedAt: null, closedAt: null, lastActivityAt: new Date() } });
  });
  if (supportCase.category === "FOOD") await runFoodSupportAi(id, { sendSafeReply: true }).catch(() => null);
  return getCustomerSupportCase(userId, id);
}

export async function escalateCustomerCase(userId: string, id: string, reason: string) {
  const result = await db.supportCase.updateMany({ where: { id, userId, status: { in: [...openStatuses, "RESOLVED"] } }, data: { status: "ESCALATED", escalationReason: reason, priority: "HIGH", resolvedAt: null, lastActivityAt: new Date() } });
  if (result.count !== 1) throw new AppError("NOT_FOUND", "Support case not found or cannot be escalated", 404);
  await db.supportMessage.create({ data: { caseId: id, authorUserId: userId, kind: "CUSTOMER", body: `Escalation requested: ${reason}` } });
  return getCustomerSupportCase(userId, id);
}

export async function listAdminSupportCases(input: { status?: string; priority?: string; channel?: string; category?: string; organizationId?: string; q?: string; unassigned?: boolean; limit?: number } = {}) {
  const rows = await db.supportCase.findMany({
    where: {
      ...(input.status ? { status: input.status as any } : {}),
      ...(input.priority ? { priority: input.priority as any } : {}),
      ...(input.channel ? { channel: input.channel } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.unassigned ? { assignedToUserId: null } : {}),
      ...(input.q ? { OR: [{ subject: { contains: input.q, mode: "insensitive" } }, { category: { contains: input.q, mode: "insensitive" } }, { order: { orderNumber: { contains: input.q, mode: "insensitive" } } }, { foodOrder: { orderNumber: { contains: input.q, mode: "insensitive" } } }, { foodRestaurant: { slug: { contains: input.q, mode: "insensitive" } } }, { driveRideId: { contains: input.q, mode: "insensitive" } }, { ledgerTransaction: { reference: { contains: input.q, mode: "insensitive" } } }, { user: { displayName: { contains: input.q, mode: "insensitive" } } }] } : {}),
    },
    orderBy: [{ priority: "desc" }, { lastActivityAt: "desc" }],
    take: Math.min(250, Math.max(1, input.limit ?? 150)),
    include: { ...caseInclude(), user: { select: { id: true, displayName: true, emails: { where: { isPrimary: true }, take: 1 } } } },
  });
  return { cases: rows.map((row) => ({ ...serializeCase(row, true), user: { id: row.user.id, displayName: row.user.displayName, email: row.user.emails[0]?.email ?? null } })) };
}

export async function getAdminSupportCase(id: string) {
  const row = await db.supportCase.findUnique({ where: { id }, include: { ...caseInclude(), user: { select: { id: true, displayName: true, emails: { where: { isPrimary: true }, take: 1 }, phones: { where: { isPrimary: true }, take: 1 } } } } });
  if (!row) throw new AppError("NOT_FOUND", "Support case not found", 404);
  return { case: { ...serializeCase(row, true), user: { id: row.user.id, displayName: row.user.displayName, email: row.user.emails[0]?.email ?? null, phone: row.user.phones[0]?.e164 ?? null } } };
}

export async function updateAdminSupportCase(id: string, actorUserId: string, input: { status?: string; priority?: string; assignedToUserId?: string | null; escalationReason?: string | null }) {
  const existing = await db.supportCase.findUnique({ where: { id } });
  if (!existing) throw new AppError("NOT_FOUND", "Support case not found", 404);
  const unchanged =
    (input.status === undefined || input.status === existing.status) &&
    (input.priority === undefined || input.priority === existing.priority) &&
    (input.assignedToUserId === undefined || input.assignedToUserId === existing.assignedToUserId) &&
    (input.escalationReason === undefined || input.escalationReason === existing.escalationReason);
  if (unchanged) return { ...(await getAdminSupportCase(id)), actionState: "ALREADY_DONE" as const };
  if (input.assignedToUserId) {
    const assignee = await db.user.findFirst({
      where: {
        id: input.assignedToUserId,
        status: "ACTIVE",
        roleAssignments: { some: { scopeKey: "platform", role: { key: { startsWith: "platform.operations." } } } },
      },
      select: { id: true },
    });
    if (!assignee) throw new AppError("BAD_REQUEST", "Support assignee must be an active Operations user", 400);
  }
  const status = input.status ?? existing.status;
  await db.$transaction(async (tx) => {
    await tx.supportCase.update({ where: { id }, data: { status: status as any, priority: input.priority as any, assignedToUserId: input.assignedToUserId, escalationReason: input.escalationReason, lastActivityAt: new Date(), ...(status === "RESOLVED" ? { resolvedAt: new Date(), closedAt: null } : status === "CLOSED" ? { closedAt: new Date() } : { resolvedAt: null, closedAt: null }) } });
    await tx.supportMessage.create({ data: { caseId: id, authorUserId: actorUserId, kind: "SYSTEM", body: `Support case updated: status=${status}${input.priority ? `, priority=${input.priority}` : ""}` } });
  });
  return { ...(await getAdminSupportCase(id)), actionState: "COMPLETED" as const };
}

export async function addStaffSupportMessage(id: string, actorUserId: string, input: { body: string; internal?: boolean; attachmentUrls?: string[] }) {
  const supportCase = await db.supportCase.findUnique({ where: { id } });
  if (!supportCase) throw new AppError("NOT_FOUND", "Support case not found", 404);
  const attachmentUrls = validateAttachmentUrls(input.attachmentUrls);
  await db.$transaction(async (tx) => {
    await tx.supportMessage.create({ data: { caseId: id, authorUserId: actorUserId, kind: input.internal ? "INTERNAL" : "STAFF", body: input.body, attachmentUrls } });
    await tx.supportCase.update({ where: { id }, data: { status: input.internal ? supportCase.status : "WAITING_CUSTOMER", lastActivityAt: new Date() } });
    if (!input.internal) {
      await queueNotificationTx(tx, {
        userId: supportCase.userId,
        category: "SUPPORT",
        title: "Bazaara Support replied",
        body: input.body,
        resourceType: "SupportCase",
        resourceId: id,
        channels: ["PUSH", "EMAIL"],
      });
    }
  });
  return getAdminSupportCase(id);
}


export async function listOrganizationSupportCases(organizationId: string) {
  const rows = await db.supportCase.findMany({
    where: { organizationId },
    orderBy: { lastActivityAt: "desc" },
    take: 150,
    include: caseInclude(),
  });
  return { cases: rows.map((row) => serializeCase(row, false)) };
}

export async function getOrganizationSupportCase(
  organizationId: string,
  id: string,
) {
  const row = await db.supportCase.findFirst({
    where: { id, organizationId },
    include: caseInclude(),
  });
  if (!row) throw new AppError("NOT_FOUND", "Business support case not found", 404);
  return { case: serializeCase(row, false) };
}

export async function addOrganizationSupportMessage(
  organizationId: string,
  userId: string,
  id: string,
  input: { body: string; attachmentUrls?: string[] },
) {
  const supportCase = await db.supportCase.findFirst({
    where: { id, organizationId },
  });
  if (!supportCase) throw new AppError("NOT_FOUND", "Business support case not found", 404);
  if (supportCase.status === "CLOSED") {
    throw new AppError("CONFLICT", "This support case is closed", 409);
  }

  const attachmentUrls = validateAttachmentUrls(input.attachmentUrls);

  await db.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: {
        caseId: id,
        authorUserId: userId,
        kind: "CUSTOMER",
        body: input.body,
        attachmentUrls,
      },
    });

    await tx.supportCase.update({
      where: { id },
      data: {
        status: supportCase.status === "RESOLVED" ? "OPEN" : "WAITING_STAFF",
        resolvedAt: null,
        closedAt: null,
        lastActivityAt: new Date(),
      },
    });
  });

  if (supportCase.category === "FOOD") await runFoodSupportAi(id, { sendSafeReply: true }).catch(() => null);
  return getOrganizationSupportCase(organizationId, id);
}


type FoodSupportAiResult = {
  caseId: string;
  issueType: string;
  route: "FOOD_OPERATIONS" | "GO" | "FOOD_FINANCE" | "RESTAURANT" | "HUMAN_REVIEW";
  confidence: number;
  urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  safeToAutoReply: boolean;
  summary: string;
  suggestedReply: string;
  diagnostics: Record<string, unknown>;
  generatedAt: string;
};

function supportContextObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function ngn(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value / 100);
}

async function enhanceFoodSupportWithConfiguredAi(row: any, deterministic: Omit<FoodSupportAiResult, "caseId" | "generatedAt">) {
  if (!env.FOOD_SUPPORT_AI_WEBHOOK_URL) return deterministic;
  try {
    const context = supportContextObject(row.context);
    const latestRequesterMessage = [...(row.messages ?? [])].reverse().find((message: any) => message.kind === "CUSTOMER")?.body ?? "";
    const response = await fetch(env.FOOD_SUPPORT_AI_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env.FOOD_SUPPORT_AI_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.FOOD_SUPPORT_AI_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        task: "BAZAARA_FOOD_SUPPORT_ASSIST",
        constraints: { consequentialActionsRequireHuman: true, safeToAutoReply: deterministic.safeToAutoReply },
        case: {
          subject: String(row.subject ?? "").slice(0, 500),
          description: String(row.description ?? "").slice(0, 4000),
          latestRequesterMessage: String(latestRequesterMessage).slice(0, 4000),
          foodIssueType: context.foodIssueType ?? null,
          order: deterministic.diagnostics,
        },
        deterministicAnalysis: { issueType: deterministic.issueType, route: deterministic.route, urgency: deterministic.urgency, summary: deterministic.summary, suggestedReply: deterministic.suggestedReply },
      }),
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return deterministic;
    const body = await response.json() as Record<string, unknown>;
    const summary = typeof body.summary === "string" && body.summary.trim() ? body.summary.trim().slice(0, 1200) : deterministic.summary;
    const suggestedReply = typeof body.suggestedReply === "string" && body.suggestedReply.trim() ? body.suggestedReply.trim().slice(0, 2400) : deterministic.suggestedReply;
    return { ...deterministic, summary, suggestedReply, diagnostics: { ...deterministic.diagnostics, aiProvider: "CONFIGURED_WEBHOOK" } };
  } catch {
    return deterministic;
  }
}

function classifyFoodSupport(row: any): Omit<FoodSupportAiResult, "caseId" | "generatedAt"> {
  const context = supportContextObject(row.context);
  const latestRequesterMessage = [...(row.messages ?? [])].reverse().find((message: any) => message.kind === "CUSTOMER")?.body ?? "";
  const raw = `${String(context.foodIssueType ?? "")} ${row.subject ?? ""} ${row.description ?? ""} ${latestRequesterMessage}`.toLowerCase();
  const order = row.foodOrder;
  let issueType = "GENERAL_FOOD";
  let route: FoodSupportAiResult["route"] = "FOOD_OPERATIONS";
  let confidence = 0.74;
  let urgency: FoodSupportAiResult["urgency"] = row.priority === "URGENT" ? "URGENT" : row.priority === "HIGH" ? "HIGH" : "NORMAL";
  let safeToAutoReply = false;

  if (/commission|deduct|deduction|fee rate/.test(raw)) { issueType = "COMMISSION_EXPLANATION"; route = "FOOD_FINANCE"; confidence = 0.96; safeToAutoReply = Boolean(order?.economics); }
  else if (/payout|settlement|merchant net|paid to restaurant/.test(raw)) { issueType = "PAYOUT_EXPLANATION"; route = "FOOD_FINANCE"; confidence = 0.94; safeToAutoReply = Boolean(order?.economics); }
  else if (/courier|rider|driver|pickup|delivery late|late delivery/.test(raw)) { issueType = "GO_DELIVERY"; route = "GO"; confidence = 0.92; safeToAutoReply = Boolean(order); }
  else if (/where|status|track|order late|prepar/.test(raw)) { issueType = "ORDER_STATUS"; route = "FOOD_OPERATIONS"; confidence = 0.91; safeToAutoReply = Boolean(order); }
  else if (/menu|sold out|availability|item/.test(raw)) { issueType = "MENU_AVAILABILITY"; route = "RESTAURANT"; confidence = 0.85; safeToAutoReply = Boolean(row.foodRestaurant || order?.restaurant); }

  if (/refund|chargeback|fraud|unsafe|poison|allerg|food safety|legal|threat|injur/.test(raw)) {
    safeToAutoReply = false;
    route = "HUMAN_REVIEW";
    urgency = /unsafe|poison|allerg|injur/.test(raw) ? "URGENT" : "HIGH";
  }

  const restaurantName = order?.restaurant?.merchant?.organization?.displayName ?? row.foodRestaurant?.merchant?.organization?.displayName ?? "the restaurant";
  const orderLabel = order?.orderNumber ? `Food order ${order.orderNumber}` : "this Food case";
  const latestTracking = order?.trackingEvents?.[0];
  const diagnostics: Record<string, unknown> = {
    foodOrderId: order?.id ?? row.foodOrderId ?? null,
    orderNumber: order?.orderNumber ?? null,
    orderStatus: order?.status ?? null,
    paymentStatus: order?.paymentStatus ?? null,
    fulfillmentType: order?.fulfillmentType ?? null,
    restaurant: restaurantName,
    courierAssigned: Boolean(order?.courierUserId),
    latestTracking: latestTracking ? { status: latestTracking.status, message: latestTracking.message, createdAt: latestTracking.createdAt } : null,
    merchantCommissionBps: order?.economics?.merchantCommissionBps ?? null,
    merchantCommissionMinor: order?.economics?.merchantCommissionMinor ?? null,
    merchantNetMinor: order?.economics?.merchantNetMinor ?? null,
  };

  let suggestedReply = `I’ve linked ${orderLabel} to this Food support case. Bazaara Food Operations will review the restaurant, payment and GO timeline together.`;
  if (issueType === "ORDER_STATUS" && order) {
    suggestedReply = `${orderLabel} is currently ${String(order.status).replaceAll("_", " ").toLowerCase()} and payment is ${String(order.paymentStatus).toLowerCase()}. ${order.courierUserId ? "A GO courier is assigned." : order.status === "READY" && order.fulfillmentType === "DELIVERY" ? "It is ready and awaiting GO assignment." : "The live order timeline is attached to this case."}`;
  } else if (issueType === "GO_DELIVERY" && order) {
    suggestedReply = `${orderLabel}: ${order.courierUserId ? "a GO courier is assigned" : "no GO courier is assigned yet"}. Current order status is ${String(order.status).replaceAll("_", " ").toLowerCase()}${latestTracking?.message ? `; latest update: ${latestTracking.message}` : ""}.`;
  } else if (issueType === "COMMISSION_EXPLANATION" && order?.economics) {
    suggestedReply = `${orderLabel} used a ${(order.economics.merchantCommissionBps / 100).toFixed(2).replace(/\.00$/, "")}% restaurant commission snapshot. Commission on this order is ${ngn(Number(order.economics.merchantCommissionMinor))}; merchant net before later adjustments is ${ngn(Number(order.economics.merchantNetMinor))}. Historical order economics do not change when Operations changes future commission rules.`;
  } else if (issueType === "PAYOUT_EXPLANATION" && order?.economics) {
    suggestedReply = `${orderLabel} has a merchant net snapshot of ${ngn(Number(order.economics.merchantNetMinor))}. The order commission is ${ngn(Number(order.economics.merchantCommissionMinor))} at ${(order.economics.merchantCommissionBps / 100).toFixed(2).replace(/\.00$/, "")}% and the customer service fee is kept separate from restaurant commission.`;
  } else if (issueType === "MENU_AVAILABILITY") {
    suggestedReply = `${restaurantName} is ${row.foodRestaurant?.acceptingOrders === false || order?.restaurant?.acceptingOrders === false ? "currently paused for new orders" : "currently active"}. Menu availability and sold-out state are controlled from Business → Food and update the Food catalogue through the shared backend.`;
  }

  const summary = `${issueType.replaceAll("_", " ")} · ${order ? `${order.orderNumber} / ${order.status}` : restaurantName} · routed to ${route.replaceAll("_", " ")}.`;
  return { issueType, route, confidence, urgency, safeToAutoReply, summary, suggestedReply, diagnostics };
}

export async function runFoodSupportAi(caseId: string, options: { sendSafeReply?: boolean } = {}) {
  const row = await db.supportCase.findUnique({ where: { id: caseId }, include: caseInclude() });
  if (!row) throw new AppError("NOT_FOUND", "Support case not found", 404);
  if (row.category !== "FOOD") throw new AppError("BAD_REQUEST", "Food AI is available only for FOOD support cases", 400);

  const deterministic = classifyFoodSupport(row);
  const enhanced = await enhanceFoodSupportWithConfiguredAi(row, deterministic);
  const analysis: FoodSupportAiResult = { caseId, ...enhanced, generatedAt: new Date().toISOString() };
  const context = supportContextObject(row.context);
  await db.supportCase.update({
    where: { id: caseId },
    data: {
      priority: analysis.urgency,
      context: { ...context, foodAi: analysis } as Prisma.InputJsonValue,
      lastActivityAt: options.sendSafeReply && analysis.safeToAutoReply ? new Date() : row.lastActivityAt,
    },
  });

  let autoReplied = false;
  if (options.sendSafeReply && analysis.safeToAutoReply) {
    const duplicate = await db.supportMessage.findFirst({ where: { caseId, kind: "AI", body: analysis.suggestedReply }, select: { id: true } });
    if (!duplicate) {
      await db.$transaction([
        db.supportMessage.create({ data: { caseId, authorUserId: null, kind: "AI", body: analysis.suggestedReply } }),
        db.supportCase.update({ where: { id: caseId }, data: { status: "WAITING_CUSTOMER", lastActivityAt: new Date() } }),
      ]);
      autoReplied = true;
    }
  }

  return { analysis, autoReplied };
}

export async function getFoodSupportAi(caseId: string) {
  const result = await runFoodSupportAi(caseId, { sendSafeReply: false });
  return result;
}

export async function sendSafeFoodSupportAiReply(caseId: string) {
  const result = await runFoodSupportAi(caseId, { sendSafeReply: true });
  return { ...result, ...(await getAdminSupportCase(caseId)) };
}
