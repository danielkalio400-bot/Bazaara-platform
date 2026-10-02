import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const read = (relative) =>
  fs.readFileSync(path.join(root, relative), "utf8");

const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const wishlist = read("apps/shopping-web/components/cart-wishlist-button.tsx");
const wishlistCss = read("apps/shopping-web/components/cart-wishlist-button.module.css");
const cart = read("apps/shopping-web/app/shopping/cart/page.tsx");
const cartCss = read("apps/shopping-web/app/cart-wishlist-v2.6.css");
const layout = read("apps/shopping-web/app/layout.tsx");

expect(wishlist.includes("<svg"), "Cart Wishlist must render an icon");
expect(wishlist.includes("aria-label={label}"), "Cart Wishlist must keep accessible text");
expect(!wishlist.includes('"Wishlisted"'), "Cart Wishlist must not show Wishlisted text");
expect(!wishlist.includes('"Wishlist"'), "Cart Wishlist must not show Wishlist button text");
expect(!wishlist.includes("Added to wishlist"), "Cart Wishlist must not show status write-up");
expect(wishlistCss.includes(".srOnly"), "Cart Wishlist must keep screen-reader-only label");

for (const marker of [
  "removedSuggestion",
  "Save it to Wishlist",
  "cart-remove-wishlist-suggestion",
  "<CartWishlistButton",
]) {
  expect(cart.includes(marker), `Cart remove recommendation missing: ${marker}`);
}

expect(
  cartCss.includes(".cart-remove-wishlist-suggestion"),
  "Cart recommendation styling missing",
);

expect(
  layout.includes('import "./cart-wishlist-v2.6.css";'),
  "Shopping layout must import cart-wishlist-v2.6.css",
);

if (failures.length) {
  console.error(
    `Shopping Cart V2.6 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`,
  );

  for (const failure of failures) {
    console.error(` - ${failure}`);
  }

  process.exit(1);
}

console.log("Shopping Cart V2.6 validation PASS.");
