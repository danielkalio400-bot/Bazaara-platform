-- Phase 3: Food Web domain foundation.
-- Additive migration. Shopping, Grocery, BazID, carts, orders and shared platform records are preserved.

CREATE TYPE "FoodCartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED');
CREATE TYPE "FoodFulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');
CREATE TYPE "FoodOrderStatus" AS ENUM ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');

CREATE TABLE "FoodRestaurant" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "heroImageUrl" TEXT,
  "logoImageUrl" TEXT,
  "cuisineTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "priceBand" INTEGER NOT NULL DEFAULT 2,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
  "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
  "asapEnabled" BOOLEAN NOT NULL DEFAULT true,
  "scheduledEnabled" BOOLEAN NOT NULL DEFAULT true,
  "deliveryFeeMinor" BIGINT NOT NULL DEFAULT 0,
  "serviceFeeMinor" BIGINT NOT NULL DEFAULT 0,
  "minOrderMinor" BIGINT NOT NULL DEFAULT 0,
  "estimatedDeliveryMin" INTEGER NOT NULL DEFAULT 25,
  "estimatedDeliveryMax" INTEGER NOT NULL DEFAULT 45,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.6,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodRestaurant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodOpeningHour" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "openMinute" INTEGER NOT NULL,
  "closeMinute" INTEGER NOT NULL,
  "closed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "FoodOpeningHour_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodMenuSection" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "FoodMenuSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodMenuItem" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "priceMinor" BIGINT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "soldOut" BOOLEAN NOT NULL DEFAULT false,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "prepMinutes" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodMenuItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodModifierGroup" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "minSelect" INTEGER NOT NULL DEFAULT 0,
  "maxSelect" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "FoodModifierGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodModifierOption" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceDeltaMinor" BIGINT NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "FoodModifierOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodCart" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "userId" TEXT,
  "guestTokenHash" TEXT,
  "status" "FoodCartStatus" NOT NULL DEFAULT 'ACTIVE',
  "fulfillmentType" "FoodFulfillmentType" NOT NULL DEFAULT 'DELIVERY',
  "scheduledFor" TIMESTAMP(3),
  "cutleryRequired" BOOLEAN NOT NULL DEFAULT false,
  "contactless" BOOLEAN NOT NULL DEFAULT false,
  "deliveryAddress" JSONB,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodCart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodCartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "configurationKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "selectedModifiers" JSONB,
  "specialInstructions" TEXT,
  "unitPriceMinor" BIGINT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodCartItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodOrder" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "status" "FoodOrderStatus" NOT NULL DEFAULT 'PLACED',
  "fulfillmentType" "FoodFulfillmentType" NOT NULL,
  "scheduledFor" TIMESTAMP(3),
  "cutleryRequired" BOOLEAN NOT NULL DEFAULT false,
  "contactless" BOOLEAN NOT NULL DEFAULT false,
  "deliveryAddress" JSONB,
  "note" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "subtotalMinor" BIGINT NOT NULL,
  "deliveryFeeMinor" BIGINT NOT NULL DEFAULT 0,
  "serviceFeeMinor" BIGINT NOT NULL DEFAULT 0,
  "totalMinor" BIGINT NOT NULL,
  "paymentMethod" TEXT NOT NULL DEFAULT 'PAY_ON_DELIVERY',
  "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPriceMinor" BIGINT NOT NULL,
  "lineTotalMinor" BIGINT NOT NULL,
  "selectedModifiers" JSONB,
  "specialInstructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FoodRestaurant_merchantId_key" ON "FoodRestaurant"("merchantId");
CREATE UNIQUE INDEX "FoodRestaurant_slug_key" ON "FoodRestaurant"("slug");
CREATE INDEX "FoodRestaurant_status_rating_idx" ON "FoodRestaurant"("status", "rating");
CREATE UNIQUE INDEX "FoodOpeningHour_restaurantId_dayOfWeek_key" ON "FoodOpeningHour"("restaurantId", "dayOfWeek");
CREATE INDEX "FoodOpeningHour_restaurantId_dayOfWeek_idx" ON "FoodOpeningHour"("restaurantId", "dayOfWeek");
CREATE UNIQUE INDEX "FoodMenuSection_restaurantId_slug_key" ON "FoodMenuSection"("restaurantId", "slug");
CREATE INDEX "FoodMenuSection_restaurantId_active_sortOrder_idx" ON "FoodMenuSection"("restaurantId", "active", "sortOrder");
CREATE UNIQUE INDEX "FoodMenuItem_restaurantId_slug_key" ON "FoodMenuItem"("restaurantId", "slug");
CREATE INDEX "FoodMenuItem_restaurantId_active_featured_idx" ON "FoodMenuItem"("restaurantId", "active", "featured");
CREATE INDEX "FoodMenuItem_sectionId_active_sortOrder_idx" ON "FoodMenuItem"("sectionId", "active", "sortOrder");
CREATE INDEX "FoodModifierGroup_itemId_sortOrder_idx" ON "FoodModifierGroup"("itemId", "sortOrder");
CREATE INDEX "FoodModifierOption_groupId_active_sortOrder_idx" ON "FoodModifierOption"("groupId", "active", "sortOrder");
CREATE INDEX "FoodCart_restaurantId_userId_status_updatedAt_idx" ON "FoodCart"("restaurantId", "userId", "status", "updatedAt");
CREATE INDEX "FoodCart_restaurantId_guestTokenHash_status_updatedAt_idx" ON "FoodCart"("restaurantId", "guestTokenHash", "status", "updatedAt");
CREATE INDEX "FoodCart_guestTokenHash_status_updatedAt_idx" ON "FoodCart"("guestTokenHash", "status", "updatedAt");
CREATE UNIQUE INDEX "FoodCartItem_cartId_menuItemId_configurationKey_key" ON "FoodCartItem"("cartId", "menuItemId", "configurationKey");
CREATE INDEX "FoodCartItem_menuItemId_idx" ON "FoodCartItem"("menuItemId");
CREATE UNIQUE INDEX "FoodOrder_orderNumber_key" ON "FoodOrder"("orderNumber");
CREATE INDEX "FoodOrder_userId_createdAt_idx" ON "FoodOrder"("userId", "createdAt");
CREATE INDEX "FoodOrder_restaurantId_status_createdAt_idx" ON "FoodOrder"("restaurantId", "status", "createdAt");
CREATE INDEX "FoodOrderItem_orderId_idx" ON "FoodOrderItem"("orderId");
CREATE INDEX "FoodOrderItem_menuItemId_idx" ON "FoodOrderItem"("menuItemId");

ALTER TABLE "FoodRestaurant" ADD CONSTRAINT "FoodRestaurant_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOpeningHour" ADD CONSTRAINT "FoodOpeningHour_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuSection" ADD CONSTRAINT "FoodMenuSection_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuItem" ADD CONSTRAINT "FoodMenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuItem" ADD CONSTRAINT "FoodMenuItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FoodMenuSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodModifierGroup" ADD CONSTRAINT "FoodModifierGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodModifierOption" ADD CONSTRAINT "FoodModifierOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FoodModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodCartItem" ADD CONSTRAINT "FoodCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "FoodCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodCartItem" ADD CONSTRAINT "FoodCartItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
