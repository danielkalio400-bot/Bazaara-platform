import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateGroceryExpressFeeMinor,
  calculateGroceryPricing,
  calculateGroceryServiceFeeMinor,
  type GroceryPricingPolicy,
} from "./grocery-pricing.js";

const policy: GroceryPricingPolicy = {
  serviceFeeBps: 1200,
  serviceFeeMinBps: 1000,
  serviceFeeMaxBps: 1500,
  expressRateBps: 1000,
  expressMinimumMinor: 100000n,
  expressMaximumMinor: 500000n,
};

test("Grocery service fee accepts only the 10 to 15 percent range", () => {
  assert.equal(calculateGroceryServiceFeeMinor(2_000_000n, 1000), 200_000n);
  assert.equal(calculateGroceryServiceFeeMinor(2_000_000n, 1500), 300_000n);
  assert.throws(() => calculateGroceryServiceFeeMinor(2_000_000n, 900));
  assert.throws(() => calculateGroceryServiceFeeMinor(2_000_000n, 1600));
});

test("Express is 10 percent of merchandise subtotal with NGN 1,000 minimum", () => {
  assert.equal(calculateGroceryExpressFeeMinor(500_000n, policy), 100_000n);
  assert.equal(calculateGroceryExpressFeeMinor(1_500_000n, policy), 150_000n);
});

test("Express is capped at NGN 5,000", () => {
  assert.equal(calculateGroceryExpressFeeMinor(10_000_000n, policy), 500_000n);
});

test("Express and service fee are calculated separately", () => {
  const result = calculateGroceryPricing({
    subtotalMinor: 2_000_000n,
    deliveryMode: "EXPRESS",
    standardShippingMinor: 150_000n,
    hasFreeDelivery: true,
    policy,
  });

  assert.equal(result.serviceFeeMinor, 240_000n);
  assert.equal(result.shippingMinor, 200_000n);
  assert.equal(result.deliveryPlatformShareMinor, 0n);
  assert.equal(result.deliveryGoShareMinor, 0n);
});

test("Pickup has no delivery charge while the configured service fee still applies", () => {
  const result = calculateGroceryPricing({
    subtotalMinor: 1_000_000n,
    deliveryMode: "PICKUP",
    standardShippingMinor: 150_000n,
    hasFreeDelivery: false,
    policy,
  });

  assert.equal(result.serviceFeeMinor, 120_000n);
  assert.equal(result.shippingMinor, 0n);
});

test("free-delivery membership applies to standard delivery, not Express", () => {
  const standard = calculateGroceryPricing({
    subtotalMinor: 1_000_000n,
    deliveryMode: "STANDARD",
    standardShippingMinor: 150_000n,
    hasFreeDelivery: true,
    policy,
  });

  const express = calculateGroceryPricing({
    subtotalMinor: 1_000_000n,
    deliveryMode: "EXPRESS",
    standardShippingMinor: 150_000n,
    hasFreeDelivery: true,
    policy,
  });

  assert.equal(standard.shippingMinor, 0n);
  assert.equal(express.shippingMinor, 100_000n);
});
