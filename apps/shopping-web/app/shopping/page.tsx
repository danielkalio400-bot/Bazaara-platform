import Link from "next/link";
import { ShoppingHeader } from "../../components/shopping-header";
import { SmartDiscoveryPanel } from "../../components/smart-discovery-panel";
import { RecentlyViewed } from "../../components/recently-viewed";
import { ProductCard } from "../../components/product-card";
import { apiGet, type MoneyProduct } from "../../lib/shopping";

export const dynamic = "force-dynamic";

type Category = { id?: string; name: string; slug: string };
type Home = {
  categories?: Category[];
  products?: MoneyProduct[];
  featured?: MoneyProduct[];
  deals?: MoneyProduct[];
  newArrivals?: MoneyProduct[];
};

const fallbackCategories: Category[] = [
  { name: "Phones & Tablets", slug: "phones-tablets" },
  { name: "Electronics", slug: "electronics" },
  { name: "Computing", slug: "computing" },
  { name: "Home & Kitchen", slug: "home-kitchens" },
  { name: "Fashion", slug: "fashion" },
  { name: "Beauty & Care", slug: "beauty-care" },
  { name: "Sports", slug: "sports-outdoors" },
  { name: "Baby & Kids", slug: "baby-kids" },
];
const categoryGlyphs = ["▣", "◫", "▤", "⌂", "◇", "✿", "◉", "☆"];

function CardGrid({ products }: { products: MoneyProduct[] }) {
  return <div className="shopping-grid v12-product-grid v14-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
function heading(eyebrow: string, title: string, subtitle: string, href: string, action: string) {
  return <div className="v12-section-title v14-section-title"><div><span>{eyebrow}</span><h2>{title}</h2><p>{subtitle}</p></div><Link href={href}>{action} <span aria-hidden="true">→</span></Link></div>;
}
function categoryHref(category: Category) {
  return `/search-results?${new URLSearchParams({ category: category.slug, vertical: "SHOPPING" })}`;
}

export default async function ShoppingHome({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const params = searchParams ? await searchParams : {};
  let home: Home = {};
  let offline = false;
  try { home = await apiGet<Home>("/v1/shopping/home"); } catch { offline = true; }
  const catalogue = Array.isArray(home.products) ? home.products : [];
  const featured = Array.isArray(home.featured) && home.featured.length ? home.featured : catalogue;
  const deals = Array.isArray(home.deals) ? home.deals : catalogue.filter(
    (item) => item.compareAtPriceMinor != null && item.compareAtPriceMinor > item.priceMinor,
  ).sort((a, b) =>
    (1 - b.priceMinor / b.compareAtPriceMinor!) - (1 - a.priceMinor / a.compareAtPriceMinor!),
  );
  const arrivals = Array.isArray(home.newArrivals) && home.newArrivals.length ? home.newArrivals : catalogue;
  const categories = Array.isArray(home.categories) && home.categories.length ? home.categories : fallbackCategories;
  const heroProduct = featured.find((item) => item.image?.url) ?? deals.find((item) => item.image?.url);
  const biggestDiscount = deals[0]?.compareAtPriceMinor
    ? Math.round((1 - deals[0].priceMinor / deals[0].compareAtPriceMinor) * 100) : 0;
  const recommended = catalogue.filter((item) => !featured.slice(0, 8).some((featuredItem) => featuredItem.id === item.id)).slice(0, 8);

  return <div className="shop-shell neon-shop v12-shop v14-retail">
    <ShoppingHeader query={params?.q ?? ""} />
    <main className="shop-main neon-shop-main v12-main v14-main">
      <div className="v12-market-bar v14-market-bar"><span><b>BAZAARA SHOPPING</b> · Everyday shopping made easier.</span><div><Link href="/orders">Track an order</Link><Link href="/support">Help & returns</Link></div></div>
      {offline ? <div className="v12-offline" role="alert">Marketplace API is unavailable. Product listings and current deals could not be loaded. <Link href="/support">Get help →</Link></div> : null}

      <section className="v14-hero-layout" aria-label="Shop BAZAARA">
        <nav className="v14-category-rail" aria-label="Popular shopping categories">
          <strong>Shop by category</strong>
          {categories.slice(0, 10).map((category, index) => <Link href={categoryHref(category)} key={category.id ?? category.slug}>
            <span aria-hidden="true">{categoryGlyphs[index % categoryGlyphs.length]}</span>{category.name}<b aria-hidden="true">›</b>
          </Link>)}
          <Link className="v14-all-categories" href="/categories">All categories <b aria-hidden="true">→</b></Link>
        </nav>
        <div className="v14-hero-primary">
          <div className="v14-hero-content">
            <span className="v14-hero-kicker">SHOP MORE OF WHAT YOU LOVE</span>
            <h1>Great finds.<br /><em>Everyday prices.</em></h1>
            <p>Discover electronics, fashion, home essentials and more from sellers on BAZAARA.</p>
            <div className="v14-hero-actions"><Link className="v14-primary-action" href="/search-results?sort=featured&vertical=SHOPPING">Start shopping →</Link><Link className="v14-quiet-action" href="/deals">Explore deals →</Link></div>
          </div>
          {heroProduct ? <Link className="v14-hero-product" href={`/products/${encodeURIComponent(heroProduct.slug)}`} aria-label={`View ${heroProduct.title}`}>
            <img src={heroProduct.image!.url} alt={heroProduct.image?.alt || heroProduct.title} /><span>{heroProduct.title}</span>
          </Link> : <div className="v14-hero-art" aria-hidden="true"><span>SHOP</span><b>BAZAARA.</b></div>}
        </div>
        <aside className="v14-hero-aside" aria-label="Shopping highlights">
          {deals.length ? <Link href="/deals" className="v14-deal-tile"><small>CURRENT OFFERS</small><strong>{biggestDiscount}% off</strong><span>on a featured listing</span><b>See available deals →</b></Link>
            : <Link href="/search-results?sort=newest&vertical=SHOPPING" className="v14-deal-tile"><small>JUST ARRIVED</small><strong>New finds</strong><span>Browse the latest active listings.</span><b>Shop new arrivals →</b></Link>}
          <Link href="/wishlist" className="v14-wishlist-tile"><small>YOUR FAVOURITES</small><strong>Spotted something?</strong><span>Save it to your wishlist and come back later.</span><b>Open wishlist →</b></Link>
        </aside>
      </section>

      <nav className="v14-mobile-categories" aria-label="Shopping categories">
        {categories.slice(0, 8).map((category, index) => <Link href={categoryHref(category)} key={category.id ?? category.slug}><span aria-hidden="true">{categoryGlyphs[index % categoryGlyphs.length]}</span><b>{category.name}</b></Link>)}
      </nav>

      <section className="v12-benefits v14-benefits" aria-label="Shopping shortcuts">
        <Link href="/deals"><span className="v12-benefit-glyph">%</span><span><b>Current deals</b><small>See available offers</small></span></Link>
        <Link href="/search-results?verifiedSeller=true&vertical=SHOPPING"><span className="v12-benefit-glyph">✓</span><span><b>Verified sellers</b><small>Shop with more context</small></span></Link>
        <Link href="/orders"><span className="v12-benefit-glyph">▣</span><span><b>My orders</b><small>View your order updates</small></span></Link>
        <Link href="/support"><span className="v12-benefit-glyph">?</span><span><b>Need help?</b><small>Shopping support</small></span></Link>
      </section>

      {deals.length > 0 ? <section className="v12-catalogue v14-section v14-deals-shelf" aria-label="Current deals">
        <div className="v14-deal-heading"><div><span>AVAILABLE NOW</span><h2>Deals you can shop</h2></div><Link href="/deals">See all deals →</Link></div>
        <CardGrid products={deals.slice(0, 8)} />
        <p className="v14-pricing-note">Displayed discounts compare current listed prices with sellers' compare-at prices, not verified historical prices.</p>
      </section> : null}

      <section className="v12-categories v14-section" aria-label="Browse categories">
        {heading("FIND YOUR FAVOURITES", "Popular categories", "Go straight to what you need.", "/categories", "View all")}
        <div className="v12-category-strip v14-category-strip">{categories.slice(0, 8).map((category, index) => <Link href={categoryHref(category)} key={category.id ?? category.slug}>
          <span aria-hidden="true">{categoryGlyphs[index % categoryGlyphs.length]}</span><b>{category.name}</b><small>Shop now →</small>
        </Link>)}</div>
      </section>

      {featured.length > 0 ? <section className="v12-catalogue v14-section">
        {heading("EXPLORE THE STORE", "Recommended to explore", "Active products featured by BAZAARA sellers.", "/search-results?sort=featured&vertical=SHOPPING", "Shop all")}
        <CardGrid products={featured.slice(0, 8)} />
      </section> : null}

      <section className="v14-smart-section" aria-label="Shopping search assistant"><div><small>SMART SHOPPING</small><h2>Tell us what you're looking for.</h2><p>Try a budget, product or seller preference. Smart Find converts your request into catalogue filters.</p></div><SmartDiscoveryPanel compact /></section>

      <section className="v12-smart-shelves v14-budget-shelves" aria-label="Shop your budget">
        <Link href="/search-results?maxPriceMinor=2500000&inStock=true&vertical=SHOPPING"><small>SHOP YOUR BUDGET</small><strong>Under ₦25k</strong><span>Browse essentials →</span></Link>
        <Link href="/search-results?maxPriceMinor=10000000&inStock=true&vertical=SHOPPING"><small>EVERYDAY VALUE</small><strong>Under ₦100k</strong><span>See current stock →</span></Link>
        <Link href="/search-results?verifiedSeller=true&inStock=true&vertical=SHOPPING"><small>FILTER YOUR WAY</small><strong>Verified sellers</strong><span>Explore listings →</span></Link>
        <Link href="/search-results?sort=newest&inStock=true&vertical=SHOPPING"><small>NEW ON BAZAARA</small><strong>Fresh arrivals</strong><span>View what’s new →</span></Link>
      </section>

      <section className="v12-editorial-row v14-editorial-row" aria-label="More ways to shop">
        <Link href="/bazlens" className="v12-editorial v12-visual"><small>BAZ LENS</small><h3>See it. Find it.</h3><p>Search with a photo to discover matching products.</p><b>Visual search →</b></Link>
        <Link href="/bazai" className="v12-editorial v12-assist"><small>BAZAI</small><h3>Need a second opinion?</h3><p>Explore products with your shopping assistant.</p><b>Ask BazAI →</b></Link>
        <Link href="/wishlist" className="v12-editorial v14-saved"><small>YOUR WISHLIST</small><h3>Save it for later.</h3><p>Keep your favourite finds in one place.</p><b>View saved products →</b></Link>
      </section>

      <RecentlyViewed />
      {arrivals.length > 0 ? <section className="v12-catalogue v14-section">
        {heading("FRESH PICKS", "Just added", "Recently listed active products.", "/search-results?sort=newest&vertical=SHOPPING", "View new arrivals")}
        <CardGrid products={arrivals.slice(0, 8)} />
      </section> : null}
      {recommended.length > 0 ? <section className="v12-catalogue v14-section">
        {heading("KEEP EXPLORING", "More products to discover", "More available products from the marketplace.", "/search-results?vertical=SHOPPING", "Shop more")}
        <CardGrid products={recommended} />
      </section> : null}
      {!offline && catalogue.length === 0 ? <section className="v12-empty v14-empty"><span>BAZAARA SHOPPING</span><h2>Products are coming soon.</h2><p>No active Shopping listings were returned by the API. Merchants can add products through BAZAARA Business.</p><Link href="/search-results">Explore catalogue →</Link></section> : null}
      <footer className="v12-shop-footer v14-footer"><b>BAZAARA SHOPPING</b><span>Shop, save and track your orders.</span><nav><Link href="/support">Support</Link><Link href="/orders">Orders</Link><Link href="/wishlist">Wishlist</Link></nav></footer>
    </main>
  </div>;
}
