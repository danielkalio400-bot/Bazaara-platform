"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

type BusinessPay={linked:boolean;wallet:null|{id:string;status:string;currency:string};availableMinor:number;currency:string;activity:Array<{id:string;direction:"IN"|"OUT";amountMinor:number;reference:string;kind:string;description:string|null;createdAt:string}>};
type Settlement={id:string;reference:string;currency:string;grossMinor:number;feeMinor:number;netMinor:number;status:string;provider:string|null;providerRef:string|null;createdAt:string};
type Invoice={id:string;invoiceNumber:string;customerName:string;customerEmail:string|null;currency:string;totalMinor:number;status:string};

function money(n:number,c="NGN"){return new Intl.NumberFormat("en-NG",{style:"currency",currency:c,maximumFractionDigits:0}).format(n/100)}

export default function BusinessFinance(){
  const b=useBusinessOrganizations();
  const [pay,setPay]=useState<BusinessPay|null>(null);
  const [settlements,setSettlements]=useState<Settlement[]>([]);
  const [invoices,setInvoices]=useState<Invoice[]>([]);
  const [notice,setNotice]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState("");
  const [amount,setAmount]=useState(""); const [pin,setPin]=useState("");
  const [invoice,setInvoice]=useState({customerName:"",customerEmail:"",description:"",amount:"",tax:"0"});

  const load=useCallback(async()=>{
    if(!b.organizationId)return;
    try{
      const [p,s,i]=await Promise.all([
        businessRequest<BusinessPay>(`/v1/business/organizations/${b.organizationId}/pay`),
        businessRequest<{settlements:Settlement[]}>(`/v1/business/organizations/${b.organizationId}/settlements`),
        businessRequest<{invoices:Invoice[]}>(`/v1/business/organizations/${b.organizationId}/invoices`)
      ]);
      setPay(p);setSettlements(s.settlements);setInvoices(i.invoices);setError("");
    }catch(e){setError(e instanceof Error?e.message:"Could not load Business Finance")}
  },[b.organizationId]);
  useEffect(()=>{void load()},[load]);

  const totals=useMemo(()=>({
    settled:settlements.filter(x=>x.status==="SETTLED").reduce((s,x)=>s+x.netMinor,0),
    pending:settlements.filter(x=>x.status!=="SETTLED").reduce((s,x)=>s+x.netMinor,0),
    fees:settlements.reduce((s,x)=>s+x.feeMinor,0),
    invoices:invoices.filter(x=>!["PAID","VOID"].includes(x.status)).reduce((s,x)=>s+x.totalMinor,0),
  }),[settlements,invoices]);

  async function link(){if(!b.organizationId)return;if(pay?.linked){setNotice("✓ Business Pay is already connected.");return;}setBusy("link");try{const result=await businessRequest<BusinessPay & {actionState?:"COMPLETED"|"ALREADY_DONE"}>(`/v1/business/organizations/${b.organizationId}/pay/link`,"POST",{});setPay(result);setNotice(result.actionState==="ALREADY_DONE"?"✓ Business Pay was already connected on the server.":"Business Pay connected. Operations can now settle approved payouts into this wallet.")}catch(e){setError(e instanceof Error?e.message:"Could not link Pay")}finally{setBusy("")}}
  async function payout(e:FormEvent){e.preventDefault();if(!b.organizationId)return;setBusy("payout");try{const m=Math.round(Number(amount)*100);if(!Number.isFinite(m)||m<10000)throw new Error("Minimum payout is ₦100.");await businessRequest(`/v1/business/organizations/${b.organizationId}/pay/payout-to-personal`,"POST",{amountMinor:m,pin});setAmount("");setPin("");setNotice("Funds moved to your personal Wallet wallet. Bank withdrawal remains inside Pay.");await load()}catch(err){setError(err instanceof Error?err.message:"Payout failed")}finally{setBusy("")}}
  async function createInvoice(e:FormEvent){e.preventDefault();if(!b.organizationId)return;setBusy("invoice");try{await businessRequest(`/v1/business/organizations/${b.organizationId}/invoices`,"POST",{customerName:invoice.customerName,customerEmail:invoice.customerEmail||undefined,currency:"NGN",lines:[{description:invoice.description,quantity:1,unitPriceMinor:Math.round(Number(invoice.amount)*100)}],taxMinor:Math.round(Number(invoice.tax||0)*100)});setInvoice({customerName:"",customerEmail:"",description:"",amount:"",tax:"0"});setNotice("Invoice created.");await load()}catch(err){setError(err instanceof Error?err.message:"Could not create invoice")}finally{setBusy("")}}

  return <div className="business-control-shell">
    <BusinessHeader organization={b.organization} organizations={b.organizations} organizationId={b.organizationId} setOrganizationId={b.setOrganizationId} active="finance"/>
    <main className="business-control-main">
      <section className="business-page-heading"><span className="business-kicker">FINANCE + WALLET</span><h1>Your business money has one home.</h1><p>Approved settlements can land in an organization-owned Business Pay wallet. Personal Pay stays separate until an authorized owner/admin withdraws.</p></section>
      {error||b.error?<div className="business-alert">{error||b.error}</div>:null}{notice?<div className="business-notice">{notice}</div>:null}
      <section className="business-finance-wallet"><div><span className="business-kicker">BUSINESS PAY BALANCE</span><strong>{pay?.linked?money(pay.availableMinor,pay.currency):"Not connected"}</strong><p>{pay?.linked?`Dedicated wallet · ${pay.wallet?.status??""}`:"Connect a dedicated wallet for settlements and merchant payouts."}</p></div><div>{!pay?.linked?<button className="business-primary-button" disabled={busy==="link"} onClick={()=>void link()}>{busy==="link"?"Connecting…":"Connect Wallet"}</button>:<a className="business-primary-button" href="http://localhost:3010">Open Wallet</a>}</div></section>
      <section className="business-control-kpis"><article><span>BUSINESS PAY</span><strong>{money(pay?.availableMinor??0)}</strong><small>organization wallet</small></article><article><span>SETTLED NET</span><strong>{money(totals.settled)}</strong><small>completed settlements</small></article><article><span>PENDING NET</span><strong>{money(totals.pending)}</strong><small>awaiting Operations settlement</small></article><article><span>FEES</span><strong>{money(totals.fees)}</strong><small>recorded settlement fees</small></article></section>
      <div className="business-finance-grid">
        <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">WITHDRAW</span><h2>Move to my personal Pay</h2></div><span className="business-soft-pill">PAY PIN</span></div><form className="business-form" onSubmit={payout}><label>Amount (NGN)<input disabled={!pay?.linked} inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>6-digit Pay PIN<input disabled={!pay?.linked} type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,6))}/></label><button className="business-primary-button" disabled={!pay?.linked||pin.length!==6||busy==="payout"}>{busy==="payout"?"Moving…":"Move to my Wallet"}</button></form><p className="business-finance-help">Business money never silently becomes personal money. Bank withdrawal happens from your personal Pay account through a verified provider-backed bank account.</p></section>
        <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">SETTLEMENTS</span><h2>Payout ledger</h2></div><span className="business-soft-pill">{settlements.length}</span></div><div className="business-ledger-list">{settlements.length?settlements.slice(0,12).map(x=><article key={x.id}><div><strong>{x.reference}</strong><small>{x.status} · {x.provider??"Pending"}</small></div><div><span>{money(x.feeMinor,x.currency)} fees</span><strong>{money(x.netMinor,x.currency)}</strong></div></article>):<div className="business-empty-state">No settlement records yet.</div>}</div></section>
      </div>
      <div className="business-finance-grid">
        <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">PAY ACTIVITY</span><h2>Business wallet ledger</h2></div></div><div className="business-ledger-list">{pay?.activity.length?pay.activity.map(x=><article key={x.id}><div><strong>{x.description??x.kind}</strong><small>{x.reference} · {new Date(x.createdAt).toLocaleString("en-NG")}</small></div><div><span>{x.direction}</span><strong>{x.direction==="IN"?"+":"-"}{money(x.amountMinor)}</strong></div></article>):<div className="business-empty-state">No Business Pay activity yet.</div>}</div></section>
        <section className="business-panel"><span className="business-kicker">INVOICE</span><h2>Bill a customer or business.</h2><form className="business-form" onSubmit={createInvoice}><label>Customer<input required value={invoice.customerName} onChange={e=>setInvoice({...invoice,customerName:e.target.value})}/></label><label>Email<input type="email" value={invoice.customerEmail} onChange={e=>setInvoice({...invoice,customerEmail:e.target.value})}/></label><label className="wide">Description<input required value={invoice.description} onChange={e=>setInvoice({...invoice,description:e.target.value})}/></label><label>Amount<input required inputMode="decimal" value={invoice.amount} onChange={e=>setInvoice({...invoice,amount:e.target.value})}/></label><label>Tax / adjustment<input inputMode="decimal" value={invoice.tax} onChange={e=>setInvoice({...invoice,tax:e.target.value})}/></label><button className="business-primary-button" disabled={busy==="invoice"}>{busy==="invoice"?"Creating…":"Create invoice"}</button></form><p className="business-finance-help">{money(totals.invoices)} outstanding across {invoices.length} invoices.</p></section>
      </div>
    </main>
  </div>;
}
