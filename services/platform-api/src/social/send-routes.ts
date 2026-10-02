import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotification } from "../notifications/service.js";
import { mediaUrl, ownedReadyAsset } from "../media/access.js";
import { assertContactAllowed, requireSocialAuth } from "./common.js";

const id = z.string().min(5).max(64);
const userSelect = { id: true, displayName: true, socialProfile: { select: { handle: true } } } as const;

async function expireOldTransfers() {
  await db.sendTransfer.updateMany({ where: { status: { in: ["PENDING", "ACCEPTED"] }, expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
}
function serializeTransfer(row: any) {
  return { ...row, byteSize: Number(row.byteSize) };
}

export async function bazsendRoutes(app: FastifyInstance) {
  app.get("/v1/bazsend/transfers", async (request) => {
    const { userId } = await requireSocialAuth(request);
    await expireOldTransfers();
    const [inbox, outbox] = await Promise.all([
      db.sendTransfer.findMany({ where: { recipientUserId: userId }, include: { sender: { select: userSelect }, recipient: { select: userSelect } }, orderBy: { createdAt: "desc" }, take: 100 }),
      db.sendTransfer.findMany({ where: { senderUserId: userId }, include: { sender: { select: userSelect }, recipient: { select: userSelect } }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    return { inbox: inbox.map(serializeTransfer), outbox: outbox.map(serializeTransfer) };
  });

  app.post("/v1/bazsend/transfers", { config: { rateLimit: { max: 20, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const input = z.object({
      recipientUserId: id,
      assetId: id,
      fileName: z.string().trim().min(1).max(240),
      note: z.string().trim().max(500).default(""),
      maxDownloads: z.number().int().min(1).max(25).nullable().default(null),
      expiresInSeconds: z.number().int().min(3600).max(7 * 24 * 60 * 60).default(24 * 60 * 60),
    }).strict().parse(request.body);
    await assertContactAllowed(userId, input.recipientUserId);
    const asset = await ownedReadyAsset(userId, input.assetId);
    if (Number(asset.byteSize) > 250 * 1024 * 1024) throw new AppError("BAD_REQUEST", "Transfers are limited to 250 MB in this release", 400);
    await db.mediaAsset.update({ where: { id: asset.id }, data: { visibility: "PRIVATE" } });
    const transfer = await db.sendTransfer.create({ data: {
      senderUserId: userId,
      recipientUserId: input.recipientUserId,
      assetId: asset.id,
      fileName: input.fileName,
      contentType: asset.contentType,
      byteSize: asset.byteSize,
      note: input.note,
      maxDownloads: input.maxDownloads,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    }, include: { sender: { select: userSelect }, recipient: { select: userSelect } } });
    await queueNotification({ userId: input.recipientUserId, category: "BAZSEND", title: "New BazSend transfer", body: `${transfer.sender.displayName ?? "A BAZAARA member"} sent you ${transfer.fileName}`, resourceType: "SendTransfer", resourceId: transfer.id, channels: ["PUSH", "EMAIL"] }).catch(() => undefined);
    return reply.code(201).send({ transfer: serializeTransfer(transfer) });
  });

  app.post("/v1/bazsend/transfers/:transferId/accept", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { transferId } = z.object({ transferId: id }).parse(request.params);
    await expireOldTransfers();
    const row = await db.sendTransfer.findFirst({ where: { id: transferId, recipientUserId: userId, status: { in: ["PENDING", "ACCEPTED"] } } });
    if (!row) throw new AppError("NOT_FOUND", "Transfer is unavailable", 404);
    const updated = await db.sendTransfer.update({ where: { id: row.id }, data: { status: "ACCEPTED", acceptedAt: row.acceptedAt ?? new Date() } });
    return { transfer: serializeTransfer(updated) };
  });

  app.get("/v1/bazsend/transfers/:transferId/download", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { transferId } = z.object({ transferId: id }).parse(request.params);
    await expireOldTransfers();
    const row = await db.sendTransfer.findFirst({ where: { id: transferId, OR: [{ senderUserId: userId }, { recipientUserId: userId }], status: { in: ["PENDING", "ACCEPTED"] } } });
    if (!row) throw new AppError("NOT_FOUND", "Transfer is unavailable", 404);
    if (row.maxDownloads !== null && row.downloadCount >= row.maxDownloads) throw new AppError("CONFLICT", "This transfer has reached its download limit", 409);
    const asset = await ownedReadyAsset(row.senderUserId, row.assetId);
    let downloadCount = row.downloadCount;
    if (userId === row.recipientUserId) {
      const updated = await db.sendTransfer.update({ where: { id: row.id }, data: { status: "ACCEPTED", acceptedAt: row.acceptedAt ?? new Date(), downloadedAt: new Date(), downloadCount: { increment: 1 } }, select: { downloadCount: true } });
      downloadCount = updated.downloadCount;
    }
    return { download: { fileName: row.fileName, contentType: row.contentType, byteSize: Number(row.byteSize), url: mediaUrl(asset, 60), downloadCount, maxDownloads: row.maxDownloads } };
  });

  app.post("/v1/bazsend/transfers/:transferId/revoke", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { transferId } = z.object({ transferId: id }).parse(request.params);
    const row = await db.sendTransfer.findFirst({ where: { id: transferId, senderUserId: userId, status: { in: ["PENDING", "ACCEPTED"] } } });
    if (!row) throw new AppError("NOT_FOUND", "Transfer is unavailable", 404);
    const updated = await db.sendTransfer.update({ where: { id: row.id }, data: { status: "REVOKED", revokedAt: new Date() } });
    return { transfer: serializeTransfer(updated) };
  });
}
