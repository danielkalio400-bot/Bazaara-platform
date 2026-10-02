import test from "node:test";
import assert from "node:assert/strict";
import { returnEligibilityDeadline } from "./returns.js";

test("return eligibility uses a fixed fourteen-day delivery window", () => {
  const deliveredAt = new Date("2026-09-01T10:00:00.000Z");
  assert.equal(returnEligibilityDeadline(deliveredAt).toISOString(), "2026-09-15T10:00:00.000Z");
});
