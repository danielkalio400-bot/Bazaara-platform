"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { OpsShell } from "../components/OpsShell";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const api = createApiClient({ baseUrl: API, credentials: "include" });

type SupportMessage = { id: string; kind: string; body: string; createdAt: string; author?: { displayName: string | null } | null };
type SupportAgent = { userId: string; displayName: string | null; email: string | null; roles: string[] };
type RestaurantContact = { id: string; restaurantId: string; name: string; role: string; phone: string | null; whatsappPhone: string | null; email: string | null; preferredChannel: string; isPrimary: boolean; isEmergency: boolean; active: boolean; updatedAt: string };
type ContactAttempt = { id: string; clientActionId: string; supportCaseId: string; foodRestaurantId: string; contactId: string | null; channel: string; destination: string; destinationLabel: string | null; reason: string; status: string; outcome: string | null; notes: string | null; durationSeconds: number | null; followUpAt: string | null; startedAt: string; completedAt: string | null; actor?: { id: string; displayName: string | null }; contact?: RestaurantContact | null };
type RestaurantContactCenter = { restaurant: { id: string; name: string; slug: string; organizationId: string }; organizationContact: { phone: string | null; email: string | null }; contacts: RestaurantContact[]; attempts: ContactAttempt[] };
type CustomerContactAttempt = { id: string; clientActionId: string; supportCaseId: string; customerUserId: string; actorUserId: string; notificationId: string | null; channel: string; destination: string; destinationLabel: string | null; reason: string; message: string | null; status: string; outcome: string | null; notes: string | null; durationSeconds: number | null; followUpAt: string | null; startedAt: string; completedAt: string | null; actor?: { id: string; displayName: string | null }; delivery?: { id: string; channel: string; status: string; provider: string | null; providerReference: string | null; sentAt: string | null; lastError: string | null; attempts: number } | null };
type CustomerContactCenter = { customer: { id: string; displayName: string | null; email: string | null; phone: string | null }; attempts: CustomerContactAttempt[] };
type FoodAi = { caseId: string; issueType: string; route: string; confidence: number; urgency: string; safeToAutoReply: boolean; summary: string; suggestedReply: string; diagnostics: Record<string, any>; generatedAt: string };
type FoodOrder = {
  id: string; orderNumber: string; status: string; fulfillmentType: string; paymentStatus: string; currency: string;
  subtotalMinor: number; deliveryFeeMinor: number; serviceFeeMinor: number; tipMinor: number; discountMinor: number; totalMinor: number;
  courierUserId: string | null; courierAssignedAt: string | null; pickedUpAt: string | null; placedAt: string; deliveredAt: string | null; cancelledAt: string | null;
  restaurant: { id: string; slug: string; acceptingOrders: boolean; estimatedDeliveryMin: number; estimatedDeliveryMax: number; merchant: { organizationId: string; organization: { displayName: string } } };
  economics: { serviceFeeBps: number; merchantCommissionBps: number; merchantCommissionMinor: number; merchantNetMinor: number; courierGrossMinor: number; goCommissionBps: number; goCommissionMinor: number; courierNetMinor: number } | null;
  trackingEvents: Array<{ id: string; status: string; message: string | null; createdAt: string }>;
};
type SupportCase = {
  id: string; category: string; subject: string; description: string; status: string; priority: string; channel?: string; region?: string; currency?: string; organizationId?: string | null; slaDueAt?: string | null; escalationReason: string | null; context?: Record<string, any> | null; createdAt: string; lastActivityAt: string;
  user: { id: string; displayName: string | null; email: string | null; phone?: string | null };
  order?: { id: string; orderNumber: string; status: string } | null;
  foodOrder?: FoodOrder | null;
  foodRestaurant?: { id: string; slug: string; acceptingOrders: boolean; deliveryEnabled: boolean; pickupEnabled: boolean; pauseUntil: string | null; merchant: { organizationId: string; organization: { displayName: string } } } | null;
  driveRide?: { id: string; status: string; fareFundingStatus: string; riderUserId: string; driverUserId: string | null; createdAt: string; updatedAt: string } | null;
  ledgerTransaction?: { id: string; reference: string; kind: string; currency: string; description: string | null; createdAt: string } | null;
  assignedTo?: { id: string; displayName: string | null } | null;
  messages: SupportMessage[];
};

function ageHours(value: string) { return Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 3_600_000)); }
function money(value = 0, currency = "NGN") { return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100); }
function percent(bps = 0) { return `${(bps / 100).toFixed(2).replace(/\.00$/, "")}%`; }

export default function OperationsSupport() {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selected, setSelected] = useState<SupportCase | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [channel, setChannel] = useState("");
  const [category, setCategory] = useState("");
  const [unassigned, setUnassigned] = useState(false);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [foodAi, setFoodAi] = useState<FoodAi | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [contactCenter, setContactCenter] = useState<RestaurantContactCenter | null>(null);
  const [contactReason, setContactReason] = useState("Resolve the active support case");
  const [contactId, setContactId] = useState("");
  const [contactOutcomeNotes, setContactOutcomeNotes] = useState<Record<string, string>>({});
  const contactActionIds = useMemo(() => new Map<string, string>(), []);
  const [customerCenter, setCustomerCenter] = useState<CustomerContactCenter | null>(null);
  const [customerContactReason, setCustomerContactReason] = useState("Follow up on the active support case");
  const [customerMessage, setCustomerMessage] = useState("Hello, this is Bazaara Support. We are following up on your support case.");
  const [customerOutcomeNotes, setCustomerOutcomeNotes] = useState<Record<string, string>>({});
  const customerActionIds = useMemo(() => new Map<string, string>(), []);
  const [liveState, setLiveState] = useState<"CONNECTING" | "LIVE" | "RECONNECTING">("CONNECTING");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim()); if (status) params.set("status", status); if (priority) params.set("priority", priority); if (channel) params.set("channel", channel); if (category) params.set("category", category); if (unassigned) params.set("unassigned", "1"); params.set("limit", "200");
      const result = await api.get<{ cases: SupportCase[] }>(`/v1/admin/support/cases?${params.toString()}`);
      setCases(result.cases); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load support cases"); }
  }, [category, channel, priority, q, status, unassigned]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") ?? "");
    setStatus(params.get("status") ?? "");
    setPriority(params.get("priority") ?? "");
    setChannel(params.get("channel") ?? "");
    setCategory(params.get("category") ?? "");
    setUnassigned(["1", "true"].includes((params.get("unassigned") ?? "").toLowerCase()));
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    void api.get<{ agents: SupportAgent[] }>("/v1/operations/management/support-agents?limit=100")
      .then((result) => setAgents(result.agents))
      .catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    if (!selected?.id || typeof window === "undefined") return;
    const caseId = selected.id;
    setLiveState("CONNECTING");
    const source = new EventSource(`${API.replace(/\/$/, "")}/v1/admin/support/cases/${encodeURIComponent(caseId)}/stream`, { withCredentials: true });
    source.addEventListener("open", () => setLiveState("LIVE"));
    source.addEventListener("support", () => { void open(caseId, false); void load(); });
    source.addEventListener("error", () => setLiveState("RECONNECTING"));
    const fallback = window.setInterval(() => { void open(caseId, false); }, 7000);
    return () => { window.clearInterval(fallback); source.close(); };
  }, [selected?.id, load]);

  const metrics = useMemo(() => ({
    open: cases.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length,
    food: cases.filter((item) => item.category === "FOOD" && !["RESOLVED", "CLOSED"].includes(item.status)).length,
    aiHandled: cases.filter((item) => item.category === "FOOD" && item.messages.some((message) => message.kind === "AI")).length,
    urgent: cases.filter((item) => item.priority === "URGENT").length,
    escalated: cases.filter((item) => item.status === "ESCALATED").length,
    waitingStaff: cases.filter((item) => item.status === "WAITING_STAFF").length,
    unassigned: cases.filter((item) => !item.assignedTo && !["RESOLVED", "CLOSED"].includes(item.status)).length,
    breached: cases.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status) && (item.slaDueAt ? new Date(item.slaDueAt).getTime() <= Date.now() : ageHours(item.lastActivityAt) >= (item.priority === "URGENT" ? 1 : item.priority === "HIGH" ? 4 : 12))).length,
  }), [cases]);

  async function loadContactCenter(caseId: string) {
    try {
      const result = await api.get<RestaurantContactCenter>(`/v1/admin/support/cases/${caseId}/restaurant-contact-center`);
      setContactCenter(result);
      setContactId((current) => current && result.contacts.some((item) => item.id === current) ? current : result.contacts.find((item) => item.isPrimary)?.id ?? result.contacts[0]?.id ?? "");
      return result;
    } catch {
      setContactCenter(null);
      setContactId("");
      return null;
    }
  }

  async function loadCustomerContactCenter(caseId: string) {
    try {
      const result = await api.get<CustomerContactCenter>(`/v1/admin/support/cases/${caseId}/customer-contact-center`);
      setCustomerCenter(result);
      return result;
    } catch {
      setCustomerCenter(null);
      return null;
    }
  }

  function launchCustomerUrl(channel: string, destination: string, message: string) {
    if (typeof window === "undefined") return;
    if (channel === "PHONE") { window.location.href = `tel:${destination}`; return; }
    if (channel === "WHATSAPP") { const digits = destination.replace(/[^0-9]/g, ""); window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"); }
  }

  function launchUrl(channel: string, destination: string, reason: string) {
    if (typeof window === "undefined") return;
    if (channel === "PHONE") { window.location.href = `tel:${destination}`; return; }
    if (channel === "SMS") { window.location.href = `sms:${destination}?body=${encodeURIComponent(reason)}`; return; }
    if (channel === "EMAIL") { window.location.href = `mailto:${destination}?subject=${encodeURIComponent("Bazaara Support")}&body=${encodeURIComponent(reason)}`; return; }
    if (channel === "WHATSAPP") { const digits = destination.replace(/[^0-9]/g, ""); window.open(`https://wa.me/${digits}?text=${encodeURIComponent(reason)}`, "_blank", "noopener,noreferrer"); return; }
    if (channel === "IN_APP") { setNotice("In-app restaurant alert sent to active business users and logged to this case."); }
  }

  async function contactCustomer(channel: "PHONE" | "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP") {
    if (!selected) return;
    const key = `${selected.id}:${channel}:${customerMessage.trim()}`;
    const clientActionId = customerActionIds.get(key) ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    customerActionIds.set(key, clientActionId);
    setBusy(`customer-contact:${channel}`); setError("");
    try {
      const result = await api.post<{ attempt: CustomerContactAttempt; actionState: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/support/cases/${selected.id}/customer-contact-attempts`, {
        clientActionId, channel, reason: customerContactReason.trim() || "Follow up on the active support case", message: customerMessage.trim() || customerContactReason.trim(),
      });
      customerActionIds.delete(key);
      if (channel === "PHONE" || channel === "WHATSAPP") {
        launchCustomerUrl(channel, result.attempt.destination, customerMessage.trim() || customerContactReason);
        setNotice(result.actionState === "ALREADY_DONE" ? "This customer contact attempt was already logged. Outcome remains unchanged." : `${channel === "PHONE" ? "Dialer" : "WhatsApp"} opened. The outcome stays pending until an agent records what actually happened.`);
      } else if (channel === "IN_APP") {
        setNotice(result.actionState === "ALREADY_DONE" ? "That in-app message was already sent." : "In-app support message sent. The customer live-chat thread has been updated.");
      } else {
        setNotice(result.actionState === "ALREADY_DONE" ? `That ${channel} request was already queued.` : `${channel} queued for provider delivery. Delivery status will update from the server; it is not marked sent until confirmed.`);
      }
      await loadCustomerContactCenter(selected.id);
      await open(selected.id, false);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not contact customer"); }
    finally { setBusy(""); }
  }

  async function saveCustomerContactOutcome(attempt: CustomerContactAttempt, status: "COMPLETED" | "NO_ANSWER" | "BUSY" | "FAILED" | "CANCELLED") {
    if (!selected) return;
    if (attempt.status === status && attempt.completedAt) { setNotice(`Customer contact outcome is already ${status.replaceAll("_", " ").toLowerCase()}.`); return; }
    setBusy(`customer-outcome:${attempt.id}:${status}`); setError("");
    try {
      const result = await api.patch<{ attempt: CustomerContactAttempt; actionState: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/support/customer-contact-attempts/${attempt.id}`, { status, outcome: status === "COMPLETED" ? "Customer reached" : status.replaceAll("_", " "), notes: customerOutcomeNotes[attempt.id]?.trim() || null });
      setNotice(result.actionState === "ALREADY_DONE" ? "That customer contact outcome was already saved." : "Customer contact outcome saved. No call result is guessed automatically.");
      await loadCustomerContactCenter(selected.id);
      await open(selected.id, false);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save customer contact outcome"); }
    finally { setBusy(""); }
  }

  async function contactRestaurant(channel: "PHONE" | "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP") {
    if (!selected || selected.category !== "FOOD") return;
    const key = `${selected.id}:${contactId || "organization"}:${channel}`;
    const clientActionId = contactActionIds.get(key) ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    contactActionIds.set(key, clientActionId);
    setBusy(`contact:${channel}`); setError("");
    try {
      const result = await api.post<{ attempt: ContactAttempt; actionState: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/support/cases/${selected.id}/restaurant-contact-attempts`, { clientActionId, contactId: contactId || null, channel, reason: contactReason.trim() || "Resolve the active support case" });
      contactActionIds.delete(key);
      setNotice(result.actionState === "ALREADY_DONE" ? `This ${channel.toLowerCase()} contact action was already registered.` : channel === "PHONE" || channel === "WHATSAPP" ? `${channel === "PHONE" ? "Dialer" : "WhatsApp"} opened. Outcome is pending until an agent records Reached, No answer, Busy or Failed.` : channel === "IN_APP" ? "In-app restaurant alert sent and logged." : `${channel.replaceAll("_", " ")} contact started and logged to the case.`);
      await loadContactCenter(selected.id);
      if (channel === "IN_APP") launchUrl(channel, result.attempt.destination, contactReason);
      else launchUrl(channel, result.attempt.destination, contactReason);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start restaurant contact"); }
    finally { setBusy(""); }
  }

  async function saveContactOutcome(attempt: ContactAttempt, status: "COMPLETED" | "NO_ANSWER" | "BUSY" | "FAILED" | "CANCELLED") {
    if (!selected) return;
    if (attempt.status === status && attempt.completedAt) { setNotice(`Contact outcome is already ${status.replaceAll("_", " ").toLowerCase()}.`); return; }
    setBusy(`outcome:${attempt.id}:${status}`); setError("");
    try {
      const result = await api.patch<{ attempt: ContactAttempt; actionState: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/support/restaurant-contact-attempts/${attempt.id}`, { status, outcome: status === "COMPLETED" ? "Restaurant reached" : status.replaceAll("_", " "), notes: contactOutcomeNotes[attempt.id]?.trim() || null });
      setNotice(result.actionState === "ALREADY_DONE" ? "That contact outcome was already saved." : "Restaurant contact outcome saved and added to the support audit trail.");
      await loadContactCenter(selected.id);
      await open(selected.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save restaurant contact outcome"); }
    finally { setBusy(""); }
  }

  async function open(id: string, showBusy = true) {
    if (showBusy) setBusy(`open-${id}`);
    try {
      const result = await api.get<{ case: SupportCase }>(`/v1/admin/support/cases/${id}`);
      setSelected(result.case); setFoodAi(result.case.context?.foodAi ?? null);
      await loadCustomerContactCenter(id);
      if (result.case.category === "FOOD") await loadContactCenter(id); else setContactCenter(null);
    }
    catch (cause) { if (showBusy) setError(cause instanceof Error ? cause.message : "Could not load support case"); }
    finally { if (showBusy) setBusy(""); }
  }
  async function patch(input: Record<string, unknown>) {
    if (!selected) return; setBusy("patch");
    try {
      const result = await api.patch<{ case: SupportCase; actionState?: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/support/cases/${selected.id}`, input);
      setSelected(result.case);
      setNotice(result.actionState === "ALREADY_DONE" ? "That support state was already applied on the server." : "Support case updated.");
      await load();
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update support case"); }
    finally { setBusy(""); }
  }
  async function send() {
    if (!selected || !reply.trim()) return; setBusy("reply");
    try { const result = await api.post<{ case: SupportCase }>(`/v1/admin/support/cases/${selected.id}/messages`, { body: reply.trim(), internal }); setSelected(result.case); setReply(""); setNotice(internal ? "Internal note saved." : "Reply sent."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send support message"); }
    finally { setBusy(""); }
  }
  async function analyzeFood() {
    if (!selected || selected.category !== "FOOD") return; setBusy("food-ai-analyze");
    try { const result = await api.post<{ analysis: FoodAi }>(`/v1/admin/support/cases/${selected.id}/food-ai/analyze`, {}); setFoodAi(result.analysis); setNotice("Food AI refreshed live order, restaurant, finance and GO diagnostics."); await open(selected.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not analyze Food case"); }
    finally { setBusy(""); }
  }
  async function sendFoodAi() {
    if (!selected || selected.category !== "FOOD") return; setBusy("food-ai-reply");
    try { const result = await api.post<{ analysis: FoodAi; autoReplied: boolean; case: SupportCase }>(`/v1/admin/support/cases/${selected.id}/food-ai/reply`, {}); setFoodAi(result.analysis); setSelected(result.case); setNotice(result.autoReplied ? "Safe Food AI reply sent." : "Food AI did not send: the case requires human review or the same answer already exists."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send Food AI reply"); }
    finally { setBusy(""); }
  }

  const currentAi = foodAi ?? (selected?.context?.foodAi as FoodAi | undefined) ?? null;
  const foodOrder = selected?.foodOrder;
  const latestTracking = foodOrder?.trackingEvents?.[0];

  return (
    <OpsShell active="/support">
      <main className="ops-v31-main ops-support-v6">
        <section className="ops-v33-domain-hero support food-support"><div><span className="ops-v31-kicker">SUPPORT OPERATIONS · FOOD AI</span><h1>Resolution desk with live Food context.</h1><p>Generic support stays intact. Food cases now attach restaurant, order, payment, immutable commission economics and GO tracking so staff and AI work from the same operational record.</p></div><div className="ops-v33-hero-stat"><span>OPEN FOOD</span><strong>{metrics.food}</strong><small>{metrics.aiHandled} AI-assisted in current result set</small></div></section>
        {error ? <div className="ops-v31-alert">{error}</div> : null}{notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <section className="ops-v31-command-kpis support-v6-kpis"><article><span>OPEN</span><strong>{metrics.open}</strong><small>unresolved cases</small></article><article className={metrics.food ? "attention" : ""}><span>FOOD</span><strong>{metrics.food}</strong><small>Food-specific queue</small></article><article><span>AI ASSISTED</span><strong>{metrics.aiHandled}</strong><small>safe Food automation</small></article><article className={metrics.urgent ? "attention" : ""}><span>URGENT</span><strong>{metrics.urgent}</strong><small>highest priority</small></article><article><span>WAITING STAFF</span><strong>{metrics.waitingStaff}</strong><small>merchant/customer waiting</small></article><article className={metrics.unassigned ? "attention" : ""}><span>UNASSIGNED</span><strong>{metrics.unassigned}</strong><small>tickets without owner</small></article><article className={metrics.breached ? "attention" : ""}><span>SLA RISK</span><strong>{metrics.breached}</strong><small>response target</small></article></section>

        <div className="ops-v33-toolbar support-v6-toolbar"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Subject, ride, Wallet reference, order or customer" /><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option><option value="FOOD">FOOD only</option><option value="BUSINESS">BUSINESS</option><option value="ORDER">ORDER</option><option value="PAYMENT">PAYMENT</option><option value="DELIVERY">DELIVERY</option><option value="GO">GO</option><option value="DRIVE">DRIVE</option><option value="OTHER">OTHER</option></select><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["OPEN", "WAITING_CUSTOMER", "WAITING_STAFF", "ESCALATED", "RESOLVED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}</select><select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">All priorities</option>{["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}</select><select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="">All channels</option>{["CONSUMER", "BUSINESS", "GO", "PAY", "OPERATIONS"].map((value) => <option key={value}>{value}</option>)}</select><select value={unassigned ? "UNASSIGNED" : "ALL"} onChange={(e) => setUnassigned(e.target.value === "UNASSIGNED")}><option value="ALL">All assignments</option><option value="UNASSIGNED">Unassigned only</option></select><button disabled={busy === "refresh"} onClick={() => void (async () => { setBusy("refresh"); try { await load(); setNotice("✓ Support queue refreshed from the server."); } finally { setBusy(""); } })()}>{busy === "refresh" ? "Refreshing…" : "Refresh"}</button></div>

        <div className="ops-v33-support-layout support-v6-layout">
          <section className="ops-v31-panel ops-v33-case-list">{cases.map((supportCase) => { const hours = ageHours(supportCase.lastActivityAt); const selectedCase = selected?.id === supportCase.id; const hasAi = supportCase.messages.some((message) => message.kind === "AI"); return <button key={supportCase.id} className={`${selectedCase ? "selected" : ""} ${supportCase.category === "FOOD" ? "food" : ""}`} disabled={busy === `open-${supportCase.id}`} onClick={() => void open(supportCase.id)}><div><span className="ops-v31-soft-chip">{supportCase.category} · {supportCase.priority}{hasAi ? " · AI" : ""}</span><strong>{supportCase.subject}</strong><small>{supportCase.user.displayName || supportCase.user.email || "BazID user"}{supportCase.foodOrder ? ` · ${supportCase.foodOrder.orderNumber}` : supportCase.order ? ` · ${supportCase.order.orderNumber}` : supportCase.driveRide ? ` · Ride ${supportCase.driveRide.id.slice(0, 8)}` : supportCase.ledgerTransaction ? ` · ${supportCase.ledgerTransaction.reference}` : ""}{supportCase.channel ? ` · ${supportCase.channel}` : ""}</small></div><span><strong>{supportCase.status}</strong><small>{hours}h since activity</small></span></button>; })}{!cases.length ? <div className="ops-v31-empty">No support cases match these filters.</div> : null}</section>

          <aside className="ops-v31-panel ops-v33-case-detail support-v6-detail">{selected ? <>
            <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">{selected.category} · {selected.priority}{selected.channel ? ` · ${selected.channel}` : ""}{selected.region ? ` · ${selected.region}` : ""}</span><h2>{selected.subject}</h2><p>{selected.user.displayName || selected.user.email || selected.user.id}{foodOrder ? ` · ${foodOrder.orderNumber}` : selected.order ? ` · ${selected.order.orderNumber}` : selected.driveRide ? ` · Drive ${selected.driveRide.id.slice(0, 10)}` : selected.ledgerTransaction ? ` · ${selected.ledgerTransaction.reference}` : ""}</p></div><span className="ops-v31-soft-chip">{selected.status}</span></div>
            {selected.escalationReason ? <div className="ops-v33-escalation"><strong>Escalation reason</strong><span>{selected.escalationReason}</span></div> : null}

            {selected.driveRide || selected.ledgerTransaction ? <section className="ops-v11-linked-context">
              <header><div><span className="ops-v31-kicker">DRIVE + WALLET CONTEXT</span><h3>Canonical records attached to this case</h3><p>Support is linked to the actual ride and/or ledger movement. Agents can move directly into Mobility or Finance Operations without re-keying IDs.</p></div><span className="ops-v31-soft-chip">LIVE CONTEXT</span></header>
              <div className="ops-v11-linked-grid">
                {selected.driveRide ? <article><span>DRIVE RIDE</span><strong>{selected.driveRide.id}</strong><small>{selected.driveRide.status.replaceAll("_", " ")} · fare {selected.driveRide.fareFundingStatus.replaceAll("_", " ")}</small><div><a href={`/drive?rideId=${encodeURIComponent(selected.driveRide.id)}`}>Open Mobility Operations</a><a href={`/pay?rideId=${encodeURIComponent(selected.driveRide.id)}`}>Open Finance Operations</a></div></article> : null}
                {selected.ledgerTransaction ? <article><span>WALLET LEDGER</span><strong>{selected.ledgerTransaction.reference}</strong><small>{selected.ledgerTransaction.kind.replaceAll("_", " ")} · {selected.ledgerTransaction.currency} · {new Date(selected.ledgerTransaction.createdAt).toLocaleString("en-NG")}</small><div><a href={`/pay?ledgerTransactionId=${encodeURIComponent(selected.ledgerTransaction.id)}`}>Inspect in Finance Operations</a></div></article> : null}
              </div>
            </section> : null}

            <section className="ops-customer-contact-center">
              <header><div><span className="ops-v31-kicker">CUSTOMER CONTACT + LIVE CHAT</span><h3>Reach the customer without guessing outcomes</h3><p>In-app messages update the live case thread immediately. Email/SMS use the server delivery queue. Phone/WhatsApp stay outcome-pending until an agent records the real result.</p></div><span className={`ops-live-chip ${liveState.toLowerCase()}`}>{liveState === "LIVE" ? "● LIVE" : liveState === "RECONNECTING" ? "↻ RECONNECTING" : "○ CONNECTING"}</span></header>
              <div className="ops-customer-identity"><div><span>Customer</span><b>{customerCenter?.customer.displayName || selected.user.displayName || "BazID customer"}</b></div><div><span>Phone</span><b>{customerCenter?.customer.phone || selected.user.phone || "Not configured"}</b></div><div><span>Email</span><b>{customerCenter?.customer.email || selected.user.email || "Not configured"}</b></div></div>
              <div className="ops-contact-controls customer"><label>Reason<input value={customerContactReason} onChange={(e) => setCustomerContactReason(e.target.value)} placeholder="Why are you contacting the customer?" /></label><label>Message<input value={customerMessage} onChange={(e) => setCustomerMessage(e.target.value)} placeholder="Message for in-app, SMS, email or WhatsApp" /></label></div>
              <div className="ops-contact-actions">
                <button disabled={busy.startsWith("customer-contact:") || !(customerCenter?.customer.phone || selected.user.phone)} onClick={() => void contactCustomer("PHONE")}>{busy === "customer-contact:PHONE" ? "Opening…" : "Call customer"}</button>
                <button disabled={busy.startsWith("customer-contact:") || !(customerCenter?.customer.phone || selected.user.phone)} onClick={() => void contactCustomer("WHATSAPP")}>{busy === "customer-contact:WHATSAPP" ? "Opening…" : "WhatsApp"}</button>
                <button disabled={busy.startsWith("customer-contact:") || !(customerCenter?.customer.phone || selected.user.phone)} onClick={() => void contactCustomer("SMS")}>{busy === "customer-contact:SMS" ? "Queuing…" : "Send SMS"}</button>
                <button disabled={busy.startsWith("customer-contact:") || !(customerCenter?.customer.email || selected.user.email)} onClick={() => void contactCustomer("EMAIL")}>{busy === "customer-contact:EMAIL" ? "Queuing…" : "Send email"}</button>
                <button className="ops-v33-primary" disabled={busy.startsWith("customer-contact:") || !customerMessage.trim()} onClick={() => void contactCustomer("IN_APP")}>{busy === "customer-contact:IN_APP" ? "Sending…" : "Send in live chat"}</button>
              </div>
              {customerCenter?.attempts.length ? <div className="ops-contact-history">{customerCenter.attempts.slice(0, 6).map((attempt) => <article key={attempt.id}><div><strong>{attempt.channel} · {attempt.destinationLabel ?? "Customer"}</strong><small>{new Date(attempt.startedAt).toLocaleString("en-NG")} · {attempt.delivery ? `Delivery ${attempt.delivery.status}` : attempt.status.replaceAll("_", " ")}{attempt.actor?.displayName ? ` · ${attempt.actor.displayName}` : ""}</small>{attempt.delivery?.lastError ? <small className="ops-delivery-error">{attempt.delivery.lastError}</small> : null}{attempt.outcome ? <small>{attempt.outcome}</small> : null}</div><input value={customerOutcomeNotes[attempt.id] ?? ""} onChange={(e) => setCustomerOutcomeNotes((current) => ({ ...current, [attempt.id]: e.target.value }))} placeholder="Outcome note (optional)" /><div className="ops-contact-outcomes">{["PHONE", "WHATSAPP"].includes(attempt.channel) ? <><button className={attempt.status === "COMPLETED" ? "done" : ""} disabled={attempt.status === "COMPLETED" || busy.startsWith(`customer-outcome:${attempt.id}:`)} onClick={() => void saveCustomerContactOutcome(attempt, "COMPLETED")}>{attempt.status === "COMPLETED" ? "✓ Reached" : "Reached"}</button><button className={attempt.status === "NO_ANSWER" ? "done" : ""} disabled={attempt.status === "NO_ANSWER" || busy.startsWith(`customer-outcome:${attempt.id}:`)} onClick={() => void saveCustomerContactOutcome(attempt, "NO_ANSWER")}>{attempt.status === "NO_ANSWER" ? "✓ No answer" : "No answer"}</button><button className={attempt.status === "BUSY" ? "done" : ""} disabled={attempt.status === "BUSY" || busy.startsWith(`customer-outcome:${attempt.id}:`)} onClick={() => void saveCustomerContactOutcome(attempt, "BUSY")}>{attempt.status === "BUSY" ? "✓ Busy" : "Busy"}</button><button className={attempt.status === "FAILED" ? "done" : ""} disabled={attempt.status === "FAILED" || busy.startsWith(`customer-outcome:${attempt.id}:`)} onClick={() => void saveCustomerContactOutcome(attempt, "FAILED")}>{attempt.status === "FAILED" ? "✓ Failed" : "Failed"}</button></> : <span className={`ops-contact-state ${attempt.delivery?.status === "SENT" || attempt.status === "COMPLETED" ? "done" : ""}`}>{attempt.delivery?.status === "SENT" || attempt.status === "COMPLETED" ? "✓ Confirmed" : attempt.delivery ? `Provider: ${attempt.delivery.status}` : attempt.status.replaceAll("_", " ")}</span>}</div></article>)}</div> : <div className="ops-contact-empty">No customer contact attempts yet. Live chat is available immediately.</div>}
            </section>

            {selected.category === "FOOD" ? <>
              <section className="support-v6-food-context">
                <div><span>Restaurant</span><b>{foodOrder?.restaurant.merchant.organization.displayName ?? selected.foodRestaurant?.merchant.organization.displayName ?? "—"}</b></div><div><span>Food order</span><b>{foodOrder?.orderNumber ?? "No order linked"}</b></div><div><span>Status</span><b>{foodOrder?.status?.replaceAll("_", " ") ?? "—"}</b></div><div><span>Payment</span><b>{foodOrder?.paymentStatus ?? "—"}</b></div><div><span>GO courier</span><b>{foodOrder ? foodOrder.courierUserId ? "Assigned" : "Unassigned" : "—"}</b></div><div><span>Latest tracking</span><b>{latestTracking?.status?.replaceAll("_", " ") ?? "—"}</b></div>
              </section>
              {foodOrder?.economics ? <section className="support-v6-food-money"><div><span>Food subtotal</span><b>{money(foodOrder.subtotalMinor, foodOrder.currency)}</b></div><div><span>Service fee</span><b>{money(foodOrder.serviceFeeMinor, foodOrder.currency)}</b></div><div><span>Restaurant commission · {percent(foodOrder.economics.merchantCommissionBps)}</span><b>{money(foodOrder.economics.merchantCommissionMinor, foodOrder.currency)}</b></div><div><span>Merchant net</span><b>{money(foodOrder.economics.merchantNetMinor, foodOrder.currency)}</b></div><div><span>GO gross / commission</span><b>{money(foodOrder.economics.courierGrossMinor, foodOrder.currency)} / {money(foodOrder.economics.goCommissionMinor, foodOrder.currency)}</b></div></section> : null}
              <section className="ops-restaurant-contact-center">
                <header><div><span className="ops-v31-kicker">RESTAURANT CONTACT CENTER</span><h3>Reach the restaurant from this case</h3><p>Every contact attempt is server-logged. Repeated outcome actions return the existing result instead of creating duplicate work.</p></div><span className="ops-v31-soft-chip">{contactCenter?.attempts.length ?? 0} attempts</span></header>
                <div className="ops-contact-controls">
                  <label>Contact<select value={contactId} onChange={(e) => setContactId(e.target.value)}><option value="">Organization default</option>{contactCenter?.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role.replaceAll("_", " ")}{contact.isPrimary ? " · Primary" : ""}{contact.isEmergency ? " · Emergency" : ""}</option>)}</select></label>
                  <label>Reason<input value={contactReason} onChange={(e) => setContactReason(e.target.value)} placeholder="Why are you contacting the restaurant?" /></label>
                </div>
                <div className="ops-contact-actions">
                  <button disabled={busy.startsWith("contact:") || !(contactCenter?.contacts.some((c) => c.id === contactId ? c.phone || c.whatsappPhone : false) || (!contactId && contactCenter?.organizationContact.phone))} onClick={() => void contactRestaurant("PHONE")}>{busy === "contact:PHONE" ? "Starting…" : "Call"}</button>
                  <button disabled={busy.startsWith("contact:") || !(contactCenter?.contacts.some((c) => c.id === contactId ? c.whatsappPhone || c.phone : false) || (!contactId && contactCenter?.organizationContact.phone))} onClick={() => void contactRestaurant("WHATSAPP")}>{busy === "contact:WHATSAPP" ? "Opening…" : "WhatsApp"}</button>
                  <button disabled={busy.startsWith("contact:") || !(contactCenter?.contacts.some((c) => c.id === contactId ? c.phone || c.whatsappPhone : false) || (!contactId && contactCenter?.organizationContact.phone))} onClick={() => void contactRestaurant("SMS")}>{busy === "contact:SMS" ? "Opening…" : "SMS"}</button>
                  <button disabled={busy.startsWith("contact:") || !(contactCenter?.contacts.some((c) => c.id === contactId ? c.email : false) || (!contactId && contactCenter?.organizationContact.email))} onClick={() => void contactRestaurant("EMAIL")}>{busy === "contact:EMAIL" ? "Opening…" : "Email"}</button>
                  <button disabled={busy.startsWith("contact:")} onClick={() => void contactRestaurant("IN_APP")}>{busy === "contact:IN_APP" ? "Preparing…" : "In-app"}</button>
                </div>
                {contactCenter?.attempts.length ? <div className="ops-contact-history">{contactCenter.attempts.slice(0, 5).map((attempt) => <article key={attempt.id}><div><strong>{attempt.channel} · {attempt.destinationLabel ?? "Restaurant"}</strong><small>{new Date(attempt.startedAt).toLocaleString("en-NG")} · {attempt.status.replaceAll("_", " ")}{attempt.actor?.displayName ? ` · ${attempt.actor.displayName}` : ""}</small></div><input value={contactOutcomeNotes[attempt.id] ?? ""} onChange={(e) => setContactOutcomeNotes((current) => ({ ...current, [attempt.id]: e.target.value }))} placeholder="Outcome note (optional)" /><div className="ops-contact-outcomes">{["PHONE", "WHATSAPP"].includes(attempt.channel) ? <><button className={attempt.status === "COMPLETED" ? "done" : ""} disabled={attempt.status === "COMPLETED" || busy.startsWith(`outcome:${attempt.id}:`)} onClick={() => void saveContactOutcome(attempt, "COMPLETED")}>{attempt.status === "COMPLETED" ? "✓ Reached" : "Reached"}</button><button className={attempt.status === "NO_ANSWER" ? "done" : ""} disabled={attempt.status === "NO_ANSWER" || busy.startsWith(`outcome:${attempt.id}:`)} onClick={() => void saveContactOutcome(attempt, "NO_ANSWER")}>{attempt.status === "NO_ANSWER" ? "✓ No answer" : "No answer"}</button><button className={attempt.status === "BUSY" ? "done" : ""} disabled={attempt.status === "BUSY" || busy.startsWith(`outcome:${attempt.id}:`)} onClick={() => void saveContactOutcome(attempt, "BUSY")}>{attempt.status === "BUSY" ? "✓ Busy" : "Busy"}</button><button className={attempt.status === "FAILED" ? "done" : ""} disabled={attempt.status === "FAILED" || busy.startsWith(`outcome:${attempt.id}:`)} onClick={() => void saveContactOutcome(attempt, "FAILED")}>{attempt.status === "FAILED" ? "✓ Failed" : "Failed"}</button></> : <span className="ops-contact-state">{attempt.channel === "IN_APP" && attempt.status === "COMPLETED" ? "✓ In-app alert confirmed" : "External composer opened · delivery not verified by Bazaara"}</span>}</div></article>)}</div> : <div className="ops-contact-empty">No restaurant contact attempt has been logged for this case yet.</div>}
              </section>
              <section className={`support-v6-ai-card ${currentAi?.safeToAutoReply ? "safe" : "human"}`}><header><div><span className="ops-v31-kicker">FOOD AI</span><h3>{currentAi ? currentAi.issueType.replaceAll("_", " ") : "Analyze this Food case"}</h3></div>{currentAi ? <b>{Math.round(currentAi.confidence * 100)}%</b> : null}</header>{currentAi ? <><p>{currentAi.summary}</p><div className="support-v6-ai-route"><span>Route: <b>{currentAi.route.replaceAll("_", " ")}</b></span><span>Urgency: <b>{currentAi.urgency}</b></span><span>{currentAi.safeToAutoReply ? "Safe informational auto-reply" : "Human review required"}</span></div><div className="support-v6-ai-suggestion"><strong>Suggested reply</strong><p>{currentAi.suggestedReply}</p></div></> : <p>Runs a deterministic Food-aware triage pass against linked order, payment, restaurant, commission and GO tracking context.</p>}<footer><button disabled={busy === "food-ai-analyze"} onClick={() => void analyzeFood()}>{busy === "food-ai-analyze" ? "Analyzing…" : "Refresh AI analysis"}</button><button className="ops-v33-primary" disabled={!currentAi?.safeToAutoReply || busy === "food-ai-reply"} onClick={() => void sendFoodAi()}>{busy === "food-ai-reply" ? "Sending…" : "Send safe AI reply"}</button></footer></section>
            </> : null}

            <div className="ops-v33-case-controls"><label>Status<select value={selected.status} onChange={(e) => void patch({ status: e.target.value })}>{["OPEN", "WAITING_CUSTOMER", "WAITING_STAFF", "ESCALATED", "RESOLVED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Priority<select value={selected.priority} onChange={(e) => void patch({ priority: e.target.value })}>{["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Assignee<select value={selected.assignedTo?.id ?? ""} onChange={(e) => void patch({ assignedToUserId: e.target.value || null })}><option value="">Unassigned</option>{agents.map((agent) => <option key={agent.userId} value={agent.userId}>{agent.displayName || agent.email || agent.userId}</option>)}</select></label></div>
            <section className="ops-v33-messages">{selected.messages.map((message) => <article key={message.id} className={message.kind === "INTERNAL" ? "internal" : message.kind === "AI" ? "ai" : ""}><header><strong>{message.kind === "AI" ? "BAZAARA FOOD AI" : message.kind}{message.author?.displayName ? ` · ${message.author.displayName}` : ""}</strong><time>{new Date(message.createdAt).toLocaleString("en-NG")}</time></header><p>{message.body}</p></article>)}</section>
            <div className="ops-v33-composer"><textarea placeholder={internal ? "Internal note" : "Reply to customer or merchant"} value={reply} onChange={(e) => setReply(e.target.value)} /><div><label><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note</label><button className="ops-v33-primary" disabled={busy === "reply" || !reply.trim()} onClick={() => void send()}>{busy === "reply" ? "Sending…" : internal ? "Save note" : "Send reply"}</button></div></div>
          </> : <div className="ops-v31-empty">Select a case to open its full conversation and controls.</div>}</aside>
        </div>
      </main>
    </OpsShell>
  );
}
