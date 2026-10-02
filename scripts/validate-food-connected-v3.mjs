import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const pass = (condition, message) => condition ? null : failures.push(message);
const has = (file, values) => { const text = read(file); for (const value of values) pass(text.includes(value), `${file}: ${value}`); };

has("packages/db/prisma/schema.prisma", [
  "model FoodOrderEconomics", "economics             FoodOrderEconomics?", "courierAssignedAt", "pickedUpAt", "fundingSource", "merchantFundingBps",
]);
const migrationRoot = path.join(root, "packages/db/prisma/migrations");
const migrationSql = fs.readdirSync(migrationRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(migrationRoot, entry.name, "migration.sql")))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((entry) => fs.readFileSync(path.join(migrationRoot, entry.name, "migration.sql"), "utf8"))
  .join("\n");
for (const marker of ['CREATE TABLE "FoodOrderEconomics"', '"fundingSource"', '"merchantFundingBps"']) {
  pass(migrationSql.includes(marker), `migration coverage: ${marker}`);
}
has("services/platform-api/src/food/routes.ts", [
  '/v1/food/capabilities', '/v1/go/food/offers', '/v1/go/food/deliveries', '/v1/admin/food/overview', '/v1/admin/food/rules',
  '/v1/food/payment-capabilities', '/payment/initialize', '/payment/reconcile', 'BAZAARA_PAY', 'PAYSTACK_CARD', 'PAYSTACK_BANK',
]);
has("services/platform-api/src/food/payment.ts", [
  'export type FoodPaymentMethod = "BAZAARA_PAY" | "PAYSTACK_CARD" | "PAYSTACK_BANK"',
  'postJournal', 'FOOD_PAYMENT', 'paymentProvider("PAYSTACK")', 'compareProviderCapture',
]);
has("services/platform-api/src/food/service.ts", [
  "FOOD_DEFAULT_SERVICE_FEE_BPS = 500", "FOOD_DEFAULT_SERVICE_FEE_MINIMUM_MINOR = 15_000", "FOOD_DEFAULT_SERVICE_FEE_MAXIMUM_MINOR = 100_000",
  "FOOD_DEFAULT_MERCHANT_COMMISSION_BPS = 1_200", "FOOD_DEFAULT_GO_COMMISSION_BPS = 1_000", "serviceFeeForSubtotal", "splitPromotionFunding",
  "Complete your active GO delivery before accepting another one", "haversineMeters", "updateFoodCourierDeliveryStatus", "adminFoodOverview",
]);
has("services/platform-api/src/addresses/routes.ts", ["latitude", "longitude", "placeIdentifier"]);
has("apps/food-web/components/food-checkout-client.tsx", ["captureCurrentLocation", "Use my current delivery pin", "latitude:address.latitude", "longitude:address.longitude", "No cash at handoff", "BAZAARA_PAY", "PAYSTACK_CARD", "PAYSTACK_BANK"]);
has("apps/food-web/components/food-location-control.tsx", ["SMART DELIVERY AREA", "BAZAARA", "MAPS · PREVIEW"]);
has("apps/food-mobile/app/checkout/[slug].tsx", ["expo-location", "captureDeliveryPoint", "deliveryPoint?.latitude", "deliveryPoint?.longitude", "No cash on delivery", "BAZAARA_PAY", "PAYSTACK_CARD", "PAYSTACK_BANK"]);
has("apps/food-mobile/app/location.tsx", ["SMART DELIVERY AREA", "BAZAARA", "MAPS · PREVIEW"]);
has("apps/logistics-courier-mobile/app/index.tsx", ["Delivery cockpit", "Navigate to restaurant", "Navigate to customer", "/v1/go/food/deliveries/${active.id}/location"]);
has("apps/operations-web/app/food/page.tsx", ["FOOD CONTROL CENTRE", "Restaurant commission", "GO commission", "Food rules"]);
has("apps/business-web/app/food/page.tsx", ["FOOD OPERATIONS", "Merchant net", "Customer service fee is controlled centrally by Operations"]);
has("apps/food-web/app/page.tsx", ["Good food.", "SMART PICKS", "Fast & hot", "food-smart-tiles"]);


const foodOnlineOnlyFiles = [
  "services/platform-api/src/food/routes.ts",
  "services/platform-api/src/food/service.ts",
  "services/platform-api/src/food/payment.ts",
  "apps/food-web/components/food-checkout-client.tsx",
  "apps/food-mobile/app/checkout/[slug].tsx",
];
for (const file of foodOnlineOnlyFiles) {
  pass(!read(file).includes("PAY_ON_DELIVERY"), `${file}: Food must not expose PAY_ON_DELIVERY`);
}
const courierPackage = JSON.parse(read("apps/logistics-courier-mobile/package.json"));
pass(courierPackage.dependencies?.["expo-location"] === "~57.0.18", "GO includes expo-location");
const foodPackage = JSON.parse(read("apps/food-mobile/package.json"));
pass(foodPackage.dependencies?.["expo-location"] === "~57.0.18", "Food mobile includes expo-location");

if (failures.length) {
  console.error(`Food connected V3 validation FAILED (${failures.length} checks)`);
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log("Food connected V3 validation PASS (commercial rules, canonical order, Business, Go, Operations, delivery pin/location and premium Food UI).");
