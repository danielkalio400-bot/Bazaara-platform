-- Food courier lifecycle schema repair.
-- Additive and idempotent: safe when one or more columns already exist.

ALTER TABLE "FoodOrder"
  ADD COLUMN IF NOT EXISTS "deliveryPinHash" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryPinVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "courierUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "courierAssignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "pickedUpAt" TIMESTAMP(3);