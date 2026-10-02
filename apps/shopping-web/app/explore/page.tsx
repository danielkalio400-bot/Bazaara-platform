import Link from "next/link";
import { ShoppingHeader } from "../../components/shopping-header";
import { apiGet, type Category } from "../../lib/shopping";

export const dynamic = "force-dynamic";

type CategoryResponse = { categories: Category[] };
type PopularResponse = { searches: Array<{ query: string; count: number }> };

export default async function ExplorePage() {
  let categories: Category[] = [];
  let popular: PopularResponse["searches"] = [];
  try { categories = (await apiGet<CategoryResponse>("/v1/shopping/categories")).categories; } catch { categories = []; }
  try { popular = (await apiGet<PopularResponse>("/v1/shopping/search/popular?limit=10")).searches; } catch { popular = []; }
  return <div className="shop-shell"><ShoppingHeader /><main className="shop-main bz-explore-page">
    <section className="bz-explore-hero"><span>GO · EXPLORE</span><h1>Discover across Bazaara.</h1><p>Use universal search to move between products, grocery stores and the commerce experiences GO adds over time.</p><div className="bz-explore-actions"><Link href="/search-results?vertical=SHOPPING" className="bz-go-service"><b>Marketplace</b><small>Products & stores</small></Link><Link href="/grocery" className="bz-go-service"><b>Grocery</b><small>Fresh & pantry</small></Link><Link href="/bazai" className="bz-go-service"><b>GO AI</b><small>Shop by intent</small></Link></div></section>
    {popular.length ? <section className="bz-home-section"><div className="bz-section-heading"><div><span>DISCOVERY</span><h2>Trending searches</h2></div></div><div className="bz-explore-chips">{popular.map((item) => <Link key={item.query} href={`/search-results?q=${encodeURIComponent(item.query)}`}>{item.query}</Link>)}</div></section> : null}
    <section className="bz-home-section"><div className="bz-section-heading"><div><span>BROWSE</span><h2>Categories</h2></div></div><div className="bz-category-grid">{categories.slice(0, 12).map((category) => <Link key={category.id} href={`/search-results?category=${encodeURIComponent(category.slug)}`} className="bz-category-card"><span className="bz-category-icon">◆</span><span>{category.name}</span></Link>)}</div></section>
  </main></div>;
}
