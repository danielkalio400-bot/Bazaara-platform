import {
  NextRequest,
  NextResponse
} from "next/server";

export const dynamic =
  "force-dynamic";

const API =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:4000";

async function proxy(
  request: NextRequest,
  method:
    | "GET"
    | "PUT"
    | "DELETE"
) {
  const productId =
    request.nextUrl.searchParams.get(
      "productId"
    );

  if (
    method !== "GET" &&
    !productId
  ) {
    return NextResponse.json(
      {
        error: {
          message:
            "productId is required"
        }
      },
      {
        status: 400
      }
    );
  }

  const target =
    method === "GET"
      ? `${API}/v1/shopping/wishlist`
      : `${API}/v1/shopping/wishlist/${encodeURIComponent(productId ?? "")}`;

  try {
    const headers =
      new Headers();

    headers.set(
      "accept",
      "application/json"
    );

    const cookie =
      request.headers.get(
        "cookie"
      );

    if (cookie) {
      headers.set(
        "cookie",
        cookie
      );
    }

    // BAZAARA_LOCAL_WISHLIST_TRUST_V1
    // Forward a verified browser origin when this same-origin route proxies
    // cookie-authenticated mutations to the Platform API.
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
    let body: string | undefined;

    if (method === "PUT") {
      body = await request.text();
      headers.set("content-type", "application/json");
      if (!body) body = "{}";
    }

    const upstream =
      await fetch(
        target,
        {
          method,
          headers,
          body,
          cache:
            "no-store"
        }
      );

    const text =
      await upstream.text();

    return new NextResponse(
      text ||
      JSON.stringify({}),
      {
        status:
          upstream.status,
        headers: {
          "content-type":
            upstream.headers.get(
              "content-type"
            ) ??
            "application/json",
          "cache-control":
            "no-store"
        }
      }
    );
  }
  catch {
    return NextResponse.json(
      {
        error: {
          message:
            "Wishlist service is temporarily unavailable"
        }
      },
      {
        status: 502
      }
    );
  }
}

export async function GET(
  request: NextRequest
) {
  return proxy(
    request,
    "GET"
  );
}

export async function PUT(
  request: NextRequest
) {
  return proxy(
    request,
    "PUT"
  );
}

export async function DELETE(
  request: NextRequest
) {
  return proxy(
    request,
    "DELETE"
  );
}
