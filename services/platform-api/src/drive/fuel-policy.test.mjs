import assert from "node:assert/strict";
import test from "node:test";
import { calculateFuelAdjustmentMinor, fuelPublicationStatus, DRIVE_FUEL_WEIGHT_BPS, DRIVE_MAX_FUEL_ADJUSTMENT_BPS } from "./fuel-policy.ts";

test("neutral fuel index leaves fares unchanged", () => {
  assert.equal(calculateFuelAdjustmentMinor(100000, 10000), 0);
});
test("new fuel index adjusts only fuel-exposed 30%", () => {
  assert.equal(DRIVE_FUEL_WEIGHT_BPS, 3000);
  assert.equal(calculateFuelAdjustmentMinor(100000, 11000), 3000);
  assert.equal(calculateFuelAdjustmentMinor(100000, 9000), -3000);
});
test("fuel price shocks cannot exceed commercial fare cap", () => {
  assert.equal(DRIVE_MAX_FUEL_ADJUSTMENT_BPS, 1200);
  assert.equal(calculateFuelAdjustmentMinor(100000, 30000), 12000);
  assert.equal(calculateFuelAdjustmentMinor(100000, 5000), -12000);
});
test("fuel publication requires evidence and different reviewer", () => {
  const now = new Date("2026-09-22T12:00:00Z");
  const example = { status: "ACTIVE", indexBps: 11200, source: "Example publication", effectiveFrom: now, metadata: { approvedByUserId: "reviewer-2", submittedByUserId: "reviewer-1", evidenceUrl: "https://example.org/reference" } };
  assert.equal(fuelPublicationStatus(example, now), "CURRENT");
  assert.equal(fuelPublicationStatus({ ...example, metadata: null }, now), "PENDING_VERIFICATION");
  assert.equal(fuelPublicationStatus({ ...example, metadata: { submittedByUserId: "same", approvedByUserId: "same", evidenceUrl: "https://example.org/reference" } }, now), "PENDING_VERIFICATION");
  assert.equal(fuelPublicationStatus({ ...example, status: "PENDING" }, now), "PENDING_VERIFICATION");
  assert.equal(fuelPublicationStatus({ ...example, effectiveFrom: new Date("2026-09-01T12:00:00Z") }, now), "STALE");
  assert.equal(fuelPublicationStatus({ ...example, effectiveFrom: new Date("2026-09-23T12:00:00Z") }, now), "STALE");
  assert.equal(fuelPublicationStatus(null, now), "UNAVAILABLE");
});
