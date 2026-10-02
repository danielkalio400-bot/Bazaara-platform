import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
let checks = 0;
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (condition, message) => { checks++; if (!condition) failures.push(message); };

const web = read("apps/shopping-web/app/shopping/page.tsx");
const oldCss = read("apps/shopping-web/app/shopping-futuristic-neon-v2.css");
const layout = read("apps/shopping-web/app/layout.tsx");
const mobile = read("apps/shopping-mobile/app/(tabs)/index.tsx");
const productCard = read("apps/shopping-web/components/product-card.tsx");
const addToCart = read("apps/shopping-web/components/add-to-cart.module.css");

// Keep the original V2 visual assets and functional purchase controls intact.
for (const marker of ["V2.2 POLISH", ".neon-shop .bz-shop-search input:focus", ".neon-shop .shop-product-card.neon-product-card", ".neon-shop .bazaara-ai-launcher::after", "Ask BazAI"]) {
  expect(oldCss.includes(marker), `Legacy styling contract missing: ${marker}`);
}
expect(layout.includes('import "./shopping-futuristic-neon-v2.css";'), "Original Shopping identity CSS must remain available");
for (const marker of ["neon-product-card", "neon-product-description", "neon-product-meta"]) expect(productCard.includes(marker), `Product card contract missing: ${marker}`);
expect(addToCart.includes(".addButton::before"), "Add-to-cart button icon treatment missing");
expect(addToCart.includes("border: 0;"), "Add-to-cart should not use hard border lines");
expect(!mobile.includes("/v1/go/home"), "Shopping mobile must not depend on GO home endpoint");
expect(!mobile.includes("BAZAARA GO"), "Shopping mobile must not display BAZAARA GO");

// This repository contains the newer V12 Smart Commerce home; do not demand
// retired V2 hero copy merely to pass an outdated source-marker validator.
if (layout.includes('import "./shopping-smart-v12.css";')) {
  const newCss = read("apps/shopping-web/app/shopping-smart-v12.css");
  for (const marker of ["SmartDiscoveryPanel", "RecentlyViewed", "v12-product-grid", "v12-smart-shelves", "/bulk", "BazAI", "bazlens"]) {
    expect(web.includes(marker), `V12 home missing: ${marker}`);
  }
  for (const marker of [".v12-hero-layout", ".v12-smart-finder", ".v12-product-grid", "@media (max-width:680px)", "prefers-reduced-motion"]) {
    expect(newCss.includes(marker), `V12 responsive styling missing: ${marker}`);
  }
  for (const marker of ["/v1/shopping/home", "smart-shop", "Under ₦25k", "Verified sellers", "bulk"]) {
    expect(mobile.includes(marker), `V12 mobile home missing: ${marker}`);
  }
} else {
  for (const marker of ["FUTURE-READY MARKETPLACE", "neon-category-rail", "FEATURED DEALS", "Baz Lens", "BazAI", "YOUR SHOPPING SYSTEM", "THE FUTURE"]) {
    expect(web.includes(marker), `V2 home missing: ${marker}`);
  }
  for (const marker of ["/v1/shopping/home", "THE FUTURE", "Baz Lens", "BazAI", "Products lighting up Shopping"]) {
    expect(mobile.includes(marker), `V2 mobile home missing: ${marker}`);
  }
}
if (failures.length) { console.error(`Shopping visual contract FAIL (${failures.length} issues)`); for (const failure of failures) console.error(` - ${failure}`); process.exit(1); }
console.log(`Shopping visual contract PASS (${checks} assertions).`);
