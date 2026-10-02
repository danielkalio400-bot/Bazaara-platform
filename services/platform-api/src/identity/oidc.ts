import { createPublicKey, generateKeyPairSync, sign } from "node:crypto";
import { db } from "@bazaara/db";
import { env } from "../config.js";
import { AppError } from "../errors.js";

let developmentKey: { privateKey: string; publicJwk: JsonWebKey } | undefined;

function decodeConfiguredPrivateKey() {
  if (!env.BAZID_OIDC_SIGNING_PRIVATE_KEY_BASE64) return undefined;
  try {
    return Buffer.from(env.BAZID_OIDC_SIGNING_PRIVATE_KEY_BASE64, "base64").toString("utf8");
  } catch {
    throw new AppError("CONFIGURATION_REQUIRED", "BazID OIDC signing key is invalid", 503);
  }
}

function signingMaterial() {
  const configured = decodeConfiguredPrivateKey();
  if (configured) {
    try {
      const publicJwk = createPublicKey(configured).export({ format: "jwk" }) as JsonWebKey;
      return { privateKey: configured, publicJwk };
    } catch {
      throw new AppError("CONFIGURATION_REQUIRED", "BazID OIDC signing key cannot be parsed", 503);
    }
  }

  if (env.NODE_ENV === "production") {
    throw new AppError("CONFIGURATION_REQUIRED", "Production BazID OIDC requires BAZID_OIDC_SIGNING_PRIVATE_KEY_BASE64", 503);
  }

  if (!developmentKey) {
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    developmentKey = {
      privateKey: pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
      publicJwk: pair.publicKey.export({ format: "jwk" }) as JsonWebKey,
    };
  }
  return developmentKey;
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function oidcPublicJwk() {
  const { publicJwk } = signingMaterial();
  return {
    ...publicJwk,
    kid: env.BAZID_OIDC_KEY_ID,
    use: "sig",
    alg: "RS256",
  };
}

export async function issueOidcIdToken(input: {
  userId: string;
  clientId: string;
  scope: string;
}) {
  if (!input.scope.split(/\s+/).includes("openid")) return undefined;
  const { privateKey } = signingMaterial();
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      displayName: true,
      locale: true,
      verificationLevel: true,
      emails: { where: { isPrimary: true }, select: { email: true, verifiedAt: true }, take: 1 },
    },
  });
  if (!user) throw new AppError("INVALID_GRANT", "BazID user no longer exists", 400);

  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    iss: env.BAZID_OIDC_ISSUER.replace(/\/$/, ""),
    sub: user.id,
    aud: input.clientId,
    iat: now,
    exp: now + 15 * 60,
    auth_time: now,
    bazid_verification_level: user.verificationLevel,
  };
  const scopes = new Set(input.scope.split(/\s+/));
  if (scopes.has("profile")) {
    payload.name = user.displayName;
    payload.locale = user.locale;
  }
  if (scopes.has("email") && user.emails[0]) {
    payload.email = user.emails[0].email;
    payload.email_verified = Boolean(user.emails[0].verifiedAt);
  }

  const header = base64UrlJson({ alg: "RS256", typ: "JWT", kid: env.BAZID_OIDC_KEY_ID });
  const body = base64UrlJson(payload);
  const signingInput = `${header}.${body}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

