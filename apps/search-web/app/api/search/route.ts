import { NextRequest, NextResponse } from "next/server";

const endpoint = process.env.BAZAARA_SEARCH_API || "http://127.0.0.1:4120";

export async function GET(req: NextRequest) {
  const source = new URL(req.url);
  const target = new URL("/v1/search", endpoint);
  for (const [key, value] of source.searchParams.entries()) target.searchParams.append(key, value);
  const response = await fetch(target, { cache: "no-store" });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
      "x-bazaara-search-source": "owned-index",
    },
  });
}

