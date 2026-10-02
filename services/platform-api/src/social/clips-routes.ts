import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotification } from "../notifications/service.js";
import { excludedUserIds, publicAuthor, requireSocialAuth } from "./common.js";
import { cursorBefore } from "./rules.js";
import { mediaUrl, ownedReadyAsset, readyAsset, serializeAsset } from "../media/access.js";

const id = z.string().min(5).max(64);
const clipSelect = {
  id: true,
  assetId: true,
  caption: true,
  visibility: true,
  status: true,
  durationMs: true,
  viewCount: true,
  createdAt: true,
  creatorId: true,
  creator: { select: publicAuthor },
  _count: { select: { likes: true, comments: true } },
} as const;

export async function bazclipsRoutes(app: FastifyInstance) {
  app.get("/v1/bazclips/feed", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { before, limit } = z.object({
      before: id.optional(),
      limit: z.coerce.number().int().min(1).max(30).default(12),
    }).parse(request.query);
    const excluded = await excludedUserIds(userId);
    let beforeFilter = {};
    if (before) {
      const cursor = await db.clipPost.findUnique({ where: { id: before }, select: { id: true, createdAt: true } });
      if (!cursor) throw new AppError("INVALID_CURSOR", "Clip cursor is invalid", 400);
      beforeFilter = cursorBefore(cursor.createdAt, cursor.id);
    }
    const rows = await db.clipPost.findMany({
      where: {
        creatorId: { notIn: excluded },
        status: "PUBLISHED",
        OR: [{ visibility: "PUBLIC", creator: { status: "ACTIVE" } }, { creatorId: userId }],
        ...beforeFilter,
      },
      select: clipSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    const likes = await db.clipLike.findMany({ where: { userId, clipId: { in: page.map((row) => row.id) } }, select: { clipId: true } });
    const liked = new Set(likes.map((row) => row.clipId));
    const assets = await db.mediaAsset.findMany({ where: { id: { in: page.map((row) => row.assetId) }, status: "READY" } });
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    return {
      clips: page.flatMap((row) => {
        const asset = assetsById.get(row.assetId);
        if (!asset) return [];
        return [{ ...row, liked: liked.has(row.id), media: { ...serializeAsset(asset), url: mediaUrl(asset, 1200) } }];
      }),
      hasMore: rows.length > limit,
      nextCursor: page.at(-1)?.id ?? null,
    };
  });

  app.post("/v1/bazclips/clips", { config: { rateLimit: { max: 12, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const input = z.object({
      assetId: id,
      caption: z.string().trim().max(2200).default(""),
      visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
      durationMs: z.number().int().positive().max(10 * 60 * 1000).optional(),
    }).strict().parse(request.body);
    const asset = await ownedReadyAsset(userId, input.assetId, ["video/"]);
    if (Number(asset.byteSize) > 250 * 1024 * 1024) throw new AppError("BAD_REQUEST", "Clip exceeds the 250 MB limit", 400);
    await db.mediaAsset.update({ where: { id: asset.id }, data: { visibility: input.visibility } });
    const clip = await db.clipPost.create({ data: { creatorId: userId, ...input }, select: clipSelect });
    return reply.code(201).send({ clip: { ...clip, liked: false, media: { ...serializeAsset(asset), url: mediaUrl(asset, 1200) } } });
  });

  app.delete("/v1/bazclips/clips/:clipId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId } = z.object({ clipId: id }).parse(request.params);
    const result = await db.clipPost.updateMany({ where: { id: clipId, creatorId: userId, status: { not: "REMOVED" } }, data: { status: "REMOVED" } });
    if (!result.count) throw new AppError("NOT_FOUND", "Clip not found", 404);
    return { deleted: true };
  });

  app.put("/v1/bazclips/clips/:clipId/like", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId } = z.object({ clipId: id }).parse(request.params);
    const clip = await db.clipPost.findUnique({ where: { id: clipId }, select: { creatorId: true, visibility: true, status: true } });
    const excluded = await excludedUserIds(userId);
    if (!clip || clip.status !== "PUBLISHED" || excluded.includes(clip.creatorId) || (clip.visibility !== "PUBLIC" && clip.creatorId !== userId)) throw new AppError("NOT_FOUND", "Clip not found", 404);
    await db.clipLike.upsert({ where: { clipId_userId: { clipId, userId } }, create: { clipId, userId }, update: {} });
    return { liked: true };
  });

  app.delete("/v1/bazclips/clips/:clipId/like", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId } = z.object({ clipId: id }).parse(request.params);
    await db.clipLike.deleteMany({ where: { clipId, userId } });
    return { liked: false };
  });

  app.post("/v1/bazclips/clips/:clipId/view", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId } = z.object({ clipId: id }).parse(request.params);
    const excluded = await excludedUserIds(userId);
    const clip = await db.clipPost.findFirst({ where: { id: clipId, status: "PUBLISHED", creatorId: { notIn: excluded }, OR: [{ visibility: "PUBLIC" }, { creatorId: userId }] }, select: { id: true } });
    if (!clip) throw new AppError("NOT_FOUND", "Clip not found", 404);
    const updated = await db.clipPost.update({ where: { id: clipId }, data: { viewCount: { increment: 1 } }, select: { viewCount: true } });
    return { viewed: true, viewCount: updated.viewCount };
  });

  app.get("/v1/bazclips/clips/:clipId/comments", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId } = z.object({ clipId: id }).parse(request.params);
    const excluded = await excludedUserIds(userId);
    const clip = await db.clipPost.findFirst({ where: { id: clipId, status: "PUBLISHED", creatorId: { notIn: excluded }, OR: [{ visibility: "PUBLIC" }, { creatorId: userId }] }, select: { id: true } });
    if (!clip) throw new AppError("NOT_FOUND", "Clip not found", 404);
    const comments = await db.clipComment.findMany({
      where: { clipId, authorId: { notIn: excluded }, author: { status: "ACTIVE" } },
      select: { id: true, body: true, createdAt: true, authorId: true, author: { select: publicAuthor } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 100,
    });
    return { comments };
  });

  app.post("/v1/bazclips/clips/:clipId/comments", { config: { rateLimit: { max: 20, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId } = z.object({ clipId: id }).parse(request.params);
    const { body } = z.object({ body: z.string().trim().min(1).max(1000) }).strict().parse(request.body);
    const excluded = await excludedUserIds(userId);
    const clip = await db.clipPost.findFirst({ where: { id: clipId, status: "PUBLISHED", creatorId: { notIn: excluded }, OR: [{ visibility: "PUBLIC" }, { creatorId: userId }] }, select: { id: true, creatorId: true } });
    if (!clip) throw new AppError("NOT_FOUND", "Clip not found", 404);
    const comment = await db.clipComment.create({ data: { clipId, authorId: userId, body }, select: { id: true, body: true, createdAt: true, authorId: true, author: { select: publicAuthor } } });
    if (clip.creatorId !== userId) await queueNotification({ userId: clip.creatorId, category: "BAZCLIPS", title: "New clip comment", body: "Someone commented on your BazClips post", resourceType: "ClipPost", resourceId: clipId, channels: ["PUSH"] }).catch(() => undefined);
    return reply.code(201).send({ comment });
  });

  app.delete("/v1/bazclips/clips/:clipId/comments/:commentId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId, commentId } = z.object({ clipId: id, commentId: id }).parse(request.params);
    const result = await db.clipComment.deleteMany({ where: { id: commentId, clipId, authorId: userId } });
    if (!result.count) throw new AppError("NOT_FOUND", "Comment not found", 404);
    return { deleted: true };
  });

  app.get("/v1/bazclips/clips/:clipId/media", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { clipId } = z.object({ clipId: id }).parse(request.params);
    const clip = await db.clipPost.findUnique({ where: { id: clipId }, select: { creatorId: true, assetId: true, visibility: true, status: true } });
    if (!clip || clip.status !== "PUBLISHED" || (clip.visibility !== "PUBLIC" && clip.creatorId !== userId)) throw new AppError("NOT_FOUND", "Clip not found", 404);
    const asset = await readyAsset(clip.assetId);
    return { media: { ...serializeAsset(asset), url: mediaUrl(asset, 1200) } };
  });
}
