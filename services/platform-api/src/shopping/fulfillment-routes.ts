import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { audit } from "../audit.js";
import {
  assignSellerOrder,
  createShipment,
  getMerchantFulfillmentOrder,
  listMerchantFulfillment,
  merchantOrganizationMembers,
  merchantOrganizationForUser,
  requestSellerCancellation,
  shipmentOrganizationForMerchantUser,
  sellerOrderOrganizationForUser,
  transitionSellerOrder,
  transitionShipment,
} from "./fulfillment.js";
import {
  inspectMerchantReturn,
  listMerchantReturns,
  returnOrganizationForMerchantUser,
  reviewMerchantReturn,
  transitionMerchantReturn,
} from "./returns.js";

const assignmentSchema = z.object({ assigneeUserId: z.string().min(1).nullable() });
const sellerStatusSchema = z.object({ status: z.enum(["CONFIRMED", "PICKING", "PROCESSING", "PACKED", "READY_TO_SHIP"]) });
const shipmentCreateSchema = z.object({
  carrier: z.string().trim().max(100).optional(),
  service: z.string().trim().max(100).optional(),
  trackingIdentifier: z.string().trim().max(180).optional(),
  labelUrl: z.string().url().max(2000).optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  items: z.array(z.object({ orderItemId: z.string().min(1), quantity: z.coerce.number().int().positive().max(1000) })).min(1).max(100),
});
const merchantShipmentStatusSchema = z.object({ status: z.enum(["LABEL_CREATED", "PACKED", "READY_TO_SHIP", "SHIPPED", "CANCELLED"]), code: z.string().max(80).optional(), description: z.string().max(500).optional(), location: z.string().max(200).optional(), occurredAt: z.string().datetime().optional() });
const cancellationSchema = z.object({ reason: z.string().trim().min(3).max(160), details: z.string().trim().max(1000).optional() });
const reviewSchema = z.object({ decision: z.enum(["APPROVE", "REJECT"]), notes: z.string().trim().max(1000).optional(), approvedRefundMinor: z.coerce.number().int().nonnegative().optional(), returnCarrier: z.string().trim().max(100).optional(), returnService: z.string().trim().max(100).optional(), returnTrackingId: z.string().trim().max(180).optional() });
const returnStatusSchema = z.object({ status: z.enum(["RETURN_LABEL_CREATED", "IN_TRANSIT", "RECEIVED", "INSPECTING", "REFUND_PENDING", "REJECTED"]), note: z.string().trim().max(1000).optional() });
const inspectionSchema = z.object({ approvedRefundMinor: z.coerce.number().int().nonnegative(), items: z.array(z.object({ returnItemId: z.string().min(1), inspectedQuantity: z.coerce.number().int().nonnegative(), outcome: z.string().trim().min(2).max(80), conditionNotes: z.string().trim().max(500).optional(), restockApproved: z.boolean(), refundableAmountMinor: z.coerce.number().int().nonnegative().optional() })).min(1).max(100) });

export async function shoppingFulfillmentRoutes(app: FastifyInstance) {
  app.get("/v1/business/shopping/fulfillment", async (request) => {
    const auth = await requireAuth(request);
    const query = request.query as { status?: string; merchantId?: string; q?: string };
    return listMerchantFulfillment(auth.userId, { status: query.status, merchantId: query.merchantId, query: query.q });
  });

  app.get("/v1/business/shopping/fulfillment/:sellerOrderId", async (request) => {
    const auth = await requireAuth(request);
    const { sellerOrderId } = request.params as { sellerOrderId: string };
    const organizationId = await sellerOrderOrganizationForUser(auth.userId, sellerOrderId);
    await requirePermission(request, "order.read", { organizationId });
    return getMerchantFulfillmentOrder(auth.userId, sellerOrderId);
  });

  app.patch("/v1/business/shopping/fulfillment/:sellerOrderId/assignment", async (request) => {
    const auth = await requireAuth(request);
    const { sellerOrderId } = request.params as { sellerOrderId: string };
    const organizationId = await sellerOrderOrganizationForUser(auth.userId, sellerOrderId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = assignmentSchema.parse(request.body);
    const result = await assignSellerOrder(auth.userId, sellerOrderId, input.assigneeUserId);
    await audit({ actorUserId: auth.userId, action: "shopping.fulfillment.assigned", resourceType: "ShoppingSellerOrder", resourceId: sellerOrderId, requestId: request.id, ipAddress: request.ip, metadata: { assigneeUserId: input.assigneeUserId } });
    return result;
  });

  app.patch("/v1/business/shopping/fulfillment/:sellerOrderId/status", async (request) => {
    const auth = await requireAuth(request);
    const { sellerOrderId } = request.params as { sellerOrderId: string };
    const organizationId = await sellerOrderOrganizationForUser(auth.userId, sellerOrderId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = sellerStatusSchema.parse(request.body);
    const result = await transitionSellerOrder(auth.userId, sellerOrderId, input.status);
    await audit({ actorUserId: auth.userId, action: "shopping.fulfillment.status.changed", resourceType: "ShoppingSellerOrder", resourceId: sellerOrderId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status } });
    return result;
  });

  app.post("/v1/business/shopping/fulfillment/:sellerOrderId/shipments", async (request, reply) => {
    const auth = await requireAuth(request);
    const { sellerOrderId } = request.params as { sellerOrderId: string };
    const organizationId = await sellerOrderOrganizationForUser(auth.userId, sellerOrderId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = shipmentCreateSchema.parse(request.body);
    const result = await createShipment(auth.userId, sellerOrderId, input);
    await audit({ actorUserId: auth.userId, action: "shopping.shipment.created", resourceType: "Shipment", resourceId: result.shipment.id, requestId: request.id, ipAddress: request.ip, metadata: { sellerOrderId, carrier: input.carrier, trackingIdentifier: input.trackingIdentifier } });
    return reply.code(201).send(result);
  });

  app.patch("/v1/business/shopping/shipments/:shipmentId/status", async (request) => {
    const auth = await requireAuth(request);
    const { shipmentId } = request.params as { shipmentId: string };
    const organizationId = await shipmentOrganizationForMerchantUser(auth.userId, shipmentId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = merchantShipmentStatusSchema.parse(request.body);
    const result = await transitionShipment(auth.userId, shipmentId, input.status, input, false);
    await audit({ actorUserId: auth.userId, action: "shopping.shipment.status.changed", resourceType: "Shipment", resourceId: shipmentId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status } });
    return result;
  });

  app.post("/v1/business/shopping/fulfillment/:sellerOrderId/cancellation-requests", async (request, reply) => {
    const auth = await requireAuth(request);
    const { sellerOrderId } = request.params as { sellerOrderId: string };
    const organizationId = await sellerOrderOrganizationForUser(auth.userId, sellerOrderId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = cancellationSchema.parse(request.body);
    const cancellation = await requestSellerCancellation(auth.userId, sellerOrderId, input);
    await audit({ actorUserId: auth.userId, action: "shopping.cancellation.requested", resourceType: "ShoppingCancellationRequest", resourceId: cancellation.id, requestId: request.id, ipAddress: request.ip, metadata: { sellerOrderId, reason: input.reason } });
    return reply.code(201).send({ cancellation });
  });

  app.get("/v1/business/shopping/merchants/:merchantId/members", async (request) => {
    const auth = await requireAuth(request);
    const { merchantId } = request.params as { merchantId: string };
    const organizationId = await merchantOrganizationForUser(auth.userId, merchantId);
    await requirePermission(request, "order.read", { organizationId });
    return merchantOrganizationMembers(auth.userId, merchantId);
  });

  app.get("/v1/business/shopping/returns", async (request) => {
    const auth = await requireAuth(request);
    const query = request.query as { merchantId?: string };
    return listMerchantReturns(auth.userId, query.merchantId);
  });

  app.post("/v1/business/shopping/returns/:returnId/review", async (request) => {
    const auth = await requireAuth(request);
    const { returnId } = request.params as { returnId: string };
    const organizationId = await returnOrganizationForMerchantUser(auth.userId, returnId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = reviewSchema.parse(request.body);
    const returnCase = await reviewMerchantReturn(auth.userId, returnId, input);
    await audit({ actorUserId: auth.userId, action: `shopping.return.${input.decision.toLowerCase()}`, resourceType: "ShoppingReturn", resourceId: returnId, requestId: request.id, ipAddress: request.ip, metadata: { approvedRefundMinor: input.approvedRefundMinor } });
    return { return: returnCase };
  });

  app.patch("/v1/business/shopping/returns/:returnId/status", async (request) => {
    const auth = await requireAuth(request);
    const { returnId } = request.params as { returnId: string };
    const organizationId = await returnOrganizationForMerchantUser(auth.userId, returnId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = returnStatusSchema.parse(request.body);
    const returnCase = await transitionMerchantReturn(auth.userId, returnId, input.status, input.note);
    await audit({ actorUserId: auth.userId, action: "shopping.return.status.changed", resourceType: "ShoppingReturn", resourceId: returnId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status } });
    return { return: returnCase };
  });

  app.post("/v1/business/shopping/returns/:returnId/inspect", async (request) => {
    const auth = await requireAuth(request);
    const { returnId } = request.params as { returnId: string };
    const organizationId = await returnOrganizationForMerchantUser(auth.userId, returnId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = inspectionSchema.parse(request.body);
    const returnCase = await inspectMerchantReturn(auth.userId, returnId, input);
    await audit({ actorUserId: auth.userId, action: "shopping.return.inspected", resourceType: "ShoppingReturn", resourceId: returnId, requestId: request.id, ipAddress: request.ip, metadata: { approvedRefundMinor: input.approvedRefundMinor } });
    return { return: returnCase };
  });
}
