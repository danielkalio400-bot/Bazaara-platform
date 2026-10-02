import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { audit } from "../audit.js";
import { listNotificationPreferences, listNotifications, markNotificationRead, processNotificationDeliveries, registerPushToken, revokePushToken, setNotificationPreference } from "./service.js";

const preferenceSchema = z.object({ enabled: z.boolean() });
const preferenceParamsSchema = z.object({
  category: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_.:-]+$/),
  channel: z.enum(["IN_APP", "PUSH", "EMAIL", "SMS"]),
});
const pushTokenSchema = z.object({ token: z.string().trim().min(20).max(512), platform: z.enum(["android", "ios"]), deviceId: z.string().trim().max(160).optional() });

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/v1/notifications", async (request) => {
    const auth = await requireAuth(request);
    const query = request.query as { limit?: string };
    return listNotifications(auth.userId, query.limit ? Number(query.limit) : undefined);
  });

  app.patch("/v1/notifications/:notificationId/read", async (request) => {
    const auth = await requireAuth(request);
    const { notificationId } = request.params as { notificationId: string };
    return markNotificationRead(auth.userId, notificationId);
  });

  app.get("/v1/notifications/preferences", async (request) => {
    const auth = await requireAuth(request);
    return listNotificationPreferences(auth.userId);
  });

  app.put("/v1/notifications/preferences/:category/:channel", async (request) => {
    const auth = await requireAuth(request);
    const { category, channel } = preferenceParamsSchema.parse(request.params);
    const input = preferenceSchema.parse(request.body);
    const preference = await setNotificationPreference(auth.userId, category.toUpperCase(), channel, input.enabled);
    return { preference };
  });

  app.post("/v1/notifications/push-tokens", { config: { rateLimit: { max: 20, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const auth = await requireAuth(request);
    const input = pushTokenSchema.parse(request.body);
    const result = await registerPushToken(auth.userId, input);
    return reply.code(201).send(result);
  });

  app.delete("/v1/notifications/push-tokens/:id", async (request) => {
    const auth = await requireAuth(request);
    const { id } = request.params as { id: string };
    return revokePushToken(auth.userId, id);
  });

  app.post("/v1/admin/notifications/process", async (request) => {
    const auth = await requirePermission(request, "support.manage");
    const body = z.object({ limit: z.coerce.number().int().min(1).max(100).default(25) }).parse(request.body ?? {});
    const result = await processNotificationDeliveries(body.limit);
    await audit({ actorUserId: auth.userId, action: "notification.delivery.processed", resourceType: "NotificationDelivery", requestId: request.id, ipAddress: request.ip, metadata: { processed: result.processed } });
    return result;
  });
}
