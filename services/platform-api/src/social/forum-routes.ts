import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma, db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotification } from "../notifications/service.js";
import { cursorBefore, cursorAfter } from "./rules.js";
import { excludedUserIds, publicAuthor, requireSocialAuth } from "./common.js";
const id = z.string().min(5).max(64);
const topicSelect = { id: true, slug: true, name: true, description: true, _count: { select: { threads: true } } } as const;
const threadSelect = { id: true, title: true, body: true, createdAt: true, author: { select: publicAuthor }, topic: { select: { id: true, name: true, slug: true } }, _count: { select: { replies: true } } } as const;
async function voteState(userId: string, threadIds: string[]) {
  if (!threadIds.length) return new Map<string, { score: number; myVote: number }>();
  const votes = await db.forumThreadVote.findMany({ where: { threadId: { in: threadIds } }, select: { threadId: true, userId: true, value: true } });
  const result = new Map<string, { score: number; myVote: number }>();
  for (const threadId of threadIds) result.set(threadId, { score: 0, myVote: 0 });
  for (const vote of votes) { const state = result.get(vote.threadId)!; state.score += vote.value; if (vote.userId === userId) state.myVote = vote.value; }
  return result;
}
export async function bazforumRoutes(app: FastifyInstance) {
  app.get("/v1/bazforum/topics", async (request) => {
    await requireSocialAuth(request);
    return { topics: await db.forumTopic.findMany({ select: topicSelect, take: 100, orderBy: { name: "asc" } }) };
  });
  app.post("/v1/bazforum/topics", { config: { rateLimit: { max: 3, timeWindow: "1 day" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { slug, name, description } = z.object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,49}$/), name: z.string().trim().min(3).max(90), description: z.string().trim().max(300).default("") }).strict().parse(request.body);
    try { const topic = await db.forumTopic.create({ data: { creatorId: userId, slug, name, description }, select: topicSelect }); return reply.code(201).send({ topic }); }
    catch (err) { if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new AppError("TOPIC_EXISTS", "A topic with that address already exists", 409); throw err; }
  });

  app.get("/v1/bazforum/threads", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { topicId, before, limit } = z.object({ topicId: id.optional(), before: id.optional(), limit: z.coerce.number().int().min(1).max(30).default(20) }).parse(request.query);
    let beforeFilter = {};
    if (before) {
      const cursor = await db.forumThread.findUnique({ where: { id: before }, select: { id: true, createdAt: true } });
      if (!cursor) throw new AppError("INVALID_CURSOR", "Thread cursor is invalid", 400);
      beforeFilter = cursorBefore(cursor.createdAt, cursor.id);
    }
    const excluded = await excludedUserIds(userId);
    const threads = await db.forumThread.findMany({ where: { topicId, authorId: { notIn: excluded }, author: { status: "ACTIVE" }, ...beforeFilter }, select: threadSelect, take: limit + 1, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    const page = threads.slice(0, limit);
    const votes = await voteState(userId, page.map((thread) => thread.id));
    return { threads: page.map((thread) => ({ ...thread, voteScore: votes.get(thread.id)?.score ?? 0, myVote: votes.get(thread.id)?.myVote ?? 0 })), nextCursor: page.at(-1)?.id ?? null, hasMore: threads.length > limit };
  });
  app.post("/v1/bazforum/threads", { config: { rateLimit: { max: 8, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { topicId, title, body } = z.object({ topicId: id, title: z.string().trim().min(5).max(150), body: z.string().trim().min(10).max(10000) }).strict().parse(request.body);
    const topic = await db.forumTopic.findUnique({ where: { id: topicId }, select: { id: true } });
    if (!topic) throw new AppError("NOT_FOUND", "Topic not found", 404);
    const thread = await db.forumThread.create({ data: { topicId, authorId: userId, title, body }, select: threadSelect });
    return reply.code(201).send({ thread: { ...thread, voteScore: 0, myVote: 0 } });
  });
  app.get("/v1/bazforum/threads/:threadId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { threadId } = z.object({ threadId: id }).parse(request.params);
    const excluded = await excludedUserIds(userId);
    const thread = await db.forumThread.findFirst({ where: { id: threadId, authorId: { notIn: excluded } }, select: threadSelect });
    if (!thread) throw new AppError("NOT_FOUND", "Thread not found", 404);
    const replies = await db.forumReply.findMany({ where: { threadId, authorId: { notIn: excluded }, author: { status: "ACTIVE" } }, select: { id: true, body: true, createdAt: true, author: { select: publicAuthor } }, take: 100, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    const votes = await voteState(userId, [threadId]);
    return { thread: { ...thread, voteScore: votes.get(threadId)?.score ?? 0, myVote: votes.get(threadId)?.myVote ?? 0 }, replies };
  });
  app.post("/v1/bazforum/threads/:threadId/replies", { config: { rateLimit: { max: 12, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { threadId } = z.object({ threadId: id }).parse(request.params);
    const { body } = z.object({ body: z.string().trim().min(2).max(5000) }).strict().parse(request.body);
    const thread = await db.forumThread.findUnique({ where: { id: threadId }, select: { authorId: true } });
    if (!thread || (await excludedUserIds(userId)).includes(thread.authorId)) throw new AppError("NOT_FOUND", "Thread not found", 404);
    const result = await db.forumReply.create({ data: { threadId, authorId: userId, body }, select: { id: true, body: true, createdAt: true, author: { select: publicAuthor } } });
    if (thread.authorId !== userId) await queueNotification({ userId: thread.authorId, category: "BAZFORUM", title: "New forum reply", body: "Someone replied to your BazForum thread", resourceType: "ForumThread", resourceId: threadId, channels: ["PUSH"] }).catch(() => undefined);
    return reply.code(201).send({ reply: result });
  });
  app.put("/v1/bazforum/threads/:threadId/vote", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { threadId } = z.object({ threadId: id }).parse(request.params);
    const { value } = z.object({ value: z.union([z.literal(1), z.literal(-1)]) }).strict().parse(request.body);
    const excluded = await excludedUserIds(userId);
    const thread = await db.forumThread.findFirst({ where: { id: threadId, authorId: { notIn: excluded }, author: { status: "ACTIVE" } }, select: { id: true } });
    if (!thread) throw new AppError("NOT_FOUND", "Thread not found", 404);
    await db.forumThreadVote.upsert({ where: { threadId_userId: { threadId, userId } }, create: { threadId, userId, value }, update: { value } });
    const aggregate = await db.forumThreadVote.aggregate({ where: { threadId }, _sum: { value: true } });
    return { myVote: value, voteScore: aggregate._sum.value ?? 0 };
  });

  app.delete("/v1/bazforum/threads/:threadId/vote", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { threadId } = z.object({ threadId: id }).parse(request.params);
    await db.forumThreadVote.deleteMany({ where: { threadId, userId } });
    const aggregate = await db.forumThreadVote.aggregate({ where: { threadId }, _sum: { value: true } });
    return { myVote: 0, voteScore: aggregate._sum.value ?? 0 };
  });

  app.delete("/v1/bazforum/threads/:threadId", async (request) => {
    const { userId } = await requireSocialAuth(request); const { threadId } = z.object({ threadId: id }).parse(request.params);
    const result = await db.forumThread.deleteMany({ where: { id: threadId, authorId: userId } });
    if (!result.count) throw new AppError("NOT_FOUND", "Thread not found", 404);
    return { deleted: true };
  });
}
