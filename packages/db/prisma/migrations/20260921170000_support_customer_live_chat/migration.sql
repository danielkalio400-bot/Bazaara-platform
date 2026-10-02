-- Bazaara Business + Operations V9
-- Customer contact-center audit trail for Support Operations.

CREATE TABLE "SupportCustomerContactAttempt" (
    "id" TEXT NOT NULL,
    "clientActionId" TEXT NOT NULL,
    "supportCaseId" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "notificationId" TEXT,
    "channel" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "destinationLabel" TEXT,
    "reason" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "outcome" TEXT,
    "notes" TEXT,
    "durationSeconds" INTEGER,
    "followUpAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportCustomerContactAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportCustomerContactAttempt_clientActionId_key" ON "SupportCustomerContactAttempt"("clientActionId");
CREATE INDEX "SupportCustomerContactAttempt_supportCaseId_createdAt_idx" ON "SupportCustomerContactAttempt"("supportCaseId", "createdAt");
CREATE INDEX "SupportCustomerContactAttempt_customerUserId_createdAt_idx" ON "SupportCustomerContactAttempt"("customerUserId", "createdAt");
CREATE INDEX "SupportCustomerContactAttempt_actorUserId_createdAt_idx" ON "SupportCustomerContactAttempt"("actorUserId", "createdAt");
CREATE INDEX "SupportCustomerContactAttempt_status_createdAt_idx" ON "SupportCustomerContactAttempt"("status", "createdAt");
CREATE INDEX "SupportCustomerContactAttempt_notificationId_idx" ON "SupportCustomerContactAttempt"("notificationId");

ALTER TABLE "SupportCustomerContactAttempt"
ADD CONSTRAINT "SupportCustomerContactAttempt_supportCaseId_fkey"
FOREIGN KEY ("supportCaseId") REFERENCES "SupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportCustomerContactAttempt"
ADD CONSTRAINT "SupportCustomerContactAttempt_customerUserId_fkey"
FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportCustomerContactAttempt"
ADD CONSTRAINT "SupportCustomerContactAttempt_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportCustomerContactAttempt"
ADD CONSTRAINT "SupportCustomerContactAttempt_notificationId_fkey"
FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
