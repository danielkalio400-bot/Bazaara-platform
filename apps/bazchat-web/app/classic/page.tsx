"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { API_BASE, api, Shell, SessionGate, ProfileSetup, TitleBlock, Member, useSocialSession, errorText, uploadMedia } from "@bazaara/social-ui";

type Peer = { id: string; displayName: string | null; socialProfile?: { handle: string } | null; handle?: string };
type Conversation = { id: string; participants: Peer[]; latestMessage: { body: string; attachmentName?: string | null; senderUserId: string; createdAt: string } | null; unread: number; updatedAt: string };
type ReplyPreview={id:string;senderUserId:string;body:string;deletedAt?:string|null;attachmentName?:string|null};
type Message = { id: string; senderUserId: string; body: string | null; createdAt: string; deletedAt?: string | null; replyToMessageId?:string|null; replyTo?:ReplyPreview|null; attachment?: { id:string; name:string; contentType:string; byteSize:number; url:string } | null };
export default function BChatHome() {
  const session = useSocialSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Peer[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [reported, setReported] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replying, setReplying] = useState<Message | null>(null);
  const selectedRef = useRef("");
  const cursorRef = useRef<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);

  const loadList = useCallback(async () => {
    try { const res = await api.get<{ conversations: Conversation[] }>("/v1/bazchat/conversations", { maxRetries: 0 }); setConversations(res.conversations); }
    catch (err) { setError(errorText(err)); }
  }, []);
  const loadMessages = useCallback(async (conversationId: string, reset = false) => {
    if (!conversationId) return;
    try {
      const after = reset ? null : cursorRef.current;
      const res = await api.get<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }>(
        `/v1/bazchat/conversations/${encodeURIComponent(conversationId)}/messages`, { query: { after, limit: 50 }, maxRetries: 0 });
      if (selectedRef.current !== conversationId) return;
      setMessages(prev => {
        const base = reset ? [] : prev;
        const seen = new Set(base.map(x => x.id));
        return [...base, ...res.messages.filter(x => !seen.has(x.id))];
      });
      setCursor(res.nextCursor); cursorRef.current = res.nextCursor; setHasMore(res.hasMore);
      if (res.messages.length) void api.post(`/v1/bazchat/conversations/${encodeURIComponent(conversationId)}/read`, {}).then(loadList).catch(() => undefined);
    } catch (err) { setError(errorText(err)); }
  }, [loadList]);

  useEffect(() => {
    if (!session.user?.profile) return;
    void loadList();
    const interval = window.setInterval(() => { void loadList(); const id = selectedRef.current; if (id) void loadMessages(id); }, 4500);
    // Fast updates within one API instance. Cursor polling remains the durability path.
    const events = new EventSource(`${API_BASE}/v1/bazchat/events`, { withCredentials: true });
    events.addEventListener("changed", () => { void loadList(); const id = selectedRef.current; if (id) void loadMessages(id, true); });
    return () => { clearInterval(interval); events.close(); };
  }, [session.user?.profile, loadList, loadMessages]);
  useEffect(() => { if (!search.trim() || search.trim().length < 2) { setResults([]); return; } const timer = window.setTimeout(async () => {
    setSearching(true);
    try { const data = await api.get<{ users: Peer[] }>("/v1/social/users", { query: { q: search }, maxRetries: 0 }); setResults(data.users); }
    catch (err) { setError(errorText(err)); } finally { setSearching(false); }
  }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages.length, selectedId]);

  function selectConversation(id: string) { selectedRef.current = id; cursorRef.current = null; setCursor(null); setMessages([]); setSelectedId(id); setReported(false); setReplying(null); void loadMessages(id, true); }
  async function openConversation(peer: Peer) {
    try { setBusy(true); const res = await api.post<{ conversationId: string }>("/v1/bazchat/conversations", { recipientUserId: peer.id }); setSearch("");setResults([]); await loadList(); selectConversation(res.conversationId); }
    catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }
  async function send(e: FormEvent) {
    e.preventDefault(); const id = selectedRef.current; const body = draft.trim(); if (!id || (!body && !attachment) || busy) return;
    try {
      setBusy(true); setError("");
      let assetId: string | undefined;
      if (attachment) {
        if (attachment.size > 25 * 1024 * 1024) throw new Error("Chat attachments are limited to 25 MB.");
        assetId = (await uploadMedia(attachment, "PRIVATE")).id;
      }
      await api.post(`/v1/bazchat/conversations/${encodeURIComponent(id)}/messages`, { body, clientNonce: crypto.randomUUID(), assetId, attachmentName: attachment?.name, replyToMessageId: replying?.id });
      setDraft(""); setAttachment(null); setReplying(null); await loadMessages(id); await loadList();
    }
    catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }
  async function block(peer: Peer) {
    if (!window.confirm(`Block ${peer.displayName || peer.handle || "this member"}? New messages will be prevented.`)) return;
    try { await api.post(`/v1/social/blocks/${encodeURIComponent(peer.id)}`, {}); setError("Member blocked. You can unblock them in your social account settings."); }
    catch (err) { setError(errorText(err)); }
  }
  async function report(peer: Peer) {
    try { await api.post("/v1/social/reports", { targetType: "USER", targetId: peer.id, reason: "OTHER", detail: "Reported from BChat conversation" }); setReported(true); }
    catch (err) { setError(errorText(err)); }
  }
  const conversation = conversations.find(c => c.id === selectedId);
  const peer = conversation?.participants.find(p => p.id !== session.user?.id);
  return <Shell slug="bazchat" section="Messages"><SessionGate {...session} productName="BChat">
    {session.user?.profile ? <><TitleBlock eyebrow="BCHAT / PRIVATE CONVERSATIONS" title="Stay close, wherever you are." description="One-to-one messaging with your BChat members. Messages sync through your BChat account space." action={<span className="e2-chip">PRIVATE • BAZID</span>}/>
      {error ? <div className="e2-notice" role="alert">{error}<button className="e2-textButton" style={{marginLeft:12}} onClick={()=>setError("")}>Dismiss</button></div>:null}
      <div className={`chat-workspace e2-card ${selectedId?"chat-open":""}`}>
        <section className="chat-inbox" aria-label="Your conversations">
          <div className="chat-paneHeader"><div><span className="e2-kicker">YOUR SPACE</span><h2>Messages <span className="chat-count">{conversations.length}</span></h2></div><span className="chat-liveDot" title="Messages sync automatically"/></div>
          <div className="chat-search"><label className="sr-only" htmlFor="chat-search">Find BAZAARA members</label><span aria-hidden="true">⌕</span><input id="chat-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find people by name or @handle" autoComplete="off"/></div>
          {search.trim().length >= 2 ? <div className="chat-list" aria-live="polite">{searching?<p className="e2-subtle">Searching…</p>:results.length?results.map(person=><button className="chat-person" key={person.id} disabled={busy} onClick={()=>void openConversation(person)}><Member name={person.displayName} handle={person.handle}/><span><strong>{person.displayName||person.handle}</strong><small>@{person.handle}</small></span><span className="chat-personArrow">↗</span></button>):<div className="e2-empty">No matching members. They may have disabled discovery.</div>}</div>:<div className="chat-list">{conversations.length?conversations.map(c=>{const p=c.participants.find(u=>u.id!==session.user?.id);return <button key={c.id} className={`chat-person ${selectedId===c.id?"selected":""}`} onClick={()=>selectConversation(c.id)}><Member name={p?.displayName??null} handle={p?.socialProfile?.handle}/><span><strong>{p?.displayName||p?.socialProfile?.handle||"Member"}</strong><small>{c.latestMessage?.body||c.latestMessage?.attachmentName||"Start your conversation"}</small></span>{c.unread>0?<span className="chat-unread">{c.unread>99?"99+":c.unread}</span>:null}</button>}):<div className="e2-empty"><strong>No conversations yet</strong><p>Search for a BAZAARA member to start a private conversation.</p></div>}</div>}
          <div className="chat-inboxFoot">Messages are not end-to-end encrypted in this release.</div>
        </section>
        <section className="chat-thread" aria-label="Conversation">
          {selectedId&&peer?<><header className="chat-threadHead"><button className="chat-back" onClick={()=>setSelectedId("")} aria-label="Back to conversations">←</button><Member name={peer.displayName} handle={peer.socialProfile?.handle}/><div className="chat-peer"><h3>{peer.displayName||peer.socialProfile?.handle}</h3><small>@{peer.socialProfile?.handle||"member"}</small></div><div className="chat-tools"><button className="e2-textButton" onClick={()=>void report(peer)} disabled={reported}>{reported?"Reported":"Report"}</button><button className="e2-textButton danger" onClick={()=>void block(peer)}>Block</button></div></header>
              <div className="chat-messages" ref={scroller} role="log" aria-live="polite" aria-relevant="additions text">{messages.map(m=><div key={m.id} className={`chat-bubbleRow ${m.senderUserId===session.user?.id?"mine":""}`}><div className="chat-bubble">{m.replyTo?<div className="chat-replyPreview"><strong>{m.replyTo.senderUserId===session.user?.id?"You":"Reply"}</strong><span>{m.replyTo.deletedAt?"Message deleted":m.replyTo.body||m.replyTo.attachmentName||"Attachment"}</span></div>:null}{m.body!==null&&m.body?<p>{m.body}</p>:m.deletedAt?<p>Message deleted</p>:null}{m.attachment?<a className="chat-attachment" href={m.attachment.url} target="_blank" rel="noreferrer"><strong>↗ {m.attachment.name}</strong><small>{(m.attachment.byteSize/1024/1024).toFixed(1)} MB · {m.attachment.contentType}</small></a>:null}<div className="chat-messageMeta"><time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}</time>{!m.deletedAt?<button className="chat-replyButton" onClick={()=>setReplying(m)}>Reply</button>:null}</div></div></div>)}{!messages.length?<div className="chat-welcome"><div className="chat-welcomeIcon">✦</div><h3>A new conversation starts here.</h3><p>Say hello to {peer.displayName||peer.socialProfile?.handle}. Keep private information out of messages you don't want stored.</p></div>:null}{hasMore?<button className="e2-button secondary sm" onClick={()=>void loadMessages(selectedId)}>Load more messages</button>:null}</div>
              <form className="chat-compose" onSubmit={send}><label className="chat-attachButton" title="Attach a file">＋<input type="file" onChange={e=>setAttachment(e.target.files?.[0]??null)}/></label><div className="chat-composeBody">{replying?<div className="chat-replyDraft"><span><strong>Replying to</strong> {replying.body||replying.attachment?.name||"message"}</span><button type="button" className="e2-textButton" onClick={()=>setReplying(null)}>Cancel</button></div>:null}<label className="sr-only" htmlFor="chat-compose">Write message</label><textarea id="chat-compose" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={4000} rows={2} placeholder={replying?"Write your reply…":"Write a message…"} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/>{attachment?<div className="chat-attachmentDraft"><span>{attachment.name} · {(attachment.size/1024/1024).toFixed(1)} MB</span><button type="button" className="e2-textButton" onClick={()=>setAttachment(null)}>Remove</button></div>:null}</div><button className="e2-button" disabled={(!draft.trim()&&!attachment)||busy} aria-label="Send message">{busy?"Sending…":"Send ↗"}</button></form></>:<div className="chat-noSelection"><span>✦</span><h2>Conversations, uninterrupted.</h2><p>Select an existing conversation or search for someone new to begin.</p><div className="chat-decoration"><i/><i/><i/></div></div>}
        </section>
      </div>
    </>:session.user?<ProfileSetup user={session.user} onComplete={session.refresh} productName="BChat"/>:null}
  </SessionGate></Shell>;
}
