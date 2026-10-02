import { getBazIdNativeClientById, isBazIdNativeRedirectUri } from "@bazaara/bazid-client";

function apiBase() {
  return (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

type OAuthRequest = {
  clientId: string;
  redirectUri: string;
  responseType: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  scope: string;
};

function getSetCookies(headers: Headers): string[] {
  const extended = headers as Headers & { getSetCookie?: () => string[] };
  const values = extended.getSetCookie?.() ?? [];
  if (values.length) return values;
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieHeaderFromSetCookies(setCookies: string[]) {
  return setCookies.map((value) => value.split(";", 1)[0]?.trim()).filter(Boolean).join("; ");
}

async function responseBody(response: Response) {
  return (await response.json().catch(() => null)) as { message?: unknown; error?: unknown; redirectUrl?: unknown } | null;
}

function errorMessage(body: Awaited<ReturnType<typeof responseBody>>, fallback: string) {
  if (body && typeof body.message === "string" && body.message.trim()) return body.message.trim();
  if (body?.error && typeof body.error === "object") {
    const nested = body.error as { message?: unknown };
    if (typeof nested.message === "string" && nested.message.trim()) return nested.message.trim();
  }
  if (body && typeof body.error === "string" && body.error.trim()) return body.error.trim();
  return fallback;
}

function parseOAuthReturnTo(raw: string): OAuthRequest | null {
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  const url = new URL(raw, "http://bazid.local");
  if (url.pathname !== "/bazid/authorize") return null;

  const clientId = url.searchParams.get("client_id") ?? "";
  const client = getBazIdNativeClientById(clientId);
  if (!client) return null;

  const request: OAuthRequest = {
    clientId,
    redirectUri: url.searchParams.get("redirect_uri") ?? "",
    responseType: url.searchParams.get("response_type") ?? "",
    codeChallenge: url.searchParams.get("code_challenge") ?? "",
    codeChallengeMethod: url.searchParams.get("code_challenge_method") ?? "",
    state: url.searchParams.get("state") ?? "",
    scope: url.searchParams.get("scope") ?? client.scope,
  };
  const allowedScopes = new Set(client.scope.split(/\s+/));
  const requestedScopes = request.scope.trim().split(/\s+/).filter(Boolean);
  const complete = request.responseType === "code" &&
    isBazIdNativeRedirectUri(request.clientId, request.redirectUri, process.env.NODE_ENV === "development") &&
    request.codeChallenge.length >= 43 && request.codeChallengeMethod.toUpperCase() === "S256" && request.state.length >= 8 &&
    requestedScopes.length > 0 && requestedScopes.every((scope) => allowedScopes.has(scope));
  return complete ? request : null;
}

function errorRedirect(request: Request, source: "authorize" | "register", returnTo: string, message: string) {
  const trimmed = message.replace(/\s+/g, " ").trim().slice(0, 300);
  let target: URL;
  if (source === "register") {
    target = new URL("/bazid/register", request.url);
    target.searchParams.set("returnTo", returnTo);
  } else {
    target = new URL(returnTo, request.url);
  }
  target.searchParams.set("flow_error", trimmed || "BazID request failed");
  return new Response(null, { status: 303, headers: { location: target.toString() } });
}

function redirectToClient(location: string, setCookies: string[]) {
  const headers = new Headers({ location });
  for (const value of setCookies) headers.append("set-cookie", value);
  return new Response(null, { status: 303, headers });
}

async function authorize(oauth: OAuthRequest, cookieHeader: string, browserOrigin?: string | null, browserReferer?: string | null): Promise<{ location?: string; error?: string }> {
  const response = await fetch(`${apiBase()}/v1/bazid/oauth/authorize`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieHeader, ...(browserOrigin ? { origin: browserOrigin } : {}), ...(browserReferer ? { referer: browserReferer } : {}) },
    body: JSON.stringify({ clientId: oauth.clientId, redirectUri: oauth.redirectUri, responseType: "code", codeChallenge: oauth.codeChallenge, codeChallengeMethod: "S256", state: oauth.state, scope: oauth.scope }),
    cache: "no-store",
    redirect: "manual",
  });
  const location = response.headers.get("location");
  if (response.status >= 300 && response.status < 400 && location) return { location };
  const body = await responseBody(response);
  if (response.ok && typeof body?.redirectUrl === "string" && body.redirectUrl) return { location: body.redirectUrl };
  return { error: errorMessage(body, `Could not authorize this Bazaara client (${response.status})`) };
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const action = String(form.get("flowAction") ?? "");
  const source = action === "register" ? "register" : "authorize";
  const returnTo = String(form.get("returnTo") ?? "");
  const oauth = parseOAuthReturnTo(returnTo);
  if (!oauth) return errorRedirect(request, source, returnTo || "/bazid/authorize", "The mobile authorization request is incomplete or unregistered. Reopen BazID from the requesting app.");

  let setCookies: string[] = [];
  let cookieHeader = request.headers.get("cookie") ?? "";
  const browserOrigin = request.headers.get("origin") ?? (() => { try { return new URL(request.url).origin; } catch { return null; } })();
  const browserReferer = request.headers.get("referer");

  if (action === "login" || action === "register") {
    const path = action === "register" ? "/v1/bazid/register/email" : "/v1/bazid/login/email";
    const payload = action === "register" ? { displayName: String(form.get("displayName") ?? "").trim(), email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") } : { email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") };
    const authResponse = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookieHeader ? { cookie: cookieHeader } : {}), ...(browserOrigin ? { origin: browserOrigin } : {}), ...(browserReferer ? { referer: browserReferer } : {}), ...(request.headers.get("user-agent") ? { "user-agent": request.headers.get("user-agent")! } : {}) },
      body: JSON.stringify(payload), cache: "no-store", redirect: "manual",
    });
    const authBody = await responseBody(authResponse);
    if (!authResponse.ok) return errorRedirect(request, source, returnTo, errorMessage(authBody, action === "register" ? `Account creation failed (${authResponse.status})` : `Could not sign in (${authResponse.status})`));
    setCookies = getSetCookies(authResponse.headers);
    const newCookieHeader = cookieHeaderFromSetCookies(setCookies);
    if (newCookieHeader) cookieHeader = newCookieHeader;
  }

  if (!cookieHeader) return errorRedirect(request, source, returnTo, "BazID session was not created. Please try again.");
  const result = await authorize(oauth, cookieHeader, browserOrigin, browserReferer);
  if (!result.location) return errorRedirect(request, source, returnTo, result.error ?? "Authorization failed");
  return redirectToClient(result.location, setCookies);
}
