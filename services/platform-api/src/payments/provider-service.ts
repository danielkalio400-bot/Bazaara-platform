import { createHash } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { appendOutboxEvent } from "../outbox.js";
import { beginPaymentAttempt, createReconciliation, failPaymentAttempt, getPaymentIntentForOrder, processCanonicalWebhook } from "./orchestration.js";
import { paymentProvider } from "./registry.js";
import { compareProviderCapture } from "./provider.js";

function money(value: bigint) {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Money value exceeds safe JSON integer range");
  return n;
}

function safeJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export async function initializeOrderPayment(input: { userId: string; orderId: string; idempotencyKey: string; returnOrigin?: string }) {
  const order = await db.shoppingOrder.findFirst({
    where: { id: input.orderId, userId: input.userId },
    include: {
      paymentIntent: { include: { attempts: { orderBy: { attemptNumber: "desc" }, take: 5 } } },
      user: { include: { emails: { where: { isPrimary: true }, take: 1 } } },
    },
  });
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  if (!order.paymentIntent) throw new AppError("CONFLICT", "Payment intent is missing for this order", 409);
  if (order.paymentMethod === "PAY_ON_DELIVERY") throw new AppError("CONFLICT", "Pay-on-delivery orders do not require online payment initialization", 409);
  if (order.paymentIntent.status === "SUCCEEDED" || order.paymentStatus === "PAID") {
    return { alreadyPaid: true, paymentIntent: await getPaymentIntentForOrder(order.id), checkoutUrl: null };
  }
  if (["CANCELLED", "REFUNDED"].includes(order.paymentIntent.status)) throw new AppError("CONFLICT", "This payment can no longer be initialized", 409);

  const provider = paymentProvider("PAYSTACK");
  if (!provider) throw new AppError("CONFLICT", "Online payments are not configured on this server", 409);
  const email = order.user.emails[0]?.email;
  if (!email) throw new AppError("CONFLICT", "A primary BazID email is required for online payment", 409);

  const begun = await beginPaymentAttempt({
    paymentIntentId: order.paymentIntent.id,
    provider: provider.key,
    idempotencyKey: input.idempotencyKey,
    requestPayload: { orderId: order.id, paymentMethod: order.paymentMethod },
  });

  if (begun.replayed) {
    const replay = await db.paymentAttempt.findUnique({ where: { id: begun.attempt.id } });
    const payload = replay?.responsePayload as { checkoutUrl?: string } | null;
    if (payload?.checkoutUrl && replay?.providerReference) {
      return { alreadyPaid: false, replayed: true, checkoutUrl: payload.checkoutUrl, paymentIntent: await getPaymentIntentForOrder(order.id) };
    }
    if (replay?.status === "FAILED") throw new AppError("CONFLICT", "The previous payment initialization failed. Retry with a new idempotency key", 409);
    throw new AppError("CONFLICT", "This payment initialization is still being processed", 409);
  }

  try {
    const channels = order.paymentMethod === "PAYSTACK_CARD" ? ["card"] : ["bank", "bank_transfer", "ussd"];
    const callbackBase = (input.returnOrigin ?? env.PAYSTACK_CALLBACK_BASE_URL).replace(/\/$/, "");
    const result = await provider.createPayment({
      paymentIntentId: order.paymentIntent.id,
      amountMinor: money(order.paymentIntent.amountMinor),
      currency: order.paymentIntent.currency,
      paymentMethod: order.paymentMethod,
      idempotencyKey: input.idempotencyKey,
      customerEmail: email,
      callbackUrl: `${callbackBase}/orders/${encodeURIComponent(order.id)}?payment=return`,
      channels,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, userId: input.userId },
    });
    if (!result.checkoutUrl) throw new Error("Paystack did not return a checkout URL");

    await db.$transaction(async (tx) => {
      await tx.paymentAttempt.update({
        where: { id: begun.attempt.id },
        data: {
          status: "PENDING",
          providerReference: result.providerReference,
          responsePayload: safeJson({ checkoutUrl: result.checkoutUrl, accessCode: result.accessCode, raw: result.raw }),
        },
      });
      await tx.paymentIntent.update({
        where: { id: order.paymentIntent!.id },
        data: { provider: provider.key, providerReference: result.providerReference, status: "REQUIRES_ACTION", lastErrorCode: null, lastErrorMessage: null },
      });
      if (order.paymentId) await tx.payment.update({ where: { id: order.paymentId }, data: { provider: provider.key, providerReference: result.providerReference, status: "PENDING" } });
      await appendOutboxEvent(tx, {
        aggregateType: "PaymentIntent",
        aggregateId: order.paymentIntent!.id,
        eventType: "PaymentActionRequired",
        payload: { paymentIntentId: order.paymentIntent!.id, orderId: order.id, provider: provider.key, providerReference: result.providerReference },
      });
    });

    return { alreadyPaid: false, replayed: false, checkoutUrl: result.checkoutUrl, paymentIntent: await getPaymentIntentForOrder(order.id) };
  } catch (cause) {
    const statusCode = Number((cause as { statusCode?: number } | null)?.statusCode ?? 0);
    const retryable = statusCode === 0 || statusCode >= 500 || statusCode === 429;
    await failPaymentAttempt({
      paymentAttemptId: begun.attempt.id,
      code: retryable ? "PROVIDER_TEMPORARY_FAILURE" : "PROVIDER_REJECTED",
      message: cause instanceof Error ? cause.message : "Payment provider request failed",
      retryable,
    }).catch(() => undefined);
    throw new AppError("CONFLICT", cause instanceof Error ? cause.message : "Payment provider request failed", 409);
  }
}

export async function reconcileOrderPayment(input: { userId?: string; orderId: string; operations?: boolean }) {
  const order = await db.shoppingOrder.findFirst({
    where: { id: input.orderId, ...(input.operations ? {} : { userId: input.userId }) },
    include: { paymentIntent: true },
  });
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  const intent = order.paymentIntent;
  if (!intent) throw new AppError("CONFLICT", "Payment intent is missing", 409);
  if (!intent.providerReference || !intent.provider) return { paymentIntent: await getPaymentIntentForOrder(order.id), reconciled: false };
  const provider = paymentProvider(intent.provider);
  if (!provider?.reconcile) throw new AppError("CONFLICT", "This payment provider does not support reconciliation", 409);

  const result = await provider.reconcile(intent.providerReference);
  const reportedAmountMinor = result.amountMinor;
  const reportedCurrency = result.currency?.toUpperCase();
  const expectedAmountMinor = money(intent.amountMinor);
  const expectedCurrency = intent.currency.toUpperCase();
  const reconciliation = await createReconciliation({
    paymentIntentId: intent.id,
    provider: provider.key,
    providerReference: result.providerReference,
    reportedStatus: result.status,
    reportedAmountMinor: reportedAmountMinor,
    reportedCurrency,
    source: input.operations ? "OPERATIONS_PROVIDER_VERIFY" : "CUSTOMER_PROVIDER_VERIFY",
    actorUserId: input.operations ? input.userId : undefined,
  });

  if (result.status === "CAPTURED") {
    const comparison = compareProviderCapture({ expectedAmountMinor, expectedCurrency, reportedAmountMinor, reportedCurrency });
    const partiallyRecorded = intent.capturedMinor > 0n && intent.capturedMinor < intent.amountMinor;

    // Never promote payment state from provider verification unless the provider's
    // authoritative amount and currency exactly match the intent. A partial local
    // capture is also treated as a discrepancy because silently filling the remainder
    // could double-book an earlier event from the same transaction. Operations can
    // inspect and resolve the reconciliation record instead.
    if (!comparison.matches || partiallyRecorded) {
      return {
        paymentIntent: await getPaymentIntentForOrder(order.id),
        reconciled: true,
        mismatch: true,
        reconciliation: reconciliation.reconciliation,
        discrepancy: {
          ...comparison,
          partiallyRecorded,
        },
      };
    }

    if (intent.capturedMinor === 0n) {
      await processCanonicalWebhook(provider.key, {
        eventId: `reconcile:${result.providerReference}:captured`,
        type: "payment.captured",
        paymentIntentId: intent.id,
        providerReference: result.providerReference,
        amountMinor: reportedAmountMinor!,
      });
    }
  } else if (result.status === "FAILED" && intent.status !== "FAILED") {
    await processCanonicalWebhook(provider.key, {
      eventId: `reconcile:${result.providerReference}:failed`,
      type: "payment.failed",
      paymentIntentId: intent.id,
      providerReference: result.providerReference,
      failureCode: "PROVIDER_VERIFICATION_FAILED",
      failureMessage: result.errorMessage ?? "Provider verification reported a failed payment",
      retryable: false,
    });
  }
  return { paymentIntent: await getPaymentIntentForOrder(order.id), reconciled: true, mismatch: false, reconciliation: reconciliation.reconciliation };
}

export async function processQueuedRefund(refundId: string) {
  const refund = await db.paymentRefund.findUnique({ where: { id: refundId }, include: { paymentIntent: true } });
  if (!refund) throw new AppError("NOT_FOUND", "Refund not found", 404);
  if (refund.status === "SUCCEEDED") return { refund, alreadyProcessed: true };
  if (!["PENDING", "FAILED"].includes(refund.status)) throw new AppError("CONFLICT", `Refund in ${refund.status} cannot be sent to the provider`, 409);
  if (refund.attemptCount >= 5) throw new AppError("CONFLICT", "Refund retry limit reached; Operations reconciliation is required", 409);
  const provider = refund.paymentIntent.provider ? paymentProvider(refund.paymentIntent.provider) : null;
  if (!provider) throw new AppError("CONFLICT", "Refund provider is not configured", 409);
  if (!refund.paymentIntent.providerReference) throw new AppError("CONFLICT", "Original provider transaction reference is missing", 409);

  await db.paymentRefund.update({ where: { id: refund.id }, data: { status: "PROCESSING", attemptCount: { increment: 1 }, lastError: null, provider: provider.key } });
  try {
    const result = await provider.requestRefund({
      paymentIntentId: refund.paymentIntentId,
      refundId: refund.id,
      providerReference: refund.paymentIntent.providerReference,
      amountMinor: money(refund.amountMinor),
      currency: refund.currency,
      idempotencyKey: refund.idempotencyKey,
      reason: refund.reason,
    });
    const saved = await db.paymentRefund.update({ where: { id: refund.id }, data: { status: "PROCESSING", provider: provider.key, providerReference: result.providerReference, lastError: null } });
    return { refund: saved, alreadyProcessed: false };
  } catch (cause) {
    const statusCode = Number((cause as { statusCode?: number } | null)?.statusCode ?? 0);
    const retryable = statusCode === 0 || statusCode >= 500 || statusCode === 429;
    const saved = await db.paymentRefund.update({
      where: { id: refund.id },
      data: { status: retryable ? "PENDING" : "FAILED", lastError: cause instanceof Error ? cause.message.slice(0, 1000) : "Refund provider request failed" },
    });
    return { refund: saved, alreadyProcessed: false, retryable };
  }
}

export type PaystackWebhookBody = {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    amount?: number | string;
    currency?: string;
    status?: string;
    transaction_reference?: string;
    refund_reference?: string | null;
    gateway_response?: string | null;
    transfer_code?: string;
    reason?: string;
  };
};

export async function processPaystackWebhook(body: PaystackWebhookBody, signature: string) {
  const eventType = body.event ?? "";
  const data = body.data ?? {};
  const transactionReference = data.reference ?? data.transaction_reference;
  if (!transactionReference) return { ignored: true, reason: "No transaction reference" };
  const intent = await db.paymentIntent.findFirst({ where: { provider: "PAYSTACK", providerReference: String(transactionReference) } });
  if (!intent) return { ignored: true, reason: "Unknown transaction reference" };
  const signatureHash = createHash("sha256").update(signature).digest("hex");
  const eventId = `paystack:${eventType}:${String(data.id ?? data.refund_reference ?? transactionReference)}:${String(data.status ?? "")}`;
  const amount = data.amount == null ? money(intent.amountMinor) : Number(data.amount);

  if (eventType === "charge.success") {
    const reportedCurrency = data.currency?.toUpperCase();
    const expectedCurrency = intent.currency.toUpperCase();
    const expectedAmountMinor = money(intent.amountMinor);
    const comparison = compareProviderCapture({
      expectedAmountMinor,
      expectedCurrency,
      reportedAmountMinor: Number.isSafeInteger(amount) ? amount : undefined,
      reportedCurrency,
    });
    if (!comparison.matches) {
      const reconciliation = await createReconciliation({
        paymentIntentId: intent.id,
        provider: "PAYSTACK",
        providerReference: String(transactionReference),
        reportedStatus: "CAPTURED_MISMATCH",
        reportedAmountMinor: Number.isSafeInteger(amount) ? amount : undefined,
        reportedCurrency,
        source: "PAYSTACK_WEBHOOK_MISMATCH",
      });
      return {
        ignored: true,
        reason: "Paystack capture amount/currency did not match the payment intent",
        mismatch: true,
        reconciliation: reconciliation.reconciliation,
      };
    }
    return processCanonicalWebhook("PAYSTACK", { eventId, type: "payment.captured", paymentIntentId: intent.id, providerReference: String(transactionReference), amountMinor: amount }, signatureHash);
  }

  if (eventType.startsWith("refund.")) {
    const refund = await db.paymentRefund.findFirst({
      where: {
        paymentIntentId: intent.id,
        status: { in: ["PENDING", "PROCESSING", "FAILED"] },
        ...(data.refund_reference ? { OR: [{ providerReference: data.refund_reference }, { providerReference: null }] } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
    if (!refund) return { ignored: true, reason: "No matching refund" };
    if (eventType === "refund.processed") {
      return processCanonicalWebhook("PAYSTACK", { eventId, type: "refund.succeeded", paymentIntentId: intent.id, providerReference: data.refund_reference ?? undefined, amountMinor: Number(data.amount ?? money(refund.amountMinor)), refundId: refund.id }, signatureHash);
    }
    if (eventType === "refund.failed") {
      return processCanonicalWebhook("PAYSTACK", { eventId, type: "refund.failed", paymentIntentId: intent.id, providerReference: data.refund_reference ?? undefined, refundId: refund.id, failureCode: "PAYSTACK_REFUND_FAILED", failureMessage: data.gateway_response ?? "Paystack reported refund failure", retryable: false }, signatureHash);
    }
    return { ignored: true, reason: `Refund event ${eventType} is non-terminal` };
  }

  return { ignored: true, reason: `Unsupported Paystack event ${eventType}` };
}
