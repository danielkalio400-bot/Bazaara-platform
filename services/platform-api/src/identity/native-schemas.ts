import { z } from "zod";

export const nativeAuthorizeSchema = z.object({
  clientId: z.string().trim().min(1).max(120),
  redirectUri: z.string().trim().min(1).max(500),
  responseType: z.literal("code").default("code"),
  codeChallenge: z.string().trim().min(43).max(128),
  codeChallengeMethod: z.literal("S256"),
  state: z.string().trim().min(8).max(300),
  scope: z.string().trim().max(300).default("openid profile"),
});

export const nativeTokenSchema = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("authorization_code"),
    client_id: z.string().min(1).max(120),
    code: z.string().min(16).max(300),
    redirect_uri: z.string().min(1).max(500),
    code_verifier: z.string().min(43).max(128),
    device_id: z.string().max(200).optional(),
    device_label: z.string().max(200).optional(),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    client_id: z.string().min(1).max(120),
    refresh_token: z.string().min(16).max(300),
  }),
]);

export const nativeRevokeSchema = z.object({
  token: z.string().min(16).max(300),
  client_id: z.string().min(1).max(120),
});
