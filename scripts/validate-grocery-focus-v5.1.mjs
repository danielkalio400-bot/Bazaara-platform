import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const layout = read("apps/grocery-web/app/layout.tsx");
const header = read("apps/grocery-web/components/shopping-header.tsx");
const lists = read("apps/grocery-web/app/lists/page.tsx");
const mobileLists = read("apps/grocery-mobile/app/(tabs)/lists.tsx");
const focus = read("apps/grocery-web/app/grocery-focus-v5.1.css");
const theme = read("apps/grocery-web/app/grocery-theme.css");
const v2 = read("apps/grocery-web/app/grocery-v2.css");
const compare = read("apps/grocery-web/app/compare/page.tsx");
const menu = read("apps/grocery-web/components/shopping-desktop-menus.tsx");

expect(!layout.includes("ShoppingTools"), "Grocery layout must not mount ShoppingTools/BazCompare");
expect(layout.includes('import "./grocery-focus-v5.1.css";'), "Grocery layout missing V5.1 focus CSS");
expect(header.includes("Ask BazAI"), "Advanced Grocery header missing Ask BazAI");
expect(header.includes("My lists"), "Advanced Grocery header missing My lists");
expect(!header.includes("Grocery AI</"), "Old oversized Grocery AI label remains");

for (const marker of [
  "itemQuantityDrafts",
  "grocery-list-quantity-v51",
  "quantity: Math.max(1, item.quantity - 1)",
  "quantity: Math.min(99, item.quantity + 1)",
]) {
  expect(lists.includes(marker), `Web Grocery Lists missing quantity feature: ${marker}`);
}

for (const marker of [
  "itemQuantity",
  "quantity: Math.max(1, item.quantity - 1)",
  "quantity: Math.min(99, item.quantity + 1)",
]) {
  expect(mobileLists.includes(marker), `Mobile Grocery Lists missing quantity feature: ${marker}`);
}

expect(compare.includes('redirect("/")'), "Grocery /compare must redirect away");
expect(!menu.includes('href="/compare"'), "Grocery desktop menu still exposes Compare");

for (const marker of [
  ".grocery-focus-header",
  ".grocery-list-grid-v51",
  ".grocery-list-quantity-v51",
  ".bazcompare-card-action",
]) {
  expect(focus.includes(marker), `Grocery Focus CSS missing marker: ${marker}`);
}

const forbidden = [
  "#C026FF",
  "#FF3BD4",
  "#FF58C8",
  "#F0ABFC",
  "#A13CFF",
  "#D12DFF",
  "rgba(255,59,212",
  "rgba(155,92,255",
];

for (const token of forbidden) {
  expect(!theme.includes(token), `Legacy neon purple/pink remains in grocery-theme.css: ${token}`);
  expect(!v2.includes(token), `Legacy neon purple/pink remains in grocery-v2.css: ${token}`);
}

if (failures.length) {
  console.error(`Grocery Focus V5.1 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Grocery Focus V5.1 validation PASS.");
