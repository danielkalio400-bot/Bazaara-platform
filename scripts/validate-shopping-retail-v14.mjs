import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
let assertions = 0;
function check(condition, label) { assert.ok(condition, label); assertions++; }
const home = source("apps/shopping-web/app/shopping/page.tsx");
const header = source("apps/shopping-web/components/shopping-header.tsx");
const search = source("apps/shopping-web/app/search-results/search-results-client.tsx");
const desktopNav = source("apps/shopping-web/components/bazaara-mobile-bottom-nav.tsx");
const layout = source("apps/shopping-web/app/layout.tsx");
const css = source("apps/shopping-web/app/shopping-retail-v14.css");
const bulk = source("apps/shopping-web/app/bulk/page.tsx");
const mobileHome = source("apps/shopping-mobile/app/(tabs)/index.tsx");
const mobileBulk = source("apps/shopping-mobile/app/bulk.tsx");
const mobileDeal = source("apps/shopping-mobile/app/deals.tsx");
const mobileUi = source("packages/mobile-ui/src/index.tsx");
const rootPackage = JSON.parse(source("package.json"));

for (const marker of ["v14-retail", "v14-hero-layout", "v14-category-rail", "v14-mobile-categories", "v14-deal-heading", "v14-product-grid", "v14-smart-section", "v14-budget-shelves", "SmartDiscoveryPanel", "RecentlyViewed", "ProductCard", "/orders", "/wishlist", "/deals", "catalogue.length === 0", "role=\"alert\""]) check(home.includes(marker), `Retail home: ${marker}`);
for (const marker of [".v14-retail.v12-shop", ".v14-hero-layout", ".v14-mobile-categories", ".v14-product-grid", ".bz-shop-header", ".v13-radar", ".bz-search-results", "max-width:620px", "prefers-reduced-motion"]) check(css.includes(marker), `Responsive retail style: ${marker}`);
check(layout.includes('import "./shopping-retail-v14.css";'), "Retail design is loaded after legacy Shopping styles");
check(header.includes('href="/deals"') && header.includes('href="/orders"'), "Deals and orders remain in header");
check(search.includes('href="/deals"'), "Search filters link to current deals");
check(!desktopNav.includes('"Wholesale"'), "Bottom navigation no longer advertises wholesale");
check(bulk.includes('redirect("/shopping")'), "Legacy wholesale web bookmark safely redirects");
check(mobileBulk.includes('<Redirect href="/(tabs)"'), "Legacy wholesale mobile bookmark safely redirects");
for (const [name, file] of [["Web home",home],["Header",header],["Search",search],["Mobile home",mobileHome]]) check(!file.includes('"/bulk"') && !file.includes('href="/bulk"'), `${name} has no wholesale entry point`);
check(!home.includes("RFQ") && !mobileHome.includes("RFQ"), "No supplier inquiry UI is shown");
// BAZAARA_V15_1_PALETTE_COMPAT: V14 retail cards are deliberately disabled by V15 blue restoration.
const bazaaraV15BlueInstalled = layout.includes('import "./shopping-restored-v15.css";');
check(bazaaraV15BlueInstalled
  ? [mobileHome, mobileDeal].every((file) => file.includes("BAZAARA_SHOPPING_RESTORED_BLUE_V15")
      && !/<(?:ProductCard|Screen|SectionTitle)\b[^>]*\sretail(?:\s|>)/.test(file))
  : mobileHome.includes("retail") && mobileDeal.includes("retail"),
  "Native Shopping cards match the installed V14 retail or V15 restored-blue theme");
check(mobileUi.includes('retail?: boolean') && mobileUi.includes('retailProductCard'), "Shared mobile UI retail option is isolated and opt-in");
check(mobileHome.indexOf('style={styles.hero}') < mobileHome.indexOf('title="What are you shopping for?"') && mobileHome.indexOf('title="What are you shopping for?"') < mobileHome.indexOf('title={deals.length ? "Deals you can shop"'), "Native home prioritizes retail hero, categories, then deals");
check(rootPackage.scripts["validate:shopping-current"].includes('validate:shopping-retail-v14'), "Current shopping validation includes V14");
console.log(`Shopping Retail V14 validation PASS (${assertions} source assertions).`);
