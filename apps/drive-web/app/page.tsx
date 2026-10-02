"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, createApiClient } from "@bazaara/api-client";
import DriveAccountHub from "./components/DriveAccountHub";
import type { DrivePricingQuoteContract, DriveRideClass, DriveRideRequestResponseContract } from "@bazaara/contracts";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const BAZID = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
const PAY = process.env.NEXT_PUBLIC_PAY_WEB_BASE_URL ?? "http://localhost:3010";
const api = createApiClient({ baseUrl: API, credentials: "include" });

type WalletContext = {
  wallet: { availableMinor: number; currency: string; status: string };
  heldFareMinor: number;
  activeRideCount: number;
  completedRideCount: number;
  completedSpendMinor: number;
  recentActivity: Array<{ id: string; reference: string; kind: string; direction: "IN" | "OUT"; amountMinor: number; currency: string; description: string | null; createdAt: string }>;
  recentRides: Array<{ id: string; status: string; rideClass: string; totalMinor: number; currency: string; createdAt: string }>;
  driver: null | {
    approvalStatus: string;
    earningsBalanceMinor: number;
    platformDebtMinor: number;
    payoutAvailableMinor: number;
    payWalletBalanceMinor: number;
    driveLedgerBalanceMinor: number;
    reconciled: boolean;
  };
};

type RideDetail = {
  ride: { id: string; status: string; fareFundingStatus: string; driverUserId: string | null };
  pricing: DrivePricingQuoteContract;
  driver: null | { displayName: string; ratingAverage: number | null; ratingCount: number; vehicle: null | { make: string; model: string; color: string; plateNumber: string; rideClass: string; capacity: number } };
  events: Array<{ type: string; createdAt: string }>;
};

type Geo = { label: string; latitude: number; longitude: number };

const classes: Array<{ id: DriveRideClass; name: string; meta: string; code: string }> = [
  { id: "GO", name: "Drive Go", meta: "Everyday Â· up to 4", code: "GO" },
  { id: "COMFORT", name: "Comfort", meta: "Newer cars Â· more space", code: "CF" },
  { id: "XL", name: "Drive XL", meta: "Groups Â· extra capacity", code: "XL" },
];

function money(value = 0, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);
}

function pretty(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^./, (char) => char.toUpperCase());
}

function signIn() {
  window.location.href = `${BAZID.replace(/\/$/, "")}/bazid/sign-in?returnTo=${encodeURIComponent(window.location.href)}`;
}

export default function DriveHome() {
  const [view, setView] = useState<"home" | "activity" | "account">("home");
  const [bookingStep, setBookingStep] = useState<"home" | "destination" | "rides">("home");
  const [from, setFrom] = useState("Port Harcourt city centre Â· approximate area");
  const [to, setTo] = useState("");
  const [destinationChosen, setDestinationChosen] = useState(false);
  const [pickupCoords, setPickupCoords] = useState({ latitude: 4.8156, longitude: 7.0498 });
  const [dropoffCoords, setDropoffCoords] = useState({ latitude: 4.8246, longitude: 7.0069 });
  const [routeDirty, setRouteDirty] = useState(false);
  const [bookingMode, setBookingMode] = useState<"now" | "later">("now");
  const [showPinEditor, setShowPinEditor] = useState(false);
  const [fuelPolicy, setFuelPolicy] = useState<null | {status:string;source:string|null;evidenceUrl:string|null;effectiveFrom:string|null;weightBps:number;maxAdjustmentBps:number;maxAgeDays:number}>(null);
  const [rideClass, setRideClass] = useState<DriveRideClass>("GO");
  const [distanceKm, setDistanceKm] = useState("6.5");
  const [durationMin, setDurationMin] = useState("20");
  const [scheduledFor, setScheduledFor] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [quote, setQuote] = useState<DrivePricingQuoteContract | null>(null);
  const [ride, setRide] = useState<DriveRideRequestResponseContract | null>(null);
  const [activeRide, setActiveRide] = useState<RideDetail | null>(null);
  const [wallet, setWallet] = useState<WalletContext | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportRideId, setSupportRideId] = useState("");
  const [supportSubject, setSupportSubject] = useState("Drive trip support");
  const [supportDescription, setSupportDescription] = useState("");

  const pickup: Geo = useMemo(() => ({ label: from, ...pickupCoords }), [from, pickupCoords]);
  const dropoff: Geo = useMemo(() => ({ label: to, ...dropoffCoords }), [to, dropoffCoords]);

  const refreshWallet = useCallback(async () => {
    try {
      const context = await api.get<WalletContext>("/v1/drive/wallet");
      setWallet(context);
      setSignedOut(false);
      const active = context.recentRides.find((item) => !["COMPLETED", "CANCELLED"].includes(item.status));
      if (active) {
        api.get<RideDetail>(`/v1/drive/rides/${active.id}`).then(setActiveRide).catch(() => undefined);
      } else {
        setActiveRide(null);
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setSignedOut(true);
        setWallet(null);
        return;
      }
      setError(cause instanceof Error ? cause.message : "Could not load Drive wallet");
    }
  }, []);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    api.get<{status:string;source:string|null;evidenceUrl:string|null;effectiveFrom:string|null;weightBps:number;maxAdjustmentBps:number;maxAgeDays:number}>("/v1/drive/fuel-policy")
      .then(setFuelPolicy).catch(() => setFuelPolicy(null));
  }, []);

  function chooseDestination(label:string,latitude:number,longitude:number){
    setTo(label);
    setDropoffCoords({latitude,longitude});
    setDestinationChosen(true);
    setBookingStep("rides");
    setRouteDirty(false);
    setShowPinEditor(false);
    setQuote(null);
    setError("");
  }

  // This is a clearly labelled PILOT estimate, not a live road-routing response.
  // Recompute it automatically after a destination is selected or a GPS pin moves.
  useEffect(() => {
    if (!destinationChosen) return;
    const rad = Math.PI / 180;
    const lat = (dropoffCoords.latitude - pickupCoords.latitude) * rad;
    const lon = (dropoffCoords.longitude - pickupCoords.longitude) * rad;
    const arc = Math.sin(lat / 2) ** 2 + Math.cos(pickupCoords.latitude * rad) * Math.cos(dropoffCoords.latitude * rad) * Math.sin(lon / 2) ** 2;
    const km = Math.max(0.2, Math.round(12742 * Math.asin(Math.sqrt(Math.min(1, arc))) * 1.4 * 10) / 10);
    setDistanceKm(km.toFixed(1));
    setDurationMin(String(Math.max(3, Math.round(km / 23 * 60))));
    setQuote(null);
  }, [destinationChosen, pickupCoords, dropoffCoords]);
  function estimateFromPins(){
    const a=Math.PI/180;
    const dlat=(dropoffCoords.latitude-pickupCoords.latitude)*a;
    const dlon=(dropoffCoords.longitude-pickupCoords.longitude)*a;
    const x=Math.sin(dlat/2)**2+Math.cos(pickupCoords.latitude*a)*Math.cos(dropoffCoords.latitude*a)*Math.sin(dlon/2)**2;
    const straightKm=12742*Math.asin(Math.sqrt(Math.min(1,x)));
    const indicativeKm=Math.max(0.2,Math.round(straightKm*1.4*10)/10);
    setDistanceKm(indicativeKm.toFixed(1));setDurationMin(String(Math.max(3,Math.round(indicativeKm/23*60))));setQuote(null);
    setNotice("Indicative distance estimated from selected pins. Adjust using your real mapped road route; this is not turn-by-turn routing.");
  }

  function shareTrip(){
    if(!activeRideId)return;
    const text=`BAZAARA Drive trip ${activeRideId} Â· ${rideStatus??"active"} Â· ${activeRide?.driver?.vehicle?.plateNumber??"driver being assigned"}. This reference does not share live GPS location.`;
    if(navigator.share){void navigator.share({title:"My BAZAARA Drive trip",text}).catch(()=>undefined);return;}
    if(navigator.clipboard){void navigator.clipboard.writeText(text).then(()=>setNotice("Trip reference copied; live-location sharing requires a mapping provider.")).catch(()=>setError("Could not copy trip reference."));}
    else setNotice(text);
  }

  const activeRideId = ride?.ride.id ?? activeRide?.ride.id ?? wallet?.recentRides.find((item) => !["COMPLETED", "CANCELLED"].includes(item.status))?.id ?? null;

  useEffect(() => {
    if (!activeRideId) return;
    let stopped = false;
    const poll = async () => {
      try {
        const detail = await api.get<RideDetail>(`/v1/drive/rides/${activeRideId}`);
        if (stopped) return;
        setActiveRide(detail);
        if (["COMPLETED", "CANCELLED"].includes(detail.ride.status)) {
          setRide(null);
          await refreshWallet();
        }
      } catch {
        // The next explicit refresh will surface an error if the ride became inaccessible.
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [activeRideId, refreshWallet]);

  async function price(event: FormEvent) {
    event.preventDefault();
    setBusy("price");
    setError("");
    setNotice("");
    try {
      if (!destinationChosen) throw new Error("Choose a destination from the suggested areas or set its map pin.");
      if(routeDirty) throw new Error("Select a mapped destination area or correct the destination pin after changing its address.");
      if(from.trim().length < 2 || to.trim().length < 2) throw new Error("Both pickup and destination are required.");
      const distanceMeters = Math.round(Number(distanceKm) * 1000);
      const durationSeconds = Math.round(Number(durationMin) * 60);
      if (!Number.isFinite(distanceMeters) || distanceMeters < 200 || !Number.isFinite(durationSeconds) || durationSeconds < 60) {
        throw new Error("Enter a valid estimated distance and duration.");
      }
      setQuote(await api.post<DrivePricingQuoteContract>("/v1/drive/pricing", {
        pickup,
        dropoff,
        rideClass,
        distanceMeters,
        durationSeconds,
        tollsMinor: 0,
        feesMinor: 0,
        discountsMinor: 0,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pricing failed");
    } finally {
      setBusy("");
    }
  }

  async function requestRide() {
    if (!quote) return;
    if (signedOut) { signIn(); return; }
    if (wallet && wallet.wallet.availableMinor < quote.totalMinor) {
      setError(`Your Wallet needs ${money(quote.totalMinor - wallet.wallet.availableMinor, quote.currency)} more to secure this fare.`);
      return;
    }
    setBusy("request");
    setError("");
    try {
      const result = await api.post<DriveRideRequestResponseContract>("/v1/drive/rides", {
        quoteId: quote.id,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        pickupNotes: pickupNotes || undefined,
      }, { idempotencyKey: crypto.randomUUID() });
      setRide(result);
      setNotice("Fare secured. Drive is matching the nearest eligible approved driver.");
      await refreshWallet();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) { signIn(); return; }
      setError(cause instanceof Error ? cause.message : "Ride request failed");
    } finally {
      setBusy("");
    }
  }

  async function cancelRide() {
    const id = activeRideId;
    if (!id) return;
    setBusy("cancel");
    setError("");
    try {
      await api.patch(`/v1/drive/rides/${id}/status`, { status: "CANCELLED", reason: "Rider cancelled ride" });
      setRide(null);
      setActiveRide(null);
      setQuote(null);
      setNotice("Ride cancelled. Any eligible held fare has been returned to Wallet.");
      await refreshWallet();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ride cancellation failed");
    } finally {
      setBusy("");
    }
  }

  async function moveDriverEarnings() {
    const amountMinor = wallet?.driver?.payoutAvailableMinor ?? 0;
    if (amountMinor <= 0) return;
    setBusy("payout");
    setError("");
    try {
      await api.request("/v1/drive/driver/payouts", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: { amountMinor },
      });
      setNotice("Drive earnings moved into your spendable BAZAARA Wallet.");
      await refreshWallet();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not move driver earnings");
    } finally {
      setBusy("");
    }
  }

  async function createDriveSupport(event: FormEvent) {
    event.preventDefault();
    if (signedOut) { signIn(); return; }
    const linkedRideId = supportRideId || activeRideId || undefined;
    setBusy("support");
    setError("");
    try {
      await api.post("/v1/support/cases", {
        category: "DRIVE",
        channel: "DRIVE",
        subject: supportSubject.trim(),
        description: supportDescription.trim(),
        driveRideId: linkedRideId,
        context: { surface: "BAZAARA_DRIVE_WEB", rideStatus: rideStatus ?? null },
      });
      setSupportOpen(false);
      setSupportDescription("");
      setNotice(linkedRideId ? "Drive support case opened with the ride attached to Operations." : "Drive support case opened with Operations.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open Drive support case");
    } finally {
      setBusy("");
    }
  }

  function openRideSupport(rideId?: string) {
    setSupportRideId(rideId ?? activeRideId ?? "");
    setSupportSubject(rideId || activeRideId ? "Help with my Drive ride" : "Drive trip support");
    setView("account");
    setSupportOpen(true);
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setError("This browser does not expose device location.");
      return;
    }
    setBusy("location");
    navigator.geolocation.getCurrentPosition((position) => {
      setPickupCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setFrom("My device location");
      setBusy("");
      setQuote(null);
      setNotice("Device GPS pickup pin updated. Confirm the precise pickup point before booking.");
    }, (cause) => {
      setBusy("");
      setError(cause.message || "Location permission was not granted.");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  const rideStatus = activeRide?.ride.status ?? ride?.ride.status ?? null;
  const canCancel = rideStatus && !["RIDER_VERIFIED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(rideStatus);

  const displayedRides = [...(wallet?.recentRides ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const monthLabel = (date: string) => new Date(date).toLocaleDateString("en-NG", {month: "long", year: "numeric"});

  return (
    <div className="dv14-app">
      <header className="dv14-header">
        <button type="button" className="dv14-wordmark" onClick={() => setView("home")} aria-label="Drive home">BAZAARA <span>Drive</span></button>
        <button type="button" className="dv14-avatar" onClick={() => setView("account")} aria-label="Account and settings">â—Ž</button>
      </header>
      {view === "home" ? <main className="dv14-home">
        <section className="dv14-map" aria-label="Map preview near pickup">
          <iframe title="OpenStreetMap pickup neighbourhood preview, not a driving route" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${pickupCoords.longitude-.041}%2C${pickupCoords.latitude-.026}%2C${pickupCoords.longitude+.041}%2C${pickupCoords.latitude+.026}&layer=mapnik&marker=${pickupCoords.latitude}%2C${pickupCoords.longitude}`} />
          <button type="button" className="dv14-locate" onClick={useDeviceLocation} disabled={busy === "location"} aria-label="Use my current location">{busy === "location" ? "â€¦" : "â—Ž"}</button>
          <span className="dv14-map-label">Map preview Â· Port Harcourt</span>
        </section>
        <section className={`dv14-sheet ${bookingStep !== "home" || quote || activeRideId ? "dv14-sheet-open" : ""}`} aria-label="Ride booking">
          <div className="dv14-grabber" aria-hidden="true" />
          {error ? <div className="dv14-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss error">Ã—</button></div> : null}
          {notice ? <div className="dv14-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">Ã—</button></div> : null}
          {activeRideId && rideStatus ? <div className="dv14-ride-active">
            <div className="dv14-between"><div><small>YOUR RIDE</small><h1>{pretty(rideStatus)}</h1></div><button type="button" className="dv14-text-button" onClick={() => void refreshWallet()}>Refresh</button></div>
            <p>{activeRide?.driver?.displayName ?? "Finding an approved driverâ€¦"}</p>
            {activeRide?.driver?.vehicle ? <div className="dv14-car-plate">{activeRide.driver.vehicle.plateNumber} Â· {activeRide.driver.vehicle.color} {activeRide.driver.vehicle.make} {activeRide.driver.vehicle.model}</div> : null}
            {ride?.riderPin ? <div className="dv14-pin">Pickup PIN <strong>{ride.riderPin}</strong><small>Only share when you meet your driver.</small></div> : null}
            <div className="dv14-inline-actions"><button type="button" onClick={shareTrip}>Share trip</button><button type="button" onClick={() => openRideSupport(activeRideId)}>Help</button><a href="tel:112">Emergency 112</a>{canCancel ? <button type="button" disabled={busy === "cancel"} onClick={() => void cancelRide()}>Cancel ride</button> : null}</div>
          </div> : quote ? <div className="dv14-fare-panel" aria-live="polite">
            <div className="dv14-between"><button type="button" className="dv14-back" onClick={() => {setQuote(null);setBookingStep("rides");}}>â† Back</button><span>Price estimate</span></div>
            <p className="dv14-trip-summary">{from} â†’ {to}</p>
            <div className="dv14-fare-total">{money(quote.totalMinor, quote.currency)}</div>
            <p className="dv14-muted">{classes.find(c => c.id === rideClass)?.name} Â· {distanceKm} km Â· ~{durationMin} min <strong>pilot estimate</strong></p>
            <details className="dv14-details"><summary>Price and fuel details</summary>
              <div>Base fare <strong>{money(quote.baseFareMinor, quote.currency)}</strong></div>
              <div>Distance <strong>{money(quote.distanceFareMinor, quote.currency)}</strong></div>
              <div>Duration <strong>{money(quote.timeFareMinor, quote.currency)}</strong></div>
              <div>Fuel adjustment <strong>{money(quote.fuelAdjustmentMinor, quote.currency)}</strong></div>
              <div>Demand adjustment <strong>{money(quote.demandAdjustmentMinor, quote.currency)}</strong></div>
              <p>{quote.fuelDisclosure?.status === "CURRENT" ? `Approved source: ${quote.fuelDisclosure.source}.` : "Baseline adjustment: no current verified publication."} BAZAARA uses 30% fuel exposure, capped at Â±12%; confirmed fares cannot be retroactively changed.</p>
              {quote.fuelDisclosure?.evidenceUrl ? <a href={quote.fuelDisclosure.evidenceUrl} target="_blank" rel="noopener noreferrer">View source</a> : null}
            </details>
            {wallet && wallet.wallet.availableMinor < quote.totalMinor ? <p className="dv14-error">Insufficient balance. <a href={PAY}>Add a payment method or funds</a>.</p> : null}
            <button type="button" className="dv14-primary" disabled={busy !== "" || Boolean(wallet && wallet.wallet.availableMinor < quote.totalMinor)} onClick={() => void requestRide()}>{busy === "request" ? "Confirmingâ€¦" : signedOut ? "Continue to sign in" : "Confirm ride"}</button>
          </div> : bookingStep === "home" ? <div className="dv14-start">
            <div className="dv14-search-row"><button type="button" className="dv14-search" onClick={() => setBookingStep("destination")}><span aria-hidden="true">âŒ•</span><strong>Where to?</strong></button><button type="button" className="dv14-later" onClick={() => {setBookingMode("later");setBookingStep("destination");}}>â–£ <span>Later</span></button></div>
          </div> : bookingStep === "destination" ? <div className="dv14-destination">
            <div className="dv14-between"><button type="button" className="dv14-back" onClick={() => {setBookingStep("home");setRouteDirty(false);}}>â† Back</button><strong>Choose destination</strong></div>
            <div className="dv14-pickup"><span>â—</span><div><small>Pickup</small><p>{from}</p></div><button type="button" onClick={useDeviceLocation} disabled={busy === "location"}>GPS</button></div>
            <label className="dv14-destination-field"><span aria-hidden="true">â—†</span><input autoFocus aria-label="Destination" placeholder="Where are you going?" value={to} onChange={event => {setTo(event.target.value);setRouteDirty(true);setDestinationChosen(false);setQuote(null);}} /></label>
            <div className="dv14-suggestions"><small>SUGGESTED AREAS</small>
              <button type="button" onClick={() => chooseDestination("GRA, Port Harcourt Â· approximate area",4.8246,7.0069)}>âŒ– <span>GRA <small>Port Harcourt</small></span></button>
              <button type="button" onClick={() => chooseDestination("Port Harcourt city centre Â· approximate area",4.8156,7.0498)}>âŒ– <span>City centre <small>Port Harcourt</small></span></button>
              <button type="button" onClick={() => setShowPinEditor(prev => !prev)}>âŒ– <span>Set destination coordinates <small>Advanced Â· pilot only</small></span></button>
            </div>
            {showPinEditor ? <div className="dv14-coords"><label>Latitude<input type="number" min={-90} max={90} step="any" value={dropoffCoords.latitude} onChange={event => setDropoffCoords(prev => ({...prev,latitude:Number(event.target.value)}))}/></label><label>Longitude<input type="number" min={-180} max={180} step="any" value={dropoffCoords.longitude} onChange={event => setDropoffCoords(prev => ({...prev,longitude:Number(event.target.value)}))}/></label><button type="button" onClick={() => {setTo(to || "Selected map coordinates");setDestinationChosen(true);setRouteDirty(false);setBookingStep("rides");setShowPinEditor(false);}}>Use pin</button></div> : null}
            {routeDirty ? <p className="dv14-muted">Live address autocomplete is not connected. Select a suggested area or set a pin.</p> : null}
          </div> : <form className="dv14-options" onSubmit={price}>
            <div className="dv14-between"><button type="button" className="dv14-back" onClick={() => setBookingStep("destination")}>â† Back</button><strong>Choose your ride</strong></div>
            <p className="dv14-trip-summary">{from} â†’ <strong>{to}</strong></p>
            <div className="dv14-vehicle-options">{classes.map(item => <button type="button" key={item.id} className={rideClass === item.id ? "selected" : ""} aria-pressed={rideClass === item.id} onClick={() => {setRideClass(item.id);setQuote(null);}}><span className="dv14-car-icon">â–°</span><span><strong>{item.name}</strong><small>{item.meta}</small></span><span aria-hidden="true">{rideClass === item.id ? "â—" : "â—‹"}</span></button>)}</div>
            <div className="dv14-when"><button type="button" className={bookingMode === "now" ? "selected" : ""} onClick={() => {setBookingMode("now");setScheduledFor("");}}>Now</button><button type="button" className={bookingMode === "later" ? "selected" : ""} onClick={() => setBookingMode("later")}>Schedule</button></div>
            {bookingMode === "later" ? <label className="dv14-schedule">Pickup date and time<input required type="datetime-local" value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} /></label> : null}
            <p className="dv14-pilot">Estimated {distanceKm} km Â· {durationMin} min Â· not traffic-aware or verified road routing.</p>
            <details className="dv14-details"><summary>Pickup notes and pilot estimate</summary><div className="dv14-inputs"><label>Distance (km)<input value={distanceKm} inputMode="decimal" onChange={event => {setDistanceKm(event.target.value);setQuote(null);}} /></label><label>Duration (minutes)<input value={durationMin} inputMode="numeric" onChange={event => {setDurationMin(event.target.value);setQuote(null);}} /></label><label>Pickup notes<input value={pickupNotes} onChange={event => setPickupNotes(event.target.value)} placeholder="Entrance or landmark" /></label></div><button type="button" className="dv14-text-button" onClick={estimateFromPins}>Reset indicative estimate</button></details>
            <button type="submit" className="dv14-primary" disabled={busy !== "" || !destinationChosen || routeDirty}>{busy === "price" ? "Checking priceâ€¦" : "See estimated fare"}</button>
          </form>}
        </section>
      </main> : view === "activity" ? <main className="dv14-page dv14-activity"><div className="dv14-page-title"><h1>Activity</h1><button type="button" onClick={() => void refreshWallet()}>â†» Refresh</button></div>
        {displayedRides.length ? displayedRides.map((item,index) => <div key={item.id}>
          {index === 0 || monthLabel(item.createdAt) !== monthLabel(displayedRides[index-1]!.createdAt) ? <h2>{monthLabel(item.createdAt)}</h2> : null}
          <article className="dv14-trip"><div className="dv14-trip-icon">â–°</div><div><strong>{pretty(item.rideClass)} ride</strong><small>{new Date(item.createdAt).toLocaleString("en-NG", {day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})} Â· {pretty(item.status)}</small><button type="button" onClick={() => openRideSupport(item.id)}>Get help</button></div><b>{money(item.totalMinor,item.currency)}</b></article>
        </div>) : <div className="dv14-empty">{signedOut ? "Sign in to see your rides." : "Your rides will appear here."}</div>}
      </main> : <>
        {activeRideId && !signedOut ? (
          <section
            aria-label="Active ride Wallet handoff"
            className="dv14-account-wallet-handoff"
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "14px auto 0", padding: "14px 16px", width: "calc(100% - 28px)", maxWidth: 920, borderRadius: 16, border: "1px solid rgba(0, 194, 184, .33)", background: "#102238", color: "#f2fcff" }}
          >
            <div>
              <strong style={{ display: "block", fontSize: 13 }}>ACTIVE RIDE</strong>
              <small style={{ color: "#accbd1", overflowWrap: "anywhere" }}>Trip reference: {activeRideId}</small>
            </div>
            <a
              href={`${PAY}?section=drive&rideId=${encodeURIComponent(activeRideId)}`}
              className="drive-v11-secondary"
              style={{ display: "inline-flex", minHeight: 42, alignItems: "center", justifyContent: "center", padding: "10px 14px", borderRadius: 10, fontWeight: 750, textDecoration: "none" }}
            >View fare in Wallet</a>
          </section>
        ) : null}
        <DriveAccountHub signedOut={signedOut} payUrl={PAY} activeRideId={activeRideId} rides={displayedRides} onSignIn={signIn} onSupport={openRideSupport} onRefresh={() => void refreshWallet()} />
      </>}
      <nav className="dv14-tabs" aria-label="Drive navigation">
        <button type="button" aria-current={view === "home" ? "page" : undefined} onClick={() => setView("home")}><span aria-hidden="true">âŒ‚</span>Home</button>
        <button type="button" aria-current={view === "activity" ? "page" : undefined} onClick={() => setView("activity")}><span aria-hidden="true">â–¤</span>Activity</button>
        <button type="button" aria-current={view === "account" ? "page" : undefined} onClick={() => setView("account")}><span aria-hidden="true">â—Ž</span>Account</button>
      </nav>
    </div>
  );
}
