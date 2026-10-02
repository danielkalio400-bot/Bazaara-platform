-- Food connected vertical slice v3.
-- Adds durable pricing/commission snapshots, promotion funding attribution,
-- and courier assignment timestamps without changing existing order-state enums.

ALTER TABLE "FoodOrder"
  ADD COLUMN "courierAssignedAt" TIMESTAMP(3),
  ADD COLUMN "pickedUpAt" TIMESTAMP(3);

ALTER TABLE "FoodPromotion"
  ADD COLUMN "fundingSource" TEXT NOT NULL DEFAULT 'MERCHANT',
  ADD COLUMN "merchantFundingBps" INTEGER NOT NULL DEFAULT 10000;

CREATE TABLE "FoodOrderEconomics" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "serviceFeeBps" INTEGER NOT NULL,
  "serviceFeeMinimumMinor" BIGINT NOT NULL,
  "serviceFeeMaximumMinor" BIGINT NOT NULL,
  "merchantCommissionBps" INTEGER NOT NULL,
  "merchantCommissionMinor" BIGINT NOT NULL,
  "merchantFundedDiscountMinor" BIGINT NOT NULL DEFAULT 0,
  "bazaaraFundedDiscountMinor" BIGINT NOT NULL DEFAULT 0,
  "merchantNetMinor" BIGINT NOT NULL,
  "courierGrossMinor" BIGINT NOT NULL DEFAULT 0,
  "goCommissionBps" INTEGER NOT NULL,
  "goCommissionMinor" BIGINT NOT NULL DEFAULT 0,
  "courierNetMinor" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodOrderEconomics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FoodOrderEconomics_orderId_key" ON "FoodOrderEconomics"("orderId");
CREATE INDEX "FoodOrderEconomics_createdAt_idx" ON "FoodOrderEconomics"("createdAt");

ALTER TABLE "FoodOrderEconomics"
  ADD CONSTRAINT "FoodOrderEconomics_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
