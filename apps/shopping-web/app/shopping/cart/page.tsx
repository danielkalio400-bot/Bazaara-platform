"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartWishlistButton } from "../../../components/cart-wishlist-button";
import { ShoppingHeader } from "../../../components/shopping-header";
import { formatMoney } from "../../../lib/shopping";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type CartItem = {
  id: string;
  quantity: number;
  availableQuantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  variant: {
    id: string;
    title: string;
    sku: string;
  };
  product: {
    slug: string;
    title: string;
    image: { url: string; alt: string } | null;
  };
  seller: { name: string };
};

type ProductMeta = {
  id: string;
  compareAtPriceMinor: number | null;
  stock: string;
  availableQuantity: number;
};

type Cart = {
  id: string | null;
  currency: string;
  itemCount: number;
  subtotalMinor: number;
  items: CartItem[];
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [productMeta, setProductMeta] = useState<Record<string, ProductMeta>>({});
  const [removedSuggestion, setRemovedSuggestion] = useState<{
    productId: string;
    title: string;
  } | null>(null);

  async function loadProductMeta(nextCart: Cart) {
    const slugs =
      Array.from(
        new Set(
          nextCart.items.map(
            (item) =>
              item.product.slug
          )
        )
      );

    if (slugs.length === 0) {
      setProductMeta({});
      return;
    }

    const entries =
      await Promise.all(
        slugs.map(
          async (slug) => {
            try {
              const response =
                await fetch(
                  `${API}/v1/shopping/products/${encodeURIComponent(slug)}`,
                  {
                    credentials: "include",
                    cache: "no-store"
                  }
                );

              if (!response.ok) {
                return [
                  slug,
                  null
                ] as const;
              }

              const body =
                await response
                  .json()
                  .catch(
                    () => null
                  );

              const product =
                body?.product;

              if (
                !product ||
                typeof product.id !== "string"
              ) {
                return [
                  slug,
                  null
                ] as const;
              }

              return [
                slug,
                {
                  id:
                    product.id,
                  compareAtPriceMinor:
                    typeof product.compareAtPriceMinor === "number"
                      ? product.compareAtPriceMinor
                      : null,
                  stock:
                    typeof product.stock === "string"
                      ? product.stock
                      : "UNKNOWN",
                  availableQuantity:
                    typeof product.availableQuantity === "number"
                      ? product.availableQuantity
                      : 0
                } satisfies ProductMeta
              ] as const;
            }
            catch {
              return [
                slug,
                null
              ] as const;
            }
          }
        )
      );

    const next:
      Record<string, ProductMeta> =
        {};

    for (
      const [
        slug,
        meta
      ] of entries
    ) {
      if (meta) {
        next[slug] =
          meta;
      }
    }

    setProductMeta(next);
  }

  function discountPercent(
    currentMinor: number,
    compareAtMinor:
      | number
      | null
      | undefined
  ) {
    if (
      !compareAtMinor ||
      compareAtMinor <=
        currentMinor
    ) {
      return 0;
    }

    return Math.round(
      (
        1 -
        currentMinor /
          compareAtMinor
      ) *
        100
    );
  }

  async function load() {
    setError("");

    try {
      const response = await fetch(`${API}/v1/shopping/cart`, {
        credentials: "include",
        cache: "no-store",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not load cart");
      }

      setCart(body.cart);
      void loadProductMeta(
        body.cart
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load cart");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    document.body.classList.add("shopping-cart-open");

    return () => {
      document.body.classList.remove("shopping-cart-open");
    };
  }, []);
  function publish(next: Cart) {
    setCart(next);

    void loadProductMeta(
      next
    );

    window.dispatchEvent(
      new CustomEvent(
        "bazaara:cart-updated",
        {
          detail: next
        }
      )
    );
  }

  async function change(item: CartItem, quantity: number) {
    if (quantity < 1 || quantity > item.availableQuantity || busy) return;

    setBusy(item.id);
    setError("");

    try {
      // Use the same POST set-item endpoint proven by Add to cart.
      // This avoids browser/proxy-specific PATCH problems while remaining idempotent.
      const response = await fetch(`${API}/v1/shopping/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          variantId: item.variant.id,
          quantity,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not update cart");
      }

      publish(body.cart);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update cart");
      await load();
    } finally {
      setBusy("");
    }
  }

  async function remove(item: CartItem) {
    if (busy) return;

    const removedMeta =
      productMeta[
        item.product.slug
      ];

    setBusy(item.id);
    setError("");

    try {
      const response = await fetch(
        `${API}/v1/shopping/cart/items/${encodeURIComponent(item.id)}/remove`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not remove item");
      }

      publish(body.cart);

      if (removedMeta?.id) {
        setRemovedSuggestion({
          productId: removedMeta.id,
          title: item.product.title,
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove item");
      await load();
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="shop-shell shop-cart-route">
      <ShoppingHeader />

      <main className="shop-main">
        <div className="cart-mobile-page-heading">
          <Link
            href="/"
            className="cart-mobile-back"
            aria-label="Back to Shopping"
          >
            ←
          </Link>
          <h1>Cart</h1>
        </div>
        <div className="catalogue-heading">
          <div>
            <span className="eyebrow">Shopping</span>
            <h1 className="cart-title">Your cart</h1>
          </div>
        </div>

        {removedSuggestion ? (
          <div
            className="cart-remove-wishlist-suggestion"
            role="status"
            aria-live="polite"
          >
            <span
              className="cart-remove-wishlist-suggestion-icon"
              aria-hidden="true"
            >
              ♡
            </span>

            <div className="cart-remove-wishlist-suggestion-copy">
              <strong>{removedSuggestion.title}</strong>
              <span>Removed from cart. Save it to Wishlist?</span>
            </div>

            <div className="cart-remove-wishlist-suggestion-action">
              <CartWishlistButton
                productId={removedSuggestion.productId}
              />

              <button
                type="button"
                className="cart-remove-wishlist-suggestion-dismiss"
                onClick={() => setRemovedSuggestion(null)}
                aria-label="Dismiss Wishlist recommendation"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}

        {!cart ? (
          <div className="shop-empty">Loading your cart...</div>
        ) : cart.items.length === 0 ? (
          <div className="shop-empty">
            <h2>Your cart is empty</h2>
            <p>Browse Shopping and add something you need.</p>
            <Link className="primary-shop-button inline-button" href="/">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items" aria-label="Cart items">
              {cart.items.map((item) => {
                const meta =
                  productMeta[
                    item.product.slug
                  ];

                const discount =
                  discountPercent(
                    item.unitPriceMinor,
                    meta?.compareAtPriceMinor
                  );

                const inStock =
                  item.availableQuantity > 0 &&
                  meta?.stock !==
                    "OUT_OF_STOCK";

                return (
                  <article
                    key={item.id}
                    className="cart-item"
                  >
                    {item.product.image ? (
                      <img
                        src={item.product.image.url}
                        alt={item.product.image.alt}
                      />
                    ) : (
                      <div className="cart-image-empty" />
                    )}

                    <div className="cart-item-copy">
                      <Link href={`/products/${item.product.slug}`}>
                        <strong>{item.product.title}</strong>
                      </Link>

                      <span>
                        {item.variant.title}
                      </span>

                      <small>
                        Sold by {item.seller.name}
                      </small>

                      <div
                        className="quantity-control"
                        aria-label={`Quantity for ${item.product.title}`}
                      >
                        <button
                          type="button"
                          disabled={
                            busy === item.id ||
                            item.quantity <= 1
                          }
                          onClick={
                            () =>
                              change(
                                item,
                                item.quantity - 1
                              )
                          }
                          aria-label={`Decrease ${item.product.title} quantity`}
                        >
                          -
                        </button>

                        <span
                          className="quantity-value"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={
                            busy === item.id ||
                            item.quantity >=
                              item.availableQuantity
                          }
                          onClick={
                            () =>
                              change(
                                item,
                                item.quantity + 1
                              )
                          }
                          aria-label={`Increase ${item.product.title} quantity`}
                        >
                          +
                        </button>
                      </div>

                      <div
                        className="cart-item-secondary-actions"
                      >
                        <button
                          type="button"
                          className="remove-link"
                          disabled={
                            busy === item.id
                          }
                          onClick={
                            () =>
                              remove(item)
                          }
                        >
                          {
                            busy === item.id
                              ? "Updating..."
                              : "Remove"
                          }
                        </button>

                        <CartWishlistButton
                          productId={
                            meta?.id ??
                            null
                          }
                        />
                      </div>

                      {item.availableQuantity <= item.quantity ? (
                        <small className="cart-stock-note">
                          Maximum available quantity reached.
                        </small>
                      ) : null}
                    </div>

                    <div
                      className="cart-price-stack"
                    >
                      <strong>
                        {
                          formatMoney(
                            item.unitPriceMinor,
                            cart.currency
                          )
                        }
                      </strong>

                      {
                        meta?.compareAtPriceMinor &&
                        meta.compareAtPriceMinor >
                          item.unitPriceMinor
                          ? (
                            <div
                              className="cart-compare-price"
                            >
                              <s>
                                {
                                  formatMoney(
                                    meta.compareAtPriceMinor,
                                    cart.currency
                                  )
                                }
                              </s>

                              {
                                discount > 0
                                  ? (
                                    <span>
                                      -{discount}%
                                    </span>
                                  )
                                  : null
                              }
                            </div>
                          )
                          : null
                      }

                      <span
                        className={
                          inStock
                            ? "cart-stock-status is-in-stock"
                            : "cart-stock-status is-out-of-stock"
                        }
                      >
                        {
                          inStock
                            ? "In Stock"
                            : "Out of Stock"
                        }
                      </span>

                      {
                        item.quantity > 1
                          ? (
                            <small
                              className="cart-line-total"
                            >
                              Line total {
                                formatMoney(
                                  item.lineTotalMinor,
                                  cart.currency
                                )
                              }
                            </small>
                          )
                          : null
                      }
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="cart-summary">
              <h2>Order summary</h2>
              <div>
                <span>Items ({cart.itemCount})</span>
                <strong>{formatMoney(cart.subtotalMinor, cart.currency)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="summary-total">
                <span>Subtotal</span>
                <strong>{formatMoney(cart.subtotalMinor, cart.currency)}</strong>
              </div>
              <Link className="primary-shop-button checkout-link" href="/checkout">
                Continue to checkout
              </Link>
              <p>Inventory is reserved only after checkout begins.</p>
            </aside>
          </div>
        )}

        {cart && cart.items.length > 0 ? (
          <div
            className="bazaara-cart-sticky-checkout"
            role="region"
            aria-label="Checkout"
          >
            <div className="bazaara-cart-sticky-copy">
              <span>Subtotal</span>
              <strong>{formatMoney(cart.subtotalMinor, cart.currency)}</strong>
            </div>

            <Link
              className="bazaara-cart-sticky-button"
              href="/checkout"
              aria-label={`Checkout for ${formatMoney(cart.subtotalMinor, cart.currency)}`}
            >
              Checkout
              <span>{formatMoney(cart.subtotalMinor, cart.currency)}</span>
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}
      </main>
    </div>
  );
}
