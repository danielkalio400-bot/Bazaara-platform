ALTER TABLE "PayTransfer" ADD COLUMN "feeMinor" BIGINT NOT NULL DEFAULT 0;

CREATE TABLE "PayFixedSavings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "principalMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "lockUntil" TIMESTAMP(3) NOT NULL,
  "annualRateBps" INTEGER,
  "provider" TEXT,
  "providerReference" TEXT,
  "ledgerAccountId" TEXT,
  "fundingLedgerTransactionId" TEXT,
  "releaseLedgerTransactionId" TEXT,
  "pledgedLoanApplicationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "PayFixedSavings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PayFixedSavings_ledgerAccountId_key" ON "PayFixedSavings"("ledgerAccountId");
CREATE UNIQUE INDEX "PayFixedSavings_fundingLedgerTransactionId_key" ON "PayFixedSavings"("fundingLedgerTransactionId");
CREATE UNIQUE INDEX "PayFixedSavings_releaseLedgerTransactionId_key" ON "PayFixedSavings"("releaseLedgerTransactionId");
CREATE INDEX "PayFixedSavings_userId_status_lockUntil_idx" ON "PayFixedSavings"("userId","status","lockUntil");
CREATE INDEX "PayFixedSavings_walletId_createdAt_idx" ON "PayFixedSavings"("walletId","createdAt");

CREATE TABLE "PayLoanApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestedMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL,
  "termDays" INTEGER NOT NULL,
  "purpose" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_PARTNER',
  "pledgedSavingsId" TEXT,
  "lenderName" TEXT,
  "lenderReference" TEXT,
  "offeredPrincipalMinor" BIGINT,
  "interestBps" INTEGER,
  "feeMinor" BIGINT,
  "totalRepaymentMinor" BIGINT,
  "repaymentFrequency" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "offeredAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "PayLoanApplication_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PayLoanApplication_userId_status_createdAt_idx" ON "PayLoanApplication"("userId","status","createdAt");
CREATE INDEX "PayLoanApplication_pledgedSavingsId_idx" ON "PayLoanApplication"("pledgedSavingsId");
