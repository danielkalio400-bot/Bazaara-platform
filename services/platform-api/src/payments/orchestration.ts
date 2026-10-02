import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { appendOutboxEvent } from "../outbox.js";
import { reconcileReturnParentStateTx } from "../shopping/returns.js";
import { queueNotificationTx } from "../notifications/service.js";

const WEBHOOK_REPLAY_WINDOW_MS = 5 * 60 * 1000;

function money(value: bigint | null | undefined) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Money value exceeds safe JSON integer range");
  return n;
}

export function serializePaymentIntent(intent: any) {
  return {
    id: intent.id,
    orderId: intent.orderId,
    clientReference: intent.clientReference,
    status: intent.status,
    paymentMethod: intent.paymentMethod,
    provider: intent.provider,
    providerReference: intent.providerReference,
    amountMinor: money(intent.amountMinor),
    capturedMinor: money(intent.capturedMinor),
    refundedMinor: money(intent.refundedMinor),
    currency: intent.currency,
    lastErrorCode: intent.lastErrorCode,
    lastErrorMessage: intent.lastErrorMessage,
    createdAt: intent.createdAt,
    updatedAt: intent.updatedAt,
    attempts: (intent.attempts ?? []).map((attempt: any) => ({
      id: attempt.id,
      provider: attempt.provider,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      providerReference: attempt.providerReference,
      nextRetryAt: attempt.nextRetryAt,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    })),
    authorizations: (intent.authorizations ?? []).map((row: any) => ({ ...row, amountMinor: money(row.amountMinor) })),
    captures: (intent.captures ?? []).map((row: any) => ({ ...row, amountMinor: money(row.amountMinor) })),
    refunds: (intent.refunds ?? []).map((row: any) => ({ ...row, amountMinor: money(row.amountMinor) })),
    failures: intent.failures ?? [],
    reconciliations: (intent.reconciliations ?? []).map((row: any) => ({
      ...row,
      reportedAmountMinor: money(row.reportedAmountMinor),
      expectedAmountMinor: money(row.expectedAmountMinor),
      differenceMinor: money(row.differenceMinor),
    })),
  };
}

const intentInclude = {
  attempts: { orderBy: { attemptNumber: "asc" as const } },
  authorizations: { orderBy: { authorizedAt: "asc" as const } },
  captures: { orderBy: { createdAt: "asc" as const } },
  refunds: { orderBy: { createdAt: "desc" as const } },
  failures: { orderBy: { createdAt: "desc" as const } },
  reconciliations: { orderBy: { observedAt: "desc" as const } },
} satisfies Prisma.PaymentIntentInclude;

export async function createPaymentIntentTx(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    legacyPaymentId?: string | null;
    paymentMethod: string;
    amountMinor: bigint;
    currency: string;
  },
) {
  const existing = await tx.paymentIntent.findUnique({ where: { orderId: input.orderId } });
  if (existing) return existing;
  const payOnDelivery = input.paymentMethod === "PAY_ON_DELIVERY";
  return tx.paymentIntent.create({
    data: {
      orderId: input.orderId,
      legacyPaymentId: input.legacyPaymentId ?? null,
      clientReference: `PI-${input.orderId}`,
      status: payOnDelivery ? "PROCESSING" : "REQUIRES_PAYMENT_METHOD",
      paymentMethod: input.paymentMethod,
      provider: payOnDelivery ? "PAY_ON_DELIVERY" : null,
      amountMinor: input.amountMinor,
      currency: input.currency,
      metadata: { source: "shopping.checkout" },
    },
  });
}

export async function getPaymentIntentForOrder(orderId: string) {
  const intent = await db.paymentIntent.findUnique({ where: { orderId }, include: intentInclude });
  return intent ? serializePaymentIntent(intent) : null;
}

export function paymentRetryAt(attemptNumber: number, from = new Date()) {
  const delaysMinutes = [1, 5, 15, 60, 180, 360];
  const index = Math.min(Math.max(0, attemptNumber - 1), delaysMinutes.length - 1);
  return new Date(from.getTime() + delaysMinutes[index]! * 60 * 1000);
}

export async function beginPaymentAttempt(input: {
  paymentIntentId: string;
  provider: string;
  idempotencyKey: string;
  requestPayload?: Prisma.InputJsonValue;
}) {
  return db.$transaction(async (tx) => {
    const replay = await tx.paymentAttempt.findFirst({ where: { paymentIntentId: input.paymentIntentId, idempotencyKey: input.idempotencyKey } });
    if (replay) return { attempt: replay, replayed: true };
    const intent = await tx.paymentIntent.findUnique({ where: { id: input.paymentIntentId }, include: { attempts: { select: { attemptNumber: true }, orderBy: { attemptNumber: "desc" }, take: 1 } } });
    if (!intent) throw new AppError("NOT_FOUND", "Payment intent not found", 404);
    if (["SUCCEEDED", "CANCELLED", "REFUNDED"].includes(intent.status)) throw new AppError("CONFLICT", `Payment intent in ${intent.status} cannot start another payment attempt`, 409);
    if (intent.provider && intent.provider !== input.provider && intent.provider !== "PAY_ON_DELIVERY") throw new AppError("CONFLICT", "Payment intent is already bound to a different provider", 409);
    const attemptNumber = (intent.attempts[0]?.attemptNumber ?? 0) + 1;
    const attempt = await tx.paymentAttempt.create({ data: { paymentIntentId: intent.id, provider: input.provider, attemptNumber, idempotencyKey: input.idempotencyKey, status: "PENDING", requestPayload: input.requestPayload } });
    await tx.paymentIntent.update({ where: { id: intent.id }, data: { provider: input.provider, status: "PROCESSING", lastErrorCode: null, lastErrorMessage: null } });
    await appendOutboxEvent(tx, { aggregateType: "PaymentAttempt", aggregateId: attempt.id, eventType: "PaymentAttemptStarted", payload: { paymentAttemptId: attempt.id, paymentIntentId: intent.id, provider: input.provider, attemptNumber } });
    return { attempt, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function failPaymentAttempt(input: {
  paymentAttemptId: string;
  code: string;
  message: string;
  retryable: boolean;
  responsePayload?: Prisma.InputJsonValue;
}) {
  return db.$transaction(async (tx) => {
    const attempt = await tx.paymentAttempt.findUnique({ where: { id: input.paymentAttemptId }, include: { paymentIntent: true } });
    if (!attempt) throw new AppError("NOT_FOUND", "Payment attempt not found", 404);
    if (["SUCCEEDED", "CANCELLED"].includes(attempt.status)) throw new AppError("CONFLICT", "Payment attempt is already terminal", 409);
    const nextRetryAt = input.retryable ? paymentRetryAt(attempt.attemptNumber) : null;
    const saved = await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "FAILED", responsePayload: input.responsePayload, nextRetryAt, completedAt: new Date() } });
    await tx.paymentFailure.create({ data: { paymentIntentId: attempt.paymentIntentId, paymentAttemptId: attempt.id, stage: "PROVIDER_REQUEST", code: input.code, message: input.message, retryable: input.retryable } });
    await tx.paymentIntent.update({ where: { id: attempt.paymentIntentId }, data: { status: input.retryable ? "PROCESSING" : "FAILED", lastErrorCode: input.code, lastErrorMessage: input.message } });
    if (!input.retryable) await tx.shoppingOrder.update({ where: { id: attempt.paymentIntent.orderId }, data: { paymentStatus: "FAILED" } });
    await appendOutboxEvent(tx, { aggregateType: "PaymentAttempt", aggregateId: attempt.id, eventType: "PaymentAttemptFailed", payload: { paymentAttemptId: attempt.id, paymentIntentId: attempt.paymentIntentId, code: input.code, retryable: input.retryable, nextRetryAt: nextRetryAt?.toISOString() ?? null } });
    return { attempt: saved };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function listPaymentIntents(input: { query?: string; status?: string; limit?: number } = {}) {
  const limit = Math.min(200, Math.max(1, input.limit ?? 100));
  const intents = await db.paymentIntent.findMany({
    where: {
      ...(input.status ? { status: input.status as any } : {}),
      ...(input.query ? {
        OR: [
          { clientReference: { contains: input.query, mode: "insensitive" } },
          { providerReference: { contains: input.query, mode: "insensitive" } },
          { order: { orderNumber: { contains: input.query, mode: "insensitive" } } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { ...intentInclude, order: { select: { orderNumber: true, paymentStatus: true, status: true, placedAt: true } } },
  });
  return { intents: intents.map((intent) => ({ ...serializePaymentIntent(intent), order: intent.order })) };
}

export async function queueRefund(input: {
  paymentIntentId: string;
  shoppingReturnId?: string;
  amountMinor: number;
  reason: string;
  requestedByUserId: string;
  idempotencyKey: string;
}) {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) throw new AppError("BAD_REQUEST", "Refund amount must be a positive integer amount in minor units", 400);
  return db.$transaction(async (tx) => {
    const existing = await tx.paymentRefund.findUnique({ where: { paymentIntentId_idempotencyKey: { paymentIntentId: input.paymentIntentId, idempotencyKey: input.idempotencyKey } } });
    if (existing) return { refund: { ...existing, amountMinor: money(existing.amountMinor) }, replayed: true };

    const intent = await tx.paymentIntent.findUnique({ where: { id: input.paymentIntentId }, include: { refunds: { where: { status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] } } } } });
    if (!intent) throw new AppError("NOT_FOUND", "Payment intent not found", 404);
    const queued = intent.refunds.reduce((total, refund) => total + refund.amountMinor, 0n);
    const refundable = intent.capturedMinor - queued;
    if (refundable <= 0n) throw new AppError("CONFLICT", "This payment has no captured amount available to refund", 409);
    if (BigInt(input.amountMinor) > refundable) throw new AppError("CONFLICT", `Only ${money(refundable)} minor units remain refundable`, 409);

    if (input.shoppingReturnId) {
      const returnCase = await tx.shoppingReturn.findUnique({ where: { id: input.shoppingReturnId }, select: { id: true, orderId: true, approvedRefundMinor: true, requestedRefundMinor: true, status: true } });
      if (!returnCase) throw new AppError("NOT_FOUND", "Return case not found", 404);
      if (returnCase.orderId !== intent.orderId) throw new AppError("BAD_REQUEST", "Return case does not belong to this payment intent's order", 400);
      if (!['REFUND_PENDING','APPROVED','INSPECTING','RECEIVED','PARTIALLY_REFUNDED'].includes(returnCase.status)) throw new AppError("CONFLICT", "Return case is not ready for a refund", 409);
      const approved = returnCase.approvedRefundMinor ?? returnCase.requestedRefundMinor;
      if (approved == null) throw new AppError("CONFLICT", "Return case has no approved refundable value", 409);
      const priorReturnRefunds = await tx.paymentRefund.aggregate({
        where: { shoppingReturnId: returnCase.id, status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] } },
        _sum: { amountMinor: true },
      });
      const remainingReturnRefund = approved - (priorReturnRefunds._sum.amountMinor ?? 0n);
      if (BigInt(input.amountMinor) > remainingReturnRefund) throw new AppError("CONFLICT", `Only ${money(remainingReturnRefund)} minor units remain approved for this return`, 409);
    }

    const refund = await tx.paymentRefund.create({
      data: {
        paymentIntentId: intent.id,
        shoppingReturnId: input.shoppingReturnId ?? null,
        idempotencyKey: input.idempotencyKey,
        provider: intent.provider,
        status: "PENDING",
        amountMinor: BigInt(input.amountMinor),
        currency: intent.currency,
        reason: input.reason,
        requestedByUserId: input.requestedByUserId,
      },
    });
    if (input.shoppingReturnId) {
      await tx.shoppingReturn.update({ where: { id: input.shoppingReturnId }, data: { status: "REFUND_PENDING" } });
      await tx.shoppingReturnEvent.create({ data: { returnId: input.shoppingReturnId, type: "REFUND_QUEUED", toStatus: "REFUND_PENDING", actorUserId: input.requestedByUserId, metadata: { refundId: refund.id, amountMinor: String(refund.amountMinor) } } });
    }
    await appendOutboxEvent(tx, { aggregateType: "PaymentRefund", aggregateId: refund.id, eventType: "RefundQueued", payload: { refundId: refund.id, paymentIntentId: intent.id, amountMinor: String(refund.amountMinor), currency: refund.currency } });
    return { refund: { ...refund, amountMinor: money(refund.amountMinor) }, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export function canonicalWebhookPayload(body: unknown) {
  return JSON.stringify(body ?? null);
}

export function verifyCanonicalWebhook(input: { rawBody: string; timestamp: string; signature: string; secret: string; now?: number }) {
  const parsed = Number(input.timestamp);
  const now = input.now ?? Date.now();
  if (!Number.isFinite(parsed) || Math.abs(now - parsed * 1000) > WEBHOOK_REPLAY_WINDOW_MS) return false;
  const supplied = input.signature.startsWith("sha256=") ? input.signature.slice(7) : input.signature;
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", input.secret).update(`${input.timestamp}.${input.rawBody}`, "utf8").digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(supplied, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function webhookSecrets() {
  try {
    const parsed = JSON.parse(process.env.PAYMENT_WEBHOOK_SECRETS_JSON ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length >= 16));
  } catch {
    return {} as Record<string, string>;
  }
}

export function webhookSecretForProvider(provider: string) {
  return webhookSecrets()[provider] ?? null;
}

type CanonicalWebhook = {
  eventId: string;
  type: "payment.authorized" | "payment.captured" | "payment.failed" | "refund.succeeded" | "refund.failed";
  paymentIntentId: string;
  providerReference?: string;
  amountMinor?: number;
  refundId?: string;
  failureCode?: string;
  failureMessage?: string;
  retryable?: boolean;
};

export async function processCanonicalWebhook(provider: string, body: CanonicalWebhook, signatureHash?: string) {
  if (!body.eventId || !body.type || !body.paymentIntentId) throw new AppError("BAD_REQUEST", "Webhook envelope is incomplete", 400);
  const rawPayload = canonicalWebhookPayload(body);
  const payloadHash = createHash("sha256").update(rawPayload).digest("hex");

  let event = await db.paymentWebhookEvent.findUnique({ where: { provider_eventId: { provider, eventId: body.eventId } } });
  if (event) {
    if (event.payloadHash !== payloadHash) throw new AppError("CONFLICT", "Webhook event id was reused with a different payload", 409);
    if (["PROCESSED", "REJECTED"].includes(event.status)) return { duplicate: true, status: event.status };
    event = await db.paymentWebhookEvent.update({ where: { id: event.id }, data: { status: "VERIFIED", signatureHash: signatureHash ?? event.signatureHash, verifiedAt: new Date(), errorMessage: null } });
  } else {
    try {
      event = await db.paymentWebhookEvent.create({ data: { provider, eventId: body.eventId, eventType: body.type, status: "VERIFIED", signatureHash, payloadHash, payload: body as Prisma.InputJsonValue, verifiedAt: new Date() } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await db.paymentWebhookEvent.findUnique({ where: { provider_eventId: { provider, eventId: body.eventId } } });
        if (!raced) throw error;
        if (raced.payloadHash !== payloadHash) throw new AppError("CONFLICT", "Webhook event id was reused with a different payload", 409);
        if (["PROCESSED", "REJECTED"].includes(raced.status)) return { duplicate: true, status: raced.status };
        event = raced;
      } else {
        throw error;
      }
    }
  }

  try {
    return await db.$transaction(async (tx) => {
      const intent = await tx.paymentIntent.findUnique({ where: { id: body.paymentIntentId }, include: { order: true } });
      if (!intent) throw new AppError("NOT_FOUND", "Payment intent not found", 404);
      if (intent.provider && intent.provider !== provider && intent.provider !== "PAY_ON_DELIVERY") throw new AppError("CONFLICT", "Webhook provider does not match this payment intent", 409);

      const amount = body.amountMinor == null ? intent.amountMinor : BigInt(body.amountMinor);
      if (amount < 0n) throw new AppError("BAD_REQUEST", "Webhook amount is invalid", 400);
      if ((body.type === "payment.authorized" || body.type === "payment.captured") && amount <= 0n) throw new AppError("BAD_REQUEST", "Authorization/capture amount must be positive", 400);

      if (body.type === "payment.authorized") {
        const duplicateAuthorization = body.providerReference ? await tx.paymentAuthorization.findFirst({ where: { paymentIntentId: intent.id, providerReference: body.providerReference, status: { in: ["AUTHORIZED", "CAPTURED"] } } }) : null;
        if (duplicateAuthorization) {
          await tx.paymentWebhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null } });
          return { duplicate: true, status: "PROCESSED" as const };
        }
        const authorizations = await tx.paymentAuthorization.aggregate({ where: { paymentIntentId: intent.id, status: { in: ["AUTHORIZED", "CAPTURED"] } }, _sum: { amountMinor: true } });
        if ((authorizations._sum.amountMinor ?? 0n) + amount > intent.amountMinor) throw new AppError("CONFLICT", "Authorization would exceed the payment intent amount", 409);
        await tx.paymentAuthorization.create({ data: { paymentIntentId: intent.id, providerReference: body.providerReference, amountMinor: amount, currency: intent.currency, status: "AUTHORIZED" } });
        await tx.paymentIntent.update({ where: { id: intent.id }, data: { status: "REQUIRES_CAPTURE", provider, providerReference: body.providerReference ?? intent.providerReference, lastErrorCode: null, lastErrorMessage: null } });
        await tx.shoppingOrder.update({ where: { id: intent.orderId }, data: { paymentStatus: "AUTHORIZED" } });
        if (intent.legacyPaymentId) await tx.payment.update({ where: { id: intent.legacyPaymentId }, data: { status: "AUTHORIZED", provider, providerReference: body.providerReference } });
        await appendOutboxEvent(tx, { aggregateType: "PaymentIntent", aggregateId: intent.id, eventType: "PaymentAuthorized", payload: { paymentIntentId: intent.id, orderId: intent.orderId, amountMinor: String(amount) } });
      } else if (body.type === "payment.captured") {
        const duplicateCapture = body.providerReference ? await tx.paymentCapture.findFirst({ where: { paymentIntentId: intent.id, providerReference: body.providerReference, status: "SUCCEEDED" } }) : null;
        if (duplicateCapture) {
          await tx.paymentWebhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null } });
          return { duplicate: true, status: "PROCESSED" as const };
        }
        const nextCaptured = intent.capturedMinor + amount;
        if (nextCaptured > intent.amountMinor) throw new AppError("CONFLICT", "Capture would exceed the payment intent amount", 409);
        const pendingAttempt = await tx.paymentAttempt.findFirst({ where: { paymentIntentId: intent.id, provider, status: { in: ["CREATED", "PENDING"] }, ...(body.providerReference ? { OR: [{ providerReference: body.providerReference }, { providerReference: null }] } : {}) }, orderBy: { attemptNumber: "desc" } });
        await tx.paymentCapture.create({ data: { paymentIntentId: intent.id, paymentAttemptId: pendingAttempt?.id, providerReference: body.providerReference, amountMinor: amount, currency: intent.currency, status: "SUCCEEDED", processedAt: new Date() } });
        if (pendingAttempt) await tx.paymentAttempt.update({ where: { id: pendingAttempt.id }, data: { status: "SUCCEEDED", providerReference: body.providerReference ?? pendingAttempt.providerReference, completedAt: new Date(), nextRetryAt: null } });
        const succeeded = nextCaptured >= intent.amountMinor;
        await tx.paymentIntent.update({ where: { id: intent.id }, data: { capturedMinor: nextCaptured, status: succeeded ? "SUCCEEDED" : "PROCESSING", provider, providerReference: body.providerReference ?? intent.providerReference, succeededAt: succeeded ? new Date() : null } });
        if (succeeded) {
          await tx.shoppingOrder.update({ where: { id: intent.orderId }, data: { paymentStatus: "PAID" } });
          if (intent.legacyPaymentId) await tx.payment.update({ where: { id: intent.legacyPaymentId }, data: { status: "CAPTURED", provider, providerReference: body.providerReference } });
          await queueNotificationTx(tx, { userId: intent.order.userId, category: "PAYMENT", title: "Payment confirmed", body: `Payment for order ${intent.order.orderNumber} was confirmed securely by the payment provider.`, resourceType: "ShoppingOrder", resourceId: intent.orderId, channels: ["PUSH", "EMAIL"] });
        }
        await appendOutboxEvent(tx, { aggregateType: "PaymentIntent", aggregateId: intent.id, eventType: "PaymentCaptured", payload: { paymentIntentId: intent.id, orderId: intent.orderId, amountMinor: String(amount), capturedMinor: String(nextCaptured) } });
      } else if (body.type === "payment.failed") {
        const pendingAttempt = await tx.paymentAttempt.findFirst({ where: { paymentIntentId: intent.id, provider, status: { in: ["CREATED", "PENDING"] }, ...(body.providerReference ? { OR: [{ providerReference: body.providerReference }, { providerReference: null }] } : {}) }, orderBy: { attemptNumber: "desc" } });
        if (pendingAttempt) await tx.paymentAttempt.update({ where: { id: pendingAttempt.id }, data: { status: "FAILED", providerReference: body.providerReference ?? pendingAttempt.providerReference, completedAt: new Date(), nextRetryAt: body.retryable ? paymentRetryAt(pendingAttempt.attemptNumber) : null } });
        await tx.paymentFailure.create({ data: { paymentIntentId: intent.id, paymentAttemptId: pendingAttempt?.id, stage: "PROVIDER_WEBHOOK", code: body.failureCode ?? "PROVIDER_FAILURE", message: body.failureMessage ?? "Provider reported payment failure", retryable: body.retryable ?? false } });
        await tx.paymentIntent.update({ where: { id: intent.id }, data: { status: "FAILED", provider, lastErrorCode: body.failureCode ?? "PROVIDER_FAILURE", lastErrorMessage: body.failureMessage ?? "Provider reported payment failure" } });
        await tx.shoppingOrder.update({ where: { id: intent.orderId }, data: { paymentStatus: "FAILED" } });
        if (intent.legacyPaymentId) await tx.payment.update({ where: { id: intent.legacyPaymentId }, data: { status: "FAILED", provider } });
        await queueNotificationTx(tx, { userId: intent.order.userId, category: "PAYMENT", title: "Payment needs attention", body: `Payment for order ${intent.order.orderNumber} was not confirmed. You can retry securely from your order.`, resourceType: "ShoppingOrder", resourceId: intent.orderId, channels: ["PUSH"] });
        await appendOutboxEvent(tx, { aggregateType: "PaymentIntent", aggregateId: intent.id, eventType: "PaymentFailed", payload: { paymentIntentId: intent.id, orderId: intent.orderId, code: body.failureCode ?? "PROVIDER_FAILURE", retryable: body.retryable ?? false } });
      } else {
        if (!body.refundId) throw new AppError("BAD_REQUEST", "Refund webhook requires refundId", 400);
        const refund = await tx.paymentRefund.findFirst({ where: { id: body.refundId, paymentIntentId: intent.id } });
        if (!refund) throw new AppError("NOT_FOUND", "Refund not found", 404);
        if (body.type === "refund.failed") {
          await tx.paymentRefund.update({ where: { id: refund.id }, data: { status: "FAILED", lastError: body.failureMessage ?? "Provider reported refund failure", processedAt: new Date(), provider, providerReference: body.providerReference ?? refund.providerReference } });
          await tx.paymentFailure.create({ data: { paymentIntentId: intent.id, stage: "REFUND_WEBHOOK", code: body.failureCode ?? "REFUND_FAILED", message: body.failureMessage ?? "Provider reported refund failure", retryable: body.retryable ?? false, metadata: { refundId: refund.id } } });
          await appendOutboxEvent(tx, { aggregateType: "PaymentRefund", aggregateId: refund.id, eventType: "RefundFailed", payload: { refundId: refund.id, paymentIntentId: intent.id, orderId: intent.orderId, retryable: body.retryable ?? false } });
        } else if (refund.status !== "SUCCEEDED") {
          const refundedMinor = intent.refundedMinor + refund.amountMinor;
          if (refundedMinor > intent.capturedMinor) throw new AppError("CONFLICT", "Refund completion would exceed the captured payment amount", 409);
          const fullyRefunded = refundedMinor >= intent.capturedMinor && intent.capturedMinor > 0n;
          await tx.paymentRefund.update({ where: { id: refund.id }, data: { status: "SUCCEEDED", processedAt: new Date(), provider, providerReference: body.providerReference ?? refund.providerReference } });
          await tx.paymentIntent.update({ where: { id: intent.id }, data: { refundedMinor, status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
          await tx.shoppingOrder.update({ where: { id: intent.orderId }, data: { paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED", ...(fullyRefunded ? { status: "REFUNDED" } : {}) } });
          if (intent.legacyPaymentId) await tx.payment.update({ where: { id: intent.legacyPaymentId }, data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
          await queueNotificationTx(tx, { userId: intent.order.userId, category: "REFUND", title: fullyRefunded ? "Refund completed" : "Partial refund completed", body: `A refund for order ${intent.order.orderNumber} was confirmed by the payment provider.`, resourceType: "ShoppingOrder", resourceId: intent.orderId, channels: ["PUSH", "EMAIL"] });
          if (refund.shoppingReturnId) {
            const returnCase = await tx.shoppingReturn.findUnique({ where: { id: refund.shoppingReturnId } });
            if (returnCase) {
              const approved = returnCase.approvedRefundMinor ?? returnCase.requestedRefundMinor ?? refund.amountMinor;
              const refundRows = await tx.paymentRefund.findMany({ where: { shoppingReturnId: returnCase.id, status: "SUCCEEDED" }, select: { amountMinor: true } });
              const returnRefunded = refundRows.reduce((total, row) => total + row.amountMinor, 0n);
              const returnComplete = returnRefunded >= approved;
              await tx.shoppingReturn.update({ where: { id: returnCase.id }, data: { status: returnComplete ? "REFUNDED" : "PARTIALLY_REFUNDED", resolvedAt: returnComplete ? new Date() : null } });
              await tx.shoppingReturnEvent.create({ data: { returnId: returnCase.id, type: returnComplete ? "REFUND_COMPLETED" : "PARTIAL_REFUND_COMPLETED", fromStatus: returnCase.status, toStatus: returnComplete ? "REFUNDED" : "PARTIALLY_REFUNDED", metadata: { refundId: refund.id, amountMinor: String(refund.amountMinor) } } });
              await reconcileReturnParentStateTx(tx, returnCase.orderId, returnCase.sellerOrderId);
            }
          }
          await appendOutboxEvent(tx, { aggregateType: "PaymentRefund", aggregateId: refund.id, eventType: "RefundCompleted", payload: { refundId: refund.id, paymentIntentId: intent.id, orderId: intent.orderId, amountMinor: String(refund.amountMinor) } });
        }
      }
      await tx.paymentWebhookEvent.update({ where: { id: event!.id }, data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null } });
      return { duplicate: false, status: "PROCESSED" };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Webhook processing failed";
    const status = error instanceof AppError && error.statusCode === 409 ? "REJECTED" : "FAILED";
    await db.paymentWebhookEvent.update({ where: { id: event.id }, data: { status, errorMessage: message } }).catch(() => undefined);
    throw error;
  }
}

export async function createReconciliation(input: { paymentIntentId?: string; provider: string; providerReference?: string; reportedStatus: string; reportedAmountMinor?: number; reportedCurrency?: string; source: string; actorUserId?: string }) {
  const intent = input.paymentIntentId ? await db.paymentIntent.findUnique({ where: { id: input.paymentIntentId } }) : null;
  if (input.paymentIntentId && !intent) throw new AppError("NOT_FOUND", "Payment intent not found", 404);
  const expectedAmountMinor = intent?.amountMinor ?? null;
  const reported = input.reportedAmountMinor == null ? null : BigInt(input.reportedAmountMinor);
  const difference = expectedAmountMinor != null && reported != null ? reported - expectedAmountMinor : null;
  const row = await db.paymentReconciliation.create({ data: { paymentIntentId: intent?.id ?? null, provider: input.provider, providerReference: input.providerReference, reportedStatus: input.reportedStatus, reportedAmountMinor: reported, expectedAmountMinor, differenceMinor: difference, reportedCurrency: input.reportedCurrency?.toUpperCase(), expectedCurrency: intent?.currency?.toUpperCase() ?? null, source: input.source, actorUserId: input.actorUserId } });
  return { reconciliation: { ...row, reportedAmountMinor: money(row.reportedAmountMinor), expectedAmountMinor: money(row.expectedAmountMinor), differenceMinor: money(row.differenceMinor) } };
}

export async function resolveReconciliation(id: string, actorUserId: string, resolutionNotes: string) {
  const existing = await db.paymentReconciliation.findUnique({ where: { id } });
  if (!existing) throw new AppError("NOT_FOUND", "Reconciliation record not found", 404);
  const row = await db.paymentReconciliation.update({ where: { id }, data: { resolvedAt: new Date(), resolutionNotes, actorUserId } });
  return { reconciliation: { ...row, reportedAmountMinor: money(row.reportedAmountMinor), expectedAmountMinor: money(row.expectedAmountMinor), differenceMinor: money(row.differenceMinor) } };
}
