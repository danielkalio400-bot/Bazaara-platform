"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FoodCartContract } from "@bazaara/contracts";
import { foodApi, money, type FoodCartResponse } from "../lib/food-api";
import { FoodGroupOrderPanel } from "./food-group-order-panel";

function localDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function FoodCartClient({ restaurantSlug }: { restaurantSlug: string }) {
  const [cart, setCart] = useState<FoodCartContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [scheduledFor, setScheduledFor] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await foodApi.get<FoodCartResponse>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart`, { cache: "no-store" });
      setCart(response.cart);
      setScheduleMode(response.cart.scheduledFor ? "SCHEDULED" : "ASAP");
      if (response.cart.scheduledFor) setScheduledFor(localDateTimeInput(new Date(response.cart.scheduledFor)));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load basket"); }
    finally { setLoading(false); }
  }, [restaurantSlug]);

  useEffect(() => { void load(); }, [load]);

  async function updateItem(itemId: string, quantity: number) {
    setBusy(itemId); setError("");
    try {
      const response = quantity <= 0
        ? await foodApi.delete<FoodCartResponse>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart/items/${encodeURIComponent(itemId)}`)
        : await foodApi.patch<FoodCartResponse>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart/items/${encodeURIComponent(itemId)}`, { quantity });
      setCart(response.cart);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update basket"); }
    finally { setBusy(null); }
  }

  async function updatePreferences(patch: Record<string, unknown>) {
    setBusy("preferences"); setError("");
    try {
      const response = await foodApi.patch<FoodCartResponse>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart/preferences`, patch);
      setCart(response.cart);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update order preferences"); }
    finally { setBusy(null); }
  }

  const canCheckout = useMemo(() => Boolean(cart?.items.length && cart.minimumOrderMet), [cart]);
  if (loading) return <div className="food-loading">Loading your basket…</div>;
  if (!cart) return <div className="food-empty"><h2>Basket unavailable</h2><p>{error || "Try again."}</p></div>;

  return <div className="cart-layout"><section className="cart-main"><div className="cart-restaurant-title"><div><span>YOUR BASKET</span><h1>{cart.restaurant.name}</h1><p>{cart.restaurant.etaMinutes.min}–{cart.restaurant.etaMinutes.max} min estimated {cart.fulfillmentType === "DELIVERY" ? "delivery" : "preparation"}</p></div><Link href={`/restaurants/${restaurantSlug}`}>+ Add more items</Link></div>
    {!cart.items.length?<div className="food-empty"><h2>Your basket is empty</h2><p>Add a dish from {cart.restaurant.name} to begin.</p><Link className="food-primary" href={`/restaurants/${restaurantSlug}`}>Browse menu</Link></div>:cart.items.map((item)=><article className="cart-line" key={item.id}><div className="cart-line-image">{item.imageUrl?<img src={item.imageUrl} alt=""/>:null}</div><div className="cart-line-copy"><h3>{item.name}</h3>{item.selectedModifiers.length?<p>{item.selectedModifiers.map((modifier)=>modifier.optionName).join(" · ")}</p>:null}{item.specialInstructions?<small>“{item.specialInstructions}”</small>:null}<strong>{money(item.lineTotalMinor)}</strong></div><div className="food-qty"><button disabled={busy===item.id} onClick={()=>void updateItem(item.id,item.quantity-1)}>−</button><span>{item.quantity}</span><button disabled={busy===item.id} onClick={()=>void updateItem(item.id,item.quantity+1)}>+</button></div></article>)}

    {cart.items.length?<section className="fulfillment-card"><h2>How do you want it?</h2><div className="fulfillment-toggle"><button className={cart.fulfillmentType==="DELIVERY"?"active":""} disabled={!cart.restaurant.deliveryEnabled||busy==="preferences"} onClick={()=>void updatePreferences({fulfillmentType:"DELIVERY"})}>Delivery</button><button className={cart.fulfillmentType==="PICKUP"?"active":""} disabled={!cart.restaurant.pickupEnabled||busy==="preferences"} onClick={()=>void updatePreferences({fulfillmentType:"PICKUP"})}>Pickup</button></div><div className="schedule-grid"><label className={scheduleMode==="ASAP"?"schedule-option active":"schedule-option"}><input type="radio" checked={scheduleMode==="ASAP"} disabled={!cart.restaurant.asapEnabled || !cart.restaurant.isOpen} onChange={()=>{setScheduleMode("ASAP");setScheduledFor("");void updatePreferences({scheduledFor:null});}}/><span><b>ASAP</b><small>{cart.restaurant.isOpen && cart.restaurant.asapEnabled ? "Prepare as soon as possible" : "Unavailable while closed"}</small></span></label><label className={scheduleMode==="SCHEDULED"?"schedule-option active":"schedule-option"}><input type="radio" checked={scheduleMode==="SCHEDULED"} disabled={!cart.restaurant.scheduledEnabled} onChange={()=>setScheduleMode("SCHEDULED")}/><span><b>Schedule</b><small>{cart.restaurant.scheduledEnabled ? "Choose a time up to 7 days ahead" : "Not available"}</small></span></label></div>{scheduleMode==="SCHEDULED"?<div className="schedule-picker"><input type="datetime-local" value={scheduledFor} min={localDateTimeInput(new Date(Date.now()+30*60*1000))} max={localDateTimeInput(new Date(Date.now()+7*24*60*60*1000))} onChange={(event)=>setScheduledFor(event.target.value)}/><button disabled={!scheduledFor||busy==="preferences"} onClick={()=>void updatePreferences({scheduledFor:new Date(scheduledFor).toISOString()})}>Save time</button></div>:null}<div className="preference-checks"><label><input type="checkbox" checked={cart.cutleryRequired} onChange={(event)=>void updatePreferences({cutleryRequired:event.target.checked})}/> Include cutlery</label><label><input type="checkbox" checked={cart.contactless} onChange={(event)=>void updatePreferences({contactless:event.target.checked})}/> Contactless handoff</label></div></section>:null}
    {cart.items.length?<FoodGroupOrderPanel restaurantSlug={restaurantSlug} groupOrderId={cart.groupOrderId}/>:null}
    {error?<p className="food-error" role="alert">{error}</p>:null}
  </section>
  <aside className="cart-summary"><h2>Order summary</h2><div><span>Items</span><b>{money(cart.subtotalMinor)}</b></div><div><span>Delivery</span><b>{cart.deliveryFeeMinor?money(cart.deliveryFeeMinor):"Free"}</b></div><div><span>Service fee ({(cart.serviceFeeRateBps/100).toFixed(1)}%)</span><b>{money(cart.serviceFeeMinor)}</b></div><small className="fee-note">Platform service fee · min {money(cart.serviceFeeMinimumMinor)} · max {money(cart.serviceFeeMaximumMinor)}</small><div className="cart-total"><span>Total</span><strong>{money(cart.totalMinor)}</strong></div>{!cart.minimumOrderMet?<p className="minimum-warning">Add {money(cart.minimumOrderMinor-cart.subtotalMinor)} more to reach the restaurant minimum.</p>:null}<Link href={canCheckout?`/checkout/${restaurantSlug}`:`/cart/${restaurantSlug}`} aria-disabled={!canCheckout} className={canCheckout?"food-primary checkout-link":"food-primary checkout-link disabled"}>Continue to checkout</Link><small>One restaurant per Food basket keeps preparation and delivery timing predictable.</small></aside></div>;
}
