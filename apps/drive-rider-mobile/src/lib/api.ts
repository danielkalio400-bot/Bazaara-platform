import { createApiClient } from "@bazaara/api-client";
import { API_BASE } from "./config";
import { clearTokens, getFreshAccessToken } from "./auth";
export const appApi = createApiClient({ baseUrl: API_BASE, credentials: "omit", getAccessToken: getFreshAccessToken, onUnauthorized: async () => { await clearTokens(); } });
