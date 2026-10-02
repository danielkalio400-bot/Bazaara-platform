"use client";

import { useEffect, useState } from "react";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";

import styles from "./wishlist-button.module.css";

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";

const WISHLIST_API = "/api/bazaara-wishlist";

type WishlistBody = {
  products?: Array<{ id: string }>;
  error?: { message?: string };
};

async function readWishlist() {
  const response = await fetch(WISHLIST_API, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return { authenticated: false, ids: new Set<string>() };
  }

  const body = (await response.json().catch(() => null)) as WishlistBody | null;

  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Could not load wishlist");
  }

  return {
    authenticated: true,
    ids: new Set((body?.products ?? []).map((product) => product.id)),
  };
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={styles.heartIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 20.6 10.55 19.3C5.4 14.7 2 11.65 2 7.9 2 4.85 4.42 2.5 7.5 2.5c1.74 0 3.41.8 4.5 2.06A6.03 6.03 0 0 1 16.5 2.5C19.58 2.5 22 4.85 22 7.9c0 3.75-3.4 6.8-8.55 11.42L12 20.6Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WishlistButton({
  productId,
  variantId,
  compact = false,
}: {
  productId: string;
  variantId?: string | null;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const result = await readWishlist();
        if (!cancelled) {
          setSaved(result.ids.has(productId));
          setStatus("");
        }
      } catch {
        // Wishlist remains interactive even if initial state could not load.
      }
    }

    function onWishlistUpdated(event: Event) {
      const detail = (
        event as CustomEvent<{ productId?: string; saved?: boolean }>
      ).detail;

      if (
        detail?.productId === productId &&
        typeof detail.saved === "boolean"
      ) {
        setSaved(detail.saved);
      } else {
        void refresh();
      }
    }

    void refresh();
    window.addEventListener("bazaara:wishlist-updated", onWishlistUpdated);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("bazaara:wishlist-updated", onWishlistUpdated);
      window.removeEventListener("focus", refresh);
    };
  }, [productId]);

  async function toggle() {
    if (busy) return;

    const previous = saved;
    const nextSaved = !previous;

    setBusy(true);
    setStatus("");
    setSaved(nextSaved);

    try {
      const response = await fetch(
        `${WISHLIST_API}?productId=${encodeURIComponent(productId)}`,
        {
          method: nextSaved ? "PUT" : "DELETE",
          credentials: "include",
          cache: "no-store",
          headers: nextSaved
            ? { "content-type": "application/json" }
            : undefined,
          body: nextSaved
            ? JSON.stringify(variantId ? { variantId } : {})
            : undefined,
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
        throw new Error(body?.error?.message ?? "Could not update wishlist");
      }

      const authoritativeSaved = Array.isArray(body?.products)
        ? Boolean(body.products.some((product) => product.id === productId))
        : nextSaved;

      setSaved(authoritativeSaved);
      setStatus(
        authoritativeSaved ? "Saved to wishlist" : "Removed from wishlist",
      );

      window.dispatchEvent(
        new CustomEvent("bazaara:wishlist-updated", {
          detail: { productId, saved: authoritativeSaved },
        }),
      );
    } catch (cause) {
      setSaved(previous);
      setStatus(
        cause instanceof Error
          ? cause.message
          : "Could not update wishlist",
      );
    } finally {
      setBusy(false);
    }
  }

  const label = saved ? "Remove from wishlist" : "Add to wishlist";

  return (
    <div className={compact ? styles.compactWrap : styles.detailWrap}>
      <button
        type="button"
        className={[
          styles.heartButton,
          saved ? styles.saved : "",
          compact ? styles.compact : styles.detail,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={busy}
        onClick={() => void toggle()}
        aria-pressed={saved}
        aria-label={label}
        title={label}
      >
        <HeartIcon filled={saved} />
        {busy ? <span className={styles.busyDot} aria-hidden="true" /> : null}
      </button>

      <span className={styles.srOnly} role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
