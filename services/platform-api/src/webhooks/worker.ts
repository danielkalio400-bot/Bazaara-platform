import { createHmac } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { env } from "../config.js";

export function webhookSigningSecret(endpointId: string) {
  if (!env.WEBHOOK_SIGNING_MASTER_SECRET) throw new Error("WEBHOOK_SIGNING_MASTER_SECRET is not configured");
  return createHmac("sha256", env.WEBHOOK_SIGNING_MASTER_SECRET)
    .update(`bazaara-webhook:${endpointId}`)
    .digest("base64url");
}

export function signWebhookPayload(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

function retryDelay(attempt: number) {
  return Math.min(6 * 60 * 60_000, 15_000 * 2 ** Math.min(10, Math.max(0, attempt - 1)));
}

function payloadObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function deliverOne(
  endpoint: { id: string; url: string; signingKeyId: string },
  event: { id: string; eventType: string; payload: Prisma.JsonValue; createdAt: Date },
) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({ id: event.id, type: event.eventType, createdAt: event.createdAt.toISOString(), data: event.payload });
  const secret = webhookSigningSecret(endpoint.id);
  const signature = signWebhookPayload(secret, timestamp, body);
  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Bazaara-Webhooks/1.0",
      "x-bazaara-event-id": event.id,
      "x-bazaara-key-id": endpoint.signingKeyId,
      "x-bazaara-timestamp": timestamp,
      "x-bazaara-signature": `v1=${signature}`,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Webhook endpoint returned HTTP ${response.status}`);
  return response.status;
}

async function recoverStaleClaims(log?: { warn: (obj: unknown, msg?: string) => void }) {
  const cutoff = new Date(Date.now() - env.OUTBOX_PROCESSING_TIMEOUT_MS);
  const recovered = await db.outboxEvent.updateMany({
    where: {
      status: "PROCESSING",
      OR: [
        { processingStartedAt: null },
        { processingStartedAt: { lt: cutoff } },
      ],
    },
    data: {
      status: "PENDING",
      processingStartedAt: null,
      availableAt: new Date(),
      lastError: "Recovered stale processing claim after worker interruption",
    },
  });
  if (recovered.count > 0) {
    log?.warn({ recovered: recovered.count, cutoff: cutoff.toISOString() }, "Recovered stale outbox claims");
  }
}

async function processNext(log?: {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
}) {
  const candidate = await db.outboxEvent.findFirst({
    where: { status: "PENDING", availableAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
  });
  if (!candidate) return false;

  const claimedAt = new Date();
  const claimed = await db.outboxEvent.updateMany({
    where: { id: candidate.id, status: "PENDING", availableAt: { lte: claimedAt } },
    data: { status: "PROCESSING", processingStartedAt: claimedAt, attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return true;

  const event = await db.outboxEvent.findUnique({ where: { id: candidate.id } });
  if (!event) return true;

  try {
    const payload = payloadObject(event.payload);
    const organizationId = typeof payload.organizationId === "string" ? payload.organizationId : null;
    const endpoints = organizationId
      ? await db.businessWebhookEndpoint.findMany({ where: { organizationId, status: "ACTIVE", events: { has: event.eventType } } })
      : [];

    for (const endpoint of endpoints) {
      const existing = await db.businessWebhookDelivery.findUnique({
        where: { endpointId_outboxEventId: { endpointId: endpoint.id, outboxEventId: event.id } },
      });

      // A retry of the outbox event must never redeliver to endpoints that have
      // already acknowledged the event. The endpoint/event unique key is the
      // durable duplicate-suppression boundary.
      if (existing?.status === "DELIVERED") continue;

      await db.outboxEvent.update({ where: { id: event.id }, data: { processingStartedAt: new Date() } });
      const attempt = (existing?.attempt ?? 0) + 1;
      try {
        const status = await deliverOne(endpoint, event);
        await db.businessWebhookDelivery.upsert({
          where: { endpointId_outboxEventId: { endpointId: endpoint.id, outboxEventId: event.id } },
          create: {
            endpointId: endpoint.id,
            outboxEventId: event.id,
            attempt,
            status: "DELIVERED",
            responseStatus: status,
            deliveredAt: new Date(),
          },
          update: {
            attempt,
            status: "DELIVERED",
            responseStatus: status,
            lastError: null,
            nextAttemptAt: null,
            deliveredAt: new Date(),
          },
        });
        await db.businessWebhookEndpoint.update({ where: { id: endpoint.id }, data: { failureCount: 0 } });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const nextAttemptAt = new Date(Date.now() + retryDelay(attempt));
        await db.businessWebhookDelivery.upsert({
          where: { endpointId_outboxEventId: { endpointId: endpoint.id, outboxEventId: event.id } },
          create: {
            endpointId: endpoint.id,
            outboxEventId: event.id,
            attempt,
            status: "FAILED",
            lastError: message,
            nextAttemptAt,
          },
          update: { attempt, status: "FAILED", lastError: message, nextAttemptAt },
        });
        await db.businessWebhookEndpoint.update({ where: { id: endpoint.id }, data: { failureCount: { increment: 1 } } });
        throw error;
      }
    }

    await db.outboxEvent.update({
      where: { id: event.id },
      data: { status: "PUBLISHED", processingStartedAt: null, publishedAt: new Date(), lastError: null },
    });
    log?.info({ eventId: event.id, eventType: event.eventType, endpoints: endpoints.length }, "Outbox event published");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const exhausted = event.attempts >= 10;
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: exhausted ? "DEAD_LETTER" : "PENDING",
        processingStartedAt: null,
        lastError: message,
        availableAt: exhausted ? event.availableAt : new Date(Date.now() + retryDelay(event.attempts)),
      },
    });
    log?.warn({ eventId: event.id, attempt: event.attempts, error: message, deadLetter: exhausted }, "Outbox publication failed");
  }
  return true;
}

export function startOutboxWorker(input: {
  intervalMs: number;
  log?: {
    info: (obj: unknown, msg?: string) => void;
    warn: (obj: unknown, msg?: string) => void;
    error: (obj: unknown, msg?: string) => void;
  };
}) {
  let stopped = false;
  let running = false;
  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      await recoverStaleClaims(input.log);
      for (let i = 0; i < 25; i++) {
        if (!(await processNext(input.log))) break;
      }
    } catch (error) {
      input.log?.error({ error: error instanceof Error ? error.message : String(error) }, "Outbox worker tick failed");
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void tick(), input.intervalMs);
  timer.unref?.();
  void tick();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
