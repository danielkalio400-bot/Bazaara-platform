-- Roadmaps 35-79 final integration.
-- Additive only: no DROP/TRUNCATE/data-reset statements.

ALTER TABLE "NativeAuthorizationCode" ALTER COLUMN "scope" SET DEFAULT 'openid profile';

ALTER TABLE "NativeSession"
ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'openid profile';

ALTER TABLE "OutboxEvent"
ADD COLUMN "processingStartedAt" TIMESTAMP(3);

CREATE INDEX "OutboxEvent_status_processingStartedAt_idx" ON "OutboxEvent"("status", "processingStartedAt");

CREATE TABLE "LogisticsQuote" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "pickup" JSONB NOT NULL,
  "dropoff" JSONB NOT NULL,
  "serviceLevel" TEXT NOT NULL,
  "weightGrams" INTEGER NOT NULL,
  "distanceMeters" INTEGER,
  "etaMinutes" INTEGER NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LogisticsQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LogisticsBooking" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "publicCode" TEXT NOT NULL,
  "trackingCode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "scheduledFor" TIMESTAMP(3),
  "assignedCourierUserId" TEXT,
  "pickupVerificationHash" TEXT NOT NULL,
  "deliveryVerificationHash" TEXT NOT NULL,
  "proof" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "LogisticsBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LogisticsBookingEvent" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LogisticsBookingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DrivePricingQuote" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "pickup" JSONB NOT NULL,
  "dropoff" JSONB NOT NULL,
  "rideClass" TEXT NOT NULL,
  "distanceMeters" INTEGER NOT NULL,
  "durationSeconds" INTEGER NOT NULL,
  "baseFareMinor" BIGINT NOT NULL,
  "distanceFareMinor" BIGINT NOT NULL,
  "timeFareMinor" BIGINT NOT NULL,
  "surgeBps" INTEGER NOT NULL DEFAULT 10000,
  "totalMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "fuelIndexBps" INTEGER NOT NULL DEFAULT 10000,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DrivePricingQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriveRide" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "riderUserId" TEXT NOT NULL,
  "driverUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "riderPinHash" TEXT NOT NULL,
  "driverOfferMinor" BIGINT,
  "acceptedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriveRide_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriveRideEvent" (
  "id" TEXT NOT NULL,
  "rideId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DriveRideEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayTransfer" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "fromWalletId" TEXT NOT NULL,
  "toWalletId" TEXT NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "ledgerTransactionId" TEXT,
  "idempotencyKey" TEXT,
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessBranch" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
  "address" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessApiCredential" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessApiCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessWebhookEndpoint" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "signingKeyId" TEXT NOT NULL,
  "events" TEXT[] NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessWebhookEndpoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessWebhookDelivery" (
  "id" TEXT NOT NULL,
  "endpointId" TEXT NOT NULL,
  "outboxEventId" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "responseStatus" INTEGER,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessWebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessInvoice" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "subtotalMinor" BIGINT NOT NULL,
  "taxMinor" BIGINT NOT NULL DEFAULT 0,
  "totalMinor" BIGINT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "lines" JSONB NOT NULL,
  "dueAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessSettlement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "grossMinor" BIGINT NOT NULL,
  "feeMinor" BIGINT NOT NULL DEFAULT 0,
  "netMinor" BIGINT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "provider" TEXT,
  "providerRef" TEXT,
  "scheduledFor" TIMESTAMP(3),
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessSettlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PharmacyProduct" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priceMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "stockOnHand" INTEGER NOT NULL DEFAULT 0,
  "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PharmacyProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PharmacyPrescription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "merchantId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "jurisdiction" TEXT NOT NULL,
  "documentAssetId" TEXT,
  "prescriber" JSONB,
  "items" JSONB,
  "rejectionReason" TEXT,
  "reviewedByUserId" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PharmacyPrescription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SportsCompetition" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "sport" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "country" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SportsCompetition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SportsFixture" (
  "id" TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "homeName" TEXT NOT NULL,
  "awayName" TEXT NOT NULL,
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "clock" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SportsFixture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "organizationId" TEXT,
  "bucket" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteSize" BIGINT NOT NULL,
  "checksumSha256" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
  "variants" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "region" TEXT,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataSubjectRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "region" TEXT,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "resultAssetId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "eventName" TEXT NOT NULL,
  "vertical" TEXT,
  "region" TEXT,
  "properties" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "points" BIGINT NOT NULL DEFAULT 0,
  "tier" TEXT NOT NULL DEFAULT 'STANDARD',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyEntry" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "points" BIGINT NOT NULL,
  "reason" TEXT NOT NULL,
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReputationAggregate" (
  "id" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "ratingAverage" DECIMAL(3,2),
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "riskBand" TEXT NOT NULL DEFAULT 'NORMAL',
  "components" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReputationAggregate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegionalConfig" (
  "id" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "vertical" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
  "locale" TEXT NOT NULL DEFAULT 'en-NG',
  "rules" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegionalConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LogisticsBooking_publicCode_key" ON "LogisticsBooking"("publicCode");
CREATE UNIQUE INDEX "LogisticsBooking_trackingCode_key" ON "LogisticsBooking"("trackingCode");
CREATE UNIQUE INDEX "PayTransfer_reference_key" ON "PayTransfer"("reference");
CREATE UNIQUE INDEX "PayTransfer_ledgerTransactionId_key" ON "PayTransfer"("ledgerTransactionId");
CREATE UNIQUE INDEX "BusinessBranch_organizationId_code_key" ON "BusinessBranch"("organizationId", "code");
CREATE UNIQUE INDEX "BusinessWebhookDelivery_endpointId_outboxEventId_key" ON "BusinessWebhookDelivery"("endpointId", "outboxEventId");
CREATE UNIQUE INDEX "BusinessInvoice_organizationId_invoiceNumber_key" ON "BusinessInvoice"("organizationId", "invoiceNumber");
CREATE UNIQUE INDEX "BusinessSettlement_reference_key" ON "BusinessSettlement"("reference");
CREATE UNIQUE INDEX "PharmacyProduct_slug_key" ON "PharmacyProduct"("slug");
CREATE UNIQUE INDEX "PharmacyProduct_merchantId_sku_key" ON "PharmacyProduct"("merchantId", "sku");
CREATE UNIQUE INDEX "SportsCompetition_provider_providerId_key" ON "SportsCompetition"("provider", "providerId");
CREATE UNIQUE INDEX "SportsFixture_provider_providerId_key" ON "SportsFixture"("provider", "providerId");
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");
CREATE UNIQUE INDEX "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");
CREATE UNIQUE INDEX "ReputationAggregate_subjectType_subjectId_key" ON "ReputationAggregate"("subjectType", "subjectId");
CREATE UNIQUE INDEX "RegionalConfig_region_vertical_key" ON "RegionalConfig"("region", "vertical");

CREATE INDEX "LogisticsQuote_userId_createdAt_idx" ON "LogisticsQuote"("userId", "createdAt");
CREATE INDEX "LogisticsQuote_expiresAt_idx" ON "LogisticsQuote"("expiresAt");
CREATE INDEX "LogisticsBooking_userId_status_createdAt_idx" ON "LogisticsBooking"("userId", "status", "createdAt");
CREATE INDEX "LogisticsBooking_assignedCourierUserId_status_createdAt_idx" ON "LogisticsBooking"("assignedCourierUserId", "status", "createdAt");
CREATE INDEX "LogisticsBooking_quoteId_idx" ON "LogisticsBooking"("quoteId");
CREATE INDEX "LogisticsBookingEvent_bookingId_createdAt_idx" ON "LogisticsBookingEvent"("bookingId", "createdAt");
CREATE INDEX "LogisticsBookingEvent_type_createdAt_idx" ON "LogisticsBookingEvent"("type", "createdAt");
CREATE INDEX "DrivePricingQuote_userId_createdAt_idx" ON "DrivePricingQuote"("userId", "createdAt");
CREATE INDEX "DrivePricingQuote_expiresAt_idx" ON "DrivePricingQuote"("expiresAt");
CREATE INDEX "DriveRide_riderUserId_status_createdAt_idx" ON "DriveRide"("riderUserId", "status", "createdAt");
CREATE INDEX "DriveRide_driverUserId_status_createdAt_idx" ON "DriveRide"("driverUserId", "status", "createdAt");
CREATE INDEX "DriveRide_quoteId_idx" ON "DriveRide"("quoteId");
CREATE INDEX "DriveRideEvent_rideId_createdAt_idx" ON "DriveRideEvent"("rideId", "createdAt");
CREATE INDEX "DriveRideEvent_type_createdAt_idx" ON "DriveRideEvent"("type", "createdAt");
CREATE INDEX "PayTransfer_actorUserId_createdAt_idx" ON "PayTransfer"("actorUserId", "createdAt");
CREATE INDEX "PayTransfer_fromWalletId_createdAt_idx" ON "PayTransfer"("fromWalletId", "createdAt");
CREATE INDEX "PayTransfer_toWalletId_createdAt_idx" ON "PayTransfer"("toWalletId", "createdAt");
CREATE INDEX "PayTransfer_status_createdAt_idx" ON "PayTransfer"("status", "createdAt");
CREATE INDEX "BusinessBranch_organizationId_status_idx" ON "BusinessBranch"("organizationId", "status");
CREATE INDEX "BusinessApiCredential_organizationId_revokedAt_createdAt_idx" ON "BusinessApiCredential"("organizationId", "revokedAt", "createdAt");
CREATE INDEX "BusinessApiCredential_keyPrefix_idx" ON "BusinessApiCredential"("keyPrefix");
CREATE INDEX "BusinessWebhookEndpoint_organizationId_status_idx" ON "BusinessWebhookEndpoint"("organizationId", "status");
CREATE INDEX "BusinessWebhookDelivery_status_nextAttemptAt_createdAt_idx" ON "BusinessWebhookDelivery"("status", "nextAttemptAt", "createdAt");
CREATE INDEX "BusinessInvoice_organizationId_status_createdAt_idx" ON "BusinessInvoice"("organizationId", "status", "createdAt");
CREATE INDEX "BusinessSettlement_organizationId_status_createdAt_idx" ON "BusinessSettlement"("organizationId", "status", "createdAt");
CREATE INDEX "PharmacyProduct_merchantId_active_category_idx" ON "PharmacyProduct"("merchantId", "active", "category");
CREATE INDEX "PharmacyProduct_requiresPrescription_active_idx" ON "PharmacyProduct"("requiresPrescription", "active");
CREATE INDEX "PharmacyPrescription_userId_status_createdAt_idx" ON "PharmacyPrescription"("userId", "status", "createdAt");
CREATE INDEX "PharmacyPrescription_merchantId_status_createdAt_idx" ON "PharmacyPrescription"("merchantId", "status", "createdAt");
CREATE INDEX "SportsCompetition_sport_active_idx" ON "SportsCompetition"("sport", "active");
CREATE INDEX "SportsFixture_competitionId_startsAt_idx" ON "SportsFixture"("competitionId", "startsAt");
CREATE INDEX "SportsFixture_status_startsAt_idx" ON "SportsFixture"("status", "startsAt");
CREATE INDEX "MediaAsset_ownerUserId_createdAt_idx" ON "MediaAsset"("ownerUserId", "createdAt");
CREATE INDEX "MediaAsset_organizationId_createdAt_idx" ON "MediaAsset"("organizationId", "createdAt");
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");
CREATE INDEX "ConsentRecord_userId_purpose_createdAt_idx" ON "ConsentRecord"("userId", "purpose", "createdAt");
CREATE INDEX "DataSubjectRequest_userId_status_createdAt_idx" ON "DataSubjectRequest"("userId", "status", "createdAt");
CREATE INDEX "DataSubjectRequest_status_dueAt_idx" ON "DataSubjectRequest"("status", "dueAt");
CREATE INDEX "AnalyticsEvent_eventName_occurredAt_idx" ON "AnalyticsEvent"("eventName", "occurredAt");
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");
CREATE INDEX "AnalyticsEvent_vertical_occurredAt_idx" ON "AnalyticsEvent"("vertical", "occurredAt");
CREATE INDEX "LoyaltyEntry_accountId_createdAt_idx" ON "LoyaltyEntry"("accountId", "createdAt");
CREATE INDEX "LoyaltyEntry_reference_idx" ON "LoyaltyEntry"("reference");
CREATE INDEX "ReputationAggregate_riskBand_score_idx" ON "ReputationAggregate"("riskBand", "score");
CREATE INDEX "RegionalConfig_vertical_enabled_idx" ON "RegionalConfig"("vertical", "enabled");

ALTER TABLE "LogisticsBooking" ADD CONSTRAINT "LogisticsBooking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "LogisticsQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogisticsBookingEvent" ADD CONSTRAINT "LogisticsBookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "LogisticsBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriveRide" ADD CONSTRAINT "DriveRide_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "DrivePricingQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DriveRideEvent" ADD CONSTRAINT "DriveRideEvent_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "DriveRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessWebhookDelivery" ADD CONSTRAINT "BusinessWebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "BusinessWebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SportsFixture" ADD CONSTRAINT "SportsFixture_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "SportsCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltyEntry" ADD CONSTRAINT "LoyaltyEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
