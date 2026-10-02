"use client";

import { useEffect, useMemo, useState } from "react";
import { FoodHeader } from "./food-header";
import { RestaurantCard } from "./restaurant-card";
import { foodApi, money, type FoodSearchResult } from "../lib/food-api";
import { readFoodDiscoveryLocation, subscribeFoodDiscoveryLocation, type FoodDiscoveryLocation } from "./food-location";

type SearchState = { q: string; cuisine: string; openNow: boolean; fulfillment: "" | "DELIVERY" | "PICKUP" };
function buildQuery(state: SearchState, location: FoodDiscoveryLocation | null) {
  const query = new URLSearchParams();
  if (state.q) query.set("q", state.q);
  if (state.cuisine) query.set("cuisine", state.cuisine);
  if (state.openNow) query.set("openNow", "true");
  if (state.fulfillment) query.set("fulfillment", state.fulfillment);
  if (location) { query.set("latitude", String(location.latitude)); query.set("longitude", String(location.longitude)); }
  return query.toString();
}

export function FoodSearchClient({ initialResult, initialState }: { initialResult: FoodSearchResult; initialState: SearchState }) {
  const [result, setResult] = useState(initialResult);
  const [location, setLocation] = useState<FoodDiscoveryLocation | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    async function refresh(next: FoodDiscoveryLocation | null) {
      if (!active) return; setLocation(next);
      if (!next) { setResult(initialResult); return; }
      setLoading(true);
      try { const body = await foodApi.get<FoodSearchResult>(`/v1/food/search?${buildQuery(initialState, next)}`, { cache: "no-store" }); if (active) setResult(body); }
      catch {} finally { if (active) setLoading(false); }
    }
    void refresh(readFoodDiscoveryLocation());
    const unsubscribe = subscribeFoodDiscoveryLocation((next) => void refresh(next));
    return () => { active = false; unsubscribe(); };
  }, [initialResult, initialState]);

  const demand = useMemo(() => [...result.restaurants].sort((a,b) => b.ratingCount - a.ratingCount || b.rating-a.rating).slice(0,6), [result.restaurants]);
  const title = initialState.q ? `Results for “${initialState.q}”` : initialState.cuisine || "Discover Food";

  return <div className="food-shell food-discovery-shell">
    <FoodHeader showSearch={false}/>
    <main className="food-search-page food-search-page-v2 food-discover-page">
      <section className="food-search-panel food-search-panel-v2 food-discover-hero">
        <div className="food-search-heading"><div><span>DISCOVER</span><h1>{title}</h1></div><small>{location ? `Around ${location.label}` : "Set your location for nearby results"}</small></div>
        <form action="/search">
          {initialState.cuisine ? <input type="hidden" name="cuisine" value={initialState.cuisine}/> : null}
          <div className="food-search-input-row"><span aria-hidden="true">⌕</span><input autoFocus name="q" defaultValue={initialState.q} placeholder="Search food, restaurants or cuisines"/><button>Search</button></div>
          <div className="search-filter-row search-filter-chips">
            <label><input type="checkbox" name="openNow" value="true" defaultChecked={initialState.openNow}/> Open now</label>
            <label className={initialState.fulfillment === "DELIVERY" ? "active" : ""}><input type="radio" name="fulfillment" value="DELIVERY" defaultChecked={initialState.fulfillment === "DELIVERY"}/> Delivery</label>
            <label className={initialState.fulfillment === "PICKUP" ? "active" : ""}><input type="radio" name="fulfillment" value="PICKUP" defaultChecked={initialState.fulfillment === "PICKUP"}/> Pickup</label>
            <label className={!initialState.fulfillment ? "active" : ""}><input type="radio" name="fulfillment" value="" defaultChecked={!initialState.fulfillment}/> All</label>
          </div>
        </form>
        {loading ? <div className="food-search-updating">Updating results around your location…</div> : null}
      </section>

      {!initialState.q && demand.length ? <section className="food-section food-search-results-section food-demand-section"><div className="food-section-head compact-head"><div><span>TRENDING</span><h2>Most in demand</h2></div></div><div className="food-demand-grid">{demand.map((restaurant,index)=><div key={restaurant.id} className="food-demand-item"><b>{String(index+1).padStart(2,"0")}</b><RestaurantCard restaurant={restaurant}/></div>)}</div></section>:null}

      <section className="food-section food-search-results-section">
        <div className="food-section-head compact-head"><div><span>{location ? "NEAREST FIRST" : "RESTAURANTS"}</span><h2>{result.restaurants.length} places</h2></div></div>
        {result.restaurants.length ? <div className="restaurant-grid food-search-grid">{result.restaurants.map((restaurant)=><RestaurantCard key={restaurant.id} restaurant={restaurant}/>)}</div> : <div className="food-empty"><h2>No matches</h2><p>Try a broader cuisine, restaurant name or another delivery location.</p></div>}
      </section>

      {result.items.length ? <section className="food-section food-search-results-section"><div className="food-section-head compact-head"><div><span>DISHES</span><h2>Matching dishes</h2></div></div><div className="dish-strip food-dish-strip">{result.items.map((item)=><a key={item.id} href={`/restaurants/${item.restaurant.slug}`} className="dish-card">{item.imageUrl?<img src={item.imageUrl} alt=""/>:null}<div><small>{item.restaurant.name}</small><h3>{item.name}</h3><p>{item.description}</p><strong>{money(item.priceMinor,item.currency)}</strong></div></a>)}</div></section>:null}
    </main>
  </div>;
}
