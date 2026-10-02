"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createApiClient } from "@bazaara/api-client";
import styles from "./notifications.module.css";

const API=(process.env.NEXT_PUBLIC_API_BASE_URL??"http://localhost:4000").replace(/\/$/,"");
const api=createApiClient({baseUrl:API,credentials:"include"});
type Item={id:string;category:string;title:string;body:string;resourceType:string|null;resourceId:string|null;mandatory:boolean;readAt:string|null;createdAt:string};
type Preference={id:string;category:string;channel:"PUSH"|"EMAIL"|"SMS"|"IN_APP";enabled:boolean};
const categories=["ORDER","PAYMENT","REFUND","SUPPORT"];
function href(item:Item){if(item.resourceType==="ShoppingOrder"&&item.resourceId)return `/orders/${encodeURIComponent(item.resourceId)}`;if(item.resourceType==="SupportCase"&&item.resourceId)return `/support?case=${encodeURIComponent(item.resourceId)}`;return "/account/notifications";}
export default function NotificationsPage(){
 const[items,setItems]=useState<Item[]>([]),[prefs,setPrefs]=useState<Preference[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const [inbox,p]=await Promise.all([api.get<{notifications:Item[]}>("/v1/notifications?limit=100",{cache:"no-store"}),api.get<{preferences:Preference[]}>("/v1/notifications/preferences",{cache:"no-store"})]);setItems(inbox.notifications);setPrefs(p.preferences);}catch(cause){setError(cause instanceof Error?cause.message:"Could not load notifications");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 const unread=useMemo(()=>items.filter(item=>!item.readAt).length,[items]);
 const enabled=(category:string,channel:"EMAIL"|"SMS")=>prefs.find(p=>p.category===category&&p.channel===channel)?.enabled??true;
 async function mark(item:Item){if(item.readAt)return;await api.patch(`/v1/notifications/${encodeURIComponent(item.id)}/read`,{}).catch(()=>undefined);setItems(v=>v.map(n=>n.id===item.id?{...n,readAt:new Date().toISOString()}:n));}
 async function toggle(category:string,channel:"EMAIL"|"SMS"){const key=`${category}:${channel}`;setBusy(key);try{const body=await api.put<{preference:Preference}>(`/v1/notifications/preferences/${encodeURIComponent(category)}/${channel}`,{enabled:!enabled(category,channel)});setPrefs(v=>[...v.filter(p=>!(p.category===category&&p.channel===channel)),body.preference]);}catch(cause){setError(cause instanceof Error?cause.message:"Could not save notification preference");}finally{setBusy("");}}
 return <main className={styles.page}><div className={styles.wrap}><div className={styles.top}><div><p>SHOPPING</p><h1>Notifications</h1><span>{unread} unread update{unread===1?"":"s"}</span></div><Link href="/account">Back to Account</Link></div>{error?<div className={styles.error}>{error}<button onClick={()=>void load()}>Retry</button></div>:null}<section className={styles.panel}><h2>Delivery preferences</h2><p className={styles.muted}>Security and legally required messages remain enabled. In-app notifications cannot be disabled.</p><div className={styles.preferences}>{categories.map(category=><div key={category} className={styles.prefRow}><strong>{category.toLowerCase().replace(/^./,c=>c.toUpperCase())}</strong>{(["EMAIL","SMS"] as const).map(channel=><button key={channel} disabled={busy===`${category}:${channel}`} onClick={()=>void toggle(category,channel)} className={enabled(category,channel)?styles.activeChip:styles.chip}>{channel} {enabled(category,channel)?"on":"off"}</button>)}</div>)}</div></section><section className={styles.inbox}><div className={styles.inboxHead}><h2>Inbox</h2><button onClick={()=>void load()}>Refresh</button></div>{loading?<div className={styles.empty}>Loading notifications…</div>:items.length===0?<div className={styles.empty}>No notifications yet.</div>:items.map(item=><Link href={href(item)} onClick={()=>void mark(item)} key={item.id} className={`${styles.item} ${!item.readAt?styles.unread:""}`}><div><span className={styles.category}>{item.category}</span><time>{new Date(item.createdAt).toLocaleString("en-NG")}</time></div><strong>{item.title}</strong><p>{item.body}</p></Link>)}</section></div></main>;
}
