import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (value, message) => { if (!value) failures.push(message); };

const css = read("apps/shopping-web/app/shopping-desktop-responsive-v2.4.css");
const layout = read("apps/shopping-web/app/layout.tsx");
const neonValidator = read("scripts/validate-shopping-futuristic-neon-v2.mjs");

for (const marker of [
  "@media (min-width: 981px)",
  "@media (max-width: 980px)",
  ".neon-shop .bz-shop-search",
  ".neon-shop .bz-icon-link",
  ".neon-shop .bz-account-trigger",
  ".neon-shop .bz-shop-cart a",
  "border-radius: 50%",
  "grid-template-columns: repeat(5",
  "Ask BazAI",
]) {
  expect(css.includes(marker), `Shopping V2.4 responsive CSS missing: ${marker}`);
}

expect(
  layout.includes('import "./shopping-desktop-responsive-v2.4.css";'),
  "Shopping layout must import shopping-desktop-responsive-v2.4.css",
);

/* Confirm old V2 false assertions are no longer the active checks. */
expect(
  !neonValidator.includes('web.includes("SHOP THE FUTURE")'),
  "Old contiguous SHOP THE FUTURE assertion still active",
);
expect(
  !neonValidator.includes('mobile.includes("SHOP\\\\n")'),
  "Old literal SHOP\\\\n assertion still active",
);

if (failures.length) {
  console.error(`Shopping V2.4 responsive audit FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Shopping V2.4 responsive audit PASS.");
