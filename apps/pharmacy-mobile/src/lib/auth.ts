import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import {
  BAZID_NATIVE_CLIENTS,
  bazIdNativeDiscovery,
  buildBazIdRegisterUrl,
  type BazIdNativeTokenResponse,
} from "@bazaara/bazid-client";
import { API_BASE, BAZID_BASE } from "./config";

WebBrowser.maybeCompleteAuthSession();

const TOKENS_KEY = "bazaara.pharmacy.bazid.tokens";
const DEVICE_ID_KEY = "bazaara.pharmacy.device-id";
const PENDING_AUTH_KEY = "bazaara.pharmacy.bazid.pending-auth.v2";
const LEGACY_PENDING_AUTH_KEY = "bazaara.pharmacy.bazid.pending-auth";
const MAX_PENDING_AUTHORIZATIONS = 4;
const PENDING_AUTH_TTL_MS = 10 * 60 * 1000;
const AUTH_REQUEST_TIMEOUT_MS = 15_000;
const discovery = bazIdNativeDiscovery({ apiBaseUrl: API_BASE, bazIdBaseUrl: BAZID_BASE });

export const BAZAARA_PHARMACY_REDIRECT_URI = "bazaara-pharmacy://auth/callback";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope?: string;
};

type PendingAuthorization = {
  state: string;
  codeVerifier: string;
  deviceId: string;
  createdAt: number;
  returnTo: string;
};

export type BazIdAuthorizationResult =
  | { ok: true; returnTo: string }
  | { ok: false; reason: string };

async function fetchWithAuthTimeout(input: URL | RequestInfo, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...(init ?? {}), signal: controller.signal });
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new Error("BazID did not respond. Check the local BazID/API connection and try again.");
    }
    throw cause;
  } finally {
    clearTimeout(timer);
  }
}

export async function getNativeDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, next);
  return next;
}

async function saveRaw(input: BazIdNativeTokenResponse) {
  const stored: StoredTokens = {
    accessToken: input.access_token,
    refreshToken: input.refresh_token,
    expiresAt: Date.now() + input.expires_in * 1000,
    scope: input.scope,
  };
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(stored));
  return stored;
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
    return null;
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

function validPending(pending: Partial<PendingAuthorization>): pending is PendingAuthorization {
  return Boolean(
    pending.state &&
    pending.codeVerifier &&
    pending.deviceId &&
    pending.createdAt &&
    Date.now() - pending.createdAt <= PENDING_AUTH_TTL_MS
  );
}

async function loadPendingAuthorizations(): Promise<PendingAuthorization[]> {
  const raw = await SecureStore.getItemAsync(PENDING_AUTH_KEY);
  if (raw) {
    try {
      const decoded = JSON.parse(raw) as unknown;
      const entries = Array.isArray(decoded) ? decoded : [decoded];
      return entries.filter((entry): entry is PendingAuthorization =>
        typeof entry === "object" && entry !== null && validPending(entry as Partial<PendingAuthorization>)
      ).slice(-MAX_PENDING_AUTHORIZATIONS);
    } catch {
      await SecureStore.deleteItemAsync(PENDING_AUTH_KEY);
    }
  }

  // One-time migration from the v1 single-transaction key. Keeping this migration
  // avoids invalidating an authorization browser window that was already open
  // when the application bundle was upgraded.
  const legacy = await SecureStore.getItemAsync(LEGACY_PENDING_AUTH_KEY);
  if (!legacy) return [];
  try {
    const decoded = JSON.parse(legacy) as Partial<PendingAuthorization>;
    const entries = validPending(decoded) ? [decoded] : [];
    if (entries.length) await SecureStore.setItemAsync(PENDING_AUTH_KEY, JSON.stringify(entries));
    return entries;
  } catch {
    return [];
  } finally {
    await SecureStore.deleteItemAsync(LEGACY_PENDING_AUTH_KEY);
  }
}

async function savePendingAuthorization(pending: PendingAuthorization) {
  const existing = await loadPendingAuthorizations();
  const next = [...existing.filter((item) => item.state !== pending.state), pending]
    .filter(validPending)
    .slice(-MAX_PENDING_AUTHORIZATIONS);
  await SecureStore.setItemAsync(PENDING_AUTH_KEY, JSON.stringify(next));
}

async function removePendingAuthorization(state: string) {
  const existing = await loadPendingAuthorizations();
  const next = existing.filter((item) => item.state !== state);
  if (next.length) await SecureStore.setItemAsync(PENDING_AUTH_KEY, JSON.stringify(next));
  else await SecureStore.deleteItemAsync(PENDING_AUTH_KEY);
}

async function clearPendingAuthorization() {
  await Promise.all([
    SecureStore.deleteItemAsync(PENDING_AUTH_KEY),
    SecureStore.deleteItemAsync(LEGACY_PENDING_AUTH_KEY),
  ]);
}

const callbackCompletions = new Map<string, Promise<BazIdAuthorizationResult>>();

async function buildExactAuthorizationUrl(initializedUrl: string, request: AuthSession.AuthRequest) {
  if (!discovery.authorizationEndpoint) throw new Error("BazID authorization endpoint is unavailable");

  const initialized = new URL(initializedUrl);
  const codeChallenge = initialized.searchParams.get("code_challenge");
  const state = initialized.searchParams.get("state") || request.state;

  if (!codeChallenge || codeChallenge.length < 43) {
    throw new Error("BazID PKCE challenge was not generated");
  }
  if (!request.codeVerifier || request.codeVerifier.length < 43) {
    throw new Error("BazID PKCE verifier was not generated");
  }
  if (!state || state.length < 8) {
    throw new Error("BazID authorization state was not generated");
  }

  const deviceId = await getNativeDeviceId();
  const nonce = Crypto.randomUUID().replaceAll("-", "");
  const url = new URL(discovery.authorizationEndpoint);
  url.searchParams.set("client_id", BAZID_NATIVE_CLIENTS.pharmacy.clientId);
  url.searchParams.set("redirect_uri", BAZAARA_PHARMACY_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile pharmacy");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("device_id", deviceId);
  url.searchParams.set("device_label", "Pharmacy");

  return { url: url.toString(), state, deviceId };
}

async function exchangeBazIdCallback(callbackUrl: string): Promise<BazIdAuthorizationResult> {
  if (!discovery.tokenEndpoint) throw new Error("BazID token endpoint is unavailable");

  const callback = new URL(callbackUrl);
  const callbackError = callback.searchParams.get("error");
  const returnedState = callback.searchParams.get("state");
  if (callbackError) {
    if (returnedState) await removePendingAuthorization(returnedState);
    throw new Error(callback.searchParams.get("error_description") || callbackError);
  }

  const code = callback.searchParams.get("code");
  if (!code || !returnedState) {
    throw new Error("BazID returned an incomplete authorization response");
  }

  const pendingList = await loadPendingAuthorizations();
  const pending = pendingList.find((item) => item.state === returnedState);
  if (!pending) {
    const existing = await loadTokens();
    if (existing && existing.expiresAt > Date.now()) return { ok: true, returnTo: "/" };
    throw new Error("This BazID sign-in response is no longer current. Return to Account and try again.");
  }

  const response = await fetchWithAuthTimeout(discovery.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: BAZID_NATIVE_CLIENTS.pharmacy.clientId,
      code,
      redirect_uri: BAZAARA_PHARMACY_REDIRECT_URI,
      code_verifier: pending.codeVerifier,
      device_id: pending.deviceId,
      device_label: "Pharmacy",
    }).toString(),
  });

  const body = (await response.json().catch(() => null)) as
    | BazIdNativeTokenResponse
    | { error?: { message?: string } }
    | null;

  if (!response.ok || !body || !("access_token" in body)) {
    // A second Android deep-link delivery can race the browser-session completion.
    // If the first consumer already exchanged this one-time code successfully,
    // treat the duplicate callback as success instead of stranding the user.
    const existing = await loadTokens();
    if (existing && existing.expiresAt > Date.now()) {
      await removePendingAuthorization(returnedState);
      return { ok: true, returnTo: pending.returnTo || "/" };
    }
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      "BazID token exchange failed";
    throw new Error(message);
  }

  await saveRaw(body);
  await removePendingAuthorization(returnedState);
  return { ok: true, returnTo: pending.returnTo || "/" };
}

export async function completeBazIdCallback(callbackUrl: string): Promise<BazIdAuthorizationResult> {
  const callback = new URL(callbackUrl);
  const state = callback.searchParams.get("state") ?? callbackUrl;
  const existing = callbackCompletions.get(state);
  if (existing) return existing;
  const completion = exchangeBazIdCallback(callbackUrl).finally(() => callbackCompletions.delete(state));
  callbackCompletions.set(state, completion);
  return completion;
}

async function completeAuthorization(
  request: AuthSession.AuthRequest,
  exact: { url: string; state: string; deviceId: string },
  entryUrl: string,
  returnTo: string,
) {
  if (!request.codeVerifier) throw new Error("BazID PKCE verifier was not generated");

  await savePendingAuthorization({
    state: exact.state,
    codeVerifier: request.codeVerifier,
    deviceId: exact.deviceId,
    createdAt: Date.now(),
    returnTo,
  });

  const result = await WebBrowser.openAuthSessionAsync(entryUrl, BAZAARA_PHARMACY_REDIRECT_URI, {
    preferEphemeralSession: false,
  });

  if (result.type === "success" && "url" in result && result.url) {
    return completeBazIdCallback(result.url);
  }

  // On Android the custom-scheme callback can reopen the app while the browser
  // session reports dismiss/cancel. The /auth/callback route completes the same
  // persisted PKCE transaction, so do not destroy pending state here.
  return { ok: false as const, reason: result.type };
}

async function prepareAuthorization() {
  if (!discovery.authorizationEndpoint || !discovery.tokenEndpoint) {
    throw new Error("BazID native discovery is incomplete");
  }

  // Keep a small set of still-valid attempts. Android may deliver a custom-scheme
  // callback after the browser reports dismissal, so deleting all prior state here
  // can create false CSRF/state failures during legitimate overlapping callbacks.
  await loadPendingAuthorizations();

  const request = new AuthSession.AuthRequest({
    clientId: BAZID_NATIVE_CLIENTS.pharmacy.clientId,
    redirectUri: BAZAARA_PHARMACY_REDIRECT_URI,
    responseType: AuthSession.ResponseType.Code,
    scopes: ["openid", "profile", "pharmacy"],
    usePKCE: true,
  });

  const initializedUrl = await request.makeAuthUrlAsync(discovery);
  const exact = await buildExactAuthorizationUrl(initializedUrl, request);
  return { request, exact };
}

export async function signInWithBazId(returnTo = "/") {
  const { request, exact } = await prepareAuthorization();
  return completeAuthorization(request, exact, exact.url, returnTo);
}

export async function createBazIdAccount(returnTo = "/") {
  const { request, exact } = await prepareAuthorization();

  // BazID registration intentionally accepts only same-origin relative return paths.
  // Preserve the complete OAuth/PKCE authorization request while removing the
  // absolute BazID origin so register/page.tsx does not sanitize it to "/".
  const authorizeUrl = new URL(exact.url);
  const bazIdReturnTo = `${authorizeUrl.pathname}${authorizeUrl.search}${authorizeUrl.hash}`;

  const registerUrl = buildBazIdRegisterUrl({
    bazIdBaseUrl: BAZID_BASE,
    returnTo: bazIdReturnTo,
  });

  return completeAuthorization(request, exact, registerUrl, returnTo);
}

export async function getFreshAccessToken() {
  const stored = await loadTokens();
  if (!stored) return undefined;
  if (stored.expiresAt - Date.now() > 60_000) return stored.accessToken;

  if (!discovery.tokenEndpoint) {
    await clearTokens();
    return undefined;
  }

  const response = await fetchWithAuthTimeout(discovery.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: BAZID_NATIVE_CLIENTS.pharmacy.clientId,
      refresh_token: stored.refreshToken,
    }).toString(),
  });

  const body = (await response.json().catch(() => null)) as BazIdNativeTokenResponse | null;
  if (!response.ok || !body?.access_token) {
    await clearTokens();
    return undefined;
  }

  const next = await saveRaw(body);
  return next.accessToken;
}

export async function isSignedIn() {
  return Boolean(await getFreshAccessToken());
}

export async function signOutNative() {
  const stored = await loadTokens();
  if (stored && discovery.revocationEndpoint) {
    await fetchWithAuthTimeout(discovery.revocationEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: stored.refreshToken,
        client_id: BAZID_NATIVE_CLIENTS.pharmacy.clientId,
      }).toString(),
    }).catch(() => undefined);
  }
  await clearPendingAuthorization();
  await clearTokens();
}
