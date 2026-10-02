"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./bazai-web-assistant.module.css";

type Product = {
  id: string; slug: string; title: string; currency: string; priceMinor: number;
  image: { url: string; alt: string } | null; brand: { name: string } | null;
  seller: { name: string } | null; stock: "IN_STOCK" | "OUT_OF_STOCK";
};
type SearchResponse = { products: Product[] };
type GroceryPlan = { title: string; disclaimer: string; ingredients: Array<{ label: string; quantity: number; note: string | null; products: Product[] }> };

const QUICK = ["Find something", "Phone under ₦300,000", "Compare products", "Find a gift", "Plan groceries", "Track an order"];
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

function understandPrompt(prompt: string) {
  const lower = prompt.toLowerCase(); let q = prompt.trim();
  if (lower.includes("phone")) q = "phone";
  else if (lower.includes("school") || lower.includes("laptop")) q = "laptop";
  else if (lower.includes("gift")) q = "gift";
  else if (lower.includes("shoe")) q = "shoe";
  const budget = prompt.replace(/,/g, "").match(/(?:₦|ngn\s*)?([0-9]{4,})/i)?.[1];
  return { q, maxPriceMinor: budget ? Number(budget) * 100 : undefined };
}
function groceryIntent(value: string) { return /(grocery|groceries|jollof|breakfast|beans|akara|pantry|ingredient|meal|weekly essentials)/i.test(value); }
function money(amountMinor: number, currency: string) { return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor / 100); }

export function BazAiWebAssistant() {
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [plan, setPlan] = useState<GroceryPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(value = prompt) {
    const input = value.trim(); if (!input) return;
    if (/track an order|track order|my order/i.test(input)) { window.location.assign("/orders"); return; }
    setPrompt(input); setBusy(true); setError(""); setProducts([]); setPlan(null);
    try {
      if (groceryIntent(input) || input === "Plan groceries") {
        const response = await fetch(`${API_BASE}/v1/grocery/planner`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: input === "Plan groceries" ? "Plan my weekly groceries" : input }), cache: "no-store" });
        const body = await response.json().catch(() => null) as GroceryPlan | { error?: { message?: string } } | null;
        if (!response.ok || !body || !("ingredients" in body)) throw new Error((body as { error?: { message?: string } } | null)?.error?.message ?? "GO AI could not plan those groceries");
        setPlan(body);
        setProducts(body.ingredients.flatMap((item) => item.products.slice(0, 1)).filter((product, index, all) => all.findIndex((candidate) => candidate.id === product.id) === index));
      } else {
        const understood = understandPrompt(input);
        const params = new URLSearchParams({ inStock: "true", sort: "featured", page: "1", limit: "12" });
        if (understood.q) params.set("q", understood.q);
        if (understood.maxPriceMinor) params.set("maxPriceMinor", String(understood.maxPriceMinor));
        const response = await fetch(`${API_BASE}/v1/shopping/search?${params.toString()}`, { credentials: "include", cache: "no-store" });
        const body = await response.json().catch(() => null) as SearchResponse | { error?: { message?: string } } | null;
        if (!response.ok || !body || !("products" in body)) throw new Error((body as { error?: { message?: string } } | null)?.error?.message ?? "GO AI could not search the catalogue");
        setProducts(body.products);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "GO AI could not complete that request"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const initial = searchParams.get("prompt");
    if (initial) void ask(initial);
    // Search params only seed the initial hand-off into GO AI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void ask(); }

  return <main className={styles.page}><div className={styles.shell}>
    <div className={styles.top}><div className={styles.brand}>GO AI <span>by Bazaara</span></div><Link href="/" className={styles.back}>Back to GO</Link></div>
    <section className={styles.hero}><div className={styles.eyebrow}>Bazaara commerce assistant</div><h1 className={styles.title}>What are you looking for today?</h1><p className={styles.copy}>Search the live catalogue by need or budget, build grocery plans and move directly into orders without leaving the Bazaara commerce context.</p><div className={styles.quick}>{QUICK.map((item) => <button key={item} type="button" className={styles.chip} onClick={() => void ask(item)}>{item}</button>)}</div><form className={styles.composer} onSubmit={submit}><input className={styles.input} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. I need a good phone under ₦300,000…" aria-label="Ask GO AI" /><button className={styles.send} type="submit" disabled={busy}>{busy ? "Thinking…" : "Send"}</button></form>{error ? <div className={styles.status}>{error}</div> : null}</section>
    {plan ? <section className={`${styles.section} ${styles.plan}`}><div className={styles.eyebrow}>AI-GENERATED GROCERY PLAN</div><h2>{plan.title}</h2><div className={styles.planRows}>{plan.ingredients.map((item) => <div key={item.label}><span><strong>{item.label}</strong>{item.note ? <small>{item.note}</small> : null}</span><b>× {item.quantity}</b></div>)}</div><p className={styles.disclaimer}>{plan.disclaimer}</p><Link href="/grocery" className={styles.back}>Open Grocery →</Link></section> : null}
    {products.length ? <section className={styles.section}><h2>{plan ? "Suggested grocery products" : "Recommendations"}</h2><div className={styles.grid}>{products.map((product) => <Link key={product.id} href={`/products/${product.slug}`} className={styles.card}>{product.image ? <img className={styles.image} src={product.image.url} alt={product.image.alt || product.title} /> : <div className={styles.image} />}<div className={styles.body}><div className={styles.kicker}>{product.brand?.name ?? "BAZAARA"}</div><div className={styles.product}>{product.title}</div><div className={styles.price}>{money(product.priceMinor, product.currency)}</div><div className={styles.meta}>{product.stock === "IN_STOCK" ? "In stock" : "Out of stock"}{product.seller ? ` · ${product.seller.name}` : ""}</div></div></Link>)}</div></section> : null}
  </div></main>;
}
