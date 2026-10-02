import assert from 'node:assert/strict';
import fs from 'node:fs';
let count=0;
function check(ok,name){assert.ok(ok,name);count++;}
function read(name){return fs.readFileSync(name,'utf8');}
const layout=read('apps/shopping-web/app/layout.tsx');
const oldCss='import "./shopping-retail-v14.css";';
const restoredCss='import "./shopping-restored-v15.css";';
const completeCss='import "./shopping-blue-complete-v15-1.css";';
check(layout.includes(oldCss)&&layout.includes(restoredCss)&&layout.includes(completeCss),'V14, V15, V15.1 styles are imported');
check(layout.indexOf(oldCss)<layout.indexOf(restoredCss)&&layout.indexOf(restoredCss)<layout.indexOf(completeCss),'Full blue restoration loads last');
const css=read('apps/shopping-web/app/shopping-blue-complete-v15-1.css');
for(const section of ['.shop-shell','.v13-radar','.bz-search-results','.bz-shop-header','.v14-retail','.v14-product-grid','.v14-mobile-categories','.product-buy-panel','.cart-item','.cart-summary','.bazaara-wishlist-list','.bazaara-checkout-delivery-process','.order-card','.bazaara-account-page','.bazaara-profile-page','.bazaara-settings-page','.bazaara-mobile-topbar','.bazaara-mobile-bottom-nav','.bazaara-mobile-category-drawer']) {
  check(css.includes(section),`Theme coverage missing: ${section}`);
}
check(css.includes('#00B8FF')&&css.includes('#030915'),'Original electric blue and charcoal tokens restored');
check(!css.includes('#ed7d10')&&!css.includes('#ed8217'),'No V14 orange retail-brand colours in final stylesheet');
check(css.includes('body:has(:is(.shop-shell')&&css.includes('.bazaara-mobile-bottom-nav'),'Mobile browser theme scoped to Shopping, not Grocery');
check(css.includes('error/warning/success')||css.includes('error/warning/success banners'),'Semantic status colours explicitly exempted');
const v14=read('scripts/validate-shopping-retail-v14.mjs');
check(v14.includes('BAZAARA_V15_1_PALETTE_COMPAT'),'V14 validator understands V15 theme switch');
check(v14.includes('BAZAARA_SHOPPING_RESTORED_BLUE_V15'),'V14 validator verifies V15 native restoration');
for(const page of ['apps/shopping-mobile/app/(tabs)/index.tsx','apps/shopping-mobile/app/deals.tsx']) {
  const native=read(page);
  check(native.includes('BAZAARA_SHOPPING_RESTORED_BLUE_V15'),`Native screen marked restored: ${page}`);
  check(!/<(?:ProductCard|Screen|SectionTitle)\b[^>]*\sretail(?:\s|>)/.test(native),`V14 orange retail cards disabled: ${page}`);
}
check(read('apps/food-web/app/globals.css').includes('--food-accent:#FF3D24'),'Food retains original red palette');
check(read('apps/food-web/app/globals.css').includes('--food-accent-2:#FF7A00'),'Food retains original orange secondary');
const pkg=JSON.parse(read('package.json'));
check(pkg.scripts['validate:shopping-blue-complete-v15-1']==='node scripts/validate-shopping-blue-complete-v15-1.mjs','V15.1 validator registered');
check(pkg.scripts['validate:shopping-current'].includes('validate:shopping-blue-complete-v15-1'),'V15.1 added to Shopping release validation');
console.log(`Shopping blue V15.1 regression checks PASS (${count} source assertions).`);
