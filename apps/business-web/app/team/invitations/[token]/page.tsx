"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { businessRequest } from "../../../lib/business";
export default function AcceptBusinessInvite(){
 const params=useParams<{token:string}>();const [state,setState]=useState("");const [busy,setBusy]=useState(false);
 async function accept(){setBusy(true);try{await businessRequest(`/v1/business/advanced/invitations/${encodeURIComponent(params.token)}/accept`,"POST",{});setState("Invitation accepted. Redirecting to Business…");setTimeout(()=>location.assign("/"),500)}catch(e){setState(e instanceof Error?e.message:"Could not accept invitation")}finally{setBusy(false)}}
 return <main className="business-control-main"><section className="business-auth-card"><span className="business-kicker">BUSINESS INVITATION</span><h1>Join this Business organization.</h1><p>Sign in with the BazID email that received this invitation, then accept.</p>{state?<div className="business-notice">{state}</div>:null}<button className="business-primary-button" disabled={busy} onClick={()=>void accept()}>{busy?"Accepting…":"Accept invitation"}</button></section></main>
}