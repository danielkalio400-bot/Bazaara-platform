"use client";
import Link from "next/link";
import { useCallback,useEffect,useMemo,useState,type FormEvent } from "react";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { ShoppingHeader } from "../../components/shopping-header";

const API=(process.env.NEXT_PUBLIC_API_BASE_URL??"http://localhost:4000").replace(/\/$/,"");
const BAZID=process.env.NEXT_PUBLIC_BAZID_BASE_URL??"http://localhost:3004";
const GROCERY=process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL??"http://localhost:3006";
type Item={id:string;label:string;quantity:number;checked:boolean};
type List={id:string;name:string;archived:boolean;updatedAt:string;items:Item[];accessRole:"OWNER"|"EDITOR"|"VIEWER";canEdit:boolean;canManage:boolean;collaborators:any[]};
type State="loading"|"authenticated"|"signed-out"|"error";
async function req<T>(p:string,init?:RequestInit){const r=await fetch(`${API}${p}`,{credentials:"include",cache:"no-store",...init,headers:{...(init?.body?{"content-type":"application/json"}:{}),...(init?.headers??{})}});const b=await r.json().catch(()=>null) as any;if(r.status===401){const e=new Error("AUTH");e.name="SignInRequired";throw e}if(!r.ok||!b)throw new Error(b?.error?.message??"Request failed");return b as T}

export default function GroceryListsPage(){
  const[state,setState]=useState<State>("loading");const[lists,setLists]=useState<List[]>([]);const[name,setName]=useState("");const[drafts,setDrafts]=useState<Record<string,string>>({});const[qty,setQty]=useState<Record<string,number>>({});const[shareDrafts,setShareDrafts]=useState<Record<string,string>>({});const[busy,setBusy]=useState("");const[error,setError]=useState("");
  const signInUrl=useMemo(()=>buildBazIdSignInUrl({bazIdBaseUrl:BAZID,returnTo:`${GROCERY.replace(/\/$/,"")}/lists`}),[]);
  const load=useCallback(async()=>{try{const b=await req<{lists:List[]}>("/v1/grocery/lists");setLists(b.lists);setState("authenticated");setError("")}catch(e){if(e instanceof Error&&e.name==="SignInRequired"){setState("signed-out")}else{setState("error");setError(e instanceof Error?e.message:"Could not load Grocery lists")}}},[]);
  useEffect(()=>{void load()},[load]);

  async function createList(e:FormEvent){e.preventDefault();if(!name.trim())return;setBusy("new");try{await req("/v1/grocery/lists",{method:"POST",body:JSON.stringify({name:name.trim()})});setName("");await load()}finally{setBusy("")}}
  async function addItem(listId:string){const label=drafts[listId]?.trim();if(!label)return;setBusy(`add:${listId}`);try{await req(`/v1/grocery/lists/${listId}/items`,{method:"POST",body:JSON.stringify({label,quantity:Math.max(1,Math.min(99,qty[listId]??1))})});setDrafts(c=>({...c,[listId]:""}));setQty(c=>({...c,[listId]:1}));await load()}finally{setBusy("")}}
  async function patchItem(listId:string,item:Item,patch:{quantity?:number;checked?:boolean}){setBusy(item.id);try{await req(`/v1/grocery/lists/${listId}/items/${item.id}`,{method:"PATCH",body:JSON.stringify(patch)});await load()}finally{setBusy("")}}
  async function removeItem(listId:string,itemId:string){setBusy(itemId);try{await req(`/v1/grocery/lists/${listId}/items/${itemId}`,{method:"DELETE"});await load()}finally{setBusy("")}}
  async function archiveList(listId:string){setBusy(`archive:${listId}`);try{await req(`/v1/grocery/lists/${listId}`,{method:"PATCH",body:JSON.stringify({archived:true})});await load()}finally{setBusy("")}}
  async function shareList(listId:string){const email=shareDrafts[listId]?.trim();if(!email)return;setBusy(`share:${listId}`);try{await req(`/v1/grocery/lists/${listId}/collaborators`,{method:"POST",body:JSON.stringify({email,role:"EDITOR"})});setShareDrafts(c=>({...c,[listId]:""}));await load()}finally{setBusy("")}}
  async function removeCollaborator(listId:string,userId:string){setBusy(`collab:${userId}`);try{await req(`/v1/grocery/lists/${listId}/collaborators/${userId}`,{method:"DELETE"});await load()}finally{setBusy("")}}

  return <div className="shop-shell grocery-shell grocery-v54-lists"><ShoppingHeader/><main className="shop-main bz-grocery-page">
    <section className="grocery-v54-lists-hero"><div><span>MY GROCERY SYSTEM</span><h1>Lists with real quantities.</h1><p>Build a repeat shop, set how many you need, tick items off and reuse it against the live Grocery catalogue.</p></div><Link href="/search-results?vertical=GROCERY">Browse groceries →</Link></section>
    {error?<div className="gv2-error">{error}</div>:null}
    {state==="loading"?<div className="gv2-card">Loading lists…</div>:null}
    {state==="signed-out"?<div className="gv2-card"><h2>BazID required</h2><p className="gv2-muted">Sign in to keep Grocery lists synchronized.</p><a className="gv2-btn" href={signInUrl}>Continue with BazID</a></div>:null}
    {state==="authenticated"?<>
      <form className="grocery-v54-list-create" onSubmit={createList}><div><span>NEW LIST</span><strong>Create a Grocery list</strong></div><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Weekly essentials" maxLength={80}/><button className="gv2-btn" disabled={!name.trim()||busy==="new"}>{busy==="new"?"Creating…":"Create"}</button></form>
      <div className="grocery-v54-list-grid">{lists.map(list=><article className="grocery-v54-list-card" key={list.id}><header><div><span>{list.accessRole}</span><h2>{list.name}</h2><small>{list.items.length} items · {list.items.reduce((s,i)=>s+i.quantity,0)} total units</small></div>{list.canManage?<button type="button" className="grocery-v54-list-archive" disabled={busy===`archive:${list.id}`} onClick={()=>void archiveList(list.id)}>Archive</button>:null}</header>
        <div className="grocery-v54-list-items">{list.items.map(item=><div className={`grocery-v54-list-item${item.checked?" is-checked":""}`} key={item.id}><button className="grocery-v54-list-check" disabled={!list.canEdit||busy===item.id} onClick={()=>void patchItem(list.id,item,{checked:!item.checked})}>{item.checked?"✓":""}</button><div><strong>{item.label}</strong><small>{item.checked?"Completed":"Needed"}</small></div><div className="grocery-v54-list-qty"><button disabled={!list.canEdit||item.quantity<=1||busy===item.id} onClick={()=>void patchItem(list.id,item,{quantity:item.quantity-1})}>−</button><span>{item.quantity}</span><button disabled={!list.canEdit||item.quantity>=99||busy===item.id} onClick={()=>void patchItem(list.id,item,{quantity:item.quantity+1})}>+</button></div>{list.canEdit?<button className="grocery-v54-list-remove" onClick={()=>void removeItem(list.id,item.id)} disabled={busy===item.id}>×</button>:null}</div>)}</div>
        {list.canEdit?<div className="grocery-v54-list-add"><input value={drafts[list.id]??""} onChange={e=>setDrafts(c=>({...c,[list.id]:e.target.value}))} placeholder="Add an item"/><div className="grocery-v54-list-qty"><button type="button" disabled={(qty[list.id]??1)<=1} onClick={()=>setQty(c=>({...c,[list.id]:Math.max(1,(c[list.id]??1)-1)}))}>−</button><span>{qty[list.id]??1}</span><button type="button" disabled={(qty[list.id]??1)>=99} onClick={()=>setQty(c=>({...c,[list.id]:Math.min(99,(c[list.id]??1)+1)}))}>+</button></div><button type="button" className="gv2-btn" disabled={!drafts[list.id]?.trim()||busy===`add:${list.id}`} onClick={()=>void addItem(list.id)}>Add</button></div>:null}
        {list.canManage?<details className="grocery-v54-collab"><summary>Household collaborators <span>{list.collaborators.length}</span></summary><div className="grocery-v54-collab-share"><input type="email" value={shareDrafts[list.id]??""} onChange={e=>setShareDrafts(c=>({...c,[list.id]:e.target.value}))} placeholder="Verified BazID email"/><button type="button" className="gv2-btn secondary" disabled={!shareDrafts[list.id]?.trim()||busy===`share:${list.id}`} onClick={()=>void shareList(list.id)}>Share as editor</button></div>{list.collaborators.map((person:any)=><div className="grocery-v54-collab-person" key={person.id}><span><strong>{person.displayName||person.email||"BazID member"}</strong><small>{person.role}</small></span><button type="button" disabled={busy===`collab:${person.userId}`} onClick={()=>void removeCollaborator(list.id,person.userId)}>Remove</button></div>)}</details>:null}
      </article>)}</div>
    </>:null}
  </main></div>
}
