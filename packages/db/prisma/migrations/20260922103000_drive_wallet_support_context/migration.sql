ALTER TABLE "SupportCase"
  ADD COLUMN "driveRideId" TEXT,
  ADD COLUMN "ledgerTransactionId" TEXT;

CREATE INDEX "SupportCase_driveRideId_createdAt_idx"
  ON "SupportCase"("driveRideId", "createdAt");

CREATE INDEX "SupportCase_ledgerTransactionId_createdAt_idx"
  ON "SupportCase"("ledgerTransactionId", "createdAt");

ALTER TABLE "SupportCase"
  ADD CONSTRAINT "SupportCase_driveRideId_fkey"
  FOREIGN KEY ("driveRideId") REFERENCES "DriveRide"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportCase"
  ADD CONSTRAINT "SupportCase_ledgerTransactionId_fkey"
  FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
