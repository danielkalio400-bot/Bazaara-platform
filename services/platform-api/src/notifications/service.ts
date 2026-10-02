import { db, Prisma } from "@bazaara/db";
import { env } from "../config.js";
import { AppError } from "../errors.js";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const MAX_DELIVERY_ATTEMPTS = 5;

type Channel = "IN_APP" | "PUSH" | "EMAIL" | "SMS";

function deliveryRetryAt(attempt: number, now = new Date()) {
  const delays = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000] as const;
  const index = Math.min(Math.max(attempt - 1, 0), delays.length - 1);
  const delay = delays[index] ?? 60_000;
  return new Date(now.getTime() + delay);
}

type NotificationInput = {
  userId: string;
  category: string;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
  mandatory?: boolean;
  channels?: Channel[];
};

function serialize(row: any) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    mandatory: row.mandatory,
    readAt: row.readAt,
    createdAt: row.createdAt,
    deliveries: row.deliveries ?? [],
  };
}

async function channelEnabled(tx: Prisma.TransactionClient, userId: string, category: string, channel: Channel, mandatory: boolean) {
  if (mandatory || channel === "IN_APP") return true;
  const pref = await tx.notificationPreference.findUnique({ where: { userId_category_channel: { userId, category, channel } } });
  return pref?.enabled ?? true;
}

export async function queueNotificationTx(tx: Prisma.TransactionClient, input: NotificationInput) {
  const channels = Array.from(new Set<Channel>(["IN_APP", ...(input.channels ?? ["PUSH", "EMAIL"])]));
  const user = await tx.user.findUnique({
    where: { id: input.userId },
    include: {
      emails: { where: { isPrimary: true }, take: 1 },
      phones: { where: { isPrimary: true }, take: 1 },
      pushDeviceTokens: { where: { enabled: true }, take: 20 },
    },
  });
  if (!user) throw new AppError("NOT_FOUND", "Notification user not found", 404);

  const notification = await tx.notification.create({
    data: {
      userId: input.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      mandatory: input.mandatory ?? false,
    },
  });

  for (const channel of channels) {
    const enabled = await channelEnabled(tx, input.userId, input.category, channel, Boolean(input.mandatory));
    let destination: string | null = null;
    let status: "PENDING" | "SENT" | "SUPPRESSED" = channel === "IN_APP" ? "SENT" : "PENDING";
    if (!enabled) status = "SUPPRESSED";
    if (channel === "EMAIL") destination = user.emails[0]?.email ?? null;
    if (channel === "SMS") destination = user.phones[0]?.e164 ?? null;
    if (channel === "PUSH") destination = user.pushDeviceTokens.map((row) => row.token).join(",") || null;
    if (channel !== "IN_APP" && !destination) status = "SUPPRESSED";
    await tx.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel,
        status,
        destination,
        provider: channel === "PUSH" ? "EXPO" : channel === "EMAIL" ? "EMAIL_WEBHOOK" : channel === "SMS" ? "SMS_WEBHOOK" : "IN_APP",
        ...(status === "SENT" ? { sentAt: new Date() } : {}),
      },
    });
  }
  return notification;
}

export async function queueNotification(input: NotificationInput) {
  return db.$transaction((tx) => queueNotificationTx(tx, input));
}

async function sendJson(url: string, token: string | undefined, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) throw new Error(payload?.message || `Notification adapter returned HTTP ${response.status}`);
  return payload;
}

async function deliver(row: any) {
  if (row.channel === "PUSH") {
    const tokens = String(row.destination ?? "").split(",").map((v) => v.trim()).filter(Boolean);
    if (!tokens.length) throw new Error("No enabled push token is registered");
    const payload = tokens.map((to) => ({ to, title: row.notification.title, body: row.notification.body, data: { notificationId: row.notification.id, resourceType: row.notification.resourceType, resourceId: row.notification.resourceId } }));
    const result = await sendJson(EXPO_PUSH_ENDPOINT, env.EXPO_PUSH_ACCESS_TOKEN, payload.length === 1 ? payload[0] : payload);
    return { providerReference: JSON.stringify(result?.data ?? result).slice(0, 500) };
  }
  if (row.channel === "EMAIL") {
    if (!env.NOTIFICATION_EMAIL_WEBHOOK_URL) throw new Error("Email notification adapter is not configured");
    const result = await sendJson(env.NOTIFICATION_EMAIL_WEBHOOK_URL, env.NOTIFICATION_EMAIL_WEBHOOK_TOKEN, { to: row.destination, title: row.notification.title, body: row.notification.body, category: row.notification.category, notificationId: row.notification.id });
    return { providerReference: String(result?.id ?? result?.reference ?? "email-webhook").slice(0, 240) };
  }
  if (row.channel === "SMS") {
    if (!env.NOTIFICATION_SMS_WEBHOOK_URL) throw new Error("SMS notification adapter is not configured");
    const result = await sendJson(env.NOTIFICATION_SMS_WEBHOOK_URL, env.NOTIFICATION_SMS_WEBHOOK_TOKEN, { to: row.destination, body: row.notification.body, category: row.notification.category, notificationId: row.notification.id });
    return { providerReference: String(result?.id ?? result?.reference ?? "sms-webhook").slice(0, 240) };
  }
  return { providerReference: "in-app" };
}

export async function processNotificationDeliveries(limit = 25) {
  const now = new Date();
  const rows = await db.notificationDelivery.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: MAX_DELIVERY_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: Math.min(100, Math.max(1, limit)),
    include: { notification: true },
  });
  const results: Array<{ id: string; status: string; error?: string }> = [];
  for (const row of rows) {
    const claimed = await db.notificationDelivery.updateMany({ where: { id: row.id, status: row.status }, data: { status: "PROCESSING", attempts: { increment: 1 }, lastError: null, nextAttemptAt: null } });
    if (claimed.count !== 1) continue;
    try {
      const result = await deliver(row);
      await db.notificationDelivery.update({ where: { id: row.id }, data: { status: "SENT", sentAt: new Date(), providerReference: result.providerReference, lastError: null, nextAttemptAt: null } });
      results.push({ id: row.id, status: "SENT" });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message.slice(0, 1000) : "Notification delivery failed";
      const attempt = row.attempts + 1;
      await db.notificationDelivery.update({
        where: { id: row.id },
        data: { status: "FAILED", lastError: message, nextAttemptAt: attempt < MAX_DELIVERY_ATTEMPTS ? deliveryRetryAt(attempt) : null },
      });
      results.push({ id: row.id, status: "FAILED", error: message });
    }
  }
  return { processed: results.length, deliveries: results };
}

export async function listNotifications(userId: string, limit = 50) {
  const rows = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: Math.min(100, Math.max(1, limit)), include: { deliveries: true } });
  return { notifications: rows.map(serialize), unread: rows.filter((row) => !row.readAt).length };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await db.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
  if (result.count !== 1) throw new AppError("NOT_FOUND", "Notification not found", 404);
  return { ok: true };
}

export async function listNotificationPreferences(userId: string) {
  const preferences = await db.notificationPreference.findMany({ where: { userId }, orderBy: [{ category: "asc" }, { channel: "asc" }] });
  return { preferences };
}

export async function setNotificationPreference(userId: string, category: string, channel: Channel, enabled: boolean) {
  if (channel === "IN_APP") throw new AppError("BAD_REQUEST", "In-app notifications cannot be disabled", 400);
  return db.notificationPreference.upsert({ where: { userId_category_channel: { userId, category, channel } }, update: { enabled }, create: { userId, category, channel, enabled } });
}

export async function registerPushToken(userId: string, input: { token: string; platform: string; deviceId?: string }) {
  if (!/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(input.token)) throw new AppError("BAD_REQUEST", "Push token format is invalid", 400);
  const existing = await db.pushDeviceToken.findUnique({ where: { token: input.token }, select: { id: true, userId: true } });
  if (existing && existing.userId !== userId) {
    throw new AppError("CONFLICT", "This push token is already registered to another BazID account", 409);
  }
  const row = existing
    ? await db.pushDeviceToken.update({ where: { id: existing.id }, data: { platform: input.platform, deviceId: input.deviceId, enabled: true, lastSeenAt: new Date() } })
    : await db.pushDeviceToken.create({ data: { userId, token: input.token, platform: input.platform, deviceId: input.deviceId, enabled: true } });
  return { token: { id: row.id, platform: row.platform, enabled: row.enabled, lastSeenAt: row.lastSeenAt } };
}

export async function revokePushToken(userId: string, id: string) {
  const result = await db.pushDeviceToken.updateMany({ where: { id, userId }, data: { enabled: false } });
  if (result.count !== 1) throw new AppError("NOT_FOUND", "Push device not found", 404);
  return { ok: true };
}
