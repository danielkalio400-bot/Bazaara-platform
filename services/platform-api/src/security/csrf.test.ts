import test from "node:test";
import assert from "node:assert/strict";
import { browserMutationOriginAllowed } from "./csrf.js";

const allowedOrigins = new Set(["http://localhost:3003", "https://shopping.bazaara.com"]);

test("cookie-authenticated browser mutations require a trusted origin or referer", () => {
  assert.equal(browserMutationOriginAllowed({ method: "POST", hasSessionCookie: true, origin: "https://evil.example", allowedOrigins }), false);
  assert.equal(browserMutationOriginAllowed({ method: "PATCH", hasSessionCookie: true, origin: "https://shopping.bazaara.com", allowedOrigins }), true);
  assert.equal(browserMutationOriginAllowed({ method: "DELETE", hasSessionCookie: true, referer: "http://localhost:3003/cart", allowedOrigins }), true);
});

test("bearer-token native clients are not subjected to browser CSRF origin checks", () => {
  assert.equal(browserMutationOriginAllowed({ method: "POST", hasSessionCookie: false, authorization: "Bearer native-token", origin: undefined, allowedOrigins }), true);
});
