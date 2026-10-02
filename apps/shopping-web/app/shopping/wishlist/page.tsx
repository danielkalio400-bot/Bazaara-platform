"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { ShoppingHeader } from "../../../components/shopping-header";
import { formatMoney, type MoneyProduct } from "../../../lib/shopping";

const BAZID = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
const WISHLIST_API = "/api/bazaara-wishlist";
const CART_API = "/api/bazaara-cart/items";

type WishlistResponse = { products?: MoneyProduct[]; count?: number; error?: { message?: string } };
type SortKey = "recent" | "price-low" | "price-high" | "changes";

export default function WishlistPage() {
  const [products, setProducts] = useState<MoneyProduct[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [stockOnly, setStockOnly] = useState(false);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(WISHLIST_API, { credentials: "include", cache: "no-store" });
      if (response.status === 401) { setNeedsLogin(true); setProducts([]); return; }
      const body = await response.json().catch(() => null) as WishlistResponse | null;
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not load wishlist");
      setNeedsLogin(false);
      setProducts(body?.products ?? []);
    } catch (cause) {
      setProducts([]);
      setError(cause instanceof Error ? cause.message : "Could not load wishlist");
    }
  }, []);

  useEffect(() => {
    function onUpdate() { void refresh(); }
    void refresh();
    window.addEventListener("bazaara:wishlist-updated", onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => { window.removeEventListener("bazaara:wishlist-updated", onUpdate); window.removeEventListener("focus", onUpdate); };
  }, [refresh]);

  const visible = useMemo(() => {
    const list = stockOnly ? (products ?? []).filter((product) => product.wishlist?.available !== false) : [...(products ?? [])];
    return list.sort((a, b) => {
      const aPrice = a.wishlist?.selectedVariant?.priceMinor ?? a.priceMinor;
      const bPrice = b.wishlist?.selectedVariant?.priceMinor ?? b.priceMinor;
      if (sort === "price-low") return aPrice - bPrice;
      if (sort === "price-high") return bPrice - aPrice;
      if (sort === "changes") return Number(Boolean(b.wishlist?.priceChanged)) - Number(Boolean(a.wishlist?.priceChanged));
      return new Date(b.wishlist?.savedAt ?? 0).getTime() - new Date(a.wishlist?.savedAt ?? 0).getTime();
    });
  }, [products, sort, stockOnly]);

  function signInUrl() {
    return buildBazIdSignInUrl({ bazIdBaseUrl: BAZID, returnTo: window.location.href });
  }

  async function remove(product: MoneyProduct) {
    if (busy) return;
    setBusy(product.id); setError("");
    try {
      const response = await fetch(`${WISHLIST_API}?productId=${encodeURIComponent(product.id)}`, { method: "DELETE", credentials: "include" });
      const body = await response.json().catch(() => null) as WishlistResponse | null;
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not remove item");
      setProducts(body?.products ?? (products ?? []).filter((item) => item.id !== product.id));
      window.dispatchEvent(new CustomEvent("bazaara:wishlist-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove item"); }
    finally { setBusy(""); }
  }

  async function moveToCart(product: MoneyProduct) {
    const variantId = product.wishlist?.selectedVariantId ?? product.defaultVariantId;
    if (!variantId || product.wishlist?.available === false || busy) return;
    setBusy(product.id); setError("");
    try {
      const cartResponse = await fetch(CART_API, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ variantId, quantity: 1 }) });
      const cartBody = await cartResponse.json().catch(() => null);
      if (!cartResponse.ok) throw new Error(cartBody?.error?.message ?? "Could not move item to cart");
      const wishlistResponse = await fetch(`${WISHLIST_API}?productId=${encodeURIComponent(product.id)}`, { method: "DELETE", credentials: "include" });
      const wishlistBody = await wishlistResponse.json().catch(() => null) as WishlistResponse | null;
      if (!wishlistResponse.ok) throw new Error(wishlistBody?.error?.message ?? "Item was added to cart, but could not be removed from wishlist");
      setProducts(wishlistBody?.products ?? (products ?? []).filter((item) => item.id !== product.id));
      window.dispatchEvent(new CustomEvent("bazaara:cart-updated", { detail: cartBody?.cart ?? cartBody }));
      window.dispatchEvent(new CustomEvent("bazaara:wishlist-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not move item to cart"); }
    finally { setBusy(""); }
  }

  return (
    <div className="shop-shell">
      <ShoppingHeader />
      <main className="shop-main bazaara-wishlist-page">
        <div className="catalogue-heading bazaara-wishlist-heading">
          <div><span className="eyebrow">SAVED FOR LATER</span><h1 className="cart-title">Wishlist{products ? ` (${products.length})` : ""}</h1></div>
        </div>

        {products === null ? <div className="shop-empty">Loading wishlist...</div> : needsLogin ? (
          <div className="shop-empty"><h2>Sign in to view your wishlist</h2><p>Your Wishlist follows your BazID across Shopping.</p><button className="primary-shop-button inline-button" type="button" onClick={() => { window.location.href = signInUrl(); }}>Sign in with BazID</button></div>
        ) : error && products.length === 0 ? (
          <div className="shop-empty"><h2>Wishlist could not load</h2><p>{error}</p><button className="primary-shop-button inline-button" type="button" onClick={() => void refresh()}>Try again</button></div>
        ) : products.length === 0 ? (
          <div className="shop-empty"><h2>Your wishlist is empty</h2><p>Tap the heart on a product to keep it here for later.</p><Link className="primary-shop-button inline-button" href="/search-results">Browse products</Link></div>
        ) : (
          <>
            <div className="bazaara-wishlist-toolbar" aria-label="Wishlist sorting and filters">
              <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="recent">Recently saved</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="changes">Price changes</option></select></label>
              <label className="bazaara-wishlist-stock"><input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} /><span>In stock only</span></label>
            </div>
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            {visible.length === 0 ? <div className="shop-empty"><h2>No saved items match this filter</h2><button className="primary-shop-button inline-button" type="button" onClick={() => setStockOnly(false)}>Show all</button></div> : (
              <div className="bazaara-wishlist-list">
                {visible.map((product) => {
                  const variant = product.wishlist?.selectedVariant;
                  const currentPrice = variant?.priceMinor ?? product.priceMinor;
                  const savedPrice = product.wishlist?.savedPriceMinor;
                  const unavailable = product.wishlist?.available === false || product.stock !== "IN_STOCK";
                  const priceChanged = Boolean(product.wishlist?.priceChanged && savedPrice != null);
                  return (
                    <article key={product.id} className={`bazaara-wishlist-card${unavailable ? " is-unavailable" : ""}`}>
                      <Link href={`/products/${product.slug}`} className="bazaara-wishlist-media" aria-label={product.title}>
                        {product.image ? <img src={product.image.url} alt={product.image.alt} loading="lazy" /> : <div className="bazaara-wishlist-empty-image">BAZAARA</div>}
                      </Link>
                      <div className="bazaara-wishlist-copy">
                        {product.brand ? <span className="product-kicker">{product.brand.name}</span> : null}
                        <Link href={`/products/${product.slug}`} className="bazaara-wishlist-title">{product.title}</Link>
                        {variant ? <span className="bazaara-wishlist-variant">{variant.title} · SKU {variant.sku}</span> : null}
                        <div className="bazaara-wishlist-price"><strong>{formatMoney(currentPrice, product.currency)}</strong>{priceChanged ? <s>{formatMoney(savedPrice!, product.currency)}</s> : null}</div>
                        <div className="bazaara-wishlist-state"><span className={unavailable ? "is-out" : "is-in"}>{unavailable ? "Currently unavailable" : `${variant?.availableQuantity ?? product.availableQuantity} available`}</span>{priceChanged ? <span className="bazaara-wishlist-change">{currentPrice < savedPrice! ? "Price dropped" : "Price changed"}</span> : null}</div>
                        <div className="bazaara-wishlist-actions"><button type="button" className="primary-shop-button" disabled={unavailable || busy === product.id} onClick={() => void moveToCart(product)}>{busy === product.id ? "Working..." : "Move to cart"}</button><button type="button" className="bazaara-wishlist-remove" disabled={busy === product.id} onClick={() => void remove(product)}>Remove</button></div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
