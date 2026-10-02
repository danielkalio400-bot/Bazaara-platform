"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@bazaara/api-client";
import type { BazaaraAddressContract, FoodCartContract } from "@bazaara/contracts";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { BAZID_BASE, foodApi, money, type FoodCartResponse, type FoodOrder } from "../lib/food-api";

type FoodPaymentMethod="BAZAARA_PAY"|"PAYSTACK_CARD"|"PAYSTACK_BANK";
const WALLET_WEB_BASE_URL = process.env.NEXT_PUBLIC_WALLET_BASE_URL ?? "http://localhost:3010";
type FoodPaymentCapabilities={currency:string;walletBalanceMinor:number;walletPinSet:boolean;walletPinLockedUntil:string|null;methods:Array<{key:FoodPaymentMethod;label:string;available:boolean;reason:string|null}>};
type AddressDraft={label:string;street:string;city:string;region:string;country:string;contactPhone:string;landmark:string;deliveryInstructions:string;latitude:number|null;longitude:number|null};
const EMPTY_ADDRESS:AddressDraft={label:"Home",street:"",city:"",region:"",country:"NG",contactPhone:"",landmark:"",deliveryInstructions:"",latitude:null,longitude:null};
function addressSnapshot(address:BazaaraAddressContract|AddressDraft){if("id" in address)return{addressId:address.id,label:address.label,street:address.street,city:address.city,region:address.region,country:address.country,contactPhone:address.contactPhone,landmark:address.landmark,deliveryInstructions:address.deliveryInstructions,latitude:address.latitude,longitude:address.longitude,placeIdentifier:address.placeIdentifier};return{...address};}
function addressSummary(address:BazaaraAddressContract){return[address.street,address.city,address.region].filter(Boolean).join(", ");}
function checkoutErrorMessage(error:unknown,fallback:string){
  if(error instanceof TypeError&&/failed to fetch/i.test(error.message))return "Bazaara connection was interrupted. The Platform API is being checked; retry this action in a moment.";
  return error instanceof Error?error.message:fallback;
}

export function FoodCheckoutClient({restaurantSlug}:{restaurantSlug:string}){
  const placingOrderRef=useRef(false);
  const[cart,setCart]=useState<FoodCartContract|null>(null);const[authenticated,setAuthenticated]=useState<boolean|null>(null);const[paymentCapabilities,setPaymentCapabilities]=useState<FoodPaymentCapabilities|null>(null);const[paymentMethod,setPaymentMethod]=useState<FoodPaymentMethod>("BAZAARA_PAY");const[walletPin,setWalletPin]=useState("");const[addresses,setAddresses]=useState<BazaaraAddressContract[]>([]);const[selectedAddressId,setSelectedAddressId]=useState("new");const[address,setAddress]=useState<AddressDraft>(EMPTY_ADDRESS);const[saveAddress,setSaveAddress]=useState(true);const[locationBusy,setLocationBusy]=useState(false);const[locationStatus,setLocationStatus]=useState("");const[note,setNote]=useState("");const[tipNaira,setTipNaira]=useState("");const[promo,setPromo]=useState("");const[gift,setGift]=useState(false);const[recipientName,setRecipientName]=useState("");const[recipientPhone,setRecipientPhone]=useState("");const[giftMessage,setGiftMessage]=useState("");const[busy,setBusy]=useState(false);const[preferenceBusy,setPreferenceBusy]=useState(false);const[error,setError]=useState("");
  useEffect(()=>{void(async()=>{try{const c=await foodApi.get<FoodCartResponse>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart`,{cache:"no-store"});setCart(c.cart);setNote(c.cart.note??"");setTipNaira(c.cart.tipMinor?String(c.cart.tipMinor/100):"");setPromo(c.cart.promoCode??"");setGift(c.cart.isGift);setRecipientName(c.cart.recipientName??"");setRecipientPhone(c.cart.recipientPhone??"");setGiftMessage(c.cart.giftMessage??"");try{await foodApi.get("/v1/bazid/me",{cache:"no-store"});setAuthenticated(true);try{const a=await foodApi.get<{addresses:BazaaraAddressContract[]}>("/v1/addresses",{cache:"no-store"});setAddresses(a.addresses);if(a.addresses[0])setSelectedAddressId(a.addresses[0].id);else setSelectedAddressId("new");}catch{setAddresses([]);setSelectedAddressId("new");setError("Saved addresses are temporarily unavailable. Enter a delivery address below; your basket is safe.");}}catch(e){if(e instanceof ApiError&&e.status===401)setAuthenticated(false);else throw e;}}catch(e){setError(checkoutErrorMessage(e,"Could not load checkout"));}})()},[restaurantSlug]);
  useEffect(()=>{if(authenticated!==true||!cart)return;void foodApi.get<FoodPaymentCapabilities>("/v1/food/payment-capabilities",{cache:"no-store"}).then(capabilities=>{setPaymentCapabilities(capabilities);const usable=(method:{key:FoodPaymentMethod;available:boolean})=>method.available&&(method.key!=="BAZAARA_PAY"||capabilities.walletBalanceMinor>=cart.totalMinor);const current=capabilities.methods.find(method=>method.key===paymentMethod);if(!current||!usable(current)){const next=capabilities.methods.find(usable);if(next)setPaymentMethod(next.key);}}).catch(cause=>setError(checkoutErrorMessage(cause,"Could not load payment methods")));},[authenticated,cart?.totalMinor]);
  const[groupBusy,setGroupBusy]=useState(false);
  const signInUrl=useMemo(()=>buildBazIdSignInUrl({bazIdBaseUrl:BAZID_BASE,returnTo:typeof window==="undefined"?`http://localhost:3007/checkout/${restaurantSlug}`:window.location.href}),[restaurantSlug]);
  const selectedSavedAddress=addresses.find(a=>a.id===selectedAddressId)??null;
  const selectedPayment=paymentCapabilities?.methods.find(method=>method.key===paymentMethod)??null;
  const paymentReady=Boolean(paymentCapabilities&&selectedPayment?.available&&(paymentMethod!=="BAZAARA_PAY"||(paymentCapabilities.walletBalanceMinor>=cart!.totalMinor&&paymentCapabilities.walletPinSet&&/^\d{6}$/.test(walletPin))));
  function captureCurrentLocation(){setError("");setLocationStatus("");if(typeof navigator==="undefined"||!navigator.geolocation){setError("Current-location capture is not supported by this browser.");return}setLocationBusy(true);navigator.geolocation.getCurrentPosition((position)=>{setAddress(current=>({...current,latitude:position.coords.latitude,longitude:position.coords.longitude}));setLocationStatus(`Pin captured · ${position.coords.accuracy?`about ${Math.round(position.coords.accuracy)} m accuracy`:"device location"}`);setLocationBusy(false)},(cause)=>{setError(cause.message||"Could not capture your current location.");setLocationBusy(false)},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});}
  async function savePreferences(){if(!cart)return;setPreferenceBusy(true);setError("");try{const r=await foodApi.patch<FoodCartResponse>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart/preferences`,{note:note.trim()||null,tipMinor:tipNaira?Math.max(0,Math.round(Number(tipNaira)*100)):0,promoCode:promo.trim().toUpperCase()||null,isGift:gift,recipientName:gift?recipientName.trim()||null:null,recipientPhone:gift?recipientPhone.trim()||null:null,giftMessage:gift?giftMessage.trim()||null:null});setCart(r.cart);setPromo(r.cart.promoCode??"");}catch(e){setError(checkoutErrorMessage(e,"Could not update checkout preferences"));}finally{setPreferenceBusy(false)}}
  async function continueAsPersonalOrder(){
    if(!cart?.groupOrderId||groupBusy)return;
    setGroupBusy(true);
    setError("");
    try{
      const result=await foodApi.delete<FoodCartResponse>(
        `/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/group-order`
      );
      setCart(result.cart);
      setError("");
    }catch(e){
      setError(e instanceof Error?e.message:"Could not leave the group order");
    }finally{
      setGroupBusy(false);
    }
  }
  function orderAttemptStorageKey(cartId:string){return `bazaara.food.place-order-key.${cartId}`;}
  function stableOrderIdempotencyKey(cartId:string){
    const storageKey=orderAttemptStorageKey(cartId);
    if(typeof window!=="undefined"){
      const existing=sessionStorage.getItem(storageKey);
      if(existing)return existing;
      const created=`food-${crypto.randomUUID()}`;
      sessionStorage.setItem(storageKey,created);
      return created;
    }
    return `food-${crypto.randomUUID()}`;
  }
  function clearOrderIdempotencyKey(cartId:string){
    if(typeof window!=="undefined")sessionStorage.removeItem(orderAttemptStorageKey(cartId));
  }

  async function recoverRecentlyPlacedOrder(cartId:string){
    try{
      const history=await foodApi.get<{orders:FoodOrder[]}>("/v1/food/orders",{cache:"no-store"});
      const recent=history.orders.find(order=>
        order.restaurant.slug===restaurantSlug &&
        order.status!=="CANCELLED" &&
        Date.now()-new Date(order.placedAt).getTime()<10*60*1000
      );
      if(!recent)return false;
      clearOrderIdempotencyKey(cartId);
      window.location.href=`/orders/${recent.id}?placed=1&recovered=1`;
      return true;
    }catch{
      return false;
    }
  }

  async function placeOrder(){
    if(!cart||placingOrderRef.current)return;
    placingOrderRef.current=true;
    setBusy(true);
    setError("");
    const cartId=cart.id??`restaurant:${restaurantSlug}`;
    try{
      let deliveryAddress:Record<string,unknown>|null=null;
      if(cart.fulfillmentType==="DELIVERY"){
        if(selectedSavedAddress){
          if(!selectedSavedAddress.street||!selectedSavedAddress.city||!selectedSavedAddress.contactPhone)throw new Error("The selected address is missing a street, city or phone number.");
          deliveryAddress=addressSnapshot(selectedSavedAddress);
        }else{
          if(!address.street.trim()||!address.city.trim()||!address.contactPhone.trim())throw new Error("Enter your delivery address and phone number.");
          deliveryAddress=addressSnapshot(address);
        }
      }

      const pref=await foodApi.patch<FoodCartResponse>(
        `/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart/preferences`,
        {
          deliveryAddress,
          note:note.trim()||null,
          tipMinor:tipNaira?Math.max(0,Math.round(Number(tipNaira)*100)):0,
          promoCode:promo.trim().toUpperCase()||null,
          isGift:gift,
          recipientName:gift?recipientName.trim()||null:null,
          recipientPhone:gift?recipientPhone.trim()||null:null,
          giftMessage:gift?giftMessage.trim()||null:null
        }
      );
      setCart(pref.cart);

      if(gift&&(!recipientName.trim()||!recipientPhone.trim()))throw new Error("Add the recipient name and phone number for a gift order.");

      const response=await foodApi.post<{order:FoodOrder}>(
        `/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/orders`,
        {paymentMethod,walletPin:paymentMethod==="BAZAARA_PAY"?walletPin:undefined},
        {idempotencyKey:stableOrderIdempotencyKey(cartId)}
      );

      clearOrderIdempotencyKey(cartId);
      setWalletPin("");

      if(response.order.deliveryPin)sessionStorage.setItem(`bazaara.food.deliveryPin.${response.order.id}`,response.order.deliveryPin);

      if(paymentMethod==="PAYSTACK_CARD"||paymentMethod==="PAYSTACK_BANK"){
        try{
          const payment=await foodApi.post<{alreadyPaid:boolean;checkoutUrl:string|null;paymentStatus:string}>(
            `/v1/food/orders/${encodeURIComponent(response.order.id)}/payment/initialize`,
            {},
            {idempotencyKey:`food-payment-${crypto.randomUUID()}`}
          );
          if(payment.checkoutUrl){
            window.location.href=payment.checkoutUrl;
            return;
          }
        }catch(paymentError){
          window.location.href=`/orders/${response.order.id}?payment=retry`;
          return;
        }
      }

      if(cart.fulfillmentType==="DELIVERY"&&!selectedSavedAddress&&saveAddress){
        try{
          await foodApi.post("/v1/addresses",{
            label:address.label.trim()||"Home",
            country:address.country,
            region:address.region.trim()||null,
            city:address.city.trim(),
            street:address.street.trim(),
            landmark:address.landmark.trim()||null,
            deliveryInstructions:address.deliveryInstructions.trim()||null,
            contactPhone:address.contactPhone.trim(),
            latitude:address.latitude,
            longitude:address.longitude,
            isApproximate:false
          });
        }catch{}
      }

      window.location.href=`/orders/${response.order.id}?placed=1`;
    }catch(e){
      if(e instanceof ApiError&&e.status===401){
        setAuthenticated(false);
        return;
      }

      if(e instanceof ApiError&&(e.status===403||e.status===423)&&paymentMethod==="BAZAARA_PAY"){
        setWalletPin("");
        setError(e.message||"Wallet PIN verification failed.");
        return;
      }

      if(e instanceof ApiError&&e.status===409){
        const message=e.message||"This order cannot be placed in its current state.";

        // If an earlier click created the order but the browser lost the
        // response, the converted cart now appears empty. Recover that recent
        // canonical order rather than creating a duplicate.
        if(/cart is empty|already processed|idempotency|already placed/i.test(message)){
          if(await recoverRecentlyPlacedOrder(cartId))return;
        }

        try{
          const refreshed=await foodApi.get<FoodCartResponse>(
            `/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart`,
            {cache:"no-store"}
          );
          setCart(refreshed.cart);
        }catch{}

        setError(message);
        return;
      }

      setError(e instanceof Error?e.message:"Could not place your order");
    }finally{
      if(paymentMethod==="BAZAARA_PAY")setWalletPin("");
      placingOrderRef.current=false;
      setBusy(false);
    }
  }
  if(!cart)return <div className="food-loading">{error||"Loading checkout…"}</div>;if(authenticated===false)return <section className="checkout-auth-card"><span>BAZID REQUIRED AT CHECKOUT</span><h1>Sign in to place your Food order</h1><p>Your basket stays intact while you sign in.</p><a className="food-primary" href={signInUrl}>Continue with BazID</a><Link href={`/cart/${restaurantSlug}`}>Back to basket</Link></section>;
  return <div className="checkout-layout"><section className="checkout-main"><div className="checkout-title"><span>CHECKOUT</span><h1>{cart.restaurant.name}</h1><p>{cart.fulfillmentType==="DELIVERY"?"Delivery":"Pickup"}{cart.scheduledFor?` · ${new Date(cart.scheduledFor).toLocaleString()}`:" · ASAP"}</p></div>
    {cart.fulfillmentType==="DELIVERY"?<section className="checkout-card"><h2>Delivery address</h2>{addresses.length?<div className="saved-addresses">{addresses.map(a=><label key={a.id} className={selectedAddressId===a.id?"saved-address active":"saved-address"}><input type="radio" name="address" checked={selectedAddressId===a.id} onChange={()=>setSelectedAddressId(a.id)}/><span><b>{a.label||"Saved address"}</b><small>{addressSummary(a)}</small><small>{a.contactPhone||"No phone saved"}</small></span></label>)}<label className={selectedAddressId==="new"?"saved-address active":"saved-address"}><input type="radio" name="address" checked={selectedAddressId==="new"} onChange={()=>setSelectedAddressId("new")}/><span><b>Use a new address</b><small>Enter another delivery location</small></span></label></div>:null}{selectedAddressId==="new"?<><div className="address-grid"><label>Label<input autoComplete="address-level3" value={address.label} onChange={e=>setAddress({...address,label:e.target.value})}/></label><label>Street address<input autoComplete="street-address" value={address.street} onChange={e=>setAddress({...address,street:e.target.value})}/></label><label>City<input autoComplete="address-level2" value={address.city} onChange={e=>setAddress({...address,city:e.target.value})}/></label><label>State / region<input autoComplete="address-level1" value={address.region} onChange={e=>setAddress({...address,region:e.target.value})}/></label><label>Phone<input inputMode="tel" autoComplete="tel" value={address.contactPhone} onChange={e=>setAddress({...address,contactPhone:e.target.value})}/></label><label>Landmark<input value={address.landmark} onChange={e=>setAddress({...address,landmark:e.target.value})}/></label></div><div className="checkout-location-row"><button type="button" className="food-secondary" disabled={locationBusy} onClick={captureCurrentLocation}>{locationBusy?"Capturing pin…":address.latitude!=null&&address.longitude!=null?"Update delivery pin":"Use my current delivery pin"}</button><span>{locationStatus|| (address.latitude!=null&&address.longitude!=null?"A precise handoff pin will be shared with the assigned GO courier.":"Add a location pin for smarter dispatch and a more accurate handoff.")}</span></div><label className="food-note-label">Delivery instructions<textarea value={address.deliveryInstructions} onChange={e=>setAddress({...address,deliveryInstructions:e.target.value})} maxLength={500}/></label><label className="checkout-checkbox"><input type="checkbox" checked={saveAddress} onChange={e=>setSaveAddress(e.target.checked)}/> Save this address to BazID</label></>:null}</section>:<section className="checkout-card"><h2>Pickup</h2><p>Collect from {cart.restaurant.name}. No delivery fee applies.</p></section>}
    <section className="checkout-card"><h2>Preferences & tip</h2><label className="food-note-label">Restaurant note<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="Preparation or handoff notes…"/></label><div className="checkout-mini-grid"><label>Tip (₦)<input type="number" min="0" step="100" inputMode="decimal" value={tipNaira} onChange={e=>setTipNaira(e.target.value)} placeholder="0"/></label><label>Promo code<input value={promo} onChange={e=>setPromo(e.target.value.toUpperCase())} maxLength={40} placeholder="Optional"/></label></div><button type="button" className="food-secondary" disabled={preferenceBusy} onClick={()=>void savePreferences()}>{preferenceBusy?"Applying…":"Apply tip / promo"}</button>{cart.discountMinor?<p className="checkout-success">Promotion applied: −{money(cart.discountMinor)}</p>:null}</section>
    <section className="checkout-card"><label className="gift-toggle"><input type="checkbox" checked={gift} onChange={e=>setGift(e.target.checked)}/><span><b>Send this as a gift</b><small>Add recipient details and a message. The restaurant still sees only what it needs to fulfil the order.</small></span></label>{gift?<div className="address-grid"><label>Recipient name<input autoComplete="name" value={recipientName} onChange={e=>setRecipientName(e.target.value)}/></label><label>Recipient phone<input inputMode="tel" autoComplete="tel" value={recipientPhone} onChange={e=>setRecipientPhone(e.target.value)}/></label><label className="wide">Gift message<textarea value={giftMessage} onChange={e=>setGiftMessage(e.target.value)} maxLength={300}/></label></div>:null}</section>
    {cart.groupOrderId?<section className="checkout-card"><span>GROUP ORDER ACTIVE</span><h2>This basket is linked to a group order</h2><p>The combined group total and host spending cap apply at checkout. If you meant to order only your own basket, switch back to a personal order. Your items stay in the basket.</p><button type="button" className="food-secondary" disabled={groupBusy||busy} onClick={()=>void continueAsPersonalOrder()}>{groupBusy?"Switchingâ€¦":"Continue as personal order"}</button></section>:null}
    <section className="checkout-card"><div className="checkout-section-head"><div><span>SECURE CHECKOUT</span><h2>Payment</h2></div><small>No cash at handoff</small></div><div className="food-payment-grid">{paymentCapabilities?.methods.map(method=>{const enoughWallet=method.key!=="BAZAARA_PAY"||paymentCapabilities.walletBalanceMinor>=cart.totalMinor;const available=method.available&&enoughWallet;const copy=method.key==="BAZAARA_PAY"?`Wallet balance ${money(paymentCapabilities.walletBalanceMinor,paymentCapabilities.currency)}`:method.key==="PAYSTACK_CARD"?"Visa, Mastercard and supported cards":"Secure bank / transfer checkout";return <button key={method.key} type="button" className={`food-payment-option ${paymentMethod===method.key?"active":""}`} disabled={!available||busy} onClick={()=>setPaymentMethod(method.key)}><span className="food-payment-icon">{method.key==="BAZAARA_PAY"?"BZ":method.key==="PAYSTACK_CARD"?"▣":"↔"}</span><span><b>{method.label}</b><small>{available?copy:method.key==="BAZAARA_PAY"?"Insufficient Wallet balance":method.reason||"Unavailable"}</small></span><i>{paymentMethod===method.key?"✓":""}</i></button>})??<p className="checkout-muted">Loading secure payment methods…</p>}</div>{paymentMethod==="BAZAARA_PAY"?<div className="wallet-pin-confirmation"><div className="wallet-pin-copy"><span>WALLET SECURITY</span><b>Enter your 6-digit Wallet PIN</b><small>{paymentCapabilities?.walletPinSet?paymentCapabilities.walletPinLockedUntil?`PIN locked until ${new Date(paymentCapabilities.walletPinLockedUntil).toLocaleTimeString()}`:"Required before the order can be confirmed.":"Set a Wallet PIN before paying for Food orders."}</small></div>{paymentCapabilities?.walletPinSet?<input aria-label="Wallet PIN" autoComplete="off" inputMode="numeric" maxLength={6} type="password" value={walletPin} onChange={e=>setWalletPin(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="••••••" disabled={busy||Boolean(paymentCapabilities.walletPinLockedUntil&&new Date(paymentCapabilities.walletPinLockedUntil)>new Date())}/>:<a className="food-secondary wallet-pin-link" href={WALLET_WEB_BASE_URL}>Open Wallet to set PIN</a>}</div>:null}<p className="checkout-payment-note">The restaurant cannot accept an unpaid Food order. Card and transfer payments are provider-confirmed; Wallet is ledger-backed and requires your PIN.</p></section>{error?<p className="food-error" role="alert">{error}</p>:null}</section>
    <aside className="cart-summary"><h2>Final review</h2>{cart.items.map(i=><div className="checkout-item" key={i.id}><span>{i.quantity}× {i.name}</span><b>{money(i.lineTotalMinor)}</b></div>)}<div><span>Subtotal</span><b>{money(cart.subtotalMinor)}</b></div><div><span>Delivery</span><b>{cart.deliveryFeeMinor?money(cart.deliveryFeeMinor):"Free"}</b></div><div><span>Service fee</span><b>{money(cart.serviceFeeMinor)}</b></div>{cart.tipMinor?<div><span>Tip</span><b>{money(cart.tipMinor)}</b></div>:null}{cart.discountMinor?<div className="discount-row"><span>Discount</span><b>−{money(cart.discountMinor)}</b></div>:null}<div className="cart-total"><span>Total</span><strong>{money(cart.totalMinor)}</strong></div><button className="food-primary checkout-link" onClick={()=>void placeOrder()} disabled={busy||authenticated===null||!paymentReady}>{busy?"Securing order…":authenticated===null?"Checking BazID…":paymentMethod==="BAZAARA_PAY"?"Pay & place order":"Continue to secure payment"}</button><Link href={`/cart/${restaurantSlug}`}>Edit basket</Link></aside></div>;
}
