-- GO foundation: grocery lists and delivery-mode metadata.
-- Additive migration; existing identities, catalogue, carts, checkouts and orders are preserved.

ALTER TABLE "ShoppingCheckout"
  ADD COLUMN "deliveryMode" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "scheduledFor" TIMESTAMP(3);

ALTER TABLE "ShoppingOrder"
  ADD COLUMN "deliveryMode" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "scheduledFor" TIMESTAMP(3);

CREATE TABLE "GroceryList" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroceryListItem" (
  "id" TEXT NOT NULL,
  "listId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "label" TEXT NOT NULL,
  "normalizedLabel" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "checked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryListItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroceryList_userId_archived_updatedAt_idx" ON "GroceryList"("userId", "archived", "updatedAt");
CREATE UNIQUE INDEX "GroceryListItem_listId_normalizedLabel_key" ON "GroceryListItem"("listId", "normalizedLabel");
CREATE INDEX "GroceryListItem_productId_idx" ON "GroceryListItem"("productId");
CREATE INDEX "GroceryListItem_variantId_idx" ON "GroceryListItem"("variantId");

ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
