"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { CartLink } from "./cart-link";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
type SearchSuggestion = { type: "query" | "product" | "brand" | "category" | "seller"; label: string; value: string };

function SearchIcon() { return <svg className="bz-icon bz-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.8"/><path d="m16.2 16.2 4.1 4.1"/></svg>; }
function HeartIcon() { return <svg className="bz-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.3 5.3 0 0 0-7.5 0L12 6.2l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.6a5.3 5.3 0 0 0 0-7.5Z"/></svg>; }
function AccountIcon() { return <svg className="bz-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.9-4.3 3.4-6.4 7.5-6.4s6.6 2.1 7.5 6.4"/></svg>; }

export function ShoppingHeader({ query = "" }: { query?: string }) {
  const [search, setSearch] = useState(query);
  const [accountOpen, setAccountOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    const value = search.trim();
    if (value.length < 2) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`${API}/v1/shopping/search/suggestions?q=${encodeURIComponent(value)}&limit=8&vertical=GROCERY`, { credentials: "include", cache: "no-store", signal: controller.signal })
        .then(async response => response.ok ? response.json() as Promise<{suggestions?: SearchSuggestion[]}> : { suggestions: [] })
        .then(body => setSuggestions(body.suggestions ?? []))
        .catch(cause => { if ((cause as {name?:string})?.name !== "AbortError") setSuggestions([]); });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search]);

  function searchHref(value: string) {
    const params = new URLSearchParams({ vertical: "GROCERY" });
    if (value.trim()) params.set("q", value.trim());
    return `/search-results?${params.toString()}`;
  }
  function suggestionHref(item: SearchSuggestion) {
    const params = new URLSearchParams({ vertical: "GROCERY" });
    if (item.type === "brand") params.set("brand", item.value);
    else if (item.type === "category") params.set("category", item.value);
    else if (item.type === "seller") params.set("seller", item.value);
    else params.set("q", item.label || item.value);
    return `/search-results?${params.toString()}`;
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); window.location.assign(searchHref(search)); }

  return <header className="bz-shop-header bz-grocery-header grocery-v54-header">
    <div className="bz-shop-header-inner">
      <Link href="/" className="grocery-v54-brand" aria-label="Grocery home"><small>BAZAARA</small><strong>Grocery</strong></Link>
      <form className="bz-shop-search grocery-v54-search" role="search" onSubmit={submit} onFocus={() => setSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}>
        <SearchIcon/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search groceries, stores and essentials" aria-label="Search Grocery" autoComplete="off"/>
        {suggestionsOpen && suggestions.length ? <div className="bz-search-suggestions" role="listbox" aria-label="Grocery search suggestions">{suggestions.map(item => <Link key={`${item.type}:${item.value}`} href={suggestionHref(item)} onMouseDown={event => event.preventDefault()} onClick={() => setSuggestionsOpen(false)}><span>{item.label}</span><small>{item.type}</small></Link>)}</div> : null}
      </form>
      <nav className="bz-shop-nav grocery-v54-nav" aria-label="Grocery navigation">
        <Link href="/search-results?vertical=GROCERY" className="grocery-v54-nav-link">Browse</Link>
        <Link href="/lists" className="grocery-v54-nav-link">My lists</Link>
        <Link href="/bazai?prompt=Plan%20my%20weekly%20groceries" className="grocery-v54-ai"><span>AI</span>Plan</Link>
        <Link href="/wishlist" className="bz-icon-link grocery-v54-icon" aria-label="Saved groceries" title="Saved groceries"><HeartIcon/></Link>
        <div className="bz-account-menu" onMouseEnter={() => setAccountOpen(true)} onMouseLeave={() => setAccountOpen(false)}>
          <button type="button" className="bz-icon-link bz-account-trigger grocery-v54-icon" aria-label="Account" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(v => !v)}><AccountIcon/></button>
          {accountOpen ? <div className="bz-account-popover" role="menu"><Link href="/account" role="menuitem">Account</Link><Link href="/orders" role="menuitem">Orders</Link><Link href="/account/addresses" role="menuitem">Addresses</Link><Link href="/account/settings" role="menuitem">Settings</Link></div> : null}
        </div>
        <span className="grocery-v54-cart"><CartLink/></span>
      </nav>
    </div>
  </header>;
}
