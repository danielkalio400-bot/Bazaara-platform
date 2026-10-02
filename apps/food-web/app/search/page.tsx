import { FoodSearchClient } from "../../components/food-search-client";
import { API_BASE, type FoodSearchResult } from "../../lib/food-api";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const cuisine = typeof params.cuisine === "string" ? params.cuisine : "";
  const openNow = params.openNow === "true";
  const fulfillment = params.fulfillment === "PICKUP" ? "PICKUP" : params.fulfillment === "DELIVERY" ? "DELIVERY" : "";

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (cuisine) query.set("cuisine", cuisine);
  if (openNow) query.set("openNow", "true");
  if (fulfillment) query.set("fulfillment", fulfillment);

  let result: FoodSearchResult = { restaurants: [], items: [] };
  try {
    const response = await fetch(`${API_BASE}/v1/food/search?${query}`, { cache: "no-store" });
    if (response.ok) result = await response.json();
  } catch {}

  return <FoodSearchClient initialResult={result} initialState={{ q, cuisine, openNow, fulfillment }} />;
}
