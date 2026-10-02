"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

type Schedule = { id: string; name: string; reportType: string; frequency: string; recipients: string[]; active: boolean; nextRunAt: string | null; lastRunAt: string | null };
type Reports = {
  generatedAt: string;
  range: { days: number; since: string };
  currency: string;
  summary: { grossMinor: number; deliveredOrders: number; averageOrderMinor: number; settlementGrossMinor: number; settlementFeesMinor: number; settlementNetMinor: number; outstandingInvoiceMinor: number; openSupportCases: number; urgentSupportCases: number; activeMembers: number; activeBranches: number };
  invoices: Array<{ id: string; invoiceNumber: string; customerName: string; totalMinor: number; status: string; createdAt: string; dueAt: string | null }>;
  settlements: Array<{ id: string; reference: string; netMinor: number; feeMinor: number; status: string; createdAt: string }>;
  support: { total: number; open: number; resolved: number };
  schedules: Schedule[];
};

const money = (minor = 0, currency = "NGN") => new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
function download(name: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const business = useBusinessOrganizations();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState("");
  const [form, setForm] = useState({ name: "Monthly executive report", reportType: "EXECUTIVE", frequency: "MONTHLY", recipients: "" });

  const load = useCallback(async () => {
    if (!business.organizationId) return;
    try { setData(await businessRequest<Reports>(`/v1/business/organizations/${business.organizationId}/management/reports?days=${days}`)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load reports"); }
  }, [business.organizationId, days]);
  useEffect(() => { void load(); }, [load]);

  const summaryRows = useMemo(() => data ? [
    ["Metric", "Value"], ["Period days", days], ["Gross revenue", data.summary.grossMinor / 100], ["Delivered orders", data.summary.deliveredOrders], ["Average order", data.summary.averageOrderMinor / 100], ["Settlement gross", data.summary.settlementGrossMinor / 100], ["Settlement fees", data.summary.settlementFeesMinor / 100], ["Settlement net", data.summary.settlementNetMinor / 100], ["Outstanding invoices", data.summary.outstandingInvoiceMinor / 100], ["Open support cases", data.summary.openSupportCases], ["Active users", data.summary.activeMembers], ["Active branches", data.summary.activeBranches],
  ] : [], [data, days]);

  async function createSchedule(event: FormEvent) {
    event.preventDefault(); if (!business.organizationId) return; setBusy("schedule");
    try {
      const recipients = form.recipients.split(/[;,\n]/).map((v) => v.trim()).filter(Boolean);
      const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/organizations/${business.organizationId}/management/report-schedules`, "POST", { ...form, recipients });
      setNotice(result.actionState === "ALREADY_DONE" ? "✓ An identical active report schedule already exists. Nothing was duplicated." : "Report schedule created."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create schedule"); } finally { setBusy(""); }
  }
  async function toggle(schedule: Schedule) {
    if (!business.organizationId) return; setBusy(schedule.id);
    try { const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/organizations/${business.organizationId}/management/report-schedules/${schedule.id}`, "PATCH", { active: !schedule.active }); setNotice(result.actionState === "ALREADY_DONE" ? "✓ Schedule state was already current on the server." : `Schedule ${schedule.active ? "paused" : "resumed"}.`); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update schedule"); } finally { setBusy(""); }
  }
  async function remove(schedule: Schedule) {
    if (!business.organizationId || !confirm(`Delete ${schedule.name}?`)) return; setBusy(schedule.id);
    try { await businessRequest(`/v1/business/organizations/${business.organizationId}/management/report-schedules/${schedule.id}`, "DELETE"); setNotice("Schedule removed."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove schedule"); } finally { setBusy(""); }
  }

  return <div className="business-control-shell">
    <BusinessHeader organization={business.organization} organizations={business.organizations} organizationId={business.organizationId} setOrganizationId={business.setOrganizationId} active="reports" />
    <main className="business-control-main biz-mgmt-main">
      <section className="business-page-heading business-page-heading-v3 biz-mgmt-heading"><div><span className="business-kicker">REPORTING</span><h1>Executive reports without spreadsheet hunting.</h1><p>Export finance and operating data, then schedule recurring summaries for the people who need them.</p></div><div className="biz-mgmt-actions"><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>12 months</option></select></div></section>
      {error ? <div className="business-alert">{error}</div> : null}{notice ? <div className="business-notice">{notice}</div> : null}
      <section className="biz-mgmt-kpis"><article><span>GROSS</span><strong>{money(data?.summary.grossMinor, data?.currency)}</strong><small>{data?.summary.deliveredOrders ?? 0} delivered orders</small></article><article><span>SETTLEMENT NET</span><strong>{money(data?.summary.settlementNetMinor, data?.currency)}</strong><small>{money(data?.summary.settlementFeesMinor, data?.currency)} fees</small></article><article><span>OUTSTANDING</span><strong>{money(data?.summary.outstandingInvoiceMinor, data?.currency)}</strong><small>invoice receivables</small></article><article><span>SUPPORT</span><strong>{data?.summary.openSupportCases ?? 0}</strong><small>{data?.summary.urgentSupportCases ?? 0} urgent</small></article></section>

      <section className="business-panel biz-report-export">
        <div className="business-section-heading"><div><span className="business-kicker">EXPORT CENTER</span><h2>Download clean data</h2></div></div>
        <div className="biz-export-grid">
          <button onClick={() => download(`bazaara-executive-${days}d.csv`, summaryRows)}><strong>Executive summary</strong><span>Revenue, settlements, support, users and branches.</span><b>Download CSV →</b></button>
          <button onClick={() => download("bazaara-invoices.csv", [["Invoice", "Customer", "Total NGN", "Status", "Created", "Due"], ...(data?.invoices ?? []).map((x) => [x.invoiceNumber, x.customerName, x.totalMinor / 100, x.status, x.createdAt, x.dueAt ?? ""])])}><strong>Invoice report</strong><span>Receivables and invoice status history.</span><b>Download CSV →</b></button>
          <button onClick={() => download("bazaara-settlements.csv", [["Reference", "Net NGN", "Fees NGN", "Status", "Created"], ...(data?.settlements ?? []).map((x) => [x.reference, x.netMinor / 100, x.feeMinor / 100, x.status, x.createdAt])])}><strong>Settlement report</strong><span>Payout value, fees and settlement status.</span><b>Download CSV →</b></button>
        </div>
      </section>

      <div className="biz-mgmt-grid two-one">
        <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">SCHEDULES</span><h2>Recurring delivery</h2></div></div><div className="biz-schedule-list">{(data?.schedules ?? []).map((schedule) => <article key={schedule.id}><div><strong>{schedule.name}</strong><small>{schedule.reportType} · {schedule.frequency} · {schedule.recipients.join(", ")}</small><span>Next: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString("en-NG") : "Not scheduled"}</span></div><div><span className={`biz-status ${schedule.active ? "active" : "paused"}`}>{schedule.active ? "ACTIVE" : "PAUSED"}</span><button disabled={busy === schedule.id} onClick={() => void toggle(schedule)}>{schedule.active ? "Pause" : "Resume"}</button><button className="danger" disabled={busy === schedule.id} onClick={() => void remove(schedule)}>Delete</button></div></article>)}{!data?.schedules.length ? <div className="business-empty-state">No scheduled reports yet.</div> : null}</div></section>
        <aside className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">NEW SCHEDULE</span><h2>Automate reporting</h2></div></div><form className="biz-stack-form" onSubmit={createSchedule}><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label>Report<select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}><option>EXECUTIVE</option><option>REVENUE</option><option>SETTLEMENTS</option><option>INVOICES</option><option>SUPPORT</option></select></label><label>Frequency<select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}><option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option><option>QUARTERLY</option></select></label><label>Recipients<textarea required value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder="finance@company.com, owner@company.com" /></label><button className="business-primary-button" disabled={busy === "schedule"}>{busy === "schedule" ? "Creating…" : "Create schedule"}</button></form></aside>
      </div>
    </main>
  </div>;
}
