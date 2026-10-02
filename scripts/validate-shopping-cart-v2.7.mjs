import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (value, message) => { if (!value) failures.push(message); };

const cart = read("apps/shopping-web/app/shopping/cart/page.tsx");
const css = read("apps/shopping-web/app/cart-mobile-compact-v2.7.css");
const layout = read("apps/shopping-web/app/layout.tsx");

for (const marker of [
  "shop-cart-route",
  "shopping-cart-open",
  "cart-mobile-page-heading",
  "cart-mobile-back",
]) {
  expect(cart.includes(marker), `Cart page missing V2.7 marker: ${marker}`);
}

for (const marker of [
  "body.shopping-cart-open .bazaara-mobile-topbar",
  ".shop-cart-route .cart-item",
  "grid-template-columns: 76px",
  ".shop-cart-route .cart-summary",
  ".bazaara-cart-discovery-grid",
  "flex: 0 0 142px",
]) {
  expect(css.includes(marker), `Cart compact CSS missing: ${marker}`);
}

expect(
  layout.includes('import "./cart-mobile-compact-v2.7.css";'),
  "Shopping layout must import cart-mobile-compact-v2.7.css",
);

if (failures.length) {
  console.error(`Shopping Cart V2.7 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Shopping Cart V2.7 validation PASS.");
