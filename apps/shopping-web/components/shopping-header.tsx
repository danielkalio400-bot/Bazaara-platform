"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CartLink } from "./cart-link";

type Leaf = { slug: string; label: string; query: string };
type Group = { slug: string; label: string; query: string; items: Leaf[] };
type ParentCategory = {
  slug: string;
  label: string;
  desktopLabel?: string;
  query: string;
  mobile?: boolean;
  desktop?: boolean;
  groups: Group[];
};
type CategoryResponse = { categories: ParentCategory[] };

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
function productHref(query: string) {
  return `/search-results?${new URLSearchParams({ q: query }).toString()}`;
}

type SearchSuggestion = { type: "query" | "product" | "brand" | "category" | "seller"; label: string; value: string };

function SearchIcon() {
  return (
    <svg className="bz-icon bz-search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.8" />
      <path d="m16.2 16.2 4.1 4.1" />
    </svg>
  );
}

function LensIcon() {
  return (
    <svg className="bz-icon bz-lens-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.1 6.3 9.3 4.5h5.4l1.2 1.8h2.7a2.4 2.4 0 0 1 2.4 2.4v8.1a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 16.8V8.7a2.4 2.4 0 0 1 2.4-2.4h2.7Z" />
      <circle cx="12" cy="12.8" r="3.5" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg className="bz-icon bz-category-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="bz-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 4.9a5.3 5.3 0 0 0-7.5 0L12 6.2l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.6a5.3 5.3 0 0 0 0-7.5Z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg className="bz-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.9-4.3 3.4-6.4 7.5-6.4s6.6 2.1 7.5 6.4" />
    </svg>
  );
}

export function ShoppingHeader({ query = "" }: { query?: string }) {
  const [search, setSearch] = useState(query);
  const [categories, setCategories] = useState<ParentCategory[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`${API}/v1/shopping/category-navigation`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as CategoryResponse | null;
        if (!response.ok || !body?.categories || !active) return;
        const desktop = body.categories.filter((item) => item.desktop !== false);
        setCategories(desktop);
        setActiveSlug((current) => current || desktop[0]?.slug || "");
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const selected = useMemo(
    () => categories.find((item) => item.slug === activeSlug) ?? categories[0],
    [activeSlug, categories]
  );

  useEffect(() => {
    const value = search.trim();
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`${API}/v1/shopping/search/suggestions?q=${encodeURIComponent(value)}&limit=8&vertical=SHOPPING`, {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal
      })
        .then(async (response) => {
          if (!response.ok) return { suggestions: [] };
          return response.json() as Promise<{ suggestions?: SearchSuggestion[] }>;
        })
        .then((body) => setSuggestions(body.suggestions ?? []))
        .catch((cause) => { if ((cause as { name?: string })?.name !== "AbortError") setSuggestions([]); });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search]);

  function suggestionHref(item: SearchSuggestion) {
    if (item.type === "product") return `/products/${encodeURIComponent(item.value)}`;
    const params = new URLSearchParams();
    if (item.type === "query") params.set("q", item.value);
    if (item.type === "brand") params.set("brand", item.value);
    if (item.type === "category") params.set("category", item.value);
    if (item.type === "seller") params.set("seller", item.value);
    return `/search-results?${params.toString()}`;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    window.location.assign(value ? productHref(value) : "/search-results");
  }

  return (
    <header className="bz-shop-header" onMouseLeave={() => setMenuOpen(false)}>
      <div className="bz-shop-header-inner">
        <Link href="/" className="bz-shop-brand" aria-label="Shopping home">
          BAZAARA<span>.</span>
        </Link>

        <form className="bz-shop-search" role="search" onSubmit={submit} onFocus={() => setSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}>
          <SearchIcon />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for products, brands and categories..."
            aria-label="Search for products, brands and categories"
            autoComplete="off"
            onFocus={() => setSuggestionsOpen(true)}
          />
          <div className="bz-shop-search-actions">
            <Link
              href="/bazlens"
              className="bz-shop-search-action"
              aria-label="Open Baz Lens visual search"
              title="Baz Lens"
            >
              <LensIcon />
            </Link>
          </div>
          {suggestionsOpen && suggestions.length ? (
            <div className="bz-search-suggestions" role="listbox" aria-label="Search suggestions">
              {suggestions.map((item) => (
                <Link key={`${item.type}:${item.value}`} href={suggestionHref(item)} onMouseDown={(event) => event.preventDefault()} onClick={() => setSuggestionsOpen(false)}>
                  <span>{item.label}</span><small>{item.type}</small>
                </Link>
              ))}
            </div>
          ) : null}
        </form>

        <nav className="bz-shop-nav" aria-label="Shopping">
          <button
            type="button"
            className="bz-categories-trigger bz-desktop-categories"
            aria-expanded={menuOpen}
            onMouseEnter={() => setMenuOpen(true)}
            onFocus={() => setMenuOpen(true)}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <CategoryIcon />
            <span>Categories</span>
            <span className="bz-nav-chevron" aria-hidden="true">⌄</span>
          </button>
          <Link href="/categories" className="bz-mobile-categories">Categories</Link>
          <Link href="/orders" className="v12-header-bulk" title="My orders">My orders</Link>
          <Link href="/deals" className="v12-header-bulk" title="Real active discounted listings">Deals</Link>

          <Link href="/wishlist" className="bz-icon-link" aria-label="Wishlist" title="Wishlist">
            <HeartIcon />
          </Link>

          <div
            className="bz-account-menu"
            onMouseEnter={() => setAccountOpen(true)}
            onMouseLeave={() => setAccountOpen(false)}
          >
            <button
              type="button"
              className="bz-icon-link bz-account-trigger"
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              title="Account"
              onClick={() => setAccountOpen((value) => !value)}
            >
              <AccountIcon />
            </button>
            {accountOpen ? (
              <div className="bz-account-popover" role="menu">
                <Link href="/account" role="menuitem" onClick={() => setAccountOpen(false)}>Account</Link>
                <Link href="/orders" role="menuitem" onClick={() => setAccountOpen(false)}>Orders</Link>
                <Link href="/account/addresses" role="menuitem" onClick={() => setAccountOpen(false)}>Addresses</Link>
                <Link href="/account/settings" role="menuitem" onClick={() => setAccountOpen(false)}>Settings</Link>
              </div>
            ) : null}
          </div>

          <span className="bz-shop-cart"><CartLink /></span>
        </nav>
      </div>

      {menuOpen && selected ? (
        <div className="bz-mega-wrap" onMouseEnter={() => setMenuOpen(true)}>
          <div className="bz-mega">
            <aside className="bz-mega-rail" aria-label="Shopping categories">
              {categories.map((item) => {
                const active = item.slug === selected.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    className={active ? "is-active" : ""}
                    onMouseEnter={() => setActiveSlug(item.slug)}
                    onFocus={() => setActiveSlug(item.slug)}
                    onClick={() => setActiveSlug(item.slug)}
                  >
                    <span className="bz-mega-icon" aria-hidden="true">◫</span>
                    <span>{item.desktopLabel ?? item.label}</span>
                  </button>
                );
              })}
            </aside>

            <section className="bz-mega-panel" aria-label={`${selected.label} subcategories`}>
              <div className="bz-mega-groups">
                {selected.groups.map((group) => (
                  <div className="bz-mega-group" key={group.slug}>
                    <Link href={productHref(group.query)} className="bz-mega-heading" onClick={() => setMenuOpen(false)}>
                      {group.label}
                    </Link>
                    <div className="bz-mega-links">
                      {group.items.length ? group.items.map((item) => (
                        <Link key={item.slug} href={productHref(item.query)} onClick={() => setMenuOpen(false)}>
                          {item.label}
                        </Link>
                      )) : (
                        <Link href={productHref(group.query)} onClick={() => setMenuOpen(false)}>Browse all</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </header>
  );
}
