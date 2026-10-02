import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const failures = [];
const ok = [];
const assert = (condition, message) => { if (!condition) failures.push(message); else ok.push(message); };
const containsAll = (text, values, label) => values.forEach((value) => assert(text.includes(value), `${label}: ${value}`));

const schema = read("packages/db/prisma/schema.prisma");
const migrationRoot = path.join(root, "packages/db/prisma/migrations");
const migrationFiles = fs.readdirSync(migrationRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(migrationRoot, entry.name, "migration.sql")))
  .sort((a, b) => a.name.localeCompare(b.name));
const migration = migrationFiles
  .map((entry) => fs.readFileSync(path.join(migrationRoot, entry.name, "migration.sql"), "utf8"))
  .join("\n");
const laterMigrations = migration;
const groceryRoutes = read("services/platform-api/src/shopping/grocery-routes.ts");
const groceryService = read("services/platform-api/src/shopping/grocery.ts");
const checkout = read("services/platform-api/src/shopping/checkout.ts");
const shoppingService = read("services/platform-api/src/shopping/service.ts");
const foodRoutes = read("services/platform-api/src/food/routes.ts");
const foodService = read("services/platform-api/src/food/service.ts");

const requiredGroceryModels = [
  "GroceryCustomerPreference", "GroceryCartItemPreference", "GroceryListCollaborator", "GroceryStoreConfig",
  "GroceryDeliverySlot", "GroceryRecurringBasket", "GroceryRecurringBasketItem", "GroceryMembership",
  "GroceryGroupCart", "GroceryGroupCartMember", "GroceryPickerSession", "GroceryPickerItemOutcome",
  "GroceryPickerMessage", "GroceryIssue", "GroceryOrderPreferenceSnapshot",
];
const requiredFoodModels = [
  "FoodRestaurantFavorite", "FoodMenuItemFavorite", "FoodPromotion", "FoodMenuAvailabilityWindow", "FoodGroupOrder",
  "FoodGroupOrderMember", "FoodOrderTrackingEvent", "FoodOrderMessage", "FoodReview", "FoodSupportIssue",
];
for (const model of [...requiredGroceryModels, ...requiredFoodModels]) {
  assert(new RegExp(`model\\s+${model}\\s*\\{`).test(schema), `Prisma model ${model}`);
  assert(migration.includes(`CREATE TABLE "${model}"`), `Migration creates ${model}`);
}


// Verify every scalar field in the newly introduced Grocery/Food models has a migration column.
const prismaModels = new Map([...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].map((match) => [match[1], match[2]]));
const prismaModelNames = new Set(prismaModels.keys());
for (const modelName of [...requiredGroceryModels, ...requiredFoodModels]) {
  const modelBody = prismaModels.get(modelName) ?? "";
  const tableBlock = migration.match(new RegExp(`CREATE TABLE "${modelName}" \\(([\\s\\S]*?)\\n\\);`))?.[1] ?? "";
  const columns = new Set([...tableBlock.matchAll(/^\s*"([^"]+)"\s+/gm)].map((match) => match[1]));
  for (const rawLine of modelBody.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("@")) continue;
    const fieldMatch = line.match(/^(\w+)\s+([^\s]+)/);
    if (!fieldMatch) continue;
    const [, fieldName, rawType] = fieldMatch;
    const baseType = rawType.replace(/\?$/, "").replace(/\[\]$/, "");
    if (prismaModelNames.has(baseType)) continue;
    const addedLater = new RegExp(`ALTER TABLE "${modelName}"[\\s\\S]*?ADD COLUMN "${fieldName}"`).test(laterMigrations);
    assert(columns.has(fieldName) || addedLater, `Migration column ${modelName}.${fieldName}`);
  }
}

const alteredFields = {
  Cart: ["vertical"],
  ShoppingCheckout: ["vertical", "pickupStoreId", "groceryDeliverySlotId"],
  ShoppingOrder: ["vertical", "pickupStoreId", "groceryDeliverySlotId"],
  FoodRestaurant: ["acceptingOrders", "maxActiveOrders", "prepTimeBufferMin", "preorderEnabled", "pauseUntil"],
  FoodCart: ["tipMinor", "promoCode", "discountMinor", "isGift", "recipientName", "recipientPhone", "giftMessage", "groupOrderId"],
  FoodOrder: ["tipMinor", "discountMinor", "promoCode", "isGift", "recipientName", "recipientPhone", "giftMessage", "groupOrderId", "deliveryPinHash", "deliveryPinVerifiedAt", "courierUserId"],
};
function migrationHasColumn(modelName, fieldName) {
  const createBlock = migration.match(new RegExp(`CREATE TABLE "${modelName}" \\(([\\s\\S]*?)\\n\\);`))?.[1] ?? "";
  if (new RegExp(`^\\s*"${fieldName}"\\s+`, "m").test(createBlock)) return true;
  return new RegExp(`ALTER TABLE "${modelName}"[\\s\\S]*?ADD COLUMN "${fieldName}"`).test(migration);
}
for (const [modelName, fields] of Object.entries(alteredFields)) {
  const modelBody = prismaModels.get(modelName) ?? "";
  for (const fieldName of fields) {
    assert(new RegExp(`^\\s*${fieldName}\\s+`, "m").test(modelBody), `Prisma field ${modelName}.${fieldName}`);
    assert(migrationHasColumn(modelName, fieldName), `Migration column ${modelName}.${fieldName}`);
  }
}
for (const modelName of Object.keys(alteredFields)) {
  assert(migration.includes(`CREATE TABLE "${modelName}"`) || migration.includes(`ALTER TABLE "${modelName}"`), `Migration coverage ${modelName}`);
}

// Catch duplicate scalar/relation field declarations inside Prisma models without needing Prisma installed.
const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
for (const match of schema.matchAll(modelRegex)) {
  const [, modelName, body] = match;
  const seen = new Set();
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("@@") || line.startsWith("@")) continue;
    const field = line.match(/^(\w+)\s+/)?.[1];
    if (!field) continue;
    assert(!seen.has(field), `No duplicate Prisma field ${modelName}.${field}`);
    seen.add(field);
  }
}

const inventoryMatch = schema.match(/model\s+InventoryAdjustment\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
for (const accidental of ["tipMinor", "promoCode", "discountMinor", "recipientName", "recipientPhone", "giftMessage", "groupOrderId"]) {
  assert(!new RegExp(`^\\s*${accidental}\\s+`, "m").test(inventoryMatch), `InventoryAdjustment excludes Food field ${accidental}`);
}

containsAll(groceryRoutes, [
  '/v1/grocery/cart', '/v1/grocery/checkouts', '/v1/grocery/orders', '/v1/grocery/preferences',
  '/v1/grocery/recurring-baskets', '/v1/grocery/group-carts', '/v1/grocery/orders/:orderId/picker/:sessionId/messages',
  '/v1/grocery/orders/:orderId/picker/:sessionId/messages/:messageId/media',
  '/v1/business/grocery/orders/:sellerOrderId/replacement-options',
  '/v1/business/grocery/orders/:sellerOrderId/picker/messages/:messageId/media',
], "Grocery API route");
containsAll(groceryService, [
  "REPLACEMENT_PROPOSED", "WAITING_CUSTOMER", "SETTLEMENT_ADJUSTMENT", "SHORTAGE_REFUND",
  "requireReadyOwnedMedia", "businessGroceryReplacementOptions",
], "Grocery operational behavior");
containsAll(checkout, ["GROCERY", "spendingLimitMinor", "paymentAllocationMinor"], "Grocery checkout behavior");
assert(shoppingService.includes('vertical = "SHOPPING"') || shoppingService.includes('vertical: "SHOPPING"') || shoppingService.includes('vertical ?? "SHOPPING"'), "Shopping service retains SHOPPING default/isolation");

containsAll(foodRoutes, [
  '/v1/food/favorites', '/v1/food/restaurants/:slug/favorite', '/v1/food/menu-items/:itemId/favorite', '/v1/food/group-orders', '/v1/food/orders/:orderId/messages',
  '/v1/food/orders/:orderId/issues', '/v1/food/orders/:orderId/review', '/v1/food/orders/:orderId/verify-delivery-pin',
  '/v1/business/food/restaurants', '/v1/business/food/orders', '/v1/business/food/reviews', '/v1/business/food/issues',
], "Food API route");
containsAll(foodService, [
  "randomInt", "deliveryPinHash", "deliveryPinVerified", "db.foodOrderTrackingEvent", "groupOrder", "promoCode",
], "Food operational behavior");
assert(!foodService.includes("Math.random()"), "Food delivery security does not use Math.random()");

const groceryRoots = ["apps/grocery-web", "apps/grocery-mobile"];
function walk(dir, out = []) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return out;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "build"].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) out.push(rel);
  }
  return out;
}
for (const file of groceryRoots.flatMap((dir) => walk(dir))) {
  const text = read(file);
  assert(!text.includes("/v1/shopping/cart"), `Grocery vertical isolation: ${file} has no Shopping cart endpoint`);
  assert(!/Bazaara\s+GO|GO AI/i.test(text), `Grocery naming: ${file} does not expose GO branding`);
}

const requiredScreens = [
  "apps/grocery-web/app/cart/page.tsx", "apps/grocery-web/app/checkout/page.tsx", "apps/grocery-web/app/orders/[orderId]/page.tsx",
  "apps/grocery-web/app/group/[token]/page.tsx", "apps/grocery-mobile/app/cart.tsx", "apps/grocery-mobile/app/checkout.tsx",
  "apps/grocery-mobile/app/order/[id].tsx", "apps/grocery-mobile/app/group/[token].tsx", "apps/grocery-mobile/app/assistant.tsx",
  "apps/business-web/app/grocery/page.tsx", "apps/food-web/app/deals/page.tsx", "apps/food-web/app/favorites/page.tsx",
  "apps/food-web/app/group/[token]/page.tsx", "apps/food-web/app/orders/[orderId]/page.tsx", "apps/food-mobile/app/deals.tsx",
  "apps/food-mobile/app/order/[id].tsx", "apps/food-mobile/app/group/[token].tsx", "apps/business-web/app/food/page.tsx",
];
for (const screen of requiredScreens) assert(fs.existsSync(path.join(root, screen)), `Required product surface ${screen}`);

if (failures.length) {
  console.error(`Grocery/Food V2 validation FAILED (${failures.length} checks)`);
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log(`Grocery/Food V2 validation PASS (${ok.length} checks)`);
