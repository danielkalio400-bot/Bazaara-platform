const PLATFORM_API =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:4000";

export const dynamic = "force-dynamic";

function copySetCookie(source: Headers, target: Headers) {
  const extended = source as Headers & { getSetCookie?: () => string[] };
  const cookies = extended.getSetCookie?.();

  if (cookies && cookies.length > 0) {
    for (const cookie of cookies) target.append("set-cookie", cookie);
    return;
  }

  const cookie = source.get("set-cookie");
  if (cookie) target.set("set-cookie", cookie);
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const upstreamPath = `/${path.map(encodeURIComponent).join("/")}${incomingUrl.search}`;
  const method = request.method.toUpperCase();

  const headers = new Headers();
  headers.set("accept", request.headers.get("accept") ?? "application/json");

  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);

  const requestId = request.headers.get("x-request-id");
  if (requestId) headers.set("x-request-id", requestId);

  // The browser talks to this route same-origin. The upstream Platform API
  // still receives the actual Food web origin for CSRF validation.
  const browserOrigin =
    request.headers.get("origin") ??
    incomingUrl.origin;
  headers.set("origin", browserOrigin);

  const browserReferer =
    request.headers.get("referer") ??
    `${browserOrigin}/`;
  headers.set("referer", browserReferer);

  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);

  let body: string | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const text = await request.text();
    body = text.length ? text : "{}";
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
  }

  try {
    const upstream = await fetch(`${PLATFORM_API.replace(/\/$/, "")}${upstreamPath}`, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);

    const upstreamRequestId = upstream.headers.get("x-request-id");
    if (upstreamRequestId) responseHeaders.set("x-request-id", upstreamRequestId);

    responseHeaders.set("cache-control", "no-store");
    copySetCookie(upstream.headers, responseHeaders);

    const upstreamText = await upstream.text();

    // BAZAARA_FOOD_PROXY_ERROR_NORMALIZATION_V1
    if (!upstream.ok) {
      let parsed: any = null;
      try {
        parsed = upstreamText ? JSON.parse(upstreamText) : null;
      } catch {}

      const nested =
        parsed?.error && typeof parsed.error === "object"
          ? parsed.error
          : null;

      const message =
        nested?.message ??
        parsed?.message ??
        (typeof parsed?.error === "string" ? parsed.error : null) ??
        (upstreamText || null) ??
        `Bazaara API returned ${upstream.status}`;

      const code =
        nested?.code ??
        parsed?.code ??
        `HTTP_${upstream.status}`;

      const details =
        nested?.details ??
        parsed?.details;

      responseHeaders.set("content-type", "application/json; charset=utf-8");

      return new Response(
        JSON.stringify({ error: { code, message, details } }),
        {
          status: upstream.status,
          headers: responseHeaders,
        },
      );
    }

    return new Response(upstreamText, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (cause) {
    console.error("Food Platform API proxy failed", cause);
    return Response.json(
      {
        error: {
          code: "PLATFORM_API_UNREACHABLE",
          message: "Food could not reach the Platform API.",
        },
      },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;