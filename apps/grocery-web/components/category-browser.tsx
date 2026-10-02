"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./category-browser.module.css";

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
type ResponseBody = { categories: ParentCategory[] };
type ProductImage = { url?: string | null } | null;
type Product = { image?: ProductImage; media?: Array<{ url?: string | null }> };
type ProductResponse = { products?: Product[] };

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
const imageCache = new Map<string, string | null>();

function productHref(query: string) {
  return `/?${new URLSearchParams({ q: query }).toString()}#catalogue`;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.8" />
      <path d="m16.2 16.2 4.1 4.1" />
    </svg>
  );
}

function LensIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.1 6.3 9.3 4.5h5.4l1.2 1.8h2.7a2.4 2.4 0 0 1 2.4 2.4v8.1a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 16.8V8.7a2.4 2.4 0 0 1 2.4-2.4h2.7Z" />
      <circle cx="12" cy="12.8" r="3.5" />
    </svg>
  );
}

function fallbackLabel(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BZ";
}

export function CategoryBrowser() {
  const [categories, setCategories] = useState<ParentCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<Record<string, string | null>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    void fetch(`${API}/v1/shopping/category-navigation`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as ResponseBody | null;
        if (!response.ok || !body?.categories) throw new Error("Could not load categories");
        if (!active) return;
        const visible = body.categories.filter((item) => item.mobile !== false);
        setCategories(visible);
        setActiveSlug((current) => current || visible[0]?.slug || "");
      })
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : "Could not load categories"));
    return () => { active = false; };
  }, []);

  const selected = useMemo(
    () => categories.find((item) => item.slug === activeSlug) ?? categories[0],
    [activeSlug, categories]
  );

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const leaves = selected.groups.flatMap((group) => group.items);
    const queue = leaves.filter((item) => !requested.current.has(item.slug));
    queue.forEach((item) => requested.current.add(item.slug));

    async function resolve(item: Leaf) {
      if (imageCache.has(item.slug)) return imageCache.get(item.slug) ?? null;
      try {
        const params = new URLSearchParams({ q: item.query, sort: "featured", page: "1", limit: "1" });
        const response = await fetch(`${API}/v1/shopping/products?${params.toString()}`, { cache: "no-store" });
        const body = (await response.json().catch(() => null)) as ProductResponse | null;
        const first = body?.products?.[0];
        const image = first?.image?.url ?? first?.media?.[0]?.url ?? null;
        imageCache.set(item.slug, image);
        return image;
      } catch {
        imageCache.set(item.slug, null);
        return null;
      }
    }

    async function worker(items: Leaf[]) {
      while (items.length) {
        const item = items.shift();
        if (!item) return;
        const image = await resolve(item);
        if (!cancelled) setImages((current) => ({ ...current, [item.slug]: image }));
      }
    }

    const work = [...queue];
    void Promise.all([worker(work), worker(work), worker(work)]);
    return () => { cancelled = true; };
  }, [selected]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    window.location.assign(value ? productHref(value) : "/");
  }

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link href="/" className={styles.back} aria-label="Back to Grocery">‹</Link>
        <form className={styles.search} role="search" onSubmit={submit}>
          <span className={styles.searchIcon} aria-hidden="true"><SearchIcon /></span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search on Bazaara"
            aria-label="Search on Bazaara"
          />
          <Link href="/bazlens" className={styles.lensButton} aria-label="Open Baz Lens" title="Baz Lens"><LensIcon /></Link>
        </form>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.browser}>
        <aside className={styles.rail} aria-label="Grocery categories">
          {categories.map((item) => {
            const active = item.slug === selected?.slug;
            return (
              <button
                key={item.slug}
                type="button"
                className={active ? styles.railActive : ""}
                onClick={() => setActiveSlug(item.slug)}
              >
                {item.label}
              </button>
            );
          })}
        </aside>

        <section className={styles.detail} aria-live="polite">
          {selected ? (
            <>
              <Link href={productHref(selected.query)} className={styles.allProducts}>
                <span>All Products</span><span>›</span>
              </Link>

              {selected.groups.map((group) => (
                <article className={styles.group} key={group.slug}>
                  <div className={styles.groupHead}>
                    <h2>{group.label}</h2>
                    {group.items.length ? <Link href={productHref(group.query)}>See All</Link> : null}
                  </div>

                  {group.items.length ? (
                    <div className={styles.grid}>
                      {group.items.map((item) => (
                        <Link key={item.slug} href={productHref(item.query)} className={styles.tile}>
                          <span className={styles.media}>
                            {images[item.slug] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={images[item.slug] ?? ""} alt="" />
                            ) : (
                              <span className={styles.fallback}>{fallbackLabel(item.label)}</span>
                            )}
                          </span>
                          <span className={styles.tileLabel}>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link href={productHref(group.query)} className={styles.emptyGroup}>
                      <span>{group.label}</span><span>›</span>
                    </Link>
                  )}
                </article>
              ))}
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
