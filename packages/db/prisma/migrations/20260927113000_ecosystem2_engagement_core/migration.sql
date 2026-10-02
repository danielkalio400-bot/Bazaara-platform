-- BAZAARA ECOSYSTEM 2 — engagement, replies and transfer controls.
ALTER TABLE "ChatMessage"
  ADD COLUMN "replyToMessageId" TEXT;
CREATE INDEX "ChatMessage_replyToMessageId_idx" ON "ChatMessage"("replyToMessageId");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CircleComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" VARCHAR(1200) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CircleComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CircleComment_postId_createdAt_id_idx" ON "CircleComment"("postId", "createdAt", "id");
CREATE INDEX "CircleComment_authorId_createdAt_idx" ON "CircleComment"("authorId", "createdAt");
ALTER TABLE "CircleComment" ADD CONSTRAINT "CircleComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CirclePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleComment" ADD CONSTRAINT "CircleComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ForumThreadVote" (
  "threadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumThreadVote_pkey" PRIMARY KEY ("threadId", "userId"),
  CONSTRAINT "ForumThreadVote_value_check" CHECK ("value" IN (-1, 1))
);
CREATE INDEX "ForumThreadVote_userId_createdAt_idx" ON "ForumThreadVote"("userId", "createdAt");
ALTER TABLE "ForumThreadVote" ADD CONSTRAINT "ForumThreadVote_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumThreadVote" ADD CONSTRAINT "ForumThreadVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClipPost"
  ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ClipComment" (
  "id" TEXT NOT NULL,
  "clipId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" VARCHAR(1000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClipComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClipComment_clipId_createdAt_id_idx" ON "ClipComment"("clipId", "createdAt", "id");
CREATE INDEX "ClipComment_authorId_createdAt_idx" ON "ClipComment"("authorId", "createdAt");
ALTER TABLE "ClipComment" ADD CONSTRAINT "ClipComment_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "ClipPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClipComment" ADD CONSTRAINT "ClipComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TuneTrack"
  ADD COLUMN "playCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "TuneFavorite" (
  "trackId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TuneFavorite_pkey" PRIMARY KEY ("trackId", "userId")
);
CREATE INDEX "TuneFavorite_userId_createdAt_idx" ON "TuneFavorite"("userId", "createdAt");
ALTER TABLE "TuneFavorite" ADD CONSTRAINT "TuneFavorite_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "TuneTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TuneFavorite" ADD CONSTRAINT "TuneFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SendTransfer"
  ADD COLUMN "note" VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxDownloads" INTEGER;
ALTER TABLE "SendTransfer" ADD CONSTRAINT "SendTransfer_maxDownloads_check" CHECK ("maxDownloads" IS NULL OR "maxDownloads" BETWEEN 1 AND 25);
