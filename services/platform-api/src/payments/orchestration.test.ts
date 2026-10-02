import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { canonicalWebhookPayload, paymentRetryAt, verifyCanonicalWebhook } from "./orchestration.js";

test("payment webhook verification accepts fresh valid signatures and rejects tampering", () => {
  const secret = "test-secret-1234567890";
  const timestamp = "1770000000";
  const body = canonicalWebhookPayload({ eventId: "evt_1", type: "payment.captured", paymentIntentId: "pi_1", amountMinor: 5000 });
  const signature = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
  const now = Number(timestamp) * 1000;
  assert.equal(verifyCanonicalWebhook({ rawBody: body, timestamp, signature, secret, now }), true);
  assert.equal(verifyCanonicalWebhook({ rawBody: `${body}x`, timestamp, signature, secret, now }), false);
});

test("payment webhook verification rejects replay-window violations", () => {
  const secret = "test-secret-1234567890";
  const timestamp = "1770000000";
  const body = canonicalWebhookPayload({ eventId: "evt_1" });
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  assert.equal(verifyCanonicalWebhook({ rawBody: body, timestamp, signature, secret, now: Number(timestamp) * 1000 + 6 * 60 * 1000 }), false);
});


test("payment retry schedule backs off and caps", () => {
  const start = new Date("2026-09-14T12:00:00.000Z");
  assert.equal(paymentRetryAt(1, start).toISOString(), "2026-09-14T12:01:00.000Z");
  assert.equal(paymentRetryAt(2, start).toISOString(), "2026-09-14T12:05:00.000Z");
  assert.equal(paymentRetryAt(99, start).toISOString(), "2026-09-14T18:00:00.000Z");
});
