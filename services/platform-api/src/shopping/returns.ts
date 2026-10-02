import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { appendOutboxEvent } from "../outbox.js";
import { queueNotificationTx } from "../notifications/service.js";

const RETURN_WINDOW_DAYS = 14;

const OPEN_RETURN_STATUSES = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "RETURN_LABEL_CREATED",
  "IN_TRANSIT",
  "RECEIVED",
  "INSPECTING",
  "REFUND_PENDING",
  "PARTIALLY_REFUNDED",
  "DISPUTED",
] as const;

export async function reconcileReturnParentStateTx(tx: Prisma.TransactionClient, orderId: string, sellerOrderId?: string | null) {
  if (sellerOrderId) {
    const openSellerReturns = await tx.shoppingReturn.count({
      where: { sellerOrderId, status: { in: [...OPEN_RETURN_STATUSES] } },
    });
    if (openSellerReturns === 0) {
      const seller = await tx.shoppingSellerOrder.findUnique({ where: { id: sellerOrderId }, select: { status: true } });
      if (seller && ["RETURN_REQUESTED", "REFUND_PENDING"].includes(seller.status)) {
        await tx.shoppingSellerOrder.update({ where: { id: sellerOrderId }, data: { status: "DELIVERED" } });
      }
    }
  }

  const openOrderReturns = await tx.shoppingReturn.count({
    where: { orderId, status: { in: [...OPEN_RETURN_STATUSES] } },
  });
  if (openOrderReturns === 0) {
    const order = await tx.shoppingOrder.findUnique({ where: { id: orderId }, select: { status: true } });
    if (order && ["RETURN_REQUESTED", "REFUND_PENDING", "DISPUTED"].includes(order.status)) {
      await tx.shoppingOrder.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
    }
  }
}

function money(value: bigint | null | undefined) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Money value exceeds safe JSON integer range");
  return n;
}

export function returnEligibilityDeadline(deliveredAt: Date) {
  return new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export async function createReturnRequest(userId: string, orderId: string, input: {
  reason: string;
  details?: string;
  items: Array<{ orderItemId: string; quantity: number }>;
  evidence?: Array<{ type: string; url: string; note?: string }>;
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.shoppingOrder.findFirst({ where: { id: orderId, userId }, include: { sellerOrders: { include: { items: true } } } });
    if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
    if (order.status !== "DELIVERED" || !order.deliveredAt) throw new AppError("CONFLICT", "Returns can be requested only after delivery", 409);
    const deadline = returnEligibilityDeadline(order.deliveredAt);
    if (deadline < new Date()) throw new AppError("CONFLICT", "The return eligibility window has closed", 409);

    const all = order.sellerOrders.flatMap((sellerOrder) => sellerOrder.items.map((item) => ({ item, sellerOrder })));
    const map = new Map(all.map((row) => [row.item.id, row] as const));
    const selectedSellerOrders = new Set<string>();
    let requestedRefundMinor = 0n;
    for (const selected of input.items) {
      const row = map.get(selected.orderItemId);
      if (!row) throw new AppError("BAD_REQUEST", "A selected return item does not belong to this order", 400);
      if (!Number.isInteger(selected.quantity) || selected.quantity < 1 || selected.quantity > row.item.quantity) throw new AppError("BAD_REQUEST", `Return quantity for ${row.item.productTitle} is invalid`, 400);
      selectedSellerOrders.add(row.sellerOrder.id);
      requestedRefundMinor += row.item.unitPriceMinor * BigInt(selected.quantity);
      const already = await tx.shoppingReturnItem.aggregate({ where: { orderItemId: row.item.id, returnCase: { status: { notIn: ["REJECTED", "CANCELLED", "CLOSED"] } } }, _sum: { quantity: true } });
      if ((already._sum.quantity ?? 0) + selected.quantity > row.item.quantity) throw new AppError("CONFLICT", `Return quantity for ${row.item.productTitle} exceeds the remaining eligible quantity`, 409);
    }
    if (selectedSellerOrders.size !== 1) throw new AppError("BAD_REQUEST", "Create separate return requests for items sold by different sellers", 400);
    const sellerOrderId = [...selectedSellerOrders][0]!;
    const sellerOrder = order.sellerOrders.find((row) => row.id === sellerOrderId)!;
    const returnCase = await tx.shoppingReturn.create({
      data: {
        orderId: order.id,
        sellerOrderId,
        merchantId: sellerOrder.merchantId,
        status: "REQUESTED",
        reason: input.reason,
        details: input.details,
        eligibilityExpiresAt: deadline,
        requestedRefundMinor,
        items: { create: input.items.map((item) => ({ orderItemId: item.orderItemId, quantity: item.quantity })) },
        evidence: input.evidence?.length ? { create: input.evidence.map((row) => ({ type: row.type, url: row.url, note: row.note })) } : undefined,
        events: { create: { type: "REQUESTED", toStatus: "REQUESTED", actorUserId: userId } },
      },
      include: { items: true, evidence: true, events: true, disputes: true },
    });
    await tx.shoppingOrder.update({ where: { id: order.id }, data: { status: "RETURN_REQUESTED" } });
    await tx.shoppingSellerOrder.update({ where: { id: sellerOrderId }, data: { status: "RETURN_REQUESTED" } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingReturn", aggregateId: returnCase.id, eventType: "ReturnRequested", payload: { returnId: returnCase.id, orderId: order.id, sellerOrderId, merchantId: sellerOrder.merchantId, userId, requestedRefundMinor: String(requestedRefundMinor) } });
    await queueNotificationTx(tx, { userId, category: "RETURN", title: "Return request received", body: `Your return request for order ${order.orderNumber} is awaiting merchant review.`, resourceType: "ShoppingOrder", resourceId: order.id, channels: ["PUSH", "EMAIL"] });
    return serializeReturn(returnCase);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export function serializeReturn(row: any) {
  return {
    id: row.id,
    orderId: row.orderId,
    sellerOrderId: row.sellerOrderId,
    merchantId: row.merchantId,
    status: row.status,
    reason: row.reason,
    details: row.details,
    eligibilityExpiresAt: row.eligibilityExpiresAt,
    reviewNotes: row.reviewNotes,
    returnCarrier: row.returnCarrier,
    returnService: row.returnService,
    returnTrackingId: row.returnTrackingId,
    requestedRefundMinor: money(row.requestedRefundMinor),
    approvedRefundMinor: money(row.approvedRefundMinor),
    requestedAt: row.requestedAt,
    reviewedAt: row.reviewedAt,
    receivedAt: row.receivedAt,
    inspectedAt: row.inspectedAt,
    resolvedAt: row.resolvedAt,
    items: row.items ?? [],
    evidence: row.evidence ?? [],
    events: row.events ?? [],
    disputes: row.disputes ?? [],
    paymentRefunds: (row.paymentRefunds ?? []).map((refund: any) => ({ ...refund, amountMinor: money(refund.amountMinor) })),
  };
}

export async function listMerchantReturns(userId: string, merchantId?: string) {
  const memberships = await db.organizationMember.findMany({ where: { userId, status: "ACTIVE", organization: { merchants: { some: { vertical: "SHOPPING", ...(merchantId ? { id: merchantId } : {}) } } } }, select: { organizationId: true } });
  const organizationIds = memberships.map((row) => row.organizationId);
  if (!organizationIds.length) return { returns: [] };
  const permitted = await db.userRole.findMany({ where: { userId, OR: [{ organizationId: null }, { organizationId: { in: organizationIds } }], role: { permissions: { some: { permission: { key: "order.read" } } } } }, select: { organizationId: true } });
  const global = permitted.some((row) => row.organizationId == null);
  const allowed = global ? organizationIds : permitted.map((row) => row.organizationId).filter((id): id is string => Boolean(id));
  if (!allowed.length) return { returns: [] };
  const rows = await db.shoppingReturn.findMany({ where: { merchant: { organizationId: { in: allowed }, ...(merchantId ? { id: merchantId } : {}) } }, include: { items: { include: { orderItem: true } }, evidence: true, events: { orderBy: { createdAt: "asc" } }, disputes: { orderBy: { createdAt: "desc" } }, order: { select: { orderNumber: true, currency: true, paymentStatus: true } }, paymentRefunds: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return { returns: rows.map((row) => ({ ...serializeReturn(row), order: row.order })) };
}

export async function returnOrganizationForMerchantUser(userId: string, returnId: string) {
  const row = await db.shoppingReturn.findFirst({ where: { id: returnId, merchant: { organization: { members: { some: { userId, status: "ACTIVE" } } } } }, select: { merchant: { select: { organizationId: true } } } });
  if (!row?.merchant) throw new AppError("NOT_FOUND", "Return case not found", 404);
  return row.merchant.organizationId;
}

export async function reviewMerchantReturn(userId: string, returnId: string, input: { decision: "APPROVE" | "REJECT"; notes?: string; approvedRefundMinor?: number; returnCarrier?: string; returnService?: string; returnTrackingId?: string }) {
  await returnOrganizationForMerchantUser(userId, returnId);
  return db.$transaction(async (tx) => {
    const row = await tx.shoppingReturn.findUnique({ where: { id: returnId }, include: { items: true, order: { select: { userId: true, orderNumber: true } } } });
    if (!row) throw new AppError("NOT_FOUND", "Return case not found", 404);
    if (!["REQUESTED", "UNDER_REVIEW"].includes(row.status)) throw new AppError("CONFLICT", "This return has already been reviewed", 409);
    const now = new Date();
    if (input.decision === "REJECT") {
      await tx.shoppingReturnEvent.create({ data: { returnId: row.id, type: "REJECTED", fromStatus: row.status, toStatus: "REJECTED", actorUserId: userId, note: input.notes } });
      const updated = await tx.shoppingReturn.update({ where: { id: row.id }, data: { status: "REJECTED", reviewedAt: now, reviewedByUserId: userId, reviewNotes: input.notes, resolvedAt: now }, include: { items: true, evidence: true, events: { orderBy: { createdAt: "asc" } }, disputes: true } });
      await reconcileReturnParentStateTx(tx, row.orderId, row.sellerOrderId);
      await appendOutboxEvent(tx, { aggregateType: "ShoppingReturn", aggregateId: row.id, eventType: "ReturnRejected", payload: { returnId: row.id, orderId: row.orderId } });
      await queueNotificationTx(tx, { userId: row.order.userId, category: "RETURN", title: "Return request reviewed", body: `The return request for order ${row.order.orderNumber} was not approved. Open your order for review or dispute options.`, resourceType: "ShoppingOrder", resourceId: row.orderId, channels: ["PUSH", "EMAIL"] });
      return serializeReturn(updated);
    }
    const max = row.requestedRefundMinor ?? 0n;
    const approved = input.approvedRefundMinor == null ? max : BigInt(input.approvedRefundMinor);
    if (approved < 0n || approved > max) throw new AppError("BAD_REQUEST", "Approved refund amount exceeds the requested return value", 400);
    const nextStatus = input.returnTrackingId || input.returnCarrier ? "RETURN_LABEL_CREATED" : "APPROVED";
    await tx.shoppingReturnEvent.create({ data: { returnId: row.id, type: "APPROVED", fromStatus: row.status, toStatus: nextStatus as any, actorUserId: userId, note: input.notes, metadata: { approvedRefundMinor: String(approved) } } });
    const updated = await tx.shoppingReturn.update({ where: { id: row.id }, data: { status: nextStatus as any, reviewedAt: now, reviewedByUserId: userId, reviewNotes: input.notes, approvedRefundMinor: approved, returnCarrier: input.returnCarrier, returnService: input.returnService, returnTrackingId: input.returnTrackingId }, include: { items: true, evidence: true, events: { orderBy: { createdAt: "asc" } }, disputes: true } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingReturn", aggregateId: row.id, eventType: "ReturnApproved", payload: { returnId: row.id, orderId: row.orderId, approvedRefundMinor: String(approved) } });
    await queueNotificationTx(tx, { userId: row.order.userId, category: "RETURN", title: "Return approved", body: `Your return for order ${row.order.orderNumber} was approved. Follow the return instructions in your order.`, resourceType: "ShoppingOrder", resourceId: row.orderId, channels: ["PUSH", "EMAIL"] });
    return serializeReturn(updated);
  });
}

const returnTransitions: Record<string, string[]> = {
  APPROVED: ["RETURN_LABEL_CREATED", "IN_TRANSIT", "RECEIVED"],
  RETURN_LABEL_CREATED: ["IN_TRANSIT", "RECEIVED"],
  IN_TRANSIT: ["RECEIVED"],
  RECEIVED: ["INSPECTING"],
  INSPECTING: ["REFUND_PENDING", "REJECTED"],
};

export async function transitionMerchantReturn(userId: string, returnId: string, status: string, note?: string) {
  await returnOrganizationForMerchantUser(userId, returnId);
  const row = await db.shoppingReturn.findUnique({ where: { id: returnId }, include: { items: true, sellerOrder: true, order: { select: { userId: true, orderNumber: true } } } });
  if (!row) throw new AppError("NOT_FOUND", "Return case not found", 404);
  if (!(returnTransitions[row.status] ?? []).includes(status)) throw new AppError("CONFLICT", `Cannot move return from ${row.status} to ${status}`, 409);
  if (status === "REFUND_PENDING" && row.approvedRefundMinor == null) throw new AppError("CONFLICT", "Inspect the return and approve a refund amount first", 409);
  const now = new Date();
  const data: any = { status };
  if (status === "RECEIVED") data.receivedAt = now;
  if (status === "INSPECTING") data.inspectedAt = now;
  const updated = await db.$transaction(async (tx) => {
    await tx.shoppingReturnEvent.create({ data: { returnId: row.id, type: status, fromStatus: row.status, toStatus: status as any, actorUserId: userId, note } });
    const saved = await tx.shoppingReturn.update({ where: { id: row.id }, data, include: { items: true, evidence: true, events: { orderBy: { createdAt: "asc" } }, disputes: true } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingReturn", aggregateId: row.id, eventType: `Return${status}`, payload: { returnId: row.id, orderId: row.orderId, status } });
    if (["RECEIVED", "REFUND_PENDING"].includes(status)) {
      await queueNotificationTx(tx, {
        userId: row.order.userId, category: "RETURN",
        title: status === "RECEIVED" ? "Return received" : "Refund review in progress",
        body: status === "RECEIVED" ? `Your returned items for order ${row.order.orderNumber} were received.` : `Your return for order ${row.order.orderNumber} is ready for refund processing.`,
        resourceType: "ShoppingOrder", resourceId: row.orderId, channels: ["PUSH", "EMAIL"],
      });
    }
    return saved;
  });
  return serializeReturn(updated);
}

export async function inspectMerchantReturn(userId: string, returnId: string, input: { approvedRefundMinor: number; items: Array<{ returnItemId: string; inspectedQuantity: number; outcome: string; conditionNotes?: string; restockApproved: boolean; refundableAmountMinor?: number }> }) {
  await returnOrganizationForMerchantUser(userId, returnId);
  return db.$transaction(async (tx) => {
    const row = await tx.shoppingReturn.findUnique({ where: { id: returnId }, include: { items: { include: { orderItem: true } }, sellerOrder: true, order: { select: { userId: true, orderNumber: true } } } });
    if (!row || !row.sellerOrder) throw new AppError("NOT_FOUND", "Return case not found", 404);
    if (!["RECEIVED", "INSPECTING"].includes(row.status)) throw new AppError("CONFLICT", "Return must be received before inspection", 409);
    const approved = BigInt(input.approvedRefundMinor);
    if (approved < 0n || (row.requestedRefundMinor != null && approved > row.requestedRefundMinor)) throw new AppError("BAD_REQUEST", "Approved refund amount is invalid", 400);
    const itemMap = new Map(row.items.map((item) => [item.id, item] as const));
    for (const inspected of input.items) {
      const item = itemMap.get(inspected.returnItemId);
      if (!item) throw new AppError("BAD_REQUEST", "Inspection item does not belong to this return", 400);
      if (!Number.isInteger(inspected.inspectedQuantity) || inspected.inspectedQuantity < 0 || inspected.inspectedQuantity > item.quantity) throw new AppError("BAD_REQUEST", "Inspected quantity is invalid", 400);
      if (inspected.restockApproved && item.restockApproved !== true && inspected.inspectedQuantity > 0) {
        await tx.inventoryItem.update({ where: { storeId_variantId: { storeId: row.sellerOrder.storeId, variantId: item.orderItem.variantId } }, data: { quantityOnHand: { increment: inspected.inspectedQuantity } } });
      }
      await tx.shoppingReturnItem.update({ where: { id: item.id }, data: { inspectedQuantity: inspected.inspectedQuantity, inspectionOutcome: inspected.outcome, conditionNotes: inspected.conditionNotes, restockApproved: inspected.restockApproved, refundableAmountMinor: inspected.refundableAmountMinor == null ? null : BigInt(inspected.refundableAmountMinor) } });
    }
    await tx.shoppingReturnEvent.create({ data: { returnId: row.id, type: "INSPECTION_COMPLETED", fromStatus: row.status, toStatus: "REFUND_PENDING", actorUserId: userId, metadata: { approvedRefundMinor: String(approved) } } });
    const saved = await tx.shoppingReturn.update({ where: { id: row.id }, data: { status: "REFUND_PENDING", inspectedAt: new Date(), approvedRefundMinor: approved }, include: { items: true, evidence: true, events: { orderBy: { createdAt: "asc" } }, disputes: true } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingReturn", aggregateId: row.id, eventType: "ReturnInspectionCompleted", payload: { returnId: row.id, orderId: row.orderId, approvedRefundMinor: String(approved) } });
    await queueNotificationTx(tx, { userId: row.order.userId, category: "RETURN", title: "Return inspection complete", body: `Inspection for order ${row.order.orderNumber} is complete and the approved refund is queued for processing.`, resourceType: "ShoppingOrder", resourceId: row.orderId, channels: ["PUSH", "EMAIL"] });
    return serializeReturn(saved);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function openReturnDispute(userId: string, returnId: string, input: { reason: string; details?: string }) {
  const returnCase = await db.shoppingReturn.findFirst({ where: { id: returnId, order: { userId } } });
  if (!returnCase) throw new AppError("NOT_FOUND", "Return case not found", 404);
  if (!["REJECTED", "PARTIALLY_REFUNDED", "REFUND_PENDING", "REFUNDED"].includes(returnCase.status)) throw new AppError("CONFLICT", "This return is not eligible for dispute escalation", 409);
  return db.$transaction(async (tx) => {
    const existing = await tx.shoppingReturnDispute.findFirst({ where: { returnId, status: { in: ["OPEN", "UNDER_REVIEW"] } } });
    if (existing) return existing;
    const dispute = await tx.shoppingReturnDispute.create({ data: { returnId, reason: input.reason, details: input.details, openedByUserId: userId } });
    await tx.shoppingReturn.update({ where: { id: returnId }, data: { status: "DISPUTED" } });
    await tx.shoppingReturnEvent.create({ data: { returnId, type: "DISPUTE_OPENED", fromStatus: returnCase.status, toStatus: "DISPUTED", actorUserId: userId, metadata: { disputeId: dispute.id } } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingReturnDispute", aggregateId: dispute.id, eventType: "ReturnDisputeOpened", payload: { disputeId: dispute.id, returnId, orderId: returnCase.orderId } });
    return dispute;
  });
}

export async function listOperationalReturns(input: { status?: string } = {}) {
  const rows = await db.shoppingReturn.findMany({ where: input.status ? { status: input.status as any } : {}, include: { order: { select: { orderNumber: true, paymentStatus: true, currency: true, paymentIntent: { select: { id: true, status: true, capturedMinor: true, refundedMinor: true } } } }, merchant: { include: { organization: true } }, sellerOrder: true, items: { include: { orderItem: true } }, evidence: true, events: { orderBy: { createdAt: "asc" } }, disputes: { orderBy: { createdAt: "desc" } }, paymentRefunds: true }, orderBy: { createdAt: "desc" }, take: 300 });
  return { returns: rows.map((row) => ({ ...serializeReturn(row), order: { ...row.order, paymentIntent: row.order.paymentIntent ? { ...row.order.paymentIntent, capturedMinor: money(row.order.paymentIntent.capturedMinor), refundedMinor: money(row.order.paymentIntent.refundedMinor) } : null }, merchant: row.merchant ? { id: row.merchant.id, name: row.merchant.organization.displayName } : null })) };
}

export async function resolveReturnDispute(actorUserId: string, disputeId: string, input: { resolution: "CUSTOMER" | "MERCHANT"; notes: string }) {
  return db.$transaction(async (tx) => {
    const dispute = await tx.shoppingReturnDispute.findUnique({ where: { id: disputeId }, include: { returnCase: { include: { order: { select: { userId: true, orderNumber: true } } } } } });
    if (!dispute) throw new AppError("NOT_FOUND", "Return dispute not found", 404);
    if (["RESOLVED_CUSTOMER", "RESOLVED_MERCHANT", "CLOSED"].includes(dispute.status)) throw new AppError("CONFLICT", "Dispute is already resolved", 409);
    const status = input.resolution === "CUSTOMER" ? "RESOLVED_CUSTOMER" : "RESOLVED_MERCHANT";
    const saved = await tx.shoppingReturnDispute.update({ where: { id: dispute.id }, data: { status, resolution: input.notes, resolvedByUserId: actorUserId, resolvedAt: new Date() } });
    await tx.shoppingReturnEvent.create({ data: { returnId: dispute.returnId, type: "DISPUTE_RESOLVED", actorUserId, note: input.notes, metadata: { disputeId: dispute.id, resolution: input.resolution } } });
    if (input.resolution === "MERCHANT" && dispute.returnCase.status === "DISPUTED") {
      await tx.shoppingReturn.update({ where: { id: dispute.returnId }, data: { status: "CLOSED", resolvedAt: new Date() } });
      await reconcileReturnParentStateTx(tx, dispute.returnCase.orderId, dispute.returnCase.sellerOrderId);
    } else if (input.resolution === "CUSTOMER" && dispute.returnCase.status === "DISPUTED") {
      await tx.shoppingReturn.update({ where: { id: dispute.returnId }, data: { status: "REFUND_PENDING" } });
      if (dispute.returnCase.sellerOrderId) await tx.shoppingSellerOrder.update({ where: { id: dispute.returnCase.sellerOrderId }, data: { status: "REFUND_PENDING" } });
      await tx.shoppingOrder.updateMany({ where: { id: dispute.returnCase.orderId, status: { not: "REFUNDED" } }, data: { status: "REFUND_PENDING" } });
    }
    await appendOutboxEvent(tx, { aggregateType: "ShoppingReturnDispute", aggregateId: dispute.id, eventType: "ReturnDisputeResolved", payload: { disputeId: dispute.id, returnId: dispute.returnId, resolution: input.resolution } });
    await queueNotificationTx(tx, { userId: dispute.returnCase.order.userId, category: "RETURN", title: "Return dispute resolved", body: `The return dispute for order ${dispute.returnCase.order.orderNumber} was resolved. Open the order for the recorded outcome.`, resourceType: "ShoppingOrder", resourceId: dispute.returnCase.orderId, channels: ["PUSH", "EMAIL"] });
    return saved;
  });
}
