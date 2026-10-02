"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { OpsShell, money } from "../components/OpsShell";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const api = createApiClient({ baseUrl: API, credentials: "include" });

type Delivery = {
  id: string;
  publicCode: string;
  trackingCode: string;
  status: string;
  assignedCourierUserId: string | null;
  scheduledFor: string | null;
  serviceLevel: string;
  distanceMeters: number | null;
  etaMinutes: number;
  amountMinor: number;
  currency: string;
  fundingStatus?: string;
  amountPaidMinor?: number;
  platformFeeBps?: number;
  platformFeeMinor?: number;
  courierPayoutMinor?: number;
  attemptCount?: number;
  lastCourierLocation?: unknown;
  createdAt: string;
  completedAt: string | null;
};

type MobilityResponse = {
  kpis: {
    activeRides: number;
    onlineDrivers: number;
    pendingDrivers: number;
    activeDeliveries: number;
    unassignedDeliveries: number;
  };
  deliveries: Delivery[];
};

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export default function OperationsLogisticsPage() {
  const [data, setData] = useState<MobilityResponse | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.get<MobilityResponse>("/v1/operations/mobility"));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Logistics operations.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const deliveries = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.deliveries ?? []).filter((item) => {
      if (status && item.status !== status) return false;
      if (!term) return true;
      return [item.publicCode, item.trackingCode, item.status, item.assignedCourierUserId ?? ""]
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [data?.deliveries, q, status]);

  const metrics = useMemo(() => ({
    active: (data?.deliveries ?? []).filter((item) => !["DELIVERED", "RETURNED", "CANCELLED"].includes(item.status)).length,
    unassigned: (data?.deliveries ?? []).filter((item) => item.status === "CONFIRMED" && !item.assignedCourierUserId).length,
    funded: (data?.deliveries ?? []).filter((item) => item.fundingStatus === "FUNDED").length,
    settled: (data?.deliveries ?? []).filter((item) => item.fundingStatus === "SETTLED").length,
    exceptions: (data?.deliveries ?? []).filter((item) => ["FAILED", "RETURNING"].includes(item.status)).length,
  }), [data?.deliveries]);

  async function requeue(item: Delivery) {
    setBusy(`requeue:${item.id}`);
    try {
      const result = await api.post<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/operations/logistics/${item.id}/requeue`, {});
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${item.publicCode} was already back in the courier offer pool.` : `${item.publicCode} returned to the courier offer pool.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not requeue parcel.");
    } finally {
      setBusy("");
    }
  }

  async function contact(item: Delivery) {
    const subject = window.prompt("Support case subject", `GO delivery ${item.publicCode}`);
    if (!subject) return;
    const message = window.prompt("Message to the customer / case context", `Operations is reviewing ${item.publicCode}.`);
    if (!message) return;
    setBusy(`support:${item.id}`);
    try {
      const result = await api.post<{ case: { id: string }; actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/operations/logistics/${item.id}/support-case`, {
        subject,
        message,
        priority: ["FAILED", "RETURNING"].includes(item.status) ? "URGENT" : "HIGH",
      });
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ An open support case already exists for ${item.publicCode}.` : `Support case opened for ${item.publicCode}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open support case.");
    } finally {
      setBusy("");
    }
  }

  return (
    <OpsShell active="/logistics">
      <main className="ops-v31-main">
        <section className="ops-v33-domain-hero mobility">
          <div>
            <span className="ops-v31-kicker">GO · LOGISTICS OPERATIONS</span>
            <h1>Funded parcels, couriers and exceptions.</h1>
            <p>
              Every parcel stays visible from advance funding through courier assignment,
              pickup verification, delivery, settlement, failure and return.
            </p>
          </div>
          <div className="ops-v33-hero-stat">
            <span>ACTIVE DELIVERIES</span>
            <strong>{metrics.active}</strong>
            <small>{metrics.unassigned} waiting for courier</small>
          </div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <section className="ops-v31-command-kpis">
          <article><span>ACTIVE</span><strong>{metrics.active}</strong><small>open parcel jobs</small></article>
          <article className={metrics.unassigned ? "attention" : ""}><span>UNASSIGNED</span><strong>{metrics.unassigned}</strong><small>courier needed</small></article>
          <article><span>FUNDED</span><strong>{metrics.funded}</strong><small>advance-paid escrow</small></article>
          <article><span>SETTLED</span><strong>{metrics.settled}</strong><small>courier payout posted</small></article>
          <article className={metrics.exceptions ? "attention" : ""}><span>EXCEPTIONS</span><strong>{metrics.exceptions}</strong><small>failed / returning</small></article>
        </section>

        <div className="ops-v33-toolbar">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Public code, tracking, courier or status" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {["CONFIRMED","ASSIGNED","PICKED_UP","IN_TRANSIT","DELIVERED","FAILED","RETURNING","RETURNED","CANCELLED"].map((item)=><option key={item}>{item}</option>)}
          </select>
          <button disabled={refreshing} onClick={() => void (async () => { setRefreshing(true); try { await load(); setNotice("✓ Logistics data refreshed from the server."); } finally { setRefreshing(false); } })()}>{refreshing ? "Refreshing…" : "Refresh"}</button>
        </div>

        <section className="ops-v31-panel">
          <div className="ops-v31-section-head">
            <div><span className="ops-v31-kicker">PARCEL NETWORK</span><h2>Delivery control</h2></div>
            <span className="ops-v31-soft-chip">{deliveries.length} visible</span>
          </div>

          <div className="ops-v4-logistics-table">
            <div className="head">
              <span>Parcel</span><span>Status</span><span>Funding</span><span>Courier</span><span>Economics</span><span>Actions</span>
            </div>
            {deliveries.map((item) => (
              <article key={item.id}>
                <div><strong>{item.publicCode}</strong><small>{item.trackingCode} · {item.serviceLevel}</small></div>
                <div><b>{label(item.status)}</b><small>{item.attemptCount ?? 0} failed attempts</small></div>
                <div><b>{label(item.fundingStatus ?? "UNFUNDED")}</b><small>{money(item.amountPaidMinor ?? item.amountMinor, item.currency)}</small></div>
                <div><strong>{item.assignedCourierUserId ? "Assigned" : "Unassigned"}</strong><small>{item.assignedCourierUserId ?? "Offer pool"}</small></div>
                <div><strong>{money(item.courierPayoutMinor ?? 0, item.currency)}</strong><small>fee {money(item.platformFeeMinor ?? 0, item.currency)}</small></div>
                <div className="actions">
                  <button onClick={() => void contact(item)} disabled={busy === `support:${item.id}`}>Contact / case</button>
                  {item.status === "ASSIGNED" ? <button onClick={() => void requeue(item)} disabled={busy === `requeue:${item.id}`}>Requeue</button> : null}
                  <a href={`/support?q=${encodeURIComponent(item.publicCode)}`}>Support</a>
                </div>
              </article>
            ))}
            {!deliveries.length ? <div className="ops-v31-empty">No Logistics deliveries match these filters.</div> : null}
          </div>
        </section>
      </main>
    </OpsShell>
  );
}
