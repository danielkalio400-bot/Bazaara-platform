import test from "node:test";
import assert from "node:assert/strict";
import { calculateSellerShippingMinor, canTransitionSellerOrder } from "./checkout.js";

test("shopping shipping policy gives free delivery at the configured seller threshold", () => {
  assert.equal(calculateSellerShippingMinor(4999999n), 150000n);
  assert.equal(calculateSellerShippingMinor(5000000n), 0n);
  assert.equal(calculateSellerShippingMinor(8000000n), 0n);
});

test("seller fulfillment transitions are sequential", () => {
  assert.equal(canTransitionSellerOrder("PLACED", "CONFIRMED"), true);
  assert.equal(canTransitionSellerOrder("PLACED", "SHIPPED"), false);
  assert.equal(canTransitionSellerOrder("PACKED", "READY_TO_SHIP"), true);
  assert.equal(canTransitionSellerOrder("READY_TO_SHIP", "SHIPPED"), false);
});
