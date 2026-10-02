CREATE TABLE "PayFundingIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "providerReference" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "checkoutUrl" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "PayFundingIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayFundingIntent_providerReference_key" ON "PayFundingIntent"("providerReference");
CREATE UNIQUE INDEX "PayFundingIntent_userId_idempotencyKey_key" ON "PayFundingIntent"("userId", "idempotencyKey");
CREATE INDEX "PayFundingIntent_userId_createdAt_idx" ON "PayFundingIntent"("userId", "createdAt");
CREATE INDEX "PayFundingIntent_walletId_createdAt_idx" ON "PayFundingIntent"("walletId", "createdAt");
CREATE INDEX "PayFundingIntent_status_createdAt_idx" ON "PayFundingIntent"("status", "createdAt");
