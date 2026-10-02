"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeaderStandalone } from "../components/BusinessHeaderStandalone";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

type Branch = {
  id: string;
  name: string;
  code: string;
  status: string;
  timezone: string;
  address: unknown;
};

type BusinessPay = {
  linked: boolean;
  availableMinor: number;
  currency: string;
};

type SupportCase = {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  lastActivityAt: string;
};

function addressLabel(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Location not configured";
  const row = value as Record<string, unknown>;
  return [row.label, row.addressLine1, row.city, row.state]
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .join(", ") || "Location configured";
}

export default function BusinessLogisticsPage() {
  const business = useBusinessOrganizations();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pay, setPay] = useState<BusinessPay | null>(null);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!business.organizationId) return;
    try {
      const [branchResult, payResult, supportResult] = await Promise.all([
        businessRequest<{ branches: Branch[] }>(
          `/v1/business/organizations/${business.organizationId}/branches`,
        ),
        businessRequest<BusinessPay>(
          `/v1/business/organizations/${business.organizationId}/pay`,
        ),
        businessRequest<{ cases: SupportCase[] }>(
          `/v1/business/organizations/${business.organizationId}/support/cases`,
        ),
      ]);
      setBranches(branchResult.branches);
      setPay(payResult);
      setCases(supportResult.cases.filter((item) => ["DELIVERY", "LOGISTICS", "GO"].includes(item.category)));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Go & Logistics workspace.");
    }
  }, [business.organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const readiness = useMemo(() => {
    const active = branches.filter((branch) => branch.status === "ACTIVE");
    const located = active.filter((branch) => {
      if (!branch.address || typeof branch.address !== "object" || Array.isArray(branch.address)) return false;
      const row = branch.address as Record<string, unknown>;
      return typeof row.latitude === "number" && typeof row.longitude === "number";
    });
    return {
      total: branches.length,
      active: active.length,
      located: located.length,
      ready: active.length > 0 && located.length === active.length && Boolean(pay?.linked),
    };
  }, [branches, pay?.linked]);

  return (
    <div className="business-control-shell">
      <BusinessHeaderStandalone active="logistics" />
      <main className="business-control-main">
        <section className="business-v4-logistics-hero">
          <div>
            <span className="business-kicker">GO · BUSINESS</span>
            <h1>Delivery readiness without leaving Business.</h1>
            <p>
              Branch pickup locations, Business Pay settlement readiness, fulfillment handoff
              and support context stay connected to the same organization.
            </p>
          </div>
          <div className={readiness.ready ? "ready" : "setup"}>
            <span>{readiness.ready ? "READY FOR GO" : "SETUP REQUIRED"}</span>
            <strong>{readiness.ready ? "Connected" : "Check branches"}</strong>
          </div>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}

        <section className="business-control-kpis business-control-kpis-v3">
          <article><span>BRANCHES</span><strong>{readiness.total}</strong><small>{readiness.active} active</small></article>
          <article><span>PINNED LOCATIONS</span><strong>{readiness.located}</strong><small>latitude/longitude ready</small></article>
          <article><span>BUSINESS PAY</span><strong>{pay?.linked ? "LINKED" : "NOT LINKED"}</strong><small>settlement rail</small></article>
          <article><span>GO SUPPORT</span><strong>{cases.length}</strong><small>delivery-related cases</small></article>
        </section>

        <div className="business-v4-logistics-grid">
          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">PICKUP NETWORK</span>
                <h2>Operating locations</h2>
              </div>
              <a className="business-text-link" href="/settings">Manage branches</a>
            </div>
            <div className="business-v4-branch-list">
              {branches.length ? branches.map((branch) => (
                <article key={branch.id}>
                  <div>
                    <span className="business-soft-pill">{branch.status}</span>
                    <strong>{branch.name}</strong>
                    <small>{branch.code} · {branch.timezone}</small>
                    <p>{addressLabel(branch.address)}</p>
                  </div>
                  <div className="business-v4-readiness">
                    <b>{addressLabel(branch.address) === "Location not configured" ? "PIN NEEDED" : "LOCATION READY"}</b>
                    <small>Go pickup eligibility uses this branch location.</small>
                  </div>
                </article>
              )) : <div className="business-empty-state">Add your first branch in Settings to activate Go pickup readiness.</div>}
            </div>
          </section>

          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">MONEY FLOW</span>
                <h2>Business Pay connection</h2>
              </div>
              <a className="business-text-link" href="/finance">Open Finance</a>
            </div>
            <div className="business-v4-pay-link">
              <strong>{pay?.linked ? "Settlement rail connected" : "Connect Business Pay"}</strong>
              <p>
                Go-related merchant settlements and approved payouts use the same Business Pay
                organization wallet instead of a separate balance.
              </p>
              <a href="/finance">{pay?.linked ? "Review wallet & settlements" : "Connect Business Pay"}</a>
            </div>
          </section>

          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">EXECUTION</span>
                <h2>Fulfillment handoff</h2>
              </div>
              <a className="business-text-link" href="/fulfillment">Open fulfillment</a>
            </div>
            <div className="business-v4-flow">
              <span>Order accepted</span><b>→</b><span>Prepared / packed</span><b>→</b>
              <span>Ready for Go</span><b>→</b><span>Courier pickup</span><b>→</b><span>Delivered</span>
            </div>
            <p className="business-muted">
              Shopping, Grocery, Food and Pharmacy retain their own operational rules. GO owns the final-mile courier handoff.
            </p>
          </section>

          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">RESOLUTION</span>
                <h2>Go & delivery support</h2>
              </div>
              <a className="business-text-link" href="/support">Support center</a>
            </div>
            {cases.length ? cases.slice(0, 5).map((item) => (
              <article className="business-v4-mini-case" key={item.id}>
                <div><strong>{item.subject}</strong><small>{item.category} · {item.priority}</small></div>
                <span>{item.status.replaceAll("_", " ")}</span>
              </article>
            )) : <div className="business-empty-state">No Go or Logistics support cases are open.</div>}
          </section>
        </div>
      </main>
    </div>
  );
}
