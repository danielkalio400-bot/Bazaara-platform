import type { FastifyInstance } from "fastify";
import { audit } from "../audit.js";
import { AppError } from "../errors.js";
import { requireAuth } from "../auth.js";
import { nativeAuthorizeSchema, nativeRevokeSchema, nativeTokenSchema } from "./native-schemas.js";
import {
  exchangeNativeAuthorizationCode,
  issueNativeAuthorizationCode,
  refreshNativeSession,
  revokeNativeToken,
} from "./native-service.js";

export async function nativeIdentityRoutes(app: FastifyInstance) {
  app.post("/v1/bazid/oauth/authorize", { config: { rateLimit: { max: 30, timeWindow: "15 minutes" } } }, async (request) => {
    const auth = await requireAuth(request);
    if (auth.channel !== "WEB") {
      // Authorization is intentionally mediated through BazID's browser session.
      throw new AppError("UNAUTHENTICATED", "Browser BazID session required", 401);
    }
    const input = nativeAuthorizeSchema.parse(request.body);
    const code = await issueNativeAuthorizationCode({
      userId: auth.userId,
      clientId: input.clientId,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: input.codeChallengeMethod,
      scope: input.scope,
    });
    const redirect = new URL(input.redirectUri);
    redirect.searchParams.set("code", code);
    redirect.searchParams.set("state", input.state);
    await audit({ actorUserId: auth.userId, action: "bazid.native.authorize", resourceType: "NativeAuthorizationCode", requestId: request.id, ipAddress: request.ip, metadata: { clientId: input.clientId } });
    return { redirectUrl: redirect.toString() };
  });

  app.post("/v1/bazid/oauth/token", { config: { rateLimit: { max: 60, timeWindow: "15 minutes" } } }, async (request) => {
    const input = nativeTokenSchema.parse(request.body);
    if (input.grant_type === "authorization_code") {
      const tokens = await exchangeNativeAuthorizationCode({
        clientId: input.client_id,
        code: input.code,
        redirectUri: input.redirect_uri,
        codeVerifier: input.code_verifier,
        deviceId: input.device_id,
        deviceLabel: input.device_label,
        userAgent: request.headers["user-agent"],
      });
      return tokens;
    }
    return refreshNativeSession({ clientId: input.client_id, refreshToken: input.refresh_token });
  });

  app.post("/v1/bazid/oauth/revoke", async (request, reply) => {
    const input = nativeRevokeSchema.parse(request.body);
    await revokeNativeToken({ clientId: input.client_id, token: input.token });
    return reply.code(204).send();
  });
}
