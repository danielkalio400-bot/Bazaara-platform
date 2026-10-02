import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

test("Paystack webhook verification uses HMAC-SHA512 over the exact raw body", async () => {
  // paystack.ts imports the validated platform environment. This unit test only
  // exercises the pure signature verifier, so provide the single required
  // environment value before dynamically importing the module. No DB connection
  // is opened by this test.
  process.env.DATABASE_URL ||= "postgresql://bazaara-test@127.0.0.1:55433/bazaara_test";

  const { verifyPaystackWebhookSignatureWithSecret } = await import("./paystack.js");
  const secret = "sk_test_bazaara_unit_secret";
  const raw = Buffer.from(JSON.stringify({ event: "charge.success", data: { reference: "BZ_123" } }));
  const signature = createHmac("sha512", secret).update(raw).digest("hex");

  assert.equal(verifyPaystackWebhookSignatureWithSecret(raw, signature, secret), true);
  assert.equal(verifyPaystackWebhookSignatureWithSecret(Buffer.concat([raw, Buffer.from(" ")]), signature, secret), false);
  assert.equal(verifyPaystackWebhookSignatureWithSecret(raw, "bad", secret), false);
});
