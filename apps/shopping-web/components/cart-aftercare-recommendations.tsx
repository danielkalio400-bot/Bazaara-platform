"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductCard } from "./product-card";
import type { MoneyProduct } from "../lib/shopping";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const WISHLIST_API = "/api/bazaara-wishlist";

type CartShape = {
  items?: Array<{
    product?: {
      slug?: string;
    };
  }>;
};

type WishlistResponse = {
  products?: MoneyProduct[];
};

type HomeResponse = {
  products?: MoneyProduct[];
  featured?: MoneyProduct[];
};

function uniqueProducts(products: MoneyProduct[]) {
  const seen = new Set<string>();
  const result: MoneyProduct[] = [];

  for (const product of products) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
  }

  return result;
}

export function CartAftercareRecommendations() {
  const [wishlist, setWishlist] = useState<MoneyProduct[]>([]);
  const [viewed, setViewed] = useState<MoneyProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cartResponse, wishlistResponse, homeResponse] = await Promise.all([
        fetch(`${API}/v1/shopping/cart`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(WISHLIST_API, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${API}/v1/shopping/home`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const cartBody = await cartResponse.json().catch(() => null) as { cart?: CartShape } | null;
      const wishlistBody = await wishlistResponse.json().catch(() => null) as WishlistResponse | null;
      const homeBody = await homeResponse.json().catch(() => null) as HomeResponse | null;

      const cartSlugs = new Set(
        (cartBody?.cart?.items ?? [])
          .map((item) => item.product?.slug)
          .filter((slug): slug is string => Boolean(slug)),
      );

      const nextWishlist =
        wishlistResponse.ok && Array.isArray(wishlistBody?.products)
          ? uniqueProducts(wishlistBody.products).slice(0, 6)
          : [];

      const homeProducts = Array.isArray(homeBody?.products)
        ? homeBody.products
        : Array.isArray(homeBody?.featured)
          ? homeBody.featured
          : [];

      const nextViewed = uniqueProducts(homeProducts)
        .filter((product) => !cartSlugs.has(product.slug))
        .filter((product) => !nextWishlist.some((saved) => saved.id === product.id))
        .slice(0, 8);

      setWishlist(nextWishlist);
      setViewed(nextViewed);
    } catch {
      setWishlist([]);
      setViewed([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();

    function refresh() {
      void load();
    }

    window.addEventListener("bazaara:cart-updated", refresh);
    window.addEventListener("bazaara:wishlist-updated", refresh);

    return () => {
      window.removeEventListener("bazaara:cart-updated", refresh);
      window.removeEventListener("bazaara:wishlist-updated", refresh);
    };
  }, [load]);

  const wishlistCountLabel = useMemo(
    () => (wishlist.length > 0 ? ` (${wishlist.length})` : ""),
    [wishlist.length],
  );

  return (
    <section className="bazaara-cart-aftercare" aria-label="More Shopping products">
      <section className="bazaara-cart-discovery-section">
        <div className="bazaara-cart-discovery-heading">
          <div>
            <span className="bazaara-cart-discovery-kicker">SAVED</span>
            <h2>Wishlist{wishlistCountLabel}</h2>
          </div>
          <Link href="/wishlist">See all</Link>
        </div>

        {!loaded ? (
          <div className="bazaara-cart-discovery-empty">Loading Wishlist…</div>
        ) : wishlist.length > 0 ? (
          <div className="bazaara-cart-discovery-grid" data-cart-section="wishlist">
            {wishlist.map((product) => (
              <ProductCard key={`cart-wishlist-${product.id}`} product={product} />
            ))}
          </div>
        ) : (
          <div className="bazaara-cart-discovery-empty">
            Save products with the heart and they will appear here.
          </div>
        )}
      </section>

      <section className="bazaara-cart-discovery-section">
        <div className="bazaara-cart-discovery-heading">
          <div>
            <span className="bazaara-cart-discovery-kicker">DISCOVER</span>
            <h2>Customers also viewed</h2>
          </div>
          <Link href="/search-results?sort=featured">See all</Link>
        </div>

        {!loaded ? (
          <div className="bazaara-cart-discovery-empty">Loading recommendations…</div>
        ) : viewed.length > 0 ? (
          <div className="bazaara-cart-discovery-grid" data-cart-section="customers-also-viewed">
            {viewed.map((product) => (
              <ProductCard key={`cart-viewed-${product.id}`} product={product} />
            ))}
          </div>
        ) : (
          <div className="bazaara-cart-discovery-empty">
            More Shopping products will appear here as the catalogue grows.
          </div>
        )}
      </section>
    </section>
  );
}
