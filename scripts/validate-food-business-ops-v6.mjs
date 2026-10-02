import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
function requireText(file, snippets) {
  const source = read(file);
  for (const snippet of snippets) {
    if (!source.includes(snippet)) throw new Error(`${file}: missing required source marker: ${snippet}`);
    checks.push(`${file}: ${snippet}`);
  }
}

requireText("packages/db/prisma/schema.prisma", [
  "model FoodCommissionPolicy",
  "foodOrderId      String?",
  "foodRestaurantId String?",
  "AI",
]);
requireText("services/platform-api/src/food/service.ts", [
  "foodRulesForRestaurant",
  "foodCommissionForRestaurant",
  "listFoodCommissionPolicies",
  "businessFoodPromotions",
  "updateBusinessFoodOpeningHours",
  "adminFoodIssues",
  "adminFoodPromotions",
  "adminFoodMenu",
]);
requireText("services/platform-api/src/food/routes.ts", [
  "/v1/admin/food/commission-policies",
  "/v1/admin/food/restaurants",
  "/v1/business/food/promotions",
  "/v1/business/food/restaurants/:restaurantId/opening-hours",
  "/v1/admin/food/issues",
  "/v1/admin/food/promotions",
  "/v1/admin/food/restaurants/:restaurantId/menu",
]);
requireText("services/platform-api/src/support/service.ts", [
  "runFoodSupportAi",
  "safeToAutoReply",
  "COMMISSION_EXPLANATION",
  "foodOrderId",
]);
requireText("services/platform-api/src/support/routes.ts", [
  '"FOOD"',
  "/food-ai/analyze",
  "/food-ai/reply",
]);
requireText("apps/business-web/app/food/page.tsx", [
  "FOOD OPERATIONS · RESTAURANT OS",
  "Restaurant settlement snapshot",
  "Effective Food commission",
]);
requireText("apps/business-web/app/support/page.tsx", [
  "BUSINESS SUPPORT · FOOD AI ENABLED",
  "foodOrderId",
  "BAZAARA FOOD AI",
]);
requireText("apps/operations-web/app/food/page.tsx", [
  "COMMISSION CONTROL",
  "ORDER ECONOMICS",
  "RESTAURANT NETWORK",
  "FOOD EXCEPTIONS",
  "PROMOTION CONTROL",
  "MENU OVERSIGHT",
  "REVIEW INTELLIGENCE",
]);
requireText("apps/operations-web/app/support/page.tsx", [
  "SUPPORT OPERATIONS · FOOD AI",
  "Refresh AI analysis",
  "Send safe AI reply",
]);

const customerFiles = [
  "apps/food-web/app/page.tsx",
  "apps/food-mobile/App.tsx",
].filter((file) => fs.existsSync(path.join(root, file)));
console.log(`Food Business/Operations V6 static assertions passed (${checks.length} markers).`);
console.log(`Customer Food surfaces intentionally not required or modified by this release (${customerFiles.length} known entrypoints found).`);
