import { ApiError, createApiClient, type ApiRequestOptions } from "@bazaara/api-client";
import { API_BASE } from "./config";
import { clearTokens, getFreshAccessToken } from "./auth";
import { guestCartHeaders } from "./guest-cart";

const MOBILE_REQUEST_TIMEOUT_MS = 12_000;

async function mobileFetch(input: URL | RequestInfo, init: RequestInit = {}): Promise<Response> {
  const requestInit = init ?? {};
  const controller = new AbortController();
  const externalSignal = requestInit.signal;
  let externalAbort: (() => void) | undefined;

  if (externalSignal) {
    externalAbort = () => controller.abort();
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", externalAbort, { once: true });
  }

  const timer = setTimeout(() => controller.abort(), MOBILE_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...requestInit, signal: controller.signal });
  } catch (cause) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new Error("Bazaara service did not respond. Check the local API connection and try again.");
    }
    throw cause;
  } finally {
    clearTimeout(timer);
    if (externalSignal && externalAbort) externalSignal.removeEventListener("abort", externalAbort);
  }
}

const api = createApiClient({
  baseUrl: API_BASE,
  credentials: "omit",
  fetchImpl: mobileFetch,
  getAccessToken: getFreshAccessToken,
  onUnauthorized: async () => { await clearTokens(); },
});

export { ApiError };
export const publicApi = api;

export async function cartRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const guest = await guestCartHeaders();
  return api.request<T>(path, { ...options, headers: { ...guest, ...(options.headers as Record<string, string> | undefined) } });
}
