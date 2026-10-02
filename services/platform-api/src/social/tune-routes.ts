import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { excludedUserIds, publicAuthor, requireSocialAuth } from "./common.js";
import { mediaUrl, ownedReadyAsset, serializeAsset } from "../media/access.js";

const id = z.string().min(5).max(64);
const trackSelect = {
  id: true, assetId: true, title: true, artistLabel: true, visibility: true, status: true, durationMs: true, playCount: true, createdAt: true, creatorId: true,
  creator: { select: publicAuthor },
} as const;

export async function baztuneRoutes(app: FastifyInstance) {
  app.get("/v1/baztune/tracks", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const excluded = await excludedUserIds(userId);
    const rows = await db.tuneTrack.findMany({
      where: { creatorId: { notIn: excluded }, status: "PUBLISHED", OR: [{ visibility: "PUBLIC", creator: { status: "ACTIVE" } }, { creatorId: userId }] },
      select: trackSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
    });
    const [assets, favorites] = await Promise.all([
      db.mediaAsset.findMany({ where: { id: { in: rows.map((row) => row.assetId) }, status: "READY" } }),
      db.tuneFavorite.findMany({ where: { userId, trackId: { in: rows.map((row) => row.id) } }, select: { trackId: true } }),
    ]);
    const byId = new Map(assets.map((asset) => [asset.id, asset]));
    const favoriteIds = new Set(favorites.map((favorite) => favorite.trackId));
    return { tracks: rows.flatMap((row) => { const asset = byId.get(row.assetId); return asset ? [{ ...row, favorited: favoriteIds.has(row.id), media: { ...serializeAsset(asset), url: mediaUrl(asset, 1200) } }] : []; }) };
  });

  app.post("/v1/baztune/tracks", { config: { rateLimit: { max: 20, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const input = z.object({
      assetId: id,
      title: z.string().trim().min(1).max(160),
      artistLabel: z.string().trim().max(120).default(""),
      visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
      durationMs: z.number().int().positive().max(6 * 60 * 60 * 1000).optional(),
    }).strict().parse(request.body);
    const asset = await ownedReadyAsset(userId, input.assetId, ["audio/"]);
    if (Number(asset.byteSize) > 100 * 1024 * 1024) throw new AppError("BAD_REQUEST", "Audio exceeds the 100 MB limit", 400);
    await db.mediaAsset.update({ where: { id: asset.id }, data: { visibility: input.visibility } });
    const track = await db.tuneTrack.create({ data: { creatorId: userId, ...input }, select: trackSelect });
    return reply.code(201).send({ track: { ...track, media: { ...serializeAsset(asset), url: mediaUrl(asset, 1200) } } });
  });

  app.post("/v1/baztune/tracks/:trackId/play", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { trackId } = z.object({ trackId: id }).parse(request.params);
    const excluded = await excludedUserIds(userId);
    const track = await db.tuneTrack.findFirst({ where: { id: trackId, status: "PUBLISHED", creatorId: { notIn: excluded }, OR: [{ visibility: "PUBLIC" }, { creatorId: userId }] }, select: { id: true } });
    if (!track) throw new AppError("NOT_FOUND", "Track not found", 404);
    const updated = await db.tuneTrack.update({ where: { id: trackId }, data: { playCount: { increment: 1 } }, select: { playCount: true } });
    return { played: true, playCount: updated.playCount };
  });

  app.put("/v1/baztune/tracks/:trackId/favorite", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { trackId } = z.object({ trackId: id }).parse(request.params);
    const excluded = await excludedUserIds(userId);
    const track = await db.tuneTrack.findFirst({ where: { id: trackId, status: "PUBLISHED", creatorId: { notIn: excluded }, OR: [{ visibility: "PUBLIC" }, { creatorId: userId }] }, select: { id: true } });
    if (!track) throw new AppError("NOT_FOUND", "Track not found", 404);
    await db.tuneFavorite.upsert({ where: { trackId_userId: { trackId, userId } }, create: { trackId, userId }, update: {} });
    return { favorited: true };
  });

  app.delete("/v1/baztune/tracks/:trackId/favorite", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { trackId } = z.object({ trackId: id }).parse(request.params);
    await db.tuneFavorite.deleteMany({ where: { trackId, userId } });
    return { favorited: false };
  });

  app.delete("/v1/baztune/tracks/:trackId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { trackId } = z.object({ trackId: id }).parse(request.params);
    const result = await db.tuneTrack.updateMany({ where: { id: trackId, creatorId: userId, status: { not: "REMOVED" } }, data: { status: "REMOVED" } });
    if (!result.count) throw new AppError("NOT_FOUND", "Track not found", 404);
    return { deleted: true };
  });

  app.get("/v1/baztune/playlists", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const playlists = await db.tunePlaylist.findMany({
      where: { ownerUserId: userId },
      orderBy: { updatedAt: "desc" },
      include: { items: { orderBy: [{ position: "asc" }, { addedAt: "asc" }], include: { track: { select: trackSelect } } } },
    });
    return { playlists };
  });

  app.post("/v1/baztune/playlists", async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const input = z.object({ title: z.string().trim().min(1).max(120), description: z.string().trim().max(300).default(""), visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE") }).strict().parse(request.body);
    const playlist = await db.tunePlaylist.create({ data: { ownerUserId: userId, ...input } });
    return reply.code(201).send({ playlist });
  });

  app.put("/v1/baztune/playlists/:playlistId/tracks/:trackId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { playlistId, trackId } = z.object({ playlistId: id, trackId: id }).parse(request.params);
    const playlist = await db.tunePlaylist.findFirst({ where: { id: playlistId, ownerUserId: userId }, select: { id: true } });
    if (!playlist) throw new AppError("NOT_FOUND", "Playlist not found", 404);
    const track = await db.tuneTrack.findFirst({ where: { id: trackId, status: "PUBLISHED", OR: [{ visibility: "PUBLIC" }, { creatorId: userId }] }, select: { id: true } });
    if (!track) throw new AppError("NOT_FOUND", "Track not found", 404);
    const count = await db.tunePlaylistItem.count({ where: { playlistId } });
    await db.tunePlaylistItem.upsert({ where: { playlistId_trackId: { playlistId, trackId } }, create: { playlistId, trackId, position: count }, update: {} });
    return { added: true };
  });

  app.delete("/v1/baztune/playlists/:playlistId/tracks/:trackId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { playlistId, trackId } = z.object({ playlistId: id, trackId: id }).parse(request.params);
    const playlist = await db.tunePlaylist.findFirst({ where: { id: playlistId, ownerUserId: userId }, select: { id: true } });
    if (!playlist) throw new AppError("NOT_FOUND", "Playlist not found", 404);
    await db.tunePlaylistItem.deleteMany({ where: { playlistId, trackId } });
    return { removed: true };
  });
}
