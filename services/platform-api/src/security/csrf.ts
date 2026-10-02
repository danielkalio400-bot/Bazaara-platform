export function browserMutationOriginAllowed(input: {
  method: string;
  authorization?: string;
  hasSessionCookie: boolean;
  origin?: string;
  referer?: string;
  allowedOrigins: ReadonlySet<string>;
}) {
  if (["GET", "HEAD", "OPTIONS"].includes(input.method.toUpperCase())) return true;
  if (input.authorization?.toLowerCase().startsWith("bearer ")) return true;
  if (!input.hasSessionCookie) return true;
  if (input.origin && input.allowedOrigins.has(input.origin)) return true;
  if (input.referer) {
    try { return input.allowedOrigins.has(new URL(input.referer).origin); } catch { return false; }
  }
  return false;
}
