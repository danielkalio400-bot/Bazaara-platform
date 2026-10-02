import Link from "next/link";
import type { FoodRestaurantSummaryContract } from "@bazaara/contracts";
import { money } from "../lib/food-api";

function distanceLabel(distanceMeters: number | null) {
  if (distanceMeters == null) return null;
  if (distanceMeters < 1000) return `${Math.max(100, Math.round(distanceMeters / 100) * 100)} m away`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters < 10_000 ? 1 : 0)} km away`;
}

export function RestaurantCard({ restaurant }: { restaurant: FoodRestaurantSummaryContract }) {
  const distance = distanceLabel(restaurant.distanceMeters);
  return (
    <Link href={`/restaurants/${restaurant.slug}`} className="restaurant-card restaurant-card-v2">
      <div className="restaurant-image-wrap">
        {restaurant.heroImageUrl ? <img src={restaurant.heroImageUrl} alt="" className="restaurant-image" /> : <div className="restaurant-image restaurant-image-placeholder" />}
        <span className={`restaurant-open ${restaurant.isOpen ? "is-open" : "is-closed"}`}>{restaurant.isOpen ? "Open" : "Closed"}</span>
        {distance ? <span className="restaurant-distance">{distance}</span> : null}
      </div>
      <div className="restaurant-body">
        <div className="restaurant-title-row"><h3>{restaurant.name}</h3><strong>★ {restaurant.rating.toFixed(1)}</strong></div>
        <p>{restaurant.cuisineTags.join(" · ")} · {"₦".repeat(Math.max(1, restaurant.priceBand))}</p>
        <div className="restaurant-meta restaurant-meta-v2">
          <span>{restaurant.etaMinutes.min}–{restaurant.etaMinutes.max} min</span>
          <span>{restaurant.deliveryFeeMinor === 0 ? "Free delivery" : `${money(restaurant.deliveryFeeMinor)} delivery`}</span>
          {distance ? <span className="restaurant-distance-mobile">{distance}</span> : null}
        </div>
      </div>
    </Link>
  );
}
