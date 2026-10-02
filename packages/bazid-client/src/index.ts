import { ApiClient, createApiClient } from "@bazaara/api-client";

export const BAZID_NATIVE_CLIENTS = {
  shopping: { clientId: "bazaara-shopping-mobile", scheme: "bazaara-shopping", scope: "openid profile shopping", name: "Shopping" },
  grocery: { clientId: "bazaara-grocery-mobile", scheme: "bazaara-grocery", scope: "openid profile grocery", name: "Grocery" },
  food: { clientId: "bazaara-food-mobile", scheme: "bazaara-food", scope: "openid profile food", name: "Food" },
  logistics: { clientId: "bazaara-logistics-mobile", scheme: "bazaara-logistics", scope: "openid profile logistics", name: "Logistics" },
  courier: { clientId: "bazaara-logistics-courier-mobile", scheme: "bazaara-courier", scope: "openid profile logistics.courier", name: "GO" },
  driveRider: { clientId: "bazaara-drive-rider-mobile", scheme: "bazaara-drive", scope: "openid profile drive.rider", name: "Drive" },
  driveDriver: { clientId: "bazaara-drive-driver-mobile", scheme: "bazaara-drive-driver", scope: "openid profile drive.driver", name: "Drive Driver" },
  pay: { clientId: "bazaara-pay-mobile", scheme: "bazaara-pay", scope: "openid profile pay", name: "Wallet" },
  business: { clientId: "bazaara-business-mobile", scheme: "bazaara-business", scope: "openid profile business", name: "Business" },
  pharmacy: { clientId: "bazaara-pharmacy-mobile", scheme: "bazaara-pharmacy", scope: "openid profile pharmacy", name: "Pharmacy" },
  bazasport: { clientId: "bazaara-bazasport-mobile", scheme: "bazaara-sport", scope: "openid profile sport", name: "Bazasport" },
} as const;
export type BazIdNativeClientKey = keyof typeof BAZID_NATIVE_CLIENTS;
export const BAZID_SHOPPING_MOBILE_CLIENT_ID = BAZID_NATIVE_CLIENTS.shopping.clientId;

export type BazIdEmail = {
  email: string;
  verifiedAt: string | null;
  isPrimary: boolean;
};

export type BazIdUser = {
  id: string;
  displayName: string | null;
  locale?: string;
  verificationLevel: string;
  emails?: BazIdEmail[];
};

export type BazIdSession = {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  current: boolean;
};

export type BazIdNativeTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope?: string;
  id_token?: string;
};

export function buildBazIdSignInUrl(input: { bazIdBaseUrl: string; returnTo?: string }) {
  const base = input.bazIdBaseUrl.endsWith("/") ? input.bazIdBaseUrl.slice(0, -1) : input.bazIdBaseUrl;
  const url = new URL(`${base}/bazid/sign-in`);
  if (input.returnTo) url.searchParams.set("returnTo", input.returnTo);
  return url.toString();
}

export function buildBazIdRegisterUrl(input: { bazIdBaseUrl: string; returnTo?: string }) {
  const base = input.bazIdBaseUrl.endsWith("/") ? input.bazIdBaseUrl.slice(0, -1) : input.bazIdBaseUrl;
  const url = new URL(`${base}/bazid/register`);
  if (input.returnTo) url.searchParams.set("returnTo", input.returnTo);
  return url.toString();
}

export function bazIdNativeDiscovery(input: { apiBaseUrl: string; bazIdBaseUrl: string }) {
  const api = input.apiBaseUrl.replace(/\/$/, "");
  const bazid = input.bazIdBaseUrl.replace(/\/$/, "");
  return {
    authorizationEndpoint: `${bazid}/bazid/authorize`,
    tokenEndpoint: `${api}/v1/bazid/oauth/token`,
    revocationEndpoint: `${api}/v1/bazid/oauth/revoke`,
    userinfoEndpoint: `${api}/v1/bazid/oidc/userinfo`,
    discoveryEndpoint: `${api}/.well-known/openid-configuration`,
  };
}

export class BazIdWebClient {
  private readonly api: ApiClient;
  readonly bazIdBaseUrl: string;

  constructor(input: { apiBaseUrl: string; bazIdBaseUrl: string; fetchImpl?: typeof fetch }) {
    this.bazIdBaseUrl = input.bazIdBaseUrl;
    this.api = createApiClient({ baseUrl: input.apiBaseUrl, fetchImpl: input.fetchImpl, credentials: "include" });
  }

  me() { return this.api.get<{ user: BazIdUser }>("/v1/bazid/me"); }
  loginWithEmail(input: { email: string; password: string }) { return this.api.post<{ user: BazIdUser }>("/v1/bazid/login/email", input); }
  registerWithEmail(input: { email: string; password: string; displayName?: string }) { return this.api.post<{ user: BazIdUser }>("/v1/bazid/register/email", input); }
  async logout() { await this.api.post<void>("/v1/bazid/logout"); }
  sessions() { return this.api.get<{ sessions: BazIdSession[] }>("/v1/bazid/sessions"); }
  async revokeSession(sessionId: string) { await this.api.delete<void>(`/v1/bazid/sessions/${encodeURIComponent(sessionId)}`); }
  signInUrl(returnTo?: string) { return buildBazIdSignInUrl({ bazIdBaseUrl: this.bazIdBaseUrl, returnTo }); }
  registerUrl(returnTo?: string) { return buildBazIdRegisterUrl({ bazIdBaseUrl: this.bazIdBaseUrl, returnTo }); }
}

export function createBazIdWebClient(input: { apiBaseUrl: string; bazIdBaseUrl: string; fetchImpl?: typeof fetch }) {
  return new BazIdWebClient(input);
}

export function getBazIdNativeClient(key: BazIdNativeClientKey) {
  return BAZID_NATIVE_CLIENTS[key];
}

export function buildNativeRedirectUri(key: BazIdNativeClientKey) {
  return `${BAZID_NATIVE_CLIENTS[key].scheme}://auth/callback`;
}

export function getBazIdNativeClientById(clientId: string) {
  return Object.values(BAZID_NATIVE_CLIENTS).find((client) => client.clientId === clientId);
}

export function isBazIdNativeRedirectUri(clientId: string, redirectUri: string, allowExpoDevelopment = false) {
  const client = getBazIdNativeClientById(clientId);
  if (!client) return false;
  try {
    const url = new URL(redirectUri);
    if (url.protocol.toLowerCase() === `${client.scheme}:`) {
      const host = url.hostname.toLowerCase();
      const path = url.pathname.replace(/\/+$/, "") || "/";
      if ((host === "auth" && path === "/callback") || (!host && path === "/auth/callback")) return true;
    }
  } catch {
    return false;
  }

  return allowExpoDevelopment && /^exp:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2|(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.[^/]+)(?::\d+)?\/--\/auth\/callback(?:\?.*)?$/i.test(redirectUri);
}
