"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api, errorText } from "@bazaara/social-ui";
import { Access, Frame, State, useReady } from "./Frame";

type Peer={id:string;displayName:string|null;socialProfile?:{handle:string}|null};
type Chat={id:string;participants:Peer[];latestMessage:{body:string;createdAt:string}|null;unread:number};
type Msg={id:string;senderUserId:string;body:string|null;createdAt:string;deletedAt?:string|null};
export default function BChatNext(){
 const session=useReady();const [list,setList]=useState<Chat[]>([]);const [selected,setSelected]=useState("");
 const [messages,setMessages]=useState<Msg[]>([]),[draft,setDraft]=useState(""),[search,setSearch]=useState("");
 const [people,setPeople]=useState<Peer[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [tab,setTab]=useState<"inbox"|"people">("inbox");const end=useRef<HTMLDivElement>(null);
 const load=useCallback(async()=>{try{const x=await api.get<{conversations:Chat[]}>("/v1/bazchat/conversations",{maxRetries:0});setList(x.conversations);}catch(e){setError(errorText(e))}},[]);
 const loadMessages=useCallback(async(id:string)=>{try{const x=await api.get<{messages:Msg[]}>(`/v1/bazchat/conversations/${encodeURIComponent(id)}/messages`,{query:{limit:50},maxRetries:0});setMessages(x.messages);if(x.messages.length)void api.post(`/v1/bazchat/conversations/${encodeURIComponent(id)}/read`,{}).catch(()=>undefined)}catch(e){setError(errorText(e))}},[]);
 useEffect(()=>{if(session.user?.profile)void load()},[session.user?.profile,load]);
 useEffect(()=>{if(!selected)return;void loadMessages(selected);const t=setInterval(()=>{void loadMessages(selected);void load()},4500);return()=>clearInterval(t)},[selected,loadMessages,load]);
 useEffect(()=>{end.current?.scrollIntoView({block:"end"})},[messages.length]);
 useEffect(()=>{if(tab!=="people"||search.trim().length<2){setPeople([]);return}const t=setTimeout(()=>{void api.get<{users:Peer[]}>("/v1/social/users",{query:{q:search},maxRetries:0}).then(x=>setPeople(x.users)).catch(e=>setError(errorText(e)))},300);return()=>clearTimeout(t)},[search,tab]);
 async function send(e:FormEvent){e.preventDefault();if(!selected||!draft.trim()||busy)return;setBusy(true);try{await api.post(`/v1/bazchat/conversations/${encodeURIComponent(selected)}/messages`,{body:draft.trim(),clientNonce:crypto.randomUUID()});setDraft("");await loadMessages(selected);await load()}catch(e){setError(errorText(e))}finally{setBusy(false)}}
 async function begin(p:Peer){setBusy(true);try{const x=await api.post<{conversationId:string}>("/v1/bazchat/conversations",{recipientUserId:p.id});setSelected(x.conversationId);setTab("inbox");setSearch("");await load()}catch(e){setError(errorText(e))}finally{setBusy(false)}}
 const active=list.find(x=>x.id===selected);const peer=active?.participants.find(x=>x.id!==session.user?.id);
 const access = session.user?.profile ? null : <Access session={session} app="BChat"/>;
 return <Frame app="BChat" initial="COMMUNICATION" mark="B" accent="#9482ff" nav={[
  {id:"inbox",label:"Inbox",active:tab==="inbox",onClick:()=>setTab("inbox")},
  {id:"people",label:"People",active:tab==="people",onClick:()=>setTab("people")},
  {id:"calls",label:"Calls · planned",disabled:true},
  {id:"current",label:"Current messaging",onClick:()=>window.location.assign("/")}
 ]}>{access??<><div className="nx-eyebrow">PRIVATE COMMUNICATION</div><h1>Every conversation,<br/>in focus.</h1><p className="nx-muted">A quieter inbox. No public feed, no dependence on Bicord.</p>{error&&<div className="nx-alert" role="alert">{error}<button onClick={()=>setError("")} className="nx-secondary">Dismiss</button></div>}
 <div className="nx-chatLayout"><section className="nx-card nx-chatList" aria-label="Conversations"><div className="nx-row"><h2>{tab==="people"?"Find people":"Your inbox"}</h2><button className="nx-secondary" onClick={()=>setTab(tab==="people"?"inbox":"people")}>{tab==="people"?"Back":"New"}</button></div>
 {tab==="people"?<><label htmlFor="nx-person-search">Find a member</label><input id="nx-person-search" className="nx-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by handle"/><div className="nx-list nx-scroll">{people.map(p=><button key={p.id} className="nx-item" disabled={busy} onClick={()=>void begin(p)}><span className="nx-thumb">{(p.displayName??"M").charAt(0).toUpperCase()}</span><span><strong>{p.displayName??"Member"}</strong><small>@{p.socialProfile?.handle??"member"}</small></span></button>)}</div></>:
 <><button className="nx-secondary" onClick={()=>void load()}>Refresh inbox</button><div className="nx-list nx-scroll">{list.length?list.map(c=>{const p=c.participants.find(x=>x.id!==session.user?.id);return <button key={c.id} className={`nx-item ${selected===c.id?"nx-on":""}`} onClick={()=>setSelected(c.id)} aria-current={selected===c.id?"true":undefined}><span className="nx-thumb">{(p?.displayName??"M").charAt(0).toUpperCase()}</span><span className="nx-convoText"><strong>{p?.displayName??"Conversation"}</strong><small>{c.latestMessage?.body??"Start a conversation"}</small></span>{c.unread>0&&<span className="nx-unread">{c.unread}</span>}</button>}) : <State>There are no conversations yet. Select New to find someone.</State>}</div></>}</section>
 <section className="nx-card nx-messages" aria-label="Messages"><div className="nx-chatHead"><span className="nx-thumb">{(peer?.displayName??"B").charAt(0)}</span><div><strong>{peer?.displayName??"Select a conversation"}</strong><small>{selected?"Message history":"Your messages stay in your private inbox"}</small></div></div><div className="nx-messageFlow nx-scroll" aria-live="polite">{selected?messages.length?messages.map(m=><div key={m.id} className={`nx-bubble ${m.senderUserId===session.user?.id?"mine":""}`}><p>{m.deletedAt?"Message removed":m.body||"Attachment"}</p><small>{new Date(m.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small></div>):<State>Say hello to begin.</State>:<State>Choose a conversation to read and respond.</State>}<div ref={end}/></div><form className="nx-composer" onSubmit={e=>void send(e)}><label className="nx-sr" htmlFor="nx-compose">Message</label><input id="nx-compose" className="nx-input" placeholder={selected?"Write a message…":"Choose a conversation"} value={draft} onChange={e=>setDraft(e.target.value)} disabled={!selected||busy}/><button className="nx-primary" type="submit" disabled={!selected||!draft.trim()||busy}>Send</button></form></section></div></> }</Frame>
}
