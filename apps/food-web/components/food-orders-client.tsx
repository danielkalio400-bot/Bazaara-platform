"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { BAZID_BASE, foodApi, money, type FoodOrder } from "../lib/food-api";

export function FoodOrdersClient() {
  const [orders,setOrders]=useState<FoodOrder[]|null>(null); const [needAuth,setNeedAuth]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{void (async()=>{try{const body=await foodApi.get<{orders:FoodOrder[]}>("/v1/food/orders",{cache:"no-store"});setOrders(body.orders);}catch(cause){if(cause instanceof ApiError&&cause.status===401)setNeedAuth(true);else setError(cause instanceof Error?cause.message:"Could not load orders");}})();},[]);
  if(needAuth){const returnTo=typeof window==="undefined"?"http://localhost:3007/orders":window.location.href;return <div className="checkout-auth-card"><span>BAZID</span><h1>Sign in to see your Food orders</h1><a className="food-primary" href={buildBazIdSignInUrl({bazIdBaseUrl:BAZID_BASE,returnTo})}>Continue with BazID</a></div>}
  if(orders===null)return <div className="food-loading">{error||"Loading orders…"}</div>;
  return <section><div className="checkout-title"><span>FOOD</span><h1>Your orders</h1><p>Delivery and pickup orders from every Food restaurant.</p></div>{orders.length?<div className="food-orders-list">{orders.map((order)=><Link key={order.id} href={`/orders/${order.id}`} className="food-order-card"><div><small>{order.orderNumber}</small><h2>{order.restaurant.name}</h2><p>{order.items.map((item)=>`${item.quantity}× ${item.name}`).join(" · ")}</p></div><div><span className={`order-status status-${order.status.toLowerCase()}`}>{order.status.replaceAll("_"," ")}</span><strong>{money(order.totalMinor)}</strong><small>{new Date(order.placedAt).toLocaleString()}</small></div></Link>)}</div>:<div className="food-empty"><h2>No Food orders yet</h2><p>When you place an order, it will appear here.</p><Link className="food-primary" href="/">Find a restaurant</Link></div>}</section>;
}
