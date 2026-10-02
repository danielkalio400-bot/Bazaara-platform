import test from "node:test";
import assert from "node:assert/strict";
import { parseShoppingIntent as webParse, shoppingIntentHref } from "../apps/shopping-web/lib/shopping-intent.ts";
import { parseShoppingIntent as nativeParse } from "../apps/shopping-mobile/src/lib/shopping-intent.ts";
import { curateShoppingHome } from "../services/platform-api/src/shopping/home-curation.ts";

const cases = [
  ["verified sellers with headphones under ₦50k", { q: "headphones", maxPriceMinor: "5000000", verifiedSeller: "true" }],
  ["Find me laptops between ₦250,000 and ₦750,000", { q: "laptops", minPriceMinor: "25000000", maxPriceMinor: "75000000" }],
  ["New arrival sneakers under 100k", { q: "sneakers", maxPriceMinor: "10000000", sort: "newest" }],
  ["cheapest office chairs below NGN 30,000", { q: "office chairs", maxPriceMinor: "3000000", sort: "price_asc" }],
  ["find backpacks above 25k", { q: "backpacks", minPriceMinor: "2500000" }],
  ["newest electronics under ₦1m", { q: "electronics", maxPriceMinor: "100000000", sort: "newest" }],
  ["laptops between 70k and 20k", { q: "laptops", minPriceMinor: "2000000", maxPriceMinor: "7000000" }],
  ["latest shoes", { q: "shoes", sort: "newest" }],
];
for (const [phrase, expected] of cases) {
  test(`guided shopping parses ${phrase}`, () => {
    const result = webParse(phrase);
    assert.equal(result.vertical, "SHOPPING");
    assert.equal(result.inStock, "true");
    for (const [key, value] of Object.entries(expected)) assert.equal(result[key], value, key);
    assert.deepEqual(result, nativeParse(phrase), "web/native parser parity");
    const url = shoppingIntentHref(result);
    assert.ok(url.startsWith("/search-results?"), "same-origin search URL");
    const params = new URL(url, "https://bazaara.example").searchParams;
    assert.equal(params.get("vertical"), "SHOPPING");
    if (result.maxPriceMinor) assert.equal(params.get("maxPriceMinor"), result.maxPriceMinor);
  });
}
test("invalid unrealistic budgets are not sent to the API", () => {
  const huge = webParse("phone under ₦9999999999999999");
  assert.equal(huge.maxPriceMinor, undefined);
  const empty = webParse(" ");
  assert.equal(empty.q, undefined);
});

const item = (id, priceMinor, compareAtPriceMinor = null) => ({ id, priceMinor, compareAtPriceMinor });
test("home backfills unfeatured active products without duplicate listings", () => {
  const curated = curateShoppingHome([item("A",1000)], [item("A",1000),item("B",2000)], []);
  assert.deepEqual(curated.products.map((row) => row.id), ["A","B"]);
  assert.equal(curated.catalogueStatus,"AVAILABLE");
});
test("deal radar ranks real percentage discounts and excludes misleading compare prices", () => {
  const curated = curateShoppingHome([],[],[item("10pct",900,1000),item("50pct",500,1000),item("fake",1000,500)]);
  assert.deepEqual(curated.deals.map((row) => row.id),["50pct","10pct"]);
});
test("empty shelves are explicitly empty instead of invented recommendations", () => {
  const curated = curateShoppingHome([],[],[]);
  assert.equal(curated.catalogueStatus,"EMPTY");
  assert.deepEqual(curated.products,[]);
});
