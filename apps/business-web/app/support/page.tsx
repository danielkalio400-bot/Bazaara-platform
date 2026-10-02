"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeaderStandalone } from "../components/BusinessHeaderStandalone";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

type SupportMessage = { id: string; kind: string; body: string; createdAt: string; author?: { displayName: string | null } | null };
type FoodOrderContext = { id: string; orderNumber: string; status: string; paymentStatus: string; fulfillmentType: string; totalMinor: number; restaurant: { id: string; merchant?: { organizationId?: string; organization?: { displayName?: string } } }; economics?: { merchantCommissionBps: number; merchantCommissionMinor: number; merchantNetMinor: number } | null; trackingEvents?: Array<{ id: string; status: string; message: string | null; createdAt: string }> };
type FoodRestaurantContext = { id: string; slug: string; acceptingOrders: boolean; merchant?: { organizationId?: string; organization?: { displayName?: string } } };
type SupportCase = { id: string; category: string; channel?: string; subject: string; description: string; status: string; priority: string; escalationReason?: string | null; context?: Record<string, any> | null; foodOrder?: FoodOrderContext | null; foodRestaurant?: FoodRestaurantContext | null; createdAt: string; lastActivityAt: string; messages: SupportMessage[] };
type Restaurant = { id: string; organizationId: string; name: string; commercial?: { merchantCommissionBps: number; source: string } };
type Order = { id: string; orderNumber: string; status: string; paymentStatus: string; totalMinor: number; restaurant: { id: string; name: string } };

const categories = ["FOOD", "BUSINESS", "ORDER", "DELIVERY", "PAYMENT", "RETURN", "PRODUCT", "ACCOUNT", "LOGISTICS", "GO", "OTHER"] as const;
const foodIssues = [
  ["ORDER_STATUS", "Order status / kitchen delay"], ["GO_DELIVERY", "GO courier / pickup delay"], ["COMMISSION", "Commission explanation"],
  ["PAYOUT", "Payout / settlement"], ["MENU", "Menu / availability"], ["REFUND_DISPUTE", "Refund / customer dispute"], ["TECHNICAL", "Technical issue"], ["OTHER", "Other Food issue"],
] as const;

function money(value = 0) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value / 100); }
function percent(bps = 0) { return `${(bps / 100).toFixed(2).replace(/\.00$/, "")}%`; }

export default function BusinessSupportPage() {
  const business = useBusinessOrganizations();
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selected, setSelected] = useState<SupportCase | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [category, setCategory] = useState<(typeof categories)[number]>("FOOD");
  const [foodIssueType, setFoodIssueType] = useState("ORDER_STATUS");
  const [foodRestaurantId, setFoodRestaurantId] = useState("");
  const [foodOrderId, setFoodOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState("");
  const [inboxFilter, setInboxFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [liveState, setLiveState] = useState<"CONNECTING" | "LIVE" | "RECONNECTING">("CONNECTING");

  const load = useCallback(async () => {
    if (!business.organizationId) return;
    try {
      const [caseResult, restaurantResult, orderResult] = await Promise.all([
        businessRequest<{ cases: SupportCase[] }>(`/v1/business/organizations/${business.organizationId}/support/cases`),
        businessRequest<{ restaurants: Restaurant[] }>("/v1/business/food/restaurants").catch(() => ({ restaurants: [] })),
        businessRequest<{ orders: Order[] }>("/v1/business/food/orders").catch(() => ({ orders: [] })),
      ]);
      const scopedRestaurants = restaurantResult.restaurants.filter((item) => item.organizationId === business.organizationId);
      const ids = new Set(scopedRestaurants.map((item) => item.id));
      const scopedOrders = orderResult.orders.filter((item) => ids.has(item.restaurant.id));
      setCases(caseResult.cases); setRestaurants(scopedRestaurants); setOrders(scopedOrders);
      setFoodRestaurantId((current) => current && ids.has(current) ? current : scopedRestaurants[0]?.id ?? "");
      setSelected((current) => current ? caseResult.cases.find((item) => item.id === current.id) ?? null : caseResult.cases[0] ?? null);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load Business support."); }
  }, [business.organizationId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!business.organizationId || !selected?.id || typeof window === "undefined") return;
    const caseId = selected.id;
    setLiveState("CONNECTING");
    const source = new EventSource(`${API}/v1/business/organizations/${encodeURIComponent(business.organizationId)}/support/cases/${encodeURIComponent(caseId)}/stream`, { withCredentials: true });
    source.addEventListener("open", () => setLiveState("LIVE"));
    source.addEventListener("support", () => { void openCase(caseId, false); void load(); });
    source.addEventListener("error", () => setLiveState("RECONNECTING"));
    const fallback = window.setInterval(() => void openCase(caseId, false), 7000);
    return () => { window.clearInterval(fallback); source.close(); };
  }, [business.organizationId, selected?.id, load]);

  const restaurantOrders = useMemo(() => orders.filter((item) => !foodRestaurantId || item.restaurant.id === foodRestaurantId), [foodRestaurantId, orders]);
  useEffect(() => { if (foodOrderId && !restaurantOrders.some((item) => item.id === foodOrderId)) setFoodOrderId(""); }, [foodOrderId, restaurantOrders]);

  const filteredCases = useMemo(() => inboxFilter === "ALL" ? cases : cases.filter((item) => inboxFilter === "FOOD" ? item.category === "FOOD" : item.category !== "FOOD"), [cases, inboxFilter]);
  const metrics = useMemo(() => ({
    open: cases.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length,
    food: cases.filter((item) => item.category === "FOOD" && !["RESOLVED", "CLOSED"].includes(item.status)).length,
    ai: cases.filter((item) => item.category === "FOOD" && item.messages.some((message) => message.kind === "AI")).length,
    waiting: cases.filter((item) => item.status === "WAITING_STAFF").length,
    urgent: cases.filter((item) => item.priority === "URGENT").length,
  }), [cases]);

  async function createCase(event: FormEvent) {
    event.preventDefault(); if (!business.organizationId) return; setBusy("create"); setError("");
    try {
      const baseContext = { surface: "BAZAARA_BUSINESS", organizationName: business.organization?.displayName ?? null, verticals: business.organization?.verticals ?? [] };
      const body: Record<string, unknown> = { category, subject, description, context: baseContext };
      if (category === "FOOD") {
        body.foodRestaurantId = foodRestaurantId || undefined; body.foodOrderId = foodOrderId || undefined;
        body.context = { ...baseContext, foodIssueType, requestedBy: "MERCHANT" };
      }
      const result = await businessRequest<{ case: SupportCase }>(`/v1/business/organizations/${business.organizationId}/support/cases`, "POST", body);
      setSubject(""); setDescription(""); setFoodOrderId(""); setSelected(result.case);
      setNotice(category === "FOOD" ? "Food case opened. Live chat is connected to Operations; Food AI can answer only low-risk informational issues." : "Support case created. Live chat with Operations is ready.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create support case."); }
    finally { setBusy(""); }
  }

  async function openCase(id: string, showBusy = true) {
    if (!business.organizationId) return; if (showBusy) setBusy(`open:${id}`);
    try { const result = await businessRequest<{ case: SupportCase }>(`/v1/business/organizations/${business.organizationId}/support/cases/${id}`); setSelected(result.case); }
    catch (cause) { if (showBusy) setError(cause instanceof Error ? cause.message : "Could not open support case."); }
    finally { if (showBusy) setBusy(""); }
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault(); if (!business.organizationId || !selected || !reply.trim()) return; setBusy("reply");
    try { const result = await businessRequest<{ case: SupportCase }>(`/v1/business/organizations/${business.organizationId}/support/cases/${selected.id}/messages`, "POST", { body: reply.trim() }); setReply(""); setSelected(result.case); setNotice("Message sent to Operations and synced to the live thread."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send support message."); }
    finally { setBusy(""); }
  }

  const foodAi = selected?.category === "FOOD" ? selected.context?.foodAi : null;

  return (
    <div className="business-control-shell business-support-v6">
      <BusinessHeaderStandalone active="support" />
      <main className="business-control-main business-v4-support-main">
        <section className="business-v4-support-hero food-support-v6-hero"><div><span className="business-kicker">BUSINESS SUPPORT · FOOD AI ENABLED</span><h1>Restaurant support linked directly to Food operations.</h1><p>Food cases can carry the restaurant, order, payment, commission snapshot and GO timeline into the same Operations thread. Other support categories continue unchanged.</p></div><div className="business-v4-support-signal"><span className="dot" /><div><strong>Food intelligent triage</strong><small>Safe informational replies can be automated. Refunds, safety, fraud and financial changes stay human-controlled.</small></div></div></section>
        {error ? <div className="business-alert">{error}</div> : null}{notice ? <div className="business-notice">{notice}</div> : null}
        <section className="business-control-kpis business-control-kpis-v3 support-v6-kpis"><article><span>OPEN</span><strong>{metrics.open}</strong><small>organization cases</small></article><article><span>FOOD</span><strong>{metrics.food}</strong><small>active Food queue</small></article><article><span>AI ASSISTED</span><strong>{metrics.ai}</strong><small>Food threads with AI</small></article><article><span>WAITING ON BAZAARA</span><strong>{metrics.waiting}</strong><small>Operations response due</small></article><article><span>URGENT</span><strong>{metrics.urgent}</strong><small>highest priority</small></article></section>

        <div className="business-v4-support-grid support-v6-grid">
          <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">NEW REQUEST</span><h2>Contact Operations</h2></div></div>
            <form className="business-v4-support-form support-v6-form" onSubmit={createCase}>
              <label>Area<select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              {category === "FOOD" ? <><label>Food issue<select value={foodIssueType} onChange={(e) => setFoodIssueType(e.target.value)}>{foodIssues.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Restaurant<select value={foodRestaurantId} onChange={(e) => { setFoodRestaurantId(e.target.value); setFoodOrderId(""); }}><option value="">Select restaurant</option>{restaurants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Food order (optional)<select value={foodOrderId} onChange={(e) => setFoodOrderId(e.target.value)}><option value="">No specific order</option>{restaurantOrders.slice(0, 80).map((item) => <option key={item.id} value={item.id}>{item.orderNumber} · {item.status} · {money(item.totalMinor)}</option>)}</select></label></> : null}
              <label className="wide">Subject<input required minLength={3} maxLength={160} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={category === "FOOD" ? "e.g. Explain the deduction on this Food order" : "What needs attention?"} /></label>
              <label className="wide">Detail<textarea required minLength={3} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={category === "FOOD" ? "Describe the Food issue. Linked order, restaurant, commission and GO context will be attached automatically." : "Describe the issue and expected outcome."} /></label>
              {category === "FOOD" ? <div className="support-v6-ai-note wide"><strong>Food AI boundary</strong><span>Order status, courier status and commission explanations can be answered automatically from live context. Refund decisions, chargebacks, food-safety reports, fraud and account/commission changes are escalated to a person.</span></div> : null}
              <button className="business-primary-button" disabled={busy === "create"}>{busy === "create" ? "Opening case…" : category === "FOOD" ? "Open Food case" : "Open support case"}</button>
            </form>
          </section>

          <section className="business-panel business-v4-case-list"><div className="business-section-heading"><div><span className="business-kicker">INBOX</span><h2>Organization cases</h2></div><div className="support-v6-filter"><button className={inboxFilter === "ALL" ? "active" : ""} onClick={() => setInboxFilter("ALL")}>All</button><button className={inboxFilter === "FOOD" ? "active" : ""} onClick={() => setInboxFilter("FOOD")}>Food</button><button className={inboxFilter === "OTHER" ? "active" : ""} onClick={() => setInboxFilter("OTHER")}>Other</button></div></div>
            {filteredCases.length ? filteredCases.map((item) => <button key={item.id} className={`${selected?.id === item.id ? "selected" : ""} ${item.category === "FOOD" ? "food-case" : ""}`} disabled={busy === `open:${item.id}`} onClick={() => void openCase(item.id)}><div><span>{item.category} · {item.priority}{item.messages.some((message) => message.kind === "AI") ? " · AI" : ""}</span><strong>{item.subject}</strong><small>{new Date(item.lastActivityAt).toLocaleString("en-NG")}</small></div><b>{item.status.replaceAll("_", " ")}</b></button>) : <div className="business-empty-state">No matching support cases.</div>}
          </section>

          <section className="business-panel business-v4-case-thread support-v6-thread-panel">{selected ? <>
            <div className="business-section-heading"><div><span className="business-kicker">{selected.category} · {selected.priority}</span><h2>{selected.subject}</h2></div><div className="business-support-live-status"><span className={`business-live-chip ${liveState.toLowerCase()}`}>{liveState === "LIVE" ? "● LIVE" : liveState === "RECONNECTING" ? "↻ RECONNECTING" : "○ CONNECTING"}</span><span className="business-soft-pill">{selected.status.replaceAll("_", " ")}</span></div></div>
            {selected.category === "FOOD" ? <div className="support-v6-food-context"><div><span>Restaurant</span><b>{selected.foodRestaurant?.merchant?.organization?.displayName ?? selected.foodOrder?.restaurant?.merchant?.organization?.displayName ?? "Linked Food restaurant"}</b></div><div><span>Order</span><b>{selected.foodOrder?.orderNumber ?? "No order linked"}</b></div><div><span>Status</span><b>{selected.foodOrder?.status?.replaceAll("_", " ") ?? "—"}</b></div><div><span>Payment</span><b>{selected.foodOrder?.paymentStatus ?? "—"}</b></div>{selected.foodOrder?.economics ? <><div><span>Commission</span><b>{percent(selected.foodOrder.economics.merchantCommissionBps)}</b></div><div><span>Merchant net</span><b>{money(selected.foodOrder.economics.merchantNetMinor)}</b></div></> : null}</div> : null}
            {foodAi ? <div className={`support-v6-ai-analysis ${foodAi.safeToAutoReply ? "safe" : "human"}`}><header><strong>BAZAARA FOOD AI</strong><span>{Math.round(Number(foodAi.confidence ?? 0) * 100)}% confidence · {String(foodAi.route ?? "").replaceAll("_", " ")}</span></header><p>{foodAi.summary}</p><small>{foodAi.safeToAutoReply ? "Low-risk informational response allowed." : "Human review required before consequential action."}</small></div> : null}
            <div className="business-v4-thread">{selected.messages.map((message) => <article key={message.id} className={message.kind === "STAFF" ? "staff" : message.kind === "AI" ? "ai" : message.kind === "SYSTEM" ? "system" : ""}><header><strong>{message.kind === "STAFF" ? "OPERATIONS" : message.kind === "AI" ? "BAZAARA FOOD AI" : message.kind === "SYSTEM" ? "SYSTEM" : "BUSINESS"}</strong><time>{new Date(message.createdAt).toLocaleString("en-NG")}</time></header><p>{message.body}</p></article>)}</div>
            {selected.status !== "CLOSED" ? <form className="business-v4-reply" onSubmit={sendReply}><textarea required value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to Operations…" /><button className="business-primary-button" disabled={busy === "reply"}>{busy === "reply" ? "Sending…" : "Send reply"}</button></form> : null}
          </> : <div className="business-empty-state">Select a case to open its conversation.</div>}</section>
        </div>
      </main>
    </div>
  );
}
