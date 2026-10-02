import type { FastifyInstance } from "fastify";
import { db } from "@bazaara/db";
import { requireAuth } from "../auth.js";
import { env } from "../config.js";
import { AppError } from "../errors.js";
import { oidcPublicJwk } from "./oidc.js";

export async function oidcRoutes(app: FastifyInstance) {
  app.get("/.well-known/openid-configuration", async () => {
    const issuer = env.BAZID_OIDC_ISSUER.replace(/\/$/, "");
    return {
      issuer,
      authorization_endpoint: env.BAZID_AUTHORIZATION_ENDPOINT,
      token_endpoint: `${issuer}/v1/bazid/oauth/token`,
      revocation_endpoint: `${issuer}/v1/bazid/oauth/revoke`,
      userinfo_endpoint: `${issuer}/v1/bazid/oidc/userinfo`,
      jwks_uri: `${issuer}/v1/bazid/oidc/jwks`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["openid", "profile", "email", "shopping", "grocery", "food", "logistics", "logistics.courier", "drive.rider", "drive.driver", "pay", "business", "pharmacy", "sport"],
    };
  });

  app.get("/v1/bazid/oidc/jwks", async () => ({ keys: [oidcPublicJwk()] }));

  app.get("/v1/bazid/oidc/userinfo", async (request) => {
    const auth = await requireAuth(request);
    if (auth.channel !== "NATIVE") throw new AppError("UNAUTHENTICATED", "Bearer token required", 401);
    if (!auth.scopes?.includes("openid")) throw new AppError("FORBIDDEN", "openid scope required", 403);
    const user = await db.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: { id: true, displayName: true, locale: true, verificationLevel: true, emails: { where: { isPrimary: true }, select: { email: true, verifiedAt: true }, take: 1 } },
    });
    const scopes = new Set(auth.scopes);
    return {
      sub: user.id,
      ...(scopes.has("profile") ? { name: user.displayName, locale: user.locale, bazid_verification_level: user.verificationLevel } : {}),
      ...(scopes.has("email") && user.emails[0] ? { email: user.emails[0].email, email_verified: Boolean(user.emails[0].verifiedAt) } : {}),
    };
  });
}
