"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { money, OpsShell } from "../components/OpsShell";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const api = createApiClient({
  baseUrl: API,
  credentials: "include",
});

type GroceryData = {
  generatedAt: string;
  kpis: {
    stores: number;
    activeStores: number;
    openOrders: number;
    activePicking: number;
    unresolvedIssues: number;
    upcomingSlots: number;
    reservedSlots: number;
  };
  stores: Array<{
    id: string;
    name: string;
    status: string;
    timezone: string;
    fulfillmentModes: string[];
    merchant: {
      id: string;
      organizationId: string;
      name: string;
      businessNumber: string | null;
    };
    config: null | {
      pickupEnabled: boolean;
      expressEnabled: boolean;
      scheduledEnabled: boolean;
      pickerChatEnabled: boolean;
      weightedItemsEnabled: boolean;
      minimumOrderMinor: number;
      maxActiveOrders: number;
      prepMinutes: number;
    };
    slots: Array<{
      id: string;
      startsAt: string;
      endsAt: string;
      capacity: number;
      reserved: number;
      active: boolean;
    }>;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    orderStatus: string;
    paymentStatus: string;
    deliveryMode: string;
    scheduledFor: string | null;
    totalMinor: number;
    currency: string;
    merchant: string;
    businessNumber: string | null;
    store: string;
    pickerStatus: string | null;
    pickerUserId: string | null;
    createdAt: string;
  }>;
  issues: Array<{
    id: string;
    type: string;
    status: string;
    details: string | null;
    requestedAmountMinor: number | null;
    approvedAmountMinor: number | null;
    orderNumber: string;
    orderStatus: string;
    currency: string;
    business: string;
    customer: string;
    createdAt: string;
  }>;
};

type GroceryPricingPolicy = {
  serviceFeeBps: number;
  serviceFeeMinBps: number;
  serviceFeeMaxBps: number;
  expressRateBps: number;
  expressMinimumMinor: number;
  expressMaximumMinor: number;
};

function percentFromBps(bps: number) {
  return `${(bps / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}%`;
}

export default function GroceryOperations() {
  const [data, setData] = useState<GroceryData | null>(null);
  const [pricing, setPricing] = useState<GroceryPricingPolicy | null>(null);
  const [serviceFeeDraft, setServiceFeeDraft] = useState("10");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextData, nextPricing] = await Promise.all([
        api.get<GroceryData>("/v1/operations/grocery"),
        api.get<GroceryPricingPolicy>("/v1/grocery/pricing-policy"),
      ]);
      setData(nextData);
      setPricing(nextPricing);
      setServiceFeeDraft((nextPricing.serviceFeeBps / 100).toString());
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load Grocery Operations",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saturatedStores = useMemo(
    () =>
      (data?.stores ?? []).filter((store) => {
        const active = data?.orders.filter(
          (order) =>
            order.store === store.name &&
            !["DELIVERED", "CANCELLED"].includes(order.status),
        ).length ?? 0;

        return (
          store.config != null &&
          store.config.maxActiveOrders > 0 &&
          active >= store.config.maxActiveOrders
        );
      }).length,
    [data],
  );

  async function setStoreStatus(
    storeId: string,
    status: "ACTIVE" | "PAUSED" | "SUSPENDED",
  ) {
    setBusy(storeId);
    setNotice("");
    setError("");

    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(
        `/v1/operations/grocery/stores/${storeId}/status`,
        { status },
      );
      setNotice(result.actionState === "ALREADY_DONE" ? `Grocery store was already ${status}.` : `Grocery store moved to ${status}.`);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update grocery store",
      );
    } finally {
      setBusy("");
    }
  }

  async function resolveIssue(issueId: string) {
    setBusy(issueId);
    setNotice("");
    setError("");

    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(
        `/v1/operations/grocery/issues/${issueId}/status`,
        { status: "RESOLVED" },
      );
      setNotice(result.actionState === "ALREADY_DONE" ? "Grocery issue was already resolved." : "Grocery issue resolved.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not resolve Grocery issue",
      );
    } finally {
      setBusy("");
    }
  }

  async function saveServiceFee() {
    const percent = Number(serviceFeeDraft);

    if (!Number.isFinite(percent) || percent < 10 || percent > 15) {
      setError("Grocery service fee must stay between 10% and 15%.");
      return;
    }

    setBusy("pricing-policy");
    setNotice("");
    setError("");

    try {
      const next = await api.patch<GroceryPricingPolicy>(
        "/v1/admin/grocery/pricing-policy",
        { serviceFeeBps: Math.round(percent * 100) },
      );
      setPricing(next);
      setServiceFeeDraft((next.serviceFeeBps / 100).toString());
      setNotice(
        `Grocery service fee updated to ${percentFromBps(next.serviceFeeBps)}.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update Grocery service fee",
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <OpsShell active="/grocery">
      <main className="ops-v31-main grocery-ops-v5">
        <section className="ops-v32-domain-hero grocery">
          <div>
            <span className="ops-v31-kicker">GROCERY OPERATIONS</span>
            <h1>Fresh-commerce network control.</h1>
            <p>
              Store availability, picker queues, scheduled capacity,
              substitutions, customer issues and operational exceptions.
            </p>
          </div>

          <div className="ops-v32-domain-live">
            <span>NETWORK STATUS</span>
            <strong>
              {data ? `${data.kpis.activeStores}/${data.kpis.stores}` : "—"}
            </strong>
            <small>active Grocery stores</small>
          </div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <section className="ops-v31-panel grocery-v54-ops-policy" style={{ marginBottom: 14 }}>
          <div className="ops-v31-section-head">
            <div>
              <span className="ops-v31-kicker">GROCERY COMMERCIAL POLICY</span>
              <h2>Delivery and service-fee rules</h2>
            </div>
          </div>
          <div className="ops-v31-command-kpis">
            <article>
              <span>EXPRESS RATE</span>
              <strong>
                {pricing ? percentFromBps(pricing.expressRateBps) : "10%"}
              </strong>
              <small>of merchandise subtotal</small>
            </article>
            <article>
              <span>EXPRESS RANGE</span>
              <strong>₦1k–₦5k</strong>
              <small>minimum / maximum customer charge</small>
            </article>
            <article>
              <span>SERVICE FEE</span>
              <strong>
                {pricing ? percentFromBps(pricing.serviceFeeBps) : "10%"}
              </strong>
              <small>current Operations-controlled Grocery fee</small>
            </article>
            <article>
              <span>ALLOWED RANGE</span>
              <strong>10%–15%</strong>
              <small>hard server-side guardrail</small>
            </article>
          </div>

          <div className="grocery-v55-pricing-control">
            <div>
              <span className="ops-v31-kicker">SERVICE FEE CONTROL</span>
              <strong>Set Grocery service fee</strong>
              <small>
                Operations can change this between 10% and 15%. Express remains
                10% of merchandise subtotal with a ₦1,000 minimum and ₦5,000 maximum.
              </small>
            </div>

            <div className="grocery-v55-pricing-input">
              <input
                type="number"
                min="10"
                max="15"
                step="0.5"
                value={serviceFeeDraft}
                onChange={(event) => setServiceFeeDraft(event.target.value)}
                aria-label="Grocery service fee percentage"
              />
              <span>%</span>
              <button
                type="button"
                className={pricing && Number(serviceFeeDraft) === pricing.serviceFeeBps / 100 ? "smart-done" : ""}
                disabled={busy === "pricing-policy" || Boolean(pricing && Number(serviceFeeDraft) === pricing.serviceFeeBps / 100)}
                onClick={() => void saveServiceFee()}
              >
                {busy === "pricing-policy" ? "Saving…" : pricing && Number(serviceFeeDraft) === pricing.serviceFeeBps / 100 ? "✓ Applied" : "Apply"}
              </button>
            </div>
          </div>
        </section>
        <section className="ops-v31-command-kpis">
          <article>
            <span>OPEN ORDERS</span>
            <strong>{data?.kpis.openOrders ?? "—"}</strong>
            <small>fresh orders requiring attention</small>
          </article>
          <article>
            <span>PICKING NOW</span>
            <strong>{data?.kpis.activePicking ?? "—"}</strong>
            <small>active picker sessions</small>
          </article>
          <article>
            <span>DELIVERY SLOTS</span>
            <strong>{data?.kpis.upcomingSlots ?? "—"}</strong>
            <small>{data?.kpis.reservedSlots ?? 0} reservations</small>
          </article>
          <article className={saturatedStores ? "attention" : ""}>
            <span>AT CAPACITY</span>
            <strong>{saturatedStores}</strong>
            <small>stores at configured active-order limit</small>
          </article>
          <article
            className={data?.kpis.unresolvedIssues ? "attention" : ""}
          >
            <span>ISSUES</span>
            <strong>{data?.kpis.unresolvedIssues ?? "—"}</strong>
            <small>replacement / shortage issues</small>
          </article>
        </section>

        <div className="ops-v31-dashboard-grid">
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">ORDER FLOW</span>
                <h2>Fresh-order queue</h2>
              </div>
              <span className="ops-v31-soft-chip">
                {data?.orders.length ?? 0} recent
              </span>
            </div>

            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Business / store</th>
                    <th>Mode</th>
                    <th>Picking</th>
                    <th>Payment</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.orders ?? []).slice(0, 60).map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                        <small>{order.status}</small>
                      </td>
                      <td>
                        <strong>{order.merchant}</strong>
                        <small>{order.store}</small>
                      </td>
                      <td>
                        <span className="ops-v31-soft-chip">
                          {order.deliveryMode}
                        </span>
                      </td>
                      <td>{order.pickerStatus ?? "NOT STARTED"}</td>
                      <td>{order.paymentStatus}</td>
                      <td>
                        <strong>
                          {money(order.totalMinor, order.currency)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">EXCEPTIONS</span>
                <h2>Customer-impacting issues</h2>
              </div>
            </div>

            <div className="ops-v32-issue-list">
              {(data?.issues ?? []).slice(0, 16).map((issue) => (
                <article key={issue.id}>
                  <div>
                    <span>{issue.type.replaceAll("_", " ")}</span>
                    <strong>{issue.orderNumber}</strong>
                    <small>
                      {issue.business} · {issue.customer}
                    </small>
                  </div>

                  <div>
                    {issue.requestedAmountMinor != null ? (
                      <strong>
                        {money(
                          issue.requestedAmountMinor,
                          issue.currency,
                        )}
                      </strong>
                    ) : null}
                    <button
                      className={issue.status === "RESOLVED" ? "smart-done" : ""}
                      disabled={busy === issue.id || issue.status === "RESOLVED"}
                      onClick={() => void resolveIssue(issue.id)}
                    >
                      {busy === issue.id ? "Saving…" : issue.status === "RESOLVED" ? "✓ Resolved" : "Resolve"}
                    </button>
                  </div>
                </article>
              ))}

              {!data?.issues.length ? (
                <div className="ops-v31-empty">
                  No unresolved Grocery issues.
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <section className="ops-v31-panel ops-v32-store-section">
          <div className="ops-v31-section-head">
            <div>
              <span className="ops-v31-kicker">STORE NETWORK</span>
              <h2>Grocery branches and capacity</h2>
            </div>
          </div>

          <div className="ops-v32-store-grid">
            {(data?.stores ?? []).map((store) => (
              <article key={store.id}>
                <div className="ops-v32-store-top">
                  <div>
                    <span>
                      {store.merchant.businessNumber ??
                        "BUSINESS ID PENDING"}
                    </span>
                    <h3>{store.name}</h3>
                    <small>{store.merchant.name}</small>
                  </div>
                  <span className="ops-v31-soft-chip">{store.status}</span>
                </div>

                <div className="ops-v32-store-features">
                  <span>
                    {store.config?.expressEnabled ? "Express" : "No express"}
                  </span>
                  <span>
                    {store.config?.scheduledEnabled
                      ? "Scheduled"
                      : "No scheduled"}
                  </span>
                  <span>
                    {store.config?.weightedItemsEnabled
                      ? "Weighted items"
                      : "Fixed quantity"}
                  </span>
                  <span>
                    {store.config?.pickerChatEnabled
                      ? "Picker chat"
                      : "No chat"}
                  </span>
                </div>

                <div className="ops-v32-store-stats">
                  <div>
                    <span>Capacity</span>
                    <strong>{store.config?.maxActiveOrders ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Prep</span>
                    <strong>
                      {store.config?.prepMinutes ?? "—"}
                      {store.config ? "m" : ""}
                    </strong>
                  </div>
                  <div>
                    <span>Slots</span>
                    <strong>{store.slots.length}</strong>
                  </div>
                </div>

                <div className="ops-v32-row-actions">
                  <button
                    className={store.status === "ACTIVE" ? "smart-done" : ""}
                    disabled={busy === store.id || store.status === "ACTIVE"}
                    onClick={() => void setStoreStatus(store.id, "ACTIVE")}
                  >
                    {store.status === "ACTIVE" ? "✓ Active" : "Activate"}
                  </button>
                  <button
                    className={store.status === "PAUSED" ? "smart-done" : ""}
                    disabled={busy === store.id || store.status === "PAUSED"}
                    onClick={() => void setStoreStatus(store.id, "PAUSED")}
                  >
                    {store.status === "PAUSED" ? "✓ Paused" : "Pause"}
                  </button>
                  <button
                    className={store.status === "SUSPENDED" ? "smart-done" : ""}
                    disabled={busy === store.id || store.status === "SUSPENDED"}
                    onClick={() =>
                      void setStoreStatus(store.id, "SUSPENDED")
                    }
                  >
                    {store.status === "SUSPENDED" ? "✓ Suspended" : "Suspend"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </OpsShell>
  );
}
