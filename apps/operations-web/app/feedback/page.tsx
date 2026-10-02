"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { OpsShell } from "../components/OpsShell";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const api = createApiClient({ baseUrl: API, credentials: "include" });

type Item = { id:string; userId:string|null; organizationId:string|null; channel:string; category:string; rating:number|null; subject:string; message:string; status:string; priority:string; sourcePath:string|null; assignedToUserId:string|null; resolution:string|null; createdAt:string; updatedAt:string };
type SupportAgent = { userId:string; displayName:string|null; email:string|null; roles:string[] };

export default function FeedbackOps() {
  const [items,setItems] = useState<Item[]>([]);
  const [selected,setSelected] = useState<Item|null>(null);
  const [agents,setAgents] = useState<SupportAgent[]>([]);
  const [q,setQ] = useState("");
  const [status,setStatus] = useState("");
  const [category,setCategory] = useState("");
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [resolution,setResolution] = useState("");
  const [busy,setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q",q.trim());
      if (status) p.set("status",status);
      if (category) p.set("category",category);
      const r = await api.get<{feedback:Item[]}>(`/v1/operations/management/feedback?${p}`);
      setItems(r.feedback);
      setSelected((cur) => r.feedback.find((x) => x.id === cur?.id) ?? r.feedback[0] ?? null);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load feedback"); }
  },[q,status,category]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") ?? ""); setStatus(p.get("status") ?? ""); setCategory(p.get("category") ?? "");
  },[]);
  useEffect(() => { const t = window.setTimeout(() => void load(),220); return () => window.clearTimeout(t); },[load]);
  useEffect(() => { setResolution(selected?.resolution ?? ""); },[selected?.id, selected?.resolution]);
  useEffect(() => { void api.get<{agents:SupportAgent[]}>("/v1/operations/management/support-agents?limit=100").then((r)=>setAgents(r.agents)).catch(()=>setAgents([])); },[]);

  const resolutionUnchanged = Boolean(selected && (resolution || null) === selected.resolution);

  const metrics = useMemo(() => ({
    open: items.filter((x)=>!["RESOLVED","CLOSED"].includes(x.status)).length,
    urgent: items.filter((x)=>x.priority==="URGENT"&&!["RESOLVED","CLOSED"].includes(x.status)).length,
    bugs: items.filter((x)=>x.category==="BUG").length,
    unassigned: items.filter((x)=>!x.assignedToUserId&&!["RESOLVED","CLOSED"].includes(x.status)).length,
    rating: (() => { const r=items.flatMap((x)=>x.rating?[x.rating]:[]); return r.length?Math.round(r.reduce((a,b)=>a+b,0)/r.length*10)/10:null; })(),
  }),[items]);

  async function patch(input: { status?:string; priority?:string; assignedToUserId?:string|null; resolution?:string|null }) {
    if (!selected) return;
    setBusy(true); setNotice("");
    try {
      const r = await api.patch<{feedback:Item; actionState?: "COMPLETED" | "ALREADY_DONE"}>(`/v1/operations/management/feedback/${selected.id}`,input);
      setSelected(r.feedback); setNotice(r.actionState === "ALREADY_DONE" ? "✓ That feedback state was already applied on the server." : "Feedback updated and audit logged."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update feedback"); }
    finally { setBusy(false); }
  }

  return <OpsShell active="/feedback"><main className="ops-v31-main ops-mgmt-main">
    <section className="ops-v33-domain-hero feedback"><div><span className="ops-v31-kicker">VOICE OF CUSTOMER & BUSINESS</span><h1>Turn feedback into owned work.</h1><p>Bugs, requests, billing friction and UX feedback enter one triage queue with priority, ownership and resolution tracking.</p></div><div className="ops-v33-hero-stat"><span>OPEN</span><strong>{metrics.open}</strong><small>{metrics.urgent} urgent · {metrics.rating??"—"}/5 avg</small></div></section>
    {error?<div className="ops-v31-alert">{error}</div>:null}{notice?<div className="ops-v31-notice">{notice}</div>:null}
    <section className="ops-v31-command-kpis ops-mgmt-kpis"><article><span>OPEN</span><strong>{metrics.open}</strong><small>needs action</small></article><article className={metrics.urgent?"attention":""}><span>URGENT</span><strong>{metrics.urgent}</strong><small>highest priority</small></article><article><span>UNASSIGNED</span><strong>{metrics.unassigned}</strong><small>needs an owner</small></article><article><span>BUGS</span><strong>{metrics.bugs}</strong><small>current result set</small></article><article><span>RATING</span><strong>{metrics.rating??"—"}</strong><small>average out of 5</small></article></section>
    <div className="ops-mgmt-toolbar"><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search feedback"/><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">All statuses</option>{["OPEN","REVIEWING","PLANNED","RESOLVED","CLOSED"].map((x)=><option key={x}>{x}</option>)}</select><select value={category} onChange={(e)=>setCategory(e.target.value)}><option value="">All categories</option>{["GENERAL","BUG","FEATURE","BILLING","SUPPORT","UX"].map((x)=><option key={x}>{x}</option>)}</select></div>
    <div className="ops-mgmt-grid feedback"><section className="ops-v31-panel ops-feedback-list">{items.map((item)=><button key={item.id} className={selected?.id===item.id?"selected":""} onClick={()=>setSelected(item)}><div><span>{item.category} · {item.channel}</span><strong>{item.subject}</strong><small>{item.rating?`${"★".repeat(item.rating)}${"☆".repeat(5-item.rating)}`:"No rating"}</small></div><div><b className={`ops-state ${item.priority.toLowerCase()}`}>{item.priority}</b><small>{item.status}</small></div></button>)}{!items.length?<div className="ops-v31-empty">No feedback matches.</div>:null}</section>
      <aside className="ops-v31-panel ops-feedback-detail">{selected?<><div className="ops-v31-section-head"><div><span className="ops-v31-kicker">{selected.category} · {selected.channel}</span><h2>{selected.subject}</h2></div><span className="ops-v31-soft-chip">{selected.status}</span></div><p className="ops-feedback-message">{selected.message}</p><dl><div><dt>Rating</dt><dd>{selected.rating?`${selected.rating}/5`:"—"}</dd></div><div><dt>Business</dt><dd>{selected.organizationId??"—"}</dd></div><div><dt>Source</dt><dd>{selected.sourcePath??"—"}</dd></div><div><dt>Created</dt><dd>{new Date(selected.createdAt).toLocaleString("en-NG")}</dd></div></dl>
        <div className="ops-feedback-controls"><label>Status<select value={selected.status} onChange={(e)=>void patch({status:e.target.value})}>{["OPEN","REVIEWING","PLANNED","RESOLVED","CLOSED"].map((x)=><option key={x}>{x}</option>)}</select></label><label>Priority<select value={selected.priority} onChange={(e)=>void patch({priority:e.target.value})}>{["LOW","NORMAL","HIGH","URGENT"].map((x)=><option key={x}>{x}</option>)}</select></label><label>Owner<select value={selected.assignedToUserId??""} onChange={(e)=>void patch({assignedToUserId:e.target.value||null})}><option value="">Unassigned</option>{agents.map((agent)=><option key={agent.userId} value={agent.userId}>{agent.displayName||agent.email||agent.userId}</option>)}</select></label></div>
        <label className="ops-resolution">Resolution<textarea value={resolution} onChange={(e)=>setResolution(e.target.value)} placeholder="Document decision, fix or follow-up"/><button className={`ops-v33-primary ${resolutionUnchanged ? "smart-done" : ""}`} disabled={busy || resolutionUnchanged} onClick={()=>void patch({resolution:resolution||null})}>{busy?"Saving…":resolutionUnchanged?"✓ Resolution saved":"Save resolution"}</button></label>
      </>:<div className="ops-v31-empty">Select feedback.</div>}</aside></div>
  </main></OpsShell>;
}
