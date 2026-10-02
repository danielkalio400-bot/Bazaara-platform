ALTER TABLE "Organization"
ADD COLUMN "bTaxId" TEXT;

CREATE UNIQUE INDEX "Organization_bTaxId_key"
ON "Organization"("bTaxId");

CREATE TABLE "BusinessVerificationDocument" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessVerificationDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessVerificationDocument_organizationId_status_createdAt_idx"
ON "BusinessVerificationDocument"("organizationId","status","createdAt");

CREATE INDEX "BusinessVerificationDocument_assetId_idx"
ON "BusinessVerificationDocument"("assetId");

CREATE TABLE "BusinessPayoutAccount" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
  "bankCode" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumberLast4" TEXT NOT NULL,
  "providerRecipientCode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessPayoutAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessPayoutAccount_organizationId_key"
ON "BusinessPayoutAccount"("organizationId");

CREATE INDEX "BusinessPayoutAccount_status_updatedAt_idx"
ON "BusinessPayoutAccount"("status","updatedAt");

CREATE TABLE "BusinessWithdrawal" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "payoutAccountId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "providerReference" TEXT,
  "ledgerTransactionId" TEXT,
  "failureMessage" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  CONSTRAINT "BusinessWithdrawal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessWithdrawal_reference_key"
ON "BusinessWithdrawal"("reference");

CREATE UNIQUE INDEX "BusinessWithdrawal_ledgerTransactionId_key"
ON "BusinessWithdrawal"("ledgerTransactionId");

CREATE UNIQUE INDEX "BusinessWithdrawal_organizationId_idempotencyKey_key"
ON "BusinessWithdrawal"("organizationId","idempotencyKey");

CREATE INDEX "BusinessWithdrawal_organizationId_status_createdAt_idx"
ON "BusinessWithdrawal"("organizationId","status","createdAt");
