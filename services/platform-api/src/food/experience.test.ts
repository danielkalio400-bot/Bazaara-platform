import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://bazaara-test@127.0.0.1:55433/bazaara_test";

const { classifyFoodPickupProximity, foodOrderTiming } = await import("./service.js");

const proximityRules = {
  pickupNearDistanceMeters: 500,
  pickupArrivalDistanceMeters: 100,
};

test("Food pickup proximity distinguishes near pickup from arrival", () => {
  assert.equal(classifyFoodPickupProximity(700, proximityRules), null);
  assert.equal(classifyFoodPickupProximity(500, proximityRules), "NEAR_PICKUP");
  assert.equal(classifyFoodPickupProximity(101, proximityRules), "NEAR_PICKUP");
  assert.equal(classifyFoodPickupProximity(100, proximityRules), "AT_PICKUP");
  assert.equal(classifyFoodPickupProximity(0, proximityRules), "AT_PICKUP");
});

test("Food order timing freezes at delivery and exposes phase durations", () => {
  const timing = foodOrderTiming({
    placedAt: new Date("2026-09-20T10:00:00.000Z"),
    courierAssignedAt: new Date("2026-09-20T10:05:00.000Z"),
    pickedUpAt: new Date("2026-09-20T10:15:00.000Z"),
    deliveredAt: new Date("2026-09-20T10:35:00.000Z"),
    cancelledAt: null,
    restaurant: { estimatedDeliveryMin: 25, estimatedDeliveryMax: 40 },
  }, new Date("2026-09-20T12:00:00.000Z"));

  assert.equal(timing.elapsedSeconds, 35 * 60);
  assert.equal(timing.elapsedMinutes, 35);
  assert.equal(timing.phases.orderToCourierAssignedSeconds, 5 * 60);
  assert.equal(timing.phases.courierAssignedToPickupSeconds, 10 * 60);
  assert.equal(timing.phases.pickupToDeliverySeconds, 20 * 60);
  assert.equal(timing.estimatedDeliveryMin, 25);
  assert.equal(timing.estimatedDeliveryMax, 40);
});
