import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { Prisma, db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotification } from "../notifications/service.js";
import { mediaUrl, ownedReadyAsset, readyAsset, serializeAsset } from "../media/access.js";
import { assertContactAllowed, requireSocialAuth } from "./common.js";
import { directKey, cursorAfter } from "./rules.js";

const uuid = z.string().uuid();
const id = z.string().min(5).max(64);
const conversationParams = z.object({ conversationId: id });
const messageParams = z.object({ conversationId: id, messageId: id });
const participantSelect = { user: { select: { id: true, displayName: true, socialProfile: { select: { handle: true } } } }, userId: true, lastReadAt: true } as const;
const replyPreviewSelect = { id: true, senderUserId: true, body: true, deletedAt: true, attachmentName: true } as const;
const messageSelect = { id: true, conversationId: true, senderUserId: true, body: true, assetId: true, attachmentName: true, attachmentType: true, attachmentBytes: true, replyToMessageId: true, replyTo: { select: replyPreviewSelect }, createdAt: true } as const;

type Event = { conversationId: string; messageId: string };
const subscriptions = new Map<string, Set<(event: Event) => void>>();
function publish(userId: string, event: Event) { for (const listener of subscriptions.get(userId) ?? []) listener(event); }
function subscribe(userId: string, fn: (event: Event) => void) {
  const set = subscriptions.get(userId) ?? new Set<(event: Event) => void>();
  set.add(fn); subscriptions.set(userId, set);
  return () => { set.delete(fn); if (!set.size) subscriptions.delete(userId); };
}
async function ownMembership(userId: string, conversationId: string) {
  const membership = await db.chatParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!membership) throw new AppError("NOT_FOUND", "Conversation not found", 404);
  return membership;
}

async function attachmentContract(message: { assetId:string|null; attachmentName:string|null; attachmentType:string|null; attachmentBytes:bigint|null; deletedAt:Date|null }) {
  if (!message.assetId || message.deletedAt) return null;
  try {
    const asset = await readyAsset(message.assetId);
    return {
      ...serializeAsset(asset),
      name: message.attachmentName ?? "Attachment",
      contentType: message.attachmentType ?? asset.contentType,
      byteSize: message.attachmentBytes ? Number(message.attachmentBytes) : Number(asset.byteSize),
      url: mediaUrl(asset, 600),
    };
  } catch { return null; }
}

export async function bazchatRoutes(app: FastifyInstance) {
  app.get("/v1/bazchat/conversations", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const memberships = await db.chatParticipant.findMany({
      where: { userId }, orderBy: { conversation: { updatedAt: "desc" } }, take: 60,
      include: { conversation: { include: {
        participants: { select: participantSelect },
        messages: { where: { deletedAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { id: true, body: true, senderUserId: true, createdAt: true, attachmentName: true } },
      } } },
    });
    const rows = await Promise.all(memberships.map(async ({ conversation, lastReadAt }) => ({
      id: conversation.id, updatedAt: conversation.updatedAt,
      participants: conversation.participants.map((p) => p.user),
      latestMessage: conversation.messages[0] ?? null,
      unread: await db.chatMessage.count({ where: { conversationId: conversation.id, createdAt: { gt: lastReadAt }, senderUserId: { not: userId }, deletedAt: null } }),
    })));
    return { conversations: rows };
  });

  app.post("/v1/bazchat/conversations", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { recipientUserId } = z.object({ recipientUserId: id }).strict().parse(request.body);
    await assertContactAllowed(userId, recipientUserId);
    const key = directKey(userId, recipientUserId);
    const conversation = await db.chatConversation.upsert({
      where: { directKey: key }, update: {}, create: { directKey: key, participants: { create: [{ userId }, { userId: recipientUserId }] } }, select: { id: true },
    });
    return reply.code(201).send({ conversationId: conversation.id });
  });

  app.get("/v1/bazchat/conversations/:conversationId/messages", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { conversationId } = conversationParams.parse(request.params);
    const { after, limit } = z.object({ after: id.optional(), limit: z.coerce.number().int().min(1).max(50).default(40) }).parse(request.query);
    await ownMembership(userId, conversationId);
    let afterFilter = {};
    if (after) {
      const cursor = await db.chatMessage.findFirst({ where: { id: after, conversationId }, select: { id: true, createdAt: true } });
      if (!cursor) throw new AppError("INVALID_CURSOR", "Conversation cursor is invalid", 400);
      afterFilter = cursorAfter(cursor.createdAt, cursor.id);
    }
    const messages = await db.chatMessage.findMany({
      where: { conversationId, ...afterFilter }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: limit + 1,
      select: { ...messageSelect, deletedAt: true },
    });
    const page = messages.slice(0, limit);
    const contracted = await Promise.all(page.map(async (message) => ({
      ...message,
      body: message.deletedAt ? null : message.body,
      attachmentBytes: message.attachmentBytes ? Number(message.attachmentBytes) : null,
      attachment: await attachmentContract(message),
    })));
    return { messages: contracted, hasMore: messages.length > limit, nextCursor: page.at(-1)?.id ?? after ?? null };
  });

  app.post("/v1/bazchat/conversations/:conversationId/messages", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { conversationId } = conversationParams.parse(request.params);
    const input = z.object({
      body: z.string().trim().max(4000).default(""),
      clientNonce: uuid,
      assetId: id.optional(),
      attachmentName: z.string().trim().min(1).max(240).optional(),
      replyToMessageId: id.optional(),
    }).strict().refine((value) => Boolean(value.body || value.assetId), { message: "Message text or an attachment is required" }).parse(request.body);
    await ownMembership(userId, conversationId);
    const conversation = await db.chatConversation.findUnique({ where: { id: conversationId }, select: { participants: { select: { userId: true } } } });
    const recipients = conversation?.participants.map((p) => p.userId).filter((x) => x !== userId) ?? [];
    const recipient = recipients[0];
    if (!recipient || recipients.length !== 1) throw new AppError("INVALID_CONVERSATION", "Direct conversation is not valid", 409);
    const block = await db.socialBlock.findFirst({ where: { OR: [
      { blockerUserId: userId, blockedUserId: recipient }, { blockerUserId: recipient, blockedUserId: userId },
    ] } });
    if (block) throw new AppError("MESSAGING_UNAVAILABLE", "Messages cannot be sent to this member", 403);

    if (input.replyToMessageId) {
      const replyTarget = await db.chatMessage.findFirst({ where: { id: input.replyToMessageId, conversationId, deletedAt: null }, select: { id: true } });
      if (!replyTarget) throw new AppError("BAD_REQUEST", "The message you are replying to is unavailable", 400);
    }

    let attachment: Awaited<ReturnType<typeof ownedReadyAsset>> | null = null;
    if (input.assetId) {
      attachment = await ownedReadyAsset(userId, input.assetId);
      if (Number(attachment.byteSize) > 25 * 1024 * 1024) throw new AppError("BAD_REQUEST", "Chat attachments are limited to 25 MB", 400);
      await db.mediaAsset.update({ where: { id: attachment.id }, data: { visibility: "PRIVATE" } });
    }

    let message: Prisma.ChatMessageGetPayload<{ select: typeof messageSelect }>; let inserted = false;
    try {
      message = await db.$transaction(async (tx) => {
        const created = await tx.chatMessage.create({ data: {
          conversationId, senderUserId: userId, body: input.body, clientNonce: input.clientNonce,
          assetId: attachment?.id,
          attachmentName: attachment ? (input.attachmentName ?? "Attachment") : undefined,
          attachmentType: attachment?.contentType,
          attachmentBytes: attachment?.byteSize,
          replyToMessageId: input.replyToMessageId,
        }, select: messageSelect });
        await tx.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        return created;
      });
      inserted = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      const existing = await db.chatMessage.findUnique({ where: { senderUserId_clientNonce: { senderUserId: userId, clientNonce: input.clientNonce } }, select: messageSelect });
      if (!existing || existing.conversationId !== conversationId) throw new AppError("NONCE_REUSED", "Message identifier was previously used", 409);
      message = existing;
    }
    if (inserted) {
      for (const targetId of [recipient, userId]) publish(targetId, { conversationId, messageId: message.id });
      await queueNotification({ userId: recipient, category: "BAZCHAT", title: "New BChat message", body: attachment ? "Sent you a message with an attachment" : "Sent you a message", resourceType: "ChatConversation", resourceId: conversationId, channels: ["PUSH"] }).catch(() => undefined);
    }
    return reply.code(inserted ? 201 : 200).send({ message: { ...message, attachmentBytes: message.attachmentBytes ? Number(message.attachmentBytes) : null, attachment: attachment ? { ...serializeAsset(attachment), name: input.attachmentName ?? "Attachment", url: mediaUrl(attachment, 600) } : null } });
  });

  app.post("/v1/bazchat/conversations/:conversationId/read", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { conversationId } = conversationParams.parse(request.params);
    const membership = await ownMembership(userId, conversationId);
    const lastReadAt = new Date();
    await db.chatParticipant.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadAt: lastReadAt > membership.lastReadAt ? lastReadAt : membership.lastReadAt } });
    return { read: true };
  });

  app.delete("/v1/bazchat/conversations/:conversationId/messages/:messageId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { conversationId, messageId } = messageParams.parse(request.params);
    await ownMembership(userId, conversationId);
    const result = await db.chatMessage.updateMany({ where: { id: messageId, conversationId, senderUserId: userId, deletedAt: null }, data: { deletedAt: new Date(), body: "" } });
    if (!result.count) throw new AppError("NOT_FOUND", "Message not found or already deleted", 404);
    const participants = await db.chatParticipant.findMany({ where: { conversationId }, select: { userId: true } });
    for (const p of participants) publish(p.userId, { conversationId, messageId });
    return { deleted: true };
  });

  app.get("/v1/bazchat/events", async (request, reply: FastifyReply) => {
    const { userId } = await requireSocialAuth(request);
    reply.raw.setHeader("content-type", "text/event-stream; charset=utf-8");
    reply.raw.setHeader("cache-control", "no-cache, no-transform");
    reply.raw.setHeader("x-accel-buffering", "no");
    reply.raw.setHeader("connection", "keep-alive");
    reply.hijack();
    reply.raw.write(": connected\n\n");
    const unsubscribe = subscribe(userId, (event) => { if (!reply.raw.destroyed) reply.raw.write(`event: changed\ndata: ${JSON.stringify(event)}\n\n`); });
    const heartbeat = setInterval(() => { if (!reply.raw.destroyed) reply.raw.write(": heartbeat\n\n"); }, 20000);
    const cleanup = () => { clearInterval(heartbeat); unsubscribe(); };
    request.raw.once("close", cleanup);
    reply.raw.once("close", cleanup);
  });
}
