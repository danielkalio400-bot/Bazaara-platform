-- Bazaara Food Business / Operations / Food Support upgrade.
-- Historical FoodOrderEconomics rows remain immutable; commission policy changes apply only to future order snapshots.

ALTER TYPE "SupportMessageKind" ADD VALUE IF NOT EXISTS 'AI';

ALTER TABLE "SupportCase"
  ADD COLUMN IF NOT EXISTS "foodOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "foodRestaurantId" TEXT;

CREATE INDEX IF NOT EXISTS "SupportCase_foodOrderId_createdAt_idx"
  ON "SupportCase"("foodOrderId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportCase_foodRestaurantId_createdAt_idx"
  ON "SupportCase"("foodRestaurantId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "SupportCase"
    ADD CONSTRAINT "SupportCase_foodOrderId_fkey"
    FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SupportCase"
    ADD CONSTRAINT "SupportCase_foodRestaurantId_fkey"
    FOREIGN KEY ("foodRestaurantId") REFERENCES "FoodRestaurant"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE "FoodCommissionPolicy" (
  "id" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
  "restaurantId" TEXT,
  "merchantCommissionBps" INTEGER NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "reason" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "approvedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodCommissionPolicy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FoodCommissionPolicy_region_scope_active_effectiveFrom_idx"
  ON "FoodCommissionPolicy"("region", "scope", "active", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "FoodCommissionPolicy_restaurantId_active_effectiveFrom_idx"
  ON "FoodCommissionPolicy"("restaurantId", "active", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "FoodCommissionPolicy_effectiveTo_idx"
  ON "FoodCommissionPolicy"("effectiveTo");
