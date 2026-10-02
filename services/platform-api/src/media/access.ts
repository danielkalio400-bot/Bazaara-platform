import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { presignObject } from "./s3-signing.js";

export type ReadyMediaAsset = {
  id: string;
  ownerUserId: string | null;
  objectKey: string;
  mediaType: string;
  contentType: string;
  byteSize: bigint;
  status: string;
  visibility: string;
};

export async function readyAsset(assetId: string): Promise<ReadyMediaAsset> {
  const asset = await db.mediaAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      ownerUserId: true,
      objectKey: true,
      mediaType: true,
      contentType: true,
      byteSize: true,
      status: true,
      visibility: true,
    },
  });
  if (!asset || asset.status !== "READY") throw new AppError("NOT_FOUND", "Media asset is not ready", 404);
  return asset;
}

export async function ownedReadyAsset(userId: string, assetId: string, allowedPrefixes?: string[]) {
  const asset = await readyAsset(assetId);
  if (asset.ownerUserId !== userId) throw new AppError("FORBIDDEN", "You do not own this media asset", 403);
  if (allowedPrefixes?.length && !allowedPrefixes.some((prefix) => asset.contentType.startsWith(prefix))) {
    throw new AppError("BAD_REQUEST", "This file type is not supported for this action", 400);
  }
  return asset;
}

export function mediaUrl(asset: ReadyMediaAsset, expiresSeconds = 900) {
  return presignObject({ method: "GET", objectKey: asset.objectKey, expiresSeconds });
}

export function serializeAsset(asset: ReadyMediaAsset, includeUrl = false) {
  return {
    id: asset.id,
    mediaType: asset.mediaType,
    contentType: asset.contentType,
    byteSize: Number(asset.byteSize),
    visibility: asset.visibility,
    ...(includeUrl ? { url: mediaUrl(asset) } : {}),
  };
}
