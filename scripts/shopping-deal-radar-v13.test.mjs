import assert from "node:assert/strict";
import test from "node:test";
import { curateDealRadar } from "../services/platform-api/src/shopping/deal-radar.ts";

const base = { currency: "NGN", stock: "IN_STOCK", availableQuantity: 4, seller: { verified: true }, category: { slug: "electronics" } };
const item = (id, now, before, extra = {}) => ({ ...base, id, slug: id, priceMinor: now, compareAtPriceMinor: before, ...extra });
const opts = { minDiscountPercent: 1, verifiedSeller: false, sort: "biggest_discount" };
test("actual price and compare-at price produce real savings", () => {
  const [deal] = curateDealRadar([item("phone", 7500, 10000)], opts);
  assert.equal(deal.discountPercent, 25);
  assert.equal(deal.savingsMinor, 2500);
});
test("rejects fake and inverted discounts, zero or invalid prices", () => {
  assert.equal(curateDealRadar([item("a", 100, 100), item("b", 120, 100), item("c", 0, 100), item("d", 10, NaN)], opts).length, 0);
});
test("suppresses out-of-stock products regardless of displayed offer", () => {
  assert.equal(curateDealRadar([item("a", 10, 100, { stock: "OUT_OF_STOCK" }), item("b", 10, 100, { availableQuantity: 0 })], opts).length, 0);
});
test("verification is evidence-based, and an absent seller does not pass", () => {
  assert.deepEqual(curateDealRadar([item("a", 10, 100, { seller: null }), item("b", 20, 100, { seller: { verified: false } }), item("c", 60, 100)], { ...opts, verifiedSeller: true }).map(x => x.id), ["c"]);
});
test("filters by category, minimum real discount, and budget", () => {
  assert.deepEqual(curateDealRadar([item("a", 8000, 10000), item("b", 3000, 10000, { category: { slug: "fashion" } }), item("c", 4000, 10000)], { ...opts, minDiscountPercent: 50, maxPriceMinor: 4500, category: "electronics" }).map(x => x.id), ["c"]);
});
test("a rounded 10 percent badge cannot bypass a true 10 percent threshold", () => {
  assert.equal(curateDealRadar([item("a", 905, 1000)], { ...opts, minDiscountPercent: 10 }).length, 0);
});
test("ranks actual percentage savings with deterministic ties, no duplicates", () => {
  assert.deepEqual(curateDealRadar([item("b", 70, 100), item("a", 40, 100), item("a", 40, 100), item("c", 35, 100)], opts).map(x => x.id), ["c", "a", "b"]);
});
test("lowest price sort respects amount rather than inflated percentage", () => {
  assert.deepEqual(curateDealRadar([item("b", 5000, 10000), item("a", 1000, 2000)], { ...opts, sort: "lowest_price" }).map(x => x.id), ["a", "b"]);
});
