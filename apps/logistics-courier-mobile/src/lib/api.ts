import { createApiClient } from "@bazaara/api-client";
import { getFreshAccessToken } from "./auth";
import { API_BASE } from "./config";

export const goApi = createApiClient({ baseUrl: API_BASE, credentials: "omit", getAccessToken: getFreshAccessToken, maxGetRetries: 1 });
