import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { audit } from "../audit.js";
import { addCustomerMessage, addOrganizationSupportMessage, addStaffSupportMessage, createSupportCase, escalateCustomerCase, getAdminSupportCase, getCustomerSupportCase, getOrganizationSupportCase, listAdminSupportCases, listCustomerSupportCases, listOrganizationSupportCases, updateAdminSupportCase, getFoodSupportAi, sendSafeFoodSupportAiReply } from "./service.js";
import { createRestaurantContactForOrganization, createSupportRestaurantContactAttempt, getSupportRestaurantContactCenter, listRestaurantContactsForOrganization, updateRestaurantContactForOrganization, updateSupportRestaurantContactAttempt } from "./contact-service.js";
import { createSupportCustomerContactAttempt, getSupportCustomerContactCenter, updateSupportCustomerContactAttempt } from "./customer-contact-service.js";
import { publishSupportLiveEvent, subscribeSupportLiveEvent } from "./live.js";

const attachmentUrls = z.array(z.string().url().max(2000)).max(8).optional();
const createSchema = z.object({ category: z.enum(["ORDER", "DELIVERY", "PAYMENT", "RETURN", "PRODUCT", "ACCOUNT", "BUSINESS", "LOGISTICS", "GO", "FOOD", "DRIVE", "OTHER"]), organizationId: z.string().min(1).optional(), channel: z.string().trim().min(2).max(40).optional(), region: z.string().trim().min(2).max(32).optional(), currency: z.string().regex(/^[A-Z]{3}$/).optional(), context: z.unknown().optional(), subject: z.string().trim().min(3).max(160), description: z.string().trim().min(3).max(4000), orderId: z.string().min(1).optional(), foodOrderId: z.string().min(1).optional(), foodRestaurantId: z.string().min(1).optional(), productId: z.string().min(1).optional(), paymentIntentId: z.string().min(1).optional(), shipmentId: z.string().min(1).optional(), shoppingReturnId: z.string().min(1).optional(), driveRideId: z.string().min(1).optional(), ledgerTransactionId: z.string().min(1).optional(), attachmentUrls });
const messageSchema = z.object({ body: z.string().trim().min(1).max(4000), attachmentUrls });

const restaurantContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(40).nullable().optional(),
  whatsappPhone: z.string().trim().max(40).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  preferredChannel: z.enum(["PHONE", "WHATSAPP", "SMS", "EMAIL", "IN_APP"]).optional(),
  isPrimary: z.boolean().optional(),
  isEmergency: z.boolean().optional(),
  active: z.boolean().optional(),
});
const contactAttemptSchema = z.object({
  clientActionId: z.string().trim().min(8).max(120),
  contactId: z.string().min(1).nullable().optional(),
  channel: z.enum(["PHONE", "WHATSAPP", "SMS", "EMAIL", "IN_APP"]),
  reason: z.string().trim().min(3).max(500),
});
const contactAttemptOutcomeSchema = z.object({
  status: z.enum(["COMPLETED", "NO_ANSWER", "BUSY", "FAILED", "CANCELLED"]),
  outcome: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  durationSeconds: z.coerce.number().int().min(0).max(86_400).nullable().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});

const customerContactAttemptSchema = z.object({
  clientActionId: z.string().trim().min(8).max(120),
  channel: z.enum(["PHONE", "WHATSAPP", "SMS", "EMAIL", "IN_APP"]),
  reason: z.string().trim().min(3).max(500),
  message: z.string().trim().min(1).max(4000).nullable().optional(),
});

async function openSupportEventStream(request: any, reply: any, caseId: string) {
  reply.hijack();
  reply.raw.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  });
  const send = (event: unknown) => {
    if (!reply.raw.destroyed) reply.raw.write(`event: support\ndata: ${JSON.stringify(event)}\n\n`);
  };
  send({ caseId, type: "CONNECTED", at: new Date().toISOString() });
  const unsubscribe = subscribeSupportLiveEvent(caseId, send);
  const heartbeat = setInterval(() => {
    if (!reply.raw.destroyed) reply.raw.write(`: heartbeat ${Date.now()}\n\n`);
  }, 20_000);
  const cleanup = () => { clearInterval(heartbeat); unsubscribe(); };
  request.raw.once("close", cleanup);
  request.raw.once("error", cleanup);
}

export async function supportRoutes(app: FastifyInstance) {
  app.get("/v1/support/cases", async (request) => listCustomerSupportCases((await requireAuth(request)).userId));
  app.post("/v1/support/cases", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const auth = await requireAuth(request); const input = createSchema.parse(request.body); const result = await createSupportCase(auth.userId, input);
    await audit({ actorUserId: auth.userId, action: "support.case.created", resourceType: "SupportCase", resourceId: result.case.id, requestId: request.id, ipAddress: request.ip, metadata: { category: input.category } });
    publishSupportLiveEvent(result.case.id, "CASE_UPDATED");
    return reply.code(201).send(result);
  });
  app.get("/v1/support/cases/:id", async (request) => { const auth = await requireAuth(request); const { id } = request.params as { id: string }; return getCustomerSupportCase(auth.userId, id); });
  app.post("/v1/support/cases/:id/messages", async (request, reply) => { const auth = await requireAuth(request); const { id } = request.params as { id: string }; const result = await addCustomerMessage(auth.userId, id, messageSchema.parse(request.body)); publishSupportLiveEvent(id, "MESSAGE_ADDED"); return reply.code(201).send(result); });
  app.post("/v1/support/cases/:id/escalate", async (request) => { const auth = await requireAuth(request); const { id } = request.params as { id: string }; const input = z.object({ reason: z.string().trim().min(3).max(800) }).parse(request.body); const result = await escalateCustomerCase(auth.userId, id, input.reason); publishSupportLiveEvent(id, "CASE_UPDATED"); return result; });
  app.get("/v1/support/cases/:id/stream", async (request, reply) => { const auth = await requireAuth(request); const { id } = z.object({ id: z.string().min(1) }).parse(request.params); await getCustomerSupportCase(auth.userId, id); return openSupportEventStream(request, reply, id); });

  app.get("/v1/business/organizations/:organizationId/support/cases", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    await requirePermission(request, "merchant.read", { organizationId });
    return listOrganizationSupportCases(organizationId);
  });

  app.post("/v1/business/organizations/:organizationId/support/cases", async (request, reply) => {
    const auth = await requireAuth(request);
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    await requirePermission(request, "merchant.read", { organizationId });
    const input = createSchema.omit({ organizationId: true }).parse(request.body);
    const result = await createSupportCase(auth.userId, {
      ...input,
      organizationId,
      channel: "BUSINESS",
      context: {
        ...(input.context && typeof input.context === "object" && !Array.isArray(input.context) ? input.context as Record<string, unknown> : {}),
        organizationId,
      },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.support.case.created",
      resourceType: "SupportCase",
      resourceId: result.case.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId, category: input.category },
    });
    publishSupportLiveEvent(result.case.id, "CASE_UPDATED");
    return reply.code(201).send(result);
  });

  app.get("/v1/business/organizations/:organizationId/support/cases/:id", async (request) => {
    const { organizationId, id } = z.object({ organizationId: z.string().min(1), id: z.string().min(1) }).parse(request.params);
    await requirePermission(request, "merchant.read", { organizationId });
    return getOrganizationSupportCase(organizationId, id);
  });

  app.post("/v1/business/organizations/:organizationId/support/cases/:id/messages", async (request, reply) => {
    const auth = await requireAuth(request);
    const { organizationId, id } = z.object({ organizationId: z.string().min(1), id: z.string().min(1) }).parse(request.params);
    await requirePermission(request, "merchant.read", { organizationId });
    const result = await addOrganizationSupportMessage(organizationId, auth.userId, id, messageSchema.parse(request.body));
    publishSupportLiveEvent(id, "MESSAGE_ADDED");
    return reply.code(201).send(result);
  });

  app.get("/v1/business/organizations/:organizationId/support/cases/:id/stream", async (request, reply) => {
    const { organizationId, id } = z.object({ organizationId: z.string().min(1), id: z.string().min(1) }).parse(request.params);
    await requirePermission(request, "merchant.read", { organizationId });
    await getOrganizationSupportCase(organizationId, id);
    return openSupportEventStream(request, reply, id);
  });

  app.get("/v1/business/organizations/:organizationId/food/restaurants/:restaurantId/contacts", async (request) => {
    const { organizationId, restaurantId } = z.object({ organizationId: z.string().min(1), restaurantId: z.string().min(1) }).parse(request.params);
    await requirePermission(request, "merchant.read", { organizationId });
    return listRestaurantContactsForOrganization(organizationId, restaurantId);
  });

  app.post("/v1/business/organizations/:organizationId/food/restaurants/:restaurantId/contacts", async (request, reply) => {
    const auth = await requirePermission(request, "merchant.manage", { organizationId: (request.params as any).organizationId });
    const { organizationId, restaurantId } = z.object({ organizationId: z.string().min(1), restaurantId: z.string().min(1) }).parse(request.params);
    const result = await createRestaurantContactForOrganization(organizationId, restaurantId, restaurantContactSchema.parse(request.body));
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "business.restaurant_contact.already_exists" : "business.restaurant_contact.created", resourceType: "RestaurantContact", resourceId: result.contact.id, requestId: request.id, ipAddress: request.ip, metadata: { organizationId, restaurantId, actionState: result.actionState } });
    return reply.code(result.actionState === "ALREADY_DONE" ? 200 : 201).send(result);
  });

  app.patch("/v1/business/organizations/:organizationId/food/restaurants/:restaurantId/contacts/:contactId", async (request) => {
    const { organizationId, restaurantId, contactId } = z.object({ organizationId: z.string().min(1), restaurantId: z.string().min(1), contactId: z.string().min(1) }).parse(request.params);
    const auth = await requirePermission(request, "merchant.manage", { organizationId });
    const result = await updateRestaurantContactForOrganization(organizationId, restaurantId, contactId, restaurantContactSchema.partial().parse(request.body));
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "business.restaurant_contact.noop" : "business.restaurant_contact.updated", resourceType: "RestaurantContact", resourceId: contactId, requestId: request.id, ipAddress: request.ip, metadata: { organizationId, restaurantId, actionState: result.actionState } });
    return result;
  });

  app.get("/v1/admin/support/cases/:id/restaurant-contact-center", async (request) => {
    await requirePermission(request, "support.manage");
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    return getSupportRestaurantContactCenter(id);
  });

  app.post("/v1/admin/support/cases/:id/restaurant-contact-attempts", async (request, reply) => {
    const auth = await requirePermission(request, "support.manage");
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const input = contactAttemptSchema.parse(request.body);
    const result = await createSupportRestaurantContactAttempt(id, auth.userId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "support.restaurant_contact.already_started" : "support.restaurant_contact.started", resourceType: "SupportContactAttempt", resourceId: result.attempt.id, requestId: request.id, ipAddress: request.ip, metadata: { caseId: id, channel: input.channel, actionState: result.actionState } });
    publishSupportLiveEvent(id, "CONTACT_UPDATED");
    return reply.code(result.actionState === "ALREADY_DONE" ? 200 : 201).send(result);
  });

  app.patch("/v1/admin/support/restaurant-contact-attempts/:attemptId", async (request) => {
    const auth = await requirePermission(request, "support.manage");
    const { attemptId } = z.object({ attemptId: z.string().min(1) }).parse(request.params);
    const input = contactAttemptOutcomeSchema.parse(request.body);
    const result = await updateSupportRestaurantContactAttempt(attemptId, auth.userId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "support.restaurant_contact.outcome_noop" : "support.restaurant_contact.outcome_saved", resourceType: "SupportContactAttempt", resourceId: attemptId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: result.actionState } });
    publishSupportLiveEvent(result.attempt.supportCaseId, "CONTACT_UPDATED");
    return result;
  });

  app.get("/v1/admin/support/cases/:id/customer-contact-center", async (request) => {
    await requirePermission(request, "support.manage");
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    return getSupportCustomerContactCenter(id);
  });

  app.post("/v1/admin/support/cases/:id/customer-contact-attempts", async (request, reply) => {
    const auth = await requirePermission(request, "support.manage");
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const input = customerContactAttemptSchema.parse(request.body);
    const result = await createSupportCustomerContactAttempt(id, auth.userId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "support.customer_contact.already_started" : "support.customer_contact.started", resourceType: "SupportCustomerContactAttempt", resourceId: result.attempt.id, requestId: request.id, ipAddress: request.ip, metadata: { caseId: id, channel: input.channel, actionState: result.actionState } });
    publishSupportLiveEvent(id, input.channel === "IN_APP" ? "MESSAGE_ADDED" : "CONTACT_UPDATED");
    return reply.code(result.actionState === "ALREADY_DONE" ? 200 : 201).send(result);
  });

  app.patch("/v1/admin/support/customer-contact-attempts/:attemptId", async (request) => {
    const auth = await requirePermission(request, "support.manage");
    const { attemptId } = z.object({ attemptId: z.string().min(1) }).parse(request.params);
    const input = contactAttemptOutcomeSchema.parse(request.body);
    const result = await updateSupportCustomerContactAttempt(attemptId, auth.userId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "support.customer_contact.outcome_noop" : "support.customer_contact.outcome_saved", resourceType: "SupportCustomerContactAttempt", resourceId: attemptId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: result.actionState } });
    publishSupportLiveEvent(result.attempt.supportCaseId, "CONTACT_UPDATED");
    return result;
  });

  app.get("/v1/admin/support/cases", async (request) => { await requirePermission(request, "support.manage"); const q = request.query as { status?: string; priority?: string; channel?: string; category?: string; organizationId?: string; q?: string; unassigned?: string; limit?: string }; return listAdminSupportCases({ status: q.status, priority: q.priority, channel: q.channel, category: q.category, organizationId: q.organizationId, q: q.q, unassigned: q.unassigned === "1" || q.unassigned === "true", limit: q.limit ? Number(q.limit) : undefined }); });
  app.get("/v1/admin/support/cases/:id", async (request) => { await requirePermission(request, "support.manage"); const { id } = request.params as { id: string }; return getAdminSupportCase(id); });
  app.get("/v1/admin/support/cases/:id/stream", async (request, reply) => { await requirePermission(request, "support.manage"); const { id } = z.object({ id: z.string().min(1) }).parse(request.params); await getAdminSupportCase(id); return openSupportEventStream(request, reply, id); });
  app.patch("/v1/admin/support/cases/:id", async (request) => { const auth = await requirePermission(request, "support.manage"); const { id } = request.params as { id: string }; const input = z.object({ status: z.enum(["OPEN", "WAITING_CUSTOMER", "WAITING_STAFF", "ESCALATED", "RESOLVED", "CLOSED"]).optional(), priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(), assignedToUserId: z.string().min(1).nullable().optional(), escalationReason: z.string().trim().max(800).nullable().optional() }).parse(request.body); const result = await updateAdminSupportCase(id, auth.userId, input); await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "support.case.noop" : "support.case.updated", resourceType: "SupportCase", resourceId: id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: result.actionState } }); publishSupportLiveEvent(id, "CASE_UPDATED"); return result; });
  app.post("/v1/admin/support/cases/:id/messages", async (request, reply) => { const auth = await requirePermission(request, "support.manage"); const { id } = request.params as { id: string }; const input = messageSchema.extend({ internal: z.boolean().optional() }).parse(request.body); const result = await addStaffSupportMessage(id, auth.userId, input); await audit({ actorUserId: auth.userId, action: input.internal ? "support.note.internal" : "support.reply.sent", resourceType: "SupportCase", resourceId: id, requestId: request.id, ipAddress: request.ip }); publishSupportLiveEvent(id, "MESSAGE_ADDED"); return reply.code(201).send(result); });
  app.post("/v1/admin/support/cases/:id/food-ai/analyze", async (request) => {
    await requirePermission(request, "support.manage");
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    return getFoodSupportAi(id);
  });
  app.post("/v1/admin/support/cases/:id/food-ai/reply", async (request) => {
    const auth = await requirePermission(request, "support.manage");
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const result = await sendSafeFoodSupportAiReply(id);
    await audit({ actorUserId: auth.userId, action: "support.food_ai.safe_reply", resourceType: "SupportCase", resourceId: id, requestId: request.id, ipAddress: request.ip, metadata: { autoReplied: result.autoReplied, issueType: result.analysis.issueType } });
    publishSupportLiveEvent(id, "MESSAGE_ADDED");
    return result;
  });

}
