const PLATFORM_API =
  process.env.API_BASE_URL ??
  "http://127.0.0.1:4000";

function copySetCookie(
  source: Headers,
  target: Headers
) {
  const extended =
    source as Headers & {
      getSetCookie?: () => string[];
    };

  const cookies =
    extended.getSetCookie?.();

  if (cookies && cookies.length > 0) {
    for (const cookie of cookies) {
      target.append("set-cookie", cookie);
    }
    return;
  }

  const cookie = source.get("set-cookie");

  if (cookie) {
    target.set("set-cookie", cookie);
  }
}

export async function proxyCartRequest(
  request: Request,
  platformPath: string
) {
  const method = request.method.toUpperCase();
  const headers = new Headers();

  headers.set("accept", "application/json");

  const cookie = request.headers.get("cookie");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  // BAZAARA_LOCAL_PROXY_TRUST_V1
  // This Next.js route is same-origin to the browser, but it forwards the
  // BazID cookie to the Platform API. Preserve the browser origin/referer
  // so the Platform API CSRF guard can verify the mutation.
  const browserOrigin =
    request.headers.get("origin") ??
    (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return null;
      }
    })();

  if (browserOrigin) {
    headers.set("origin", browserOrigin);
  }

  const browserReferer =
    request.headers.get("referer") ??
    (browserOrigin ? `${browserOrigin}/` : null);

  if (browserReferer) {
    headers.set("referer", browserReferer);
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }
  const incomingContentType =
    request.headers.get("content-type");

  if (incomingContentType) {
    headers.set(
      "content-type",
      incomingContentType
    );
  }

  let body: string | undefined;

  if (
    method !== "GET" &&
    method !== "HEAD"
  ) {
    const text = await request.text();

    body =
      text.length > 0
        ? text
        : "{}";

    if (!headers.has("content-type")) {
      headers.set(
        "content-type",
        "application/json"
      );
    }
  }

  try {
    const upstream =
      await fetch(
        `${PLATFORM_API}${platformPath}`,
        {
          method,
          headers,
          body,
          cache: "no-store",
          redirect: "manual"
        }
      );

    const responseHeaders =
      new Headers();

    const contentType =
      upstream.headers.get(
        "content-type"
      );

    if (contentType) {
      responseHeaders.set(
        "content-type",
        contentType
      );
    }

    responseHeaders.set(
      "cache-control",
      "no-store"
    );

    copySetCookie(
      upstream.headers,
      responseHeaders
    );

    const responseBody =
      await upstream.text();

    return new Response(
      responseBody,
      {
        status: upstream.status,
        headers: responseHeaders
      }
    );
  }
  catch {
    return Response.json(
      {
        error: {
          code:
            "PLATFORM_API_UNREACHABLE",
          message:
            "Grocery could not reach the Platform API."
        }
      },
      {
        status: 502
      }
    );
  }
}
