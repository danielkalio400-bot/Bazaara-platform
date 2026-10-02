import { db } from "@bazaara/db";
import type { FastifyRequest } from "fastify";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";

/** Check both block directions for every private communication or new connection. */
export async function assertContactAllowed(userId: string, targetUserId: string) {
  if (userId === targetUserId) throw new AppError("SELF_TARGET", "Choose another Bazaara member", 400);
  const [user, blocked] = await Promise.all([
    db.user.findFirst({ where: { id: targetUserId, status: "ACTIVE", socialProfile: { is: { discoverable: true } } }, select: { id: true } }),
    db.socialBlock.findFirst({ where: { OR: [
      { blockerUserId: userId, blockedUserId: targetUserId },
      { blockerUserId: targetUserId, blockedUserId: userId },
    ] }, select: { blockerUserId: true } }),
  ]);
  if (!user || blocked) throw new AppError("MEMBER_UNAVAILABLE", "This member is unavailable", 404);
}

export async function excludedUserIds(userId: string) {
  const edges = await db.socialBlock.findMany({
    where: { OR: [{ blockerUserId: userId }, { blockedUserId: userId }] },
    select: { blockerUserId: true, blockedUserId: true }, take: 10000,
  });
  return [...new Set(edges.map((e) => e.blockerUserId === userId ? e.blockedUserId : e.blockerUserId))];
}
export const publicAuthor = {
  id: true, displayName: true, socialProfile: { select: { handle: true } },
} as const;

/** Commerce/mobile bearer tokens do not automatically grant access to social content. */
export async function requireSocialAuth(request: FastifyRequest) {
  const auth = await requireAuth(request);
  if (auth.channel === "NATIVE" && !auth.scopes?.includes("social.basic")) {
    throw new AppError("SOCIAL_SCOPE_REQUIRED", "The social.basic client scope is required", 403);
  }
  return auth;
}
