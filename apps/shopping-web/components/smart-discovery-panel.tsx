"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { parseShoppingIntent, shoppingIntentHref } from "../lib/shopping-intent";

const prompts = [
  "Headphones under ₦50k",
  "New arrival sneakers",
  "Verified sellers with laptops under ₦500k",
  "Office chairs between ₦30k and ₦120k",
];

export function SmartDiscoveryPanel({ compact = false }: { compact?: boolean }) {
  const [phrase, setPhrase] = useState("");
  const intent = useMemo(() => parseShoppingIntent(phrase), [phrase]);
  const ready = phrase.trim().length > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ready) window.location.assign(shoppingIntentHref(intent));
  }

  return (
    <section className={`v12-smart-finder ${compact ? "v12-smart-compact" : ""}`} aria-label="Smart shopping search">
      <div className="v12-finder-heading">
        <div><span className="v12-live-mark" aria-hidden="true" /> SMART FIND</div>
        <Link href="/bazai" title="Open the BAZAARA AI shopping assistant">Talk to BazAI ↗</Link>
      </div>
      {!compact ? <p>Describe what you need. We'll turn budgets and seller preferences into real catalogue filters.</p> : null}
      <form onSubmit={onSubmit} className="v12-intent-form" role="search">
        <label className="sr-only" htmlFor={compact ? "smart-intent-mini" : "smart-intent-main"}>Describe the products you want</label>
        <input
          id={compact ? "smart-intent-mini" : "smart-intent-main"}
          type="search"
          maxLength={240}
          value={phrase}
          onChange={(event) => setPhrase(event.target.value)}
          placeholder="Try ‘verified sellers with laptops under ₦300k’"
          autoComplete="off"
        />
        <button type="submit" disabled={!ready} aria-label="Search products using your shopping preferences">Find it <span aria-hidden="true">→</span></button>
      </form>
      {ready ? (
        <div className="v12-understood" role="status" aria-live="polite">
          <span>SEARCH PLAN</span>
          {intent.q ? <b>“{intent.q}”</b> : <b>All products</b>}
          {intent.maxPriceMinor ? <b>Up to ₦{(Number(intent.maxPriceMinor) / 100).toLocaleString("en-NG")}</b> : null}
          {intent.minPriceMinor ? <b>From ₦{(Number(intent.minPriceMinor) / 100).toLocaleString("en-NG")}</b> : null}
          {intent.verifiedSeller ? <b>Verified sellers</b> : null}
          {intent.sort === "newest" ? <b>Newest first</b> : null}
          {intent.sort === "price_asc" ? <b>Price: low to high</b> : null}
        </div>
      ) : (
        <div className="v12-intent-prompts" aria-label="Example shopping searches">
          {prompts.slice(0, compact ? 2 : 4).map((text) => (
            <button type="button" key={text} onClick={() => setPhrase(text)}>{text} <span aria-hidden="true">↗</span></button>
          ))}
        </div>
      )}
      <small className="v12-honest-note">Smart Find applies transparent catalogue filters; BazAI handles conversational assistance.</small>
    </section>
  );
}
