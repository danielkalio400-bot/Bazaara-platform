import { Prisma, db } from "@bazaara/db";
import { constantTimeStringEqual, newOpaqueToken, sha256Base64Url } from "@bazaara/security";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { queueNotificationTx } from "../notifications/service.js";
import { issueOidcIdToken } from "./oidc.js";

export const NATIVE_CLIENTS = {
  "bazaara-shopping-mobile": { scheme: "bazaara-shopping", name: "Shopping", scopes: ["openid", "profile", "shopping"] },
  "bazaara-grocery-mobile": { scheme: "bazaara-grocery", name: "Grocery", scopes: ["openid", "profile", "grocery"] },
  "bazaara-food-mobile": { scheme: "bazaara-food", name: "Food", scopes: ["openid", "profile", "food"] },
  "bazaara-logistics-mobile": { scheme: "bazaara-logistics", name: "Logistics", scopes: ["openid", "profile", "logistics"] },
  "bazaara-logistics-courier-mobile": { scheme: "bazaara-courier", name: "GO", scopes: ["openid", "profile", "logistics.courier"] },
  "bazaara-drive-rider-mobile": { scheme: "bazaara-drive", name: "Drive", scopes: ["openid", "profile", "drive.rider"] },
  "bazaara-drive-driver-mobile": { scheme: "bazaara-drive-driver", name: "Drive Driver", scopes: ["openid", "profile", "drive.driver"] },
  "bazaara-pay-mobile": { scheme: "bazaara-pay", name: "Wallet", scopes: ["openid", "profile", "pay"] },
  "bazaara-business-mobile": { scheme: "bazaara-business", name: "Business", scopes: ["openid", "profile", "business"] },
  "bazaara-pharmacy-mobile": { scheme: "bazaara-pharmacy", name: "Pharmacy", scopes: ["openid", "profile", "pharmacy"] },
  "bazaara-bazasport-mobile": { scheme: "bazaara-sport", name: "Bazasport", scopes: ["openid", "profile", "sport"] },
} as const;

export type NativeClientId = keyof typeof NATIVE_CLIENTS;
export const SHOPPING_MOBILE_CLIENT_ID: NativeClientId = "bazaara-shopping-mobile";
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const CODE_TTL_SECONDS = 5 * 60;

function accessExpiry() { return new Date(Date.now() + ACCESS_TTL_SECONDS * 1000); }
function refreshExpiry() { return new Date(Date.now() + REFRESH_TTL_SECONDS * 1000); }
function getClient(clientId: string) {
  const client = NATIVE_CLIENTS[clientId as NativeClientId];
  if (!client) throw new AppError("INVALID_CLIENT", "Unknown BazID native client", 400);
  return client;
}

function isRegisteredRedirect(clientId: string, redirectUri: string) {
  const client = getClient(clientId);
  try {
    const url = new URL(redirectUri);
    if (url.protocol.toLowerCase() !== `${client.scheme}:`) return false;
    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return (host === "auth" && path === "/callback") || (!host && path === "/auth/callback");
  } catch {
    return false;
  }
}

export function validateNativeRedirect(clientId: string, redirectUri: string) {
  const client = getClient(clientId);
  const expoDevelopmentRedirect = /^exp:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2|(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.[^/]+)(?::\d+)?\/--\/auth\/callback(?:\?.*)?$/i;
  const isExpoDevelopmentRedirect = env.NODE_ENV === "development" && expoDevelopmentRedirect.test(redirectUri);
  if (!isRegisteredRedirect(clientId, redirectUri) && !isExpoDevelopmentRedirect) {
    throw new AppError("INVALID_REDIRECT_URI", `This redirect URI is not registered for ${client.name}`, 400);
  }
}

function validateScope(clientId: string, scope: string) {
  const client = getClient(clientId);
  const requested = scope.trim().split(/\s+/).filter(Boolean);
  if (requested.some((item) => !(client.scopes as readonly string[]).includes(item))) {
    throw new AppError("INVALID_SCOPE", "Requested BazID scope is not registered for this client", 400);
  }
  return requested.join(" ");
}

export async function issueNativeAuthorizationCode(input: {
  userId: string; clientId: string; redirectUri: string; codeChallenge: string;
  codeChallengeMethod: "S256"; scope: string;
}) {
  validateNativeRedirect(input.clientId, input.redirectUri);
  const scope = validateScope(input.clientId, input.scope);
  const rawCode = newOpaqueToken(32);
  await db.nativeAuthorizationCode.create({ data: {
    userId: input.userId, clientId: input.clientId, codeHash: sha256Base64Url(rawCode),
    redirectUri: input.redirectUri, codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod, scope,
    expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
  }});
  return rawCode;
}

async function tokenResponse(accessToken: string, refreshToken: string, scope: string, userId: string, clientId: string) {
  const id_token = await issueOidcIdToken({ userId, clientId, scope });
  return { access_token: accessToken, refresh_token: refreshToken, token_type: "Bearer" as const, expires_in: ACCESS_TTL_SECONDS, scope, ...(id_token ? { id_token } : {}) };
}

export async function exchangeNativeAuthorizationCode(input: {
  clientId: string; code: string; redirectUri: string; codeVerifier: string;
  deviceId?: string; deviceLabel?: string; userAgent?: string;
}) {
  validateNativeRedirect(input.clientId, input.redirectUri);
  const codeHash = sha256Base64Url(input.code);
  const record = await db.nativeAuthorizationCode.findUnique({ where: { codeHash } });
  if (!record || record.clientId !== input.clientId || record.redirectUri !== input.redirectUri || record.expiresAt <= new Date() || record.consumedAt) {
    throw new AppError("INVALID_GRANT", "Authorization code is invalid or expired", 400);
  }
  if (record.codeChallengeMethod !== "S256") throw new AppError("INVALID_GRANT", "Unsupported PKCE challenge method", 400);
  if (!constantTimeStringEqual(sha256Base64Url(input.codeVerifier), record.codeChallenge)) {
    throw new AppError("INVALID_GRANT", "PKCE verification failed", 400);
  }
  const client = getClient(record.clientId);
  const accessToken = newOpaqueToken(32);
  const refreshToken = newOpaqueToken(48);
  await db.$transaction(async (tx) => {
    const consumed = await tx.nativeAuthorizationCode.updateMany({ where: { id: record.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new AppError("INVALID_GRANT", "Authorization code was already used", 400);
    await tx.nativeSession.create({ data: {
      userId: record.userId, clientId: record.clientId, scope: record.scope,
      deviceId: input.deviceId, deviceLabel: input.deviceLabel, userAgent: input.userAgent,
      accessTokenHash: sha256Base64Url(accessToken), refreshTokenHash: sha256Base64Url(refreshToken),
      accessExpiresAt: accessExpiry(), refreshExpiresAt: refreshExpiry(),
    }});
    await queueNotificationTx(tx, {
      userId: record.userId, category: "SECURITY", title: `BazID sign-in on ${client.name}`,
      body: `A ${client.name} session was created${input.deviceLabel ? ` for ${input.deviceLabel}` : ""}. If this was not you, revoke the session in BazID security.`,
      mandatory: true, channels: ["EMAIL"],
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return tokenResponse(accessToken, refreshToken, record.scope, record.userId, record.clientId);
}

export async function refreshNativeSession(input: { clientId: string; refreshToken: string }) {
  getClient(input.clientId);
  const refreshTokenHash = sha256Base64Url(input.refreshToken);
  const session = await db.nativeSession.findUnique({ where: { refreshTokenHash } });
  if (!session || session.clientId !== input.clientId || session.status !== "ACTIVE" || session.refreshExpiresAt <= new Date()) {
    throw new AppError("INVALID_GRANT", "Refresh session is invalid or expired", 400);
  }
  const accessToken = newOpaqueToken(32);
  const nextRefreshToken = newOpaqueToken(48);
  const update = await db.nativeSession.updateMany({
    where: { id: session.id, status: "ACTIVE", refreshTokenHash, refreshExpiresAt: { gt: new Date() } },
    data: { accessTokenHash: sha256Base64Url(accessToken), refreshTokenHash: sha256Base64Url(nextRefreshToken), accessExpiresAt: accessExpiry(), refreshExpiresAt: refreshExpiry(), lastSeenAt: new Date() },
  });
  if (update.count !== 1) throw new AppError("INVALID_GRANT", "Refresh token was already rotated", 400);
  return tokenResponse(accessToken, nextRefreshToken, session.scope, session.userId, session.clientId);
}

export async function revokeNativeToken(input: { clientId: string; token: string }) {
  getClient(input.clientId);
  const tokenHash = sha256Base64Url(input.token);
  const session = await db.nativeSession.findFirst({ where: { clientId: input.clientId, status: "ACTIVE", OR: [{ accessTokenHash: tokenHash }, { refreshTokenHash: tokenHash }] }, select: { id: true, userId: true, deviceId: true } });
  if (!session) return;
  await db.$transaction(async (tx) => {
    await tx.nativeSession.updateMany({ where: { id: session.id, status: "ACTIVE" }, data: { status: "REVOKED", revokedAt: new Date() } });
    if (session.deviceId) await tx.pushDeviceToken.updateMany({ where: { userId: session.userId, deviceId: session.deviceId, enabled: true }, data: { enabled: false } });
  });
}
