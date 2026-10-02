import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, newOpaqueToken, sha256Base64Url } from "./index";

test("password hashes verify only the original secret", async () => {
  const hash = await hashPassword("Correct Horse Battery Staple 42!");
  assert.equal(await verifyPassword(hash, "Correct Horse Battery Staple 42!"), true);
  assert.equal(await verifyPassword(hash, "wrong"), false);
});

test("opaque tokens are not persisted directly", () => {
  const token = newOpaqueToken();
  const digest = sha256Base64Url(token);
  assert.notEqual(token, digest);
  assert.ok(token.length >= 40);
});
