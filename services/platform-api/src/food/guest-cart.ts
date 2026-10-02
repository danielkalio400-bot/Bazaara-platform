import type { FastifyReply, FastifyRequest } from "fastify";
import { newOpaqueToken, sha256Base64Url } from "@bazaara/security";
import { resolveAuth } from "../auth.js";
import { env } from "../config.js";
import { claimGuestFoodCarts, type FoodCartOwner } from "./service.js";

export const FOOD_GUEST_CART_COOKIE_NAME = "bazaara_food_guest_cart";
export const FOOD_GUEST_CART_HEADER_NAME = "x-bazaara-food-guest-cart-token";
const FOOD_GUEST_CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function requestGuestToken(request: FastifyRequest) {
  return request.headers[FOOD_GUEST_CART_HEADER_NAME]?.toString().trim() || request.cookies[FOOD_GUEST_CART_COOKIE_NAME];
}

function setGuestCookie(reply: FastifyReply, token: string) {
  reply.setCookie(FOOD_GUEST_CART_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: FOOD_GUEST_CART_MAX_AGE_SECONDS,
  });
}

export function clearFoodGuestCookie(reply: FastifyReply) {
  reply.clearCookie(FOOD_GUEST_CART_COOKIE_NAME, { path: "/" });
}

export async function resolveFoodCartOwner(request: FastifyRequest, reply: FastifyReply): Promise<FoodCartOwner> {
  const auth = request.auth ?? await resolveAuth(request);
  const rawGuestToken = requestGuestToken(request);

  if (auth) {
    if (rawGuestToken) {
      await claimGuestFoodCarts(auth.userId, sha256Base64Url(rawGuestToken));
      if (request.cookies[FOOD_GUEST_CART_COOKIE_NAME]) clearFoodGuestCookie(reply);
    }
    return { userId: auth.userId };
  }

  if (rawGuestToken) return { guestTokenHash: sha256Base64Url(rawGuestToken) };

  const token = newOpaqueToken();
  setGuestCookie(reply, token);
  reply.header(FOOD_GUEST_CART_HEADER_NAME, token);
  return { guestTokenHash: sha256Base64Url(token) };
}

export async function claimFoodGuestCartsForUser(request: FastifyRequest, reply: FastifyReply, userId: string) {
  const rawGuestToken = requestGuestToken(request);
  if (!rawGuestToken) return;
  await claimGuestFoodCarts(userId, sha256Base64Url(rawGuestToken));
  if (request.cookies[FOOD_GUEST_CART_COOKIE_NAME]) clearFoodGuestCookie(reply);
}
