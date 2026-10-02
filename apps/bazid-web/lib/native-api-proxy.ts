function apiBase() {
  return (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

export async function proxyBazId(request: Request, path: string) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const userAgent = request.headers.get("user-agent");
  const origin =
    request.headers.get("origin") ??
    (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return null;
      }
    })();
  const referer = request.headers.get("referer");
  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);
  if (userAgent) headers.set("user-agent", userAgent);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstream = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);

  const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  if (setCookies.length) {
    for (const value of setCookies) responseHeaders.append("set-cookie", value);
  } else {
    const singleCookie = upstream.headers.get("set-cookie");
    if (singleCookie) responseHeaders.append("set-cookie", singleCookie);
  }

  return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}
