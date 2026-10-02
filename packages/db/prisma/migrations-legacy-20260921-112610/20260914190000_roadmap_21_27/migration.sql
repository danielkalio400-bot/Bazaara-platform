-- Roadmaps 21-27: provider payments, notifications, support, risk and production-readiness domain records.
-- Additive only. Existing BazID users, catalogue, carts, orders, inventory, returns and payment records are preserved.

CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SUPPRESSED');
CREATE TYPE "SupportCaseStatus" AS ENUM ('OPEN', 'WAITING_CUSTOMER', 'WAITING_STAFF', 'ESCALATED', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportCasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "SupportMessageKind" AS ENUM ('CUSTOMER', 'STAFF', 'INTERNAL', 'SYSTEM');
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RiskSignalStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED');

ALTER TABLE "PaymentReconciliation" ADD COLUMN "reportedCurrency" TEXT;
ALTER TABLE "PaymentReconciliation" ADD COLUMN "expectedCurrency" TEXT;

CREATE TABLE "PushDeviceToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'EXPO',
  "token" TEXT NOT NULL,
  "deviceId" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushDeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "mandatory" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "templateKey" TEXT,
  "destination" TEXT,
  "provider" TEXT,
  "providerReference" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportCase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "productId" TEXT,
  "paymentIntentId" TEXT,
  "shipmentId" TEXT,
  "shoppingReturnId" TEXT,
  "category" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "SupportCaseStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "SupportCasePriority" NOT NULL DEFAULT 'NORMAL',
  "assignedToUserId" TEXT,
  "escalationReason" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "authorUserId" TEXT,
  "kind" "SupportMessageKind" NOT NULL,
  "body" TEXT NOT NULL,
  "attachmentUrls" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiskSignal" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "merchantId" TEXT,
  "orderId" TEXT,
  "type" TEXT NOT NULL,
  "severity" "RiskSeverity" NOT NULL,
  "score" INTEGER NOT NULL,
  "status" "RiskSignalStatus" NOT NULL DEFAULT 'OPEN',
  "explanation" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "resolvedByUserId" TEXT,
  CONSTRAINT "RiskSignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushDeviceToken_token_key" ON "PushDeviceToken"("token");
CREATE INDEX "PushDeviceToken_userId_enabled_lastSeenAt_idx" ON "PushDeviceToken"("userId", "enabled", "lastSeenAt");
CREATE INDEX "PushDeviceToken_provider_enabled_idx" ON "PushDeviceToken"("provider", "enabled");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_category_createdAt_idx" ON "Notification"("category", "createdAt");
CREATE INDEX "Notification_resourceType_resourceId_createdAt_idx" ON "Notification"("resourceType", "resourceId", "createdAt");
CREATE UNIQUE INDEX "NotificationDelivery_notificationId_channel_key" ON "NotificationDelivery"("notificationId", "channel");
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_channel_createdAt_idx" ON "NotificationDelivery"("status", "nextAttemptAt", "channel", "createdAt");
CREATE INDEX "SupportCase_userId_status_lastActivityAt_idx" ON "SupportCase"("userId", "status", "lastActivityAt");
CREATE INDEX "SupportCase_assignedToUserId_status_priority_idx" ON "SupportCase"("assignedToUserId", "status", "priority");
CREATE INDEX "SupportCase_orderId_createdAt_idx" ON "SupportCase"("orderId", "createdAt");
CREATE INDEX "SupportCase_paymentIntentId_createdAt_idx" ON "SupportCase"("paymentIntentId", "createdAt");
CREATE INDEX "SupportCase_shipmentId_createdAt_idx" ON "SupportCase"("shipmentId", "createdAt");
CREATE INDEX "SupportCase_shoppingReturnId_createdAt_idx" ON "SupportCase"("shoppingReturnId", "createdAt");
CREATE INDEX "SupportMessage_caseId_createdAt_idx" ON "SupportMessage"("caseId", "createdAt");
CREATE INDEX "SupportMessage_authorUserId_createdAt_idx" ON "SupportMessage"("authorUserId", "createdAt");
CREATE INDEX "RiskSignal_status_severity_createdAt_idx" ON "RiskSignal"("status", "severity", "createdAt");
CREATE INDEX "RiskSignal_userId_createdAt_idx" ON "RiskSignal"("userId", "createdAt");
CREATE INDEX "RiskSignal_merchantId_createdAt_idx" ON "RiskSignal"("merchantId", "createdAt");
CREATE INDEX "RiskSignal_orderId_createdAt_idx" ON "RiskSignal"("orderId", "createdAt");
CREATE INDEX "RiskSignal_type_createdAt_idx" ON "RiskSignal"("type", "createdAt");

ALTER TABLE "PushDeviceToken" ADD CONSTRAINT "PushDeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_shoppingReturnId_fkey" FOREIGN KEY ("shoppingReturnId") REFERENCES "ShoppingReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
