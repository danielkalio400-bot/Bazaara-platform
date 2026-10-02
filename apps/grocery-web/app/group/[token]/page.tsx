"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingHeader } from "../../../components/shopping-header";
import { groceryFetch, groceryMoney } from "../../../lib/grocery-api";

type Group = {
  id:string; shareToken:string; status:string; spendingLimitMinor:number|null; expiresAt:string;
  itemCount?:number;
  members:Array<{id:string;userId:string;displayName:string;role:string;status:string;paymentAllocationMinor:number|null}>;
  settlementNote?:string;
};

export default function GroceryGroupJoinPage({params}:{params:Promise<{token:string}>}){
  const[token,setToken]=useState(""); const[group,setGroup]=useState<Group|null>(null); const[name,setName]=useState(""); const[error,setError]=useState(""); const[busy,setBusy]=useState(false); const[joined,setJoined]=useState(false);
  useEffect(()=>{void params.then(({token})=>{setToken(token);return groceryFetch<{group:Group}>(`/v1/grocery/group-carts/${encodeURIComponent(token)}`)}).then(body=>setGroup(body.group)).catch(e=>setError(e instanceof Error?e.message:"This group basket is unavailable"))},[params]);
  async function join(){if(!name.trim()||!token)return;setBusy(true);setError("");try{const next=await groceryFetch<Group>(`/v1/grocery/group-carts/join/${encodeURIComponent(token)}`,{method:"POST",body:JSON.stringify({displayName:name.trim()})});setGroup(next);setJoined(true);}catch(e){setError(e instanceof Error?e.message:"Could not join the group basket")}finally{setBusy(false)}}
  return <div className="shop-shell grocery-shell"><ShoppingHeader/><main className="gv2-page"><div className="gv2-card" style={{maxWidth:760,margin:"32px auto"}}><span className="gv2-kicker">HOUSEHOLD BASKET</span><h1>Shop groceries together</h1><p className="gv2-muted">Join this shared Grocery basket with your BazID account. Items you already have in your personal Grocery basket are merged into the shared basket where stock allows.</p>{error?<div className="gv2-error" role="alert">{error}</div>:null}{group?<><div className="gv2-summary" style={{marginTop:18}}><div><span>Items currently shared</span><strong>{group.itemCount??"—"}</strong></div><div><span>Members</span><strong>{group.members.length}</strong></div>{group.spendingLimitMinor!=null?<div><span>Host spending limit</span><strong>{groceryMoney(group.spendingLimitMinor)}</strong></div>:null}<div><span>Link expires</span><strong>{new Date(group.expiresAt).toLocaleString("en-NG")}</strong></div></div>{joined?<div className="gv2-success" style={{marginTop:16}}>You joined the shared basket. Grocery cart actions will now use the host basket while this group remains open.</div>:<div className="gv2-stack" style={{marginTop:18}}><label className="gv2-field"><span>Your display name</span><input className="gv2-input" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} maxLength={80} placeholder="e.g. Daniel"/></label><button className="gv2-btn" disabled={busy||name.trim().length<1} onClick={()=>void join()}>{busy?"Joining…":"Join group basket"}</button><small className="gv2-muted">You may be asked to sign in with BazID. Split amounts coordinate who owes what; they do not simulate multi-party payment settlement.</small></div>}<div className="gv2-row" style={{marginTop:18}}><Link className="gv2-btn secondary" href="/cart">Open shared basket</Link><Link className="gv2-btn secondary" href="/">Browse Grocery</Link></div></>:!error?<p className="gv2-muted">Loading group basket…</p>:null}</div></main></div>;
}
