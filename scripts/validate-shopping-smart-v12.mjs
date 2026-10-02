import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };

const home = read("apps/shopping-web/app/shopping/page.tsx");
const layout = read("apps/shopping-web/app/layout.tsx");
const css = read("apps/shopping-web/app/shopping-smart-v12.css");
const guided = read("apps/shopping-web/components/smart-discovery-panel.tsx");
const recent = read("apps/shopping-web/components/recently-viewed.tsx");
const search = read("apps/shopping-web/app/search-results/search-results-client.tsx");
const legacyBulk = read("apps/shopping-web/app/bulk/page.tsx");
const header = read("apps/shopping-web/components/shopping-header.tsx");
const service = read("services/platform-api/src/shopping/service.ts");
const card = read("apps/shopping-web/components/product-card.tsx");
const mobile = read("apps/shopping-mobile/app/(tabs)/index.tsx");
const mobileGuide = read("apps/shopping-mobile/app/smart-shop.tsx");
const legacyMobileBulk = read("apps/shopping-mobile/app/bulk.tsx");

check(layout.includes('import "./shopping-smart-v12.css";'), "V12 styling loaded");
for (const fragment of ["SmartDiscoveryPanel", "RecentlyViewed", "/deals", "v12-smart-shelves", "v12-catalogue", "v12-product-grid", "v12-empty", "catalogue.length === 0"]) check(home.includes(fragment), `V12 home: ${fragment}`);
check(home.includes("offline = true") && home.includes('role="alert"'), "API failures are explicit, not silently empty");
check(home.includes("compareAtPriceMinor") && home.includes("Math.round"), "Deal percentages derived from actual listings");
check(service.includes('merchant: { vertical: "SHOPPING"'), "Home catalog restricted to Shopping sellers");
check(service.includes('status: "ACTIVE"'), "Inactive products not promoted");
check(service.includes('featured: true') && service.includes('newestRows') && service.includes('offerRows'), "API loads feature, new and deal candidates");
check(service.includes('curateShoppingHome(') && read("services/platform-api/src/shopping/home-curation.ts").includes('catalogueStatus:'), "Pure tested curation supplies honest deal and empty statuses");
check(card.includes("availableQuantity <= 5"), "Real low-stock evidence on product cards");
check(guided.includes("parseShoppingIntent") && guided.includes("shoppingIntentHref"), "Guided search connected to real search route");
check(guided.includes("transparent catalogue filters"), "Guided parser is not falsely advertised as AI inference");
check(recent.includes("localStorage") && recent.includes("removeItem(KEY)"), "Recent history local and clearable");
check(read("apps/shopping-web/app/shopping/products/[slug]/page.tsx").includes("TrackRecentlyViewed"), "Product detail powers local history");
check(search.includes("minPriceDraft") && search.includes("maxPriceDraft") && !search.includes("onChange={() => undefined}"), "Price inputs are usable and controlled");
check(search.includes("Minimum price must not exceed maximum price") && search.includes("Number.isFinite"), "Price filtering rejects invalid ranges");
check(search.includes("popstate") && search.includes("history.pushState"), "Search back/forward navigation wired");
check(search.includes('navigate({ ...params, page: String(page + 1) })'), "Search pagination doesn't reset itself");
check(legacyBulk.includes('redirect("/shopping")'), "Old web bulk link safely redirects to retail Shopping");
check(!header.includes('href="/bulk"') && !search.includes('href="/bulk"'), "No wholesale links in retail web navigation");
check(!home.includes('href="/bulk"'), "Retail home contains no wholesale links");
check(mobile.includes("/smart-shop") && !mobile.includes('"/bulk"'), "Native home has Smart Find but no wholesale links");
check(mobileGuide.includes("parseShoppingIntent") && mobileGuide.includes("/search-results"), "Native guided search connected");
check(legacyMobileBulk.includes('<Redirect href="/(tabs)"'), "Old mobile bulk link redirects to retail Shopping");
check(read("apps/shopping-mobile/app/_layout.tsx").includes('name="bulk"'), "Native bulk route registered");
check(read("apps/shopping-mobile/app/_layout.tsx").includes('name="smart-shop"'), "Native guided route registered");
for (const marker of [".v12-product-grid", ".v12-intent-form", "max-width:680px", "prefers-reduced-motion"]) check(css.includes(marker), `V12 CSS: ${marker}`);

const behavior = spawnSync(process.execPath, ["--experimental-strip-types", "--test", "--test-reporter=tap", "scripts/shopping-smart-v12.test.mjs"], { cwd: root, encoding: "utf8" });
if (behavior.status !== 0) { console.error(behavior.stdout, behavior.stderr); process.exit(behavior.status ?? 1); }
const testSummary = behavior.stdout.match(/^# tests\s+(\d+)\s*$/m);
const passSummary = behavior.stdout.match(/^# pass\s+(\d+)\s*$/m);
const failSummary = behavior.stdout.match(/^# fail\s+(\d+)\s*$/m);

if (!testSummary || !passSummary || !failSummary) {
  console.error("Unexpected test output:", behavior.stdout, behavior.stderr);
}

check(
  Number(testSummary?.[1]) === 12 &&
  Number(passSummary?.[1]) === 12 &&
  Number(failSummary?.[1]) === 0,
  "9 guided-search plus 3 curation behavior tests passed"
);
console.log(`Shopping Smart Commerce V12 validation PASS (${checks} assertions; 12 behavior tests).`);

