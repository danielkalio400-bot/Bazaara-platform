import type { ApiErrorCode } from "@bazaara/contracts";

export type PlatformApiErrorCode =
  | ApiErrorCode
  | "INVALID_CLIENT"
  | "INVALID_REDIRECT_URI"
  | "INVALID_GRANT"
  | "INVALID_SCOPE"
  | "CONFIGURATION_REQUIRED"
  | "PROVIDER_UNAVAILABLE"
  | "PRESCRIPTION_WORKFLOW_DISABLED"
  | "JURISDICTION_UNAVAILABLE"
  | "REGULATED_FEATURE_DISABLED"
  | "UPLOAD_NOT_FOUND"
  | "UPLOAD_SIZE_MISMATCH"
  | "HANDLE_TAKEN"
  | "INVALID_CONVERSATION"
  | "INVALID_CURSOR"
  | "MEMBER_UNAVAILABLE"
  | "MESSAGING_UNAVAILABLE"
  | "NONCE_REUSED"
  | "SELF_TARGET"
  | "SOCIAL_SCOPE_REQUIRED"
  | "TOPIC_EXISTS";

export class AppError extends Error {
  constructor(
    public readonly code: PlatformApiErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly fields?: Record<string, string[]>,
  ) { super(message); }
}
