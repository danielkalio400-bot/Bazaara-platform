import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY = "bazaara.shopping.guest-cart-token";
export const GUEST_CART_HEADER = "x-bazaara-guest-cart-token";

export async function getGuestCartToken() {
  const existing = await SecureStore.getItemAsync(KEY);
  if (existing) return existing;
  const token = `${Crypto.randomUUID()}-${Crypto.randomUUID()}`;
  await SecureStore.setItemAsync(KEY, token);
  return token;
}

export async function guestCartHeaders() {
  return { [GUEST_CART_HEADER]: await getGuestCartToken() };
}

export async function clearGuestCartToken() {
  await SecureStore.deleteItemAsync(KEY);
}
