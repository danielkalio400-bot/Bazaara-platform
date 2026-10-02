-- BAZAARA ECOSYSTEM 2 — media, creation and permissioned sharing core.
ALTER TABLE "ChatMessage"
  ADD COLUMN "assetId" TEXT,
  ADD COLUMN "attachmentName" VARCHAR(240),
  ADD COLUMN "attachmentType" VARCHAR(160),
  ADD COLUMN "attachmentBytes" BIGINT;

ALTER TABLE "CirclePost"
  ADD COLUMN "mediaAssetId" TEXT;

CREATE TABLE "ClipPost" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "caption" VARCHAR(2200) NOT NULL DEFAULT '',
  "visibility" VARCHAR(12) NOT NULL DEFAULT 'PUBLIC',
  "status" VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClipPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClipPost_visibility_check" CHECK ("visibility" IN ('PUBLIC','PRIVATE')),
  CONSTRAINT "ClipPost_status_check" CHECK ("status" IN ('DRAFT','PUBLISHED','REMOVED'))
);
CREATE UNIQUE INDEX "ClipPost_assetId_key" ON "ClipPost"("assetId");
CREATE INDEX "ClipPost_visibility_status_createdAt_id_idx" ON "ClipPost"("visibility", "status", "createdAt", "id");
CREATE INDEX "ClipPost_creatorId_createdAt_idx" ON "ClipPost"("creatorId", "createdAt");
ALTER TABLE "ClipPost" ADD CONSTRAINT "ClipPost_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ClipLike" (
  "clipId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClipLike_pkey" PRIMARY KEY ("clipId", "userId")
);
CREATE INDEX "ClipLike_userId_createdAt_idx" ON "ClipLike"("userId", "createdAt");
ALTER TABLE "ClipLike" ADD CONSTRAINT "ClipLike_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "ClipPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClipLike" ADD CONSTRAINT "ClipLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TuneTrack" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "artistLabel" VARCHAR(120) NOT NULL DEFAULT '',
  "visibility" VARCHAR(12) NOT NULL DEFAULT 'PUBLIC',
  "status" VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TuneTrack_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TuneTrack_visibility_check" CHECK ("visibility" IN ('PUBLIC','PRIVATE')),
  CONSTRAINT "TuneTrack_status_check" CHECK ("status" IN ('DRAFT','PUBLISHED','REMOVED'))
);
CREATE UNIQUE INDEX "TuneTrack_assetId_key" ON "TuneTrack"("assetId");
CREATE INDEX "TuneTrack_visibility_status_createdAt_id_idx" ON "TuneTrack"("visibility", "status", "createdAt", "id");
CREATE INDEX "TuneTrack_creatorId_createdAt_idx" ON "TuneTrack"("creatorId", "createdAt");
ALTER TABLE "TuneTrack" ADD CONSTRAINT "TuneTrack_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TunePlaylist" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" VARCHAR(300) NOT NULL DEFAULT '',
  "visibility" VARCHAR(12) NOT NULL DEFAULT 'PRIVATE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TunePlaylist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TunePlaylist_visibility_check" CHECK ("visibility" IN ('PUBLIC','PRIVATE'))
);
CREATE INDEX "TunePlaylist_ownerUserId_updatedAt_idx" ON "TunePlaylist"("ownerUserId", "updatedAt");
ALTER TABLE "TunePlaylist" ADD CONSTRAINT "TunePlaylist_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TunePlaylistItem" (
  "playlistId" TEXT NOT NULL,
  "trackId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TunePlaylistItem_pkey" PRIMARY KEY ("playlistId", "trackId")
);
CREATE INDEX "TunePlaylistItem_playlistId_position_addedAt_idx" ON "TunePlaylistItem"("playlistId", "position", "addedAt");
ALTER TABLE "TunePlaylistItem" ADD CONSTRAINT "TunePlaylistItem_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "TunePlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TunePlaylistItem" ADD CONSTRAINT "TunePlaylistItem_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "TuneTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CutProject" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "sourceAssetId" TEXT,
  "title" VARCHAR(160) NOT NULL,
  "editPlan" JSONB NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CutProject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CutProject_status_check" CHECK ("status" IN ('DRAFT','READY','ARCHIVED'))
);
CREATE INDEX "CutProject_ownerUserId_updatedAt_idx" ON "CutProject"("ownerUserId", "updatedAt");
ALTER TABLE "CutProject" ADD CONSTRAINT "CutProject_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SendTransfer" (
  "id" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "recipientUserId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "fileName" VARCHAR(240) NOT NULL,
  "contentType" VARCHAR(160) NOT NULL,
  "byteSize" BIGINT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "downloadedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SendTransfer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SendTransfer_different_users" CHECK ("senderUserId" <> "recipientUserId"),
  CONSTRAINT "SendTransfer_status_check" CHECK ("status" IN ('PENDING','ACCEPTED','REVOKED','EXPIRED'))
);
CREATE INDEX "SendTransfer_senderUserId_createdAt_idx" ON "SendTransfer"("senderUserId", "createdAt");
CREATE INDEX "SendTransfer_recipientUserId_status_createdAt_idx" ON "SendTransfer"("recipientUserId", "status", "createdAt");
CREATE INDEX "SendTransfer_expiresAt_status_idx" ON "SendTransfer"("expiresAt", "status");
ALTER TABLE "SendTransfer" ADD CONSTRAINT "SendTransfer_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SendTransfer" ADD CONSTRAINT "SendTransfer_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
