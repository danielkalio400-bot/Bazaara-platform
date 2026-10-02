"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ShoppingHeader } from "../../components/shopping-header";
import { ProductCard } from "../../components/product-card";
import { formatMoney, type MoneyProduct } from "../../lib/shopping";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
type Offer = MoneyProduct & { discountPercent: number; savingsMinor: number };
type Payload = {
  offers: Offer[];
  pagination: { page: number; limit: number; totalWithinScan: number; pagesWithinScan: number };
  scanned: number;
  moreRecentCandidatesExist: boolean;
  pricingNote: string;
};
type Category = { slug: string; name: string };
type RadarFilter = {
  minDiscountPercent: number; maxPriceMinor?: number; category: string;
  verifiedSeller: boolean; sort: "biggest_discount" | "lowest_price"; page: number;
};
const start: RadarFilter = { minDiscountPercent: 1, category: "", verifiedSeller: false, sort: "biggest_discount", page: 1 };

export function DealRadarClient() {
  const [filters, setFilters] = useState<RadarFilter>(start);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  function update(change: Partial<RadarFilter>) { setFilters((old) => ({ ...old, ...change, page: 1 })); }

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${API}/v1/shopping/categories`, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => r.ok ? r.json() as Promise<{ categories: Category[] }> : { categories: [] })
      .then((body) => setCategories(body.categories ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ minDiscountPercent: String(filters.minDiscountPercent), verifiedSeller: String(filters.verifiedSeller), sort: filters.sort, page: String(filters.page), limit: "12" });
    if (filters.maxPriceMinor !== undefined) query.set("maxPriceMinor", String(filters.maxPriceMinor));
    if (filters.category) query.set("category", filters.category);
    setLoading(true); setError("");
    void fetch(`${API}/v1/shopping/deals?${query}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load live offers. Check your connection and try again.");
        return response.json() as Promise<Payload>;
      })
      .then((body) => { setResult(body); setLoading(false); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setResult(null); setError(cause instanceof Error ? cause.message : "Deals temporarily unavailable."); setLoading(false);
      });
    return () => controller.abort();
  }, [filters, retry]);

  function applyBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = budgetDraft.replaceAll(",", "").trim();
    if (!value) { setBudgetError(""); update({ maxPriceMinor: undefined }); return; }
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000_000 || !Number.isSafeInteger(Math.round(amount * 100))) {
      setBudgetError("Enter a valid amount above ₦0 and no more than ₦10 billion."); return;
    }
    setBudgetError(""); update({ maxPriceMinor: Math.round(amount * 100) });
  }

  return <div className="shop-shell neon-shop v12-shop v13-radar"><ShoppingHeader />
    <main className="shop-main neon-shop-main v12-main v13-radar-main">
      <nav className="v13-breadcrumb" aria-label="Breadcrumb"><Link href="/">Shopping</Link><span>/</span><b>Deal Radar</b><Link href="/wishlist">♡ Wishlist ↗</Link></nav>
      <header className="v13-hero"><div className="v13-hero-copy"><span className="v13-kicker"><i /> LIVE CATALOGUE DISCOVERY</span><h1>Real offers.<br/><em>Sharper decisions.</em></h1><p>Browse advertised markdowns from active Shopping sellers. Fine-tune your budget, stock and verification preferences without invented timers or offers.</p><div className="v13-proof"><span>✓ Available stock</span><span>✓ Actual listing prices</span><span>✓ Seller transparency</span></div></div><div className="v13-hero-stat"><span>DEAL RADAR</span><strong>{result && !loading ? result.pagination.totalWithinScan : "—"}</strong><p>matching in-stock offers{result?.moreRecentCandidatesExist ? " in the recent scan" : ""}</p><small>Current seller-advertised discounts. No historical-price guarantee.</small></div></header>
      <div className="v13-radar-layout">
        <aside className="v13-filter-panel" aria-label="Filter current offers"><div className="v13-filter-heading"><small>YOUR SHOPPING SIGNAL</small><h2>Refine the radar.</h2><p>Every filter works against current catalogue records.</p></div>
          <fieldset><legend>Minimum advertised discount</legend><div className="v13-chips">{[1, 10, 25, 40, 60].map((percent) => <button key={percent} type="button" aria-pressed={filters.minDiscountPercent === percent} onClick={() => update({ minDiscountPercent: percent })}>{percent === 1 ? "All deals" : `${percent}%+`}</button>)}</div></fieldset>
          <fieldset><legend>Price ceiling</legend><form className="v13-budget" onSubmit={applyBudget}><label htmlFor="v13-budget">Your maximum (₦)</label><div><input id="v13-budget" type="text" inputMode="decimal" placeholder="e.g. 75,000" value={budgetDraft} onChange={(e) => setBudgetDraft(e.target.value)} aria-invalid={Boolean(budgetError)} /><button type="submit">Apply</button></div>{budgetError ? <small role="alert" className="v13-error">{budgetError}</small> : filters.maxPriceMinor !== undefined ? <small>Applied: {formatMoney(filters.maxPriceMinor, "NGN")} <button type="button" onClick={() => {setBudgetDraft("");update({maxPriceMinor:undefined});}}>Clear</button></small> : null}</form></fieldset>
          <fieldset><legend>Category</legend><select aria-label="Deal category" value={filters.category} onChange={(e) => update({ category: e.target.value })}><option value="">Every category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></fieldset>
          <label className="v13-verified"><input type="checkbox" checked={filters.verifiedSeller} onChange={(e) => update({ verifiedSeller: e.target.checked })} /><span><b>Verified sellers only</b><small>Require recorded merchant verification</small></span></label>
          <button className="v13-reset" type="button" onClick={() => {setFilters(start);setBudgetDraft("");setBudgetError("");}}>Reset all filters ↺</button>
          <p className="v13-filter-note">Advertised compare-at prices are supplied by merchants and are not independent historical price records.</p>
        </aside>
        <section className="v13-results" aria-label="Current Shopping deals"><div className="v13-result-heading"><div><small>CURRENT MARKETPLACE OFFERS</small><h2>Find your next deal.</h2><p aria-live="polite">{loading ? "Checking current listings…" : error ? "Live results unavailable" : `${result?.pagination.totalWithinScan ?? 0} matching offers in ${result?.scanned ?? 0} recent discounted listings`}</p></div><label>Sort by <select value={filters.sort} onChange={(e) => update({ sort: e.target.value as RadarFilter["sort"] })}><option value="biggest_discount">Biggest advertised discount</option><option value="lowest_price">Lowest current price</option></select></label></div>
          {loading ? <div className="v13-loading" role="status">Checking prices, stock and seller verification…</div> : error ? <div className="v13-message" role="alert"><h3>We couldn't load your offers.</h3><p>{error}</p><button onClick={() => setRetry((old) => old + 1)}>Try again</button></div> : result?.offers.length ? <><div className="v13-offer-grid">{result.offers.map((offer) => <div className="v13-offer" key={offer.id}><div className="v13-offer-detail"><span>SAVE {formatMoney(offer.savingsMinor, offer.currency)}</span><b>{offer.discountPercent}% off advertised compare price</b></div><ProductCard product={offer} /></div>)}</div><nav className="v13-pagination" aria-label="Deal results pages"><button type="button" disabled={filters.page <= 1} onClick={() => setFilters((old) => ({ ...old, page: old.page - 1 }))}>← Previous</button><span>Page {result.pagination.page} of {result.pagination.pagesWithinScan}</span><button type="button" disabled={filters.page >= result.pagination.pagesWithinScan} onClick={() => setFilters((old) => ({ ...old, page: old.page + 1 }))}>Next →</button></nav></> : <div className="v13-message"><h3>No matches in the recent discounted listings.</h3><p>Try a lower discount threshold, larger budget or a different category.</p><button type="button" onClick={() => {setFilters(start);setBudgetDraft("");}}>Show all deals</button><Link href="/search-results?vertical=SHOPPING&inStock=true">Explore the full catalogue ↗</Link></div>}
          {result && !loading ? <p className="v13-disclaimer">{result.pricingNote}{result.moreRecentCandidatesExist ? " Results reflect the 400 most recently updated discounted listings, not the entire catalogue." : ""}</p> : null}
        </section>
      </div>
    </main>
  </div>;
}
