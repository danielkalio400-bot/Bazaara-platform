-- BAZAARA Roadmaps 11-15: additive Shopping promotions, reviews, search telemetry,
-- Wishlist variant snapshots and merchant inventory management.
-- This migration intentionally contains no DROP/TRUNCATE/data-reset operations.

-- CreateEnum
CREATE TYPE "PromotionActivation" AS ENUM ('CODE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "PromotionApplicationSource" AS ENUM ('CODE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "PromotionApplicationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReviewMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ReviewReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- AlterTable
ALTER TABLE "Store"
ADD COLUMN "fulfillmentModes" TEXT[] NOT NULL DEFAULT ARRAY['STANDARD']::TEXT[];

-- AlterTable
ALTER TABLE "WishlistItem"
ADD COLUMN "variantId" TEXT,
ADD COLUMN "priceMinorAtAdd" BIGINT;

-- AlterTable
ALTER TABLE "Promotion"
ADD COLUMN "activation" "PromotionActivation" NOT NULL DEFAULT 'CODE',
ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "budgetMinor" BIGINT,
ADD COLUMN "customerSegments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "eligibleCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "eligibleRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "excludedProductIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "excludedCategoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "excludedMerchantIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "allowStacking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stackGroup" TEXT,
ADD COLUMN "fraudRules" JSONB;

-- AlterTable
ALTER TABLE "ProductReview"
ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "editDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SellerReview"
ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "editDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PromotionApplication" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "checkoutId" TEXT,
    "orderId" TEXT,
    "userId" TEXT NOT NULL,
    "source" "PromotionApplicationSource" NOT NULL,
    "status" "PromotionApplicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    CONSTRAINT "PromotionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionAttempt" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT,
    "checkoutId" TEXT,
    "userId" TEXT,
    "code" TEXT,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "requestFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMedia" (
    "id" TEXT NOT NULL,
    "productReviewId" TEXT,
    "sellerReviewId" TEXT,
    "type" "ReviewMediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "productReviewId" TEXT,
    "sellerReviewId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReviewReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMerchantResponse" (
    "id" TEXT NOT NULL,
    "productReviewId" TEXT,
    "sellerReviewId" TEXT,
    "merchantId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReviewMerchantResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQueryEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "originalQuery" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "recoveredQuery" TEXT,
    "resultCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchQueryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WishlistItem_variantId_idx" ON "WishlistItem"("variantId");
CREATE INDEX "Promotion_activation_status_priority_idx" ON "Promotion"("activation", "status", "priority");
CREATE UNIQUE INDEX "PromotionApplication_checkoutId_promotionId_key" ON "PromotionApplication"("checkoutId", "promotionId");
CREATE UNIQUE INDEX "PromotionApplication_orderId_promotionId_key" ON "PromotionApplication"("orderId", "promotionId");
CREATE INDEX "PromotionApplication_promotionId_status_createdAt_idx" ON "PromotionApplication"("promotionId", "status", "createdAt");
CREATE INDEX "PromotionApplication_userId_promotionId_status_idx" ON "PromotionApplication"("userId", "promotionId", "status");
CREATE INDEX "PromotionAttempt_promotionId_createdAt_idx" ON "PromotionAttempt"("promotionId", "createdAt");
CREATE INDEX "PromotionAttempt_userId_createdAt_idx" ON "PromotionAttempt"("userId", "createdAt");
CREATE INDEX "PromotionAttempt_requestFingerprint_createdAt_idx" ON "PromotionAttempt"("requestFingerprint", "createdAt");
CREATE INDEX "ReviewMedia_productReviewId_sortOrder_idx" ON "ReviewMedia"("productReviewId", "sortOrder");
CREATE INDEX "ReviewMedia_sellerReviewId_sortOrder_idx" ON "ReviewMedia"("sellerReviewId", "sortOrder");
CREATE UNIQUE INDEX "ReviewReport_reporterUserId_productReviewId_key" ON "ReviewReport"("reporterUserId", "productReviewId");
CREATE UNIQUE INDEX "ReviewReport_reporterUserId_sellerReviewId_key" ON "ReviewReport"("reporterUserId", "sellerReviewId");
CREATE INDEX "ReviewReport_status_createdAt_idx" ON "ReviewReport"("status", "createdAt");
CREATE UNIQUE INDEX "ReviewMerchantResponse_productReviewId_key" ON "ReviewMerchantResponse"("productReviewId");
CREATE UNIQUE INDEX "ReviewMerchantResponse_sellerReviewId_key" ON "ReviewMerchantResponse"("sellerReviewId");
CREATE INDEX "ReviewMerchantResponse_merchantId_createdAt_idx" ON "ReviewMerchantResponse"("merchantId", "createdAt");
CREATE INDEX "SearchQueryEvent_normalizedQuery_createdAt_idx" ON "SearchQueryEvent"("normalizedQuery", "createdAt");
CREATE INDEX "SearchQueryEvent_userId_createdAt_idx" ON "SearchQueryEvent"("userId", "createdAt");
CREATE INDEX "InventoryAdjustment_storeId_createdAt_idx" ON "InventoryAdjustment"("storeId", "createdAt");
CREATE INDEX "InventoryAdjustment_variantId_createdAt_idx" ON "InventoryAdjustment"("variantId", "createdAt");
CREATE INDEX "InventoryAdjustment_actorUserId_createdAt_idx" ON "InventoryAdjustment"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "ShoppingCheckout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionAttempt" ADD CONSTRAINT "PromotionAttempt_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromotionAttempt" ADD CONSTRAINT "PromotionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_sellerReviewId_fkey" FOREIGN KEY ("sellerReviewId") REFERENCES "SellerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_sellerReviewId_fkey" FOREIGN KEY ("sellerReviewId") REFERENCES "SellerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_sellerReviewId_fkey" FOREIGN KEY ("sellerReviewId") REFERENCES "SellerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SearchQueryEvent" ADD CONSTRAINT "SearchQueryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
