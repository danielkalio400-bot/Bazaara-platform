"use client";
import { useEffect, useState } from "react";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import styles from "./cart-wishlist-button.module.css";
const BAZID = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
const API = "/api/bazaara-wishlist";
type Body = { products?: Array<{id:string}>; error?: {message?:string} };
export function CartWishlistButton({ productId }: { productId: string | null }) {
  const [saved,setSaved]=useState(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  useEffect(()=>{ if(!productId){setSaved(false);return} let cancelled=false; void fetch(API,{credentials:"include",cache:"no-store"}).then(async r=>({r,b:await r.json().catch(()=>null) as Body|null})).then(({r,b})=>{if(!cancelled&&r.ok)setSaved(Boolean(b?.products?.some(p=>p.id===productId)))}).catch(()=>{}); return()=>{cancelled=true}},[productId]);
  async function toggle(){ if(!productId||busy)return; const previous=saved,next=!saved;setSaved(next);setBusy(true);setMessage("");try{const r=await fetch(`${API}?productId=${encodeURIComponent(productId)}`,{method:next?"PUT":"DELETE",credentials:"include",cache:"no-store"});if(r.status===401){setSaved(previous);window.location.href=buildBazIdSignInUrl({bazIdBaseUrl:BAZID,returnTo:window.location.href});return}const b=await r.json().catch(()=>null) as Body|null;if(!r.ok)throw new Error(b?.error?.message??"Could not update saved groceries");const actual=Array.isArray(b?.products)?Boolean(b?.products?.some(p=>p.id===productId)):next;setSaved(actual);setMessage(actual?"Saved":"Removed from saved");window.dispatchEvent(new CustomEvent("bazaara:wishlist-updated",{detail:{productId,saved:actual}}))}catch(e){setSaved(previous);setMessage(e instanceof Error?e.message:"Could not update saved groceries")}finally{setBusy(false)}}
  return <div className={styles.wrap}><button type="button" className={saved?`${styles.button} ${styles.saved}`:styles.button} disabled={busy||!productId} onClick={()=>void toggle()} aria-pressed={saved} aria-label={saved?"Remove from saved groceries":"Save grocery"} title={saved?"Saved":"Save grocery"}><span aria-hidden="true">{saved?"♥":"♡"}</span></button>{message?<span className={styles.status} role="status">{message}</span>:null}</div>
}
