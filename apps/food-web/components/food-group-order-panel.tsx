"use client";

import { useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { BAZID_BASE, foodApi, money } from "../lib/food-api";

type Group = { id:string; shareToken:string; status:string; spendingLimitMinor:number|null; expiresAt:string; members:Array<{id:string;displayName:string;allocationMinor:number|null}>; settlementNote:string };

export function FoodGroupOrderPanel({ restaurantSlug, groupOrderId }: { restaurantSlug:string; groupOrderId:string|null }) {
  const [group,setGroup]=useState<Group|null>(null); const [limit,setLimit]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function create(){setBusy(true);setError("");try{const next=await foodApi.post<Group>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/group-orders`,{spendingLimitMinor:limit?Math.round(Number(limit)*100):null});setGroup(next);}catch(cause){if(cause instanceof ApiError&&cause.status===401){window.location.href=buildBazIdSignInUrl({bazIdBaseUrl:BAZID_BASE,returnTo:window.location.href});return;}setError(cause instanceof Error?cause.message:"Could not create group order");}finally{setBusy(false)}}
  const shareUrl=group?(typeof window==="undefined"?`/group/${group.shareToken}`:`${window.location.origin}/group/${group.shareToken}`):"";
  return <section className="group-order-panel"><div><span>ORDER TOGETHER</span><h2>Group order</h2><p>Share one restaurant with friends or family. Everyone builds their own basket; the host places one combined order.</p></div>{group?<div className="group-created"><label>Share link<input readOnly value={shareUrl}/></label><div className="group-actions"><button className="food-secondary" type="button" onClick={()=>void navigator.clipboard?.writeText(shareUrl)}>Copy link</button><button className="food-secondary" type="button" onClick={()=>void navigator.share?.({title:"Join my Food order",url:shareUrl})}>Share</button></div><small>{group.spendingLimitMinor==null?"No host spending cap":`Host cap: ${money(group.spendingLimitMinor)}`} · expires {new Date(group.expiresAt).toLocaleString()}</small><p className="settlement-note">{group.settlementNote}</p></div>:groupOrderId?<div className="group-created"><b>This basket is already linked to a group order.</b><p>Only the host can place the combined order. Members can keep adding dishes until the host checks out.</p></div>:<div className="group-create-row"><label>Optional total cap (₦)<input type="number" min="0" step="100" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="No limit"/></label><button className="food-primary" type="button" disabled={busy} onClick={()=>void create()}>{busy?"Creating…":"Start group order"}</button></div>}{error?<p className="food-error" role="alert">{error}</p>:null}</section>;
}
