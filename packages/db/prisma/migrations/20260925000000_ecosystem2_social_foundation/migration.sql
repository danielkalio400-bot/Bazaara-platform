-- ECOSYSTEM 2 local-first migration. Apply only after E1 is backed up and baseline passes.
CREATE TABLE "SocialProfile" (
 "userId" TEXT NOT NULL, "handle" VARCHAR(32) NOT NULL, "bio" VARCHAR(280) NOT NULL DEFAULT '',
 "discoverable" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("userId")
);
CREATE UNIQUE INDEX "SocialProfile_handle_key" ON "SocialProfile"("handle");
CREATE INDEX "SocialProfile_discoverable_handle_idx" ON "SocialProfile"("discoverable", "handle");
ALTER TABLE "SocialProfile" ADD CONSTRAINT "SocialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SocialBlock" (
 "blockerUserId" TEXT NOT NULL, "blockedUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SocialBlock_pkey" PRIMARY KEY ("blockerUserId", "blockedUserId"),
 CONSTRAINT "SocialBlock_different_users" CHECK ("blockerUserId" <> "blockedUserId")
);
CREATE INDEX "SocialBlock_blockedUserId_idx" ON "SocialBlock"("blockedUserId");
ALTER TABLE "SocialBlock" ADD CONSTRAINT "SocialBlock_blockerUserId_fkey" FOREIGN KEY ("blockerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialBlock" ADD CONSTRAINT "SocialBlock_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SocialFollow" (
 "followerUserId" TEXT NOT NULL, "followedUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SocialFollow_pkey" PRIMARY KEY ("followerUserId", "followedUserId"),
 CONSTRAINT "SocialFollow_different_users" CHECK ("followerUserId" <> "followedUserId")
);
CREATE INDEX "SocialFollow_followedUserId_idx" ON "SocialFollow"("followedUserId");
ALTER TABLE "SocialFollow" ADD CONSTRAINT "SocialFollow_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialFollow" ADD CONSTRAINT "SocialFollow_followedUserId_fkey" FOREIGN KEY ("followedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SocialReport" (
 "id" TEXT NOT NULL, "reporterUserId" TEXT NOT NULL, "targetType" VARCHAR(30) NOT NULL,
 "targetId" TEXT NOT NULL, "reason" VARCHAR(60) NOT NULL, "detail" VARCHAR(500) NOT NULL DEFAULT '',
 "status" TEXT NOT NULL DEFAULT 'OPEN', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SocialReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SocialReport_targetType_targetId_status_idx" ON "SocialReport"("targetType", "targetId", "status");
CREATE INDEX "SocialReport_reporterUserId_createdAt_idx" ON "SocialReport"("reporterUserId", "createdAt");
ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChatConversation" (
 "id" TEXT NOT NULL, "directKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChatConversation_directKey_key" ON "ChatConversation"("directKey");
CREATE TABLE "ChatParticipant" (
 "conversationId" TEXT NOT NULL, "userId" TEXT NOT NULL, "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("conversationId", "userId")
);
CREATE INDEX "ChatParticipant_userId_joinedAt_idx" ON "ChatParticipant"("userId", "joinedAt");
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChatMessage" (
 "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "senderUserId" TEXT NOT NULL,
 "clientNonce" TEXT NOT NULL, "body" VARCHAR(4000) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "deletedAt" TIMESTAMP(3), CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChatMessage_senderUserId_clientNonce_key" ON "ChatMessage"("senderUserId", "clientNonce");
CREATE INDEX "ChatMessage_conversationId_createdAt_id_idx" ON "ChatMessage"("conversationId", "createdAt", "id");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CirclePost" (
 "id" TEXT NOT NULL, "authorId" TEXT NOT NULL, "body" VARCHAR(2000) NOT NULL, "audience" VARCHAR(12) NOT NULL DEFAULT 'PUBLIC',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "CirclePost_pkey" PRIMARY KEY ("id"), CONSTRAINT "CirclePost_audience_check" CHECK ("audience" IN ('PUBLIC','PRIVATE'))
);
CREATE INDEX "CirclePost_authorId_createdAt_idx" ON "CirclePost"("authorId", "createdAt");
CREATE INDEX "CirclePost_audience_createdAt_id_idx" ON "CirclePost"("audience", "createdAt", "id");
ALTER TABLE "CirclePost" ADD CONSTRAINT "CirclePost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "CircleLike" (
 "postId" TEXT NOT NULL, "userId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "CircleLike_pkey" PRIMARY KEY ("postId", "userId")
);
CREATE INDEX "CircleLike_userId_idx" ON "CircleLike"("userId");
ALTER TABLE "CircleLike" ADD CONSTRAINT "CircleLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CirclePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleLike" ADD CONSTRAINT "CircleLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ForumTopic" (
 "id" TEXT NOT NULL, "slug" VARCHAR(50) NOT NULL, "name" VARCHAR(90) NOT NULL,
 "description" VARCHAR(300) NOT NULL DEFAULT '', "creatorId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ForumTopic_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ForumTopic_slug_key" ON "ForumTopic"("slug");
ALTER TABLE "ForumTopic" ADD CONSTRAINT "ForumTopic_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "ForumThread" (
 "id" TEXT NOT NULL, "topicId" TEXT NOT NULL, "authorId" TEXT NOT NULL,
 "title" VARCHAR(150) NOT NULL, "body" VARCHAR(10000) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ForumThread_topicId_createdAt_id_idx" ON "ForumThread"("topicId", "createdAt", "id");
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "ForumReply" (
 "id" TEXT NOT NULL, "threadId" TEXT NOT NULL, "authorId" TEXT NOT NULL,
 "body" VARCHAR(5000) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ForumReply_threadId_createdAt_id_idx" ON "ForumReply"("threadId", "createdAt", "id");
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
