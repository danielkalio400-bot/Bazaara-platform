import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function exists(relative) {
  return fs.existsSync(path.join(root, relative));
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

const checkout = read("services/platform-api/src/shopping/checkout.ts");
const pricing = read("services/platform-api/src/shopping/grocery-pricing.ts");
const pricingRoutes = read("services/platform-api/src/shopping/grocery-routes.ts");
const operationsRoutes = read("services/platform-api/src/shopping/operations-routes.ts");
const schema = read("packages/db/prisma/schema.prisma");

const webLayout = read("apps/grocery-web/app/layout.tsx");
const webHome = read("apps/grocery-web/app/page.tsx");
const webCart = read("apps/grocery-web/app/cart/page.tsx");
const webCheckout = read("apps/grocery-web/app/checkout/page.tsx");
const webLists = read("apps/grocery-web/app/lists/page.tsx");
const comparePage = read("apps/grocery-web/app/compare/page.tsx");
const ai = read("apps/grocery-web/components/bazai-web-assistant.tsx");
const aiCss = read("apps/grocery-web/components/bazai-web-assistant.module.css");
const normalCss = read("apps/grocery-web/app/grocery-normal-v55.css");
const mobileTheme = read("apps/grocery-mobile/src/ui/theme.ts");
const mobileCheckout = read("apps/grocery-mobile/app/checkout.tsx");
const operationsPage = read("apps/operations-web/app/grocery/page.tsx");

// Typecheck failure that triggered this repair.
expect(
  count(
    checkout,
    /serviceFeeMinor:\s*moneyToNumber\(checkout\.serviceFeeMinor\s*\?\?\s*0n\)/g,
  ) === 1,
  "serializeCheckout must expose serviceFeeMinor exactly once",
);
expect(
  count(
    checkout,
    /serviceFeeMinor:\s*moneyToNumber\(order\.serviceFeeMinor\s*\?\?\s*0n\)/g,
  ) === 1,
  "serializeOrder must expose serviceFeeMinor exactly once",
);

// New exact commercial rules.
for (const marker of [
  "GROCERY_SERVICE_FEE_MIN_BPS = 1000",
  "GROCERY_SERVICE_FEE_MAX_BPS = 1500",
  "GROCERY_EXPRESS_RATE_BPS = 1000",
  "GROCERY_EXPRESS_MINIMUM_MINOR = 100000n",
  "GROCERY_EXPRESS_MAXIMUM_MINOR = 500000n",
  "setGroceryServiceFeeBps",
]) {
  expect(pricing.includes(marker), `Grocery pricing is missing: ${marker}`);
}

expect(
  pricing.includes("db.regionalConfig.findFirst"),
  "Grocery Operations service-fee setting is not persisted in RegionalConfig",
);
expect(
  pricing.includes("db.regionalConfig.update") &&
    pricing.includes("db.regionalConfig.create"),
  "Grocery pricing policy persistence is incomplete",
);
expect(
  checkout.includes("await groceryPricingPolicy()"),
  "Checkout is not reading the current Operations-controlled Grocery pricing policy",
);
expect(
  pricingRoutes.includes('"/v1/grocery/pricing-policy"'),
  "Public Grocery pricing-policy endpoint is missing",
);
expect(
  operationsRoutes.includes('"/v1/admin/grocery/pricing-policy"') &&
    operationsRoutes.includes("groceryServiceFeeSchema"),
  "Operations Grocery pricing-policy update endpoint is missing",
);

for (const stale of [
  "GROCERY_EXPRESS_FEE_MINOR",
  "GROCERY_EXPRESS_BAZAARA_SHARE_MINOR",
  "GROCERY_EXPRESS_GO_SHARE_MINOR",
  "expressBazaaraShareMinor",
  "expressGoShareMinor",
]) {
  expect(!checkout.includes(stale), `Obsolete fixed Express allocation remains in checkout.ts: ${stale}`);
  expect(!pricing.includes(stale), `Obsolete fixed Express allocation remains in grocery-pricing.ts: ${stale}`);
}

// Existing schema and reservation must remain.
expect(
  schema.includes("serviceFeeBps") &&
    schema.includes("serviceFeeMinor") &&
    schema.includes("deliveryPlatformShareMinor") &&
    schema.includes("deliveryGoShareMinor"),
  "Existing Grocery pricing columns are missing from Prisma schema",
);
expect(
  checkout.includes("InventoryReservation") ||
    checkout.includes("inventoryReservation"),
  "Existing Grocery inventory reservation logic appears to be missing",
);

// Customer experience.
expect(
  webHome.includes("10–15%") &&
    webHome.includes("10% of basket"),
  "Grocery home does not show the new service/Express policy",
);
expect(
  webCart.includes("The store checks what it has"),
  "Grocery cart does not make branch stock responsibility explicit",
);
expect(
  webCart.includes("/v1/grocery/pricing-policy"),
  "Grocery cart is not using the live pricing policy",
);
expect(
  !webCart.includes("Save substitution") &&
    !webCart.includes("maxPriceIncreasePercent"),
  "Per-item substitution controls remain in the Grocery cart",
);
expect(
  webCheckout.includes("one fallback rule") ||
    webCheckout.includes("one fallback"),
  "Grocery checkout does not use one order-level fallback rule",
);
expect(
  webCheckout.includes("expressRateBps") &&
    webCheckout.includes("expressMinimumMinor") &&
    webCheckout.includes("expressMaximumMinor"),
  "Grocery checkout is not calculating the current Express policy",
);
expect(
  !webCheckout.includes("₦2,000") && !webCheckout.includes("20%"),
  "Old fixed Grocery pricing text remains in web checkout",
);
expect(
  /quantity\s*:\s*item\.quantity\s*\+\s*1/.test(webLists) &&
    /quantity\s*:\s*item\.quantity\s*-\s*1/.test(webLists),
  "Grocery My Lists quantity controls are incomplete",
);
expect(
  comparePage.includes('redirect("/")'),
  "Grocery /compare no longer safely redirects to Grocery home",
);
expect(
  !webLayout.includes("ShoppingTools"),
  "ShoppingTools/BazCompare is still mounted in the Grocery layout",
);
expect(
  ai.includes("Build the basket before you shop it"),
  "Grocery AI is not using the Grocery planning workspace",
);

// UI normalization.
expect(
  webLayout.includes('import "./grocery-normal-v55.css";'),
  "Grocery Normal V5.5 CSS is not imported",
);
expect(
  webLayout.lastIndexOf('import "./grocery-normal-v55.css";') >
    webLayout.lastIndexOf('import "./grocery-v5.3.css";'),
  "Grocery Normal V5.5 CSS must load after legacy Grocery themes",
);
for (const marker of [
  "--grocery-normal-bg: #0b0c0b",
  "--grocery-normal-surface: #111311",
  "--grocery-normal-accent: #2f8f62",
]) {
  expect(normalCss.includes(marker), `Normal Grocery UI token missing: ${marker}`);
}
for (const forbidden of [
  "#A3E635",
  "#C026FF",
  "#FF3BD4",
  "#2925a9",
  "#2563eb",
]) {
  expect(!normalCss.includes(forbidden), `Neon/blue token remains in final Grocery override: ${forbidden}`);
  expect(!aiCss.includes(forbidden), `Neon/blue token remains in Grocery AI: ${forbidden}`);
}
expect(
  mobileTheme.includes('background: "#0B0C0B"') &&
    mobileTheme.includes('primary: "#2F8F62"'),
  "Mobile Grocery theme is not back to the neutral Bazaara dark palette",
);
expect(
  !mobileCheckout.includes("₦2,000") &&
    mobileCheckout.includes("minimum ₦1,000") &&
    mobileCheckout.includes("maximum"),
  "Mobile checkout still has stale Express pricing",
);

// Operations control.
expect(
  operationsPage.includes("SERVICE FEE CONTROL") &&
    operationsPage.includes("/v1/admin/grocery/pricing-policy") &&
    operationsPage.includes('min="10"') &&
    operationsPage.includes('max="15"'),
  "Operations does not have a 10–15% Grocery service-fee control",
);
expect(
  operationsPage.includes("EXPRESS RANGE") &&
    operationsPage.includes("₦1k–₦5k"),
  "Operations does not show the Express 10% min/max rule",
);
expect(
  !operationsPage.includes("BAZAARA SHARE") &&
    !operationsPage.includes("GO / COURIER"),
  "Operations still shows the obsolete fixed ₦1,000/₦1,000 Express split",
);

// These files should be deleted by the installer. Warn during source-only validation.
for (const relative of [
  "apps/grocery-web/components/shopping-tools.tsx",
  "apps/grocery-web/components/compare-client.tsx",
  "apps/grocery-web/components/compare-store.ts",
]) {
  if (exists(relative)) {
    warnings.push(`${relative} still exists before installer cleanup; installer will delete it.`);
  }
}

for (const warning of warnings) {
  console.warn(`Grocery Normal V5.5 warning: ${warning}`);
}

if (failures.length) {
  console.error(
    `Grocery Normal V5.5 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`,
  );
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Grocery Normal V5.5 validation PASS.");
