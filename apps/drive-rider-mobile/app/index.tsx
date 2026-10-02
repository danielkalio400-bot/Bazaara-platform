import DriveAccountMobile from './components/DriveAccountMobile';
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Linking, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { appApi } from "../src/lib/api";
import { isSignedIn, signInWithBazId, signOutNative } from "../src/lib/auth";

type RideClass = "GO" | "COMFORT" | "XL";
type Point = { label: string; latitude: number; longitude: number };
type Quote = { id: string; rideClass: RideClass; distanceMeters: number; durationSeconds: number; baseFareMinor: number; distanceFareMinor: number; timeFareMinor: number; fuelAdjustmentMinor: number; demandAdjustmentMinor: number; tollsMinor: number; feesMinor: number; discountsMinor: number; platformFeeMinor: number; driverEarningsMinor: number; totalMinor: number; currency: string; expiresAt: string; fuelDisclosure?: {status:string;source:string|null;evidenceUrl:string|null;effectiveFrom:string|null;weightBps:number;maxAdjustmentBps:number} };
type RideResponse = { ride: { id: string; status: string; fareFundingStatus: string; searchRadiusMeters: number; driverUserId: string | null }; riderPin: string };
type Detail = { ride: RideResponse["ride"]; pricing: Quote; driver: null | { displayName: string; ratingAverage: number | null; ratingCount: number; vehicle: null | { make: string; model: string; color: string; plateNumber: string } } };
type WalletContext = { wallet: { availableMinor: number; currency: string; status: string }; heldFareMinor: number; activeRideCount: number; completedRideCount: number; recentRides: Array<{ id: string; status: string; rideClass: string; totalMinor: number; currency: string; createdAt: string }> };
type FuelPolicy = { status: string; source: string | null; evidenceUrl: string | null; effectiveFrom: string | null; weightBps: number; maxAdjustmentBps: number };
type Caps = { platformFeeBps: number; callUnlockMeters: number; callUnlockEtaSeconds: number; dropoffGeofenceMeters: number };
const payWeb = process.env.EXPO_PUBLIC_PAY_WEB_BASE_URL ?? "http://localhost:3010";
const PRIVATE_RIDE_KEY = "bazaara-drive-rider-active-v12";
const classes: Array<{ id: RideClass; name: string; seats: string; note: string; icon: string }> = [
  { id: "GO", name: "Drive Go", seats: "4 seats", note: "Everyday rides", icon: "◩" },
  { id: "COMFORT", name: "Comfort", seats: "4 seats", note: "Room to relax", icon: "▣" },
  { id: "XL", name: "Drive XL", seats: "6+ seats", note: "Bring everyone", icon: "▤" },
];
const popular: Point[] = [
  { label: "GRA, Port Harcourt · approximate area", latitude: 4.8246, longitude: 7.0069 },
  { label: "Port Harcourt city centre · approximate area", latitude: 4.8156, longitude: 7.0498 },
];
const currency = (minor: number, code = "NGN") => new Intl.NumberFormat("en-NG", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(minor / 100);
function estimateDistance(pickup: Point, dropoff: Point) {
  const radians = Math.PI / 180;
  const a = Math.sin((dropoff.latitude-pickup.latitude)*radians/2)**2 + Math.cos(pickup.latitude*radians)*Math.cos(dropoff.latitude*radians)*Math.sin((dropoff.longitude-pickup.longitude)*radians/2)**2;
  return Math.max(0.2, Math.round(12742 * Math.asin(Math.min(1,Math.sqrt(a))) * 1.4 * 10)/10);
}

export default function Rider() {
  const [signed, setSigned] = useState(false);
  const [tab, setTab] = useState<"home" | "activity" | "account">("home");
  const [sheetStep, setSheetStep] = useState<"home" | "destination" | "rides">("home");
  const [hasDestination, setHasDestination] = useState(false);
  const [pickup, setPickup] = useState<Point>({ label: "Port Harcourt city centre · approximate area", latitude: 4.8156, longitude: 7.0498 });
  const [dropoff, setDropoff] = useState<Point>(popular[0]);
  const [manualDestination, setManualDestination] = useState(false);
  const [routeDistance, setRouteDistance] = useState("6.5");
  const [routeMinutes, setRouteMinutes] = useState("20");
  const [later, setLater] = useState(false);
  const [scheduleIso, setScheduleIso] = useState("");
  const [rideClass, setRideClass] = useState<RideClass>("GO");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [ride, setRide] = useState<RideResponse | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [wallet, setWallet] = useState<WalletContext | null>(null);
  const [fuel, setFuel] = useState<FuelPolicy | null>(null);
  const [caps, setCaps] = useState<Caps | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pendingBookingKey = useRef<{quoteId:string; key:string}|null>(null);

  const refresh = useCallback(async () => {
    try {
      const [authenticated, rules, fuelPolicy] = await Promise.all([
        isSignedIn(), appApi.get<Caps>("/v1/drive/capabilities"), appApi.get<FuelPolicy>("/v1/drive/fuel-policy"),
      ]);
      setSigned(authenticated); setCaps(rules); setFuel(fuelPolicy);
      if (authenticated) {
        const balance = await appApi.get<WalletContext>("/v1/drive/wallet");
        setWallet(balance);
        const active = balance.recentRides.find(item => !["COMPLETED", "CANCELLED"].includes(item.status));
        if (active) {
          const found = await appApi.get<Detail>(`/v1/drive/rides/${active.id}`);
          setDetail(found);
          const stored = await SecureStore.getItemAsync(PRIVATE_RIDE_KEY).catch(() => null);
          let saved: {rideId:string;riderPin:string} | null = null;
          try { saved = stored ? JSON.parse(stored) as {rideId:string;riderPin:string} : null; } catch { await SecureStore.deleteItemAsync(PRIVATE_RIDE_KEY).catch(()=>undefined); }
          // Preserve newly issued PIN; securely recover only the PIN from this device's booking.
          setRide(previous => previous?.ride.id === active.id ? { ...previous, ride: found.ride } : { ride: found.ride, riderPin: saved?.rideId === active.id ? saved.riderPin : "" });
        } else {
          await SecureStore.deleteItemAsync(PRIVATE_RIDE_KEY).catch(() => undefined);
        }
      } else { setWallet(null); }
      setError("");
    } catch (cause) { setWallet(null); setError(cause instanceof Error ? cause.message : "Could not load Drive"); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  // Return from the BAZAARA Wallet web flow: fetch the balance again rather than
  // continuing to display a pre-funding snapshot.
  useEffect(() => {
    let previousState = AppState.currentState;
    const listener = AppState.addEventListener("change", nextState => {
      if (["background", "inactive"].includes(previousState) && nextState === "active") {
        void refresh();
      }
      previousState = nextState;
    });
    return () => listener.remove();
  }, [refresh]);
  useEffect(() => {
    if (!ride || ["CANCELLED", "COMPLETED"].includes(ride.ride.status)) return;
    let stopped = false;
    const poll = async () => {
      try {
        const current = await appApi.get<Detail>(`/v1/drive/rides/${ride.ride.id}`);
        if (stopped) return;
        setDetail(current); setRide(previous => previous ? {...previous, ride: current.ride} : previous);
        if (["COMPLETED","CANCELLED"].includes(current.ride.status)) await SecureStore.deleteItemAsync(PRIVATE_RIDE_KEY).catch(() => undefined);
      } catch { /* Next manual refresh surfaces transient connectivity errors. */ }
    };
    void poll(); const timer = setInterval(() => void poll(), 5000);
    return () => { stopped = true; clearInterval(timer); };
  }, [ride?.ride.id, ride?.ride.status]);

  async function login() { setBusy("login"); setError(""); try { const result = await signInWithBazId("/"); if (result.ok) await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign in failed"); } finally { setBusy(""); } }
  async function logout() { await SecureStore.deleteItemAsync(PRIVATE_RIDE_KEY).catch(() => undefined); await signOutNative(); setSigned(false); setWallet(null); setRide(null); setDetail(null); setQuote(null); }
  async function locatePickup() {
    setBusy("gps"); setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Location permission was denied. You can select a neighbourhood instead.");
      const location = await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      setPickup({label:"My GPS pickup · confirm exact entrance",latitude:location.coords.latitude,longitude:location.coords.longitude});
      setQuote(null);setNotice("Pickup GPS updated. Check the correct entrance in your navigation app.");
    } catch (cause) { setError(cause instanceof Error?cause.message:"Could not locate you"); } finally {setBusy("");}
  }
  useEffect(() => {
    if (!hasDestination || manualDestination) return;
    const km = estimateDistance(pickup, dropoff);
    setRouteDistance(km.toFixed(1));
    setRouteMinutes(String(Math.max(3, Math.round(km / 23 * 60))));
    setQuote(null);
  }, [pickup, dropoff, hasDestination, manualDestination]);
  function selectDestination(point: Point) {
    setDropoff(point);setManualDestination(false);setHasDestination(true);
    setQuote(null);setSheetStep("rides");
  }
  function calculateFromPins() {
    const km = estimateDistance(pickup, dropoff);
    setRouteDistance(km.toFixed(1));setRouteMinutes(String(Math.max(3,Math.round(km/23*60))));setQuote(null);
    setNotice("Indicative straight-line projection only. Verify the actual road distance and journey time before confirming a fare.");
  }
  async function price() {
    setBusy("price");setError("");
    try {
      if (manualDestination) throw new Error("Choose a destination area or set its coordinates before pricing.");
      const distanceMeters=Math.round(Number(routeDistance)*1000);
      const durationSeconds=Math.round(Number(routeMinutes)*60);
      if (!Number.isFinite(distanceMeters) || distanceMeters<200 || !Number.isFinite(durationSeconds) || durationSeconds<60) throw new Error("Enter a valid road distance and duration.");
      const result=await appApi.post<Quote>("/v1/drive/pricing",{pickup,dropoff,rideClass,distanceMeters,durationSeconds,tollsMinor:0,feesMinor:0,discountsMinor:0});
      setQuote(result);
    } catch (cause) {setError(cause instanceof Error?cause.message:"Pricing failed");} finally {setBusy("");}
  }
  async function request() {
    if (!quote) return;
    if (!signed) {await login();return;}
    if (wallet && wallet.wallet.availableMinor<quote.totalMinor) {void Linking.openURL(`${payWeb}/?section=drive`);return;}
    const scheduledFor = later ? new Date(scheduleIso) : null;
    if (later && (!scheduleIso || Number.isNaN(scheduledFor?.getTime()) || scheduledFor!.getTime() <= Date.now()+5*60000 || scheduledFor!.getTime()>Date.now()+90*86400000)) {
      setError("Enter a valid ISO pickup time from 5 minutes to 90 days in the future.");return;
    }
    setBusy("request");setError("");
    try {
      const key = pendingBookingKey.current?.quoteId === quote.id ? pendingBookingKey.current.key : Crypto.randomUUID();
      pendingBookingKey.current={quoteId:quote.id,key};
      const result=await appApi.post<RideResponse>("/v1/drive/rides",{quoteId:quote.id,pickupNotes:note||undefined,scheduledFor:scheduledFor?.toISOString()},{idempotencyKey:key});
      await SecureStore.setItemAsync(PRIVATE_RIDE_KEY,JSON.stringify({rideId:result.ride.id,riderPin:result.riderPin})).catch(()=>setNotice("Ride booked. Secure pickup PIN storage was unavailable; keep this screen open."));
      pendingBookingKey.current=null;
      setRide(result);setNotice("Fare held in BAZAARA Wallet. Finding an eligible approved driver.");await refresh();
    } catch (cause) {setError(cause instanceof Error?cause.message:"Could not book ride");} finally {setBusy("");}
  }
  async function cancel() {if (!ride)return;setBusy("cancel");try {await appApi.patch(`/v1/drive/rides/${ride.ride.id}/status`,{status:"CANCELLED",reason:"Rider cancelled ride"});await SecureStore.deleteItemAsync(PRIVATE_RIDE_KEY).catch(()=>undefined);setRide(null);setDetail(null);setQuote(null);setNotice("Ride cancelled. Eligible held funds are released to Wallet.");await refresh();}catch(cause){setError(cause instanceof Error?cause.message:"Could not cancel ride");}finally{setBusy("");}}
  async function shareTrip() {if(!ride)return;try{await Share.share({message:`BAZAARA Drive trip ${ride.ride.id}. Status: ${ride.ride.status}. Vehicle: ${detail?.driver?.vehicle?.plateNumber??"Pending assignment"}. This is a trip reference, not live-location sharing.`});}catch(cause){setError(cause instanceof Error?cause.message:"Sharing unavailable");}}
  const active=ride && !["CANCELLED","COMPLETED"].includes(ride.ride.status);
  const shortfall=quote&&wallet?Math.max(0,quote.totalMinor-wallet.wallet.availableMinor):0;
  const displayedRides = [...(wallet?.recentRides ?? [])].sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  return <SafeAreaView style={n.screen}><StatusBar style="dark"/>
    {tab === "home" ? <View style={n.home}>
      <View style={n.map} accessible accessibilityLabel="Decorative neighbourhood preview, not live road navigation">
        <View style={s.roadOne}/><View style={s.roadTwo}/><View style={s.roadThree}/><View style={s.roadFour}/>
        <View style={[s.mapPin,{top:95,left:62}]}><Text style={s.pinText}>●</Text><Text style={s.pinLabel}>Pickup area</Text></View>
        {hasDestination ? <View style={[s.mapPin,{bottom:115,right:38}]}><Text style={[s.pinText,{color:"#132c2a"}]}>◆</Text><Text style={s.pinLabel}>Selected area</Text></View> : null}
        <View style={n.mapTop}><Text style={n.mapLabel}>Area preview · not live navigation</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Find my location" style={n.locate} onPress={()=>void locatePickup()} disabled={busy==="gps"}><Text style={n.locateText}>{busy==="gps"?"…":"◎"}</Text></Pressable>
      </View>
      <View style={n.sheet}>
        <View style={n.handle}/>
        {error?<View style={n.error}><Text style={n.errorText}>{error}</Text></View>:null}
        {notice?<View style={n.notice}><Text style={n.noticeText}>{notice}</Text></View>:null}
        {active ? <ScrollView style={n.openScroll} contentContainerStyle={n.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={n.eyebrow}>YOUR RIDE</Text><Text style={n.heading}>{ride.ride.status.replaceAll("_"," ")}</Text>
          <Text style={n.muted}>{detail?.driver?.displayName ?? "Finding an approved driver…"}</Text>
          {detail?.driver?.vehicle?<View style={n.summary}><Text style={n.summaryText}>{detail.driver.vehicle.plateNumber} · {detail.driver.vehicle.color} {detail.driver.vehicle.make} {detail.driver.vehicle.model}</Text></View>:null}
          {ride.riderPin?<View style={n.summary}><Text style={n.eyebrow}>PICKUP PIN</Text><Text style={n.pin}>{ride.riderPin}</Text><Text style={n.muted}>Share only when you meet your driver.</Text></View>:null}
          <View style={n.actionRow}><Pressable style={n.miniButton} onPress={()=>void shareTrip()}><Text style={n.miniButtonText}>Share</Text></Pressable><Pressable style={n.miniButton} onPress={()=>void Linking.openURL(`${payWeb}/?section=support&category=DRIVE&rideId=${encodeURIComponent(ride.ride.id)}`)}><Text style={n.miniButtonText}>Help</Text></Pressable><Pressable style={n.danger} onPress={()=>void Linking.openURL("tel:112")}><Text style={n.dangerText}>SOS 112</Text></Pressable></View>
          {!['RIDER_VERIFIED','IN_PROGRESS'].includes(ride.ride.status)?<Pressable style={n.secondary} disabled={busy==='cancel'} onPress={()=>void cancel()}><Text style={n.miniButtonText}>Cancel ride</Text></Pressable>:null}
        </ScrollView> : quote ? <ScrollView style={n.openScroll} contentContainerStyle={n.sheetContent} keyboardShouldPersistTaps="handled">
          <Pressable onPress={()=>{setQuote(null);setSheetStep("rides");}}><Text style={n.back}>← Back</Text></Pressable>
          <Text style={n.eyebrow}>ESTIMATED PILOT FARE</Text><Text style={n.price}>{currency(quote.totalMinor,quote.currency)}</Text>
          <Text style={n.muted}>{classes.find(item=>item.id===rideClass)?.name} · {routeDistance} km · {routeMinutes} min</Text>
          <Text style={n.fareCaveat}>Not a verified road route or traffic-aware ETA.</Text>
          <View style={n.fareBreakdown}><Text style={n.eyebrow}>PRICE DETAILS</Text>
            {[['Base',quote.baseFareMinor],['Distance',quote.distanceFareMinor],['Duration',quote.timeFareMinor],['Fuel adjustment',quote.fuelAdjustmentMinor],['Demand',quote.demandAdjustmentMinor]].map(([label,amount])=><View key={String(label)} style={n.fareLine}><Text style={n.muted}>{label}</Text><Text style={n.summaryText}>{currency(Number(amount),quote.currency)}</Text></View>)}
            <Text style={n.fareCaveat}>Fuel index: {quote.fuelDisclosure?.status==='CURRENT'?quote.fuelDisclosure.source:'baseline'}. 30% fuel exposure; ±12% commercial cap.</Text>
            {quote.fuelDisclosure?.evidenceUrl?<Pressable onPress={()=>void Linking.openURL(quote.fuelDisclosure!.evidenceUrl!)}><Text style={n.link}>View fuel evidence</Text></Pressable>:null}
          </View>
          {shortfall?<Text style={n.errorText}>Insufficient balance. Add a payment method or funds in Account.</Text>:null}
          <Pressable style={[n.primary,busy!==''&&n.disabled]} disabled={busy!==''} onPress={()=>void request()}><Text style={n.primaryText}>{!signed?'Continue to sign in':shortfall?'Add funds':busy==='request'?'Confirming…':'Confirm ride'}</Text></Pressable>
        </ScrollView> : sheetStep === "home" ? <View style={n.start}>
          <View style={n.searchRow}><Pressable style={n.search} onPress={()=>setSheetStep('destination')}><Text style={n.searchIcon}>⌕</Text><Text style={n.searchText}>Where to?</Text></Pressable><Pressable style={n.later} onPress={()=>{setLater(true);setSheetStep('destination');}}><Text style={n.laterText}>▣  Later</Text></Pressable></View>
        </View> : sheetStep === "destination" ? <ScrollView style={n.openScroll} contentContainerStyle={n.sheetContent} keyboardShouldPersistTaps="handled">
          <Pressable onPress={()=>setSheetStep('home')}><Text style={n.back}>← Back</Text></Pressable><Text style={n.sectionTitle}>Choose destination</Text>
          <View style={n.summary}><Text style={n.eyebrow}>PICKUP</Text><Text style={n.summaryText}>{pickup.label}</Text><Pressable onPress={()=>void locatePickup()}><Text style={n.link}>Use GPS</Text></Pressable></View>
          <TextInput accessibilityLabel="Destination" autoFocus style={n.searchInput} value={hasDestination?dropoff.label:manualDestination?dropoff.label:''} onChangeText={label=>{setDropoff(previous=>({...previous,label}));setManualDestination(true);setHasDestination(false);setQuote(null);}} placeholder="Where are you going?" placeholderTextColor="#86938f" />
          <Text style={n.eyebrow}>SUGGESTED AREAS</Text>
          {popular.map(point=><Pressable key={point.label} style={n.suggestion} onPress={()=>selectDestination(point)}><Text style={n.suggestionIcon}>⌖</Text><View><Text style={n.suggestionText}>{point.label.split(' · ')[0]}</Text><Text style={n.muted}>Port Harcourt</Text></View></Pressable>)}
          {manualDestination?<Text style={n.fareCaveat}>Live address autocomplete is not connected. Select an area above to set a destination pin.</Text>:null}
        </ScrollView> : <ScrollView style={n.openScroll} contentContainerStyle={n.sheetContent} keyboardShouldPersistTaps="handled">
          <Pressable onPress={()=>setSheetStep('destination')}><Text style={n.back}>← Back</Text></Pressable><Text style={n.sectionTitle}>Choose your ride</Text>
          <Text style={n.summaryText}>{dropoff.label}</Text>
          {classes.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected:rideClass===item.id}} style={[n.vehicle,rideClass===item.id&&n.selected]} onPress={()=>{setRideClass(item.id);setQuote(null);}}><Text style={n.vehicleIcon}>▰</Text><View style={{flex:1}}><Text style={n.vehicleName}>{item.name}</Text><Text style={n.muted}>{item.note} · {item.seats}</Text></View><Text style={n.radio}>{rideClass===item.id?'●':'○'}</Text></Pressable>)}
          <View style={n.actionRow}><Pressable style={[n.segment,!later&&n.segmentSelected]} onPress={()=>{setLater(false);setScheduleIso('');}}><Text style={n.miniButtonText}>Now</Text></Pressable><Pressable style={[n.segment,later&&n.segmentSelected]} onPress={()=>setLater(true)}><Text style={n.miniButtonText}>Schedule</Text></Pressable></View>
          {later?<TextInput accessibilityLabel="Scheduled pickup ISO time" style={n.searchInput} value={scheduleIso} onChangeText={setScheduleIso} placeholder="YYYY-MM-DDTHH:MM:SS+01:00" placeholderTextColor="#86938f"/>:null}
          <Text style={n.fareCaveat}>Pilot estimate {routeDistance} km · {routeMinutes} min · not verified road routing.</Text>
          <TextInput accessibilityLabel="Pickup notes" style={n.searchInput} value={note} onChangeText={setNote} placeholder="Pickup notes (optional)" placeholderTextColor="#86938f" />
          <Pressable style={[n.primary,busy!==''&&n.disabled]} disabled={busy!==''||manualDestination||!hasDestination} onPress={()=>void price()}><Text style={n.primaryText}>{busy==='price'?'Checking fare…':'See estimated fare'}</Text></Pressable>
        </ScrollView>}
      </View>
    </View> : tab === "activity" ? <ScrollView style={n.page} contentContainerStyle={n.pageContent}>
      <Text style={n.pageTitle}>Activity</Text>
      <View style={n.actionRow}>
        <Pressable onPress={()=>void refresh()}><Text style={n.link}>↻ Refresh</Text></Pressable>
        <Pressable accessibilityRole="button" style={n.walletContextButton}
          onPress={()=>signed ? void Linking.openURL(`${payWeb}/?section=drive`) : void login()}>
          <Text style={n.walletContextText}>Wallet details</Text>
        </Pressable>
      </View>
      {displayedRides.length ? displayedRides.map((item,index,all) => <View key={item.id}>
        {index===0 || new Date(item.createdAt).toLocaleDateString('en-NG',{month:'long',year:'numeric'}) !== new Date(all[index-1]!.createdAt).toLocaleDateString('en-NG',{month:'long',year:'numeric'})?<Text style={n.month}>{new Date(item.createdAt).toLocaleDateString('en-NG',{month:'long',year:'numeric'})}</Text>:null}
        <View style={n.trip}><View style={n.tripIcon}><Text style={n.vehicleIcon}>▰</Text></View><View style={{flex:1}}><Text style={n.suggestionText}>{item.rideClass.replaceAll('_',' ')} ride</Text><Text style={n.muted}>{new Date(item.createdAt).toLocaleString('en-NG')} · {item.status.replaceAll('_',' ')}</Text><Pressable onPress={()=>void Linking.openURL(`${payWeb}/?section=support&category=DRIVE&rideId=${encodeURIComponent(item.id)}`)}><Text style={n.link}>Get trip help</Text></Pressable></View><Text style={n.summaryText}>{currency(item.totalMinor,item.currency)}</Text></View>
      </View>) : <Text style={n.muted}>{signed?'Your rides will appear here.':'Sign in to see your activity.'}</Text>}
    </ScrollView> : <DriveAccountMobile signed={signed} payWeb={payWeb} wallet={wallet ? { ...wallet.wallet, heldFareMinor: wallet.heldFareMinor } : null} onRefresh={() => void refresh()} onLogin={()=>void login()} onLogout={()=>void logout()} />}
    <View style={n.tabs} accessibilityRole="tablist">
      {([['home','⌂','Home'],['activity','▤','Activity'],['account','◎','Account']] as const).map(item=><Pressable key={item[0]} accessibilityRole="tab" accessibilityState={{selected:tab===item[0]}} style={n.tabButton} onPress={()=>setTab(item[0])}><Text style={[n.tabIcon,tab===item[0]&&n.tabActive]}>{item[1]}</Text><Text style={[n.tabText,tab===item[0]&&n.tabActive]}>{item[2]}</Text></Pressable>)}
    </View>
  </SafeAreaView>;
}

const n = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#fff'},home:{flex:1,backgroundColor:'#e6ebe7'},map:{flex:1,position:'relative',overflow:'hidden',backgroundColor:'#dce8e0'},mapTop:{position:'absolute',top:17,right:14,padding:9,borderRadius:11,backgroundColor:'#ffffffef'},mapLabel:{fontSize:10,fontWeight:'600',color:'#577064'},locate:{position:'absolute',bottom:154,right:19,width:52,height:52,borderRadius:26,backgroundColor:'#fff',justifyContent:'center',alignItems:'center',elevation:5},locateText:{fontSize:29,color:'#223b31'},
  sheet:{backgroundColor:'#fff',borderTopLeftRadius:25,borderTopRightRadius:25,paddingHorizontal:18,paddingTop:13,paddingBottom:15,maxHeight:'79%'},openScroll:{flexGrow:0},sheetContent:{paddingBottom:13},handle:{width:44,height:5,borderRadius:10,backgroundColor:'#d8dddd',alignSelf:'center',marginBottom:16},start:{paddingBottom:12},heading:{fontSize:27,color:'#19221f',fontWeight:'800',letterSpacing:-1,marginBottom:15},searchRow:{flexDirection:'row',gap:9},search:{flex:1,height:61,paddingHorizontal:15,backgroundColor:'#f1f4f4',borderRadius:14,flexDirection:'row',alignItems:'center',gap:9},searchIcon:{fontSize:29,color:'#202b28'},searchText:{fontSize:18,color:'#1d2925',fontWeight:'700'},later:{borderRadius:13,backgroundColor:'#f1f4f4',paddingHorizontal:13,justifyContent:'center'},laterText:{fontSize:13,color:'#293c36',fontWeight:'600'},
  back:{fontSize:15,fontWeight:'700',color:'#2b5749',marginBottom:13},sectionTitle:{fontSize:22,color:'#1d2822',fontWeight:'800',marginBottom:13},eyebrow:{fontSize:10,fontWeight:'700',color:'#83938b',letterSpacing:1,marginTop:4,marginBottom:6},summary:{backgroundColor:'#f4f7f5',borderRadius:12,padding:12,marginVertical:8},summaryText:{fontSize:13,fontWeight:'700',color:'#263c30'},searchInput:{minHeight:49,borderRadius:12,backgroundColor:'#f2f5f3',paddingHorizontal:15,paddingVertical:12,marginVertical:10,fontSize:14,color:'#21342c'},suggestion:{flexDirection:'row',alignItems:'center',gap:17,paddingVertical:15,borderBottomColor:'#e8ece9',borderBottomWidth:1},suggestionIcon:{fontSize:22,color:'#52655b'},suggestionText:{fontSize:15,fontWeight:'700',color:'#202e26'},muted:{fontSize:12,color:'#78857c',lineHeight:18,marginTop:3},fareCaveat:{fontSize:11,color:'#8b6a36',lineHeight:17,marginVertical:10},
  vehicle:{flexDirection:'row',alignItems:'center',gap:12,padding:11,borderWidth:1,borderColor:'#e8ede9',borderRadius:13,marginVertical:3},selected:{backgroundColor:'#eef9f1',borderColor:'#0e8b72'},vehicleIcon:{fontSize:28,color:'#22684f'},vehicleName:{fontSize:15,fontWeight:'800',color:'#172d23'},radio:{fontSize:18,color:'#0e8b72'},actionRow:{flexDirection:'row',gap:8,marginTop:10,flexWrap:'wrap'},segment:{flex:1,alignItems:'center',backgroundColor:'#f2f6f3',paddingVertical:11,borderRadius:11},segmentSelected:{backgroundColor:'#dcf3e7'},miniButton:{borderRadius:10,backgroundColor:'#f1f5f2',padding:11,alignItems:'center'},miniButtonText:{fontSize:13,fontWeight:'700',color:'#1b4638'},primary:{borderRadius:12,minHeight:52,backgroundColor:'#172521',alignItems:'center',justifyContent:'center',marginTop:12},primaryText:{fontSize:15,fontWeight:'800',color:'#fff'},disabled:{opacity:.5},price:{fontSize:41,fontWeight:'800',letterSpacing:-2,color:'#172620'},fareBreakdown:{borderTopWidth:1,borderTopColor:'#e8eee9',paddingTop:10,marginTop:15},fareLine:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:7,borderBottomWidth:1,borderBottomColor:'#f0f4f1'},link:{fontSize:12,fontWeight:'700',color:'#126951',paddingVertical:9},pin:{fontSize:31,letterSpacing:4,fontWeight:'900',color:'#16281b'},secondary:{padding:12,alignItems:'center',marginTop:10},danger:{borderRadius:10,backgroundColor:'#9d2228',padding:11,alignItems:'center'},dangerText:{fontSize:13,fontWeight:'800',color:'#fff'},error:{padding:10,backgroundColor:'#fff0ee',borderRadius:10,marginBottom:7},errorText:{color:'#9f3030',fontSize:12},notice:{padding:10,backgroundColor:'#eff9ef',borderRadius:10,marginBottom:7},noticeText:{color:'#1d6542',fontSize:12},
  walletContextButton:{backgroundColor:'#071423',borderRadius:11,minHeight:38,paddingHorizontal:14,justifyContent:'center'},walletContextText:{color:'#B7F1F1',fontSize:13,fontWeight:'800'},
  tabs:{height:67,backgroundColor:'#fff',flexDirection:'row',justifyContent:'space-around',alignItems:'center',borderTopColor:'#e9eeeb',borderTopWidth:1},tabButton:{minWidth:77,alignItems:'center',gap:0},tabIcon:{fontSize:28,color:'#9ca5a0'},tabText:{fontSize:12,color:'#8d9b94'},tabActive:{color:'#1b2d22',fontWeight:'800'},page:{flex:1,backgroundColor:'#fff'},pageContent:{paddingHorizontal:25,paddingTop:30,paddingBottom:70},pageTitle:{fontSize:35,fontWeight:'800',color:'#19251f',letterSpacing:-1.2,marginBottom:30},month:{fontSize:23,fontWeight:'800',color:'#25312c',marginTop:20,marginBottom:12},trip:{flexDirection:'row',alignItems:'flex-start',gap:13,paddingVertical:18,borderBottomWidth:1,borderBottomColor:'#e9eeeb'},tripIcon:{width:62,height:60,backgroundColor:'#f1f4f4',borderRadius:12,alignItems:'center',justifyContent:'center'},profile:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:21,borderBottomColor:'#e9efea',borderBottomWidth:1,marginBottom:12},profileIcon:{width:56,height:56,backgroundColor:'#f0f3f3',borderRadius:28,alignItems:'center',justifyContent:'center'},setting:{flexDirection:'row',alignItems:'center',gap:15,paddingVertical:20,borderBottomWidth:1,borderBottomColor:'#edf1ee'},settingIcon:{fontSize:25,color:'#445a4d',width:28,textAlign:'center'},settingArrow:{fontSize:24,color:'#9aa9a0'},accountHint:{marginTop:21,fontSize:12,color:'#839087'},
});
const s=StyleSheet.create({
  roadOne:{position:'absolute',width:550,height:45,backgroundColor:'#f9fbf7',transform:[{rotate:'33deg'}],top:130,left:-70,borderWidth:2,borderColor:'#bdd7c9'},
  roadTwo:{position:'absolute',width:550,height:33,backgroundColor:'#fcfdf6',transform:[{rotate:'-32deg'}],top:89,left:-80,borderWidth:2,borderColor:'#bfd5c6'},
  roadThree:{position:'absolute',width:470,height:22,backgroundColor:'#fdf9e1',transform:[{rotate:'85deg'}],top:150,left:80},
  roadFour:{position:'absolute',width:450,height:18,backgroundColor:'#eaf4e7',transform:[{rotate:'-68deg'}],top:146,left:110},
  mapPin:{position:'absolute',alignItems:'center'},
  pinText:{fontSize:31,color:'#00a78e'},
  pinLabel:{fontSize:10,fontWeight:'800',backgroundColor:'#fff',color:'#153b2c',paddingHorizontal:8,paddingVertical:5,borderRadius:12,overflow:'hidden'},
});
