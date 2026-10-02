import Link from "next/link";
import { FoodLocationControl } from "./food-location-control";

export function FoodHeader({ cartRestaurantSlug, showSearch = true }: { cartRestaurantSlug?: string; showSearch?: boolean }) {
  return (
    <header className="food-header">
      <div className={`food-header-inner ${showSearch ? "" : "food-header-inner-no-search"}`}>
        <Link href="/" className="food-brand" aria-label="Food home">
          <span className="food-brand-main">BAZAARA</span><span className="food-brand-dot">.</span><span className="food-brand-sub">FOOD</span>
        </Link>
        <FoodLocationControl />
        {showSearch ? (
          <form action="/search" className="food-global-search">
            <span aria-hidden="true">⌕</span>
            <input name="q" placeholder="Search food, restaurants or cuisines" aria-label="Search Food" />
          </form>
        ) : null}
        <nav className="food-header-actions" aria-label="Food navigation">
          <Link href="/deals">Deals</Link>
          <Link href="/favorites">Saved</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/support">Support</Link>
          <Link href={cartRestaurantSlug ? `/cart/${cartRestaurantSlug}` : "/search"}>Basket</Link>
          <Link href="/account">Profile</Link>
        </nav>
      </div>
    </header>
  );
}
