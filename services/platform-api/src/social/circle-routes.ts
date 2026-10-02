import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotification } from "../notifications/service.js";
import { cursorBefore } from "./rules.js";
import { excludedUserIds, publicAuthor, requireSocialAuth } from "./common.js";
import { mediaUrl, ownedReadyAsset, serializeAsset, type ReadyMediaAsset } from "../media/access.js";

const id = z.string().min(5).max(64);
const postSelect = { id: true, body: true, audience: true, mediaAssetId: true, createdAt: true, authorId: true, author: { select: publicAuthor }, _count: { select: { likes: true, comments: true } } } as const;

export async function bazcircleRoutes(app: FastifyInstance) {
  app.get("/v1/bazcircle/feed", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { before, limit } = z.object({ before: id.optional(), limit: z.coerce.number().int().min(1).max(30).default(20) }).parse(request.query);
    const excluded = await excludedUserIds(userId);
    let beforeFilter = {};
    if (before) {
      const cursor = await db.circlePost.findUnique({ where: { id: before }, select: { id: true, createdAt: true } });
      if (!cursor) throw new AppError("INVALID_CURSOR", "Feed cursor is invalid", 400);
      beforeFilter = cursorBefore(cursor.createdAt, cursor.id);
    }
    const posts = await db.circlePost.findMany({ where: {
      authorId: { notIn: excluded }, OR: [{ audience: "PUBLIC", author: { status: "ACTIVE" } }, { authorId: userId }], ...beforeFilter,
    }, select: postSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit + 1 });
    const page = posts.slice(0, limit);
    const liked = await db.circleLike.findMany({ where: { userId, postId: { in: page.map((p) => p.id) } }, select: { postId: true } });
    const likedIds = new Set(liked.map((x) => x.postId));
    const assetIds = page.flatMap((p) => p.mediaAssetId ? [p.mediaAssetId] : []);
    const assets = await db.mediaAsset.findMany({ where: { id: { in: assetIds }, status: "READY" } });
    const byId = new Map(assets.map((asset) => [asset.id, asset]));
    return {
      posts: page.map((p) => {
        const asset = p.mediaAssetId ? byId.get(p.mediaAssetId) : undefined;
        return { ...p, liked: likedIds.has(p.id), media: asset ? { ...serializeAsset(asset), url: mediaUrl(asset, 900) } : null };
      }),
      hasMore: posts.length > limit,
      nextCursor: page.at(-1)?.id ?? null,
    };
  });

  app.post("/v1/bazcircle/posts", { config: { rateLimit: { max: 12, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const input = z.object({
      body: z.string().trim().max(2000).default(""),
      audience: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
      mediaAssetId: id.optional(),
    }).strict().refine((value) => Boolean(value.body || value.mediaAssetId), { message: "Post text or media is required" }).parse(request.body);
    let asset: ReadyMediaAsset | null = null;
    if (input.mediaAssetId) {
      asset = await ownedReadyAsset(userId, input.mediaAssetId, ["image/", "video/"]);
      if (Number(asset.byteSize) > 100 * 1024 * 1024) throw new AppError("BAD_REQUEST", "Post media exceeds the 100 MB limit", 400);
      await db.mediaAsset.update({ where: { id: asset.id }, data: { visibility: input.audience === "PUBLIC" ? "PUBLIC" : "PRIVATE" } });
    }
    const post = await db.circlePost.create({ data: { authorId: userId, body: input.body, audience: input.audience, mediaAssetId: input.mediaAssetId }, select: postSelect });
    return reply.code(201).send({ post: { ...post, liked: false, media: asset ? { ...serializeAsset(asset), url: mediaUrl(asset, 900) } : null } });
  });

  app.get("/v1/bazcircle/posts/:postId/comments", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { postId } = z.object({ postId: id }).parse(request.params);
    const post = await db.circlePost.findUnique({ where: { id: postId }, select: { authorId: true, audience: true } });
    const excluded = await excludedUserIds(userId);
    if (!post || excluded.includes(post.authorId) || (post.audience !== "PUBLIC" && post.authorId !== userId)) throw new AppError("NOT_FOUND", "Post not found", 404);
    const comments = await db.circleComment.findMany({
      where: { postId, authorId: { notIn: excluded }, author: { status: "ACTIVE" } },
      select: { id: true, body: true, createdAt: true, authorId: true, author: { select: publicAuthor } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 100,
    });
    return { comments };
  });

  app.post("/v1/bazcircle/posts/:postId/comments", { config: { rateLimit: { max: 20, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { postId } = z.object({ postId: id }).parse(request.params);
    const { body } = z.object({ body: z.string().trim().min(1).max(1200) }).strict().parse(request.body);
    const post = await db.circlePost.findUnique({ where: { id: postId }, select: { authorId: true, audience: true } });
    const excluded = await excludedUserIds(userId);
    if (!post || excluded.includes(post.authorId) || (post.audience !== "PUBLIC" && post.authorId !== userId)) throw new AppError("NOT_FOUND", "Post not found", 404);
    const comment = await db.circleComment.create({ data: { postId, authorId: userId, body }, select: { id: true, body: true, createdAt: true, authorId: true, author: { select: publicAuthor } } });
    if (post.authorId !== userId) await queueNotification({ userId: post.authorId, category: "BAZCIRCLE", title: "New comment", body: "Someone commented on your BazCircle post", resourceType: "CirclePost", resourceId: postId, channels: ["PUSH"] }).catch(() => undefined);
    return reply.code(201).send({ comment });
  });

  app.delete("/v1/bazcircle/posts/:postId/comments/:commentId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { postId, commentId } = z.object({ postId: id, commentId: id }).parse(request.params);
    const result = await db.circleComment.deleteMany({ where: { id: commentId, postId, authorId: userId } });
    if (!result.count) throw new AppError("NOT_FOUND", "Comment not found", 404);
    return { deleted: true };
  });

  app.delete("/v1/bazcircle/posts/:postId", async (request) => {
    const { userId } = await requireSocialAuth(request); const { postId } = z.object({ postId: id }).parse(request.params);
    const result = await db.circlePost.deleteMany({ where: { id: postId, authorId: userId } });
    if (!result.count) throw new AppError("NOT_FOUND", "Post not found", 404);
    return { deleted: true };
  });

  app.put("/v1/bazcircle/posts/:postId/like", async (request) => {
    const { userId } = await requireSocialAuth(request); const { postId } = z.object({ postId: id }).parse(request.params);
    const post = await db.circlePost.findUnique({ where: { id: postId }, select: { authorId: true, audience: true } });
    const excluded = await excludedUserIds(userId);
    if (!post || excluded.includes(post.authorId) || (post.audience !== "PUBLIC" && post.authorId !== userId)) throw new AppError("NOT_FOUND", "Post not found", 404);
    await db.circleLike.upsert({ where: { postId_userId: { postId, userId } }, create: { postId, userId }, update: {} });
    return { liked: true };
  });

  app.delete("/v1/bazcircle/posts/:postId/like", async (request) => {
    const { userId } = await requireSocialAuth(request); const { postId } = z.object({ postId: id }).parse(request.params);
    await db.circleLike.deleteMany({ where: { postId, userId } });
    return { liked: false };
  });
}
