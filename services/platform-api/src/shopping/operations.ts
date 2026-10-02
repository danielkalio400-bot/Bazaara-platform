import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { appendOutboxEvent } from "../outbox.js";
import { serializePaymentIntent } from "../payments/orchestration.js";

function money(value: bigint | null | undefined) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Money value exceeds safe JSON integer range");
  return n;
}

export async function searchOperationalOrders(input: { q?: string; status?: string; paymentStatus?: string; merchantId?: string; limit?: number }) {
  const take = Math.min(300, Math.max(1, input.limit ?? 100));
  const orders = await db.shoppingOrder.findMany({
    where: {
      ...(input.status ? { status: input.status as any } : {}),
      ...(input.paymentStatus ? { paymentStatus: input.paymentStatus as any } : {}),
      ...(input.merchantId ? { sellerOrders: { some: { merchantId: input.merchantId } } } : {}),
      ...(input.q ? {
        OR: [
          { orderNumber: { contains: input.q, mode: "insensitive" } },
          { user: { displayName: { contains: input.q, mode: "insensitive" } } },
          { user: { emails: { some: { email: { contains: input.q, mode: "insensitive" } } } } },
          { sellerOrders: { some: { merchant: { organization: { displayName: { contains: input.q, mode: "insensitive" } } } } } },
        ],
      } : {}),
    },
    include: {
      user: { include: { emails: { where: { isPrimary: true }, take: 1 } } },
      sellerOrders: { include: { merchant: { include: { organization: true } }, store: true, shipments: true, returns: true, items: true } },
      paymentIntent: true,
      cancellationRequests: { where: { status: "REQUESTED" } },
      returns: { where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "REFUND_PENDING", "DISPUTED"] } } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  return {
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      totalMinor: money(order.totalMinor),
      placedAt: order.placedAt,
      customer: { id: order.userId, displayName: order.user.displayName, email: order.user.emails[0]?.email ?? null },
      sellers: order.sellerOrders.map((seller) => ({ id: seller.id, status: seller.status, merchantId: seller.merchantId, seller: seller.merchant.organization.displayName, store: seller.store.name, itemCount: seller.items.reduce((n, item) => n + item.quantity, 0), shipmentCount: seller.shipments.length, returnCount: seller.returns.length, fulfillmentDueAt: seller.fulfillmentDueAt })),
      paymentIntent: order.paymentIntent ? { id: order.paymentIntent.id, status: order.paymentIntent.status, provider: order.paymentIntent.provider, capturedMinor: money(order.paymentIntent.capturedMinor), refundedMinor: money(order.paymentIntent.refundedMinor) } : null,
      openCancellationRequests: order.cancellationRequests.length,
      openReturns: order.returns.length,
    })),
  };
}

function deriveRiskSignals(context: any) {
  const signals: Array<{ code: string; severity: "LOW" | "MEDIUM" | "HIGH"; label: string; evidence: Record<string, unknown> }> = [];
  const amount = Number(context.totalMinor);
  if (amount >= 50000000) signals.push({ code: "HIGH_ORDER_VALUE", severity: "MEDIUM", label: "High order value", evidence: { totalMinor: amount } });
  const failures = context.paymentIntent?.failures?.length ?? 0;
  if (failures >= 2) signals.push({ code: "REPEATED_PAYMENT_FAILURE", severity: failures >= 4 ? "HIGH" : "MEDIUM", label: "Repeated payment failures", evidence: { failures } });
  const disputes = context.returns?.flatMap((row: any) => row.disputes ?? []).filter((row: any) => ["OPEN", "UNDER_REVIEW"].includes(row.status)).length ?? 0;
  if (disputes) signals.push({ code: "OPEN_RETURN_DISPUTE", severity: "MEDIUM", label: "Open return dispute", evidence: { disputes } });
  const overdue = context.sellerOrders?.filter((row: any) => row.fulfillmentDueAt && new Date(row.fulfillmentDueAt).getTime() < Date.now() && !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(row.status)).length ?? 0;
  if (overdue) signals.push({ code: "FULFILLMENT_SLA_BREACH", severity: overdue > 1 ? "HIGH" : "MEDIUM", label: "Fulfillment SLA breached", evidence: { overdueSellerOrders: overdue } });
  if (!signals.length) signals.push({ code: "NO_ELEVATED_SIGNAL", severity: "LOW", label: "No elevated derived risk signal", evidence: {} });
  return signals;
}

export async function getOperationalOrderContext(orderId: string) {
  const order = await db.shoppingOrder.findUnique({
    where: { id: orderId },
    include: {
      user: { include: { emails: { where: { isPrimary: true }, take: 1 }, phones: { where: { isPrimary: true }, take: 1 } } },
      payment: true,
      paymentIntent: { include: { attempts: { orderBy: { attemptNumber: "asc" } }, authorizations: true, captures: true, refunds: { orderBy: { createdAt: "desc" } }, failures: { orderBy: { createdAt: "desc" } }, reconciliations: { orderBy: { observedAt: "desc" } } } },
      sellerOrders: { include: { merchant: { include: { organization: true } }, store: true, items: true, shipments: { include: { items: true, events: { orderBy: { occurredAt: "asc" } } }, orderBy: { createdAt: "desc" } }, cancellationRequests: { orderBy: { createdAt: "desc" } } } },
      returns: { include: { merchant: { include: { organization: true } }, items: { include: { orderItem: true } }, evidence: true, events: { orderBy: { createdAt: "asc" } }, disputes: { orderBy: { createdAt: "desc" } }, paymentRefunds: true }, orderBy: { createdAt: "desc" } },
      cancellationRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  const variantIds = order.sellerOrders.flatMap((seller) => seller.items.map((item) => item.variantId));
  const inventory = await db.inventoryItem.findMany({ where: { variantId: { in: variantIds } }, include: { store: { include: { merchant: { include: { organization: true } } } }, variant: { include: { product: true } } } });
  const [auditLogs, outbox] = await Promise.all([
    db.auditLog.findMany({ where: { OR: [{ resourceId: order.id }, { resourceId: { in: order.sellerOrders.map((row) => row.id) } }, { resourceId: { in: order.returns.map((row) => row.id) } }] }, orderBy: { createdAt: "asc" }, take: 500 }),
    db.outboxEvent.findMany({ where: { OR: [{ aggregateId: order.id }, { aggregateId: { in: order.sellerOrders.map((row) => row.id) } }, { aggregateId: { in: order.returns.map((row) => row.id) } }, { aggregateId: { in: order.sellerOrders.flatMap((row) => row.shipments.map((shipment) => shipment.id)) } }] }, orderBy: { createdAt: "asc" }, take: 500 }),
  ]);
  const timeline = [
    ...auditLogs.map((row) => ({ source: "AUDIT", type: row.action, at: row.createdAt, actorUserId: row.actorUserId, resourceType: row.resourceType, resourceId: row.resourceId, metadata: row.metadata })),
    ...outbox.map((row) => ({ source: "EVENT", type: row.eventType, at: row.createdAt, actorUserId: null, resourceType: row.aggregateType, resourceId: row.aggregateId, metadata: row.payload })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const contextForRisk = { ...order, totalMinor: order.totalMinor, paymentIntent: order.paymentIntent, sellerOrders: order.sellerOrders, returns: order.returns };
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      subtotalMinor: money(order.subtotalMinor),
      shippingMinor: money(order.shippingMinor),
      taxMinor: money(order.taxMinor),
      discountMinor: money(order.discountMinor),
      totalMinor: money(order.totalMinor),
      shippingAddress: order.shippingAddress,
      placedAt: order.placedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      customer: { id: order.userId, displayName: order.user.displayName, email: order.user.emails[0]?.email ?? null, phone: order.user.phones[0]?.e164 ?? null },
      sellers: order.sellerOrders.map((seller) => ({ ...seller, subtotalMinor: money(seller.subtotalMinor), shippingMinor: money(seller.shippingMinor), totalMinor: money(seller.totalMinor), merchant: { id: seller.merchant.id, name: seller.merchant.organization.displayName, organizationId: seller.merchant.organizationId }, items: seller.items.map((item) => ({ ...item, unitPriceMinor: money(item.unitPriceMinor), lineTotalMinor: money(item.lineTotalMinor) })) })),
      returns: order.returns.map((row) => ({ ...row, requestedRefundMinor: money(row.requestedRefundMinor), approvedRefundMinor: money(row.approvedRefundMinor), paymentRefunds: row.paymentRefunds.map((refund) => ({ ...refund, amountMinor: money(refund.amountMinor) })) })),
      cancellationRequests: order.cancellationRequests,
      paymentIntent: order.paymentIntent ? serializePaymentIntent(order.paymentIntent) : null,
    },
    inventory: inventory.map((row) => ({ id: row.id, variantId: row.variantId, sku: row.variant.sku, product: row.variant.product.title, storeId: row.storeId, store: row.store.name, seller: row.store.merchant.organization.displayName, quantityOnHand: row.quantityOnHand, quantityReserved: row.quantityReserved, availableQuantity: Math.max(0, row.quantityOnHand - row.quantityReserved) })),
    riskSignals: deriveRiskSignals(contextForRisk),
    timeline,
  };
}

export async function resolveCancellationRequest(actorUserId: string, requestId: string, input: { decision: "APPROVE" | "REJECT"; notes?: string }) {
  return db.$transaction(async (tx) => {
    const request = await tx.shoppingCancellationRequest.findUnique({
      where: { id: requestId },
      include: { order: { include: { paymentIntent: true, sellerOrders: true } }, sellerOrder: { include: { items: true } } },
    });
    if (!request) throw new AppError("NOT_FOUND", "Cancellation request not found", 404);
    if (request.status !== "REQUESTED") throw new AppError("CONFLICT", "Cancellation request is already resolved", 409);

    if (input.decision === "REJECT") {
      if (request.sellerOrderId && request.sellerOrder) {
        const priorStatus = request.sellerOrder.readyToShipAt
          ? "READY_TO_SHIP"
          : request.sellerOrder.packedAt
            ? "PACKED"
            : request.sellerOrder.pickingStartedAt
              ? "PICKING"
              : request.sellerOrder.confirmedAt
                ? "CONFIRMED"
                : "PLACED";
        await tx.shoppingSellerOrder.update({ where: { id: request.sellerOrderId }, data: { status: priorStatus as any } });
      }
      const rejected = await tx.shoppingCancellationRequest.update({ where: { id: request.id }, data: { status: "REJECTED", resolvedByUserId: actorUserId, resolutionNotes: input.notes, resolvedAt: new Date() } });
      await appendOutboxEvent(tx, { aggregateType: "ShoppingCancellationRequest", aggregateId: request.id, eventType: "CancellationRejected", payload: { cancellationRequestId: request.id, orderId: request.orderId, sellerOrderId: request.sellerOrderId } });
      return rejected;
    }

    const intent = request.order.paymentIntent;
    if (request.order.paymentStatus === "AUTHORIZED" || intent?.status === "REQUIRES_CAPTURE") throw new AppError("CONFLICT", "An active payment authorization must be voided by the payment provider before cancellation can be approved", 409);
    if (intent && intent.capturedMinor > intent.refundedMinor) throw new AppError("CONFLICT", "Captured payment exists. Complete the required refund before approving cancellation", 409);

    if (request.sellerOrder) {
      if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(request.sellerOrder.status)) throw new AppError("CONFLICT", "Shipped seller orders cannot be cancelled through pre-shipment cancellation", 409);
      for (const item of request.sellerOrder.items) {
        await tx.inventoryItem.update({ where: { storeId_variantId: { storeId: request.sellerOrder.storeId, variantId: item.variantId } }, data: { quantityOnHand: { increment: item.quantity } } });
      }
      await tx.shoppingSellerOrder.update({ where: { id: request.sellerOrder.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
      const affectedShipments = await tx.shipment.findMany({ where: { sellerOrderId: request.sellerOrder.id, status: { notIn: ["DELIVERED", "RETURNED_TO_SENDER", "CANCELLED"] } }, select: { id: true, status: true } });
      if (affectedShipments.length) {
        await tx.shipment.updateMany({ where: { id: { in: affectedShipments.map((shipment) => shipment.id) } }, data: { status: "CANCELLED" } });
        await tx.shipmentEvent.createMany({ data: affectedShipments.map((shipment) => ({ shipmentId: shipment.id, status: "CANCELLED", actorUserId, description: `Shipment cancelled from ${shipment.status} after Operations approved seller cancellation` })) });
      }
    }

    const sellerStates = await tx.shoppingSellerOrder.findMany({ where: { orderId: request.orderId }, orderBy: { createdAt: "asc" } });
    const allCancelled = sellerStates.length > 0 && sellerStates.every((row) => row.status === "CANCELLED");
    if (allCancelled) {
      const hadCapturedFunds = Boolean(intent && intent.capturedMinor > 0n);
      await tx.shoppingOrder.update({ where: { id: request.orderId }, data: { status: "CANCELLED", paymentStatus: hadCapturedFunds ? "REFUNDED" : "CANCELLED", cancelledAt: new Date() } });
      if (intent) await tx.paymentIntent.update({ where: { id: intent.id }, data: { status: hadCapturedFunds ? "REFUNDED" : "CANCELLED", ...(hadCapturedFunds ? {} : { cancelledAt: new Date() }) } });
      if (request.order.paymentId) await tx.payment.update({ where: { id: request.order.paymentId }, data: { status: hadCapturedFunds ? "REFUNDED" : "CANCELLED" } });
    } else if (request.sellerOrder) {
      if (intent && intent.capturedMinor > 0n) throw new AppError("CONFLICT", "Partial seller cancellation is blocked after capture; use the refund workflow", 409);
      const active = sellerStates.filter((row) => row.status !== "CANCELLED");
      const originalSubtotal = request.order.subtotalMinor;
      const sellerSubtotal = request.sellerOrder.subtotalMinor;
      const prorate = (value: bigint) => originalSubtotal > 0n ? (value * sellerSubtotal) / originalSubtotal : 0n;
      const cancelledDiscount = prorate(request.order.discountMinor);
      const cancelledTax = prorate(request.order.taxMinor);
      const rawShippingTotal = request.order.sellerOrders.reduce((total, row) => total + row.shippingMinor, 0n);
      const cancelledShipping = rawShippingTotal > 0n ? (request.order.shippingMinor * request.sellerOrder.shippingMinor) / rawShippingTotal : 0n;
      const nextSubtotal = request.order.subtotalMinor - sellerSubtotal;
      const nextShipping = request.order.shippingMinor - cancelledShipping;
      const nextTax = request.order.taxMinor - cancelledTax;
      const nextDiscount = request.order.discountMinor - cancelledDiscount;
      const nextTotal = nextSubtotal + nextShipping + nextTax - nextDiscount;
      if (nextSubtotal < 0n || nextShipping < 0n || nextTax < 0n || nextDiscount < 0n || nextTotal < 0n) throw new AppError("CONFLICT", "Cancellation would produce an invalid order financial snapshot", 409);

      let parentStatus: any = "PLACED";
      if (active.length && active.every((row) => row.status === "DELIVERED")) parentStatus = "DELIVERED";
      else if (active.length && active.every((row) => ["OUT_FOR_DELIVERY", "DELIVERED"].includes(row.status))) parentStatus = "OUT_FOR_DELIVERY";
      else if (active.some((row) => ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(row.status))) parentStatus = "SHIPPED";
      else if (active.some((row) => ["READY_TO_SHIP", "PACKED"].includes(row.status))) parentStatus = "PACKED";
      else if (active.some((row) => ["PICKING", "PROCESSING"].includes(row.status))) parentStatus = "PROCESSING";
      else if (active.length && active.every((row) => row.status === "CONFIRMED")) parentStatus = "CONFIRMED";
      await tx.shoppingOrder.update({ where: { id: request.orderId }, data: { status: parentStatus, subtotalMinor: nextSubtotal, shippingMinor: nextShipping, taxMinor: nextTax, discountMinor: nextDiscount, totalMinor: nextTotal } });
      if (intent) await tx.paymentIntent.update({ where: { id: intent.id }, data: { amountMinor: nextTotal } });
      if (request.order.paymentId) await tx.payment.update({ where: { id: request.order.paymentId }, data: { amountMinor: nextTotal } });
      await appendOutboxEvent(tx, { aggregateType: "ShoppingOrder", aggregateId: request.orderId, eventType: "SellerCancellationFinancialAdjustment", payload: { orderId: request.orderId, sellerOrderId: request.sellerOrder.id, cancelledSubtotalMinor: String(sellerSubtotal), cancelledShippingMinor: String(cancelledShipping), cancelledTaxMinor: String(cancelledTax), cancelledDiscountMinor: String(cancelledDiscount), totalMinor: String(nextTotal) } });
    }

    const resolved = await tx.shoppingCancellationRequest.update({ where: { id: request.id }, data: { status: "APPROVED", resolvedByUserId: actorUserId, resolutionNotes: input.notes, resolvedAt: new Date() } });
    await appendOutboxEvent(tx, { aggregateType: "ShoppingCancellationRequest", aggregateId: request.id, eventType: "CancellationApproved", payload: { cancellationRequestId: request.id, orderId: request.orderId, sellerOrderId: request.sellerOrderId } });
    return resolved;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

