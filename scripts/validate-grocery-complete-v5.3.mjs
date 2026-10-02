import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (condition, message) => { if (!condition) failures.push(message); };

const layout = read("apps/grocery-web/app/layout.tsx");
const compare = read("apps/grocery-web/app/compare/page.tsx");
const lists = read("apps/grocery-web/app/lists/page.tsx");
const mobileLists = read("apps/grocery-mobile/app/(tabs)/lists.tsx");
const wishlist = read("apps/grocery-web/app/wishlist/page.tsx");
const wishlistProxy = read("apps/grocery-web/app/api/bazaara-wishlist/route.ts");
const cart = read("apps/grocery-web/app/cart/page.tsx");
const mobileCart = read("apps/grocery-mobile/app/cart.tsx");
const checkout = read("apps/grocery-web/app/checkout/page.tsx");
const mobileCheckout = read("apps/grocery-mobile/app/checkout.tsx");
const ai = read("apps/grocery-web/components/bazai-web-assistant.tsx");
const aiCss = read("apps/grocery-web/components/bazai-web-assistant.module.css");
const pricing = read("services/platform-api/src/shopping/grocery-pricing.ts");
const pricingTest = read("services/platform-api/src/shopping/grocery-pricing.test.ts");
const checkoutApi = read("services/platform-api/src/shopping/checkout.ts");
const groceryService = read("services/platform-api/src/shopping/grocery.ts");
const groceryRoutes = read("services/platform-api/src/shopping/grocery-routes.ts");
const shoppingService = read("services/platform-api/src/shopping/service.ts");
const schema = read("packages/db/prisma/schema.prisma");
const migration = read("packages/db/prisma/migrations/20260920210000_grocery_pricing_preferences_v53/migration.sql");
const envExample = read(".env.example");
const business = read("apps/business-web/app/grocery/page.tsx");
const businessLayout = read("apps/business-web/app/layout.tsx");
const ops = read("apps/operations-web/app/grocery/page.tsx");
const opsLayout = read("apps/operations-web/app/layout.tsx");
const focusCss = read("apps/grocery-web/app/grocery-focus-v5.1.css");
const v53Css = read("apps/grocery-web/app/grocery-v5.3.css");
const mobileHome = read("apps/grocery-mobile/app/(tabs)/index.tsx");

// Product identity / comparison separation.
expect(!layout.includes("ShoppingTools"), "Grocery root layout must not mount ShoppingTools/BazCompare");
expect(layout.includes('title: { default: "Grocery"'), "Grocery metadata title must be canonical Grocery");
expect(layout.includes('applicationName: "Grocery"'), "Grocery applicationName must be canonical Grocery");
expect(layout.includes('import "./grocery-focus-v5.1.css";'), "Grocery focus CSS is not imported");
expect(layout.includes('import "./grocery-v5.3.css";'), "Grocery V5.3 CSS is not imported");
expect(compare.includes('redirect("/")'), "Grocery compare route must redirect to Grocery home");
expect(focusCss.includes(".bazcompare-card-action") || v53Css.includes(".bazcompare-card-action"), "Grocery compare fail-safe CSS missing");

// Lists: quantity must be removable at 1 -> 0 and create with explicit quantity.
for (const [name, source] of [["web", lists], ["mobile", mobileLists]]) {
  expect(source.includes("item.quantity === 1 ? 0 : item.quantity - 1"), `${name} Grocery list minus must remove quantity 1`);
  expect(source.includes("Math.min(99"), `${name} Grocery list quantity upper bound missing`);
  expect(source.includes("quantity"), `${name} Grocery list quantity control missing`);
}
expect(groceryRoutes.includes("quantity: z.coerce.number().int().min(0).max(99).optional()"), "List item API must accept quantity 0 for removal");
expect(groceryService.includes("if (input.quantity === 0)"), "List item service must delete at quantity 0");

// Wishlist: actual page + same-origin web proxy + vertical isolation.
expect(wishlist.includes("/api/bazaara-wishlist"), "Grocery Wishlist page must use the same-origin wishlist proxy");
expect(wishlist.includes("ProductCard"), "Grocery Wishlist page must render Grocery product cards");
expect(!wishlist.includes('redirect("/wishlist")'), "Grocery Wishlist must not redirect to itself");
expect(wishlistProxy.includes("vertical=GROCERY"), "Wishlist proxy must scope to Grocery");
expect(wishlistProxy.includes("mutationIsSameOrigin"), "Wishlist proxy must verify same-origin mutations");
expect(shoppingService.includes("product: { merchant: { vertical } }"), "Wishlist delete must respect vertical isolation");

// Cart simplification / stock responsibility.
expect(!cart.includes("Save substitution"), "Web Grocery cart still renders per-item substitution configuration");
expect(!mobileCart.includes("Save substitution"), "Mobile Grocery cart still renders per-item substitution configuration");
expect(cart.includes("Branch stock") || cart.includes("branch stock"), "Web cart must explain branch stock validation");
expect(mobileCart.includes("Branch stock") || mobileCart.includes("branch stock"), "Mobile cart must explain branch stock validation");
expect(checkout.includes("substitutionPolicy"), "Web checkout missing order-level substitution preference");
expect(mobileCheckout.includes("substitutionPolicy"), "Mobile checkout missing order-level substitution preference");

// Pricing: 20% service fee, fixed Express NGN 2,000, 1,000 + 1,000 internal split.
for (const marker of [
  "serviceFeeBps: 2000",
  "expressDeliveryFeeMinor: 200000n",
  "expressPlatformShareMinor: 100000n",
  "expressGoShareMinor: 100000n",
]) expect(pricingTest.includes(marker), `Grocery pricing test missing ${marker}`);
expect(pricing.includes("calculateGroceryServiceFeeMinor"), "Grocery service-fee helper missing");
expect(checkoutApi.includes("GroceryFeesAllocated"), "Grocery fee allocation outbox event missing");
expect(checkoutApi.includes("Grocery order created — payment pending") && checkoutApi.includes("New Grocery order"), "Business Grocery order notifications missing");
expect(envExample.includes("GROCERY_SERVICE_FEE_BPS=2000"), "Grocery 20% service fee is not documented in .env.example");
expect(envExample.includes("GROCERY_EXPRESS_DELIVERY_FEE_MINOR=200000"), "Grocery Express NGN 2,000 default missing from .env.example");
expect(ai.includes("20% Grocery service fee"), "Grocery AI pricing note must state the 20% service fee");
expect(ai.includes("₦2,000 when Express is selected"), "Grocery AI pricing note must state Express NGN 2,000");

// Picker inventory correctness: shortages must never recreate original stock.
expect(groceryService.includes("Picker outcomes must never recreate stock"), "Picker stock-discrepancy guard missing");
expect(groceryService.includes('type: "INVENTORY_SHORTAGE"'), "Picker shortage issue creation missing");
expect(!groceryService.includes("currentlyConsumedOriginal"), "Legacy picker original-stock restoration remains");
expect(groceryService.includes("previousReplacementVariantId"), "Transition-aware replacement inventory allocation missing");

// Schema / migration.
for (const marker of ["serviceFeeBps", "serviceFeeMinor", "deliveryPlatformShareMinor", "deliveryGoShareMinor", "substitutionPolicy"]) {
  expect(schema.includes(marker), `Prisma schema missing Grocery V5.3 field ${marker}`);
  expect(migration.includes(marker), `Grocery V5.3 migration missing ${marker}`);
}

// AI must be Grocery-specific, not Food/blue hero.
expect(ai.includes("GROCERY INTELLIGENCE"), "Grocery AI workspace identity missing");
expect(ai.includes("Plan the shop, not just the meal."), "Grocery AI planning identity missing");
expect(aiCss.includes("#05110E") && aiCss.includes("#34D399"), "Grocery AI forest/emerald palette missing");

// Mobile/UI and control surfaces.
expect(mobileHome.includes("FRESH COMMERCE"), "Grocery Mobile fresh-commerce home missing");
expect(mobileHome.includes("20% service fee"), "Grocery Mobile home does not surface service-fee rule");
expect(mobileHome.includes("Express ₦2,000"), "Grocery Mobile home does not surface Express fee");
expect(business.includes("grocery-business-v5"), "Business Grocery V5 wrapper missing");
expect(businessLayout.includes('import "./business-grocery-v5.css";'), "Business Grocery V5 CSS import missing");
expect(ops.includes("grocery-ops-v5"), "Operations Grocery V5 wrapper missing");
expect(opsLayout.includes('import "./operations-grocery-v5.css";'), "Operations Grocery V5 CSS import missing");

// Ban the old neon purple/pink brand colors in live Grocery CSS.
const banned = ["#C026FF", "#FF3BD4", "#FF58C8", "#F0ABFC", "#A13CFF", "#D12DFF", "#E879F9"];
const cssRoot = path.join(root, "apps/grocery-web");
const cssFiles = [];
const walk = (directory) => {
  for (const name of fs.readdirSync(directory)) {
    const file = path.join(directory, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      if (name !== ".next" && name !== "node_modules") walk(file);
    } else if (file.endsWith(".css")) cssFiles.push(file);
  }
};
walk(cssRoot);
for (const file of cssFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const token of banned) {
    expect(!source.toUpperCase().includes(token.toUpperCase()), `Legacy neon Grocery color ${token} remains in ${path.relative(root, file)}`);
  }
}

if (failures.length) {
  console.error(`Grocery Complete V5.3 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Grocery Complete V5.3 validation PASS.");
