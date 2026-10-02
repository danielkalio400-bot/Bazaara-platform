"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { BusinessHeaderStandalone } from "../../components/BusinessHeaderStandalone";
import { uploadBusinessFile } from "../../lib/business";

function base(){const o=typeof window!=="undefined"?window.location.origin:"http://localhost:3001";return `${o}/api/bazaara-platform`;}
async function req<T>(p:string,m:"GET"|"POST"="GET",body?:unknown){return createApiClient({baseUrl:base(),credentials:"include"}).request<T>(p,{method:m,body,cache:"no-store"});}
type MenuItem={id:string;name:string;priceMinor:number;active:boolean;soldOut:boolean};
type MenuSection={id:string;title:string;items:MenuItem[]};
type Restaurant={id:string;name:string;menu:MenuSection[]};
function money(n:number){return new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n/100);}

export default function FoodMenuPage(){
  const [restaurants,setRestaurants]=useState<Restaurant[]>([]);
  const [rid,setRid]=useState("");
  const [newSection,setNewSection]=useState("");
  const [showNewSection,setShowNewSection]=useState(false);
  const [item,setItem]=useState({sectionId:"",name:"",description:"",price:"",prep:"20",imageUrl:""});const[imageBusy,setImageBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");

  const load=useCallback(async()=>{try{const x=await req<{restaurants:Restaurant[]}>("/v1/business/food/restaurants");setRestaurants(x.restaurants);setRid(v=>v||x.restaurants[0]?.id||"");setError("")}catch(e){setError(e instanceof Error?e.message:"Could not load menu")}},[]);
  useEffect(()=>{void load()},[load]);
  const restaurant=restaurants.find(r=>r.id===rid)??restaurants[0];
  const itemCount=useMemo(()=>restaurant?.menu.reduce((sum,s)=>sum+s.items.length,0)??0,[restaurant]);

  async function addSection(){
    if(!restaurant||!newSection.trim())return;
    setBusy("section");
    try{
      await req(`/v1/business/advanced/food/restaurants/${restaurant.id}/menu-sections`,"POST",{title:newSection.trim()});
      setNewSection("");setShowNewSection(false);setNotice("Menu section created.");await load();
    }catch(e){setError(e instanceof Error?e.message:"Could not create section")}finally{setBusy("")}
  }

  async function addItem(e:FormEvent){
    e.preventDefault();if(!restaurant)return;
    if(!item.sectionId){setError("Choose a menu section first.");return;}
    setBusy("item");
    try{
      await req(`/v1/business/advanced/food/restaurants/${restaurant.id}/menu-items`,"POST",{sectionId:item.sectionId,name:item.name,description:item.description,priceMinor:Math.round(Number(item.price)*100),prepMinutes:Number(item.prep||0),imageUrl:item.imageUrl||undefined,active:true,featured:false,dietaryTags:[]});
      setNotice("Menu item created.");setItem({...item,name:"",description:"",price:"",imageUrl:""});await load();
    }catch(e){setError(e instanceof Error?e.message:"Could not create menu item")}finally{setBusy("")}
  }

  async function uploadMenuImage(file:File){setImageBusy(true);setError("");try{const upload=await uploadBusinessFile(file,"PUBLIC");setItem(current=>({...current,imageUrl:upload.publicUrl??""}));setNotice("Menu image uploaded.")}catch(e){setError(e instanceof Error?e.message:"Could not upload image")}finally{setImageBusy(false)}}
 return <div className="business-control-shell"><BusinessHeaderStandalone active="food"/><main className="business-control-main">
    <section className="business-page-heading business-page-heading-v3"><div><span className="business-kicker">FOOD · MENU</span><h1>Build a menu customers can understand instantly.</h1><p>Create the item and, when needed, create its section right inside the same workflow.</p></div><div className="business-page-badge">{restaurant?.name??"Food business"}</div></section>
    {error?<div className="business-alert">{error}</div>:null}{notice?<div className="business-notice">{notice}</div>:null}

    <section className="business-menu-builder">
      <form className="business-panel business-menu-compose" onSubmit={addItem}>
        <div className="business-section-heading"><div><span className="business-kicker">CREATE</span><h2>Add menu item</h2></div><span className="business-soft-pill">{itemCount} items</span></div>
        <div className="business-form business-menu-form">
          <label className="wide">Section
            <div className="business-inline-select"><select required value={item.sectionId} onChange={e=>setItem({...item,sectionId:e.target.value})}><option value="">Choose section</option>{restaurant?.menu.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select><button type="button" className="business-inline-add" onClick={()=>setShowNewSection(v=>!v)}>+ New section</button></div>
          </label>
          {showNewSection?<div className="business-inline-create wide"><input autoFocus placeholder="e.g. Breakfast, Mains, Drinks" value={newSection} onChange={e=>setNewSection(e.target.value)}/><button type="button" disabled={!newSection.trim()||busy==="section"} onClick={()=>void addSection()}>{busy==="section"?"Creating…":"Create & use"}</button></div>:null}
          <label>Name<input required value={item.name} onChange={e=>setItem({...item,name:e.target.value})} placeholder="Jollof rice & grilled chicken"/></label>
          <label>Price (NGN)<input required inputMode="decimal" value={item.price} onChange={e=>setItem({...item,price:e.target.value})} placeholder="8500"/></label>
          <label className="wide">Description<textarea required rows={3} value={item.description} onChange={e=>setItem({...item,description:e.target.value})} placeholder="Describe portion, protein and what is included."/></label>
          <label>Prep time<input type="number" min="0" max="240" value={item.prep} onChange={e=>setItem({...item,prep:e.target.value})}/></label>
          <div className="business-menu-publish-note"><span>Publishes as available</span><small>You can control sold-out/availability from the Food control room.</small></div>
          <button className="business-primary-button" disabled={busy==="item"}>{busy==="item"?"Adding…":"Add menu item"}</button>
        </div>
      </form>

      <aside className="business-panel business-menu-library"><div className="business-section-heading"><div><span className="business-kicker">MENU</span><h2>Sections & items</h2></div></div>{restaurant?.menu.length?restaurant.menu.map(s=><section key={s.id} className="business-menu-section"><div><strong>{s.title}</strong><small>{s.items.length} items</small></div>{s.items.map(i=><article key={i.id}><span className={`business-dot ${i.active&&!i.soldOut?"good":""}`}/><div><strong>{i.name}</strong><small>{i.soldOut?"Sold out":i.active?"Available":"Hidden"}</small></div><b>{money(i.priceMinor)}</b></article>)}</section>):<div className="business-empty-state">Create your first section from the item form.</div>}</aside>
    </section>
  </main></div>;
}
