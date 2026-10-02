import { createHash } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "./errors.js";

function stableHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload, (_, value) => typeof value === "bigint" ? value.toString() : value instanceof Date ? value.toISOString() : value)).digest("base64url");
}

function toJson(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJson);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toJson(item)]));
  }
  return String(value);
}

export async function withIdempotency<T>(input: {
  scope: string;
  key: string;
  actorId?: string;
  requestPayload: unknown;
  execute: () => Promise<{ statusCode: number; body: T }>;
  ttlHours?: number;
}): Promise<{ statusCode: number; body: T; replayed: boolean }> {
  const requestHash = stableHash(input.requestPayload);
  const actorId = input.actorId ?? null;
  const actorScope = input.actorId ?? "anonymous";
  const existing = await db.idempotencyRecord.findUnique({
    where: { scope_key_actorScope: { scope: input.scope, key: input.key, actorScope } },
  });
  if (existing) {
    if (existing.requestHash !== requestHash) throw new AppError("IDEMPOTENCY_CONFLICT", "Idempotency key was already used with different request data", 409);
    if (existing.responseCode && existing.responseBody) {
      return { statusCode: existing.responseCode, body: existing.responseBody as unknown as T, replayed: true };
    }
    throw new AppError("CONFLICT", "A request with this idempotency key is still being processed", 409);
  }

  await db.idempotencyRecord.create({
    data: {
      scope: input.scope,
      key: input.key,
      actorId,
      actorScope,
      requestHash,
      expiresAt: new Date(Date.now() + (input.ttlHours ?? 24) * 60 * 60 * 1000),
    },
  });

  try {
    const result = await input.execute();
    await db.idempotencyRecord.update({
      where: { scope_key_actorScope: { scope: input.scope, key: input.key, actorScope } },
      data: {
        responseCode: result.statusCode,
        responseBody: result.body === null ? Prisma.JsonNull : (toJson(result.body) as Prisma.InputJsonValue),
      },
    });
    return { ...result, replayed: false };
  } catch (error) {
    await db.idempotencyRecord.delete({ where: { scope_key_actorScope: { scope: input.scope, key: input.key, actorScope } } }).catch(() => undefined);
    throw error;
  }
}
