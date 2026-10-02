"use client";

import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

type RepeatPurchase = {
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  createdAt: string;
};

type CartResponse = { cart?: { itemCount?: number } };

export function GroceryBuyAgain() {
  const [items, setItems] = useState<RepeatPurchase[]>([]);
  const [busyVariantId, setBusyVariantId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${API}/v1/grocery/repeat-purchases`, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : { items: [] })
      .then((body: { items?: RepeatPurchase[] }) => { if (!controller.signal.aborted) setItems(body.items ?? []); })
      .catch(() => { if (!controller.signal.aborted) setItems([]); });
    return () => controller.abort();
  }, []);

  async function addAgain(item: RepeatPurchase) {
    setBusyVariantId(item.variantId); setMessage("");
    try {
      const cartResponse = await fetch(`${API}/v1/shopping/cart`, { credentials: "include", cache: "no-store" });
      const cartBody = await cartResponse.json().catch(() => null) as { cart?: { items?: Array<{ quantity: number; variant?: { id?: string } }> } } | null;
      const currentQuantity = cartBody?.cart?.items?.find((entry) => entry.variant?.id === item.variantId)?.quantity ?? 0;
      const response = await fetch(`${API}/v1/shopping/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId: item.variantId, quantity: currentQuantity + Math.max(1, item.quantity) }),
      });
      const body = await response.json().catch(() => null) as (CartResponse & { error?: { message?: string } }) | null;
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not add item again");
      window.dispatchEvent(new CustomEvent("bazaara:cart-updated", { detail: body?.cart ?? {} }));
      setMessage(`${item.productTitle} added to your cart.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not add item again");
    } finally { setBusyVariantId(null); }
  }

  if (!items.length) return null;

  return (
    <section className="bz-home-section bz-grocery-repeat-section">
      <div className="bz-section-heading"><div><span>BUY AGAIN</span><h2>Recent grocery purchases</h2></div></div>
      {message ? <p className="bz-grocery-repeat-message" role="status">{message}</p> : null}
      <div className="bz-grocery-repeat-grid">
        {items.slice(0, 8).map((item) => (
          <article className="bz-grocery-repeat-card" key={`${item.productId}:${item.variantId}`}>
            <div><strong>{item.productTitle}</strong><small>{item.variantTitle} · last bought × {item.quantity}</small></div>
            <button type="button" className="secondary-shop-button" disabled={busyVariantId === item.variantId} onClick={() => void addAgain(item)}>{busyVariantId === item.variantId ? "Adding…" : "Add again"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
