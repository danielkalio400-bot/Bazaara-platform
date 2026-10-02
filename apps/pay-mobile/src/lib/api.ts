import {createApiClient,ApiError} from "@bazaara/api-client";
import {API_BASE} from "./config";
import {clearTokens,getFreshAccessToken} from "./auth";
export{ApiError};
export const payApi=createApiClient({baseUrl:API_BASE,credentials:"omit",getAccessToken:getFreshAccessToken,onUnauthorized:async()=>{await clearTokens();}});
