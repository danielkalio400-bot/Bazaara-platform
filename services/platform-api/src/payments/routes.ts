import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Transform, type Readable } from "node:stream";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@bazaara/db";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { audit } from "../audit.js";
import { AppError } from "../errors.js";
import { allowedOrigins } from "../config.js";
import {
  canonicalWebhookPayload,
  createReconciliation,
  getPaymentIntentForOrder,
  listPaymentIntents,
  processCanonicalWebhook,
  queueRefund,
  resolveReconciliation,
  verifyCanonicalWebhook,
  webhookSecretForProvider,
} from "./orchestration.js";
import { initializeOrderPayment, processPaystackWebhook, processQueuedRefund, reconcileOrderPayment, type PaystackWebhookBody } from "./provider-service.js";
import { verifyPaystackWebhookSignature } from "./paystack.js";
import { processPaystackFundingWebhook } from "../pay/funding.js";
import { processPaystackWithdrawalWebhook } from "../pay/service.js";

const refundSchema = z.object({ shoppingReturnId: z.string().min(1).optional(), amountMinor: z.coerce.number().int().positive(), reason: z.string().trim().min(3).max(240) });
const reconciliationSchema = z.object({ paymentIntentId: z.string().min(1).optional(), provider: z.string().trim().min(2).max(80), providerReference: z.string().trim().max(160).optional(), reportedStatus: z.string().trim().min(2).max(80), reportedAmountMinor: z.coerce.number().int().nonnegative().optional(), reportedCurrency: z.string().trim().length(3).transform((v) => v.toUpperCase()).optional(), source: z.string().trim().min(2).max(80) });
const webhookSchema = z.object({ eventId: z.string().min(1).max(180), type: z.enum(["payment.authorized","payment.captured","payment.failed","refund.succeeded","refund.failed"]), paymentIntentId: z.string().min(1), providerReference: z.string().max(180).optional(), amountMinor: z.coerce.number().int().nonnegative().optional(), refundId: z.string().optional(), failureCode: z.string().max(120).optional(), failureMessage: z.string().max(500).optional(), retryable: z.boolean().optional() });
const paymentInitializeSchema = z.object({ returnOrigin: z.string().url().optional() });

function validIdempotencyKey(request: FastifyRequest) {
  const value = request.headers["idempotency-key"]?.toString().trim();
  if (!value || value.length < 8 || value.length > 160) throw new AppError("BAD_REQUEST", "A valid Idempotency-Key header is required", 400);
  return value;
}

async function rawBodyCapture(request: FastifyRequest, _reply: FastifyReply, payload: Readable) {
  const chunks: Buffer[] = [];
  const capture = new Transform({
    transform(chunk, _encoding, callback) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buffer);
      capture.receivedEncodedLength = (capture.receivedEncodedLength ?? 0) + buffer.length;
      callback(null, chunk);
    },
    flush(callback) {
      (request as FastifyRequest & { rawBody?: Buffer }).rawBody = Buffer.concat(chunks);
      callback();
    },
  }) as Transform & { receivedEncodedLength?: number };
  capture.receivedEncodedLength = 0;
  return payload.pipe(capture);
}

export async function paymentOrchestrationRoutes(app: FastifyInstance) {
  app.get("/v1/shopping/orders/:orderId/payment", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const order = await db.shoppingOrder.findFirst({ where: { id: orderId, userId: auth.userId }, select: { id: true } });
    if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
    return { paymentIntent: await getPaymentIntentForOrder(order.id) };
  });

  app.post("/v1/shopping/orders/:orderId/payment/initialize", { config: { rateLimit: { max: 20, timeWindow: "5 minutes" } } }, async (request, reply) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const idempotencyKey = validIdempotencyKey(request);
    const input = paymentInitializeSchema.parse(request.body ?? {});
    let returnOrigin: string | undefined;
    if (input.returnOrigin) {
      const origin = new URL(input.returnOrigin).origin;
      if (!allowedOrigins.has(origin)) throw new AppError("BAD_REQUEST", "Unsupported payment return origin", 400);
      returnOrigin = origin;
    }
    const result = await initializeOrderPayment({ userId: auth.userId, orderId, idempotencyKey, returnOrigin });
    await audit({ actorUserId: auth.userId, action: "payment.provider.initialized", resourceType: "ShoppingOrder", resourceId: orderId, requestId: request.id, ipAddress: request.ip, metadata: { replayed: Boolean(result.replayed), alreadyPaid: result.alreadyPaid } });
    return reply.code(result.replayed || result.alreadyPaid ? 200 : 201).send(result);
  });

  app.post("/v1/shopping/orders/:orderId/payment/reconcile", { config: { rateLimit: { max: 30, timeWindow: "5 minutes" } } }, async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const result = await reconcileOrderPayment({ userId: auth.userId, orderId });
    await audit({ actorUserId: auth.userId, action: "payment.provider.verified", resourceType: "ShoppingOrder", resourceId: orderId, requestId: request.id, ipAddress: request.ip });
    return result;
  });

  app.get("/v1/admin/payments/intents", async (request) => {
    await requirePermission(request, "payment.read");
    const query = request.query as { q?: string; status?: string; limit?: string };
    return listPaymentIntents({ query: query.q, status: query.status, limit: query.limit ? Number(query.limit) : undefined });
  });

  app.post("/v1/admin/payments/intents/:paymentIntentId/refunds", async (request, reply) => {
    const auth = await requirePermission(request, "payment.refund");
    const { paymentIntentId } = request.params as { paymentIntentId: string };
    const input = refundSchema.parse(request.body);
    const idempotencyKey = validIdempotencyKey(request);
    const result = await queueRefund({ paymentIntentId, shoppingReturnId: input.shoppingReturnId, amountMinor: input.amountMinor, reason: input.reason, requestedByUserId: auth.userId, idempotencyKey });
    if (!result.replayed) await audit({ actorUserId: auth.userId, action: "payment.refund.queued", resourceType: "PaymentIntent", resourceId: paymentIntentId, requestId: request.id, ipAddress: request.ip, metadata: { refundId: result.refund.id, amountMinor: input.amountMinor, returnId: input.shoppingReturnId } });
    return reply.code(result.replayed ? 200 : 202).send(result);
  });

  app.post("/v1/admin/payments/refunds/:refundId/process", async (request, reply) => {
    const auth = await requirePermission(request, "payment.refund");
    const { refundId } = request.params as { refundId: string };
    const result = await processQueuedRefund(refundId);
    await audit({ actorUserId: auth.userId, action: "payment.refund.provider-requested", resourceType: "PaymentRefund", resourceId: refundId, requestId: request.id, ipAddress: request.ip });
    return reply.code(202).send(result);
  });

  app.post("/v1/admin/payments/intents/:paymentIntentId/reconcile-provider", async (request) => {
    const auth = await requirePermission(request, "payment.read");
    const { paymentIntentId } = request.params as { paymentIntentId: string };
    const intent = await db.paymentIntent.findUnique({ where: { id: paymentIntentId }, select: { orderId: true } });
    if (!intent) throw new AppError("NOT_FOUND", "Payment intent not found", 404);
    const result = await reconcileOrderPayment({ userId: auth.userId, orderId: intent.orderId, operations: true });
    await audit({ actorUserId: auth.userId, action: "payment.provider.reconciled", resourceType: "PaymentIntent", resourceId: paymentIntentId, requestId: request.id, ipAddress: request.ip });
    return result;
  });

  app.post("/v1/admin/payments/reconciliations", async (request, reply) => {
    const auth = await requirePermission(request, "payment.refund");
    const input = reconciliationSchema.parse(request.body);
    const result = await createReconciliation({ ...input, actorUserId: auth.userId });
    await audit({ actorUserId: auth.userId, action: "payment.reconciliation.recorded", resourceType: "PaymentReconciliation", resourceId: result.reconciliation.id, requestId: request.id, ipAddress: request.ip, metadata: { provider: input.provider, paymentIntentId: input.paymentIntentId } });
    return reply.code(201).send(result);
  });

  app.post("/v1/admin/payments/reconciliations/:id/resolve", async (request) => {
    const auth = await requirePermission(request, "payment.refund");
    const { id } = request.params as { id: string };
    const body = z.object({ resolutionNotes: z.string().trim().min(3).max(1000) }).parse(request.body);
    const result = await resolveReconciliation(id, auth.userId, body.resolutionNotes);
    await audit({ actorUserId: auth.userId, action: "payment.reconciliation.resolved", resourceType: "PaymentReconciliation", resourceId: id, requestId: request.id, ipAddress: request.ip });
    return result;
  });

  // Paystack's signature covers the exact raw request body. Capture the bytes before
  // Fastify's JSON parser, verify HMAC-SHA512, then map only trusted provider events
  // into Bazaara's canonical payment state machine.
  app.post("/v1/payments/webhooks/paystack", { preParsing: rawBodyCapture, config: { rateLimit: { max: 240, timeWindow: "1 minute" } } }, async (request, reply) => {
    const signature = request.headers["x-paystack-signature"]?.toString().trim() ?? "";
    const rawBody = (request as FastifyRequest & { rawBody?: Buffer }).rawBody;
    if (!rawBody || !verifyPaystackWebhookSignature(rawBody, signature)) throw new AppError("FORBIDDEN", "Webhook signature verification failed", 403);
    const body = request.body as PaystackWebhookBody;
    const withdrawal = await processPaystackWithdrawalWebhook(body);
    if (withdrawal.handled) return reply.code(200).send(withdrawal);
    const funding = await processPaystackFundingWebhook(body);
    if (funding.handled) return reply.code(200).send(funding);
    const result = await processPaystackWebhook(body, signature);
    return reply.code(200).send(result);
  });

  // Provider-neutral signed webhook endpoint retained for future adapters and
  // deterministic integration tests. Provider-specific routes must verify their
  // native signature scheme before reaching the canonical state machine.
  app.post("/v1/payments/webhooks/:provider", async (request, reply) => {
    const { provider } = request.params as { provider: string };
    if (provider.toLowerCase() === "paystack") throw new AppError("BAD_REQUEST", "Use the Paystack webhook endpoint", 400);
    const timestamp = request.headers["x-bazaara-timestamp"]?.toString() ?? "";
    const signature = request.headers["x-bazaara-signature"]?.toString() ?? "";
    const secret = webhookSecretForProvider(provider);
    if (!secret) throw new AppError("NOT_FOUND", "Webhook provider is not configured", 404);
    const body = webhookSchema.parse(request.body);
    const rawBody = canonicalWebhookPayload(body);
    if (!verifyCanonicalWebhook({ rawBody, timestamp, signature, secret })) throw new AppError("FORBIDDEN", "Webhook signature verification failed", 403);
    const result = await processCanonicalWebhook(provider, body, createHash("sha256").update(signature).digest("hex"));
    return reply.code(result.duplicate ? 200 : 202).send(result);
  });
}
