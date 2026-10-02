ALTER TABLE "PayTransfer" ADD COLUMN "note" TEXT;

CREATE TABLE "PayProfile" (
  "userId" TEXT NOT NULL, "payTag" TEXT NOT NULL, "pinHash" TEXT, "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
  "pinLockedUntil" TIMESTAMP(3), "dailyTransferLimitMinor" BIGINT NOT NULL DEFAULT 50000000,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayProfile_pkey" PRIMARY KEY ("userId")
);
CREATE UNIQUE INDEX "PayProfile_payTag_key" ON "PayProfile"("payTag");
CREATE INDEX "PayProfile_payTag_idx" ON "PayProfile"("payTag");

CREATE TABLE "PayBeneficiary" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "walletId" TEXT NOT NULL, "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayBeneficiary_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PayBeneficiary_userId_walletId_key" ON "PayBeneficiary"("userId","walletId");
CREATE INDEX "PayBeneficiary_userId_createdAt_idx" ON "PayBeneficiary"("userId","createdAt");

CREATE TABLE "PayMoneyRequest" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "requesterUserId" TEXT NOT NULL, "requesterWalletId" TEXT NOT NULL,
  "payerUserId" TEXT, "payerWalletId" TEXT, "amountMinor" BIGINT NOT NULL, "currency" TEXT NOT NULL, "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING', "ledgerTransactionId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "paidAt" TIMESTAMP(3), "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "PayMoneyRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PayMoneyRequest_code_key" ON "PayMoneyRequest"("code");
CREATE UNIQUE INDEX "PayMoneyRequest_ledgerTransactionId_key" ON "PayMoneyRequest"("ledgerTransactionId");
CREATE INDEX "PayMoneyRequest_requesterUserId_createdAt_idx" ON "PayMoneyRequest"("requesterUserId","createdAt");
CREATE INDEX "PayMoneyRequest_payerUserId_createdAt_idx" ON "PayMoneyRequest"("payerUserId","createdAt");
CREATE INDEX "PayMoneyRequest_status_expiresAt_idx" ON "PayMoneyRequest"("status","expiresAt");

CREATE TABLE "PayBankAccount" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "provider" TEXT NOT NULL DEFAULT 'PAYSTACK', "bankCode" TEXT NOT NULL,
  "bankName" TEXT NOT NULL, "accountName" TEXT NOT NULL, "accountNumberLast4" TEXT NOT NULL, "providerRecipientCode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayBankAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PayBankAccount_providerRecipientCode_key" ON "PayBankAccount"("providerRecipientCode");
CREATE INDEX "PayBankAccount_userId_status_createdAt_idx" ON "PayBankAccount"("userId","status","createdAt");

CREATE TABLE "PayWithdrawal" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "walletId" TEXT NOT NULL, "bankAccountId" TEXT NOT NULL, "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
  "providerReference" TEXT, "amountMinor" BIGINT NOT NULL, "currency" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT NOT NULL, "ledgerTransactionId" TEXT, "failureMessage" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "completedAt" TIMESTAMP(3), "failedAt" TIMESTAMP(3), CONSTRAINT "PayWithdrawal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PayWithdrawal_providerReference_key" ON "PayWithdrawal"("providerReference");
CREATE UNIQUE INDEX "PayWithdrawal_ledgerTransactionId_key" ON "PayWithdrawal"("ledgerTransactionId");
CREATE UNIQUE INDEX "PayWithdrawal_userId_idempotencyKey_key" ON "PayWithdrawal"("userId","idempotencyKey");
CREATE INDEX "PayWithdrawal_userId_createdAt_idx" ON "PayWithdrawal"("userId","createdAt");
CREATE INDEX "PayWithdrawal_walletId_createdAt_idx" ON "PayWithdrawal"("walletId","createdAt");
CREATE INDEX "PayWithdrawal_status_createdAt_idx" ON "PayWithdrawal"("status","createdAt");
