"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "../lib/shopping";

type ViewedProduct = {
  slug: string;
  title: string;
  imageUrl: string | null;
  currency: string;
  priceMinor: number;
};
const KEY = "bazaara-shopping-recent-v1";

function valid(record: unknown): record is ViewedProduct {
  if (!record || typeof record !== "object") return false;
  const item = record as Record<string, unknown>;
  return typeof item.slug === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(item.slug)
    && typeof item.title === "string" && item.title.length < 241
    && typeof item.priceMinor === "number" && Number.isSafeInteger(item.priceMinor) && item.priceMinor >= 0
    && typeof item.currency === "string" && /^[A-Z]{3}$/.test(item.currency)
    && (item.imageUrl === null || typeof item.imageUrl === "string" && /^https?:\/\//.test(item.imageUrl));
}

function read(): ViewedProduct[] {
  try {
    const rows: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(rows) ? rows.filter(valid).slice(0, 6) : [];
  } catch { return []; }
}

/** Tracks a product only in local browser storage. No silent server history. */
export function TrackRecentlyViewed({ product }: { product: ViewedProduct }) {
  useEffect(() => {
    if (!valid(product)) return;
    try {
      const next = [product, ...read().filter((item) => item.slug !== product.slug)].slice(0, 6);
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* Storage can be disabled; shopping still works. */ }
  }, [product.slug, product.title, product.priceMinor, product.currency, product.imageUrl]);
  return null;
}

export function RecentlyViewed() {
  const [products, setProducts] = useState<ViewedProduct[]>([]);
  useEffect(() => { setProducts(read()); }, []);
  if (!products.length) return null;
  return (
    <section className="v12-recent" aria-label="Recently viewed products">
      <div className="v12-section-title"><div><span>YOUR SHORTLIST</span><h2>Jump back in.</h2><p>Recently viewed on this device only.</p></div>
        <button type="button" onClick={() => {
          try { window.localStorage.removeItem(KEY); } catch { /* Ignore. */ }
          setProducts([]);
        }}>Clear history</button>
      </div>
      <div className="v12-recent-items">
        {products.map((product) => (
          <Link href={`/products/${encodeURIComponent(product.slug)}`} key={product.slug} className="v12-recent-card">
            {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <div className="v12-recent-no-image">SHOPPING</div>}
            <span><strong>{product.title}</strong><small>{formatMoney(product.priceMinor, product.currency)}</small></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
