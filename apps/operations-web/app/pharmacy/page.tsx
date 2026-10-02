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

type Merchant = {
  merchantId: string;
  regulator: string;
  licenceNumber: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  consultationEnabled: boolean;
};

type Pharmacist = {
  id: string;
  userId: string;
  merchantId: string;
  regulator: string;
  licenceNumber: string;
  verificationStatus: string;
  expiresAt: string | null;
};

type Rx = {
  id: string;
  status: string;
  jurisdiction: string;
  merchantId: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  merchantId: string;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
};

type Tab = "pharmacies" | "pharmacists" | "prescriptions" | "orders";

export default function PharmacyOperations() {
  const [tab, setTab] = useState<Tab>("pharmacies");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [prescriptions, setPrescriptions] = useState<Rx[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const [merchantResult, overview] = await Promise.all([
        api.get<{ profiles: Merchant[] }>(
          "/v1/admin/pharmacy/merchants",
        ),
        api.get<{
          pharmacists: Pharmacist[];
          prescriptions: Rx[];
          orders: Order[];
        }>("/v1/admin/pharmacy/overview"),
      ]);

      setMerchants(merchantResult.profiles);
      setPharmacists(overview.pharmacists);
      setPrescriptions(overview.prescriptions);
      setOrders(overview.orders);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load Pharmacy Operations",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return {
      pendingPharmacies: merchants.filter(
        (item) => item.verificationStatus === "PENDING",
      ).length,
      waitingRx: prescriptions.filter((item) =>
        [
          "SUBMITTED",
          "IN_REVIEW",
          "MORE_INFORMATION_REQUIRED",
        ].includes(item.status),
      ).length,
      openOrders: orders.filter(
        (item) =>
          !["DELIVERED", "CANCELLED", "COMPLETED"].includes(item.status),
      ).length,
      expiringPharmacists: pharmacists.filter((item) => {
        if (!item.expiresAt) return false;
        const expires = new Date(item.expiresAt).getTime();
        return expires >= now && expires - now <= thirtyDays;
      }).length,
      gmv: orders.reduce((sum, item) => sum + item.totalMinor, 0),
    };
  }, [merchants, orders, pharmacists, prescriptions]);

  async function patch(
    url: string,
    body: unknown,
    message: string,
  ) {
    setBusy(url);

    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(url, body);
      setNotice(result.actionState === "ALREADY_DONE" ? "✓ No change needed — that Pharmacy status was already applied on the server." : message);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Update failed",
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <OpsShell active="/pharmacy">
      <main className="ops-v31-main">
        <section className="ops-v33-domain-hero pharmacy">
          <div>
            <span className="ops-v31-kicker">PHARMACY OPERATIONS</span>
            <h1>Compliance before commerce.</h1>
            <p>
              Pharmacy and pharmacist verification, prescription review
              visibility, regulated fulfilment and order monitoring from one
              employee workspace.
            </p>
          </div>

          <div className="ops-v33-hero-stat">
            <span>RECENT ORDER VALUE</span>
            <strong>{money(kpis.gmv)}</strong>
            <small>{orders.length} Pharmacy orders</small>
          </div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <section className="ops-v31-command-kpis">
          <article>
            <span>PHARMACIES</span>
            <strong>{merchants.length}</strong>
            <small>registered Pharmacy merchants</small>
          </article>
          <article className={kpis.pendingPharmacies ? "attention" : ""}>
            <span>PENDING PHARMACIES</span>
            <strong>{kpis.pendingPharmacies}</strong>
            <small>verification queue</small>
          </article>
          <article className={kpis.waitingRx ? "attention" : ""}>
            <span>RX REVIEW</span>
            <strong>{kpis.waitingRx}</strong>
            <small>prescriptions requiring review</small>
          </article>
          <article className={kpis.expiringPharmacists ? "attention" : ""}>
            <span>LICENCE EXPIRY</span>
            <strong>{kpis.expiringPharmacists}</strong>
            <small>pharmacists expiring within 30 days</small>
          </article>
          <article>
            <span>OPEN ORDERS</span>
            <strong>{kpis.openOrders}</strong>
            <small>regulated fulfilment in progress</small>
          </article>
        </section>

        <div className="ops-v33-regulatory-strip">
          <div>
            <strong>Rx gate</strong>
            <span>Prescription items require verified pharmacist review.</span>
          </div>
          <div>
            <strong>FEFO</strong>
            <span>Batch inventory should honour earliest expiry first.</span>
          </div>
          <div>
            <strong>Substitution</strong>
            <span>Customer confirmation remains required.</span>
          </div>
          <div>
            <strong>Audit</strong>
            <span>Verification changes remain employee actions.</span>
          </div>
        </div>

        <div className="ops-v33-tabs">
          {(
            [
              "pharmacies",
              "pharmacists",
              "prescriptions",
              "orders",
            ] as const
          ).map((value) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
            >
              {value[0]!.toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>

        {tab === "pharmacies" ? (
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">MERCHANT COMPLIANCE</span>
                <h2>Pharmacy verification</h2>
              </div>
            </div>

            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Licence</th>
                    <th>Status</th>
                    <th>Services</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.merchantId}>
                      <td>
                        <strong>
                          {merchant.merchantId.slice(0, 12)}
                        </strong>
                      </td>
                      <td>
                        {merchant.regulator} ·{" "}
                        {merchant.licenceNumber ?? "—"}
                      </td>
                      <td>
                        <span className="ops-v31-soft-chip">
                          {merchant.verificationStatus}
                        </span>
                      </td>
                      <td>
                        {[
                          merchant.deliveryEnabled && "Delivery",
                          merchant.pickupEnabled && "Pickup",
                          merchant.consultationEnabled && "Consult",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </td>
                      <td>
                        <div className="ops-v33-row-actions">
                          {merchant.verificationStatus !== "VERIFIED" ? (
                            <button
                              disabled={busy.includes(merchant.merchantId)}
                              onClick={() =>
                                void patch(
                                  `/v1/admin/pharmacy/merchants/${merchant.merchantId}`,
                                  { verificationStatus: "VERIFIED" },
                                  "Pharmacy verified.",
                                )
                              }
                            >
                              Verify
                            </button>
                          ) : null}
                          <button
                            className={merchant.verificationStatus === "SUSPENDED" ? "smart-done" : ""}
                            disabled={busy.includes(merchant.merchantId) || merchant.verificationStatus === "SUSPENDED"}
                            onClick={() =>
                              void patch(
                                `/v1/admin/pharmacy/merchants/${merchant.merchantId}`,
                                { verificationStatus: "SUSPENDED" },
                                "Pharmacy suspended.",
                              )
                            }
                          >
                            {merchant.verificationStatus === "SUSPENDED" ? "✓ Suspended" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "pharmacists" ? (
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">
                  PROFESSIONAL LICENSING
                </span>
                <h2>Pharmacist verification</h2>
              </div>
            </div>

            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Merchant</th>
                    <th>Licence</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacists.map((pharmacist) => (
                    <tr key={pharmacist.userId}>
                      <td>{pharmacist.userId.slice(0, 12)}</td>
                      <td>{pharmacist.merchantId.slice(0, 12)}</td>
                      <td>
                        {pharmacist.regulator} ·{" "}
                        {pharmacist.licenceNumber}
                      </td>
                      <td>
                        {pharmacist.expiresAt
                          ? new Date(
                              pharmacist.expiresAt,
                            ).toLocaleDateString("en-NG")
                          : "—"}
                      </td>
                      <td>
                        <span className="ops-v31-soft-chip">
                          {pharmacist.verificationStatus}
                        </span>
                      </td>
                      <td>
                        <div className="ops-v33-row-actions">
                          {pharmacist.verificationStatus !== "VERIFIED" ? (
                            <button
                              disabled={busy.includes(pharmacist.userId)}
                              onClick={() =>
                                void patch(
                                  `/v1/admin/pharmacy/pharmacists/${pharmacist.userId}`,
                                  { verificationStatus: "VERIFIED" },
                                  "Pharmacist verified.",
                                )
                              }
                            >
                              Verify
                            </button>
                          ) : null}
                          <button
                            className={pharmacist.verificationStatus === "SUSPENDED" ? "smart-done" : ""}
                            disabled={busy.includes(pharmacist.userId) || pharmacist.verificationStatus === "SUSPENDED"}
                            onClick={() =>
                              void patch(
                                `/v1/admin/pharmacy/pharmacists/${pharmacist.userId}`,
                                { verificationStatus: "SUSPENDED" },
                                "Pharmacist suspended.",
                              )
                            }
                          >
                            {pharmacist.verificationStatus === "SUSPENDED" ? "✓ Suspended" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "prescriptions" ? (
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">PRESCRIPTION QUEUE</span>
                <h2>Regulatory visibility</h2>
              </div>
            </div>

            <div className="ops-v33-card-grid">
              {prescriptions.map((rx) => (
                <article key={rx.id}>
                  <div className="ops-v33-card-head">
                    <div>
                      <span className="ops-v31-soft-chip">
                        {rx.status}
                      </span>
                      <h3>{rx.id.slice(0, 12)}</h3>
                      <small>
                        {rx.jurisdiction} · merchant{" "}
                        {rx.merchantId?.slice(0, 10) ?? "unassigned"}
                      </small>
                    </div>
                    <time>
                      {new Date(rx.submittedAt).toLocaleDateString(
                        "en-NG",
                      )}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "orders" ? (
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">ORDER NETWORK</span>
                <h2>Recent Pharmacy orders</h2>
              </div>
            </div>

            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Merchant</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Fulfilment</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                        <small>
                          {new Date(order.createdAt).toLocaleString(
                            "en-NG",
                          )}
                        </small>
                      </td>
                      <td>{order.merchantId.slice(0, 12)}</td>
                      <td>
                        <span className="ops-v31-soft-chip">
                          {order.status}
                        </span>
                      </td>
                      <td>{order.paymentStatus}</td>
                      <td>{order.fulfillmentType}</td>
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
        ) : null}
      </main>
    </OpsShell>
  );
}
