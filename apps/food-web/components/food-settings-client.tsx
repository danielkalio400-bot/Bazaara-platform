"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { BAZID_BASE, foodApi } from "../lib/food-api";

const PAY_WEB = process.env.NEXT_PUBLIC_PAY_WEB_BASE_URL ?? "http://localhost:3010";
type Preference = { id:string; category:string; channel:"IN_APP"|"PUSH"|"EMAIL"|"SMS"; enabled:boolean };

type Toggle = { category:"FOOD_ORDER"|"FOOD_PROMOTIONS"; channel:"PUSH"|"EMAIL"; title:string; copy:string };
const toggles:Toggle[] = [
  {category:"FOOD_ORDER",channel:"PUSH",title:"Order push updates",copy:"Preparation, courier and delivery status on your device."},
  {category:"FOOD_ORDER",channel:"EMAIL",title:"Order emails",copy:"Receipts and important order updates by email."},
  {category:"FOOD_PROMOTIONS",channel:"PUSH",title:"Deals & Prime alerts",copy:"Occasional nearby offers and Bazaara Prime benefits."},
  {category:"FOOD_PROMOTIONS",channel:"EMAIL",title:"Food newsletters",copy:"Product news and curated restaurant recommendations."},
];

export function FoodSettingsClient(){
  const[preferences,setPreferences]=useState<Preference[]>([]);const[ready,setReady]=useState(false);const[signedOut,setSignedOut]=useState(false);const[busy,setBusy]=useState("");const[notice,setNotice]=useState("");
  useEffect(()=>{let alive=true;void(async()=>{try{const r=await foodApi.get<{preferences:Preference[]}>("/v1/notifications/preferences",{cache:"no-store"});if(alive)setPreferences(r.preferences)}catch(error){if(error instanceof ApiError&&error.status===401){if(alive)setSignedOut(true)}else if(alive)setNotice(error instanceof Error?error.message:"Could not load settings")}finally{if(alive)setReady(true)}})();return()=>{alive=false}},[]);
  const values=useMemo(()=>{const map=new Map<string,boolean>();for(const p of preferences)map.set(`${p.category}:${p.channel}`,p.enabled);return map},[preferences]);
  async function setPreference(item:Toggle,enabled:boolean){const key=`${item.category}:${item.channel}`;setBusy(key);setNotice("");try{const r=await foodApi.put<{preference:Preference}>(`/v1/notifications/preferences/${item.category}/${item.channel}`,{enabled});setPreferences(prev=>[...prev.filter(p=>!(p.category===item.category&&p.channel===item.channel)),r.preference]);setNotice("Preference saved.")}catch(error){setNotice(error instanceof Error?error.message:"Could not save preference")}finally{setBusy("")}}
  if(!ready)return <div className="food-settings-loading">Loading your Food settings…</div>;
  if(signedOut)return <section className="food-account-signin"><div><span>BAZID · SETTINGS</span><h1>Your settings follow your BazID.</h1><p>Sign in to manage notifications, privacy, payment shortcuts and Food preferences.</p></div><a className="food-primary" href={buildBazIdSignInUrl({bazIdBaseUrl:BAZID_BASE,returnTo:typeof window==="undefined"?"http://localhost:3007/settings":window.location.href})}>Continue with BazID</a></section>;
  return <div className="food-settings-grid-v7">
    <section className="food-settings-card-v7"><div className="food-settings-card-head"><span>DELIVERY</span><h2>Location & discovery</h2><p>Your selected pin determines nearby restaurant availability and distance.</p></div><Link className="food-settings-action" href="/location"><b>Delivery location</b><small>Open Bazaara Maps preview and saved places</small><span>›</span></Link><Link className="food-settings-action" href="/language"><b>Language</b><small>Nigerian languages for the current rollout</small><span>›</span></Link></section>
    <section className="food-settings-card-v7"><div className="food-settings-card-head"><span>MONEY</span><h2>Payments</h2><p>Food checkout supports Wallet, card and bank transfer only.</p></div><a className="food-settings-action" href={PAY_WEB}><b>Wallet</b><small>Wallet balance, top-up and transfers</small><span>›</span></a><a className="food-settings-action" href={`${BAZID_BASE}/account?from=food`}><b>Payment identity</b><small>Manage your BazID account and verified details</small><span>›</span></a></section>
    <section className="food-settings-card-v7 food-settings-notifications"><div className="food-settings-card-head"><span>NOTIFICATIONS</span><h2>What reaches you</h2><p>In-app order notifications always stay enabled for delivery safety.</p></div>{toggles.map(item=>{const key=`${item.category}:${item.channel}`;const enabled=values.get(key)??true;return <div className="food-settings-toggle" key={key}><div><b>{item.title}</b><small>{item.copy}</small></div><button type="button" className={enabled?"on":""} disabled={busy===key} onClick={()=>void setPreference(item,!enabled)} aria-pressed={enabled}><span/></button></div>})}</section>
    <section className="food-settings-card-v7"><div className="food-settings-card-head"><span>ACCOUNT</span><h2>Security & support</h2><p>BazID owns identity, authentication and privacy controls across Bazaara.</p></div><a className="food-settings-action" href={`${BAZID_BASE}/account?from=food`}><b>Account & privacy</b><small>Name, phone, password, sessions and data controls</small><span>›</span></a><Link className="food-settings-action" href="/support"><b>Live support</b><small>Report a case and chat with Bazaara Support</small><span>›</span></Link><Link className="food-settings-action" href="/orders"><b>Orders & receipts</b><small>Delivery issues, refunds and reviews</small><span>›</span></Link></section>
    {notice?<p className="food-settings-notice" role="status">{notice}</p>:null}
  </div>;
}
