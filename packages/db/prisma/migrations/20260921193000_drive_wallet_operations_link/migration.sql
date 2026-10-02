-- Drive -> BAZAARA Wallet settlement bridge.
-- Earnings remain in the Drive liability account until the authenticated driver
-- moves them into the user's spendable Wallet. Every movement is ledger-backed
-- and idempotently recorded here for Finance Operations reconciliation.
CREATE TABLE "DriveDriverPayout" (
    "id" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "sourceLedgerAccountId" TEXT,
    "destinationWalletId" TEXT,
    "ledgerTransactionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "initiatedByUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "DriveDriverPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DriveDriverPayout_ledgerTransactionId_key"
  ON "DriveDriverPayout"("ledgerTransactionId");
CREATE UNIQUE INDEX "DriveDriverPayout_driverUserId_idempotencyKey_key"
  ON "DriveDriverPayout"("driverUserId", "idempotencyKey");
CREATE INDEX "DriveDriverPayout_driverUserId_createdAt_idx"
  ON "DriveDriverPayout"("driverUserId", "createdAt");
CREATE INDEX "DriveDriverPayout_status_createdAt_idx"
  ON "DriveDriverPayout"("status", "createdAt");
