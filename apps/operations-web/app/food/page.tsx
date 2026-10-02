"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { money, OpsShell } from "../components/OpsShell";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const api = createApiClient({ baseUrl: API, credentials: "include" });

type Rules = {
  serviceFeeBps: number;
  serviceFeeMinimumMinor: number;
  serviceFeeMaximumMinor: number;
  merchantCommissionBps: number;
  goCommissionBps: number;
  maxPickupDistanceMeters: number;
  maxPickupEtaSeconds: number;
};

type Economics = {
  serviceFeeBps: number;
  merchantCommissionBps: number;
  merchantCommissionMinor: number;
  merchantFundedDiscountMinor: number;
  bazaaraFundedDiscountMinor: number;
  merchantNetMinor: number;
  courierGrossMinor: number;
  goCommissionBps: number;
  goCommissionMinor: number;
  courierNetMinor: number;
  courierPayoutMinor: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: string;
  totalMinor: number;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  tipMinor: number;
  discountMinor: number;
  courierUserId: string | null;
  paymentStatus: string;
  placedAt: string;
  restaurant: { id: string; name: string };
  economics: Economics | null;
};

type Row = {
  order: Order;
  ageMinutes: number;
  delayed: boolean;
  attention: "UNASSIGNED_COURIER" | "DELAYED" | null;
};

type Overview = {
  rules: Rules;
  kpis: { open: number; delayed: number; unassignedReady: number; delivered: number };
  orders: Row[];
};

type Commercial = {
  merchantCommissionBps: number;
  source: string;
  policyId: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  reason: string | null;
};

type RestaurantAdmin = {
  id: string;
  slug: string;
  name: string;
  organizationId: string;
  status: string;
  acceptingOrders: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  maxActiveOrders: number;
  prepTimeBufferMin: number;
  pauseUntil: string | null;
  rating: number;
  ratingCount: number;
  commercial: Commercial;
  metrics: {
    openOrders: number;
    recentOrders: number;
    cancellationRate: number;
    openSupportCases: number;
    recentMerchantNetMinor: number;
  };
};

type CommissionPolicy = {
  id: string;
  scope: "GLOBAL" | "RESTAURANT";
  restaurantId: string | null;
  restaurantName: string | null;
  merchantCommissionBps: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
  reason: string;
  createdAt: string;
};

type AdminIssue = {
  id: string; orderId: string; orderNumber: string; type: string; status: string; details: string;
  requestedRefundMinor: number | null; approvedRefundMinor: number | null; paymentStatus: string; orderStatus: string; totalMinor: number;
  merchantCommissionMinor: number; merchantNetMinor: number; createdAt: string; restaurant: { id: string; name: string };
};

type AdminPromotion = {
  id: string; restaurantId: string; restaurant: { id: string; name: string }; code: string | null; title: string; description: string | null;
  discountType: "PERCENT" | "FIXED"; value: number; fundingSource: string; merchantFundingBps: number; startsAt: string; endsAt: string; active: boolean;
};

type AdminReview = {
  id: string; orderNumber: string; restaurant: { id: string; name: string }; rating: number; foodRating: number | null; deliveryRating: number | null;
  text: string | null; restaurantReply: string | null; createdAt: string;
};

type AdminMenu = {
  restaurant: { id: string; name: string };
  sections: Array<{ id: string; name: string; active: boolean; items: Array<{ id: string; name: string; description: string | null; priceMinor: number; active: boolean; soldOut: boolean; prepMinutes: number | null; modifierGroups: Array<{ id: string; name: string; options: Array<{ id: string; name: string; priceDeltaMinor: number; active: boolean }> }> }> }>;
};


function percent(bps: number) {
  return `${(bps / 100).toFixed(2).replace(/\.00$/, "")}%`;
}

function dateTimeLocalValue(date = new Date()) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export default function FoodOperations() {
  const [data, setData] = useState<Overview | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantAdmin[]>([]);
  const [policies, setPolicies] = useState<CommissionPolicy[]>([]);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [menu, setMenu] = useState<AdminMenu | null>(null);
  const [menuRestaurantId, setMenuRestaurantId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [policyForm, setPolicyForm] = useState({
    scope: "RESTAURANT" as "GLOBAL" | "RESTAURANT",
    restaurantId: "",
    merchantCommissionPercent: "12",
    effectiveFrom: dateTimeLocalValue(),
    effectiveTo: "",
    reason: "",
  });
  const [promotionForm, setPromotionForm] = useState({
    restaurantId: "", title: "", code: "", discountType: "PERCENT" as "PERCENT" | "FIXED", value: "10",
    fundingSource: "BAZAARA" as "MERCHANT" | "BAZAARA" | "SHARED", merchantFundingPercent: "0", startsAt: dateTimeLocalValue(), endsAt: dateTimeLocalValue(new Date(Date.now() + 7 * 86400000)),
  });
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const [next, restaurantResult, policyResult, issueResult, promotionResult, reviewResult] = await Promise.all([
        api.get<Overview>("/v1/admin/food/overview", { cache: "no-store" }),
        api.get<{ restaurants: RestaurantAdmin[] }>("/v1/admin/food/restaurants", { cache: "no-store" }),
        api.get<{ policies: CommissionPolicy[] }>("/v1/admin/food/commission-policies", { cache: "no-store" }),
        api.get<{ issues: AdminIssue[] }>("/v1/admin/food/issues", { cache: "no-store" }),
        api.get<{ promotions: AdminPromotion[] }>("/v1/admin/food/promotions", { cache: "no-store" }),
        api.get<{ reviews: AdminReview[] }>("/v1/admin/food/reviews", { cache: "no-store" }),
      ]);
      setData(next);
      setRestaurants(restaurantResult.restaurants);
      setPolicies(policyResult.policies);
      setIssues(issueResult.issues);
      setPromotions(promotionResult.promotions);
      setReviews(reviewResult.reviews);
      setSelectedOrderId((current) => current || next.orders[0]?.order.id || "");
      setPolicyForm((current) => ({ ...current, restaurantId: current.restaurantId || restaurantResult.restaurants[0]?.id || "" }));
      setPromotionForm((current) => ({ ...current, restaurantId: current.restaurantId || restaurantResult.restaurants[0]?.id || "" }));
      setMenuRestaurantId((current) => current || restaurantResult.restaurants[0]?.id || "");
      setForm({
        serviceFeeBps: String(next.rules.serviceFeeBps / 100),
        serviceFeeMinimumMinor: String(next.rules.serviceFeeMinimumMinor / 100),
        serviceFeeMaximumMinor: String(next.rules.serviceFeeMaximumMinor / 100),
        merchantCommissionBps: String(next.rules.merchantCommissionBps / 100),
        goCommissionBps: String(next.rules.goCommissionBps / 100),
        maxPickupDistanceMeters: String(next.rules.maxPickupDistanceMeters / 1000),
        maxPickupEtaSeconds: String(Math.round(next.rules.maxPickupEtaSeconds / 60)),
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Food Operations");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const rows = data?.orders ?? [];
    return {
      gmv: rows.reduce((sum, row) => sum + row.order.totalMinor, 0),
      merchantNet: rows.reduce((sum, row) => sum + (row.order.economics?.merchantNetMinor ?? 0), 0),
      commission: rows.reduce((sum, row) => sum + (row.order.economics?.merchantCommissionMinor ?? 0), 0),
      courierPayout: rows.reduce((sum, row) => sum + (row.order.economics?.courierPayoutMinor ?? 0), 0),
    };
  }, [data]);

  const filtered = useMemo(() => {
    const rows = data?.orders ?? [];
    if (filter === "ALL") return rows;
    if (filter === "ATTENTION") return rows.filter((row) => row.attention);
    return rows.filter((row) => row.order.status === filter);
  }, [data, filter]);

  const selectedOrder = useMemo(
    () => data?.orders.find((row) => row.order.id === selectedOrderId) ?? null,
    [data, selectedOrderId],
  );

  const filteredRestaurants = useMemo(() => {
    const q = restaurantQuery.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((restaurant) => `${restaurant.name} ${restaurant.slug} ${restaurant.status}`.toLowerCase().includes(q));
  }, [restaurantQuery, restaurants]);

  async function saveRules(event: FormEvent) {
    event.preventDefault();
    setBusy("rules");
    setError("");
    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>("/v1/admin/food/rules", {
        serviceFeeBps: Math.round(Number(form.serviceFeeBps) * 100),
        serviceFeeMinimumMinor: Math.round(Number(form.serviceFeeMinimumMinor) * 100),
        serviceFeeMaximumMinor: Math.round(Number(form.serviceFeeMaximumMinor) * 100),
        merchantCommissionBps: Math.round(Number(form.merchantCommissionBps) * 100),
        goCommissionBps: Math.round(Number(form.goCommissionBps) * 100),
        maxPickupDistanceMeters: Math.round(Number(form.maxPickupDistanceMeters) * 1000),
        maxPickupEtaSeconds: Math.round(Number(form.maxPickupEtaSeconds) * 60),
      });
      setNotice(result.actionState === "ALREADY_DONE" ? "✓ Food rules already matched the saved server configuration." : "Food service-fee, default commission and GO dispatch rules updated. Existing order snapshots were not recalculated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update Food rules");
    } finally {
      setBusy("");
    }
  }

  async function createPolicy(event: FormEvent) {
    event.preventDefault();
    setBusy("policy");
    setError("");
    try {
      await api.post("/v1/admin/food/commission-policies", {
        scope: policyForm.scope,
        restaurantId: policyForm.scope === "RESTAURANT" ? policyForm.restaurantId : null,
        merchantCommissionBps: Math.round(Number(policyForm.merchantCommissionPercent) * 100),
        effectiveFrom: new Date(policyForm.effectiveFrom).toISOString(),
        effectiveTo: policyForm.effectiveTo ? new Date(policyForm.effectiveTo).toISOString() : null,
        reason: policyForm.reason,
      });
      setPolicyForm((current) => ({ ...current, effectiveFrom: dateTimeLocalValue(), effectiveTo: "", reason: "" }));
      setNotice("Commission policy created. It will apply only to orders placed within its effective window.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create commission policy");
    } finally {
      setBusy("");
    }
  }

  async function togglePolicy(policy: CommissionPolicy) {
    setBusy(`policy:${policy.id}`);
    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/food/commission-policies/${policy.id}`, { active: !policy.active });
      setNotice(result.actionState === "ALREADY_DONE" ? "✓ Commission policy state was already current on the server." : `Commission policy ${policy.active ? "deactivated" : "activated"}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update commission policy");
    } finally {
      setBusy("");
    }
  }

  async function patchRestaurant(restaurant: RestaurantAdmin, input: Record<string, unknown>, message: string) {
    setBusy(`restaurant:${restaurant.id}`);
    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/food/restaurants/${restaurant.id}`, input);
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${restaurant.name} already had that setting on the server.` : message);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update restaurant");
    } finally {
      setBusy("");
    }
  }

  async function updateIssue(issue: AdminIssue, status: "OPEN" | "INVESTIGATING" | "APPROVED" | "REJECTED" | "RESOLVED") {
    setBusy(`issue:${issue.id}`);
    setError("");
    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/food/issues/${issue.id}`, {
        status,
        approvedRefundMinor: status === "APPROVED" ? issue.requestedRefundMinor : undefined,
      });
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${issue.orderNumber} was already ${status.toLowerCase().replaceAll("_", " ")}.` : status === "APPROVED" && issue.requestedRefundMinor
        ? `Refund approval of ${money(issue.requestedRefundMinor)} recorded for ${issue.orderNumber}. Provider settlement remains separately auditable.`
        : `${issue.orderNumber} moved to ${status}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update Food issue");
    } finally { setBusy(""); }
  }

  async function createPromotion(event: FormEvent) {
    event.preventDefault();
    setBusy("promotion:create");
    setError("");
    try {
      const value = promotionForm.discountType === "PERCENT" ? Math.round(Number(promotionForm.value)) : Math.round(Number(promotionForm.value) * 100);
      await api.post("/v1/admin/food/promotions", {
        restaurantId: promotionForm.restaurantId,
        title: promotionForm.title,
        code: promotionForm.code || null,
        discountType: promotionForm.discountType,
        value,
        minSubtotalMinor: 0,
        maxDiscountMinor: null,
        fundingSource: promotionForm.fundingSource,
        merchantFundingBps: promotionForm.fundingSource === "SHARED" ? Math.round(Number(promotionForm.merchantFundingPercent) * 100) : promotionForm.fundingSource === "MERCHANT" ? 10000 : 0,
        startsAt: new Date(promotionForm.startsAt).toISOString(),
        endsAt: new Date(promotionForm.endsAt).toISOString(),
      });
      setPromotionForm((current) => ({ ...current, title: "", code: "" }));
      setNotice("Food promotion created with its funding source recorded explicitly.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create Food promotion");
    } finally { setBusy(""); }
  }

  async function togglePromotion(promotion: AdminPromotion) {
    setBusy(`promotion:${promotion.id}`);
    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/food/promotions/${promotion.id}`, { active: !promotion.active });
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${promotion.title} already had that campaign state.` : `${promotion.title} ${promotion.active ? "paused" : "activated"}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update promotion");
    } finally { setBusy(""); }
  }

  async function loadMenu(restaurantId = menuRestaurantId) {
    if (!restaurantId) return;
    setBusy("menu:load");
    try {
      setMenu(await api.get<AdminMenu>(`/v1/admin/food/restaurants/${restaurantId}/menu`, { cache: "no-store" }));
      setMenuRestaurantId(restaurantId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Food menu");
    } finally { setBusy(""); }
  }

  async function patchMenuItem(item: AdminMenu["sections"][number]["items"][number], input: Record<string, unknown>) {
    setBusy(`menu:${item.id}`);
    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/food/menu-items/${item.id}`, input);
      setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${item.name} already had that menu state.` : `${item.name} menu visibility updated.`);
      await loadMenu();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update menu item");
    } finally { setBusy(""); }
  }

  return (
    <OpsShell active="/food">
      <main className="ops-v31-main food-admin-v6">
        <section className="ops-v33-domain-hero food">
          <div>
            <span className="ops-v31-kicker">FOOD CONTROL CENTRE · OPERATIONS</span>
            <h1>Restaurant network, money and GO in one control plane.</h1>
            <p>Operate live Food orders, restaurant health, commission policy, GO handoff and immutable per-order economics without touching the customer Food UI.</p>
          </div>
          <div className="ops-v33-hero-stat"><span>NETWORK GMV</span><strong>{money(metrics.gmv)}</strong><small>recent Food order window</small></div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <section className="ops-v31-command-kpis">
          <article><span>OPEN ORDERS</span><strong>{data?.kpis.open ?? "—"}</strong><small>restaurant orders in progress</small></article>
          <article className={data?.kpis.delayed ? "attention" : ""}><span>DELAYED</span><strong>{data?.kpis.delayed ?? "—"}</strong><small>outside operational threshold</small></article>
          <article className={data?.kpis.unassignedReady ? "attention" : ""}><span>READY / NO COURIER</span><strong>{data?.kpis.unassignedReady ?? "—"}</strong><small>needs GO assignment</small></article>
          <article><span>FOOD COMMISSION</span><strong>{money(metrics.commission)}</strong><small>snapshotted merchant commission</small></article>
          <article><span>MERCHANT NET</span><strong>{money(metrics.merchantNet)}</strong><small>restaurant settlement basis</small></article>
          <article><span>GO PAYOUT</span><strong>{money(metrics.courierPayout)}</strong><small>courier net + tips</small></article>
        </section>

        <div className="ops-v31-dashboard-grid food-v6-order-grid">
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div><span className="ops-v31-kicker">ORDER NETWORK</span><h2>Live Food timeline</h2></div>
              <select className="ops-v33-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="ALL">All recent</option><option value="ATTENTION">Needs attention</option><option value="PLACED">Placed</option><option value="ACCEPTED">Accepted</option><option value="PREPARING">Preparing</option><option value="READY">Ready</option><option value="PICKED_UP">Picked up</option><option value="ON_THE_WAY">On the way</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead><tr><th>Order</th><th>Restaurant</th><th>Status</th><th>Age</th><th>Courier</th><th>Payment</th><th>Total</th></tr></thead>
                <tbody>{filtered.slice(0, 120).map((row) => (
                  <tr key={row.order.id} className={`${row.attention ? "ops-v33-attention-row" : ""} ${selectedOrderId === row.order.id ? "food-v6-selected-row" : ""}`} onClick={() => setSelectedOrderId(row.order.id)}>
                    <td><strong>{row.order.orderNumber}</strong><small>{row.order.fulfillmentType}</small></td>
                    <td>{row.order.restaurant.name}</td><td><span className="ops-v31-soft-chip">{row.order.status}</span></td>
                    <td>{row.ageMinutes} min{row.attention ? <small>{row.attention.replaceAll("_", " ")}</small> : null}</td>
                    <td>{row.order.courierUserId ? "Assigned" : "Unassigned"}</td><td>{row.order.paymentStatus}</td><td><strong>{money(row.order.totalMinor, "NGN")}</strong></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <aside className="ops-v31-panel food-v6-economics">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">ORDER ECONOMICS</span><h2>{selectedOrder?.order.orderNumber ?? "Select an order"}</h2></div></div>
            {selectedOrder ? <>
              <div className="food-v6-money-stack">
                <div><span>Food subtotal</span><strong>{money(selectedOrder.order.subtotalMinor)}</strong></div>
                <div><span>Customer service fee</span><strong>{money(selectedOrder.order.serviceFeeMinor)}</strong></div>
                <div><span>Delivery fee</span><strong>{money(selectedOrder.order.deliveryFeeMinor)}</strong></div>
                <div><span>Tip</span><strong>{money(selectedOrder.order.tipMinor)}</strong></div>
                <div><span>Discount</span><strong>-{money(selectedOrder.order.discountMinor)}</strong></div>
                <div className="total"><span>Customer total</span><strong>{money(selectedOrder.order.totalMinor)}</strong></div>
              </div>
              {selectedOrder.order.economics ? <div className="food-v6-ledger">
                <h3>Settlement snapshot</h3>
                <div><span>Restaurant commission · {percent(selectedOrder.order.economics.merchantCommissionBps)}</span><b>{money(selectedOrder.order.economics.merchantCommissionMinor)}</b></div>
                <div><span>Restaurant net</span><b>{money(selectedOrder.order.economics.merchantNetMinor)}</b></div>
                <div><span>GO gross delivery</span><b>{money(selectedOrder.order.economics.courierGrossMinor)}</b></div>
                <div><span>GO platform commission · {percent(selectedOrder.order.economics.goCommissionBps)}</span><b>{money(selectedOrder.order.economics.goCommissionMinor)}</b></div>
                <div><span>Courier net + tip</span><b>{money(selectedOrder.order.economics.courierPayoutMinor)}</b></div>
              </div> : <div className="ops-v31-empty">No economics snapshot yet.</div>}
              <p className="food-v6-lock-note">This snapshot belongs to the order and is never rewritten by later commission changes.</p>
            </> : <div className="ops-v31-empty">Choose an order to inspect its complete financial split.</div>}
          </aside>
        </div>

        <div className="food-v6-config-grid">
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">PLATFORM RULES</span><h2>Service fee + GO dispatch</h2></div></div>
            <div className="ops-v33-policy-note">These are regional defaults. Restaurant commission overrides are managed separately and never rewrite historical orders.</div>
            <form className="ops-v33-form food-v6-rules" onSubmit={saveRules}>
              <label>Customer service fee %<input type="number" min="0" max="30" step="0.1" value={form.serviceFeeBps ?? ""} onChange={(e) => setForm({ ...form, serviceFeeBps: e.target.value })} /></label>
              <label>Minimum service fee ₦<input type="number" min="0" value={form.serviceFeeMinimumMinor ?? ""} onChange={(e) => setForm({ ...form, serviceFeeMinimumMinor: e.target.value })} /></label>
              <label>Maximum service fee ₦<input type="number" min="0" value={form.serviceFeeMaximumMinor ?? ""} onChange={(e) => setForm({ ...form, serviceFeeMaximumMinor: e.target.value })} /></label>
              <label>Regional default restaurant commission %<input type="number" min="0" max="40" step="0.1" value={form.merchantCommissionBps ?? ""} onChange={(e) => setForm({ ...form, merchantCommissionBps: e.target.value })} /></label>
              <label>GO commission %<input type="number" min="0" max="30" step="0.1" value={form.goCommissionBps ?? ""} onChange={(e) => setForm({ ...form, goCommissionBps: e.target.value })} /></label>
              <label>Max pickup distance km<input type="number" min="0.5" max="30" step="0.1" value={form.maxPickupDistanceMeters ?? ""} onChange={(e) => setForm({ ...form, maxPickupDistanceMeters: e.target.value })} /></label>
              <label>Max pickup ETA minutes<input type="number" min="1" max="60" value={form.maxPickupEtaSeconds ?? ""} onChange={(e) => setForm({ ...form, maxPickupEtaSeconds: e.target.value })} /></label>
              <button className="ops-v33-primary" disabled={busy === "rules"}>{busy === "rules" ? "Saving…" : "Save Food rules"}</button>
            </form>
          </section>

          <section className="ops-v31-panel food-v6-commission-panel">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">COMMISSION CONTROL</span><h2>Schedule or override restaurant commission</h2></div></div>
            <form className="food-v6-policy-form" onSubmit={createPolicy}>
              <label>Scope<select value={policyForm.scope} onChange={(e) => setPolicyForm({ ...policyForm, scope: e.target.value as "GLOBAL" | "RESTAURANT" })}><option value="GLOBAL">Global Food policy</option><option value="RESTAURANT">Restaurant override</option></select></label>
              {policyForm.scope === "RESTAURANT" ? <label>Restaurant<select required value={policyForm.restaurantId} onChange={(e) => setPolicyForm({ ...policyForm, restaurantId: e.target.value })}>{restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select></label> : null}
              <label>Commission %<input required type="number" min="0" max="40" step="0.1" value={policyForm.merchantCommissionPercent} onChange={(e) => setPolicyForm({ ...policyForm, merchantCommissionPercent: e.target.value })} /></label>
              <label>Effective from<input required type="datetime-local" value={policyForm.effectiveFrom} onChange={(e) => setPolicyForm({ ...policyForm, effectiveFrom: e.target.value })} /></label>
              <label>End date (optional)<input type="datetime-local" value={policyForm.effectiveTo} onChange={(e) => setPolicyForm({ ...policyForm, effectiveTo: e.target.value })} /></label>
              <label className="wide">Reason / contract note<textarea required minLength={3} value={policyForm.reason} onChange={(e) => setPolicyForm({ ...policyForm, reason: e.target.value })} placeholder="Why is this rate changing?" /></label>
              <button className="ops-v33-primary" disabled={busy === "policy"}>{busy === "policy" ? "Creating…" : "Create commission policy"}</button>
            </form>
            <div className="food-v6-policy-list">
              {policies.slice(0, 10).map((policy) => <article key={policy.id} className={policy.active ? "" : "inactive"}>
                <div><strong>{policy.scope === "GLOBAL" ? "Global Food" : policy.restaurantName ?? "Restaurant"}</strong><span>{percent(policy.merchantCommissionBps)} · {new Date(policy.effectiveFrom).toLocaleString("en-NG")}{policy.effectiveTo ? ` → ${new Date(policy.effectiveTo).toLocaleString("en-NG")}` : " → open ended"}</span><small>{policy.reason}</small></div>
                <button disabled={busy === `policy:${policy.id}`} onClick={() => void togglePolicy(policy)}>{policy.active ? "Deactivate" : "Activate"}</button>
              </article>)}
              {!policies.length ? <div className="ops-v31-empty">No scheduled commission policies. The regional default applies.</div> : null}
            </div>
          </section>
        </div>

        <section className="ops-v31-panel food-v6-restaurants">
          <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">RESTAURANT NETWORK</span><h2>Food business health + controls</h2></div><input value={restaurantQuery} onChange={(e) => setRestaurantQuery(e.target.value)} placeholder="Search restaurant" /></div>
          <div className="food-v6-restaurant-grid">
            {filteredRestaurants.map((restaurant) => <article key={restaurant.id}>
              <header><div><span>{restaurant.status}</span><h3>{restaurant.name}</h3><small>{restaurant.slug}</small></div><b>{percent(restaurant.commercial.merchantCommissionBps)}</b></header>
              <div className="food-v6-restaurant-metrics"><span><b>{restaurant.metrics.openOrders}</b> open orders</span><span><b>{Math.round(restaurant.metrics.cancellationRate * 100)}%</b> cancellations</span><span><b>{restaurant.metrics.openSupportCases}</b> support</span><span><b>{restaurant.rating.toFixed(1)}</b> rating</span></div>
              <div className="food-v6-commercial-source">Commission source: <strong>{restaurant.commercial.source.replaceAll("_", " ")}</strong>{restaurant.commercial.reason ? ` · ${restaurant.commercial.reason}` : ""}</div>
              <footer>
                <button disabled={busy === `restaurant:${restaurant.id}`} onClick={() => void patchRestaurant(restaurant, { acceptingOrders: !restaurant.acceptingOrders }, restaurant.acceptingOrders ? `${restaurant.name} paused for new orders.` : `${restaurant.name} is accepting orders.`)}>{restaurant.acceptingOrders ? "Pause orders" : "Resume orders"}</button>
                <button disabled={busy === `restaurant:${restaurant.id}`} onClick={() => void patchRestaurant(restaurant, { status: restaurant.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED", acceptingOrders: restaurant.status === "SUSPENDED" }, restaurant.status === "SUSPENDED" ? `${restaurant.name} reactivated.` : `${restaurant.name} suspended.`)}>{restaurant.status === "SUSPENDED" ? "Reactivate" : "Suspend"}</button>
                <button onClick={() => setPolicyForm({ ...policyForm, scope: "RESTAURANT", restaurantId: restaurant.id, merchantCommissionPercent: String(restaurant.commercial.merchantCommissionBps / 100) })}>Commission</button>
              </footer>
            </article>)}
          </div>
        </section>
      

        <div className="food-v6-ops-grid">
          <section className="ops-v31-panel food-v6-issues-panel">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">FOOD EXCEPTIONS</span><h2>Issues, refunds and disputes</h2></div><span className="ops-v31-soft-chip">{issues.filter((issue) => !["RESOLVED", "REJECTED"].includes(issue.status)).length} open</span></div>
            <div className="food-v6-admin-list">
              {issues.slice(0, 40).map((issue) => <article key={issue.id}>
                <header><div><strong>{issue.orderNumber} · {issue.restaurant.name}</strong><span>{issue.type.replaceAll("_", " ")} · {issue.status}</span></div><b>{issue.requestedRefundMinor == null ? "No refund" : `Requested ${money(issue.requestedRefundMinor)}`}</b></header>
                <p>{issue.details}</p>
                <div className="food-v6-admin-meta"><span>Order {issue.orderStatus}</span><span>Payment {issue.paymentStatus}</span><span>Total {money(issue.totalMinor)}</span><span>Merchant net {money(issue.merchantNetMinor)}</span></div>
                <footer>
                  <button className={issue.status === "INVESTIGATING" ? "smart-done" : ""} disabled={busy === `issue:${issue.id}` || issue.status === "INVESTIGATING"} onClick={() => void updateIssue(issue, "INVESTIGATING")}>{issue.status === "INVESTIGATING" ? "✓ Investigating" : "Investigate"}</button>
                  {issue.requestedRefundMinor != null ? <button className={`positive ${issue.status === "APPROVED" ? "smart-done" : ""}`} disabled={busy === `issue:${issue.id}` || issue.status === "APPROVED"} onClick={() => void updateIssue(issue, "APPROVED")}>{issue.status === "APPROVED" ? "✓ Refund approved" : "Approve requested refund"}</button> : null}
                  <button className={issue.status === "REJECTED" ? "smart-done" : ""} disabled={busy === `issue:${issue.id}` || issue.status === "REJECTED"} onClick={() => void updateIssue(issue, "REJECTED")}>{issue.status === "REJECTED" ? "✓ Rejected" : "Reject"}</button>
                  <button className={issue.status === "RESOLVED" ? "smart-done" : ""} disabled={busy === `issue:${issue.id}` || issue.status === "RESOLVED"} onClick={() => void updateIssue(issue, "RESOLVED")}>{issue.status === "RESOLVED" ? "✓ Resolved" : "Resolve"}</button>
                </footer>
              </article>)}
              {!issues.length ? <div className="ops-v31-empty">No Food issues in the queue.</div> : null}
            </div>
          </section>

          <section className="ops-v31-panel food-v6-promo-admin">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">PROMOTION CONTROL</span><h2>Funding-aware Food campaigns</h2></div></div>
            <form className="food-v6-promo-form" onSubmit={createPromotion}>
              <label>Restaurant<select required value={promotionForm.restaurantId} onChange={(e) => setPromotionForm({ ...promotionForm, restaurantId: e.target.value })}>{restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select></label>
              <label>Title<input required value={promotionForm.title} onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })} placeholder="Weekend Food boost" /></label>
              <label>Code<input value={promotionForm.code} onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value.toUpperCase() })} placeholder="Optional" /></label>
              <label>Discount<select value={promotionForm.discountType} onChange={(e) => setPromotionForm({ ...promotionForm, discountType: e.target.value as "PERCENT" | "FIXED" })}><option value="PERCENT">Percent</option><option value="FIXED">Fixed ₦</option></select></label>
              <label>Value<input type="number" min="1" required value={promotionForm.value} onChange={(e) => setPromotionForm({ ...promotionForm, value: e.target.value })} /></label>
              <label>Funding<select value={promotionForm.fundingSource} onChange={(e) => setPromotionForm({ ...promotionForm, fundingSource: e.target.value as "MERCHANT" | "BAZAARA" | "SHARED" })}><option value="BAZAARA">Bazaara funded</option><option value="MERCHANT">Restaurant funded</option><option value="SHARED">Shared funding</option></select></label>
              {promotionForm.fundingSource === "SHARED" ? <label>Merchant share %<input type="number" min="0" max="100" value={promotionForm.merchantFundingPercent} onChange={(e) => setPromotionForm({ ...promotionForm, merchantFundingPercent: e.target.value })} /></label> : null}
              <label>Starts<input type="datetime-local" required value={promotionForm.startsAt} onChange={(e) => setPromotionForm({ ...promotionForm, startsAt: e.target.value })} /></label>
              <label>Ends<input type="datetime-local" required value={promotionForm.endsAt} onChange={(e) => setPromotionForm({ ...promotionForm, endsAt: e.target.value })} /></label>
              <button className="ops-v33-primary" disabled={busy === "promotion:create"}>{busy === "promotion:create" ? "Creating…" : "Create Food campaign"}</button>
            </form>
            <div className="food-v6-policy-list">
              {promotions.slice(0, 18).map((promotion) => <article key={promotion.id} className={promotion.active ? "" : "inactive"}>
                <div><strong>{promotion.title} · {promotion.restaurant.name}</strong><span>{promotion.discountType === "PERCENT" ? `${promotion.value}%` : money(promotion.value)} · {promotion.fundingSource.replaceAll("_", " ")}</span><small>{promotion.code ?? "No code"} · ends {new Date(promotion.endsAt).toLocaleString("en-NG")}</small></div>
                <button disabled={busy === `promotion:${promotion.id}`} onClick={() => void togglePromotion(promotion)}>{promotion.active ? "Pause" : "Activate"}</button>
              </article>)}
            </div>
          </section>
        </div>

        <div className="food-v6-ops-grid">
          <section className="ops-v31-panel food-v6-menu-admin">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">MENU OVERSIGHT</span><h2>Inspect and intervene in catalogue availability</h2></div></div>
            <div className="food-v6-menu-selector"><select value={menuRestaurantId} onChange={(e) => { setMenuRestaurantId(e.target.value); void loadMenu(e.target.value); }}>{restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select><button onClick={() => void loadMenu()} disabled={busy === "menu:load"}>{busy === "menu:load" ? "Loading…" : "Load menu"}</button></div>
            {menu ? <div className="food-v6-menu-sections">{menu.sections.map((section) => <div key={section.id} className="food-v6-menu-section"><h3>{section.name}<small>{section.active ? "ACTIVE" : "HIDDEN"}</small></h3>{section.items.map((item) => <article key={item.id}><div><strong>{item.name}</strong><span>{money(item.priceMinor)} · {item.prepMinutes ?? "—"} min · {item.modifierGroups.length} modifier groups</span></div><div className="food-v6-menu-actions"><button disabled={busy === `menu:${item.id}`} onClick={() => void patchMenuItem(item, { soldOut: !item.soldOut })}>{item.soldOut ? "Mark available" : "Mark sold out"}</button><button disabled={busy === `menu:${item.id}`} onClick={() => void patchMenuItem(item, { active: !item.active })}>{item.active ? "Hide item" : "Restore item"}</button></div></article>)}</div>)}</div> : <div className="ops-v31-empty">Load a restaurant menu to inspect item availability and modifiers.</div>}
          </section>

          <section className="ops-v31-panel food-v6-review-admin">
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">REVIEW INTELLIGENCE</span><h2>Customer feedback across Food</h2></div><span className="ops-v31-soft-chip">{reviews.length} recent</span></div>
            <div className="food-v6-review-list">
              {reviews.slice(0, 35).map((review) => <article key={review.id}><header><strong>{"★".repeat(Math.max(1, Math.min(5, review.rating)))} · {review.restaurant.name}</strong><span>{review.orderNumber}</span></header><p>{review.text || "Rating submitted without written feedback."}</p><div><span>Food {review.foodRating ?? "—"}/5</span><span>Delivery {review.deliveryRating ?? "—"}/5</span><span>{review.restaurantReply ? "Restaurant replied" : "No restaurant reply yet"}</span></div></article>)}
              {!reviews.length ? <div className="ops-v31-empty">No Food reviews yet.</div> : null}
            </div>
          </section>
        </div>
      </main>
    </OpsShell>
  );
}
