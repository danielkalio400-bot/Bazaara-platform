import type { FastifyRequest } from "fastify";
import { db } from "@bazaara/db";
import { sha256Base64Url } from "@bazaara/security";
import { env } from "./config.js";
import { AppError } from "./errors.js";

export type AuthContext = {
  userId: string;
  sessionId: string;
  verificationLevel: string;
  channel: "WEB" | "NATIVE";
  clientId?: string;
  scopes?: string[];
};

declare module "fastify" {
  interface FastifyRequest { auth?: AuthContext }
}

async function resolveBearerAuth(request: FastifyRequest): Promise<AuthContext | undefined> {
  const authorization = request.headers.authorization?.trim();
  if (!authorization?.toLowerCase().startsWith("bearer ")) return undefined;
  const raw = authorization.slice(7).trim();
  if (!raw) return undefined;

  const accessTokenHash = sha256Base64Url(raw);
  const session = await db.nativeSession.findUnique({
    where: { accessTokenHash },
    include: { user: { select: { id: true, status: true, verificationLevel: true } } },
  });

  if (
    !session ||
    session.status !== "ACTIVE" ||
    session.accessExpiresAt <= new Date() ||
    session.refreshExpiresAt <= new Date() ||
    session.user.status !== "ACTIVE"
  ) return undefined;

  request.auth = {
    userId: session.user.id,
    sessionId: session.id,
    verificationLevel: session.user.verificationLevel,
    channel: "NATIVE",
    clientId: session.clientId,
    scopes: session.scope.split(/\s+/).filter(Boolean),
  };

  void db.nativeSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  return request.auth;
}

async function resolveCookieAuth(request: FastifyRequest): Promise<AuthContext | undefined> {
  const raw = request.cookies[env.BAZID_COOKIE_NAME];
  if (!raw) return undefined;
  const tokenHash = sha256Base64Url(raw);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, status: true, verificationLevel: true } } },
  });
  if (!session || session.status !== "ACTIVE" || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return undefined;
  request.auth = {
    userId: session.user.id,
    sessionId: session.id,
    verificationLevel: session.user.verificationLevel,
    channel: "WEB",
  };
  void db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  return request.auth;
}

export async function resolveAuth(request: FastifyRequest): Promise<AuthContext | undefined> {
  return await resolveBearerAuth(request) ?? await resolveCookieAuth(request);
}

export async function requireAuth(request: FastifyRequest): Promise<AuthContext> {
  const auth = request.auth ?? await resolveAuth(request);
  if (!auth) throw new AppError("UNAUTHENTICATED", "Authentication required", 401);
  return auth;
}

export function requireNativeScope(auth: AuthContext, scope: string): void {
  if (auth.channel !== "NATIVE" || !auth.scopes?.includes(scope)) {
    throw new AppError("FORBIDDEN", `Native scope ${scope} is required`, 403);
  }
}
