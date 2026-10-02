import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:4000";

const TRUSTED_GROCERY_ORIGIN = (
  process.env.GROCERY_WEB_BASE_URL ??
  process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL ??
  "http://localhost:3006"
).replace(/\/$/, "");

function mutationIsSameOrigin(request: NextRequest) {
  const expected = request.nextUrl.origin.replace(/\/$/, "");
  const origin = request.headers.get("origin")?.replace(/\/$/, "");

  if (origin) {
    return origin === expected;
  }

  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    return new URL(referer).origin.replace(/\/$/, "") === expected;
  } catch {
    return false;
  }
}

async function proxy(
  request: NextRequest,
  method: "GET" | "PUT" | "DELETE",
) {
  const productId = request.nextUrl.searchParams.get("productId");

  if (method !== "GET" && !mutationIsSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: "Wishlist request origin is not trusted" } },
      { status: 403 },
    );
  }

  if (method !== "GET" && !productId) {
    return NextResponse.json(
      { error: { message: "productId is required" } },
      { status: 400 },
    );
  }

  const target =
    method === "GET"
      ? `${API}/v1/shopping/wishlist?vertical=GROCERY`
      : `${API}/v1/shopping/wishlist/${encodeURIComponent(productId ?? "")}?vertical=GROCERY`;

  try {
    const headers = new Headers();
    headers.set("accept", "application/json");

    const cookie = request.headers.get("cookie");
    if (cookie) headers.set("cookie", cookie);

    /*
     * This Next route already verified the browser mutation is same-origin.
     * Present the configured Grocery web origin to the Platform API so LAN /
     * device access does not fail the API's cookie CSRF allow-list.
     */
    headers.set("origin", TRUSTED_GROCERY_ORIGIN);
    headers.set("referer", `${TRUSTED_GROCERY_ORIGIN}/`);

    const userAgent = request.headers.get("user-agent");
    if (userAgent) headers.set("user-agent", userAgent);

    let body: string | undefined;

    if (method === "PUT") {
      body = await request.text();
      headers.set("content-type", "application/json");
      if (!body) body = "{}";
    }

    const upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const text = await upstream.text();

    return new NextResponse(text || JSON.stringify({}), {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Wishlist service is temporarily unavailable" } },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export async function PUT(request: NextRequest) {
  return proxy(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return proxy(request, "DELETE");
}
