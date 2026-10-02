import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
let count=0;
function check(condition,detail){assert.ok(condition,detail);count++;}
function read(path){return fs.readFileSync(path,"utf8");}
const layout=read("apps/shopping-web/app/layout.tsx");
const oldImport='import "./shopping-retail-v14.css";';
const newImport='import "./shopping-restored-v15.css";';
check(layout.includes(oldImport) && layout.includes(newImport),"V14 architecture and V15 colour restoration loaded");
check(layout.indexOf(oldImport)<layout.indexOf(newImport),"Restored theme loaded AFTER orange V14 theme");
const css=read("apps/shopping-web/app/shopping-restored-v15.css");
for(const part of ["#00B8FF","#2563FF",".v14-hero-primary",".v14-product-grid",".v14-benefits",".v14-mobile-categories",".v13-radar",".bz-search-results",".bz-shop-header"]){check(css.includes(part),`Restored blue theme missing ${part}`);}
const food=read("apps/food-web/app/globals.css");
check(food.includes("--food-accent:#FF3D24"),"Food must retain its original red/orange identity");
check(food.includes("--food-accent-2:#FF7A00"),"Food secondary accent preserved");
const seed=read("packages/db/prisma/seed-ui-smoke-v15.ts");
for (const marker of ["assertLocalFixtureTarget","bazaara-v15-demo-","phones-tablets","electronics","computing","home-kitchen","fashion","beauty-care","baby-kids","sports-outdoors","FoodMenuSection","FoodMenuItem","foodMenuItem.upsert","quantityOnHand: 30", "featured: true"]){check(seed.includes(marker) || (marker==="FoodMenuSection" && seed.includes("db.foodMenuSection")) || (marker==="FoodMenuItem" && seed.includes("db.foodMenuItem")),`Seed fixture missing ${marker}`);}
const ps=read("scripts/Test-BAZAARA-Shopping-Food-V15.ps1");
for(const endpoint of ["/v1/shopping/home","/v1/shopping/products", "/v1/shopping/cart/items", "/v1/shopping/checkouts", "/v1/shopping/orders", "/v1/shopping/wishlist", "/v1/bazid/login/email", "/v1/bazid/me", "/v1/food/home", "/v1/food/restaurants/", "/v1/food/favorites", "/v1/food/orders", "OrderConfirmation", "DEMO_ORDERS_ONLY"]){check(ps.includes(endpoint),`PowerShell smoke test missing ${endpoint}`);}
const p=JSON.parse(read("package.json"));
check(p.scripts["validate:shopping-food-fixtures-v15"]==="node scripts/validate-shopping-food-fixtures-v15.mjs","V15 validator registered");
check(p.scripts["validate:shopping-current"].includes("validate:shopping-food-fixtures-v15"),"Shopping validation includes V15");
const mobileRestorer=read("scripts/Restore-BAZAARA-Shopping-Mobile-Blue-V15.cjs");
check(mobileRestorer.includes("BAZAARA_SHOPPING_RESTORED_BLUE_V15") && mobileRestorer.includes("'#E87D13':'#00B8FF'"), "Shopping Mobile original neon-blue transformer present");
if (p.scripts["validate:shopping-retail-v14"]) {
  for (const filename of ["apps/shopping-mobile/app/(tabs)/index.tsx","apps/shopping-mobile/app/deals.tsx"]) {
    const native=read(filename);
    check(native.includes("BAZAARA_SHOPPING_RESTORED_BLUE_V15"), `Original native Shopping colour restored: ${filename}`);
    check(!/<(?:ProductCard|Screen|SectionTitle)\b[^>]*\sretail(?:\s|>)/.test(native), `Native V14 orange retail variant disabled: ${filename}`);
  }
}
const behavior=spawnSync(process.execPath,["--experimental-strip-types","--test","--test-reporter=tap","scripts/demo-v15-guard.test.mjs"],{cwd:process.cwd(),encoding:"utf8"});
if(behavior.status!==0){console.error(behavior.stdout,behavior.stderr);process.exit(1);}
check(/^# pass\s+9\s*$/m.test(behavior.stdout) && /^# fail\s+0\s*$/m.test(behavior.stdout),"Demo seed database guard unit tests passed (9/9)");
console.log(`Shopping/Food V15 source validation PASS (${count} assertions, 9 guard tests).`);
