"use client";

import { useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

type VerticalStats = { orders: number; grossMinor: number };
type AnalyticsData = {
  currency: string;
  totals: { orders: number; open: number; grossMinor: number };
  verticals: Record<"SHOPPING" | "FOOD" | "GROCERY" | "PHARMACY", VerticalStats>;
};

const LABELS: Record<string, string> = {
  SHOPPING: "Shopping",
  FOOD: "Food",
  GROCERY: "Grocery",
  PHARMACY: "Pharmacy",
};

function money(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export default function Analytics() {
  const business = useBusinessOrganizations();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!business.organizationId) return;
    setLoading(true);
    businessRequest<AnalyticsData>(
      `/v1/business/advanced/organizations/${business.organizationId}/analytics`,
    )
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Could not load analytics");
      })
      .finally(() => setLoading(false));
  }, [business.organizationId]);

  const rows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.verticals)
      .map(([key, value]) => ({ key, ...value }))
      .filter((item) => business.organization?.verticals.includes(item.key))
      .sort((a, b) => b.grossMinor - a.grossMinor);
  }, [data, business.organization?.verticals]);

  const maxGross = Math.max(1, ...rows.map((row) => row.grossMinor));
  const averageOrder = data && data.totals.orders > 0
    ? Math.round(data.totals.grossMinor / data.totals.orders)
    : 0;
  const fulfilled = data ? Math.max(0, data.totals.orders - data.totals.open) : 0;

  return (
    <div className="business-control-shell">
      <BusinessHeader
        organization={business.organization}
        organizations={business.organizations}
        organizationId={business.organizationId}
        setOrganizationId={business.setOrganizationId}
        active="analytics"
      />

      <main className="business-control-main">
        <section className="business-page-heading business-page-heading-v3">
          <div>
            <span className="business-kicker">ANALYTICS</span>
            <h1>Know what is moving the business.</h1>
            <p>Real organization-scoped orders and delivered sales, separated by your registered business types.</p>
          </div>
          <div className="business-page-badge">LIVE DATA</div>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}

        <section className="business-control-kpis business-control-kpis-v3">
          <article><span>GROSS SALES</span><strong>{money(data?.totals.grossMinor ?? 0, data?.currency)}</strong><small>delivered commerce</small></article>
          <article><span>ORDERS</span><strong>{data?.totals.orders ?? 0}</strong><small>all loaded orders</small></article>
          <article><span>OPEN</span><strong>{data?.totals.open ?? 0}</strong><small>orders still in progress</small></article>
          <article><span>AVG. ORDER</span><strong>{money(averageOrder, data?.currency)}</strong><small>gross ÷ orders</small></article>
        </section>

        <div className="business-analytics-grid">
          <section className="business-panel business-analytics-primary">
            <div className="business-section-heading">
              <div><span className="business-kicker">VERTICAL PERFORMANCE</span><h2>Revenue contribution</h2></div>
              <span className="business-soft-pill">{loading ? "Refreshing…" : `${rows.length} active`}</span>
            </div>
            <div className="business-analytics-bars">
              {rows.length ? rows.map((row) => (
                <article key={row.key}>
                  <div className="business-analytics-bar-head">
                    <div><strong>{LABELS[row.key] ?? row.key}</strong><small>{row.orders} orders</small></div>
                    <strong>{money(row.grossMinor, data?.currency)}</strong>
                  </div>
                  <div className="business-analytics-track"><i style={{ width: `${Math.max(4, (row.grossMinor / maxGross) * 100)}%` }} /></div>
                </article>
              )) : <div className="business-empty-state">No delivered commerce yet.</div>}
            </div>
          </section>

          <aside className="business-panel business-analytics-summary">
            <span className="business-kicker">ORDER HEALTH</span>
            <h2>Current execution</h2>
            <div className="business-donut-stat"><strong>{data?.totals.orders ? Math.round((fulfilled / data.totals.orders) * 100) : 0}%</strong><span>not currently open</span></div>
            <div className="business-mini-stat"><span>Fulfilled / terminal</span><strong>{fulfilled}</strong></div>
            <div className="business-mini-stat"><span>Open workload</span><strong>{data?.totals.open ?? 0}</strong></div>
            <a className="business-secondary-button" href="/fulfillment">Open fulfillment</a>
          </aside>
        </div>

        <section className="business-panel business-insight-panel">
          <div>
            <span className="business-kicker">NEXT ACTION</span>
            <h2>{rows[0] ? `${LABELS[rows[0].key] ?? rows[0].key} currently contributes the most delivered revenue.` : "Start fulfilling orders to build performance history."}</h2>
          </div>
          <div className="business-insight-actions"><a href="/customers">Customer activity</a><a href="/finance">Finance & settlements</a></div>
        </section>
      </main>
    </div>
  );
}
