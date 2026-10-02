CREATE TABLE "BusinessSubscription" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "planKey" TEXT NOT NULL DEFAULT 'STARTER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "priceMinor" BIGINT NOT NULL DEFAULT 0,
  "seats" INTEGER NOT NULL DEFAULT 3,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "trialEndsAt" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessSubscription_organizationId_key" ON "BusinessSubscription"("organizationId");
CREATE INDEX "BusinessSubscription_status_currentPeriodEnd_idx" ON "BusinessSubscription"("status", "currentPeriodEnd");
CREATE INDEX "BusinessSubscription_planKey_status_idx" ON "BusinessSubscription"("planKey", "status");

CREATE TABLE "BusinessSubscriptionEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "planKey" TEXT NOT NULL,
  "billingCycle" TEXT NOT NULL,
  "priceMinor" BIGINT NOT NULL,
  "actorUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessSubscriptionEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BusinessSubscriptionEvent_organizationId_createdAt_idx" ON "BusinessSubscriptionEvent"("organizationId", "createdAt");
CREATE INDEX "BusinessSubscriptionEvent_subscriptionId_createdAt_idx" ON "BusinessSubscriptionEvent"("subscriptionId", "createdAt");

CREATE TABLE "BusinessReportSchedule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
  "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "nextRunAt" TIMESTAMP(3),
  "lastRunAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessReportSchedule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BusinessReportSchedule_organizationId_active_nextRunAt_idx" ON "BusinessReportSchedule"("organizationId", "active", "nextRunAt");
CREATE INDEX "BusinessReportSchedule_organizationId_reportType_idx" ON "BusinessReportSchedule"("organizationId", "reportType");

CREATE TABLE "PlatformFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "organizationId" TEXT,
  "channel" TEXT NOT NULL DEFAULT 'PLATFORM',
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "rating" INTEGER,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "sourcePath" TEXT,
  "metadata" JSONB,
  "assignedToUserId" TEXT,
  "resolution" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformFeedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlatformFeedback_status_priority_createdAt_idx" ON "PlatformFeedback"("status", "priority", "createdAt");
CREATE INDEX "PlatformFeedback_organizationId_status_createdAt_idx" ON "PlatformFeedback"("organizationId", "status", "createdAt");
CREATE INDEX "PlatformFeedback_userId_createdAt_idx" ON "PlatformFeedback"("userId", "createdAt");
CREATE INDEX "PlatformFeedback_assignedToUserId_status_idx" ON "PlatformFeedback"("assignedToUserId", "status");
