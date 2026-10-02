"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./shopping-header.module.css";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

type CartShape = {
  itemCount?: number;
};

function CartIcon() {
  return (
    <svg
      className={styles.headerSvg}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3.5 4.5h2l1.6 9.1a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.5l1.2-5.6H7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.3" cy="19" r="1.25" fill="currentColor" />
      <circle cx="17.4" cy="19" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function CartLink() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      try {
        const response = await fetch(
          `${API}/v1/grocery/cart`,
          {
            credentials: "include",
            cache: "no-store"
          }
        );

        if (!response.ok) {
          return;
        }

        const body = await response
          .json()
          .catch(() => null);

        if (cancelled) {
          return;
        }

        const cart = body?.cart as CartShape | undefined;

        setItemCount(
          Number(cart?.itemCount ?? 0)
        );
      }
      catch {
        /* Keep navigation usable during temporary API failures. */
      }
    }

    function handleCartUpdated(event: Event) {
      const custom = event as CustomEvent<CartShape>;

      if (
        custom.detail &&
        typeof custom.detail.itemCount === "number"
      ) {
        setItemCount(custom.detail.itemCount);
        return;
      }

      void loadCart();
    }

    void loadCart();

    window.addEventListener(
      "bazaara:cart-updated",
      handleCartUpdated
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "bazaara:cart-updated",
        handleCartUpdated
      );
    };
  }, []);

  const accessibleLabel =
    itemCount > 0
      ? `Cart, ${itemCount} items`
      : "Cart";

  return (
    <Link
      href="/cart"
      className={styles.cartLink}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <CartIcon />

      {itemCount > 0 ? (
        <span
          className={styles.cartBadge}
          aria-hidden="true"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
