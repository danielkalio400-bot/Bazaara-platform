// Dependency-free primitives also used by Node regression tests.
export const DEFAULT_ORIGIN = 'http://localhost:3021';
export const DEFAULT_API = 'http://127.0.0.1:4000';

export function allowedMutationOrigin(request, expectedOrigin = DEFAULT_ORIGIN) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(expectedOrigin).origin && origin === new URL(expectedOrigin).origin; }
  catch { return false; }
}

export function validCredentials(body) {
  return body !== null && typeof body === 'object' && !Array.isArray(body)
    && typeof body.email === 'string' && body.email.length <= 320
    && /^\S+@\S+\.\S+$/.test(body.email)
    && typeof body.password === 'string' && body.password.length >= 1 && body.password.length <= 256;
}

export function safeUser(upstreamPayload) {
  const user = upstreamPayload?.user;
  if (!user || typeof user.id !== 'string' || !user.id) return null;
  return {
    id: user.id,
    displayName: typeof user.displayName === 'string' ? user.displayName.slice(0, 100) : '',
    verificationLevel: typeof user.verificationLevel === 'string' ? user.verificationLevel : 'UNKNOWN',
    locale: typeof user.locale === 'string' ? user.locale : undefined,
    email: Array.isArray(user.emails)
      ? (user.emails.find(e => e?.isPrimary)?.email ?? user.emails[0]?.email ?? null)
      : null,
  };
}

export function publicError(status) {
  return status === 401 || status === 403 ? 'Invalid credentials or session expired.'
    : status === 429 ? 'Too many attempts. Please wait and try again.'
    : 'The identity service is unavailable. Please try again.';
}
