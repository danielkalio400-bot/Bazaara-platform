import Link from "next/link";
import { notFound } from "next/navigation";
import { FoodHeader } from "../../../components/food-header";
import { MenuItemCard } from "../../../components/menu-item-card";
import { FoodFavoriteButton } from "../../../components/food-favorite-button";
import { API_BASE, money, type FoodRestaurantDetail } from "../../../lib/food-api";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function clock(minute: number) {
  const hours = Math.floor(minute / 60) % 24;
  const mins = minute % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let detail: FoodRestaurantDetail | null = null;
  let reviews: {average:number;count:number;breakdown:Array<{rating:number;count:number}>;reviews:Array<{id:string;rating:number;text:string|null;photoCount:number;restaurantReply:string|null;createdAt:string}>}|null = null;

  try {
    const response = await fetch(`${API_BASE}/v1/food/restaurants/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.status === 404) notFound();
    if (response.ok) detail = await response.json();
    const reviewResponse = await fetch(`${API_BASE}/v1/food/restaurants/${encodeURIComponent(slug)}/reviews`, { cache: "no-store" });
    if (reviewResponse.ok) reviews = await reviewResponse.json();
  } catch {
    // The friendly unavailable state below keeps the web shell usable during local API restarts.
  }

  if (!detail) {
    return <div className="food-shell"><FoodHeader /><main className="food-error-page"><h1>Restaurant unavailable</h1><p>Check the Platform API and try again.</p></main></div>;
  }

  const restaurant = detail.restaurant;
  return (
    <div className="food-shell">
      <FoodHeader cartRestaurantSlug={slug} />
      <main>
        <section className="restaurant-hero">
          {restaurant.heroImageUrl ? <img src={restaurant.heroImageUrl} alt="" /> : <div />}
          <div className="restaurant-hero-overlay" />
          <div className="restaurant-hero-content">
            <span className={restaurant.isOpen ? "food-status-open" : "food-status-closed"}>{restaurant.isOpen ? "Open now" : restaurant.scheduledEnabled ? "Closed · scheduling available" : "Closed"}</span>
            <h1>{restaurant.name}</h1>
            <p>{restaurant.description}</p>
            <div className="restaurant-hero-meta">
              <span>★ {restaurant.rating.toFixed(1)} ({restaurant.ratingCount.toLocaleString()})</span>
              <span>{restaurant.cuisineTags.join(" · ")}</span>
              <span>{restaurant.etaMinutes.min}–{restaurant.etaMinutes.max} min</span>
              <span>{restaurant.deliveryFeeMinor ? `${money(restaurant.deliveryFeeMinor)} delivery` : "Free delivery"}</span>
            </div>
            <div className="restaurant-actions">
              <Link href={`/cart/${slug}`} className="food-primary">View basket</Link>
              <FoodFavoriteButton kind="restaurant" id={slug} />
              {restaurant.pickupEnabled ? <span>Pickup available</span> : null}
              {restaurant.scheduledEnabled ? <span>Schedule up to 7 days ahead</span> : null}
            </div>
          </div>
        </section>

        <section className="restaurant-info-strip" aria-label="Restaurant information">
          <div><small>Minimum order</small><strong>{money(restaurant.minimumOrderMinor)}</strong></div>
          <div><small>Service fee</small><strong>{(restaurant.serviceFeePolicy.rateBps / 100).toFixed(1)}% · {money(restaurant.serviceFeePolicy.minimumMinor)}–{money(restaurant.serviceFeePolicy.maximumMinor)}</strong></div>
          <details>
            <summary><small>Opening hours</small><strong>View weekly hours</strong></summary>
            <div className="hours-popover">
              {restaurant.openingHours.map((entry) => (
                <div key={entry.dayOfWeek}><span>{DAY_NAMES[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`}</span><b>{entry.closed ? "Closed" : `${clock(entry.openMinute)} – ${clock(entry.closeMinute)}`}</b></div>
              ))}
            </div>
          </details>
        </section>

        <div className="restaurant-layout">
          <aside className="menu-nav">
            <strong>Menu</strong>
            {detail.menu.map((section) => <a key={section.id} href={`#section-${section.slug}`}>{section.title}</a>)}
          </aside>
          <div className="menu-content">
            {detail.menu.map((section) => (
              <section key={section.id} id={`section-${section.slug}`} className="menu-section">
                <div><h2>{section.title}</h2>{section.description ? <p>{section.description}</p> : null}</div>
                <div className="menu-item-grid">{section.items.map((item) => <MenuItemCard key={item.id} item={item} restaurantSlug={slug} />)}</div>
              </section>
            ))}
          </div>
        </div>

        <section className="food-section restaurant-reviews" id="reviews">
          <div className="food-section-head"><div><span>REVIEWS</span><h2>What customers say</h2></div><strong>{reviews?.count ? `${reviews.average.toFixed(1)} / 5 · ${reviews.count} reviews` : "No reviews yet"}</strong></div>
          {reviews?.count ? <div className="reviews-layout"><div className="rating-breakdown">{reviews.breakdown.map((row)=><div key={row.rating}><span>{row.rating} ★</span><progress max={reviews.count} value={row.count}/><b>{row.count}</b></div>)}</div><div className="review-list">{reviews.reviews.slice(0,12).map((review)=><article key={review.id}><strong>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</strong><p>{review.text||"Rated without a written comment."}</p>{review.photoCount?<small>{review.photoCount} photo review {review.photoCount===1?"attachment":"attachments"} · private media is not exposed without a publication pipeline</small>:null}{review.restaurantReply?<blockquote><b>{restaurant.name}</b><p>{review.restaurantReply}</p></blockquote>:null}<time>{new Date(review.createdAt).toLocaleDateString()}</time></article>)}</div></div>:<div className="food-empty compact"><p>Completed orders can leave verified restaurant reviews here.</p></div>}
        </section>
      </main>
    </div>
  );
}
