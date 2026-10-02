import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (value, message) => {
  if (!value) failures.push(message);
};

const component = read("apps/shopping-web/components/cart-aftercare-recommendations.tsx");
const css = read("apps/shopping-web/app/cart-experience-v2.5.css");
const layout = read("apps/shopping-web/app/layout.tsx");
const cartLayout = read("apps/shopping-web/app/cart/layout.tsx");
const nestedCartLayout = read("apps/shopping-web/app/shopping/cart/layout.tsx");

for (const marker of [
  "Wishlist",
  "Customers also viewed",
  "/api/bazaara-wishlist",
  "/v1/shopping/home",
  "/v1/shopping/cart",
  "ProductCard",
]) {
  expect(component.includes(marker), `Cart discovery component missing: ${marker}`);
}

for (const marker of [
  "body:has(.bazaara-cart-aftercare) .bz-shop-header",
  "display: none !important",
  ".bazaara-cart-discovery-grid",
  ".bazaara-cart-aftercare",
]) {
  expect(css.includes(marker), `Cart V2.5 CSS missing: ${marker}`);
}

expect(
  layout.includes('import "./cart-experience-v2.5.css";'),
  "Root Shopping layout must import cart-experience-v2.5.css",
);

expect(
  cartLayout.includes("CartAftercareRecommendations"),
  "/cart layout must mount CartAftercareRecommendations",
);

expect(
  nestedCartLayout.includes("CartAftercareRecommendations"),
  "/shopping/cart layout must mount CartAftercareRecommendations",
);

if (failures.length) {
  console.error(`Shopping Cart V2.5 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Shopping Cart V2.5 validation PASS.");
