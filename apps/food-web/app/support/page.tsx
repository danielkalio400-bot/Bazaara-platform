"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FoodHeader } from "../../components/food-header";
import { API_BASE, foodApi } from "../../lib/food-api";

type Message = { id: string; kind: string; body: string; createdAt: string; author?: { displayName: string | null } | null };
type SupportCase = { id: string; category: string; subject: string; status: string; priority: string; foodOrderId?: string | null; lastActivityAt: string; messages: Message[] };
type FoodOrder = { id: string; orderNumber: string; status: string; restaurant?: { id: string; merchant?: { organization?: { displayName?: string } } } };

const issueTypes = [
  ["ORDER_STATUS", "Order status / kitchen delay"],
  ["GO_DELIVERY", "Courier / delivery issue"],
  ["PAYMENT", "Payment or charge"],
  ["MISSING_ITEM", "Missing or incorrect item"],
  ["FOOD_QUALITY", "Food quality"],
  ["REFUND", "Refund request"],
  ["OTHER", "Something else"],
] as const;

export default function FoodSupportPage() {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [foodOrderId, setFoodOrderId] = useState("");
  const [issueType, setIssueType] = useState("ORDER_STATUS");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [liveState, setLiveState] = useState<"CONNECTING" | "LIVE" | "RECONNECTING">("CONNECTING");

  const selected = useMemo(() => cases.find((item) => item.id === selectedId) ?? null, [cases, selectedId]);
  const selectedOrder = useMemo(() => orders.find((item) => item.id === foodOrderId) ?? null, [orders, foodOrderId]);

  const load = useCallback(async () => {
    try {
      const [support, foodOrders] = await Promise.all([
        foodApi.get<{ cases: SupportCase[] }>("/v1/support/cases", { cache: "no-store" }),
        foodApi.get<{ orders: FoodOrder[] }>("/v1/food/orders", { cache: "no-store" }).catch(() => ({ orders: [] })),
      ]);
      const foodCases = support.cases.filter((item) => item.category === "FOOD");
      setCases(foodCases); setOrders(foodOrders.orders);
      setSelectedId((current) => current && foodCases.some((item) => item.id === current) ? current : foodCases[0]?.id ?? "");
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load Food support"); }
  }, []);

  const refreshSelected = useCallback(async (caseId: string) => {
    try {
      const result = await foodApi.get<{ case: SupportCase }>(`/v1/support/cases/${encodeURIComponent(caseId)}`, { cache: "no-store" });
      setCases((items) => items.some((item) => item.id === result.case.id) ? items.map((item) => item.id === result.case.id ? result.case : item) : [result.case, ...items]);
    } catch { /* polling fallback is intentionally quiet */ }
  }, []);

  useEffect(() => { const requestedOrder = new URLSearchParams(window.location.search).get("order"); if (requestedOrder) setFoodOrderId(requestedOrder); }, []);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!selectedId || typeof window === "undefined") return;
    const caseId = selectedId;
    setLiveState("CONNECTING");
    const source = new EventSource(`${API_BASE.replace(/\/$/, "")}/v1/support/cases/${encodeURIComponent(caseId)}/stream`, { withCredentials: true });
    source.addEventListener("open", () => setLiveState("LIVE"));
    source.addEventListener("support", () => { void refreshSelected(caseId); void load(); });
    source.addEventListener("error", () => setLiveState("RECONNECTING"));
    const fallback = window.setInterval(() => void refreshSelected(caseId), 7000);
    return () => { window.clearInterval(fallback); source.close(); };
  }, [selectedId, load, refreshSelected]);

  async function createCase(event: FormEvent) {
    event.preventDefault();
    if (busy || subject.trim().length < 3 || description.trim().length < 3) return;
    setBusy("create"); setError(""); setNotice("");
    try {
      const result = await foodApi.post<{ case: SupportCase }>("/v1/support/cases", {
        category: "FOOD",
        subject: subject.trim(),
        description: description.trim(),
        foodOrderId: foodOrderId || undefined,
        foodRestaurantId: selectedOrder?.restaurant?.id || undefined,
        context: { surface: "BAZAARA_FOOD", foodIssueType: issueType, requestedBy: "CUSTOMER" },
      });
      setCases((items) => [result.case, ...items.filter((item) => item.id !== result.case.id)]);
      setSelectedId(result.case.id); setSubject(""); setDescription("");
      setNotice("Case opened. You are connected to Bazaara Support live chat.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open support case"); }
    finally { setBusy(""); }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selected || !reply.trim() || busy) return;
    setBusy("reply"); setError(""); setNotice("");
    try {
      const result = await foodApi.post<{ case: SupportCase }>(`/v1/support/cases/${encodeURIComponent(selected.id)}/messages`, { body: reply.trim() });
      setCases((items) => items.map((item) => item.id === result.case.id ? result.case : item));
      setReply(""); setNotice("Message sent to Bazaara Support.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send message"); }
    finally { setBusy(""); }
  }

  async function escalate() {
    if (!selected || selected.status === "ESCALATED" || busy) return;
    setBusy("escalate"); setError(""); setNotice("");
    try {
      const result = await foodApi.post<{ case: SupportCase }>(`/v1/support/cases/${encodeURIComponent(selected.id)}/escalate`, { reason: "Customer requested senior review from Food live support" });
      setCases((items) => items.map((item) => item.id === result.case.id ? result.case : item));
      setNotice("Case escalated to a senior support queue.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not escalate case"); }
    finally { setBusy(""); }
  }

  return <div className="food-shell"><FoodHeader showSearch={false} />
    <main className="food-support-v9-page">
      <section className="food-support-v9-hero"><div><span>FOOD SUPPORT</span><h1>Report it. Chat live. Track the outcome.</h1><p>Create a Food case, attach an order when relevant, and continue the same live conversation with Bazaara Support.</p></div><Link href="/orders">My orders</Link></section>
      {error ? <div className="food-support-v9-alert error">{error}<button type="button" onClick={() => setError("")}>×</button></div> : null}
      {notice ? <div className="food-support-v9-alert notice">{notice}<button type="button" onClick={() => setNotice("")}>×</button></div> : null}
      <div className="food-support-v9-grid">
        <section className="food-support-v9-panel"><div className="food-support-v9-head"><div><span>NEW CASE</span><h2>Tell us what happened</h2></div></div><form onSubmit={createCase} className="food-support-v9-form"><label>Issue<select value={issueType} onChange={(event) => setIssueType(event.target.value)}>{issueTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Food order (optional)<select value={foodOrderId} onChange={(event) => setFoodOrderId(event.target.value)}><option value="">No specific order</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} · {order.status.replaceAll("_", " ")}</option>)}</select></label><label>Subject<input required minLength={3} maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Short summary" /></label><label>Details<textarea required minLength={3} maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the issue and what you need help with" /></label><button disabled={busy === "create" || subject.trim().length < 3 || description.trim().length < 3}>{busy === "create" ? "Opening…" : "Open case & start live chat"}</button></form></section>
        <section className="food-support-v9-panel food-support-v9-list"><div className="food-support-v9-head"><div><span>MY CASES</span><h2>Support inbox</h2></div><button type="button" disabled={busy === "refresh"} onClick={() => void (async () => { setBusy("refresh"); try { await load(); setNotice("✓ Support inbox refreshed."); } finally { setBusy(""); } })()}>{busy === "refresh" ? "Refreshing…" : "Refresh"}</button></div>{cases.length ? cases.map((item) => <button type="button" className={selectedId === item.id ? "selected" : ""} key={item.id} onClick={() => setSelectedId(item.id)}><span>{item.priority} · {item.status.replaceAll("_", " ")}</span><strong>{item.subject}</strong><small>{new Date(item.lastActivityAt).toLocaleString("en-NG")}</small></button>) : <p className="food-support-v9-empty">No Food support cases yet.</p>}</section>
        <section className="food-support-v9-panel food-support-v9-thread">{selected ? <><div className="food-support-v9-head"><div><span>LIVE CASE</span><h2>{selected.subject}</h2></div><div className="food-support-v9-thread-state"><b className={liveState === "LIVE" ? "live" : ""}>{liveState === "LIVE" ? "● LIVE" : liveState === "RECONNECTING" ? "↻ RECONNECTING" : "○ CONNECTING"}</b><em>{selected.status.replaceAll("_", " ")}</em></div></div><div className="food-support-v9-messages">{selected.messages.map((message) => <article className={message.kind === "CUSTOMER" ? "mine" : "support"} key={message.id}><header><strong>{message.kind === "CUSTOMER" ? "You" : message.kind === "AI" ? "Bazaara Food AI" : message.author?.displayName || "Bazaara Support"}</strong><time>{new Date(message.createdAt).toLocaleString("en-NG")}</time></header><p>{message.body}</p></article>)}</div>{selected.status !== "CLOSED" ? <form onSubmit={sendMessage} className="food-support-v9-reply"><textarea required maxLength={4000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Type your message…" /><div><button disabled={busy === "reply" || !reply.trim()}>{busy === "reply" ? "Sending…" : "Send message"}</button><button type="button" className={selected.status === "ESCALATED" ? "done" : "secondary"} disabled={busy === "escalate" || selected.status === "ESCALATED"} onClick={() => void escalate()}>{selected.status === "ESCALATED" ? "✓ Escalated" : busy === "escalate" ? "Escalating…" : "Escalate"}</button></div></form> : <p className="food-support-v9-empty">This case is closed.</p>}</> : <p className="food-support-v9-empty">Select a case to open its live conversation.</p>}</section>
      </div>
    </main>
  </div>;
}
