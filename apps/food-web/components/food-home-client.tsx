"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { FoodHeader } from "./food-header";
import { RestaurantCard } from "./restaurant-card";
import { foodApi, money, type FoodHome, type FoodOrder } from "../lib/food-api";
import {
  foodDiscoveryQuery,
  readFoodDiscoveryLocation,
  subscribeFoodDiscoveryLocation,
  type FoodDiscoveryLocation,
} from "./food-location";

type Recommendations = { reorder: FoodOrder[] };

export function FoodHomeClient({ initialHome }: { initialHome: FoodHome | null }) {
  const [home, setHome] = useState<FoodHome | null>(initialHome);
  const [location, setLocation] = useState<FoodDiscoveryLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [reorder, setReorder] = useState<FoodOrder[]>([]);

  useEffect(() => {
    let active = true;
    async function applyLocation(next: FoodDiscoveryLocation | null) {
      if (!active) return;
      setLocation(next);
      if (!next) {
        setHome(initialHome);
        return;
      }
      setLocationLoading(true);
      try {
        const query = foodDiscoveryQuery(next);
        const body = await foodApi.get<FoodHome>(`/v1/food/home?${query}`, { cache: "no-store" });
        if (active) setHome(body);
      } catch {
        // Keep the last useful discovery result if location refresh fails.
      } finally {
        if (active) setLocationLoading(false);
      }
    }

    void applyLocation(readFoodDiscoveryLocation());
    const unsubscribe = subscribeFoodDiscoveryLocation((next) => void applyLocation(next));
    void foodApi.get<Recommendations>("/v1/food/recommendations", { cache: "no-store" }).then((body) => {
      if (active) setReorder(body.reorder ?? []);
    }).catch((error) => {
      if (!(error instanceof ApiError && error.status === 401)) console.debug("Food recommendations unavailable");
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [initialHome]);

  const restaurants = home?.restaurants ?? [];
  const mostInDemand = useMemo(
    () => [...restaurants].sort((a, b) => (b.ratingCount * Math.max(1, b.rating)) - (a.ratingCount * Math.max(1, a.rating)) || a.etaMinutes.min - b.etaMinutes.min).slice(0, 6),
    [restaurants],
  );
  const fast = useMemo(
    () => [...restaurants].sort((a, b) => a.etaMinutes.min - b.etaMinutes.min || (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (b.distanceMeters ?? Number.MAX_SAFE_INTEGER)).slice(0, 6),
    [restaurants],
  );

  return (
    <div className="food-shell food-discovery-shell">
      <FoodHeader />
      <main>
        <section className="food-luxe-intro">
          <div>
            <span>{location ? "DELIVERING AROUND YOU" : "GOOD FOOD · GREATER MOMENTS"}</span>
            <h1>{location ? `Food near ${location.label}` : "Find your next favourite meal."}</h1>
            <p>{locationLoading ? "Updating restaurants around your location…" : location?.detail || "Set your delivery location and Food will rank restaurants around you."}</p>
          </div>
          <div className="food-luxe-pulse" aria-label="Food discovery status"><b>{restaurants.length}</b><span>places ready to explore</span></div>
        </section>

        <section className="food-section food-quick-section food-mobile-tight-section">
          <div className="food-quick-nav food-glovo-chips food-luxe-filters">
            <Link href="/search?openNow=true"><span>01</span><b>Open now</b><small>Ready to order</small></Link>
            <Link href="/search?fulfillment=DELIVERY"><span>02</span><b>Delivery</b><small>To your door</small></Link>
            <Link href="/search?fulfillment=PICKUP"><span>03</span><b>Pickup</b><small>Collect yourself</small></Link>
            <Link href="/deals"><span>04</span><b>Promotions</b><small>Save today</small></Link>
            <Link href="/favorites"><span>05</span><b>Saved</b><small>Your favourites</small></Link>
          </div>
        </section>

        {home?.cuisines.length ? (
          <section className="food-section food-mobile-tight-section">
            <div className="food-section-head compact-head"><div><span>EXPLORE</span><h2>What are you craving?</h2></div><Link href="/search">See all</Link></div>
            <div className="cuisine-strip food-category-strip food-category-bubbles">
              {home.cuisines.slice(0, 12).map((cuisine, index) => (
                <Link key={cuisine.name} href={`/search?cuisine=${encodeURIComponent(cuisine.name)}`}>
                  <i aria-hidden="true">{["◎","◒","◇","△","✦","◉"][index % 6]}</i>
                  <b>{cuisine.name}</b><small>{cuisine.count} nearby</small>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {reorder.length ? (
          <section className="food-section food-mobile-tight-section">
            <div className="food-section-head compact-head"><div><span>ONE TAP AWAY</span><h2>Order again</h2></div><Link href="/orders">History</Link></div>
            <div className="food-reorder-rail">
              {reorder.slice(0, 5).map((order) => (
                <Link href={`/orders/${order.id}`} key={order.id}>
                  <div><small>{new Date(order.placedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</small><b>{order.restaurant.name}</b></div>
                  <p>{order.items.slice(0, 2).map((item) => `${item.quantity}× ${item.name}`).join(" · ")}</p>
                  <strong>{money(order.totalMinor, order.currency)}</strong>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="food-section food-mobile-tight-section">
          <div className="food-section-head compact-head">
            <div><span>{location ? "NEAREST FIRST" : "DISCOVER"}</span><h2>{location ? "Restaurants near you" : "Restaurants to try"}</h2></div>
            <Link href="/search">See all</Link>
          </div>
          {restaurants.length ? (
            <div className="restaurant-grid food-nearby-grid">{restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div>
          ) : (
            <div className="food-empty"><h2>No restaurants available here yet</h2><p>Try another delivery location or search again shortly.</p></div>
          )}
        </section>

        {mostInDemand.length ? (
          <section className="food-section food-mobile-tight-section">
            <div className="food-section-head compact-head"><div><span>TRENDING</span><h2>Most in demand</h2></div><Link href="/search">Discover</Link></div>
            <div className="restaurant-grid restaurant-grid-four food-compact-grid">{mostInDemand.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div>
          </section>
        ) : null}

        {fast.length ? (
          <section className="food-section food-mobile-tight-section">
            <div className="food-section-head compact-head"><div><span>FAST PICKS</span><h2>Quick delivery</h2></div><Link href="/search?openNow=true&fulfillment=DELIVERY">More</Link></div>
            <div className="restaurant-grid restaurant-grid-four food-compact-grid">{fast.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div>
          </section>
        ) : null}

        {home?.featuredItems.length ? (
          <section className="food-section food-mobile-tight-section">
            <div className="food-section-head compact-head"><div><span>DISHES</span><h2>Popular right now</h2></div></div>
            <div className="dish-strip food-dish-strip">
              {home.featuredItems.map((item) => (
                <Link key={item.id} href={`/restaurants/${item.restaurant.slug}`} className="dish-card">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}
                  <div><small>{item.restaurant.name}</small><h3>{item.name}</h3><strong>{money(item.priceMinor, item.currency)}</strong></div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
