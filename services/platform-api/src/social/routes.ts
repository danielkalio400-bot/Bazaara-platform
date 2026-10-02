import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotification } from "../notifications/service.js";
import { assertContactAllowed, excludedUserIds, publicAuthor, requireSocialAuth } from "./common.js";
import { normalizeHandle } from "./rules.js";

const handleSchema = z.string().min(3).max(32).transform((s, ctx) => {
  try { return normalizeHandle(s); } catch (error) { ctx.addIssue({ code: "custom", message: (error as Error).message }); return z.NEVER; }
});
const profileSchema = z.object({
  handle: handleSchema,
  bio: z.string().trim().max(280).default(""),
  discoverable: z.boolean().default(false),
  displayName: z.string().trim().min(1).max(80).optional(),
}).strict();
const idSchema = z.object({ userId: z.string().min(5).max(64) });
const reportSchema = z.object({
  targetType: z.enum(["USER", "MESSAGE", "POST", "THREAD", "REPLY"]),
  targetId: z.string().min(5).max(64),
  reason: z.enum(["SPAM", "HARASSMENT", "HATE", "VIOLENCE", "CHILD_SAFETY", "SCAM", "OTHER"]),
  detail: z.string().trim().max(500).default(""),
}).strict();

export async function socialRoutes(app: FastifyInstance) {
  app.get("/v1/social/me", async (request) => {
    const auth = await requireSocialAuth(request);
    const user = await db.user.findUniqueOrThrow({ where: { id: auth.userId }, select: { id: true, displayName: true, socialProfile: true } });
    return { user: { id: user.id, displayName: user.displayName, profile: user.socialProfile } };
  });

  app.put("/v1/social/me", { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } }, async (request) => {
    const auth = await requireSocialAuth(request);
    const input = profileSchema.parse(request.body);
    const { displayName, ...profileData } = input;
    try {
      const profile = await db.$transaction(async (tx) => {
        if (displayName) await tx.user.update({ where: { id: auth.userId }, data: { displayName } });
        return tx.socialProfile.upsert({ where: { userId: auth.userId }, create: { userId: auth.userId, ...profileData }, update: profileData });
      });
      return { profile };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("HANDLE_TAKEN", "This handle is already used", 409);
      }
      throw error;
    }
  });

  app.get("/v1/social/users", async (request) => {
    const auth = await requireSocialAuth(request);
    const { q } = z.object({ q: z.string().trim().min(2).max(40) }).parse(request.query);
    const excluded = await excludedUserIds(auth.userId);
    const profiles = await db.socialProfile.findMany({
      where: { discoverable: true, userId: { notIn: [...excluded, auth.userId] }, user: { status: "ACTIVE" }, OR: [
        { handle: { contains: q.toLowerCase() } }, { user: { displayName: { contains: q, mode: "insensitive" } } },
      ] },
      select: { handle: true, bio: true, user: { select: publicAuthor } }, take: 15, orderBy: { handle: "asc" },
    });
    return { users: profiles.map((row) => ({ ...row.user, handle: row.handle, bio: row.bio })) };
  });

  app.get("/v1/social/profiles/:handle", async (request) => {
    const auth = await requireSocialAuth(request);
    const { handle } = z.object({ handle: handleSchema }).parse(request.params);
    const profile = await db.socialProfile.findFirst({
      where: { handle, discoverable: true, user: { status: "ACTIVE" } },
      select: { handle: true, bio: true, user: { select: publicAuthor } },
    });
    if (!profile || (await excludedUserIds(auth.userId)).includes(profile.user.id)) throw new AppError("NOT_FOUND", "Profile not found", 404);
    return { profile: { ...profile, isSelf: profile.user.id === auth.userId } };
  });

  app.post("/v1/social/blocks/:userId", async (request, reply) => {
    const auth = await requireSocialAuth(request);
    const { userId } = idSchema.parse(request.params);
    if (userId === auth.userId) throw new AppError("BAD_REQUEST", "Cannot block yourself", 400);
    const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) throw new AppError("NOT_FOUND", "Member not found", 404);
    await db.$transaction(async (tx) => {
      await tx.socialBlock.upsert({ where: { blockerUserId_blockedUserId: { blockerUserId: auth.userId, blockedUserId: userId } }, create: { blockerUserId: auth.userId, blockedUserId: userId }, update: {} });
      await tx.socialFollow.deleteMany({ where: { OR: [
        { followerUserId: auth.userId, followedUserId: userId }, { followerUserId: userId, followedUserId: auth.userId },
      ] } });
    });
    return reply.code(201).send({ blocked: true });
  });
  app.delete("/v1/social/blocks/:userId", async (request) => {
    const auth = await requireSocialAuth(request); const { userId } = idSchema.parse(request.params);
    await db.socialBlock.deleteMany({ where: { blockerUserId: auth.userId, blockedUserId: userId } });
    return { blocked: false };
  });
  app.get("/v1/social/blocks", async (request) => {
    const auth = await requireSocialAuth(request);
    const blocks = await db.socialBlock.findMany({ where: { blockerUserId: auth.userId }, select: { blockedUserId: true, createdAt: true }, take: 100 });
    return { blocks };
  });

  app.post("/v1/social/follows/:userId", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request, reply) => {
    const auth = await requireSocialAuth(request); const { userId } = idSchema.parse(request.params);
    await assertContactAllowed(auth.userId, userId);
    await db.socialFollow.upsert({ where: { followerUserId_followedUserId: { followerUserId: auth.userId, followedUserId: userId } }, create: { followerUserId: auth.userId, followedUserId: userId }, update: {} });
    const follower = await db.user.findUnique({ where: { id: auth.userId }, select: { displayName: true, socialProfile: { select: { handle: true } } } });
    await queueNotification({ userId, category: "BAZCIRCLE", title: "New follower", body: `${follower?.displayName ?? follower?.socialProfile?.handle ?? "A BAZAARA member"} followed you`, resourceType: "User", resourceId: auth.userId, channels: ["PUSH"] }).catch(() => undefined);
    return reply.code(201).send({ following: true });
  });
  app.delete("/v1/social/follows/:userId", async (request) => {
    const auth = await requireSocialAuth(request); const { userId } = idSchema.parse(request.params);
    await db.socialFollow.deleteMany({ where: { followerUserId: auth.userId, followedUserId: userId } });
    return { following: false };
  });
  app.get("/v1/social/following", async (request) => {
    const auth = await requireSocialAuth(request);
    const excluded = await excludedUserIds(auth.userId);
    const items = await db.socialFollow.findMany({ where: { followerUserId: auth.userId, followedUserId: { notIn: excluded } }, include: { followed: { select: publicAuthor } }, take: 100 });
    return { following: items.map((x) => x.followed) };
  });

  app.post("/v1/social/reports", { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } }, async (request, reply) => {
    const auth = await requireSocialAuth(request); const input = reportSchema.parse(request.body);
    // Generic reports are moderated by Operations; never send the detail in telemetry.
    const report = await db.socialReport.create({ data: { ...input, reporterUserId: auth.userId }, select: { id: true, status: true } });
    return reply.code(201).send({ report });
  });
}
