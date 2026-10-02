"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import type { FoodRestaurantSummaryContract } from "@bazaara/contracts";
import { BAZID_BASE, foodApi, money, type FoodOrder } from "../lib/food-api";
import { RestaurantCard } from "./restaurant-card";

type Recommendations = { restaurants: FoodRestaurantSummaryContract[]; reorder: FoodOrder[] };
const settings = [
  {href:"/orders",icon:"▤",title:"Orders & support",copy:"Track deliveries, receipts, reviews and help"},
  {href:"/favorites",icon:"♡",title:"Favourites",copy:"Saved restaurants and dishes"},
  {href:"/deals",icon:"%",title:"Promo codes & deals",copy:"Offers available across Food"},
  {href:"/prime",icon:"✦",title:"Bazaara Prime",copy:"Member delivery and fee benefits"},
  {href:"/language",icon:"文",title:"Language",copy:"Nigerian language preference"},
  {href:"/settings",icon:"⚙",title:"Settings",copy:"Location, payments, notifications and privacy"},
] as const;

export function FoodAccountClient() {
  const [ready,setReady]=useState(false); const [auth,setAuth]=useState(true); const [recommendations,setRecommendations]=useState<Recommendations|null>(null); const [notice,setNotice]=useState("");
  useEffect(()=>{let active=true;void(async()=>{try{await foodApi.get("/v1/bazid/me",{cache:"no-store"})}catch(error){if(!active)return;if(error instanceof ApiError&&error.status===401){setAuth(false);setReady(true);return}setNotice("BazID could not be verified right now.");setReady(true);return}try{const next=await foodApi.get<Recommendations>("/v1/food/recommendations",{cache:"no-store"});if(active)setRecommendations(next)}catch{if(active)setNotice("Personalised recommendations are temporarily unavailable.")}finally{if(active)setReady(true)}})();return()=>{active=false}},[]);
  if(!ready)return <div className="food-account-page"><section className="food-account-hero food-account-loading"><div className="food-account-skeleton wide"/><div className="food-account-skeleton"/></section></div>;
  if(!auth)return <div className="food-account-page"><section className="food-account-signin"><div><span>BAZID · FOOD</span><h1>Your favourites should follow you.</h1><p>Sign in for saved places, order history, faster checkout and personalised Food recommendations.</p></div><a className="food-primary food-account-signin-button" href={buildBazIdSignInUrl({bazIdBaseUrl:BAZID_BASE,returnTo:typeof window==="undefined"?"http://localhost:3007/account":window.location.href})}>Continue with BazID</a></section></div>;
  const recommended=recommendations?.restaurants??[];const reorder=recommendations?.reorder??[];
  return <div className="food-account-page food-profile-v5">
    <section className="food-account-hero food-profile-hero"><div className="food-account-hero-copy"><span>YOUR FOOD</span><h1>Everything you love, one tap away.</h1><p>Orders, saved places, perks and account controls in a cleaner profile built for repeat use.</p><div className="food-account-pills"><span>Secure BazID</span><span>Fast reorders</span><span>Food preferences</span></div></div><aside className="food-prime-mini"><span>BAZAARA PRIME</span><strong>More value from every delivery.</strong><p>Explore member benefits designed for frequent Bazaara customers.</p><Link href="/prime">See Prime benefits →</Link></aside></section>
    {notice?<div className="food-account-notice" role="status">{notice}</div>:null}
    <section className="food-profile-layout"><div className="food-profile-menu">{settings.map(item=><Link key={item.href} href={item.href}><i>{item.icon}</i><div><b>{item.title}</b><small>{item.copy}</small></div><span>›</span></Link>)}<a href={`${BAZID_BASE}/account?from=food`}><i>◎</i><div><b>Account & privacy</b><small>Name, email, phone, security and privacy</small></div><span>›</span></a></div>
    <div className="food-profile-feed"><section className="food-account-panel"><div className="food-account-panel-head"><div><span>ORDER AGAIN</span><h2>Recent favourites</h2></div><Link href="/orders">History →</Link></div>{reorder.length?<div className="food-account-reorder-list">{reorder.slice(0,4).map(order=><Link href={`/orders/${order.id}`} key={order.id}><div><b>{order.restaurant.name}</b><span>{order.items.slice(0,2).map(item=>item.name).join(" · ")}</span></div><div><strong>{money(order.totalMinor,order.currency)}</strong><small>{new Date(order.placedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short"})}</small></div></Link>)}</div>:<div className="food-account-empty-state compact"><span>START YOUR HISTORY</span><h3>Your repeat meals will appear here.</h3></div>}</section>
    {recommended.length?<section className="food-account-panel"><div className="food-account-panel-head"><div><span>FOR YOU</span><h2>Recommended nearby</h2></div><Link href="/search">Explore →</Link></div><div className="restaurant-grid food-account-restaurant-grid">{recommended.slice(0,3).map(r=><RestaurantCard key={r.id} restaurant={r}/>)}</div></section>:null}</div></section>
  </div>;
}
