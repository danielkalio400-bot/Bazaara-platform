"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "../../components/product-card";
import { ShoppingHeader } from "../../components/shopping-header";
import type { MoneyProduct } from "../../lib/shopping";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

type Facet = { slug: string; name: string; count: number };
type SearchPayload = {
  products: MoneyProduct[];
  pagination: { page: number; limit: number; total: number; pages: number };
  facets: { brands: Facet[]; categories: Facet[]; sellers: Facet[]; materials: Facet[]; fulfillment: Facet[] };
  query: { original: string | null; effective: string | null; alternative: string | null; recovered: boolean };
};
type InitialParams = Record<string, string | undefined>;
type SortValue = "featured" | "newest" | "rating_desc" | "price_asc" | "price_desc";

const sorts: Array<{ value: SortValue; label: string }> = [
  { value: "featured", label: "Popularity" },
  { value: "newest", label: "New in" },
  { value: "rating_desc", label: "Best rating" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" }
];

function clean(params: InitialParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== "")) as Record<string, string>;
}

export function SearchResultsClient({ initialParams }: { initialParams: InitialParams }) {
  const [params, setParams] = useState<Record<string, string>>(() => ({ ...clean(initialParams), vertical: "GROCERY" }));
  const [payload, setPayload] = useState<SearchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popular, setPopular] = useState<Array<{ query: string; count: number }>>([]);
  const [recent, setRecent] = useState<Array<{ query: string }>>([]);

  const queryString = useMemo(() => {
    const out = new URLSearchParams({ ...params, vertical: "GROCERY" });
    if (!out.has("sort")) out.set("sort", "featured");
    if (!out.has("limit")) out.set("limit", "24");
    return out.toString();
  }, [params]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/v1/shopping/search?${queryString}`, { credentials: "include", cache: "no-store", signal });
      const body = await response.json().catch(() => null) as (SearchPayload & { error?: { message?: string } }) | null;
      if (!response.ok || !body) throw new Error(body?.error?.message ?? "Search is temporarily unavailable");
      if (!signal?.aborted) setPayload(body);
    } catch (cause) {
      if (signal?.aborted || (cause instanceof DOMException && cause.name === "AbortError")) return;
      setError(cause instanceof Error ? cause.message : "Search is temporarily unavailable");
      setPayload(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (params.q) return;
    const controller = new AbortController();
    void fetch(`${API}/v1/shopping/search/popular?limit=8`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.ok ? r.json() : { searches: [] })
      .then((body: { searches?: Array<{ query: string; count: number }> }) => { if (!controller.signal.aborted) setPopular(body.searches ?? []); })
      .catch((cause) => { if (!(cause instanceof DOMException && cause.name === "AbortError")) setPopular([]); });
    void fetch(`${API}/v1/shopping/search/recent?limit=8`, { cache: "no-store", credentials: "include", signal: controller.signal })
      .then((r) => r.ok ? r.json() : { searches: [] })
      .then((body: { searches?: Array<{ query: string }> }) => { if (!controller.signal.aborted) setRecent(body.searches ?? []); })
      .catch((cause) => { if (!(cause instanceof DOMException && cause.name === "AbortError")) setRecent([]); });
    return () => controller.abort();
  }, [params.q]);

  function navigate(next: Record<string, string>) {
    const normalized = { ...clean(next), vertical: "GROCERY" };
    setParams(normalized);
    const url = new URL(window.location.href);
    url.search = new URLSearchParams(normalized).toString();
    window.history.replaceState({}, "", url);
  }

  function setFilter(name: string, value: string) {
    navigate({ ...params, [name]: value, page: "1" });
  }

  function clearFilters() {
    navigate({ ...(params.q ? { q: params.q } : {}), vertical: "GROCERY" });
  }

  function selectChange(name: string) {
    return (event: ChangeEvent<HTMLSelectElement>) => setFilter(name, event.target.value);
  }

  const facets = payload?.facets;
  const total = payload?.pagination.total ?? 0;
  const page = payload?.pagination.page ?? Number(params.page ?? 1);
  const pages = payload?.pagination.pages ?? 1;

  return (
    <div className="shop-shell bz-search-results">
      <ShoppingHeader query={params.q ?? ""} />
      <main className="shop-main bz-search-results-main">
        <div className="bz-results-heading">
          <div>
            <span className="eyebrow">GROCERY</span>
            <h1>{params.q ? `Results for “${params.q}”` : "All groceries"}</h1>
            <p>{loading ? "Searching…" : `${total.toLocaleString()} product${total === 1 ? "" : "s"}`}</p>
          </div>
          <label className="bz-sort-control">
            <span>Sort</span>
            <select value={(params.sort ?? "featured") as SortValue} onChange={selectChange("sort")}>
              {sorts.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
            </select>
          </label>
        </div>

        {payload?.query.recovered && payload.query.alternative ? (
          <div className="bz-query-recovery">No exact matches for “{payload.query.original}”. Showing results for <strong>{payload.query.alternative}</strong>.</div>
        ) : null}

        {!params.q && (recent.length > 0 || popular.length > 0) ? (
          <section className="bz-search-discovery" aria-label="Search discovery">
            {recent.length ? <div><strong>Recent searches</strong><div>{recent.map((item) => <Link key={item.query} href={`/search-results?vertical=GROCERY&q=${encodeURIComponent(item.query)}`}>{item.query}</Link>)}</div></div> : null}
            {popular.length ? <div><strong>Popular searches</strong><div>{popular.map((item) => <Link key={item.query} href={`/search-results?vertical=GROCERY&q=${encodeURIComponent(item.query)}`}>{item.query}</Link>)}</div></div> : null}
          </section>
        ) : null}

        <div className="bz-results-layout">
          <aside className="bz-filter-panel" aria-label="Search filters">
            <div className="bz-filter-panel-head"><strong>Filters</strong><button type="button" onClick={clearFilters}>Clear</button></div>
            <label><span>Category</span><select value={params.category ?? ""} onChange={selectChange("category")}><option value="">All categories</option>{facets?.categories.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>)}</select></label>
            <label><span>Brand</span><select value={params.brand ?? ""} onChange={selectChange("brand")}><option value="">All brands</option>{facets?.brands.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>)}</select></label>
            <label><span>Seller</span><select value={params.seller ?? ""} onChange={selectChange("seller")}><option value="">All sellers</option>{facets?.sellers.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>)}</select></label>
            <label><span>Material</span><select value={params.material ?? ""} onChange={selectChange("material")}><option value="">All materials</option>{facets?.materials.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>)}</select></label>
            <label><span>Fulfillment</span><select value={params.fulfillment ?? ""} onChange={selectChange("fulfillment")}><option value="">Any method</option>{facets?.fulfillment.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>)}</select></label>
            <div className="bz-filter-two"><label><span>Min price (₦)</span><input inputMode="numeric" value={params.minPriceMinor ? String(Number(params.minPriceMinor) / 100) : ""} onBlur={(event) => setFilter("minPriceMinor", event.target.value ? String(Math.round(Number(event.target.value) * 100)) : "")} onChange={() => undefined} placeholder="0" /></label><label><span>Max price (₦)</span><input inputMode="numeric" defaultValue={params.maxPriceMinor ? String(Number(params.maxPriceMinor) / 100) : ""} onBlur={(event) => setFilter("maxPriceMinor", event.target.value ? String(Math.round(Number(event.target.value) * 100)) : "")} placeholder="Any" /></label></div>
            <label><span>Minimum discount</span><select value={params.minDiscountPercent ?? ""} onChange={selectChange("minDiscountPercent")}><option value="">Any discount</option><option value="10">10%+</option><option value="20">20%+</option><option value="30">30%+</option><option value="50">50%+</option></select></label>
            <label><span>Product rating</span><select value={params.minProductRating ?? ""} onChange={selectChange("minProductRating")}><option value="">Any rating</option><option value="4">4★ & up</option><option value="3">3★ & up</option><option value="2">2★ & up</option></select></label>
            <label><span>Seller score</span><select value={params.minSellerScore ?? ""} onChange={selectChange("minSellerScore")}><option value="">Any score</option><option value="90">90%+</option><option value="80">80%+</option><option value="70">70%+</option></select></label>
            <label className="bz-check"><input type="checkbox" checked={params.inStock === "true"} onChange={(event) => setFilter("inStock", event.target.checked ? "true" : "")} /><span>In stock only</span></label>
            <label className="bz-check"><input type="checkbox" checked={params.verifiedSeller === "true"} onChange={(event) => setFilter("verifiedSeller", event.target.checked ? "true" : "")} /><span>Verified sellers</span></label>
          </aside>

          <section className="bz-results-products" aria-live="polite">
            {loading ? <div className="shop-empty"><h2>Loading products…</h2><p>Applying your search and filters.</p></div> : null}
            {!loading && error ? <div className="shop-empty"><h2>Search could not load</h2><p>{error}</p><button type="button" className="primary-shop-button inline-button" onClick={() => void load()}>Try again</button></div> : null}
            {!loading && !error && payload?.products.length ? <div className="shopping-grid bz-product-grid bz-results-grid">{payload.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : null}
            {!loading && !error && payload && payload.products.length === 0 ? <div className="shop-empty"><h2>No matching products</h2><p>Try a broader search or remove one or more filters.</p><button type="button" className="primary-shop-button inline-button" onClick={clearFilters}>Clear filters</button></div> : null}
            {!loading && !error && total > 0 && pages > 1 ? <nav className="bz-pagination" aria-label="Search result pages"><button type="button" disabled={page <= 1} onClick={() => setFilter("page", String(page - 1))}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page >= pages} onClick={() => setFilter("page", String(page + 1))}>Next</button></nav> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
