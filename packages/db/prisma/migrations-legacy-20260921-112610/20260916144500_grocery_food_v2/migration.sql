-- Grocery + Food production feature expansion.
-- Additive only. Existing identities, products, inventory, carts, orders and payments are preserved.

-- Scope the shared Shopping transaction engine by vertical without changing historical defaults.
ALTER TABLE "Cart" ADD COLUMN "vertical" TEXT NOT NULL DEFAULT 'SHOPPING';
DROP INDEX IF EXISTS "Cart_guestTokenHash_key";
CREATE UNIQUE INDEX "Cart_guestTokenHash_vertical_key" ON "Cart"("guestTokenHash", "vertical");
DROP INDEX IF EXISTS "Cart_userId_status_updatedAt_idx";
DROP INDEX IF EXISTS "Cart_guestTokenHash_status_updatedAt_idx";
CREATE INDEX "Cart_userId_vertical_status_updatedAt_idx" ON "Cart"("userId", "vertical", "status", "updatedAt");
CREATE INDEX "Cart_guestTokenHash_vertical_status_updatedAt_idx" ON "Cart"("guestTokenHash", "vertical", "status", "updatedAt");

ALTER TABLE "ShoppingCheckout"
  ADD COLUMN "vertical" TEXT NOT NULL DEFAULT 'SHOPPING',
  ADD COLUMN "pickupStoreId" TEXT,
  ADD COLUMN "groceryDeliverySlotId" TEXT;
ALTER TABLE "ShoppingOrder"
  ADD COLUMN "vertical" TEXT NOT NULL DEFAULT 'SHOPPING',
  ADD COLUMN "pickupStoreId" TEXT,
  ADD COLUMN "groceryDeliverySlotId" TEXT;
DROP INDEX IF EXISTS "ShoppingOrder_userId_createdAt_idx";
CREATE INDEX "ShoppingOrder_userId_vertical_createdAt_idx" ON "ShoppingOrder"("userId", "vertical", "createdAt");

-- Safely classify existing purely-Grocery records. Mixed historical carts/orders remain SHOPPING.
UPDATE "Cart" c
SET "vertical" = 'GROCERY'
WHERE EXISTS (
  SELECT 1 FROM "CartItem" ci
  JOIN "ProductVariant" pv ON pv."id" = ci."variantId"
  JOIN "Product" p ON p."id" = pv."productId"
  JOIN "Merchant" m ON m."id" = p."merchantId"
  WHERE ci."cartId" = c."id" AND m."vertical" = 'GROCERY'
)
AND NOT EXISTS (
  SELECT 1 FROM "CartItem" ci
  JOIN "ProductVariant" pv ON pv."id" = ci."variantId"
  JOIN "Product" p ON p."id" = pv."productId"
  JOIN "Merchant" m ON m."id" = p."merchantId"
  WHERE ci."cartId" = c."id" AND m."vertical" <> 'GROCERY'
);

UPDATE "ShoppingCheckout" sc SET "vertical" = c."vertical" FROM "Cart" c WHERE sc."cartId" = c."id";
UPDATE "ShoppingOrder" so SET "vertical" = sc."vertical" FROM "ShoppingCheckout" sc WHERE so."checkoutId" = sc."id";

CREATE TABLE "GroceryCustomerPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dietaryTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "freshnessNotes" TEXT,
  "contactPreference" TEXT NOT NULL DEFAULT 'CHAT',
  "leaveAtDoor" BOOLEAN NOT NULL DEFAULT false,
  "maxReplacementPricePercent" INTEGER NOT NULL DEFAULT 10,
  "preferredFulfillment" TEXT NOT NULL DEFAULT 'STANDARD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryCustomerPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryCustomerPreference_userId_key" ON "GroceryCustomerPreference"("userId");

CREATE TABLE "GroceryCartItemPreference" (
  "id" TEXT NOT NULL,
  "cartItemId" TEXT NOT NULL,
  "substitutionPolicy" TEXT NOT NULL DEFAULT 'BEST_MATCH',
  "replacementVariantId" TEXT,
  "pickerNote" TEXT,
  "maxPriceIncreasePercent" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryCartItemPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryCartItemPreference_cartItemId_key" ON "GroceryCartItemPreference"("cartItemId");
CREATE INDEX "GroceryCartItemPreference_replacementVariantId_idx" ON "GroceryCartItemPreference"("replacementVariantId");

CREATE TABLE "GroceryListCollaborator" (
  "id" TEXT NOT NULL,
  "listId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroceryListCollaborator_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryListCollaborator_listId_userId_key" ON "GroceryListCollaborator"("listId", "userId");
CREATE INDEX "GroceryListCollaborator_userId_createdAt_idx" ON "GroceryListCollaborator"("userId", "createdAt");

CREATE TABLE "GroceryStoreConfig" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
  "expressEnabled" BOOLEAN NOT NULL DEFAULT false,
  "scheduledEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pickerChatEnabled" BOOLEAN NOT NULL DEFAULT true,
  "weightedItemsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "minimumOrderMinor" BIGINT NOT NULL DEFAULT 0,
  "maxActiveOrders" INTEGER NOT NULL DEFAULT 40,
  "prepMinutes" INTEGER NOT NULL DEFAULT 20,
  "freeDeliveryThresholdMinor" BIGINT,
  "membershipDiscountBps" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryStoreConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryStoreConfig_storeId_key" ON "GroceryStoreConfig"("storeId");

CREATE TABLE "GroceryDeliverySlot" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "reserved" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryDeliverySlot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryDeliverySlot_storeId_startsAt_endsAt_key" ON "GroceryDeliverySlot"("storeId", "startsAt", "endsAt");
CREATE INDEX "GroceryDeliverySlot_storeId_active_startsAt_idx" ON "GroceryDeliverySlot"("storeId", "active", "startsAt");

CREATE TABLE "GroceryRecurringBasket" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "cadence" TEXT NOT NULL,
  "nextRunAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryRecurringBasket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GroceryRecurringBasket_userId_active_nextRunAt_idx" ON "GroceryRecurringBasket"("userId", "active", "nextRunAt");

CREATE TABLE "GroceryRecurringBasketItem" (
  "id" TEXT NOT NULL,
  "basketId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "GroceryRecurringBasketItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryRecurringBasketItem_basketId_variantId_key" ON "GroceryRecurringBasketItem"("basketId", "variantId");
CREATE INDEX "GroceryRecurringBasketItem_productId_idx" ON "GroceryRecurringBasketItem"("productId");

CREATE TABLE "GroceryMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tier" TEXT NOT NULL DEFAULT 'STANDARD',
  "points" INTEGER NOT NULL DEFAULT 0,
  "freeDeliveryUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryMembership_userId_key" ON "GroceryMembership"("userId");

CREATE TABLE "GroceryGroupCart" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "hostUserId" TEXT NOT NULL,
  "shareToken" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "spendingLimitMinor" BIGINT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryGroupCart_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryGroupCart_cartId_key" ON "GroceryGroupCart"("cartId");
CREATE UNIQUE INDEX "GroceryGroupCart_shareToken_key" ON "GroceryGroupCart"("shareToken");
CREATE INDEX "GroceryGroupCart_hostUserId_status_expiresAt_idx" ON "GroceryGroupCart"("hostUserId", "status", "expiresAt");

CREATE TABLE "GroceryGroupCartMember" (
  "id" TEXT NOT NULL,
  "groupCartId" TEXT NOT NULL,
  "userId" TEXT,
  "displayName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "paymentAllocationMinor" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryGroupCartMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryGroupCartMember_groupCartId_userId_key" ON "GroceryGroupCartMember"("groupCartId", "userId");
CREATE INDEX "GroceryGroupCartMember_groupCartId_status_idx" ON "GroceryGroupCartMember"("groupCartId", "status");

CREATE TABLE "GroceryPickerSession" (
  "id" TEXT NOT NULL,
  "sellerOrderId" TEXT NOT NULL,
  "pickerUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryPickerSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryPickerSession_sellerOrderId_key" ON "GroceryPickerSession"("sellerOrderId");
CREATE INDEX "GroceryPickerSession_pickerUserId_status_idx" ON "GroceryPickerSession"("pickerUserId", "status");

CREATE TABLE "GroceryPickerItemOutcome" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedQuantity" INTEGER NOT NULL,
  "fulfilledQuantity" INTEGER NOT NULL DEFAULT 0,
  "actualWeightGrams" INTEGER,
  "finalUnitPriceMinor" BIGINT,
  "replacementVariantId" TEXT,
  "replacementQuantity" INTEGER,
  "customerDecision" TEXT NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryPickerItemOutcome_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryPickerItemOutcome_orderItemId_key" ON "GroceryPickerItemOutcome"("orderItemId");
CREATE INDEX "GroceryPickerItemOutcome_sessionId_status_idx" ON "GroceryPickerItemOutcome"("sessionId", "status");
CREATE INDEX "GroceryPickerItemOutcome_replacementVariantId_idx" ON "GroceryPickerItemOutcome"("replacementVariantId");

CREATE TABLE "GroceryPickerMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "senderUserId" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'TEXT',
  "text" TEXT,
  "mediaKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroceryPickerMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GroceryPickerMessage_sessionId_createdAt_idx" ON "GroceryPickerMessage"("sessionId", "createdAt");

CREATE TABLE "GroceryIssue" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "sellerOrderId" TEXT,
  "userId" TEXT NOT NULL,
  "merchantId" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "details" TEXT,
  "requestedAmountMinor" BIGINT,
  "approvedAmountMinor" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryIssue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GroceryIssue_userId_status_createdAt_idx" ON "GroceryIssue"("userId", "status", "createdAt");
CREATE INDEX "GroceryIssue_merchantId_status_createdAt_idx" ON "GroceryIssue"("merchantId", "status", "createdAt");

CREATE TABLE "GroceryOrderPreferenceSnapshot" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "preferences" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroceryOrderPreferenceSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroceryOrderPreferenceSnapshot_orderId_key" ON "GroceryOrderPreferenceSnapshot"("orderId");

-- Food product depth: favourites, time-based/preorder menus, promotions, group orders,
-- gifting, tips, tracking, delivery verification, chat, reviews and support/refund workflow.
ALTER TABLE "FoodRestaurant"
  ADD COLUMN "acceptingOrders" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "maxActiveOrders" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "prepTimeBufferMin" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "preorderEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pauseUntil" TIMESTAMP(3);
DROP INDEX IF EXISTS "FoodRestaurant_status_rating_idx";
CREATE INDEX "FoodRestaurant_status_acceptingOrders_rating_idx" ON "FoodRestaurant"("status", "acceptingOrders", "rating");

ALTER TABLE "FoodCart"
  ADD COLUMN "tipMinor" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "promoCode" TEXT,
  ADD COLUMN "discountMinor" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recipientName" TEXT,
  ADD COLUMN "recipientPhone" TEXT,
  ADD COLUMN "giftMessage" TEXT,
  ADD COLUMN "groupOrderId" TEXT;
CREATE INDEX "FoodCart_groupOrderId_status_idx" ON "FoodCart"("groupOrderId", "status");

ALTER TABLE "FoodOrder"
  ADD COLUMN "tipMinor" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "discountMinor" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "promoCode" TEXT,
  ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recipientName" TEXT,
  ADD COLUMN "recipientPhone" TEXT,
  ADD COLUMN "giftMessage" TEXT,
  ADD COLUMN "groupOrderId" TEXT,
  ADD COLUMN "deliveryPinHash" TEXT,
  ADD COLUMN "deliveryPinVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "courierUserId" TEXT;
CREATE INDEX "FoodOrder_groupOrderId_createdAt_idx" ON "FoodOrder"("groupOrderId", "createdAt");

CREATE TABLE "FoodRestaurantFavorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodRestaurantFavorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FoodRestaurantFavorite_userId_restaurantId_key" ON "FoodRestaurantFavorite"("userId", "restaurantId");
CREATE INDEX "FoodRestaurantFavorite_restaurantId_createdAt_idx" ON "FoodRestaurantFavorite"("restaurantId", "createdAt");

CREATE TABLE "FoodMenuItemFavorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodMenuItemFavorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FoodMenuItemFavorite_userId_menuItemId_key" ON "FoodMenuItemFavorite"("userId", "menuItemId");
CREATE INDEX "FoodMenuItemFavorite_menuItemId_createdAt_idx" ON "FoodMenuItemFavorite"("menuItemId", "createdAt");

CREATE TABLE "FoodPromotion" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "code" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "discountType" TEXT NOT NULL DEFAULT 'PERCENT',
  "value" INTEGER NOT NULL,
  "minSubtotalMinor" BIGINT NOT NULL DEFAULT 0,
  "maxDiscountMinor" BIGINT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodPromotion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FoodPromotion_restaurantId_code_key" ON "FoodPromotion"("restaurantId", "code");
CREATE INDEX "FoodPromotion_restaurantId_active_startsAt_endsAt_idx" ON "FoodPromotion"("restaurantId", "active", "startsAt", "endsAt");

CREATE TABLE "FoodMenuAvailabilityWindow" (
  "id" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startMinute" INTEGER NOT NULL,
  "endMinute" INTEGER NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'REGULAR',
  "minLeadMinutes" INTEGER NOT NULL DEFAULT 0,
  "maxAdvanceDays" INTEGER NOT NULL DEFAULT 7,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "FoodMenuAvailabilityWindow_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FoodMenuAvailabilityWindow_menuItemId_active_dayOfWeek_idx" ON "FoodMenuAvailabilityWindow"("menuItemId", "active", "dayOfWeek");

CREATE TABLE "FoodGroupOrder" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "hostUserId" TEXT NOT NULL,
  "shareToken" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "spendingLimitMinor" BIGINT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodGroupOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FoodGroupOrder_shareToken_key" ON "FoodGroupOrder"("shareToken");
CREATE INDEX "FoodGroupOrder_hostUserId_status_expiresAt_idx" ON "FoodGroupOrder"("hostUserId", "status", "expiresAt");

CREATE TABLE "FoodGroupOrderMember" (
  "id" TEXT NOT NULL,
  "groupOrderId" TEXT NOT NULL,
  "userId" TEXT,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "allocationMinor" BIGINT,
  "contributionStatus" TEXT NOT NULL DEFAULT 'UNALLOCATED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodGroupOrderMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FoodGroupOrderMember_groupOrderId_userId_key" ON "FoodGroupOrderMember"("groupOrderId", "userId");
CREATE INDEX "FoodGroupOrderMember_groupOrderId_status_idx" ON "FoodGroupOrderMember"("groupOrderId", "status");

CREATE TABLE "FoodOrderTrackingEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodOrderTrackingEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FoodOrderTrackingEvent_orderId_createdAt_idx" ON "FoodOrderTrackingEvent"("orderId", "createdAt");

CREATE TABLE "FoodOrderMessage" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "senderUserId" TEXT,
  "senderRole" TEXT NOT NULL DEFAULT 'CUSTOMER',
  "text" TEXT,
  "mediaKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodOrderMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FoodOrderMessage_orderId_createdAt_idx" ON "FoodOrderMessage"("orderId", "createdAt");

CREATE TABLE "FoodReview" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "foodRating" INTEGER,
  "deliveryRating" INTEGER,
  "text" TEXT,
  "photoKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "restaurantReply" TEXT,
  "repliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FoodReview_orderId_key" ON "FoodReview"("orderId");
CREATE INDEX "FoodReview_restaurantId_createdAt_idx" ON "FoodReview"("restaurantId", "createdAt");
CREATE INDEX "FoodReview_userId_createdAt_idx" ON "FoodReview"("userId", "createdAt");

CREATE TABLE "FoodSupportIssue" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "details" TEXT NOT NULL,
  "requestedRefundMinor" BIGINT,
  "approvedRefundMinor" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodSupportIssue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FoodSupportIssue_userId_status_createdAt_idx" ON "FoodSupportIssue"("userId", "status", "createdAt");
CREATE INDEX "FoodSupportIssue_orderId_status_idx" ON "FoodSupportIssue"("orderId", "status");

-- Grocery foreign keys.
ALTER TABLE "GroceryCustomerPreference" ADD CONSTRAINT "GroceryCustomerPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryCartItemPreference" ADD CONSTRAINT "GroceryCartItemPreference_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryCartItemPreference" ADD CONSTRAINT "GroceryCartItemPreference_replacementVariantId_fkey" FOREIGN KEY ("replacementVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryListCollaborator" ADD CONSTRAINT "GroceryListCollaborator_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryListCollaborator" ADD CONSTRAINT "GroceryListCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryStoreConfig" ADD CONSTRAINT "GroceryStoreConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryDeliverySlot" ADD CONSTRAINT "GroceryDeliverySlot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryRecurringBasket" ADD CONSTRAINT "GroceryRecurringBasket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryRecurringBasketItem" ADD CONSTRAINT "GroceryRecurringBasketItem_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "GroceryRecurringBasket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryRecurringBasketItem" ADD CONSTRAINT "GroceryRecurringBasketItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroceryRecurringBasketItem" ADD CONSTRAINT "GroceryRecurringBasketItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroceryMembership" ADD CONSTRAINT "GroceryMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryGroupCart" ADD CONSTRAINT "GroceryGroupCart_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryGroupCart" ADD CONSTRAINT "GroceryGroupCart_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryGroupCartMember" ADD CONSTRAINT "GroceryGroupCartMember_groupCartId_fkey" FOREIGN KEY ("groupCartId") REFERENCES "GroceryGroupCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryGroupCartMember" ADD CONSTRAINT "GroceryGroupCartMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryPickerSession" ADD CONSTRAINT "GroceryPickerSession_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryPickerSession" ADD CONSTRAINT "GroceryPickerSession_pickerUserId_fkey" FOREIGN KEY ("pickerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryPickerItemOutcome" ADD CONSTRAINT "GroceryPickerItemOutcome_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GroceryPickerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryPickerItemOutcome" ADD CONSTRAINT "GroceryPickerItemOutcome_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "ShoppingOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryPickerItemOutcome" ADD CONSTRAINT "GroceryPickerItemOutcome_replacementVariantId_fkey" FOREIGN KEY ("replacementVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryPickerMessage" ADD CONSTRAINT "GroceryPickerMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GroceryPickerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryPickerMessage" ADD CONSTRAINT "GroceryPickerMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryOrderPreferenceSnapshot" ADD CONSTRAINT "GroceryOrderPreferenceSnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Food foreign keys.
ALTER TABLE "FoodRestaurantFavorite" ADD CONSTRAINT "FoodRestaurantFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodRestaurantFavorite" ADD CONSTRAINT "FoodRestaurantFavorite_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuItemFavorite" ADD CONSTRAINT "FoodMenuItemFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuItemFavorite" ADD CONSTRAINT "FoodMenuItemFavorite_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodPromotion" ADD CONSTRAINT "FoodPromotion_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodMenuAvailabilityWindow" ADD CONSTRAINT "FoodMenuAvailabilityWindow_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodGroupOrder" ADD CONSTRAINT "FoodGroupOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodGroupOrder" ADD CONSTRAINT "FoodGroupOrder_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodGroupOrderMember" ADD CONSTRAINT "FoodGroupOrderMember_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "FoodGroupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodGroupOrderMember" ADD CONSTRAINT "FoodGroupOrderMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "FoodGroupOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "FoodGroupOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FoodOrderTrackingEvent" ADD CONSTRAINT "FoodOrderTrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOrderMessage" ADD CONSTRAINT "FoodOrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodOrderMessage" ADD CONSTRAINT "FoodOrderMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FoodReview" ADD CONSTRAINT "FoodReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodReview" ADD CONSTRAINT "FoodReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodReview" ADD CONSTRAINT "FoodReview_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodSupportIssue" ADD CONSTRAINT "FoodSupportIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodSupportIssue" ADD CONSTRAINT "FoodSupportIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
