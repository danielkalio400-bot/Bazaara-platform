import Link from "next/link";

import { GroceryBuyAgain } from "../components/grocery-buy-again";
import { ProductCard } from "../components/product-card";
import { ShoppingHeader } from "../components/shopping-header";
import { apiGet, type Category, type MoneyProduct } from "../lib/shopping";

export const dynamic = "force-dynamic";

type GroceryHome = {
  hero: { title: string; subtitle: string };
  categories: Category[];
  products: MoneyProduct[];
  stores: Array<{
    slug: string;
    name: string;
    verified: boolean;
    fulfillmentModes: string[];
    storeCount: number;
  }>;
};

function aisleMark(name: string) {
  const value = name.toLowerCase();
  if (value.includes("fruit") || value.includes("veget")) return "✦";
  if (value.includes("meat") || value.includes("fish")) return "◈";
  if (value.includes("drink") || value.includes("beverage")) return "◒";
  if (value.includes("dairy") || value.includes("milk")) return "◉";
  if (value.includes("home") || value.includes("house")) return "⌂";
  if (value.includes("baby")) return "●";
  return "◎";
}

export default async function GroceryHomePage() {
  let home: GroceryHome | null = null;

  try {
    home = await apiGet<GroceryHome>("/v1/grocery/home");
  } catch {
    home = null;
  }

  return (
    <div className="shop-shell grocery-shell grocery-home-v53">
      <ShoppingHeader />

      <main className="shop-main grocery-home-main-v53">
        <section className="grocery-home-hero-v53">
          <div className="grocery-home-hero-copy-v53">
            <div className="grocery-home-kicker-v53">
              <span>GROCERY</span>
              <small>fresh commerce · live branch inventory</small>
            </div>

            <h1>{home?.hero.title ?? "Fresh groceries. Less friction."}</h1>
            <p>
              {home?.hero.subtitle ??
                "Fresh food, pantry staples and household essentials with quantity-aware lists, live store availability and flexible delivery."}
            </p>

            <div className="grocery-home-actions-v53">
              <Link className="grocery-home-primary-v53" href="/search-results?vertical=GROCERY&sort=featured">
                Shop groceries <span>→</span>
              </Link>
              <Link className="grocery-home-secondary-v53" href="/lists">My lists</Link>
              <Link className="grocery-home-secondary-v53" href="/bazai?prompt=Plan%20my%20weekly%20groceries">Plan with BazAI</Link>
            </div>

            <div className="grocery-home-proof-v53">
              <span>✓ Branch inventory</span>
              <span>✓ Service fee configured between 10–15%</span>
              <span>✓ Express = 10% of basket · ₦1k–₦5k</span>
              <span>✓ Picker confirmation</span>
            </div>
          </div>

          <div className="grocery-home-command-v53">
            <div className="grocery-home-command-head-v53">
              <span>YOUR GROCERY SYSTEM</span>
              <strong>Plan → Basket → Picker → Delivery</strong>
              <small>The shop checks what it has. You control the final preference.</small>
            </div>

            <div className="grocery-home-command-grid-v53">
              <Link href="/lists"><b>☷</b><span><small>REPEAT SHOP</small><strong>Quantity-aware lists</strong><p>Set exact quantities, share with household members and reuse your staples.</p></span></Link>
              <Link href="/bazai?prompt=Plan%20my%20weekly%20groceries"><b>AI</b><span><small>PLAN</small><strong>Grocery intelligence</strong><p>Turn budgets, meals and restock needs into editable grocery plans.</p></span></Link>
              <Link href="/orders"><b>◎</b><span><small>FULFILMENT</small><strong>Picker-aware orders</strong><p>Track shelf checks, approved replacements, refunds and delivery progress.</p></span></Link>
              <Link href="/search-results?vertical=GROCERY"><b>⚡</b><span><small>DELIVERY</small><strong>Flexible fulfilment</strong><p>Standard, scheduled, pickup and Express where the branch supports it.</p></span></Link>
            </div>
          </div>
        </section>

        <section className="grocery-home-fee-ribbon-v53" aria-label="Grocery pricing and availability">
          <article><span>10–15%</span><div><small>SERVICE FEE</small><strong>Configured and shown at checkout</strong></div></article>
          <article><span>10%</span><div><small>EXPRESS</small><strong>₦1,000 minimum · ₦5,000 maximum</strong></div></article>
          <article><span>✓</span><div><small>STOCK</small><strong>Branch + picker checks</strong></div></article>
          <article><span>↺</span><div><small>SUBSTITUTIONS</small><strong>One order-level rule</strong></div></article>
        </section>

        {home?.categories.length ? (
          <section className="grocery-home-section-v53">
            <div className="grocery-home-section-head-v53">
              <div><span>SHOP BY AISLE</span><h2>Find the part of the basket you need.</h2></div>
              <Link href="/categories">All categories →</Link>
            </div>

            <div className="grocery-home-category-grid-v53">
              {home.categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  href={`/search-results?vertical=GROCERY&category=${encodeURIComponent(category.slug)}`}
                >
                  <b>{aisleMark(category.name)}</b>
                  <span><strong>{category.name}</strong><small>{category.description ?? "Explore this aisle"}</small></span>
                  <i>↗</i>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {home?.stores.length ? (
          <section className="grocery-home-section-v53">
            <div className="grocery-home-section-head-v53">
              <div><span>STORES</span><h2>Shop live Grocery sellers.</h2></div>
              <Link href="/search-results?vertical=GROCERY">Browse catalogue →</Link>
            </div>

            <div className="grocery-home-store-grid-v53">
              {home.stores.slice(0, 8).map((store) => (
                <Link key={store.slug} href={`/sellers/${store.slug}`}>
                  <b>{store.name.slice(0, 1).toUpperCase()}</b>
                  <span>
                    <small>{store.verified ? "VERIFIED GROCERY SELLER" : "GROCERY SELLER"}</small>
                    <strong>{store.name}</strong>
                    <em>{store.fulfillmentModes.join(" · ") || "STANDARD"} · {store.storeCount} {store.storeCount === 1 ? "branch" : "branches"}</em>
                  </span>
                  <i>↗</i>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <GroceryBuyAgain />

        <section className="grocery-home-section-v53">
          <div className="grocery-home-section-head-v53">
            <div><span>EVERYDAY</span><h2>Fresh essentials.</h2></div>
            <Link href="/search-results?vertical=GROCERY&sort=featured">See all →</Link>
          </div>

          {home?.products.length ? (
            <div className="shopping-grid bz-product-grid grocery-home-product-grid-v53">
              {home.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="shop-empty">
              <h2>Grocery catalogue unavailable</h2>
              <p>Products will appear when the live Grocery catalogue is available.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
