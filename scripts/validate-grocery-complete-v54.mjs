import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const expect = (condition, message) => { if (!condition) failures.push(message); };

const layout = read("apps/grocery-web/app/layout.tsx");
const header = read("apps/grocery-web/components/shopping-header.tsx");
const desktopMenu = read("apps/grocery-web/components/shopping-desktop-menus.tsx");
const cart = read("apps/grocery-web/app/cart/page.tsx");
const checkout = read("apps/grocery-web/app/checkout/page.tsx");
const assistant = read("apps/grocery-web/components/bazai-web-assistant.tsx");
const assistantCss = read("apps/grocery-web/components/bazai-web-assistant.module.css");
const lists = read("apps/grocery-web/app/lists/page.tsx");
const orderDetail = read("apps/grocery-web/app/orders/[orderId]/page.tsx");
const backend = read("services/platform-api/src/shopping/checkout.ts");
const mobileCart = read("apps/grocery-mobile/app/cart.tsx");
const mobileCheckout = read("apps/grocery-mobile/app/checkout.tsx");
const mobileAssistant = read("apps/grocery-mobile/app/assistant.tsx");
const mobileLists = read("apps/grocery-mobile/app/(tabs)/lists.tsx");
const mobileTheme = read("apps/grocery-mobile/src/ui/theme.ts");
const business = read("apps/business-web/app/grocery/page.tsx");
const operations = read("apps/operations-web/app/grocery/page.tsx");

expect(!layout.includes("ShoppingTools"), "Grocery still mounts ShoppingTools/BazCompare");
expect(layout.includes('import "./grocery-complete-v54.css";'), "Grocery V5.4 CSS is not loaded");
expect(header.includes("My lists"), "Advanced Grocery header missing My lists");
expect(header.includes(">AI</span>Plan"), "Compact Grocery AI/Plan control missing");
expect(!desktopMenu.includes('href="/compare"'), "Grocery desktop menu still exposes Compare");

expect(!cart.includes("Save substitution"), "Per-item substitution form remains in Grocery cart");
expect(!cart.includes("Picker note"), "Per-item picker-note field remains in Grocery cart");
expect(cart.includes("The store checks what it has"), "Store inventory responsibility message missing");
expect(cart.includes("CartWishlistButton"), "Cart saved/wishlist heart missing");
expect(cart.includes("20% at checkout"), "Cart 20% service-fee notice missing");
expect(cart.includes("Express delivery is ₦2,000"), "Cart Express ₦2,000 notice missing");

expect(checkout.includes("Fixed delivery fee: ₦2,000"), "Web checkout Express ₦2,000 rule missing");
expect(checkout.includes("Service fee · 20%"), "Web checkout 20% service fee missing");
expect(checkout.includes("One preference for the whole order"), "Web checkout global substitution policy missing");
expect(!checkout.includes("₦1,000 Bazaara + ₦1,000 GO"), "Internal Express allocation must not be shown to customers");

expect(assistant.includes("Build the basket before you shop it"), "Grocery AI planner marker missing");
expect(assistant.includes("Plan → check stock → basket → checkout"), "Grocery AI workflow marker missing");
expect(!assistantCss.includes("#2925a9"), "Old blue Grocery AI hero remains");
expect(!assistantCss.includes("#C026FF"), "Old purple Grocery AI action remains");

expect(lists.includes("Lists with real quantities"), "Advanced Grocery Lists marker missing");
expect(lists.includes("quantity:item.quantity+1"), "Web list quantity increment missing");
expect(lists.includes("quantity:item.quantity-1"), "Web list quantity decrement missing");
expect(lists.includes("Household collaborators"), "Web list collaborators were lost");
expect(orderDetail.includes("Service fee · 20%"), "Grocery order detail service-fee line missing");

for (const marker of [
  "GROCERY_SERVICE_FEE_BPS = 2000n",
  "GROCERY_EXPRESS_FEE_MINOR = 200000n",
  "GROCERY_EXPRESS_BAZAARA_SHARE_MINOR = 100000n",
  "GROCERY_EXPRESS_GO_SHARE_MINOR = 100000n",
  "const serviceFeeMinor =",
  "serviceFeeMinor: checkout.vertical",
  "groceryExpressBazaaraShareMinor",
  "groceryExpressGoShareMinor",
]) expect(backend.includes(marker), `Backend Grocery pricing missing: ${marker}`);

expect(!mobileCart.includes("If unavailable"), "Per-item mobile substitution controls remain");
expect(mobileCart.includes("The branch checks what it has"), "Mobile branch-stock responsibility missing");
expect(mobileCheckout.includes("EXPRESS · ₦2,000"), "Mobile Express fee marker missing");
expect(mobileCheckout.includes("Service fee · 20%"), "Mobile 20% service fee missing");
expect(mobileCheckout.includes("One rule for the whole order"), "Mobile global substitution policy missing");
expect(mobileAssistant.includes("Build the basket before you shop it"), "Mobile Grocery AI marker missing");
expect(backend.includes('lockedCheckout.vertical === "GROCERY" && lockedCheckout.deliveryMode === "EXPRESS"'), "Grocery Express merchant-shipping exclusion missing");
expect(mobileLists.includes("quantity:item.quantity+1"), "Mobile list quantity increment missing");
expect(mobileLists.includes("HOUSEHOLD COLLABORATORS"), "Mobile list collaborators were lost");
expect(mobileTheme.includes('background: "#05110E"'), "Mobile Grocery forest background missing");

expect(business.includes("BRANCH STOCK IS AUTHORITATIVE"), "Business Grocery stock-ownership rule missing");
expect(operations.includes("GROCERY COMMERCIAL POLICY"), "Operations Grocery commercial policy missing");
expect(operations.includes("<strong>₦1,000</strong>"), "Operations internal Express split missing");
expect(operations.includes("<strong>20%</strong>"), "Operations Grocery 20% service fee missing");

// No legacy purple/pink should survive in live Grocery CSS/mobile source.
const forbidden = ["#C026FF", "#FF3BD4", "#FF58C8", "#F0ABFC", "#A13CFF", "#D12DFF", "#E879F9", "#D946EF", "#EC4899"];
function walk(dir, extensions, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, extensions, found);
    else if (extensions.some((ext) => entry.name.endsWith(ext))) found.push(full);
  }
  return found;
}
for (const file of [...walk(path.join(root,"apps/grocery-web"),[".css"]), ...walk(path.join(root,"apps/grocery-mobile"),[".ts",".tsx"])]) {
  const value = fs.readFileSync(file,"utf8");
  for (const token of forbidden) if (value.includes(token)) failures.push(`${path.relative(root,file)} still contains legacy Grocery color ${token}`);
}

if (failures.length) {
  console.error(`Grocery Complete V5.4.2 validation FAILED (${failures.length} issue${failures.length===1?"":"s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log("Grocery Complete V5.4.2 validation PASS.");
