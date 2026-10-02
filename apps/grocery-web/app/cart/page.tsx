"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CartWishlistButton } from "../../components/cart-wishlist-button";
import { ShoppingHeader } from "../../components/shopping-header";
import {
  groceryFetch,
  groceryMoney,
  type GroceryCart,
  type GroceryCartItem,
  type GroceryPricingPolicy,
} from "../../lib/grocery-api";

type RemovedItem = { productId: string; title: string } | null;

const FALLBACK_POLICY: GroceryPricingPolicy = {
  serviceFeeBps: 1000,
  serviceFeeMinBps: 1000,
  serviceFeeMaxBps: 1500,
  expressRateBps: 1000,
  expressMinimumMinor: 100000,
  expressMaximumMinor: 500000,
};

function percent(bps: number) {
  return `${(bps / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}%`;
}

function calculateExpressEstimate(subtotalMinor: number, policy: GroceryPricingPolicy) {
  const raw = Math.round((subtotalMinor * policy.expressRateBps) / 10000);
  return Math.min(policy.expressMaximumMinor, Math.max(policy.expressMinimumMinor, raw));
}

export default function GroceryCartPage() {
  const [cart, setCart] = useState<GroceryCart | null>(null);
  const [pricing, setPricing] = useState<GroceryPricingPolicy>(FALLBACK_POLICY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [removed, setRemoved] = useState<RemovedItem>(null);

  async function load() {
    try {
      const [cartBody, policy] = await Promise.all([
        groceryFetch<{ cart: GroceryCart }>("/v1/grocery/cart"),
        groceryFetch<GroceryPricingPolicy>("/v1/grocery/pricing-policy").catch(
          () => FALLBACK_POLICY,
        ),
      ]);
      setCart(cartBody.cart);
      setPricing(policy);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load basket");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function publish(next: GroceryCart) {
    setCart(next);
    window.dispatchEvent(
      new CustomEvent("bazaara:cart-updated", { detail: next }),
    );
  }

  async function quantity(item: GroceryCartItem, next: number) {
    if (next < 1 || next > item.availableQuantity) return;

    setBusy(item.id);
    setError("");

    try {
      const body = await groceryFetch<{ cart: GroceryCart }>(
        `/v1/grocery/cart/items/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ quantity: next }),
        },
      );
      publish(body.cart);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update quantity",
      );
    } finally {
      setBusy("");
    }
  }

  async function remove(item: GroceryCartItem) {
    setBusy(item.id);
    setError("");
    setRemoved(null);

    try {
      const body = await groceryFetch<{ cart: GroceryCart }>(
        `/v1/grocery/cart/items/${item.id}`,
        { method: "DELETE" },
      );
      publish(body.cart);
      setRemoved({ productId: item.product.id, title: item.product.title });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove item");
    } finally {
      setBusy("");
    }
  }

  const expressEstimate = useMemo(
    () =>
      cart
        ? calculateExpressEstimate(cart.subtotalMinor, pricing)
        : pricing.expressMinimumMinor,
    [cart, pricing],
  );

  return (
    <div className="shop-shell grocery-shell grocery-v55-cart">
      <ShoppingHeader />

      <main className="gv2-page">
        <div className="gv2-head">
          <div>
            <span className="gv2-kicker">GROCERY BASKET</span>
            <h1>Your groceries</h1>
            <p className="gv2-muted">
              Change quantities here. The Grocery branch owns stock accuracy and
              checkout revalidates branch inventory before anything is reserved.
            </p>
          </div>

          <Link
            href="/search-results?vertical=GROCERY"
            className="gv2-btn secondary"
          >
            Keep shopping
          </Link>
        </div>

        {error ? (
          <div className="gv2-error" role="alert">
            {error}
          </div>
        ) : null}

        {removed ? (
          <div className="grocery-v54-removed" role="status">
            <div>
              <strong>{removed.title}</strong>
              <span>removed from your basket</span>
            </div>
            <div className="grocery-v54-removed-actions">
              <span>Save it instead?</span>
              <CartWishlistButton productId={removed.productId} />
            </div>
          </div>
        ) : null}

        {!cart ? (
          <div className="gv2-card">Loading basket…</div>
        ) : cart.items.length === 0 ? (
          <div className="gv2-empty">
            <h2>Your Grocery basket is empty</h2>
            <p>Fresh food, pantry staples and household essentials will stay here.</p>
            <Link className="gv2-btn" href="/">
              Browse groceries
            </Link>
          </div>
        ) : (
          <div className="gv2-grid">
            <section className="grocery-v54-cart-list">
              {cart.items.map((item) => (
                <article className="grocery-v54-cart-row" key={item.id}>
                  {item.product.image ? (
                    <img
                      className="grocery-v54-cart-image"
                      src={item.product.image.url}
                      alt={item.product.image.alt || item.product.title}
                    />
                  ) : (
                    <div className="grocery-v54-cart-image grocery-v54-cart-image-empty">
                      Grocery
                    </div>
                  )}

                  <div className="grocery-v54-cart-copy">
                    <span className="grocery-v54-cart-seller">{item.seller.name}</span>
                    <Link href={`/products/${item.product.slug}`}>
                      <h3>{item.product.title}</h3>
                    </Link>
                    <p>{item.variant.title}</p>

                    <div className="grocery-v54-cart-status">
                      <i />
                      {item.availableQuantity >= item.quantity
                        ? `${item.availableQuantity} available in branch inventory`
                        : "Stock changed — review quantity"}
                    </div>

                    <div className="grocery-v54-cart-actions">
                      <div
                        className="gv2-qty"
                        aria-label={`Quantity for ${item.product.title}`}
                      >
                        <button
                          disabled={busy === item.id || item.quantity <= 1}
                          onClick={() => void quantity(item, item.quantity - 1)}
                          aria-label={`Decrease ${item.product.title}`}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          disabled={
                            busy === item.id ||
                            item.quantity >= item.availableQuantity
                          }
                          onClick={() => void quantity(item, item.quantity + 1)}
                          aria-label={`Increase ${item.product.title}`}
                        >
                          +
                        </button>
                      </div>

                      <CartWishlistButton productId={item.product.id} />

                      <button
                        type="button"
                        className="grocery-v54-remove"
                        disabled={busy === item.id}
                        onClick={() => void remove(item)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grocery-v54-cart-price">
                    <strong>{groceryMoney(item.lineTotalMinor, cart.currency)}</strong>
                    <small>
                      {groceryMoney(item.unitPriceMinor, cart.currency)} each
                    </small>
                  </div>
                </article>
              ))}
            </section>

            <aside className="gv2-stack gv2-sticky">
              <section className="gv2-card gv2-summary">
                <span className="gv2-kicker">ORDER SUMMARY</span>
                <h2>Basket total</h2>

                <div>
                  <span>{cart.itemCount} items</span>
                  <strong>{groceryMoney(cart.subtotalMinor, cart.currency)}</strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <span>Choose at checkout</span>
                </div>

                <div>
                  <span>Service fee</span>
                  <span>
                    {percent(pricing.serviceFeeBps)} configured · allowed 10–15%
                  </span>
                </div>

                <div>
                  <span>Express estimate</span>
                  <span>{groceryMoney(expressEstimate, cart.currency)}</span>
                </div>

                <div className="total">
                  <span>Subtotal</span>
                  <strong>{groceryMoney(cart.subtotalMinor, cart.currency)}</strong>
                </div>

                <Link className="gv2-btn" href="/checkout">
                  Continue to checkout
                </Link>

                <small className="gv2-muted">
                  Express is 10% of merchandise subtotal, minimum ₦1,000 and
                  maximum ₦5,000. The service fee is separate.
                </small>
              </section>

              <section className="grocery-v54-stock-note">
                <span>STORE RESPONSIBILITY</span>
                <h3>The store checks what it has.</h3>
                <p>
                  Branch inventory is the source of truth. The picker contacts you
                  only if a reserved item cannot be found on the shelf.
                </p>
              </section>
            </aside>
          </div>
        )}

        {cart?.items.length ? (
          <div className="gv2-bottom-action">
            <Link className="gv2-btn" href="/checkout">
              Checkout · {groceryMoney(cart.subtotalMinor, cart.currency)}
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
