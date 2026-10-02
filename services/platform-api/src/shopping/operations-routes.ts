import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { requirePermission } from "../authorization.js";
import { audit } from "../audit.js";
import { resolveCancellationRequest, getOperationalOrderContext, searchOperationalOrders } from "./operations.js";
import { transitionShipment } from "./fulfillment.js";
import { listOperationalReturns, resolveReturnDispute } from "./returns.js";
import { groceryPricingPublicPolicy, setGroceryServiceFeeBps } from "./grocery-pricing.js";

const shipmentStatusSchema = z.object({ status: z.enum(["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "REDELIVERY_SCHEDULED", "RETURN_TO_SENDER", "RETURNED_TO_SENDER"]), code: z.string().max(80).optional(), description: z.string().max(500).optional(), location: z.string().max(200).optional(), occurredAt: z.string().datetime().optional() });
const cancellationResolutionSchema = z.object({ decision: z.enum(["APPROVE", "REJECT"]), notes: z.string().trim().max(1000).optional() });
const disputeResolutionSchema = z.object({ resolution: z.enum(["CUSTOMER", "MERCHANT"]), notes: z.string().trim().min(3).max(1200) });
const groceryServiceFeeSchema = z.object({ serviceFeeBps: z.coerce.number().int().min(1000).max(1500) });

export async function shoppingOperationsRoutes(app: FastifyInstance) {
  app.get("/v1/admin/grocery/pricing-policy", async (request) => {
    await requirePermission(request, "order.read");
    return groceryPricingPublicPolicy();
  });

  app.patch("/v1/admin/grocery/pricing-policy", async (request) => {
    const auth = await requirePermission(request, "order.manage");
    const input = groceryServiceFeeSchema.parse(request.body);
    const policy = await setGroceryServiceFeeBps(input.serviceFeeBps);
    await audit({
      actorUserId: auth.userId,
      action: "grocery.pricing.service-fee.changed",
      resourceType: "RegionalConfig",
      resourceId: "NG:GROCERY",
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { serviceFeeBps: input.serviceFeeBps },
    });
    return policy;
  });

  app.get("/v1/admin/shopping/orders/search", async (request) => {
    await requirePermission(request, "order.read");
    const q = request.query as { q?: string; status?: string; paymentStatus?: string; merchantId?: string; limit?: string };
    return searchOperationalOrders({ q: q.q, status: q.status, paymentStatus: q.paymentStatus, merchantId: q.merchantId, limit: q.limit ? Number(q.limit) : undefined });
  });

  app.get("/v1/admin/shopping/orders/:orderId/context", async (request) => {
    await requirePermission(request, "order.read");
    const { orderId } = request.params as { orderId: string };
    return getOperationalOrderContext(orderId);
  });

  app.post("/v1/admin/shopping/cancellation-requests/:requestId/resolve", async (request) => {
    const auth = await requirePermission(request, "order.manage");
    const { requestId } = request.params as { requestId: string };
    const input = cancellationResolutionSchema.parse(request.body);
    const existing = await db.shoppingCancellationRequest.findUnique({ where: { id: requestId } });
    const desiredStatus = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    if (existing?.status === desiredStatus) {
      await audit({ actorUserId: auth.userId, action: "shopping.cancellation.noop", resourceType: "ShoppingCancellationRequest", resourceId: requestId, requestId: request.id, ipAddress: request.ip, metadata: { decision: input.decision, actionState: "ALREADY_DONE" } });
      return { cancellation: existing, actionState: "ALREADY_DONE" as const };
    }
    const cancellation = await resolveCancellationRequest(auth.userId, requestId, input);
    await audit({ actorUserId: auth.userId, action: `shopping.cancellation.${input.decision.toLowerCase()}`, resourceType: "ShoppingCancellationRequest", resourceId: requestId, requestId: request.id, ipAddress: request.ip, metadata: { notes: input.notes, actionState: "COMPLETED" } });
    return { cancellation, actionState: "COMPLETED" as const };
  });

  app.patch("/v1/admin/shopping/shipments/:shipmentId/status", async (request) => {
    const auth = await requirePermission(request, "order.manage");
    const { shipmentId } = request.params as { shipmentId: string };
    const input = shipmentStatusSchema.parse(request.body);
    const existing = await db.shipment.findUnique({ where: { id: shipmentId } });
    if (existing?.status === input.status) {
      await audit({ actorUserId: auth.userId, action: "shopping.shipment.operations-status.noop", resourceType: "Shipment", resourceId: shipmentId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: "ALREADY_DONE" } });
      return { shipment: existing, actionState: "ALREADY_DONE" as const };
    }
    const result = await transitionShipment(auth.userId, shipmentId, input.status, input, true);
    await audit({ actorUserId: auth.userId, action: "shopping.shipment.operations-status.changed", resourceType: "Shipment", resourceId: shipmentId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: "COMPLETED" } });
    return { ...result, actionState: "COMPLETED" as const };
  });

  app.get("/v1/admin/shopping/returns", async (request) => {
    await requirePermission(request, "order.read");
    const query = request.query as { status?: string };
    return listOperationalReturns({ status: query.status });
  });

  app.post("/v1/admin/shopping/return-disputes/:disputeId/resolve", async (request) => {
    const auth = await requirePermission(request, "order.manage");
    const { disputeId } = request.params as { disputeId: string };
    const input = disputeResolutionSchema.parse(request.body);
    const existing = await db.shoppingReturnDispute.findUnique({ where: { id: disputeId } });
    const desiredStatus = input.resolution === "CUSTOMER" ? "RESOLVED_CUSTOMER" : "RESOLVED_MERCHANT";
    if (existing?.status === desiredStatus) {
      await audit({ actorUserId: auth.userId, action: "shopping.return-dispute.noop", resourceType: "ShoppingReturnDispute", resourceId: disputeId, requestId: request.id, ipAddress: request.ip, metadata: { resolution: input.resolution, actionState: "ALREADY_DONE" } });
      return { dispute: existing, actionState: "ALREADY_DONE" as const };
    }
    const dispute = await resolveReturnDispute(auth.userId, disputeId, input);
    await audit({ actorUserId: auth.userId, action: "shopping.return-dispute.resolved", resourceType: "ShoppingReturnDispute", resourceId: disputeId, requestId: request.id, ipAddress: request.ip, metadata: { resolution: input.resolution, actionState: "COMPLETED" } });
    return { dispute, actionState: "COMPLETED" as const };
  });
}
