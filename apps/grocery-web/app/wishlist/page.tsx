"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";

import { ProductCard } from "../../components/product-card";
import { ShoppingHeader } from "../../components/shopping-header";
import type { MoneyProduct } from "../../lib/shopping";

const BAZID = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
const GROCERY = process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL ?? "http://localhost:3006";

type WishlistResponse = {
  products: MoneyProduct[];
  count: number;
  updatedAt: string | null;
  error?: { message?: string };
};

type State = "loading" | "ready" | "signed-out" | "error";

export default function GroceryWishlistPage() {
  const [state, setState] = useState<State>("loading");
  const [products, setProducts] = useState<MoneyProduct[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const signInUrl = useMemo(
    () =>
      buildBazIdSignInUrl({
        bazIdBaseUrl: BAZID,
        returnTo: `${GROCERY.replace(/\/$/, "")}/wishlist`,
      }),
    [],
  );

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/bazaara-wishlist", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        setProducts([]);
        setState("signed-out");
        return;
      }

      const body = (await response.json().catch(() => null)) as WishlistResponse | null;
      if (!response.ok || !body) {
        throw new Error(body?.error?.message ?? "Could not load saved groceries");
      }

      setProducts(body.products ?? []);
      setUpdatedAt(body.updatedAt ?? null);
      setError("");
      setState("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load saved groceries");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("bazaara:wishlist-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("bazaara:wishlist-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  return (
    <div className="shop-shell grocery-saved-v53">
      <ShoppingHeader />
      <main className="shop-main grocery-saved-main-v53">
        <section className="grocery-saved-hero-v53">
          <div>
            <span>SAVED GROCERIES</span>
            <h1>Your shortlist, ready for the next basket.</h1>
            <p>
              Grocery-only saved products stay connected to live branch availability,
              current prices and your BazID account.
            </p>
          </div>
          <div className="grocery-saved-actions-v53">
            <Link href="/" className="grocery-list-secondary">Back to Grocery</Link>
            <Link href="/search-results?vertical=GROCERY" className="grocery-list-primary">Browse groceries</Link>
          </div>
        </section>

        {state === "loading" ? (
          <div className="shop-empty grocery-saved-state-v53">
            <h2>Loading saved groceries…</h2>
            <p>Checking your BazID wishlist.</p>
          </div>
        ) : null}

        {state === "signed-out" ? (
          <section className="grocery-saved-auth-v53">
            <span>BAZID REQUIRED</span>
            <h2>Keep saved groceries private and synchronized.</h2>
            <p>Sign in to use the Grocery wishlist across web and mobile.</p>
            <a href={signInUrl} className="grocery-list-primary">Continue with BazID →</a>
          </section>
        ) : null}

        {state === "error" ? (
          <section className="grocery-saved-auth-v53">
            <span>WISHLIST</span>
            <h2>Saved groceries could not load.</h2>
            <p>{error}</p>
            <button type="button" className="grocery-list-primary" onClick={() => void load()}>Try again</button>
          </section>
        ) : null}

        {state === "ready" ? (
          <section className="grocery-saved-section-v53">
            <div className="grocery-saved-section-head-v53">
              <div>
                <span>MY WISHLIST</span>
                <h2>{products.length} {products.length === 1 ? "saved product" : "saved products"}</h2>
                <p>{updatedAt ? `Synced ${new Date(updatedAt).toLocaleString("en-NG")}` : "Your Grocery wishlist is ready."}</p>
              </div>
            </div>

            {products.length ? (
              <div className="shopping-grid bz-product-grid grocery-home-product-grid-v53">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="shop-empty grocery-saved-state-v53">
                <h2>No saved groceries yet</h2>
                <p>Use the heart on any Grocery product and it will appear here.</p>
                <Link href="/search-results?vertical=GROCERY" className="grocery-list-primary">Explore Grocery</Link>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
