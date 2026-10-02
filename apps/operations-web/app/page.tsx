"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { OpsShell } from "./components/OpsShell";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const api = createApiClient({
  baseUrl: API,
  credentials: "include",
});

type Data = {
  generatedAt: string;
  totals: {
    users: number;
    organizations: number;
    merchants: number;
  };
  verticals?: Record<string, number>;
  workload: {
    shoppingOpen: number;
    groceryOpen: number;
    foodOpen: number;
    pharmacyOpen: number;
    driveOpen: number;
    logisticsOpen: number;
    supportOpen: number;
    riskOpen: number;
  };
  finance: {
    payFundingPending: number;
    payWithdrawalsPending: number;
    businessSettlementsPending: number;
    loanApplicationsPending: number;
  };
  recentOrganizations: Array<{
    id: string;
    businessNumber: string | null;
    displayName: string;
    legalName: string;
    status: string;
    country?: string;
    createdAt: string;
    merchants: Array<{
      id?: string;
      vertical: string;
      verifiedAt?: string | null;
    }>;
  }>;
};

function workloadTone(value: number) {
  if (value === 0) return "quiet";
  if (value < 10) return "normal";
  return "attention";
}

export default function OperationsCommandCenter() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);

    try {
      const result = await api.get<Data>("/v1/operations/platform-overview");
      setData(result);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `${cause.message}. Existing data remains visible while Operations reconnects.`
          : "Operations temporarily lost the Platform API connection.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const totals = useMemo(() => {
    if (!data) {
      return {
        commerce: 0,
        mobility: 0,
        attention: 0,
        finance: 0,
      };
    }

    return {
      commerce:
        data.workload.shoppingOpen +
        data.workload.groceryOpen +
        data.workload.foodOpen +
        data.workload.pharmacyOpen,
      mobility: data.workload.driveOpen + data.workload.logisticsOpen,
      attention: data.workload.supportOpen + data.workload.riskOpen,
      finance:
        data.finance.payFundingPending +
        data.finance.payWithdrawalsPending +
        data.finance.businessSettlementsPending +
        data.finance.loanApplicationsPending,
    };
  }, [data]);

  const queueCards = [
    {
      href: "/commerce",
      label: "Shopping",
      eyebrow: "COMMERCE",
      value: data?.workload.shoppingOpen ?? 0,
      detail: "seller orders requiring work",
    },
    {
      href: "/grocery",
      label: "Grocery",
      eyebrow: "FRESH COMMERCE",
      value: data?.workload.groceryOpen ?? 0,
      detail: "picking, substitutions and slots",
    },
    {
      href: "/food",
      label: "Food",
      eyebrow: "RESTAURANTS",
      value: data?.workload.foodOpen ?? 0,
      detail: "live restaurant orders",
    },
    {
      href: "/pharmacy",
      label: "Pharmacy",
      eyebrow: "REGULATED COMMERCE",
      value: data?.workload.pharmacyOpen ?? 0,
      detail: "orders in progress",
    },
    {
      href: "/mobility",
      label: "Mobility",
      eyebrow: "DRIVE + DELIVERY",
      value:
        (data?.workload.driveOpen ?? 0) +
        (data?.workload.logisticsOpen ?? 0),
      detail: "rides and logistics bookings",
    },
    {
      href: "/support",
      label: "Support & Risk",
      eyebrow: "TRUST",
      value:
        (data?.workload.supportOpen ?? 0) +
        (data?.workload.riskOpen ?? 0),
      detail: "human attention queues",
    },
  ];

  return (
    <OpsShell active="/">
      <main className="ops-v31-main">
        <section className="ops-v31-welcome">
          <div>
            <span className="ops-v31-kicker">OPERATIONS</span>
            <h1>Platform command center.</h1>
            <p>
              One employee surface for Business, Shopping, Grocery, Food,
              Pharmacy, Mobility, Pay, support and risk.
            </p>
          </div>

          <div className="ops-v31-live-panel">
            <div className="ops-v31-live-row">
              <span
                className={
                  data
                    ? "ops-v31-live-dot"
                    : "ops-v31-live-dot pending"
                }
              />
              <div>
                <strong>
                  {data ? "Platform telemetry live" : "Connecting"}
                </strong>
                <small>
                  {data
                    ? `Last sync ${new Date(
                        data.generatedAt,
                      ).toLocaleTimeString("en-NG")}`
                    : "Waiting for Platform API"}
                </small>
              </div>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => void load()}
            >
              {refreshing ? "Refreshing…" : "Refresh now"}
            </button>
          </div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}

        <section className="ops-v31-command-kpis">
          <article>
            <span>BAZID USERS</span>
            <strong>{data?.totals.users ?? "—"}</strong>
            <small>registered identities</small>
          </article>
          <article>
            <span>BUSINESSES</span>
            <strong>{data?.totals.organizations ?? "—"}</strong>
            <small>registered organizations</small>
          </article>
          <article>
            <span>COMMERCE LOAD</span>
            <strong>{data ? totals.commerce : "—"}</strong>
            <small>Shopping + Grocery + Food + Pharmacy</small>
          </article>
          <article>
            <span>MOBILITY LOAD</span>
            <strong>{data ? totals.mobility : "—"}</strong>
            <small>rides + logistics</small>
          </article>
          <article className={totals.finance ? "attention" : ""}>
            <span>MONEY QUEUE</span>
            <strong>{data ? totals.finance : "—"}</strong>
            <small>settlements, funding, loans, payouts</small>
          </article>
        </section>

        <div className="ops-v31-dashboard-grid">
          <section className="ops-v31-panel ops-v31-queues">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">LIVE OPERATIONS</span>
                <h2>Queues across the ecosystem</h2>
              </div>
              <span className="ops-v31-soft-chip">AUTO REFRESH · 15S</span>
            </div>

            <div className="ops-v31-queue-grid">
              {queueCards.map((item) => (
                <a
                  key={item.href}
                  className={`ops-v31-queue-card ${workloadTone(
                    item.value,
                  )}`}
                  href={item.href}
                >
                  <div>
                    <span>{item.eyebrow}</span>
                    <h3>{item.label}</h3>
                    <small>{item.detail}</small>
                  </div>

                  <div className="ops-v31-queue-value">
                    <strong>{item.value}</strong>
                    <b>→</b>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <aside className="ops-v31-panel ops-v31-attention">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">PRIORITY DESK</span>
                <h2>What needs a person</h2>
              </div>
            </div>

            <a href="/businesses">
              <div>
                <strong>Business reviews</strong>
                <small>KYB, activation and vertical controls</small>
              </div>
              <b>Open →</b>
            </a>

            <a href="/grocery">
              <div>
                <strong>Grocery operations</strong>
                <small>picking, capacity and issue resolution</small>
              </div>
              <span>{data?.workload.groceryOpen ?? 0}</span>
            </a>

            <a href="/mobility">
              <div>
                <strong>Mobility network</strong>
                <small>Drive and delivery workload</small>
              </div>
              <span>{data ? totals.mobility : 0}</span>
            </a>

            <a href="/pay">
              <div>
                <strong>Business settlements</strong>
                <small>merchant settlement records</small>
              </div>
              <span>
                {data?.finance.businessSettlementsPending ?? 0}
              </span>
            </a>

            <a href="/risk">
              <div>
                <strong>Risk signals</strong>
                <small>open trust-and-safety signals</small>
              </div>
              <span>{data?.workload.riskOpen ?? 0}</span>
            </a>

            <a href="/support">
              <div>
                <strong>Support cases</strong>
                <small>cases waiting for resolution</small>
              </div>
              <span>{data?.workload.supportOpen ?? 0}</span>
            </a>
          </aside>
        </div>

        <div className="ops-v31-dashboard-grid lower">
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">BUSINESS NETWORK</span>
                <h2>Recently created organizations</h2>
              </div>
              <a href="/businesses">Manage businesses →</a>
            </div>

            <div className="ops-v31-business-list">
              {(data?.recentOrganizations ?? []).map((organization) => (
                <a
                  key={organization.id}
                  href={`/businesses?q=${encodeURIComponent(
                    organization.businessNumber ??
                      organization.displayName,
                  )}`}
                >
                  <div className="ops-v31-business-mark">
                    {organization.displayName.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="ops-v31-business-copy">
                    <strong>{organization.displayName}</strong>
                    <small>
                      {organization.businessNumber ??
                        "Business ID pending"}{" "}
                      ·{" "}
                      {organization.merchants.length
                        ? organization.merchants
                            .map((merchant) => merchant.vertical)
                            .join(" · ")
                        : "No active vertical"}
                    </small>
                  </div>

                  <span className="ops-v31-soft-chip">
                    {organization.status}
                  </span>

                  <time>
                    {new Date(
                      organization.createdAt,
                    ).toLocaleDateString("en-NG")}
                  </time>
                </a>
              ))}
            </div>
          </section>

          <aside className="ops-v31-panel ops-v31-platform-map">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">PLATFORM MAP</span>
                <h2>Connected Bazaara surfaces</h2>
              </div>
            </div>

            <div className="ops-v31-platform-links">
              <a href="/businesses">
                <span>BZ</span>
                <div>
                  <strong>Business</strong>
                  <small>vendors and organizations</small>
                </div>
              </a>
              <a href="/commerce">
                <span>SH</span>
                <div>
                  <strong>Shopping</strong>
                  <small>marketplace commerce</small>
                </div>
              </a>
              <a href="/grocery">
                <span>GR</span>
                <div>
                  <strong>Grocery</strong>
                  <small>fresh commerce and picking</small>
                </div>
              </a>
              <a href="/food">
                <span>FD</span>
                <div>
                  <strong>Food</strong>
                  <small>restaurant network</small>
                </div>
              </a>
              <a href="/pharmacy">
                <span>PH</span>
                <div>
                  <strong>Pharmacy</strong>
                  <small>regulated pharmacy workflows</small>
                </div>
              </a>
              <a href="/mobility">
                <span>MO</span>
                <div>
                  <strong>Mobility</strong>
                  <small>Drive + logistics</small>
                </div>
              </a>
              <a href="/pay">
                <span>PY</span>
                <div>
                  <strong>Pay</strong>
                  <small>wallets and settlement rails</small>
                </div>
              </a>
            </div>
          </aside>
        </div>
      </main>
    </OpsShell>
  );
}
