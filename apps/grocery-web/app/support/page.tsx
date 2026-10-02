"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createApiClient } from "@bazaara/api-client";
import styles from "./support.module.css";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
const api = createApiClient({ baseUrl: API, credentials: "include" });

type Message = { id: string; kind: string; body: string; createdAt: string; author?: { displayName: string | null } | null };
type Case = { id: string; category: string; subject: string; description: string; status: string; priority: string; orderId: string | null; lastActivityAt: string; messages: Message[] };
const categories = ["ORDER", "DELIVERY", "PAYMENT", "RETURN", "PRODUCT", "ACCOUNT", "OTHER"] as const;

export default function SupportPage() {
  const [requested, setRequested] = useState<string>();
  const [cases, setCases] = useState<Case[]>([]);
  const [selected, setSelected] = useState<string>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("ORDER");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState("");
  const [liveState, setLiveState] = useState<"CONNECTING" | "LIVE" | "RECONNECTING">("CONNECTING");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("case") ?? undefined;
    setRequested(value);
    if (value) setSelected(value);
  }, []);

  const current = useMemo(() => cases.find((item) => item.id === selected), [cases, selected]);

  const load = useCallback(async () => {
    try {
      const body = await api.get<{ cases: Case[] }>("/v1/support/cases", { cache: "no-store" });
      setCases(body.cases);
      if (requested && body.cases.some((item) => item.id === requested)) setSelected(requested);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load support cases");
    }
  }, [requested]);

  const refreshCurrent = useCallback(async (caseId: string) => {
    try {
      const body = await api.get<{ case: Case }>(`/v1/support/cases/${encodeURIComponent(caseId)}`, { cache: "no-store" });
      setCases((items) => items.some((item) => item.id === body.case.id) ? items.map((item) => item.id === body.case.id ? body.case : item) : [body.case, ...items]);
    } catch {
      // The list refresh below remains the fallback if a single-case refresh races logout/navigation.
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!selected || typeof window === "undefined") return;
    const caseId = selected;
    setLiveState("CONNECTING");
    const source = new EventSource(`${API}/v1/support/cases/${encodeURIComponent(caseId)}/stream`, { withCredentials: true });
    source.addEventListener("open", () => setLiveState("LIVE"));
    source.addEventListener("support", () => { void refreshCurrent(caseId); void load(); });
    source.addEventListener("error", () => setLiveState("RECONNECTING"));
    const fallback = window.setInterval(() => void refreshCurrent(caseId), 7000);
    return () => { window.clearInterval(fallback); source.close(); };
  }, [selected, load, refreshCurrent]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy("create"); setError(""); setNotice("");
    try {
      const body = await api.post<{ case: Case }>("/v1/support/cases", { category, subject: subject.trim(), description: description.trim() });
      setCases((items) => [body.case, ...items.filter((item) => item.id !== body.case.id)]);
      setSelected(body.case.id); setSubject(""); setDescription("");
      setNotice("Case created. You are now in live chat with Bazaara Support.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create support case"); }
    finally { setBusy(""); }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!current || !reply.trim() || busy) return;
    setBusy("reply"); setError(""); setNotice("");
    try {
      const body = await api.post<{ case: Case }>(`/v1/support/cases/${encodeURIComponent(current.id)}/messages`, { body: reply.trim() });
      setCases((items) => items.map((item) => item.id === body.case.id ? body.case : item));
      setReply(""); setNotice("Message sent. Support will see it in the same live case thread.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send reply"); }
    finally { setBusy(""); }
  }

  async function escalate() {
    if (!current || busy || current.status === "ESCALATED") return;
    setBusy("escalate"); setError(""); setNotice("");
    try {
      const body = await api.post<{ case: Case }>(`/v1/support/cases/${encodeURIComponent(current.id)}/escalate`, { reason: "Customer requested additional review from Grocery support" });
      setCases((items) => items.map((item) => item.id === body.case.id ? body.case : item));
      setNotice("Case escalated to a senior support queue.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not escalate case"); }
    finally { setBusy(""); }
  }

  return <main className={styles.page}><div className={styles.wrap}>
    <header className={styles.header}><div><p>GROCERY</p><h1>Help & live support</h1><span>Report a case and chat with Bazaara Support in the same live thread.</span></div><Link href="/account">Account</Link></header>
    {error ? <div className={styles.error}>{error}<button type="button" onClick={() => setError("")}>×</button></div> : null}
    {notice ? <div className={styles.notice}>{notice}<button type="button" onClick={() => setNotice("")}>×</button></div> : null}
    {current ? <section className={styles.detail}>
      <button type="button" className={styles.back} onClick={() => setSelected(undefined)}>‹ All support cases</button>
      <div className={styles.caseHead}><div><span>{current.category}</span><h2>{current.subject}</h2><p>{current.status.replaceAll("_", " ")} · {current.priority}</p></div><div className={styles.caseActions}><span className={`${styles.live} ${liveState === "LIVE" ? styles.liveOn : ""}`}>{liveState === "LIVE" ? "● LIVE" : liveState === "RECONNECTING" ? "↻ RECONNECTING" : "○ CONNECTING"}</span>{current.orderId ? <Link href={`/orders/${encodeURIComponent(current.orderId)}`}>View order</Link> : null}</div></div>
      <div className={styles.messages}>{current.messages.map((message) => <article key={message.id} className={`${styles.message} ${message.kind === "CUSTOMER" ? styles.customer : ""}`}><div><strong>{message.kind === "CUSTOMER" ? "You" : message.author?.displayName ?? "Bazaara Support"}</strong><time>{new Date(message.createdAt).toLocaleString("en-NG")}</time></div><p>{message.body}</p></article>)}</div>
      {current.status !== "CLOSED" ? <form onSubmit={send} className={styles.reply}><label>Live chat reply<textarea value={reply} onChange={(event) => setReply(event.target.value)} required maxLength={4000} placeholder="Type your message to support…" /></label><div><button disabled={busy === "reply" || !reply.trim()}>{busy === "reply" ? "Sending…" : "Send message"}</button><button type="button" className={`${styles.secondary} ${current.status === "ESCALATED" ? styles.done : ""}`} disabled={busy === "escalate" || current.status === "ESCALATED"} onClick={() => void escalate()}>{current.status === "ESCALATED" ? "✓ Escalated" : busy === "escalate" ? "Escalating…" : "Escalate"}</button></div></form> : null}
    </section> : <div className={styles.grid}>
      <section className={styles.panel}><h2>Report a case</h2><form onSubmit={create}><label>Issue category<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} minLength={3} maxLength={160} required /></label><label>What happened?<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={3} maxLength={4000} required /></label><button disabled={busy === "create" || subject.trim().length < 3 || description.trim().length < 3}>{busy === "create" ? "Creating…" : "Create case & start live chat"}</button></form></section>
      <section><div className={styles.listHead}><h2>Your cases</h2><button type="button" disabled={busy === "refresh"} onClick={() => void (async () => { setBusy("refresh"); try { await load(); setNotice("✓ Support inbox refreshed."); } finally { setBusy(""); } })()}>{busy === "refresh" ? "Refreshing…" : "Refresh"}</button></div><div className={styles.list}>{cases.length === 0 ? <div className={styles.empty}>No support cases yet.</div> : cases.map((item) => <button type="button" key={item.id} onClick={() => setSelected(item.id)} className={styles.caseRow}><span>{item.category}</span><strong>{item.subject}</strong><small>{item.status.replaceAll("_", " ")} · {new Date(item.lastActivityAt).toLocaleDateString("en-NG")}</small></button>)}</div></section>
    </div>}
  </div></main>;
}
