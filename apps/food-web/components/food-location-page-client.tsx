"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {FoodLocationControl} from "./food-location-control";
import {readFoodDiscoveryLocation,saveFoodDiscoveryLocation,subscribeFoodDiscoveryLocation,type FoodDiscoveryLocation} from "./food-location";

export function FoodLocationPageClient(){
  const[location,setLocation]=useState<FoodDiscoveryLocation|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  useEffect(()=>{setLocation(readFoodDiscoveryLocation());return subscribeFoodDiscoveryLocation(setLocation)},[]);
  function useCurrent(){setError("");if(!navigator.geolocation){setError("Location is unavailable in this browser.");return}setBusy(true);navigator.geolocation.getCurrentPosition(position=>{const next:FoodDiscoveryLocation={latitude:Number(position.coords.latitude.toFixed(7)),longitude:Number(position.coords.longitude.toFixed(7)),label:"Current location",detail:`Live device pin · ~${Math.max(1,Math.round(position.coords.accuracy))} m accuracy`,source:"device",updatedAt:new Date().toISOString()};saveFoodDiscoveryLocation(next);setLocation(next);setBusy(false)},cause=>{setError(cause.code===1?"Allow location access to use nearby restaurant discovery.":cause.message||"Could not get your location.");setBusy(false)},{enableHighAccuracy:true,maximumAge:10000,timeout:12000})}
  return <div className="food-location-page-v7">
    <section className="food-location-page-map"><Link className="food-location-page-close" href="/" aria-label="Close location map">×</Link><div className="food-location-map-grid"/><div className="food-location-road road-a"/><div className="food-location-road road-b"/><div className="food-location-road road-c"/><div className="food-location-page-pin">⌖</div><div className="food-location-page-callout"><small>DELIVER TO</small><b>{location?.label||"Choose your delivery point"}</b><span>{location?.detail||"Your location controls restaurant availability"}</span></div><div className="food-map-watermark food-map-watermark-large"><b>BAZAARA</b><span>MAPS · PREVIEW</span></div></section>
    <section className="food-location-page-panel"><div><span>SMART DELIVERY AREA</span><h1>Where should we deliver?</h1><p>Choose a precise pin before browsing. Food uses it to calculate nearby restaurant serviceability and distance.</p></div><div className="food-location-page-actions"><button className="food-primary" type="button" disabled={busy} onClick={useCurrent}>{busy?"Finding your location…":"Use current location"}</button><FoodLocationControl/><Link className="food-secondary" href="/">Done</Link></div>{location?<div className="food-location-coordinate-card"><div><small>LATITUDE</small><b>{location.latitude.toFixed(5)}</b></div><div><small>LONGITUDE</small><b>{location.longitude.toFixed(5)}</b></div><div><small>SOURCE</small><b>{location.source==="device"?"Live device":"Saved place"}</b></div></div>:null}{error?<p className="food-location-sheet-error">{error}</p>:null}</section>
  </div>
}
