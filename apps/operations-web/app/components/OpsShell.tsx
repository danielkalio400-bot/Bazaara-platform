"use client";

import { useEffect, useMemo, useState } from "react";

type Group = "Platform" | "Commerce" | "Mobility" | "Trust & money";

type NavItem = {
  href: string;
  label: string;
  short: string;
  group: Group;
  description: string;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Command center",
    short: "CC",
    group: "Platform",
    description: "Live ecosystem overview",
  },
  {
    href: "/businesses",
    label: "Businesses",
    short: "BZ",
    group: "Platform",
    description: "KYB, activation and merchant administration",
  },
  {
    href: "/access",
    label: "Access & roles",
    short: "RB",
    group: "Platform",
    description: "Employee least-privilege Operations access",
  },
  {
    href: "/reports",
    label: "Reports",
    short: "RP",
    group: "Platform",
    description: "Platform growth, commerce, finance and SLA reporting",
  },
  {
    href: "/audit",
    label: "Audit log",
    short: "AU",
    group: "Platform",
    description: "Who changed what across the control plane",
  },
  {
    href: "/settings",
    label: "Platform settings",
    short: "ST",
    group: "Platform",
    description: "Feature flags and guarded platform configuration",
  },
  {
    href: "/commerce",
    label: "Shopping",
    short: "SH",
    group: "Commerce",
    description: "Orders, fulfillment and seller operations",
  },
  {
    href: "/grocery",
    label: "Grocery",
    short: "GR",
    group: "Commerce",
    description: "Stores, pickers, slots and substitutions",
  },
  {
    href: "/food",
    label: "Food",
    short: "FD",
    group: "Commerce",
    description: "Restaurant operations",
  },
  {
    href: "/pharmacy",
    label: "Pharmacy",
    short: "PH",
    group: "Commerce",
    description: "Regulated pharmacy operations",
  },
  {
    href: "/mobility",
    label: "Mobility",
    short: "MO",
    group: "Mobility",
    description: "Drive + delivery network overview",
  },
  {
    href: "/logistics",
    label: "Go & Logistics",
    short: "GO",
    group: "Mobility",
    description: "Parcel dispatch, funding and courier delivery",
  },
  {
    href: "/drive",
    label: "Drive",
    short: "DR",
    group: "Mobility",
    description: "Rides, drivers and pricing",
  },
  {
    href: "/pay",
    label: "Pay",
    short: "PY",
    group: "Trust & money",
    description: "Wallets, settlements and money movement",
  },
  {
    href: "/risk",
    label: "Risk",
    short: "RK",
    group: "Trust & money",
    description: "Signals, holds and investigations",
  },
  {
    href: "/support",
    label: "Help desk",
    short: "HD",
    group: "Trust & money",
    description: "Tickets, SLA, customer and merchant cases",
  },
  {
    href: "/feedback",
    label: "Feedback",
    short: "FB",
    group: "Trust & money",
    description: "Product feedback, bugs, requests and resolution",
  },
  {
    href: "/support-tools",
    label: "Support tools",
    short: "TL",
    group: "Trust & money",
    description: "Global support queues, shortcuts and service health",
  },
];

const groups: Group[] = [
  "Platform",
  "Commerce",
  "Mobility",
  "Trust & money",
];

export function OpsShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (event.target as HTMLElement | null)?.tagName ?? "",
        )
      ) {
        event.preventDefault();
        setPaletteOpen(true);
      }

      if (event.key === "Escape") {
        setPaletteOpen(false);
        setQuery("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return navItems;

    return navItems.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.group.toLowerCase().includes(term),
    );
  }, [query]);

  const current =
    navItems.find((item) => item.href === active) ?? navItems[0]!;

  return (
    <div className="ops-v31-shell">
      <aside className="ops-v31-sidebar">
        <a className="ops-v31-brand" href="/">
          <span className="ops-v31-brand-mark">B</span>
          <span>
            <strong>BAZAARA</strong>
            <small>OPERATIONS</small>
          </span>
        </a>

        <div className="ops-v31-sidebar-status">
          <span className="ops-v31-live-dot" />
          <div>
            <strong>Employee control plane</strong>
            <small>Protected Operations access</small>
          </div>
        </div>

        <nav className="ops-v31-sidebar-nav" aria-label="Operations modules">
          {groups.map((group) => (
            <div className="ops-v31-nav-group" key={group}>
              <span className="ops-v31-nav-label">{group}</span>

              {navItems
                .filter((item) => item.group === group)
                .map((item) => (
                  <a
                    key={item.href}
                    className={active === item.href ? "active" : ""}
                    href={item.href}
                  >
                    <span className="ops-v31-nav-icon">{item.short}</span>
                    <span className="ops-v31-nav-copy">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </a>
                ))}
            </div>
          ))}
        </nav>

        <div className="ops-v31-sidebar-foot">
          <span>BAZAARA PLATFORM</span>
          <small>Internal employee tooling</small>
        </div>
      </aside>

      <div className="ops-v31-workspace">
        <header className="ops-v31-commandbar">
          <div className="ops-v31-command-context">
            <span>{current.group.toUpperCase()}</span>
            <strong>{current.label}</strong>
          </div>

          <button
            className="ops-v31-search-trigger"
            type="button"
            onClick={() => setPaletteOpen(true)}
          >
            <span>Search Operations</span>
            <kbd>/</kbd>
          </button>

          <div className="ops-v31-command-actions">
            <a href="/businesses">Review businesses</a>
            <a href="/pay">Money movement</a>
            <button
              type="button"
              aria-label="Open command palette"
              onClick={() => setPaletteOpen(true)}
            >
              More
            </button>
          </div>
        </header>

        <div className="ops-v31-mobile-nav">
          {navItems.map((item) => (
            <a
              key={item.href}
              className={active === item.href ? "active" : ""}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>

        {children}
      </div>

      {paletteOpen ? (
        <div
          className="ops-v31-palette-backdrop"
          onMouseDown={() => {
            setPaletteOpen(false);
            setQuery("");
          }}
        >
          <section
            className="ops-v31-palette"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ops-v31-palette-search">
              <span>⌕</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reports, tickets, businesses, risk…"
              />
              <kbd>ESC</kbd>
            </div>

            <div className="ops-v31-palette-results">
              {filtered.map((item) => (
                <a key={item.href} href={item.href}>
                  <span className="ops-v31-nav-icon">{item.short}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>
                      {item.group} · {item.description}
                    </small>
                  </span>
                  <b>→</b>
                </a>
              ))}

              {!filtered.length ? (
                <div className="ops-v31-empty">
                  No Operations module matches that search.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function money(minor: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
