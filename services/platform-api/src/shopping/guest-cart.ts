import type { FastifyReply, FastifyRequest } from "fastify";
import { newOpaqueToken, sha256Base64Url } from "@bazaara/security";
import { env } from "../config.js";
import { resolveAuth } from "../auth.js";
import { claimGuestCart, type CartOwner } from "./service.js";

export const GUEST_CART_COOKIE_NAME = "bazaara_guest_cart";
export const GUEST_CART_HEADER_NAME = "x-bazaara-guest-cart-token";
const GUEST_CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function setGuestCartCookie(reply: FastifyReply, rawToken: string) {
  reply.setCookie(GUEST_CART_COOKIE_NAME, rawToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: GUEST_CART_MAX_AGE_SECONDS,
  });
}

function requestGuestToken(request: FastifyRequest) {
  return request.headers[GUEST_CART_HEADER_NAME]?.toString().trim() || request.cookies[GUEST_CART_COOKIE_NAME];
}

export function clearGuestCartCookie(reply: FastifyReply) {
  reply.clearCookie(GUEST_CART_COOKIE_NAME, { path: "/" });
}

export async function resolveCartOwner(request: FastifyRequest, reply: FastifyReply): Promise<CartOwner> {
  const auth = request.auth ?? await resolveAuth(request);
  const rawGuestToken = requestGuestToken(request);

  if (auth) {
    if (rawGuestToken) {
      const hash = sha256Base64Url(rawGuestToken);
      await claimGuestCart(auth.userId, hash, "SHOPPING");
      await claimGuestCart(auth.userId, hash, "GROCERY");
      if (request.cookies[GUEST_CART_COOKIE_NAME]) clearGuestCartCookie(reply);
    }
    return { userId: auth.userId };
  }

  if (rawGuestToken) return { guestTokenHash: sha256Base64Url(rawGuestToken) };

  const rawToken = newOpaqueToken();
  setGuestCartCookie(reply, rawToken);
  reply.header(GUEST_CART_HEADER_NAME, rawToken);
  return { guestTokenHash: sha256Base64Url(rawToken) };
}

export async function claimGuestCartForAuthenticatedUser(request: FastifyRequest, reply: FastifyReply, userId: string) {
  const rawGuestToken = requestGuestToken(request);
  if (!rawGuestToken) return;
  const hash = sha256Base64Url(rawGuestToken);
  await claimGuestCart(userId, hash, "SHOPPING");
  await claimGuestCart(userId, hash, "GROCERY");
  if (request.cookies[GUEST_CART_COOKIE_NAME]) clearGuestCartCookie(reply);
}
