"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

type RevenueData = {
  currency: string;
  range: { days: number; since: string; generatedAt: string };
  totals: {
    grossMinor: number;
    orders: number;
    averageOrderMinor: number;
    settledNetMinor: number;
    pendingSettlementMinor: number;
    outstandingInvoiceMinor: number;
  };
  verticals: Record<string, { orders: number; grossMinor: number }>;
  timeline: Array<{ date: string; grossMinor: number; orders: number }>;
  settlements: Array<{ id: string; reference: string; status: string; grossMinor: number; feeMinor: number; netMinor: number; createdAt: string }>;
};

const label: Record<string, string> = { SHOPPING: "Shopping", GROCERY: "Grocery", FOOD: "Food", PHARMACY: "Pharmacy" };
const money = (minor = 0, currency = "NGN") => new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);

export default function RevenuePage() {
  const business = useBusinessOrganizations();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<RevenueData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!business.organizationId) return;
    setLoading(true);
    try {
      const result = await businessRequest<RevenueData>(`/v1/business/organizations/${business.organizationId}/management/revenue?days=${days}`);
      setData(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load revenue dashboard");
    } finally {
      setLoading(false);
    }
  }, [business.organizationId, days]);

  useEffect(() => { void load(); }, [load]);

  const maxPoint = Math.max(1, ...(data?.timeline.map((point) => point.grossMinor) ?? [1]));
  const activeVerticals = useMemo(() => Object.entries(data?.verticals ?? {}).filter(([key]) => business.organization?.verticals.includes(key)), [data, business.organization?.verticals]);
  const maxVertical = Math.max(1, ...activeVerticals.map(([, value]) => value.grossMinor));

  return <div className="business-control-shell">
    <BusinessHeader organization={business.organization} organizations={business.organizations} organizationId={business.organizationId} setOrganizationId={business.setOrganizationId} active="revenue" />
    <main className="business-control-main biz-mgmt-main">
      <section className="business-page-heading business-page-heading-v3 biz-mgmt-heading">
        <div><span className="business-kicker">REVENUE COMMAND CENTER</span><h1>Sales, cash flow and settlement visibility.</h1><p>Delivered commerce, settlement movement and outstanding receivables in one organization-scoped view.</p></div>
        <div className="biz-mgmt-actions"><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 12 months</option></select><button onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
      </section>
      {error ? <div className="business-alert">{error}</div> : null}

      <section className="biz-mgmt-kpis">
        <article><span>GROSS REVENUE</span><strong>{money(data?.totals.grossMinor, data?.currency)}</strong><small>{data?.totals.orders ?? 0} delivered orders</small></article>
        <article><span>AVG. ORDER VALUE</span><strong>{money(data?.totals.averageOrderMinor, data?.currency)}</strong><small>delivered commerce average</small></article>
        <article><span>SETTLED NET</span><strong>{money(data?.totals.settledNetMinor, data?.currency)}</strong><small>completed settlement value</small></article>
        <article className={(data?.totals.pendingSettlementMinor ?? 0) > 0 ? "attention" : ""}><span>PENDING SETTLEMENT</span><strong>{money(data?.totals.pendingSettlementMinor, data?.currency)}</strong><small>awaiting completion</small></article>
        <article><span>OUTSTANDING INVOICES</span><strong>{money(data?.totals.outstandingInvoiceMinor, data?.currency)}</strong><small>unpaid or unvoided invoices</small></article>
      </section>

      <div className="biz-mgmt-grid two-one">
        <section className="business-panel biz-chart-panel">
          <div className="business-section-heading"><div><span className="business-kicker">TREND</span><h2>Delivered revenue</h2></div><span className="business-soft-pill">{days} DAYS</span></div>
          <div className="biz-bar-chart" aria-label="Revenue timeline">
            {(data?.timeline ?? []).map((point) => <div key={point.date} className="biz-bar-column" title={`${point.date}: ${money(point.grossMinor, data?.currency)}`}><i style={{ height: `${Math.max(point.grossMinor ? 6 : 2, (point.grossMinor / maxPoint) * 100)}%` }} /><span>{days <= 30 ? point.date.slice(8) : point.date.slice(5)}</span></div>)}
          </div>
          {!data?.timeline.length ? <div className="business-empty-state">Revenue history will appear after delivered orders.</div> : null}
        </section>

        <aside className="business-panel">
          <div className="business-section-heading"><div><span className="business-kicker">MIX</span><h2>Revenue by business type</h2></div></div>
          <div className="biz-rank-list">{activeVerticals.map(([key, value]) => <article key={key}><div><strong>{label[key] ?? key}</strong><small>{value.orders} delivered orders</small></div><b>{money(value.grossMinor, data?.currency)}</b><div className="biz-progress"><i style={{ width: `${Math.max(3, (value.grossMinor / maxVertical) * 100)}%` }} /></div></article>)}</div>
        </aside>
      </div>

      <section className="business-panel biz-mgmt-table-panel">
        <div className="business-section-heading"><div><span className="business-kicker">SETTLEMENTS</span><h2>Recent settlement movement</h2></div><a className="business-secondary-button" href="/payments">Open payments</a></div>
        <div className="biz-table-wrap"><table><thead><tr><th>Reference</th><th>Status</th><th>Gross</th><th>Fees</th><th>Net</th><th>Created</th></tr></thead><tbody>{(data?.settlements ?? []).map((item) => <tr key={item.id}><td><strong>{item.reference}</strong></td><td><span className={`biz-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td>{money(item.grossMinor, data?.currency)}</td><td>{money(item.feeMinor, data?.currency)}</td><td><strong>{money(item.netMinor, data?.currency)}</strong></td><td>{new Date(item.createdAt).toLocaleDateString("en-NG")}</td></tr>)}</tbody></table>{!data?.settlements.length ? <div className="business-empty-state">No settlements in this period.</div> : null}</div>
      </section>
    </main>
  </div>;
}
