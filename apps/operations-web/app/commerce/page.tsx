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

type Tab = "orders" | "returns" | "payments";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  totalMinor: number;
  placedAt: string;
  customer: {
    displayName: string | null;
    email: string | null;
  };
  sellers: Array<{
    id: string;
    status: string;
    seller: string;
    store: string;
    shipmentCount: number;
    returnCount: number;
    fulfillmentDueAt: string | null;
  }>;
  paymentIntent: {
    id: string;
    status: string;
    capturedMinor: number;
    refundedMinor: number;
  } | null;
  openCancellationRequests: number;
  openReturns: number;
};

type OrderContext = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    currency: string;
    totalMinor: number;
    placedAt: string;
    customer: {
      id: string;
      displayName: string | null;
      email: string | null;
      phone: string | null;
    };
    sellers: Array<any>;
    cancellationRequests: Array<any>;
    paymentIntent: any | null;
  };
  inventory: Array<any>;
  riskSignals: Array<{
    code: string;
    severity: string;
    label: string;
  }>;
  timeline: Array<{
    source: string;
    type: string;
    at: string;
  }>;
};

type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  requestedRefundMinor: number | null;
  approvedRefundMinor: number | null;
  requestedAt: string;
  order: {
    orderNumber: string;
    currency: string;
    paymentStatus: string;
    paymentIntent: {
      id: string;
      status: string;
      capturedMinor: number;
      refundedMinor: number;
    } | null;
  };
  merchant: {
    id: string;
    name: string;
  } | null;
  disputes: Array<{
    id: string;
    status: string;
    reason: string;
    details: string | null;
  }>;
  paymentRefunds: Array<{
    id: string;
    status: string;
    amountMinor: number;
  }>;
};

type PaymentIntent = {
  id: string;
  orderId: string;
  clientReference: string;
  status: string;
  paymentMethod: string;
  provider: string | null;
  providerReference: string | null;
  amountMinor: number;
  capturedMinor: number;
  refundedMinor: number;
  currency: string;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  order: {
    orderNumber: string;
    paymentStatus: string;
    status: string;
    placedAt: string;
  };
  refunds: Array<{
    id: string;
    status: string;
    amountMinor: number;
  }>;
  failures: Array<{
    id: string;
    code: string;
    message: string;
    retryable: boolean;
    createdAt: string;
  }>;
};

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());
}

export default function ShoppingOperations() {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [payments, setPayments] = useState<PaymentIntent[]>([]);
  const [selected, setSelected] = useState<OrderContext | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [searchingOrders, setSearchingOrders] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);

      const result = await api.get<{ orders: OrderRow[] }>(
        `/v1/admin/shopping/orders/search${
          params.size ? `?${params.toString()}` : ""
        }`,
      );

      setOrders(result.orders);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load Shopping orders",
      );
    }
  }, [q, status]);

  const loadReturns = useCallback(async () => {
    try {
      const result = await api.get<{ returns: ReturnRow[] }>(
        "/v1/admin/shopping/returns",
      );
      setReturns(result.returns);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load returns",
      );
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      const result = await api.get<{ intents: PaymentIntent[] }>(
        "/v1/admin/payments/intents?limit=200",
      );
      setPayments(result.intents);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load payments",
      );
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    void loadReturns();
    void loadPayments();
  }, [loadOrders, loadReturns, loadPayments]);

  const kpis = useMemo(
    () => ({
      open: orders.filter(
        (item) =>
          !["DELIVERED", "CANCELLED", "REFUNDED"].includes(item.status),
      ).length,
      exceptions: orders.filter(
        (item) =>
          item.openCancellationRequests > 0 || item.openReturns > 0,
      ).length,
      returns: returns.filter(
        (item) =>
          !["REFUNDED", "REJECTED", "CLOSED", "CANCELLED"].includes(
            item.status,
          ),
      ).length,
      paymentAttention: payments.filter((item) =>
        ["PROCESSING", "REQUIRES_ACTION", "FAILED"].includes(item.status),
      ).length,
      gmv: orders.reduce((sum, item) => sum + item.totalMinor, 0),
    }),
    [orders, payments, returns],
  );

  async function openOrder(id: string) {
    setBusy(`open-${id}`);

    try {
      setSelected(
        await api.get<OrderContext>(
          `/v1/admin/shopping/orders/${id}/context`,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load order context",
      );
    } finally {
      setBusy("");
    }
  }

  async function resolveCancellation(
    id: string,
    decision: "APPROVE" | "REJECT",
  ) {
    setBusy(id);

    try {
      const result = await api.post<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(
        `/v1/admin/shopping/cancellation-requests/${id}/resolve`,
        {
          decision,
          notes: `Operations ${decision.toLowerCase()}`,
        },
      );
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ Cancellation was already ${decision.toLowerCase()}d on the server.` : `Cancellation ${decision.toLowerCase()}d.`);
      if (selected) await openOrder(selected.order.id);
      await loadOrders();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not resolve cancellation",
      );
    } finally {
      setBusy("");
    }
  }

  async function shipmentState(id: string, next: string) {
    setBusy(id);

    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/shopping/shipments/${id}/status`, {
        status: next,
        description: `Operations marked ${label(next)}`,
      });
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ Shipment was already ${label(next)} on the server.` : `Shipment moved to ${label(next)}.`);
      if (selected) await openOrder(selected.order.id);
      await loadOrders();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update shipment",
      );
    } finally {
      setBusy("");
    }
  }

  async function resolveDispute(
    id: string,
    resolution: "CUSTOMER" | "MERCHANT",
  ) {
    setBusy(id);

    try {
      const result = await api.post<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(
        `/v1/admin/shopping/return-disputes/${id}/resolve`,
        {
          resolution,
          notes: `Resolved for ${resolution.toLowerCase()} after Operations review.`,
        },
      );
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ Return dispute was already resolved for the ${resolution.toLowerCase()}.` : "Return dispute resolved.");
      await loadReturns();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not resolve dispute",
      );
    } finally {
      setBusy("");
    }
  }

  async function queueRefund(returnCase: ReturnRow) {
    const paymentIntent = returnCase.order.paymentIntent;
    const amount =
      returnCase.approvedRefundMinor ??
      returnCase.requestedRefundMinor ??
      0;

    if (!paymentIntent || amount <= 0) {
      setError("This return does not have a refundable payment amount.");
      return;
    }

    setBusy(`refund-${returnCase.id}`);

    try {
      const result = await api.request<{ replayed?: boolean }>(
        `/v1/admin/payments/intents/${paymentIntent.id}/refunds`,
        {
          method: "POST",
          headers: {
            "idempotency-key": `ops-return-${returnCase.id}`,
          },
          body: {
            shoppingReturnId: returnCase.id,
            amountMinor: amount,
            reason: `Approved return ${returnCase.id}`,
          },
        },
      );

      setNotice(
        result.replayed ? "✓ This refund was already queued. No duplicate provider refund was created." : "Refund queued. Provider confirmation remains authoritative.",
      );
      await Promise.all([loadReturns(), loadPayments()]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not queue refund",
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <OpsShell active="/commerce">
      <main className="ops-v31-main">
        <section className="ops-v33-domain-hero shopping">
          <div>
            <span className="ops-v31-kicker">SHOPPING OPERATIONS</span>
            <h1>Orders, fulfilment and post-purchase control.</h1>
            <p>
              Search every Shopping order, inspect seller fulfilment,
              intervene in cancellations, resolve returns and watch payment
              orchestration without bypassing provider confirmation.
            </p>
          </div>

          <div className="ops-v33-hero-stat">
            <span>RECENT GMV</span>
            <strong>{money(kpis.gmv)}</strong>
            <small>{orders.length} loaded orders</small>
          </div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <section className="ops-v31-command-kpis">
          <article>
            <span>OPEN ORDERS</span>
            <strong>{kpis.open}</strong>
            <small>requiring fulfilment work</small>
          </article>
          <article className={kpis.exceptions ? "attention" : ""}>
            <span>ORDER EXCEPTIONS</span>
            <strong>{kpis.exceptions}</strong>
            <small>cancellations or returns</small>
          </article>
          <article className={kpis.returns ? "attention" : ""}>
            <span>OPEN RETURNS</span>
            <strong>{kpis.returns}</strong>
            <small>refund or dispute workflow</small>
          </article>
          <article className={kpis.paymentAttention ? "attention" : ""}>
            <span>PAYMENT ATTENTION</span>
            <strong>{kpis.paymentAttention}</strong>
            <small>processing, action or failed</small>
          </article>
          <article>
            <span>ORDER VALUE</span>
            <strong>{money(kpis.gmv)}</strong>
            <small>loaded order window</small>
          </article>
        </section>

        <div className="ops-v33-tabs">
          {(["orders", "returns", "payments"] as const).map((value) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
            >
              {value === "orders"
                ? "Orders"
                : value === "returns"
                  ? "Returns & disputes"
                  : "Payments"}
            </button>
          ))}
        </div>

        {tab === "orders" ? (
          <div className="ops-v33-split">
            <section className="ops-v31-panel">
              <div className="ops-v33-toolbar">
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Order number, customer or seller"
                />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {[
                    "PLACED",
                    "CONFIRMED",
                    "PROCESSING",
                    "PACKED",
                    "SHIPPED",
                    "OUT_FOR_DELIVERY",
                    "DELIVERED",
                    "CANCELLED",
                    "RETURN_REQUESTED",
                    "REFUND_PENDING",
                    "REFUNDED",
                    "DISPUTED",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button disabled={searchingOrders} onClick={() => void (async () => { setSearchingOrders(true); try { await loadOrders(); setNotice("✓ Order search refreshed."); } finally { setSearchingOrders(false); } })()}>{searchingOrders ? "Searching…" : "Search"}</button>
              </div>

              <div className="ops-v32-table-wrap">
                <table className="ops-v32-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Sellers</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="ops-v33-click-row"
                        onClick={() => void openOrder(order.id)}
                      >
                        <td>
                          <strong>{order.orderNumber}</strong>
                          <small>
                            {new Date(order.placedAt).toLocaleString("en-NG")}
                          </small>
                        </td>
                        <td>
                          {order.customer.displayName ||
                            order.customer.email ||
                            "BazID customer"}
                        </td>
                        <td>
                          {order.sellers
                            .map((seller) => seller.seller)
                            .join(", ")}
                        </td>
                        <td>
                          <span className="ops-v31-soft-chip">
                            {label(order.status)}
                          </span>
                        </td>
                        <td>{label(order.paymentStatus)}</td>
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

            <aside className="ops-v31-panel ops-v33-detail">
              {selected ? (
                <>
                  <div className="ops-v31-section-head">
                    <div>
                      <span className="ops-v31-kicker">
                        {label(selected.order.status)}
                      </span>
                      <h2>{selected.order.orderNumber}</h2>
                    </div>
                    <button onClick={() => setSelected(null)}>Close</button>
                  </div>

                  <div className="ops-v33-detail-summary">
                    <div>
                      <span>CUSTOMER</span>
                      <strong>
                        {selected.order.customer.displayName ||
                          selected.order.customer.email ||
                          "BazID customer"}
                      </strong>
                      <small>
                        {selected.order.customer.phone ?? "No phone"}
                      </small>
                    </div>
                    <div>
                      <span>PAYMENT</span>
                      <strong>{label(selected.order.paymentStatus)}</strong>
                      <small>{selected.order.paymentMethod}</small>
                    </div>
                  </div>

                  <section className="ops-v33-detail-section">
                    <span className="ops-v31-kicker">RISK</span>
                    {selected.riskSignals.length ? (
                      selected.riskSignals.map((signal) => (
                        <div className="ops-v33-risk" key={signal.code}>
                          <strong>{signal.label}</strong>
                          <span>{signal.severity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="ops-v33-muted">
                        No current risk signals.
                      </p>
                    )}
                  </section>

                  <section className="ops-v33-detail-section">
                    <span className="ops-v31-kicker">
                      SELLER FULFILMENT
                    </span>
                    {selected.order.sellers.map((seller: any) => (
                      <article className="ops-v33-seller" key={seller.id}>
                        <strong>{seller.merchant?.name ?? "Seller"}</strong>
                        <small>
                          {label(seller.status)} · due{" "}
                          {seller.fulfillmentDueAt
                            ? new Date(
                                seller.fulfillmentDueAt,
                              ).toLocaleString("en-NG")
                            : "—"}
                        </small>

                        {(seller.shipments ?? []).map((shipment: any) => (
                          <div
                            className="ops-v33-shipment"
                            key={shipment.id}
                          >
                            <span>
                              {shipment.carrier ?? "Carrier"} ·{" "}
                              {shipment.trackingIdentifier ??
                                "No tracking"}{" "}
                              · {label(shipment.status)}
                            </span>

                            <div>
                              {shipment.status === "SHIPPED" ? (
                                <button
                                  onClick={() =>
                                    void shipmentState(
                                      shipment.id,
                                      "IN_TRANSIT",
                                    )
                                  }
                                >
                                  In transit
                                </button>
                              ) : null}
                              {shipment.status === "IN_TRANSIT" ? (
                                <button
                                  onClick={() =>
                                    void shipmentState(
                                      shipment.id,
                                      "OUT_FOR_DELIVERY",
                                    )
                                  }
                                >
                                  Out for delivery
                                </button>
                              ) : null}
                              {shipment.status === "OUT_FOR_DELIVERY" ? (
                                <>
                                  <button
                                    onClick={() =>
                                      void shipmentState(
                                        shipment.id,
                                        "DELIVERED",
                                      )
                                    }
                                  >
                                    Delivered
                                  </button>
                                  <button
                                    onClick={() =>
                                      void shipmentState(
                                        shipment.id,
                                        "FAILED_DELIVERY",
                                      )
                                    }
                                  >
                                    Failed
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </article>
                    ))}
                  </section>

                  {selected.order.cancellationRequests.filter(
                    (request: any) => request.status === "REQUESTED",
                  ).length ? (
                    <section className="ops-v33-detail-section">
                      <span className="ops-v31-kicker">
                        CANCELLATION REQUESTS
                      </span>
                      {selected.order.cancellationRequests
                        .filter(
                          (request: any) =>
                            request.status === "REQUESTED",
                        )
                        .map((request: any) => (
                          <article
                            className="ops-v33-intervention"
                            key={request.id}
                          >
                            <div>
                              <strong>{request.reason}</strong>
                              <small>{request.details}</small>
                            </div>
                            <div>
                              <button
                                disabled={busy === request.id}
                                onClick={() =>
                                  void resolveCancellation(
                                    request.id,
                                    "APPROVE",
                                  )
                                }
                              >
                                Approve
                              </button>
                              <button
                                disabled={busy === request.id}
                                onClick={() =>
                                  void resolveCancellation(
                                    request.id,
                                    "REJECT",
                                  )
                                }
                              >
                                Reject
                              </button>
                            </div>
                          </article>
                        ))}
                    </section>
                  ) : null}

                  <section className="ops-v33-detail-section">
                    <span className="ops-v31-kicker">TIMELINE</span>
                    <div className="ops-v33-timeline">
                      {selected.timeline
                        .slice(-20)
                        .reverse()
                        .map((event, index) => (
                          <div
                            key={`${event.source}-${event.at}-${index}`}
                          >
                            <strong>{label(event.type)}</strong>
                            <small>
                              {new Date(event.at).toLocaleString("en-NG")} ·{" "}
                              {event.source}
                            </small>
                          </div>
                        ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="ops-v31-empty">
                  Select an order to inspect risk, seller fulfilment,
                  cancellations and audit history.
                </div>
              )}
            </aside>
          </div>
        ) : null}

        {tab === "returns" ? (
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">
                  RETURNS + DISPUTES
                </span>
                <h2>Post-purchase resolution desk</h2>
              </div>
            </div>

            <div className="ops-v33-card-grid">
              {returns.map((item) => (
                <article key={item.id}>
                  <div className="ops-v33-card-head">
                    <div>
                      <span className="ops-v31-soft-chip">
                        {label(item.status)}
                      </span>
                      <h3>{item.order.orderNumber}</h3>
                      <small>
                        {item.merchant?.name ?? "Seller"} · {item.reason}
                      </small>
                    </div>
                    <strong>
                      {money(
                        item.approvedRefundMinor ??
                          item.requestedRefundMinor ??
                          0,
                        item.order.currency,
                      )}
                    </strong>
                  </div>

                  {item.status === "REFUND_PENDING" ? (
                    <button
                      className="ops-v33-primary"
                      disabled={busy === `refund-${item.id}`}
                      onClick={() => void queueRefund(item)}
                    >
                      Queue provider refund
                    </button>
                  ) : null}

                  {item.disputes
                    .filter((dispute) =>
                      ["OPEN", "UNDER_REVIEW"].includes(dispute.status),
                    )
                    .map((dispute) => (
                      <div
                        className="ops-v33-dispute"
                        key={dispute.id}
                      >
                        <span>Dispute: {dispute.reason}</span>
                        <div>
                          <button
                            disabled={busy === dispute.id}
                            onClick={() =>
                              void resolveDispute(
                                dispute.id,
                                "CUSTOMER",
                              )
                            }
                          >
                            {busy === dispute.id ? "Resolving…" : "Customer"}
                          </button>
                          <button
                            disabled={busy === dispute.id}
                            onClick={() =>
                              void resolveDispute(
                                dispute.id,
                                "MERCHANT",
                              )
                            }
                          >
                            {busy === dispute.id ? "Resolving…" : "Merchant"}
                          </button>
                        </div>
                      </div>
                    ))}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "payments" ? (
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">PAYMENT ORCHESTRATION</span>
                <h2>Intent and provider state</h2>
              </div>
            </div>

            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Intent</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Captured</th>
                    <th>Refunded</th>
                    <th>Last failure</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>{payment.order.orderNumber}</strong>
                        <small>{payment.order.status}</small>
                      </td>
                      <td>{payment.clientReference}</td>
                      <td>
                        {payment.provider ?? "Not selected"}
                      </td>
                      <td>
                        <span className="ops-v31-soft-chip">
                          {label(payment.status)}
                        </span>
                      </td>
                      <td>
                        {money(
                          payment.capturedMinor,
                          payment.currency,
                        )}
                      </td>
                      <td>
                        {money(
                          payment.refundedMinor,
                          payment.currency,
                        )}
                      </td>
                      <td>
                        {payment.lastErrorMessage ??
                          payment.lastErrorCode ??
                          "—"}
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
