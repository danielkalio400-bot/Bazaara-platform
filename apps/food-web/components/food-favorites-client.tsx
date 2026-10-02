"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import type { FoodMenuItemContract, FoodRestaurantSummaryContract } from "@bazaara/contracts";
import { BAZID_BASE, foodApi, money } from "../lib/food-api";
import { RestaurantCard } from "./restaurant-card";

interface FavouriteItem extends FoodMenuItemContract { restaurant: FoodRestaurantSummaryContract }

export function FoodFavoritesClient() {
  const [data, setData] = useState<{ restaurants: FoodRestaurantSummaryContract[]; items: FavouriteItem[] } | null>(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setData(await foodApi.get("/v1/food/favorites", { cache: "no-store" })); setError(""); }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) setNeedAuth(true); else setError(cause instanceof Error ? cause.message : "Could not load favourites"); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (needAuth) return <section className="checkout-auth-card"><span>BAZID</span><h1>Your favourites follow your account</h1><p>Sign in to see saved restaurants and dishes.</p><a className="food-primary" href={buildBazIdSignInUrl({ bazIdBaseUrl: BAZID_BASE, returnTo: typeof window === "undefined" ? "http://localhost:3007/favorites" : window.location.href })}>Continue with BazID</a></section>;
  if (!data) return <div className="food-loading">{error || "Loading favourites…"}</div>;
  return <div>
    <div className="checkout-title"><span>SAVED FOR LATER</span><h1>Favourites</h1><p>Keep your go-to restaurants and dishes one tap away.</p></div>
    {data.restaurants.length ? <section className="food-section flush"><div className="food-section-head"><div><span>RESTAURANTS</span><h2>Saved places</h2></div></div><div className="restaurant-grid">{data.restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div></section> : null}
    {data.items.length ? <section className="food-section flush"><div className="food-section-head"><div><span>DISHES</span><h2>Saved dishes</h2></div></div><div className="dish-strip wrap">{data.items.map((item) => <Link key={item.id} href={`/restaurants/${item.restaurant.slug}`} className="dish-card">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="dish-placeholder" />}<div><small>{item.restaurant.name}</small><h3>{item.name}</h3><strong>{money(item.priceMinor, item.currency)}</strong></div></Link>)}</div></section> : null}
    {!data.restaurants.length && !data.items.length ? <div className="food-empty"><h2>No favourites yet</h2><p>Use the heart button on restaurants and dishes you want to find quickly later.</p><Link className="food-primary" href="/">Explore Food</Link></div> : null}
    {error ? <p className="food-error" role="alert">{error}</p> : null}
  </div>;
}
