-- GO FULL ECOSYSTEM V4
ALTER TABLE "SupportCase"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'CONSUMER',
  ADD COLUMN "region" TEXT NOT NULL DEFAULT 'NG',
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN',
  ADD COLUMN "slaDueAt" TIMESTAMP(3),
  ADD COLUMN "context" JSONB;

CREATE INDEX "SupportCase_organizationId_status_lastActivityAt_idx"
  ON "SupportCase"("organizationId", "status", "lastActivityAt");
CREATE INDEX "SupportCase_channel_status_priority_idx"
  ON "SupportCase"("channel", "status", "priority");

ALTER TABLE "LogisticsBooking"
  ADD COLUMN "fundingStatus" TEXT NOT NULL DEFAULT 'UNFUNDED',
  ADD COLUMN "amountPaidMinor" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "platformFeeBps" INTEGER NOT NULL DEFAULT 1500,
  ADD COLUMN "platformFeeMinor" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "courierPayoutMinor" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "escrowLedgerAccountId" TEXT,
  ADD COLUMN "fundingLedgerTransactionId" TEXT,
  ADD COLUMN "settlementLedgerTransactionId" TEXT,
  ADD COLUMN "refundLedgerTransactionId" TEXT,
  ADD COLUMN "cancelReason" TEXT,
  ADD COLUMN "failedReason" TEXT,
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastCourierLocation" JSONB,
  ADD COLUMN "acceptedAt" TIMESTAMP(3),
  ADD COLUMN "pickedUpAt" TIMESTAMP(3),
  ADD COLUMN "inTransitAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "returnedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "LogisticsBooking_fundingLedgerTransactionId_key"
  ON "LogisticsBooking"("fundingLedgerTransactionId");
CREATE UNIQUE INDEX "LogisticsBooking_settlementLedgerTransactionId_key"
  ON "LogisticsBooking"("settlementLedgerTransactionId");
CREATE UNIQUE INDEX "LogisticsBooking_refundLedgerTransactionId_key"
  ON "LogisticsBooking"("refundLedgerTransactionId");
CREATE INDEX "LogisticsBooking_fundingStatus_status_createdAt_idx"
  ON "LogisticsBooking"("fundingStatus", "status", "createdAt");
