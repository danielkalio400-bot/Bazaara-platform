"use client";

import { useEffect, useState } from "react";

import { buildBazIdSignInUrl } from "@bazaara/bazid-client";

import styles from "./cart-wishlist-button.module.css";

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";

const WISHLIST_API = "/api/bazaara-wishlist";

type WishlistBody = {
  products?: Array<{
    id: string;
  }>;
  error?: {
    message?: string;
  };
};

export function CartWishlistButton({
  productId,
}: {
  productId: string | null;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!productId) {
      setSaved(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(WISHLIST_API, {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          return;
        }

        const body = (await response.json().catch(() => null)) as WishlistBody | null;

        if (!cancelled && response.ok) {
          setSaved(
            Boolean(
              body?.products?.some(
                (product) => product.id === productId,
              ),
            ),
          );
        }
      } catch {
        // Keep the heart usable. Mutation errors are announced accessibly.
      }
    })();

    function onUpdate(event: Event) {
      const detail = (
        event as CustomEvent<{
          productId?: string;
          saved?: boolean;
        }>
      ).detail;

      if (
        detail?.productId === productId &&
        typeof detail.saved === "boolean"
      ) {
        setSaved(detail.saved);
      }
    }

    window.addEventListener("bazaara:wishlist-updated", onUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("bazaara:wishlist-updated", onUpdate);
    };
  }, [productId]);

  async function toggle() {
    if (!productId || busy) {
      return;
    }

    const previous = saved;
    const next = !previous;

    setBusy(true);
    setSaved(next);

    try {
      const response = await fetch(
        `${WISHLIST_API}?productId=${encodeURIComponent(productId)}`,
        {
          method: next ? "PUT" : "DELETE",
          credentials: "include",
          cache: "no-store",
          headers: next ? { "content-type": "application/json" } : undefined,
          body: next ? JSON.stringify({}) : undefined,
        },
      );

      if (response.status === 401) {
        setSaved(previous);

        window.location.href = buildBazIdSignInUrl({
          bazIdBaseUrl: BAZID,
          returnTo: window.location.href,
        });

        return;
      }

      const body = (await response.json().catch(() => null)) as WishlistBody | null;

      if (!response.ok) {
        throw new Error(
          body?.error?.message ??
            "Could not update wishlist",
        );
      }

      const authoritative =
        Array.isArray(body?.products)
          ? Boolean(
              body.products.some(
                (product) => product.id === productId,
              ),
            )
          : next;

      setSaved(authoritative);

      window.dispatchEvent(
        new CustomEvent("bazaara:wishlist-updated", {
          detail: {
            productId,
            saved: authoritative,
          },
        }),
      );
    } catch {
      setSaved(previous);
    } finally {
      setBusy(false);
    }
  }

  const label = saved
    ? "Remove from wishlist"
    : "Add to wishlist";

  return (
    <button
      type="button"
      className={
        saved
          ? `${styles.button} ${styles.saved}`
          : styles.button
      }
      disabled={busy || !productId}
      onClick={() => void toggle()}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <svg
        className={styles.heart}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 20.6 10.55 19.3C5.4 14.7 2 11.65 2 7.9 2 4.85 4.42 2.5 7.5 2.5c1.74 0 3.41.8 4.5 2.06A6.03 6.03 0 0 1 16.5 2.5C19.58 2.5 22 4.85 22 7.9c0 3.75-3.4 6.8-8.55 11.42L12 20.6Z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className={styles.srOnly}>
        {busy ? "Updating wishlist" : label}
      </span>

      {busy ? <span className={styles.busyDot} aria-hidden="true" /> : null}
    </button>
  );
}
