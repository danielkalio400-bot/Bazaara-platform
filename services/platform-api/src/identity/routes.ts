import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { env } from "../config.js";
import { audit } from "../audit.js";
import { requireAuth } from "../auth.js";
import { loginSchema, registerSchema } from "./schemas.js";
import { changePassword, loginWithEmail, registerWithEmail, revokeSession } from "./service.js";

function meta(request: FastifyRequest) {
  return { ipAddress: request.ip, userAgent: request.headers["user-agent"] };
}
function setSessionCookie(reply: any, rawToken: string, expiresAt: Date) {
  reply.setCookie(env.BAZID_COOKIE_NAME, rawToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

export async function identityRoutes(app: FastifyInstance) {
  app.post("/v1/bazid/register/email", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const { user, rawToken, session } = await registerWithEmail(input, meta(request));
    setSessionCookie(reply, rawToken, session.expiresAt);
    await audit({ actorUserId: user.id, action: "bazid.register", resourceType: "User", resourceId: user.id, requestId: request.id, ipAddress: request.ip });
    return reply.code(201).send({ user: { id: user.id, displayName: user.displayName, verificationLevel: user.verificationLevel } });
  });

  app.post("/v1/bazid/login/email", { config: { rateLimit: { max: 20, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const { user, rawToken, session } = await loginWithEmail(input, meta(request));
    setSessionCookie(reply, rawToken, session.expiresAt);
    await audit({ actorUserId: user.id, action: "bazid.login", resourceType: "Session", resourceId: session.id, requestId: request.id, ipAddress: request.ip });
    return { user: { id: user.id, displayName: user.displayName, verificationLevel: user.verificationLevel } };
  });

  app.post("/v1/bazid/logout", async (request, reply) => {
    const auth = await requireAuth(request);
    await revokeSession(auth.userId, auth.sessionId);
    reply.clearCookie(env.BAZID_COOKIE_NAME, { path: "/" });
    await audit({ actorUserId: auth.userId, action: "bazid.logout", resourceType: "Session", resourceId: auth.sessionId, requestId: request.id, ipAddress: request.ip });
    return reply.code(204).send();
  });

  app.get("/v1/bazid/me", async (request) => {
    const auth = await requireAuth(request);
    const user = await db.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: {
        id: true, displayName: true, locale: true, verificationLevel: true,
        emails: { select: { email: true, verifiedAt: true, isPrimary: true } },
        phones: { select: { e164: true, verifiedAt: true, isPrimary: true } },
      },
    });
    return { user };
  });

  app.patch("/v1/bazid/me", async (request) => {
    const auth = await requireAuth(request);
    const input = z.object({
      displayName: z.string().trim().max(100).optional(),
      locale: z.enum(["en-NG", "pcm-NG", "ha-NG", "yo-NG", "ig-NG", "ef-NG"]).optional(),
    }).parse(request.body);
    const user = await db.user.update({
      where: { id: auth.userId },
      data: {
        displayName: input.displayName === undefined ? undefined : input.displayName || null,
        locale: input.locale,
      },
      select: {
        id: true, displayName: true, locale: true, verificationLevel: true,
        emails: { select: { email: true, verifiedAt: true, isPrimary: true } },
        phones: { select: { e164: true, verifiedAt: true, isPrimary: true } },
      },
    });
    await audit({ actorUserId: auth.userId, action: "bazid.profile.updated", resourceType: "User", resourceId: auth.userId, requestId: request.id, ipAddress: request.ip });
    return { user };
  });

  app.post("/v1/bazid/password", async (request) => {
    const auth = await requireAuth(request);
    const input = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(12).max(256) }).parse(request.body);
    await changePassword(auth.userId, auth.sessionId, input.currentPassword, input.newPassword);
    await audit({ actorUserId: auth.userId, action: "bazid.password.changed", resourceType: "User", resourceId: auth.userId, requestId: request.id, ipAddress: request.ip });
    return { ok: true };
  });

  app.get("/v1/bazid/sessions", async (request) => {
    const auth = await requireAuth(request);
    const sessions = await db.session.findMany({
      where: { userId: auth.userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, createdAt: true, lastSeenAt: true, expiresAt: true, ipAddress: true, userAgent: true, deviceLabel: true },
    });
    return { sessions: sessions.map((s) => ({ ...s, current: s.id === auth.sessionId })) };
  });

  app.delete("/v1/bazid/sessions/:sessionId", async (request, reply) => {
    const auth = await requireAuth(request);
    const { sessionId } = request.params as { sessionId: string };
    await revokeSession(auth.userId, sessionId);
    await audit({ actorUserId: auth.userId, action: "bazid.session.revoke", resourceType: "Session", resourceId: sessionId, requestId: request.id, ipAddress: request.ip });
    if (sessionId === auth.sessionId) reply.clearCookie(env.BAZID_COOKIE_NAME, { path: "/" });
    return reply.code(204).send();
  });
}
