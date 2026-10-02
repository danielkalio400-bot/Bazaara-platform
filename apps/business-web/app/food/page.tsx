"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

type Commercial = {
  merchantCommissionBps: number;
  source: string;
  policyId: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  reason: string | null;
};

type OpeningHour = { dayOfWeek: number; openMinute: number; closeMinute: number; closed: boolean };

type Restaurant = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  acceptingOrders: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  asapEnabled: boolean;
  scheduledEnabled: boolean;
  preorderEnabled: boolean;
  deliveryFeeMinor: number;
  minimumOrderMinor: number;
  pausedUntil: string | null;
  rating: number;
  ratingCount: number;
  capacity: { maxActiveOrders: number; prepTimeBufferMin: number };
  commercial?: Commercial;
  openingHours: OpeningHour[];
  menu: Array<{
    id: string;
    title: string;
    items: Array<{ id: string; name: string; priceMinor: number; active: boolean; soldOut: boolean; prepMinutes?: number | null }>;
  }>;
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

type TrackingEvent = { id: string; status: string; message: string | null; createdAt: string };

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: string;
  paymentStatus: string;
  currency: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  tipMinor: number;
  discountMinor: number;
  totalMinor: number;
  note?: string | null;
  scheduledFor?: string | null;
  courierUserId?: string | null;
  placedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  economics: Economics | null;
  timing: {
    elapsedSeconds: number;
    estimatedDeliveryMin: number;
    estimatedDeliveryMax: number;
    phases: { orderToCourierAssignedSeconds: number | null; courierAssignedToPickupSeconds: number | null; pickupToDeliverySeconds: number | null };
  };
  restaurant: { id: string; name: string };
  items: Array<{ id: string; name: string; quantity: number; unitPriceMinor?: number; lineTotalMinor?: number; specialInstructions?: string | null }>;
  tracking: TrackingEvent[];
  supportIssues?: Array<{ id: string; type: string; status: string; details: string; requestedRefundMinor?: number | null; approvedRefundMinor?: number | null }>;
};

type Report = {
  orders: number;
  grossFoodSalesMinor: number;
  merchantCommissionMinor: number;
  merchantNetMinor: number;
  open: number;
  delivered: number;
  cancelled: number;
  cancellationRate: number;
  averageOrderValueMinor: number;
  tipsMinor: number;
  openIssues: number;
  commercial: Commercial;
  reviews: { count: number; average: number };
};

type Review = {
  id: string;
  orderNumber: string;
  restaurant: { id: string; name: string };
  rating: number;
  foodRating: number | null;
  deliveryRating: number | null;
  text: string | null;
  restaurantReply: string | null;
  createdAt: string;
};

type Issue = {
  id: string;
  orderId: string;
  orderNumber: string;
  restaurant: { id: string; name: string };
  type: string;
  status: string;
  details: string;
  requestedRefundMinor: number | null;
  approvedRefundMinor: number | null;
  settlementRequired: boolean;
  createdAt: string;
};

type Promotion = {
  id: string;
  restaurantId: string;
  restaurant: { id: string; name: string };
  code: string | null;
  title: string;
  description: string | null;
  discountType: string;
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  fundingSource: string;
  merchantFundingBps: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const NEXT: Record<string, string | undefined> = { PLACED: "ACCEPTED", ACCEPTED: "PREPARING", PREPARING: "READY" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Tab = "overview" | "orders" | "issues" | "reviews" | "promotions" | "settings" | "finance";

function money(value = 0) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value / 100);
}
function percent(bps = 0) { return `${(bps / 100).toFixed(2).replace(/\.00$/, "")}%`; }
function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600); const m = Math.floor((safe % 3600) / 60); const s = safe % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
}
function latestPickupEvent(order: Order) {
  return [...order.tracking].reverse().find((event) => event.status === "COURIER_NEAR_PICKUP" || event.status === "COURIER_AT_PICKUP");
}
function orderElapsedSeconds(order: Order, clock: number) {
  const end = order.deliveredAt ? new Date(order.deliveredAt).getTime() : order.cancelledAt ? new Date(order.cancelledAt).getTime() : clock;
  return Math.max(0, Math.floor((end - new Date(order.placedAt).getTime()) / 1000));
}
function minuteTime(value: number) {
  const h = Math.floor(value / 60).toString().padStart(2, "0");
  const m = (value % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function timeMinute(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function FoodBusiness() {
  const business = useBusinessOrganizations();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [active, setActive] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [orderMessage, setOrderMessage] = useState("");
  const [settings, setSettings] = useState({ maxActiveOrders: "30", prepTimeBufferMin: "0", deliveryFee: "0", minimumOrder: "0" });
  const [promotionForm, setPromotionForm] = useState({ title: "", code: "", discountType: "PERCENT", value: "10", minSubtotal: "0", maxDiscount: "", startsAt: "", endsAt: "", description: "" });
  const [reviewReply, setReviewReply] = useState<Record<string, string>>({});
  const [hoursForm, setHoursForm] = useState<Record<number, { open: string; close: string; closed: boolean }>>({});

  const alertsEnabledRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const seenPaidOrdersRef = useRef<Set<string> | null>(null);
  const seenPickupEventsRef = useRef<Set<string> | null>(null);

  const soundAlert = useCallback((kind: "order" | "pickup") => {
    if (!alertsEnabledRef.current || typeof window === "undefined") return;
    try {
      const AudioCtor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      const context = audioContextRef.current ?? new AudioCtor();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const base = kind === "order" ? 880 : 660;
      (kind === "order" ? [0, .24, .48] : [0, .2]).forEach((offset, index) => {
        const oscillator = context.createOscillator(); const gain = context.createGain();
        oscillator.type = "sine"; oscillator.frequency.value = base + index * 90;
        gain.gain.setValueAtTime(.0001, context.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(.16, context.currentTime + offset + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + offset + .17);
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(context.currentTime + offset); oscillator.stop(context.currentTime + offset + .19);
      });
    } catch { /* browser audio permission */ }
  }, []);

  const surfaceNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body, tag: `bazaara-food-${title}-${body}` }); } catch { /* in-app fallback */ }
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [restaurantResult, orderResult, reviewResult, issueResult, promotionResult] = await Promise.all([
        businessRequest<{ restaurants: Restaurant[] }>("/v1/business/food/restaurants"),
        businessRequest<{ orders: Order[] }>("/v1/business/food/orders"),
        businessRequest<{ reviews: Review[] }>("/v1/business/food/reviews"),
        businessRequest<{ issues: Issue[] }>("/v1/business/food/issues"),
        businessRequest<{ promotions: Promotion[] }>("/v1/business/food/promotions"),
      ]);

      const paidOpen = orderResult.orders.filter((order) => order.paymentStatus === "PAID" && !["DELIVERED", "CANCELLED"].includes(order.status));
      const paidIds = new Set(paidOpen.map((order) => order.id));
      const pickupEvents = orderResult.orders.flatMap((order) => order.tracking.filter((event) => event.status === "COURIER_NEAR_PICKUP" || event.status === "COURIER_AT_PICKUP").map((event) => ({ order, event })));
      const pickupIds = new Set(pickupEvents.map(({ event }) => event.id));
      if (seenPaidOrdersRef.current) {
        const incoming = paidOpen.filter((order) => !seenPaidOrdersRef.current?.has(order.id));
        if (incoming.length) { const newest = incoming[0]!; soundAlert("order"); surfaceNotification(`New Food order · ${newest.orderNumber}`, `${newest.fulfillmentType} · ${money(newest.totalMinor)}`); setNotice(`${incoming.length === 1 ? newest.orderNumber : `${incoming.length} new orders`} received and paid. Kitchen action required.`); }
      }
      if (seenPickupEventsRef.current) {
        const incoming = pickupEvents.filter(({ event }) => !seenPickupEventsRef.current?.has(event.id));
        if (incoming.length) { const newest = incoming.at(-1)!; soundAlert("pickup"); surfaceNotification(newest.event.status === "COURIER_AT_PICKUP" ? "GO courier at pickup" : "GO courier arriving soon", `${newest.order.orderNumber} · ${newest.event.message ?? "Pickup proximity updated"}`); }
      }
      seenPaidOrdersRef.current = paidIds; seenPickupEventsRef.current = pickupIds;
      setRestaurants(restaurantResult.restaurants); setOrders(orderResult.orders); setReviews(reviewResult.reviews); setIssues(issueResult.issues); setPromotions(promotionResult.promotions);
      setActive((current) => current || restaurantResult.restaurants[0]?.id || "");
      setSelectedOrderId((current) => current || orderResult.orders[0]?.id || "");
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load Food Business"); }
  }, [soundAlert, surfaceNotification]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const enabled = window.localStorage.getItem("bazaara.business.food-alerts") === "1";
      alertsEnabledRef.current = enabled; setAlertsEnabled(enabled);
    }
    void load();
    const poll = window.setInterval(() => void load(), 6000);
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => { window.clearInterval(poll); window.clearInterval(timer); };
  }, [load]);

  const restaurant = restaurants.find((item) => item.id === active) ?? restaurants[0];

  useEffect(() => {
    if (!restaurant) return;
    void businessRequest<Report>(`/v1/business/food/restaurants/${restaurant.id}/report`).then(setReport).catch(() => setReport(null));
    setSettings({ maxActiveOrders: String(restaurant.capacity.maxActiveOrders), prepTimeBufferMin: String(restaurant.capacity.prepTimeBufferMin), deliveryFee: String(restaurant.deliveryFeeMinor / 100), minimumOrder: String(restaurant.minimumOrderMinor / 100) });
    const next: Record<number, { open: string; close: string; closed: boolean }> = {};
    for (let day = 0; day < 7; day += 1) {
      const row = restaurant.openingHours.find((hour) => hour.dayOfWeek === day);
      next[day] = { open: minuteTime(row?.openMinute ?? 9 * 60), close: minuteTime(row?.closeMinute ?? 22 * 60), closed: row?.closed ?? false };
    }
    setHoursForm(next);
  }, [restaurant?.id, orders.length]);

  const scopedOrders = useMemo(() => orders.filter((order) => order.restaurant.id === restaurant?.id), [orders, restaurant?.id]);
  const open = scopedOrders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const scopedReviews = reviews.filter((review) => review.restaurant.id === restaurant?.id);
  const scopedIssues = issues.filter((issue) => issue.restaurant.id === restaurant?.id);
  const scopedPromotions = promotions.filter((promotion) => promotion.restaurantId === restaurant?.id);
  const selectedOrder = scopedOrders.find((order) => order.id === selectedOrderId) ?? scopedOrders[0] ?? null;
  const menuItems = restaurant?.menu.flatMap((section) => section.items) ?? [];
  const availableItems = menuItems.filter((item) => item.active && !item.soldOut);
  const commercial = report?.commercial ?? restaurant?.commercial;
  const settingsUnchanged = Boolean(restaurant
    && Number(settings.maxActiveOrders) === restaurant.capacity.maxActiveOrders
    && Number(settings.prepTimeBufferMin) === restaurant.capacity.prepTimeBufferMin
    && Math.round(Number(settings.deliveryFee) * 100) === restaurant.deliveryFeeMinor
    && Math.round(Number(settings.minimumOrder) * 100) === restaurant.minimumOrderMinor);
  const hourUnchanged = (dayOfWeek: number) => {
    if (!restaurant || !hoursForm[dayOfWeek]) return false;
    const current = restaurant.openingHours.find((hour) => hour.dayOfWeek === dayOfWeek);
    const row = hoursForm[dayOfWeek]!;
    return (current?.openMinute ?? 9 * 60) === timeMinute(row.open)
      && (current?.closeMinute ?? 22 * 60) === timeMinute(row.close)
      && (current?.closed ?? false) === row.closed;
  };

  async function enableOrderAlerts() {
    setBusy("alerts");
    try {
      if (typeof window !== "undefined") {
        const AudioCtor = window.AudioContext ?? (window as any).webkitAudioContext;
        if (AudioCtor) { const context = audioContextRef.current ?? new AudioCtor(); audioContextRef.current = context; await context.resume(); }
        if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
        window.localStorage.setItem("bazaara.business.food-alerts", "1");
      }
      alertsEnabledRef.current = true; setAlertsEnabled(true); setNotice("Food order ringing and browser alerts are enabled on this device."); soundAlert("order");
    } catch { alertsEnabledRef.current = true; setAlertsEnabled(true); setNotice("In-page Food alerts are enabled."); }
    finally { setBusy(""); }
  }
  function disableOrderAlerts() { if (typeof window !== "undefined") window.localStorage.removeItem("bazaara.business.food-alerts"); alertsEnabledRef.current = false; setAlertsEnabled(false); setNotice("Food ringing is muted on this device."); }

  async function advance(order: Order) {
    const status = NEXT[order.status]; if (!status) return;
    setBusy(`order:${order.id}`);
    try { const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/food/orders/${order.id}/status`, "PATCH", { status }); setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${order.orderNumber} was already ${status.toLowerCase().replaceAll("_", " ")}.` : `${order.orderNumber} moved to ${status}.`); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update order"); }
    finally { setBusy(""); }
  }

  async function patchRestaurant(input: Record<string, unknown>, message: string) {
    if (!restaurant) return; setBusy("restaurant");
    try { const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/food/restaurants/${restaurant.id}`, "PATCH", input); setNotice(result.actionState === "ALREADY_DONE" ? "✓ That restaurant setting was already current on the server." : message); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update restaurant"); }
    finally { setBusy(""); }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    await patchRestaurant({ maxActiveOrders: Number(settings.maxActiveOrders), prepTimeBufferMin: Number(settings.prepTimeBufferMin), deliveryFeeMinor: Math.round(Number(settings.deliveryFee) * 100), minOrderMinor: Math.round(Number(settings.minimumOrder) * 100) }, "Restaurant operating settings saved.");
  }

  async function saveHour(dayOfWeek: number) {
    if (!restaurant || !hoursForm[dayOfWeek]) return; const row = hoursForm[dayOfWeek]!;
    setBusy(`hour:${dayOfWeek}`);
    if (hourUnchanged(dayOfWeek)) { setNotice(`✓ ${DAYS[dayOfWeek]} opening hours are already saved.`); setBusy(""); return; }
    try { const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/food/restaurants/${restaurant.id}/opening-hours`, "PUT", { dayOfWeek, openMinute: timeMinute(row.open), closeMinute: timeMinute(row.close), closed: row.closed }); setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${DAYS[dayOfWeek]} opening hours were already saved on the server.` : `${DAYS[dayOfWeek]} opening hours saved.`); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save opening hours"); }
    finally { setBusy(""); }
  }

  async function createPromotion(event: FormEvent) {
    event.preventDefault(); if (!restaurant) return; setBusy("promotion");
    try {
      await businessRequest(`/v1/business/food/restaurants/${restaurant.id}/promotions`, "POST", {
        title: promotionForm.title, code: promotionForm.code || null, description: promotionForm.description || null, discountType: promotionForm.discountType,
        value: promotionForm.discountType === "PERCENT" ? Math.round(Number(promotionForm.value)) : Math.round(Number(promotionForm.value) * 100),
        minSubtotalMinor: Math.round(Number(promotionForm.minSubtotal || 0) * 100), maxDiscountMinor: promotionForm.maxDiscount ? Math.round(Number(promotionForm.maxDiscount) * 100) : null,
        startsAt: new Date(promotionForm.startsAt).toISOString(), endsAt: new Date(promotionForm.endsAt).toISOString(),
      });
      setPromotionForm({ title: "", code: "", discountType: "PERCENT", value: "10", minSubtotal: "0", maxDiscount: "", startsAt: "", endsAt: "", description: "" });
      setNotice("Merchant-funded Food promotion created."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create promotion"); }
    finally { setBusy(""); }
  }

  async function togglePromotion(promotion: Promotion) {
    setBusy(`promo:${promotion.id}`);
    try { const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/food/promotions/${promotion.id}`, "PATCH", { active: !promotion.active }); setNotice(result.actionState === "ALREADY_DONE" ? "✓ Promotion state was already current on the server." : `Promotion ${promotion.active ? "paused" : "activated"}.`); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update promotion"); }
    finally { setBusy(""); }
  }

  async function replyReview(review: Review) {
    const text = reviewReply[review.id]?.trim(); if (!text) return; setBusy(`review:${review.id}`);
    try { const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/food/reviews/${review.id}/reply`, "POST", { text }); setReviewReply((current) => ({ ...current, [review.id]: "" })); setNotice(result.actionState === "ALREADY_DONE" ? "✓ That restaurant reply was already posted." : "Restaurant reply posted."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reply to review"); }
    finally { setBusy(""); }
  }

  async function updateIssue(issue: Issue, status: "INVESTIGATING" | "RESOLVED") {
    setBusy(`issue:${issue.id}`);
    if (issue.status === status) { setNotice(`✓ ${issue.orderNumber} is already ${status.toLowerCase()}.`); setBusy(""); return; }
    try { const result = await businessRequest<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/business/food/issues/${issue.id}`, "PATCH", { status }); setNotice(result.actionState === "ALREADY_DONE" ? `✓ ${issue.orderNumber} was already ${status.toLowerCase()}.` : `${issue.orderNumber} issue moved to ${status}.`); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update issue"); }
    finally { setBusy(""); }
  }

  async function sendOrderMessage() {
    if (!selectedOrder || !orderMessage.trim()) return; setBusy("message");
    try { await businessRequest(`/v1/business/food/orders/${selectedOrder.id}/messages`, "POST", { text: orderMessage.trim() }); setOrderMessage(""); setNotice(`Message attached to ${selectedOrder.orderNumber}.`); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send order message"); }
    finally { setBusy(""); }
  }

  return (
    <div className="business-control-shell food-business-v6">
      <BusinessHeader organization={business.organization} organizations={business.organizations} organizationId={business.organizationId} setOrganizationId={business.setOrganizationId} active="food" />
      <main className="business-control-main">
        <section className="business-page-heading business-page-heading-v3 food-v6-hero">
          <div><span className="business-kicker">FOOD OPERATIONS · RESTAURANT OS</span><h1>Operate the restaurant from one workspace.</h1><p>Orders, kitchen, GO handoff, menu health, issues, reviews, promotions, settlement and restaurant controls share the same Food backend.</p></div>
          <div className="business-page-heading-actions">
            <button className={alertsEnabled ? "business-alert-toggle active" : "business-alert-toggle"} disabled={busy === "alerts"} onClick={() => alertsEnabled ? disableOrderAlerts() : void enableOrderAlerts()}><span className="business-alert-dot" />{busy === "alerts" ? "Enabling…" : alertsEnabled ? "✓ Order alerts on" : "Enable order alerts"}</button>
            <a className="business-secondary-button" href="/food/contacts">Restaurant contacts</a>
            <a className="business-primary-button" href="/food/menu">Manage menu</a>
            <button className="business-secondary-button" disabled={!restaurant || busy === "restaurant"} onClick={() => void patchRestaurant({ acceptingOrders: !restaurant?.acceptingOrders }, restaurant?.acceptingOrders ? "New Food orders paused." : "Restaurant is accepting Food orders.")}>{restaurant?.acceptingOrders ? "Pause orders" : "Start accepting"}</button>
          </div>
        </section>

        {restaurants.length > 1 ? <div className="business-restaurant-switch"><span>Restaurant</span><select value={active} onChange={(event) => { setActive(event.target.value); setSelectedOrderId(""); }} >{restaurants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : null}
        {error ? <div className="business-alert">{error}</div> : null}{notice ? <div className="business-notice">{notice}</div> : null}

        <nav className="food-v6-tabs" aria-label="Food Business sections">
          {(["overview", "orders", "issues", "reviews", "promotions", "settings", "finance"] as Tab[]).map((value) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{value === "orders" ? `Orders · ${open.length}` : value === "issues" ? `Issues · ${scopedIssues.filter((item) => !["RESOLVED", "REJECTED"].includes(item.status)).length}` : value}</button>)}
        </nav>

        <section className="business-control-kpis business-control-kpis-v3 food-v6-kpis">
          <article><span>OPEN ORDERS</span><strong>{open.length}</strong><small>{open.filter((item) => item.status === "PREPARING").length} preparing</small></article>
          <article><span>MERCHANT NET</span><strong>{report ? money(report.merchantNetMinor) : "—"}</strong><small>{report?.orders ?? 0} orders in report</small></article>
          <article><span>COMMISSION</span><strong>{commercial ? percent(commercial.merchantCommissionBps) : "—"}</strong><small>{commercial?.source?.replaceAll("_", " ") ?? "effective rate"}</small></article>
          <article><span>RATING</span><strong>{report ? report.reviews.average.toFixed(1) : restaurant?.rating?.toFixed(1) ?? "—"}</strong><small>{report?.reviews.count ?? restaurant?.ratingCount ?? 0} reviews</small></article>
          <article><span>OPEN ISSUES</span><strong>{report?.openIssues ?? 0}</strong><small>{report ? `${Math.round(report.cancellationRate * 100)}% cancellation` : "customer resolution"}</small></article>
        </section>

        {tab === "overview" ? <>
          <div className="business-dashboard-grid food-v6-overview-grid">
            <section className="business-panel">
              <div className="business-section-heading"><div><span className="business-kicker">LIVE KITCHEN</span><h2>Orders needing action</h2></div><button onClick={() => setTab("orders")}>Open queue</button></div>
              <div className="business-food-order-list business-food-order-list-v5">
                {open.slice(0, 6).map((order) => { const proximity = latestPickupEvent(order); const elapsed = orderElapsedSeconds(order, clock); return <article key={order.id} className={proximity?.status === "COURIER_AT_PICKUP" ? "courier-at-pickup" : proximity ? "courier-near-pickup" : ""}>
                  <div className="business-food-order-primary"><strong>{order.orderNumber}</strong><small>{order.fulfillmentType} · {order.items.reduce((n, item) => n + item.quantity, 0)} items</small><div className="business-food-live-time"><span>Elapsed</span><b>{formatDuration(elapsed)}</b><small>estimate {order.timing.estimatedDeliveryMin}–{order.timing.estimatedDeliveryMax}m</small></div>{proximity ? <div className={`business-pickup-alert ${proximity.status === "COURIER_AT_PICKUP" ? "at" : "near"}`}><b>{proximity.status === "COURIER_AT_PICKUP" ? "GO courier at pickup" : "GO courier arriving"}</b><span>{proximity.message}</span></div> : null}</div>
                  <div className="business-food-order-state"><span className="business-soft-pill">{order.status.replaceAll("_", " ")}</span><small>{order.paymentStatus}</small></div><strong>{money(order.totalMinor)}</strong>
                  {NEXT[order.status] ? <button className="business-primary-button compact" disabled={busy === `order:${order.id}` || order.paymentStatus !== "PAID"} onClick={() => void advance(order)}>{order.paymentStatus !== "PAID" ? "Awaiting payment" : `Mark ${NEXT[order.status]?.replaceAll("_", " ")}`}</button> : null}
                </article>; })}
                {!open.length ? <div className="business-empty-state">No Food orders need restaurant action.</div> : null}
              </div>
            </section>
            <aside className="business-panel food-v6-health-card"><span className="business-kicker">RESTAURANT HEALTH</span><h2>{restaurant?.name ?? "Restaurant"}</h2>
              <div className="food-v6-health-grid"><div><span>Menu availability</span><b>{availableItems.length}/{menuItems.length}</b></div><div><span>Capacity</span><b>{restaurant?.capacity.maxActiveOrders ?? 0}</b></div><div><span>Prep buffer</span><b>{restaurant?.capacity.prepTimeBufferMin ?? 0}m</b></div><div><span>GO at pickup</span><b>{open.filter((item) => latestPickupEvent(item)?.status === "COURIER_AT_PICKUP").length}</b></div></div>
              <div className="food-v6-channel-row"><button className={restaurant?.deliveryEnabled ? "on" : ""} disabled={busy === "restaurant"} onClick={() => void patchRestaurant({ deliveryEnabled: !restaurant?.deliveryEnabled }, `Delivery ${restaurant?.deliveryEnabled ? "disabled" : "enabled"}.`)}>{busy === "restaurant" ? "Saving…" : "Delivery"}</button><button className={restaurant?.pickupEnabled ? "on" : ""} disabled={busy === "restaurant"} onClick={() => void patchRestaurant({ pickupEnabled: !restaurant?.pickupEnabled }, `Pickup ${restaurant?.pickupEnabled ? "disabled" : "enabled"}.`)}>{busy === "restaurant" ? "Saving…" : "Pickup"}</button><button className={restaurant?.scheduledEnabled ? "on" : ""} disabled={busy === "restaurant"} onClick={() => void patchRestaurant({ scheduledEnabled: !restaurant?.scheduledEnabled }, `Scheduled orders ${restaurant?.scheduledEnabled ? "disabled" : "enabled"}.`)}>{busy === "restaurant" ? "Saving…" : "Scheduled"}</button></div>
              <a className="business-primary-button full" href="/food/menu">Menu + sold-out controls</a><a className="business-secondary-button full" href="/support">Food support</a>
            </aside>
          </div>
          <div className="food-v6-insight-grid">
            <article><span>GROSS FOOD SALES</span><strong>{report ? money(report.grossFoodSalesMinor) : "—"}</strong><small>food subtotal excluding cancelled orders</small></article>
            <article><span>AVERAGE ORDER</span><strong>{report ? money(report.averageOrderValueMinor) : "—"}</strong><small>{report?.delivered ?? 0} delivered</small></article>
            <article><span>COMMISSION DEDUCTED</span><strong>{report ? money(report.merchantCommissionMinor) : "—"}</strong><small>order-level immutable snapshots</small></article>
            <article><span>TIPS</span><strong>{report ? money(report.tipsMinor) : "—"}</strong><small>kept separate from merchant commission</small></article>
          </div>
        </> : null}

        {tab === "orders" ? <div className="food-v6-order-console">
          <section className="business-panel food-v6-order-master"><div className="business-section-heading"><div><span className="business-kicker">ORDER QUEUE</span><h2>Live + historical Food orders</h2></div><button disabled={refreshing} onClick={() => void (async () => { setRefreshing(true); try { await load(); setNotice("✓ Food data refreshed from the server."); } finally { setRefreshing(false); } })()}>{refreshing ? "Refreshing…" : "Refresh"}</button></div>
            <div className="food-v6-order-table">{scopedOrders.map((order) => <button key={order.id} className={selectedOrder?.id === order.id ? "selected" : ""} onClick={() => setSelectedOrderId(order.id)}><div><strong>{order.orderNumber}</strong><span>{order.status.replaceAll("_", " ")} · {order.fulfillmentType}</span></div><div><b>{money(order.totalMinor)}</b><small>{new Date(order.placedAt).toLocaleString("en-NG")}</small></div></button>)}</div>
          </section>
          <aside className="business-panel food-v6-order-detail">{selectedOrder ? <>
            <div className="business-section-heading"><div><span className="business-kicker">{selectedOrder.status.replaceAll("_", " ")} · {selectedOrder.paymentStatus}</span><h2>{selectedOrder.orderNumber}</h2></div><strong>{money(selectedOrder.totalMinor)}</strong></div>
            <div className="food-v6-items">{selectedOrder.items.map((item) => <div key={item.id}><span>{item.quantity}× {item.name}</span><b>{item.lineTotalMinor ? money(item.lineTotalMinor) : ""}</b>{item.specialInstructions ? <small>{item.specialInstructions}</small> : null}</div>)}</div>
            <div className="food-v6-money-stack"><div><span>Subtotal</span><b>{money(selectedOrder.subtotalMinor)}</b></div><div><span>Service fee</span><b>{money(selectedOrder.serviceFeeMinor)}</b></div><div><span>Delivery</span><b>{money(selectedOrder.deliveryFeeMinor)}</b></div><div><span>Discount</span><b>-{money(selectedOrder.discountMinor)}</b></div><div className="total"><span>Customer total</span><b>{money(selectedOrder.totalMinor)}</b></div></div>
            {selectedOrder.economics ? <div className="food-v6-settlement"><h3>Restaurant settlement snapshot</h3><div><span>Commission · {percent(selectedOrder.economics.merchantCommissionBps)}</span><b>-{money(selectedOrder.economics.merchantCommissionMinor)}</b></div><div><span>Merchant-funded discount</span><b>-{money(selectedOrder.economics.merchantFundedDiscountMinor)}</b></div><div className="net"><span>Merchant net</span><b>{money(selectedOrder.economics.merchantNetMinor)}</b></div><small>Operations commission changes apply to future orders only. This order keeps its original rate.</small></div> : null}
            <div className="food-v6-timeline">{selectedOrder.tracking.slice(-6).reverse().map((event) => <div key={event.id}><i /><span><b>{event.status.replaceAll("_", " ")}</b><small>{event.message ?? "Food order event"} · {new Date(event.createdAt).toLocaleTimeString("en-NG")}</small></span></div>)}</div>
            <div className="food-v6-message"><input value={orderMessage} onChange={(e) => setOrderMessage(e.target.value)} placeholder="Message customer / order thread" /><button disabled={busy === "message" || !orderMessage.trim()} onClick={() => void sendOrderMessage()}>Send</button></div>
            {NEXT[selectedOrder.status] ? <button className="business-primary-button full" disabled={selectedOrder.paymentStatus !== "PAID" || busy === `order:${selectedOrder.id}`} onClick={() => void advance(selectedOrder)}>Mark {NEXT[selectedOrder.status]?.replaceAll("_", " ")}</button> : null}
          </> : <div className="business-empty-state">Select an order.</div>}</aside>
        </div> : null}

        {tab === "issues" ? <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">FOOD RESOLUTION</span><h2>Order issues and refund context</h2></div><a href="/support">Open Food Support</a></div>
          <div className="food-v6-card-list">{scopedIssues.map((issue) => <article key={issue.id}><header><div><span>{issue.type.replaceAll("_", " ")}</span><strong>{issue.orderNumber}</strong></div><b>{issue.status}</b></header><p>{issue.details}</p><div className="food-v6-issue-money"><span>Requested: {issue.requestedRefundMinor == null ? "—" : money(issue.requestedRefundMinor)}</span><span>Approved: {issue.approvedRefundMinor == null ? "—" : money(issue.approvedRefundMinor)}</span>{issue.settlementRequired ? <strong>Settlement adjustment required</strong> : null}</div><footer>{!["RESOLVED", "REJECTED"].includes(issue.status) ? <><button className={issue.status === "INVESTIGATING" ? "smart-done" : ""} disabled={busy === `issue:${issue.id}` || issue.status === "INVESTIGATING"} onClick={() => void updateIssue(issue, "INVESTIGATING")}>{issue.status === "INVESTIGATING" ? "✓ Investigating" : "Investigate"}</button><button className={issue.status === "RESOLVED" ? "smart-done" : ""} disabled={busy === `issue:${issue.id}` || issue.status === "RESOLVED"} onClick={() => void updateIssue(issue, "RESOLVED")}>{issue.status === "RESOLVED" ? "✓ Resolved" : "Resolve"}</button></> : null}<a href={`/support`}>Support case</a></footer></article>)}{!scopedIssues.length ? <div className="business-empty-state">No Food issues for this restaurant.</div> : null}</div>
        </section> : null}

        {tab === "reviews" ? <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">CUSTOMER REVIEWS</span><h2>Ratings + restaurant replies</h2></div><span className="business-soft-pill">{scopedReviews.length} recent</span></div>
          <div className="food-v6-card-list">{scopedReviews.map((review) => <article key={review.id}><header><div><span>{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))}</span><strong>{review.orderNumber}</strong></div><small>{new Date(review.createdAt).toLocaleString("en-NG")}</small></header><p>{review.text || "Customer left a rating without text."}</p>{review.restaurantReply ? <div className="food-v6-existing-reply"><b>Restaurant reply</b><span>{review.restaurantReply}</span></div> : <div className="food-v6-message"><input value={reviewReply[review.id] ?? ""} onChange={(e) => setReviewReply((current) => ({ ...current, [review.id]: e.target.value }))} placeholder="Reply publicly" /><button disabled={busy === `review:${review.id}`} onClick={() => void replyReview(review)}>Reply</button></div>}</article>)}{!scopedReviews.length ? <div className="business-empty-state">No reviews yet.</div> : null}</div>
        </section> : null}

        {tab === "promotions" ? <div className="food-v6-config-grid"><section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">MERCHANT PROMOTIONS</span><h2>Create Food offer</h2></div></div><form className="food-v6-form" onSubmit={createPromotion}>
          <label>Title<input required value={promotionForm.title} onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })} placeholder="Lunch special" /></label><label>Code<input value={promotionForm.code} onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value.toUpperCase() })} placeholder="LUNCH10" /></label><label>Discount type<select value={promotionForm.discountType} onChange={(e) => setPromotionForm({ ...promotionForm, discountType: e.target.value })}><option value="PERCENT">Percent</option><option value="FIXED">Fixed ₦</option></select></label><label>{promotionForm.discountType === "PERCENT" ? "Discount %" : "Discount ₦"}<input required type="number" min="1" value={promotionForm.value} onChange={(e) => setPromotionForm({ ...promotionForm, value: e.target.value })} /></label><label>Minimum order ₦<input type="number" min="0" value={promotionForm.minSubtotal} onChange={(e) => setPromotionForm({ ...promotionForm, minSubtotal: e.target.value })} /></label><label>Maximum discount ₦<input type="number" min="0" value={promotionForm.maxDiscount} onChange={(e) => setPromotionForm({ ...promotionForm, maxDiscount: e.target.value })} /></label><label>Starts<input required type="datetime-local" value={promotionForm.startsAt} onChange={(e) => setPromotionForm({ ...promotionForm, startsAt: e.target.value })} /></label><label>Ends<input required type="datetime-local" value={promotionForm.endsAt} onChange={(e) => setPromotionForm({ ...promotionForm, endsAt: e.target.value })} /></label><label className="wide">Description<textarea value={promotionForm.description} onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })} /></label><button className="business-primary-button" disabled={busy === "promotion"}>{busy === "promotion" ? "Creating…" : "Create merchant-funded promotion"}</button>
          </form></section><section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">CAMPAIGNS</span><h2>Active + scheduled</h2></div></div><div className="food-v6-card-list compact">{scopedPromotions.map((promotion) => <article key={promotion.id} className={promotion.active ? "" : "inactive"}><header><div><span>{promotion.code || "AUTOMATIC"}</span><strong>{promotion.title}</strong></div><b>{promotion.discountType === "PERCENT" ? `${promotion.value}%` : money(promotion.value)}</b></header><p>{new Date(promotion.startsAt).toLocaleString("en-NG")} → {new Date(promotion.endsAt).toLocaleString("en-NG")}</p><footer><span>Restaurant funded</span><button disabled={busy === `promo:${promotion.id}`} onClick={() => void togglePromotion(promotion)}>{promotion.active ? "Pause" : "Activate"}</button></footer></article>)}{!scopedPromotions.length ? <div className="business-empty-state">No Food promotions yet.</div> : null}</div></section></div> : null}

        {tab === "settings" ? <div className="food-v6-config-grid"><section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">RESTAURANT CONTROLS</span><h2>Capacity, fees and channels</h2></div></div><form className="food-v6-form" onSubmit={saveSettings}><label>Max active orders<input type="number" min="1" max="1000" value={settings.maxActiveOrders} onChange={(e) => setSettings({ ...settings, maxActiveOrders: e.target.value })} /></label><label>Prep buffer minutes<input type="number" min="0" max="240" value={settings.prepTimeBufferMin} onChange={(e) => setSettings({ ...settings, prepTimeBufferMin: e.target.value })} /></label><label>Delivery fee ₦<input type="number" min="0" value={settings.deliveryFee} onChange={(e) => setSettings({ ...settings, deliveryFee: e.target.value })} /></label><label>Minimum order ₦<input type="number" min="0" value={settings.minimumOrder} onChange={(e) => setSettings({ ...settings, minimumOrder: e.target.value })} /></label><button className={`business-primary-button ${settingsUnchanged ? "smart-done" : ""}`} disabled={busy === "restaurant" || settingsUnchanged}>{busy === "restaurant" ? "Saving…" : settingsUnchanged ? "✓ Settings saved" : "Save operating settings"}</button></form><div className="food-v6-toggle-grid">{([['deliveryEnabled','Delivery'],['pickupEnabled','Pickup'],['asapEnabled','ASAP'],['scheduledEnabled','Scheduled'],['preorderEnabled','Preorder']] as const).map(([key,label]) => <button key={key} className={restaurant?.[key] ? "on" : ""} disabled={busy === "restaurant"} onClick={() => void patchRestaurant({ [key]: !restaurant?.[key] }, `${label} ${restaurant?.[key] ? "disabled" : "enabled"}.`)}><span>{busy === "restaurant" ? "Saving…" : label}</span><b>{restaurant?.[key] ? "ON" : "OFF"}</b></button>)}</div></section>
          <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">OPENING HOURS</span><h2>Weekly service schedule</h2></div></div><div className="food-v6-hours">{DAYS.map((day, index) => { const row = hoursForm[index]; if (!row) return null; return <div key={day}><strong>{day}</strong><input type="time" disabled={row.closed} value={row.open} onChange={(e) => setHoursForm({ ...hoursForm, [index]: { ...row, open: e.target.value } })} /><input type="time" disabled={row.closed} value={row.close} onChange={(e) => setHoursForm({ ...hoursForm, [index]: { ...row, close: e.target.value } })} /><label><input type="checkbox" checked={row.closed} onChange={(e) => setHoursForm({ ...hoursForm, [index]: { ...row, closed: e.target.checked } })} /> Closed</label><button className={hourUnchanged(index) ? "smart-done" : ""} disabled={busy === `hour:${index}` || hourUnchanged(index)} onClick={() => void saveHour(index)}>{busy === `hour:${index}` ? "Saving…" : hourUnchanged(index) ? "✓ Saved" : "Save"}</button></div>; })}</div></section></div> : null}

        {tab === "finance" ? <div className="food-v6-finance-grid"><section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">COMMERCIAL TERMS</span><h2>Effective Food commission</h2></div></div><div className="food-v6-big-rate">{commercial ? percent(commercial.merchantCommissionBps) : "—"}<span>{commercial?.source?.replaceAll("_", " ") ?? "Regional default"}</span></div><p className="food-v6-note">Commission is controlled by authorized Bazaara Operations admins. Your Business dashboard is read-only for the rate and shows the policy currently applying to new Food orders.</p>{commercial?.reason ? <div className="business-policy-note"><strong>Policy note</strong><span>{commercial.reason}</span></div> : null}</section>
          <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">SETTLEMENT SUMMARY</span><h2>Restaurant economics</h2></div></div><div className="food-v6-finance-lines"><div><span>Gross food sales</span><b>{report ? money(report.grossFoodSalesMinor) : "—"}</b></div><div><span>Restaurant commission</span><b>-{report ? money(report.merchantCommissionMinor) : "—"}</b></div><div className="net"><span>Merchant net</span><b>{report ? money(report.merchantNetMinor) : "—"}</b></div><div><span>Tips on orders</span><b>{report ? money(report.tipsMinor) : "—"}</b></div></div><p className="food-v6-note">Customer service fee is controlled centrally by Operations. Customer service fees, delivery fees, GO platform margin and courier payout are separate ledger lines and are not presented as restaurant commission.</p></section>
          <section className="business-panel food-v6-finance-orders"><div className="business-section-heading"><div><span className="business-kicker">ORDER SNAPSHOTS</span><h2>Recent commission ledger</h2></div></div>{scopedOrders.filter((order) => order.economics).slice(0, 12).map((order) => <div key={order.id}><span><b>{order.orderNumber}</b><small>{new Date(order.placedAt).toLocaleDateString("en-NG")}</small></span><span>{percent(order.economics!.merchantCommissionBps)}<small>commission</small></span><span>-{money(order.economics!.merchantCommissionMinor)}<small>deduction</small></span><strong>{money(order.economics!.merchantNetMinor)}<small>merchant net</small></strong></div>)}</section>
        </div> : null}
      </main>
    </div>
  );
}
