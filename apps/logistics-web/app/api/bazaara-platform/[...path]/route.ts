const PLATFORM_API =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:4000";

export const dynamic = "force-dynamic";

function copySetCookie(source: Headers, target: Headers) {
  const extended = source as Headers & { getSetCookie?: () => string[] };
  const cookies = extended.getSetCookie?.();
  if (cookies?.length) {
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
  const incoming = new URL(request.url);
  const upstreamPath = `/${path.map(encodeURIComponent).join("/")}${incoming.search}`;
  const method = request.method.toUpperCase();

  const headers = new Headers();
  headers.set("accept", request.headers.get("accept") ?? "application/json");

  for (const name of ["cookie", "content-type", "authorization", "idempotency-key", "x-request-id", "user-agent"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const browserOrigin = request.headers.get("origin") ?? incoming.origin;
  headers.set("origin", browserOrigin);
  headers.set("referer", request.headers.get("referer") ?? `${browserOrigin}/`);

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
    responseHeaders.set("cache-control", "no-store");
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    const requestId = upstream.headers.get("x-request-id");
    if (requestId) responseHeaders.set("x-request-id", requestId);
    copySetCookie(upstream.headers, responseHeaders);

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (cause) {
    console.error("GO Platform API proxy failed", cause);
    return Response.json(
      {
        error: {
          code: "PLATFORM_API_UNREACHABLE",
          message: "GO could not reach the Platform API.",
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