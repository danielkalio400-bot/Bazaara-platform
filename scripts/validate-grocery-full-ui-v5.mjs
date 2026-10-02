import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (value, message) => { if (!value) failures.push(message); };

const webHome = read("apps/grocery-web/app/page.tsx");
const webCss = read("apps/grocery-web/app/grocery-premium-v3.css");
const webLayout = read("apps/grocery-web/app/layout.tsx");
const productCard = read("apps/grocery-web/components/product-card.tsx");
const header = read("apps/grocery-web/components/shopping-header.tsx");

const mobileHome = read("apps/grocery-mobile/app/(tabs)/index.tsx");
const mobileTheme = read("apps/grocery-mobile/src/ui/theme.ts");
const mobileProduct = read("apps/grocery-mobile/src/ui/product-card.tsx");
const mobileTabs = read("apps/grocery-mobile/app/(tabs)/_layout.tsx");

const business = read("apps/business-web/app/grocery/page.tsx");
const businessProducts = read("apps/business-web/app/grocery/products/page.tsx");
const businessLayout = read("apps/business-web/app/layout.tsx");
const businessCss = read("apps/business-web/app/business-grocery-v5.css");

const ops = read("apps/operations-web/app/grocery/page.tsx");
const opsLayout = read("apps/operations-web/app/layout.tsx");
const opsCss = read("apps/operations-web/app/operations-grocery-v5.css");

for (const marker of [
  "GROCERY · FRESH COMMERCE",
  "Fresh groceries",
  "grocery-fresh-console",
  "SHOP BY AISLE",
  "WEEKLY SHOPPING SYSTEM",
  "Fresh essentials",
]) expect(webHome.includes(marker), `Grocery web home missing marker: ${marker}`);

for (const marker of [
  ".grocery-premium-hero",
  ".grocery-service-ribbon",
  ".grocery-premium-category-grid",
  ".grocery-premium-store-grid",
  ".grocery-product-card",
  ".gv2-card",
  "@media (max-width: 760px)",
]) expect(webCss.includes(marker), `Grocery premium CSS missing marker: ${marker}`);

expect(webLayout.includes('import "./grocery-premium-v3.css";'), "Grocery web layout must import grocery-premium-v3.css");
expect(webLayout.includes('applicationName: "Grocery"'), "Grocery metadata applicationName must be Grocery");

for (const marker of [
  "grocery-product-card",
  "grocery-product-description",
  "Express eligible",
  "Fresh pick",
]) expect(productCard.includes(marker), `Grocery product card missing marker: ${marker}`);

expect(header.includes("Grocery AI"), "Grocery header missing Grocery AI");
expect(header.includes("Search Grocery"), "Grocery header search aria label not canonical");

for (const marker of [
  "groceryPalette",
  'background: "#05110E"',
  'primary: "#10B981"',
  'lime: "#A3E635"',
]) expect(mobileTheme.includes(marker), `Grocery mobile theme missing marker: ${marker}`);

for (const marker of [
  "FRESH COMMERCE",
  "Smart planner",
  "Shop by aisle",
  "Grocery sellers",
  "Fresh essentials",
]) expect(mobileHome.includes(marker), `Grocery mobile home missing marker: ${marker}`);

expect(mobileProduct.includes("Add to basket"), "Grocery mobile product card missing Add to basket");
expect(mobileTabs.includes("groceryPalette"), "Grocery mobile tabs not using Grocery palette");

expect(business.includes("grocery-business-v5"), "Business Grocery workspace missing V5 wrapper");
expect(businessProducts.includes("grocery-business-catalog-v5"), "Business Grocery products missing V5 wrapper");
expect(businessLayout.includes('import "./business-grocery-v5.css";'), "Business layout missing Grocery V5 CSS");
expect(businessCss.includes(".grocery-business-v5"), "Business Grocery CSS missing wrapper");

expect(ops.includes("grocery-ops-v5"), "Operations Grocery workspace missing V5 wrapper");
expect(opsLayout.includes('import "./operations-grocery-v5.css";'), "Operations layout missing Grocery V5 CSS");
expect(opsCss.includes(".grocery-ops-v5"), "Operations Grocery CSS missing wrapper");

if (failures.length) {
  console.error(`Grocery Full UI V5 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Grocery Full UI V5 validation PASS.");
