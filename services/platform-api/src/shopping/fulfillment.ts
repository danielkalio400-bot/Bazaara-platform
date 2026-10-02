import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { appendOutboxEvent } from "../outbox.js";
import { queueNotificationTx } from "../notifications/service.js";

const DEFAULT_FULFILLMENT_SLA_HOURS = 24;

function money(value: bigint) {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Money value exceeds safe JSON integer range");
  return n;
}

export function sellerOrderDueAt(from = new Date()) {
  return new Date(from.getTime() + DEFAULT_FULFILLMENT_SLA_HOURS * 60 * 60 * 1000);
}

const sellerOrderInclude = {
  order: true,
  merchant: { include: { organization: true } },
  store: true,
  items: { orderBy: { createdAt: "asc" as const } },
  shipments: { orderBy: { createdAt: "desc" as const }, include: { items: true, events: { orderBy: { occurredAt: "asc" as const } } } },
  cancellationRequests: { orderBy: { createdAt: "desc" as const } },
  returns: { orderBy: { createdAt: "desc" as const }, include: { items: true, evidence: true, events: { orderBy: { createdAt: "asc" as const } }, disputes: { orderBy: { createdAt: "desc" as const } } } },
} satisfies Prisma.ShoppingSellerOrderInclude;

function slaState(order: any) {
  if (!order.fulfillmentDueAt || ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].includes(order.status)) return { dueAt: order.fulfillmentDueAt, overdue: false, remainingMinutes: null };
  const remainingMs = new Date(order.fulfillmentDueAt).getTime() - Date.now();
  return { dueAt: order.fulfillmentDueAt, overdue: remainingMs < 0, remainingMinutes: Math.round(remainingMs / 60000) };
}

function serializeShipment(shipment: any) {
  return {
    id: shipment.id,
    status: shipment.status,
    carrier: shipment.carrier,
    service: shipment.service,
    trackingIdentifier: shipment.trackingIdentifier,
    labelUrl: shipment.labelUrl,
    estimatedDeliveryAt: shipment.estimatedDeliveryAt,
    shippedAt: shipment.shippedAt,
    deliveredAt: shipment.deliveredAt,
    createdAt: shipment.createdAt,
    items: shipment.items.map((item: any) => ({ id: item.id, orderItemId: item.orderItemId, quantity: item.quantity })),
    events: shipment.events.map((event: any) => ({ id: event.id, status: event.status, code: event.code, description: event.description, location: event.location, occurredAt: event.occurredAt })),
  };
}

function serializeSellerOrder(order: any) {
  return {
    id: order.id,
    orderId: order.orderId,
    orderNumber: order.order.orderNumber,
    status: order.status,
    paymentStatus: order.order.paymentStatus,
    currency: order.order.currency,
    subtotalMinor: money(order.subtotalMinor),
    shippingMinor: money(order.shippingMinor),
    totalMinor: money(order.totalMinor),
    placedAt: order.order.placedAt,
    seller: { id: order.merchant.id, slug: order.merchant.slug, name: order.merchant.organization.displayName, organizationId: order.merchant.organizationId },
    store: { id: order.store.id, name: order.store.name, fulfillmentModes: order.store.fulfillmentModes },
    assignedToUserId: order.assignedToUserId,
    sla: slaState(order),
    milestones: {
      confirmedAt: order.confirmedAt,
      pickingStartedAt: order.pickingStartedAt,
      packedAt: order.packedAt,
      readyToShipAt: order.readyToShipAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    },
    items: order.items.map((item: any) => ({ id: item.id, productId: item.productId, variantId: item.variantId, productTitle: item.productTitle, variantTitle: item.variantTitle, sku: item.sku, quantity: item.quantity, unitPriceMinor: money(item.unitPriceMinor), lineTotalMinor: money(item.lineTotalMinor), currency: item.currency })),
    itemCount: order.items.reduce((total: number, item: any) => total + item.quantity, 0),
    shipments: order.shipments.map(serializeShipment),
    cancellationRequests: order.cancellationRequests,
    returns: order.returns.map((returnCase: any) => ({
      id: returnCase.id,
      status: returnCase.status,
      reason: returnCase.reason,
      details: returnCase.details,
      requestedRefundMinor: returnCase.requestedRefundMinor == null ? null : money(returnCase.requestedRefundMinor),
      approvedRefundMinor: returnCase.approvedRefundMinor == null ? null : money(returnCase.approvedRefundMinor),
      requestedAt: returnCase.requestedAt,
      reviewedAt: returnCase.reviewedAt,
      receivedAt: returnCase.receivedAt,
      inspectedAt: returnCase.inspectedAt,
      items: returnCase.items,
      evidence: returnCase.evidence,
      disputes: returnCase.disputes,
    })),
  };
}

async function permissionScopedOrganizations(userId: string, permission: "order.read" | "order.manage") {
  const memberships = await db.organizationMember.findMany({ where: { userId, status: "ACTIVE", organization: { merchants: { some: { vertical: "SHOPPING" } } } }, select: { organizationId: true } });
  if (!memberships.length) return [];
  const ids = memberships.map((row) => row.organizationId);
  const global = await db.userRole.findFirst({ where: { userId, organizationId: null, role: { permissions: { some: { permission: { key: permission } } } } }, select: { id: true } });
  if (global) return ids;
  const scoped = await db.userRole.findMany({ where: { userId, organizationId: { in: ids }, role: { permissions: { some: { permission: { key: permission } } } } }, select: { organizationId: true } });
  return scoped.map((row) => row.organizationId).filter((id): id is string => Boolean(id));
}

export async function listMerchantFulfillment(userId: string, input: { status?: string; merchantId?: string; query?: string } = {}) {
  const organizations = await permissionScopedOrganizations(userId, "order.read");
  if (!organizations.length) return { orders: [], performance: { open: 0, overdue: 0, shippedOnTime: 0, delivered: 0 } };
  const orders = await db.shoppingSellerOrder.findMany({
    where: {
      merchant: { vertical: "SHOPPING", organizationId: { in: organizations }, ...(input.merchantId ? { id: input.merchantId } : {}) },
      ...(input.status ? { status: input.status as any } : {}),
      ...(input.query ? { OR: [{ order: { orderNumber: { contains: input.query, mode: "insensitive" } } }, { items: { some: { OR: [{ productTitle: { contains: input.query, mode: "insensitive" } }, { sku: { contains: input.query, mode: "insensitive" } }] } } }] } : {}),
    },
    include: sellerOrderInclude,
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const now = Date.now();
  const open = orders.filter((order) => !["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].includes(order.status));
  return {
    orders: orders.map(serializeSellerOrder),
    performance: {
      open: open.length,
      overdue: open.filter((order) => order.fulfillmentDueAt && order.fulfillmentDueAt.getTime() < now).length,
      shippedOnTime: orders.filter((order) => order.shippedAt && order.fulfillmentDueAt && order.shippedAt <= order.fulfillmentDueAt).length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
    },
  };
}

export async function sellerOrderOrganizationForUser(userId: string, sellerOrderId: string) {
  const row = await db.shoppingSellerOrder.findFirst({ where: { id: sellerOrderId, merchant: { vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } } }, select: { merchant: { select: { organizationId: true } } } });
  if (!row) throw new AppError("NOT_FOUND", "Seller order not found", 404);
  return row.merchant.organizationId;
}

export async function getMerchantFulfillmentOrder(userId: string, sellerOrderId: string) {
  const organizations = await permissionScopedOrganizations(userId, "order.read");
  const order = await db.shoppingSellerOrder.findFirst({ where: { id: sellerOrderId, merchant: { organizationId: { in: organizations } } }, include: sellerOrderInclude });
  if (!order) throw new AppError("NOT_FOUND", "Seller order not found", 404);
  return { order: serializeSellerOrder(order) };
}

export const fulfillmentTransitions: Record<string, string[]> = {
  PLACED: ["CONFIRMED"],
  CONFIRMED: ["PICKING", "PROCESSING"],
  PICKING: ["PACKED"],
  PROCESSING: ["PACKED"],
  PACKED: ["READY_TO_SHIP"],
  READY_TO_SHIP: [],
  SHIPPED: [],
  OUT_FOR_DELIVERY: [],
};

export function canTransitionFulfillment(current: string, next: string) {
  return (fulfillmentTransitions[current] ?? []).includes(next);
}

function milestoneData(status: string) {
  const now = new Date();
  if (status === "CONFIRMED") return { confirmedAt: now };
  if (status === "PICKING" || status === "PROCESSING") return { pickingStartedAt: now };
  if (status === "PACKED") return { packedAt: now };
  if (status === "READY_TO_SHIP") return { readyToShipAt: now };
  if (status === "SHIPPED") return { shippedAt: now };
  if (status === "DELIVERED") return { deliveredAt: now };
  if (status === "CANCELLED") return { cancelledAt: now };
  return {};
}

async function updateParentOrderStatusTx(tx: Prisma.TransactionClient, orderId: string) {
  const sellerOrders = await tx.shoppingSellerOrder.findMany({ where: { orderId }, select: { status: true } });
  const active = sellerOrders.filter((row) => row.status !== "CANCELLED");
  let status: any = "PLACED";
  if (!active.length && sellerOrders.length) status = "CANCELLED";
  else if (active.length && active.every((row) => row.status === "DELIVERED")) status = "DELIVERED";
  else if (active.length && active.every((row) => ["OUT_FOR_DELIVERY", "DELIVERED"].includes(row.status))) status = "OUT_FOR_DELIVERY";
  else if (active.some((row) => ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(row.status))) status = "SHIPPED";
  else if (active.some((row) => row.status === "READY_TO_SHIP" || row.status === "PACKED")) status = "PACKED";
  else if (active.some((row) => row.status === "PICKING" || row.status === "PROCESSING")) status = "PROCESSING";
  else if (active.length && active.every((row) => row.status === "CONFIRMED")) status = "CONFIRMED";
  const data: any = { status };
  if (status === "DELIVERED") data.deliveredAt = new Date();
  if (status === "CANCELLED") data.cancelledAt = new Date();
  await tx.shoppingOrder.update({ where: { id: orderId }, data });
}

export function deriveSellerOrderShipmentProgress(
  items: Array<{ id: string; quantity: number }>,
  shipments: Array<{ status: string; items: Array<{ orderItemId: string; quantity: number }> }>,
) {
  const active = shipments.filter((shipment) => shipment.status !== "CANCELLED");
  if (!active.length) return null;
  const allocated = new Map<string, number>();
  for (const shipment of active) {
    for (const item of shipment.items) allocated.set(item.orderItemId, (allocated.get(item.orderItemId) ?? 0) + item.quantity);
  }
  if (!items.every((item) => (allocated.get(item.id) ?? 0) >= item.quantity)) return null;

  const shippedStates = new Set(["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "REDELIVERY_SCHEDULED", "RETURN_TO_SENDER", "RETURNED_TO_SENDER"]);
  if (active.every((shipment) => shipment.status === "DELIVERED")) return "DELIVERED" as const;
  if (active.every((shipment) => ["OUT_FOR_DELIVERY", "DELIVERED"].includes(shipment.status))) return "OUT_FOR_DELIVERY" as const;
  if (active.every((shipment) => shippedStates.has(shipment.status))) return "SHIPPED" as const;
  return null;
}

async function syncSellerOrderFromShipmentsTx(tx: Prisma.TransactionClient, sellerOrderId: string, occurredAt = new Date()) {
  const sellerOrder = await tx.shoppingSellerOrder.findUnique({
    where: { id: sellerOrderId },
    include: {
      items: { select: { id: true, quantity: true } },
      shipments: { where: { status: { not: "CANCELLED" } }, include: { items: true } },
    },
  });
  if (!sellerOrder || !sellerOrder.shipments.length) return;
  const progress = deriveSellerOrderShipmentProgress(sellerOrder.items, sellerOrder.shipments);
  if (!progress) return;

  const data: any = { status: progress };
  if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(progress)) data.shippedAt = sellerOrder.shippedAt ?? occurredAt;
  if (progress === "DELIVERED") data.deliveredAt = occurredAt;

  await tx.shoppingSellerOrder.update({ where: { id: sellerOrder.id }, data });
  await updateParentOrderStatusTx(tx, sellerOrder.orderId);
}

export async function assignSellerOrder(userId: string, sellerOrderId: string, assigneeUserId: string | null) {
  const organizationId = await sellerOrderOrganizationForUser(userId, sellerOrderId);
  if (assigneeUserId) {
    const member = await db.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId: assigneeUserId } }, select: { status: true } });
    if (!member || member.status !== "ACTIVE") throw new AppError("BAD_REQUEST", "Assignee must be an active member of this merchant organization", 400);
  }
  await db.shoppingSellerOrder.update({ where: { id: sellerOrderId }, data: { assignedToUserId: assigneeUserId } });
  return getMerchantFulfillmentOrder(userId, sellerOrderId);
}

export async function transitionSellerOrder(userId: string, sellerOrderId: string, status: string) {
  const organizationId = await sellerOrderOrganizationForUser(userId, sellerOrderId);
  const order = await db.shoppingSellerOrder.findFirst({ where: { id: sellerOrderId, merchant: { organizationId } }, include: { shipments: true, order: { select: { paymentMethod: true, paymentStatus: true } } } });
  if (!order) throw new AppError("NOT_FOUND", "Seller order not found", 404);
  if (order.order.paymentMethod !== "PAY_ON_DELIVERY" && order.order.paymentStatus !== "PAID") throw new AppError("CONFLICT", "Online-payment orders cannot enter fulfillment until provider-confirmed payment is captured", 409);
  if (!canTransitionFulfillment(order.status, status)) throw new AppError("CONFLICT", `Cannot move seller order from ${order.status} to ${status}`, 409);
  if (status === "READY_TO_SHIP" && !order.shipments.length) throw new AppError("CONFLICT", "Create a shipment before marking the order ready to ship", 409);
  await db.$transaction(async (tx) => {
    await tx.shoppingSellerOrder.update({ where: { id: order.id }, data: { status: status as any, ...milestoneData(status) } });
    const shipmentSourceStatuses = status === "PACKED" ? ["DRAFT", "LABEL_CREATED"] : status === "READY_TO_SHIP" ? ["DRAFT", "LABEL_CREATED", "PACKED"] : [];
    if (shipmentSourceStatuses.length) {
      const affectedShipments = await tx.shipment.findMany({ where: { sellerOrderId: order.id, status: { in: shipmentSourceStatuses as any } }, select: { id: true } });
      if (affectedShipments.length) {
        await tx.shipment.updateMany({ where: { id: { in: affectedShipments.map((shipment) => shipment.id) } }, data: { status: status as any } });
        await tx.shipmentEvent.createMany({ data: affectedShipments.map((shipment) => ({ shipmentId: shipment.id, status: status as any, description: `Seller fulfillment moved to ${status}`, actorUserId: userId })) });
      }
    }
    await updateParentOrderStatusTx(tx, order.orderId);
    await appendOutboxEvent(tx, { aggregateType: "ShoppingSellerOrder", aggregateId: order.id, eventType: `SellerOrder${status}`, payload: { sellerOrderId: order.id, orderId: order.orderId, organizationId, status } });
  });
  return getMerchantFulfillmentOrder(userId, sellerOrderId);
}

export async function createShipment(userId: string, sellerOrderId: string, input: { carrier?: string; service?: string; trackingIdentifier?: string; labelUrl?: string; estimatedDeliveryAt?: string; items: Array<{ orderItemId: string; quantity: number }> }) {
  const organizationId = await sellerOrderOrganizationForUser(userId, sellerOrderId);
  return db.$transaction(async (tx) => {
    const order = await tx.shoppingSellerOrder.findFirst({ where: { id: sellerOrderId, merchant: { organizationId } }, include: { items: true, order: { select: { paymentMethod: true, paymentStatus: true } }, shipments: { where: { status: { not: "CANCELLED" } }, include: { items: true } } } });
    if (!order) throw new AppError("NOT_FOUND", "Seller order not found", 404);
    if (order.order.paymentMethod !== "PAY_ON_DELIVERY" && order.order.paymentStatus !== "PAID") throw new AppError("CONFLICT", "Online-payment orders cannot create shipments until provider-confirmed payment is captured", 409);
    if (["CANCELLED", "DELIVERED", "REFUNDED"].includes(order.status)) throw new AppError("CONFLICT", "This seller order cannot create a shipment", 409);
    const itemMap = new Map(order.items.map((item) => [item.id, item] as const));
    const allocated = new Map<string, number>();
    for (const shipment of order.shipments) for (const item of shipment.items) allocated.set(item.orderItemId, (allocated.get(item.orderItemId) ?? 0) + item.quantity);
    const seen = new Set<string>();
    for (const requested of input.items) {
      if (seen.has(requested.orderItemId)) throw new AppError("BAD_REQUEST", "Shipment item list contains duplicates", 400);
      seen.add(requested.orderItemId);
      const item = itemMap.get(requested.orderItemId);
      if (!item) throw new AppError("BAD_REQUEST", "Shipment item does not belong to this seller order", 400);
      if (!Number.isInteger(requested.quantity) || requested.quantity < 1) throw new AppError("BAD_REQUEST", "Shipment quantity must be positive", 400);
      if ((allocated.get(item.id) ?? 0) + requested.quantity > item.quantity) throw new AppError("CONFLICT", `Shipment quantity exceeds ordered quantity for ${item.productTitle}`, 409);
    }
    const initialStatus = input.labelUrl ? "LABEL_CREATED" : "DRAFT";
    const shipment = await tx.shipment.create({ data: { sellerOrderId: order.id, status: initialStatus, carrier: input.carrier || null, service: input.service || null, trackingIdentifier: input.trackingIdentifier || null, labelUrl: input.labelUrl || null, estimatedDeliveryAt: input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt) : null, items: { create: input.items }, events: { create: { status: initialStatus, description: "Shipment created", actorUserId: userId } } }, include: { items: true, events: true } });
    await appendOutboxEvent(tx, { aggregateType: "Shipment", aggregateId: shipment.id, eventType: "ShipmentCreated", payload: { shipmentId: shipment.id, sellerOrderId: order.id, orderId: order.orderId, organizationId } });
    return { shipment: serializeShipment(shipment) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

const shipmentTransitions: Record<string, string[]> = {
  DRAFT: ["LABEL_CREATED", "PACKED", "CANCELLED"],
  LABEL_CREATED: ["PACKED", "CANCELLED"],
  PACKED: ["READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED_DELIVERY", "RETURN_TO_SENDER"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED_DELIVERY", "RETURN_TO_SENDER"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED_DELIVERY"],
  FAILED_DELIVERY: ["REDELIVERY_SCHEDULED", "RETURN_TO_SENDER"],
  REDELIVERY_SCHEDULED: ["OUT_FOR_DELIVERY", "RETURN_TO_SENDER"],
  RETURN_TO_SENDER: ["RETURNED_TO_SENDER"],
};

export function canTransitionShipment(current: string, next: string) { return (shipmentTransitions[current] ?? []).includes(next); }

export async function transitionShipment(userId: string, shipmentId: string, status: string, input: { code?: string; description?: string; location?: string; occurredAt?: string } = {}, operations = false) {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    include: { sellerOrder: { include: { order: { select: { userId: true, orderNumber: true } }, merchant: { include: { organization: { include: { members: true } } } } } } },
  });
  if (!shipment) throw new AppError("NOT_FOUND", "Shipment not found", 404);
  if (!operations) {
    const member = shipment.sellerOrder.merchant.organization.members.some((entry) => entry.userId === userId && entry.status === "ACTIVE");
    if (!member) throw new AppError("NOT_FOUND", "Shipment not found", 404);
    if (["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "REDELIVERY_SCHEDULED", "RETURN_TO_SENDER", "RETURNED_TO_SENDER"].includes(status)) throw new AppError("FORBIDDEN", "Carrier/delivery shipment states require Operations or a trusted courier integration", 403);
  }
  if (!canTransitionShipment(shipment.status, status)) throw new AppError("CONFLICT", `Cannot move shipment from ${shipment.status} to ${status}`, 409);
  if (!operations && status === "SHIPPED" && shipment.sellerOrder.status !== "READY_TO_SHIP") {
    throw new AppError("CONFLICT", "Mark the seller order ready to ship before marking its shipment shipped", 409);
  }
  await db.$transaction(async (tx) => {
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    const data: any = { status };
    if (status === "SHIPPED") data.shippedAt = occurredAt;
    if (status === "DELIVERED") data.deliveredAt = occurredAt;
    await tx.shipment.update({ where: { id: shipment.id }, data });
    await tx.shipmentEvent.create({ data: { shipmentId: shipment.id, status: status as any, code: input.code, description: input.description, location: input.location, actorUserId: userId, occurredAt } });
    await syncSellerOrderFromShipmentsTx(tx, shipment.sellerOrderId, occurredAt);
    await appendOutboxEvent(tx, { aggregateType: "Shipment", aggregateId: shipment.id, eventType: `Shipment${status}`, payload: { shipmentId: shipment.id, sellerOrderId: shipment.sellerOrderId, orderId: shipment.sellerOrder.orderId, status } });
    const customerMessages: Record<string, { title: string; body: string }> = {
      SHIPPED: { title: "Order shipped", body: `A shipment for order ${shipment.sellerOrder.order.orderNumber} is on the way.` },
      IN_TRANSIT: { title: "Shipment in transit", body: `Your shipment for order ${shipment.sellerOrder.order.orderNumber} is moving through the delivery network.` },
      OUT_FOR_DELIVERY: { title: "Out for delivery", body: `A shipment for order ${shipment.sellerOrder.order.orderNumber} is out for delivery.` },
      DELIVERED: { title: "Shipment delivered", body: `A shipment for order ${shipment.sellerOrder.order.orderNumber} was marked delivered.` },
      FAILED_DELIVERY: { title: "Delivery attempt unsuccessful", body: `Delivery for order ${shipment.sellerOrder.order.orderNumber} needs attention. Check your order for the latest status.` },
      REDELIVERY_SCHEDULED: { title: "Redelivery scheduled", body: `A new delivery attempt was scheduled for order ${shipment.sellerOrder.order.orderNumber}.` },
      RETURN_TO_SENDER: { title: "Shipment returning to sender", body: `A shipment for order ${shipment.sellerOrder.order.orderNumber} is being returned to the sender.` },
    };
    const customerMessage = customerMessages[status];
    if (customerMessage) {
      await queueNotificationTx(tx, {
        userId: shipment.sellerOrder.order.userId,
        category: "ORDER",
        title: customerMessage.title,
        body: customerMessage.body,
        resourceType: "ShoppingOrder",
        resourceId: shipment.sellerOrder.orderId,
        channels: ["PUSH", "EMAIL"],
      });
    }
  });
  return db.shipment.findUniqueOrThrow({ where: { id: shipment.id }, include: { items: true, events: { orderBy: { occurredAt: "asc" } } } }).then((row) => ({ shipment: serializeShipment(row) }));
}

export async function requestSellerCancellation(userId: string, sellerOrderId: string, input: { reason: string; details?: string }) {
  const organizationId = await sellerOrderOrganizationForUser(userId, sellerOrderId);
  return db.$transaction(async (tx) => {
    const sellerOrder = await tx.shoppingSellerOrder.findFirst({ where: { id: sellerOrderId, merchant: { organizationId } }, include: { order: true } });
    if (!sellerOrder) throw new AppError("NOT_FOUND", "Seller order not found", 404);
    if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"].includes(sellerOrder.status)) throw new AppError("CONFLICT", "This seller order can no longer request pre-shipment cancellation", 409);
    const open = await tx.shoppingCancellationRequest.findFirst({ where: { sellerOrderId, status: "REQUESTED" } });
    if (open) return open;
    const request = await tx.shoppingCancellationRequest.create({ data: { orderId: sellerOrder.orderId, sellerOrderId, reason: input.reason, details: input.details, requestedByUserId: userId } });
    await tx.shoppingSellerOrder.update({ where: { id: sellerOrderId }, data: { status: "CANCELLATION_REQUESTED" } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingCancellationRequest", aggregateId: request.id, eventType: "SellerCancellationRequested", payload: { cancellationRequestId: request.id, orderId: sellerOrder.orderId, sellerOrderId, organizationId } });
    return request;
  });
}


export async function shipmentOrganizationForMerchantUser(userId: string, shipmentId: string) {
  const row = await db.shipment.findFirst({
    where: { id: shipmentId, sellerOrder: { merchant: { vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } } } },
    select: { sellerOrder: { select: { merchant: { select: { organizationId: true } } } } },
  });
  if (!row) throw new AppError("NOT_FOUND", "Shipment not found", 404);
  return row.sellerOrder.merchant.organizationId;
}

export async function merchantOrganizationForUser(userId: string, merchantId: string) {
  const merchant = await db.merchant.findFirst({
    where: { id: merchantId, vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } },
    select: { organizationId: true },
  });
  if (!merchant) throw new AppError("NOT_FOUND", "Merchant not found", 404);
  return merchant.organizationId;
}

export async function merchantOrganizationMembers(userId: string, merchantId: string) {
  const merchant = await db.merchant.findFirst({ where: { id: merchantId, vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } }, select: { organizationId: true } });
  if (!merchant) throw new AppError("NOT_FOUND", "Merchant not found", 404);
  const members = await db.organizationMember.findMany({ where: { organizationId: merchant.organizationId, status: "ACTIVE" }, include: { user: { include: { emails: { where: { isPrimary: true }, take: 1 } } } }, orderBy: { createdAt: "asc" } });
  return { members: members.map((member) => ({ userId: member.userId, title: member.title, displayName: member.user.displayName, email: member.user.emails[0]?.email ?? null })) };
}
