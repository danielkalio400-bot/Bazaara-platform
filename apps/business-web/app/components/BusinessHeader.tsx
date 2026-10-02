"use client";

import { useEffect, useMemo, useState } from "react";

type HeaderOrganization = {
  id: string;
  displayName: string;
  verticals: string[];
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  short: string;
  group: "Workspace" | "Commerce" | "Growth" | "Money & access";
  description: string;
};

const groups: NavItem["group"][] = [
  "Workspace",
  "Commerce",
  "Growth",
  "Money & access",
];

export function BusinessHeader({
  organization,
  organizations,
  organizationId,
  setOrganizationId,
  active,
}: {
  organization?: HeaderOrganization;
  organizations: HeaderOrganization[];
  organizationId: string;
  setOrganizationId: (id: string) => void;
  active: string;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  const verticals = organization?.verticals ?? [];
  const has = (vertical: string) => verticals.includes(vertical);

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      {
        key: "overview",
        href: "/",
        label: "Overview",
        short: "OV",
        group: "Workspace",
        description: "Business command center",
      },
    ];

    if (has("SHOPPING")) {
      items.push({
        key: "shopping",
        href: "/shopping",
        label: "Shopping",
        short: "SH",
        group: "Commerce",
        description: "Catalogue, orders and promotions",
      });
    }

    if (has("GROCERY")) {
      items.push({
        key: "grocery",
        href: "/grocery",
        label: "Grocery",
        short: "GR",
        group: "Commerce",
        description: "Fresh commerce and picking",
      });
    }

    if (has("FOOD")) {
      items.push({
        key: "food",
        href: "/food",
        label: "Food",
        short: "FD",
        group: "Commerce",
        description: "Restaurant operations",
      });
    }

    if (has("PHARMACY")) {
      items.push({
        key: "pharmacy",
        href: "/pharmacy",
        label: "Pharmacy",
        short: "PH",
        group: "Commerce",
        description: "Products, batches and prescriptions",
      });
    }

    if (verticals.length) {
      items.push({
        key: "fulfillment",
        href: "/fulfillment",
        label: "Fulfillment",
        short: "FL",
        group: "Commerce",
        description: "Picking, packing, shipping and returns",
      });

      items.push({
        key: "logistics",
        href: "/logistics",
        label: "Go & logistics",
        short: "GO",
        group: "Commerce",
        description: "Delivery readiness, tracking and Go handoff",
      });

      items.push({
        key: "customers",
        href: "/customers",
        label: "Customers",
        short: "CU",
        group: "Growth",
        description: "Organization-scoped customer activity",
      });

      items.push({
        key: "analytics",
        href: "/analytics",
        label: "Analytics",
        short: "AN",
        group: "Growth",
        description: "Revenue and performance signals",
      });
      items.push(
        {
          key: "revenue",
          href: "/revenue",
          label: "Revenue",
          short: "RV",
          group: "Growth",
          description: "Sales trends, settlements and cash flow",
        },
        {
          key: "reports",
          href: "/reports",
          label: "Reports",
          short: "RP",
          group: "Growth",
          description: "Executive reports, exports and schedules",
        },
      );
    }

    items.push(
      {
        key: "payments",
        href: "/payments",
        label: "Payments",
        short: "PY",
        group: "Money & access",
        description: "Payment activity, invoices and settlements",
      },
      {
        key: "subscriptions",
        href: "/subscriptions",
        label: "Subscriptions",
        short: "SU",
        group: "Money & access",
        description: "Plan, seats, renewal and billing cycle",
      },
      {
        key: "pricing",
        href: "/pricing",
        label: "Pricing",
        short: "PR",
        group: "Money & access",
        description: "Compare Business plans and capabilities",
      },
      {
        key: "finance",
        href: "/finance",
        label: "Finance center",
        short: "FI",
        group: "Money & access",
        description: "Business Pay, settlements and invoices",
      },
      {
        key: "team",
        href: "/team",
        label: "Users & access",
        short: "TM",
        group: "Money & access",
        description: "Users, invitations, roles and permissions",
      },
      {
        key: "support",
        href: "/support",
        label: "Support",
        short: "SP",
        group: "Money & access",
        description: "Cases, conversations and escalation",
      },
      {
        key: "feedback",
        href: "/feedback",
        label: "Feedback",
        short: "FB",
        group: "Money & access",
        description: "Product feedback and improvement requests",
      },
      {
        key: "settings",
        href: "/settings",
        label: "Settings",
        short: "ST",
        group: "Money & access",
        description: "Brand, verification, branches and integrations",
      },
    );

    return items;
  }, [verticals.join("|")]);

  const current =
    navItems.find((item) => item.key === active) ?? {
      key: active,
      href: "/",
      label: "Business",
      short: "BZ",
      group: "Workspace" as const,
      description: "Business workspace",
    };

  const createAction = useMemo(() => {
    if (active === "shopping") {
      return { href: "/shopping/products", label: "Create product" };
    }
    if (active === "grocery") {
      return { href: "/grocery/products", label: "Create product" };
    }
    if (active === "food") {
      return { href: "/food/menu", label: "Create menu item" };
    }
    if (active === "pharmacy") {
      return { href: "/pharmacy/products", label: "Create product" };
    }
    return null;
  }, [active]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return navItems;

    return navItems.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.group.toLowerCase().includes(term),
    );
  }, [navItems, query]);

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

  return (
    <>
      <aside className="business-v34-sidebar">
        <a className="business-v34-brand" href="/">
          <span className="business-v34-brand-mark">B</span>
          <span>
            <strong>BAZAARA</strong>
            <small>BUSINESS</small>
          </span>
        </a>

        <div className="business-v34-org-card">
          <span className="business-v34-live-dot" />
          <div>
            <strong>{organization?.displayName ?? "Business workspace"}</strong>
            <small>
              {verticals.length
                ? `${verticals.length} registered business type${
                    verticals.length === 1 ? "" : "s"
                  }`
                : "Complete business setup"}
            </small>
          </div>
        </div>

        <nav className="business-v34-nav" aria-label="Business workspace">
          {groups.map((group) => {
            const items = navItems.filter((item) => item.group === group);
            if (!items.length) return null;

            return (
              <div className="business-v34-nav-group" key={group}>
                <span className="business-v34-nav-label">{group}</span>

                {items.map((item) => (
                  <a
                    key={item.key}
                    className={active === item.key ? "active" : ""}
                    href={item.href}
                  >
                    <span className="business-v34-nav-icon">{item.short}</span>
                    <span className="business-v34-nav-copy">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </a>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="business-v34-sidebar-actions">
          <a href="/register">+ Add business type</a>
          <small>Only registered services appear in this workspace.</small>
        </div>
      </aside>

      <header className="business-v34-commandbar">
        <div className="business-v34-context">
          <span>{current.group.toUpperCase()}</span>
          <strong>{current.label}</strong>
        </div>

        <button
          className="business-v34-search"
          type="button"
          onClick={() => setPaletteOpen(true)}
        >
          <span>Search Business</span>
          <kbd>/</kbd>
        </button>

        <div className="business-v34-command-actions">
          {createAction ? (
            <a className="business-v34-create" href={createAction.href}>
              + {createAction.label}
            </a>
          ) : null}

          <a href="/register">Add business type</a>

          {organizations.length ? (
            <select
              className="business-v34-org-switch"
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              aria-label="Switch business organization"
            >
              {organizations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </header>

      <div className="business-v34-mobile-nav">
        {navItems.map((item) => (
          <a
            key={item.key}
            className={active === item.key ? "active" : ""}
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </div>

      {paletteOpen ? (
        <div
          className="business-v34-palette-backdrop"
          onMouseDown={() => {
            setPaletteOpen(false);
            setQuery("");
          }}
        >
          <section
            className="business-v34-palette"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="business-v34-palette-search">
              <span>⌕</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search revenue, reports, payments, users…"
              />
              <kbd>ESC</kbd>
            </div>

            <div className="business-v34-palette-results">
              {filtered.map((item) => (
                <a key={item.key} href={item.href}>
                  <span className="business-v34-nav-icon">{item.short}</span>
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
                <div className="business-v34-empty">
                  No Business section matches that search.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
