import { db } from "@bazaara/db";
import { hashPassword, newOpaqueToken, sha256Base64Url, verifyPassword } from "@bazaara/security";
import { env } from "../config.js";
import { AppError } from "../errors.js";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const sessionExpiry = () => new Date(Date.now() + env.BAZID_SESSION_TTL_HOURS * 60 * 60 * 1000);

type RequestMeta = { ipAddress?: string; userAgent?: string };

async function createSession(userId: string, meta: RequestMeta) {
  const rawToken = newOpaqueToken(32);
  const session = await db.session.create({
    data: {
      userId,
      tokenHash: sha256Base64Url(rawToken),
      expiresAt: sessionExpiry(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
  return { rawToken, session };
}

export async function registerWithEmail(input: { email: string; password: string; displayName?: string }, meta: RequestMeta) {
  const normalized = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { displayName: input.displayName } });
      await tx.userEmail.create({ data: { userId: created.id, email: input.email.trim(), normalized, isPrimary: true } });
      await tx.passwordCredential.create({ data: { userId: created.id, passwordHash } });
      await tx.outboxEvent.create({
        data: { aggregateType: "User", aggregateId: created.id, eventType: "BazIDUserRegistered", payload: { userId: created.id } },
      });
      return created;
    });
    const { rawToken, session } = await createSession(user.id, meta);
    return { user, rawToken, session };
  } catch (error: unknown) {
    const maybe = error as { code?: string };
    if (maybe.code === "P2002") throw new AppError("CONFLICT", "An account with this email already exists", 409);
    throw error;
  }
}

export async function loginWithEmail(input: { email: string; password: string }, meta: RequestMeta) {
  const normalized = normalizeEmail(input.email);
  const email = await db.userEmail.findUnique({
    where: { normalized },
    include: { user: { include: { passwordCredential: true } } },
  });
  const user = email?.user;
  const credential = user?.passwordCredential;
  const now = new Date();
  const locked = Boolean(credential?.lockedUntil && credential.lockedUntil > now);
  const valid = !locked && credential ? await verifyPassword(credential.passwordHash, input.password) : false;

  if (credential && !valid && !locked) {
    const failures = credential.failedAttempts + 1;
    await db.passwordCredential.update({
      where: { userId: credential.userId },
      data: {
        failedAttempts: failures,
        lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
  } else if (credential && valid && (credential.failedAttempts > 0 || credential.lockedUntil)) {
    await db.passwordCredential.update({ where: { userId: credential.userId }, data: { failedAttempts: 0, lockedUntil: null } });
  }

  await db.loginAttempt.create({
    data: {
      userId: user?.id,
      identifier: normalized,
      success: Boolean(valid && user?.status === "ACTIVE"),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      reason: locked ? "TEMPORARILY_LOCKED" : !valid ? "INVALID_CREDENTIALS" : user?.status !== "ACTIVE" ? "USER_NOT_ACTIVE" : undefined,
    },
  });
  if (!valid || !user || user.status !== "ACTIVE") {
    throw new AppError("UNAUTHENTICATED", "Email or password is incorrect", 401);
  }
  const { rawToken, session } = await createSession(user.id, meta);
  return { user, rawToken, session };
}

export async function revokeSession(userId: string, sessionId: string) {
  const result = await db.session.updateMany({
    where: { id: sessionId, userId, status: "ACTIVE" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  if (result.count === 0) throw new AppError("NOT_FOUND", "Session not found", 404);
}


export async function changePassword(userId: string, currentSessionId: string, currentPassword: string, newPassword: string) {
  const credential = await db.passwordCredential.findUnique({ where: { userId } });
  if (!credential) throw new AppError("CONFLICT", "Password authentication is not configured for this BazID", 409);
  const valid = await verifyPassword(credential.passwordHash, currentPassword);
  if (!valid) throw new AppError("UNAUTHENTICATED", "Current password is incorrect", 401);
  const passwordHash = await hashPassword(newPassword);
  await db.$transaction(async (tx) => {
    await tx.passwordCredential.update({
      where: { userId },
      data: { passwordHash, passwordChangedAt: new Date(), failedAttempts: 0, lockedUntil: null },
    });
    await tx.session.updateMany({
      where: { userId, status: "ACTIVE", id: { not: currentSessionId } },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
  });
}
