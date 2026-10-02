import { type ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { createApiClient } from "@bazaara/api-client";

const API = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:4000";
const GO_WEB = process.env.EXPO_PUBLIC_GO_WEB_BASE_URL ?? "http://localhost:3008";
const api = createApiClient({ baseUrl: API, credentials: "omit" });

type Quote = { id:string;serviceLevel:string;etaMinutes:number;amountMinor:number;currency:string;expiresAt:string };
type Track = { trackingCode:string;publicCode:string;status:string;fundingStatus:string;updatedAt:string;serviceLevel:string;etaMinutes:number };
type Caps = { advancePaymentRequired?:boolean;currency?:string;region?:string;commissionBps?:number };

const money=(minor=0,currency="NGN")=>new Intl.NumberFormat("en-NG",{style:"currency",currency,maximumFractionDigits:0}).format(minor/100);
const label=(value:string)=>value.replaceAll("_"," ").toLowerCase().replace(/^./,c=>c.toUpperCase());

export default function BazaaraGoMobile(){
  const {width}=useWindowDimensions();
  const tablet=width>=720;
  const[caps,setCaps]=useState<Caps|null>(null);
  const[quote,setQuote]=useState<Quote|null>(null);
  const[tracking,setTracking]=useState<Track|null>(null);
  const[busy,setBusy]=useState("");
  const[error,setError]=useState("");
  const[pickup,setPickup]=useState("");
  const[dropoff,setDropoff]=useState("");
  const[distanceKm,setDistanceKm]=useState("5");
  const[weightKg,setWeightKg]=useState("1");
  const[service,setService]=useState("BIKE");
  const[trackingCode,setTrackingCode]=useState("");

  const load=useCallback(async()=>{try{setCaps(await api.get<Caps>("/v1/logistics/capabilities"));setError("")}catch(e){setError(e instanceof Error?e.message:"Could not connect to GO")}},[]);
  useEffect(()=>{void load()},[load]);

  const serviceName=useMemo(()=>({BIKE:"Bike Express",CAR:"Car Courier",VAN:"Van"}[service]??service),[service]);

  async function getQuote(){
    if(!pickup.trim()||!dropoff.trim())return;
    setBusy("quote");setError("");
    try{
      const result=await api.post<Quote>("/v1/logistics/quotes",{
        pickup:{label:pickup.trim()},
        dropoff:{label:dropoff.trim()},
        serviceLevel:service,
        weightGrams:Math.max(1,Math.round(Number(weightKg||"1")*1000)),
        distanceMeters:Math.max(100,Math.round(Number(distanceKm||"1")*1000)),
      });
      setQuote(result);
    }catch(e){setError(e instanceof Error?e.message:"Could not create parcel quote")}finally{setBusy("")}
  }

  async function track(){
    if(!trackingCode.trim())return;
    setBusy("track");setError("");
    try{setTracking(await api.get<Track>(`/v1/logistics/tracking/${encodeURIComponent(trackingCode.trim())}`))}
    catch(e){setError(e instanceof Error?e.message:"Tracking code not found")}finally{setBusy("")}
  }

  async function openSecureBooking(){
    const url=`${GO_WEB.replace(/\/$/,"")}/?tab=parcels`;
    await Linking.openURL(url);
  }

  return <SafeAreaView style={s.page}><StatusBar style="light"/><ScrollView contentContainerStyle={[s.wrap,tablet&&s.wrapTablet]}>
    <View style={s.header}><View style={s.logo}><Text style={s.logoMark}>GO</Text><View><Text style={s.brand}>BAZAARA</Text><Text style={s.brandSub}>GO</Text></View></View><View style={s.live}><Text style={s.liveText}>PARCELS</Text></View></View>

    <View style={s.hero}><Text style={s.kicker}>ONE DELIVERY NETWORK</Text><Text style={s.heroTitle}>Send it. Track it.{"\n"}Stay in control.</Text><Text style={s.copy}>Native parcel quotes and tracking with secure Wallet booking on the full Go workspace.</Text><View style={s.metrics}><Metric label="PAYMENT" value={caps?.advancePaymentRequired?"100% advance":"Provider mode"}/><Metric label="REGION" value={caps?.region??"—"}/><Metric label="CURRENCY" value={caps?.currency??"NGN"}/></View></View>

    {error?<Text style={s.error}>{error}</Text>:null}

    <View style={[s.grid,tablet&&s.gridTablet]}>
      <View style={s.panel}><Text style={s.kicker}>PARCEL QUOTE</Text><Text style={s.h2}>Plan a delivery</Text><Field label="Pickup" value={pickup} onChangeText={setPickup} placeholder="Pickup address"/><Field label="Drop-off" value={dropoff} onChangeText={setDropoff} placeholder="Destination"/><View style={s.row}><Field flex label="Distance km" value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad"/><Field flex label="Weight kg" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad"/></View><Text style={s.label}>SERVICE</Text><View style={s.segment}>{["BIKE","CAR","VAN"].map(key=><Pressable key={key} style={[s.segmentButton,service===key&&s.segmentActive]} onPress={()=>setService(key)}><Text style={[s.segmentText,service===key&&s.segmentTextActive]}>{key}</Text></Pressable>)}</View><Pressable style={s.primary} disabled={busy==="quote"} onPress={()=>void getQuote()}><Text style={s.primaryText}>{busy==="quote"?"Quoting…":"Get live quote"}</Text></Pressable>
      {quote?<View style={s.quote}><View><Text style={s.kicker}>{serviceName}</Text><Text style={s.quotePrice}>{money(quote.amountMinor,quote.currency)}</Text></View><Text style={s.copy}>ETA {quote.etaMinutes} min · quote expires {new Date(quote.expiresAt).toLocaleTimeString()}</Text><Pressable style={s.primary} onPress={()=>void openSecureBooking()}><Text style={s.primaryText}>Pay securely & book</Text></Pressable><Text style={s.muted}>Booking opens the authenticated Go workspace so BazID and your 6-digit Pay PIN are never handled by an unauthenticated native screen.</Text></View>:null}</View>

      <View style={s.panel}><Text style={s.kicker}>TRACKING</Text><Text style={s.h2}>Find a parcel</Text><Field label="Tracking code" value={trackingCode} onChangeText={setTrackingCode} placeholder="TRK-…"/><Pressable style={s.secondary} disabled={busy==="track"} onPress={()=>void track()}><Text style={s.secondaryText}>{busy==="track"?"Tracking…":"Track parcel"}</Text></Pressable>{tracking?<View style={s.tracking}><Text style={s.kicker}>{tracking.publicCode}</Text><Text style={s.h2}>{label(tracking.status)}</Text><Text style={s.copy}>{tracking.serviceLevel} · ETA {tracking.etaMinutes} min</Text><Text style={s.muted}>{label(tracking.fundingStatus)} · updated {new Date(tracking.updatedAt).toLocaleString()}</Text></View>:null}<View style={s.support}><Text style={s.kicker}>NEED HELP?</Text><Text style={s.h3}>Operations support stays attached to the delivery.</Text><Pressable style={s.secondary} onPress={()=>void openSecureBooking()}><Text style={s.secondaryText}>Open Go support</Text></Pressable></View></View>
    </View>
  </ScrollView></SafeAreaView>
}

function Field({label,flex=false,...props}:{label:string;flex?:boolean}&ComponentProps<typeof TextInput>){return <View style={flex?{flex:1}:undefined}><Text style={s.label}>{label.toUpperCase()}</Text><TextInput {...props} placeholderTextColor="#647169" style={s.input}/></View>}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>}

const s=StyleSheet.create({
  page:{flex:1,backgroundColor:"#050813"},wrap:{padding:18,paddingBottom:42,gap:14},wrapTablet:{maxWidth:1100,width:"100%",alignSelf:"center",padding:28},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},logo:{flexDirection:"row",alignItems:"center",gap:9},logoMark:{width:42,height:42,borderRadius:13,backgroundColor:"#FF6B00",color:"#FFFFFF",fontWeight:"900",textAlign:"center",textAlignVertical:"center",paddingTop:11},brand:{color:"#fff",fontWeight:"900",fontSize:15,letterSpacing:-.3},brandSub:{color:"#FF7A14",fontWeight:"900",fontSize:10,letterSpacing:1.7},live:{borderWidth:1,borderColor:"#294033",borderRadius:999,paddingHorizontal:12,paddingVertical:8},liveText:{color:"#8EEA72",fontWeight:"900",fontSize:10,letterSpacing:1},
  hero:{borderWidth:1,borderColor:"#25375F",backgroundColor:"#09142E",borderRadius:24,padding:22,gap:10},kicker:{color:"#FF7A14",fontSize:10,fontWeight:"900",letterSpacing:1.35},heroTitle:{color:"#fff",fontSize:38,lineHeight:40,fontWeight:"900",letterSpacing:-1.4},copy:{color:"#A2AEA6",fontSize:14,lineHeight:20},metrics:{flexDirection:"row",gap:8,marginTop:7},metric:{flex:1,backgroundColor:"#07100C",borderWidth:1,borderColor:"#17291F",borderRadius:13,padding:10},metricLabel:{color:"#647169",fontSize:9,fontWeight:"800"},metricValue:{color:"#fff",fontSize:12,fontWeight:"900",marginTop:4},
  error:{color:"#FF9C9C",backgroundColor:"#271312",borderRadius:12,padding:12},grid:{gap:12},gridTablet:{flexDirection:"row",alignItems:"flex-start"},panel:{flex:1,borderWidth:1,borderColor:"#1B2A22",backgroundColor:"#0A100D",borderRadius:21,padding:18,gap:11},h2:{color:"#fff",fontSize:24,fontWeight:"900",letterSpacing:-.7},h3:{color:"#fff",fontSize:17,fontWeight:"900"},label:{color:"#7A877F",fontSize:9,fontWeight:"900",letterSpacing:1,marginBottom:5},input:{minHeight:48,borderWidth:1,borderColor:"#27382F",borderRadius:13,color:"#fff",paddingHorizontal:13,backgroundColor:"#07100C"},row:{flexDirection:"row",gap:8},segment:{flexDirection:"row",gap:6},segmentButton:{flex:1,minHeight:42,borderRadius:12,borderWidth:1,borderColor:"#27382F",alignItems:"center",justifyContent:"center"},segmentActive:{backgroundColor:"#FF6B00",borderColor:"#FF6B00"},segmentText:{color:"#9AA69E",fontWeight:"900",fontSize:11},segmentTextActive:{color:"#FFFFFF"},
  primary:{minHeight:50,borderRadius:14,backgroundColor:"#FF6B00",alignItems:"center",justifyContent:"center",paddingHorizontal:14},primaryText:{color:"#FFFFFF",fontWeight:"900",fontSize:14},secondary:{minHeight:48,borderRadius:14,borderWidth:1,borderColor:"#32513F",alignItems:"center",justifyContent:"center",paddingHorizontal:14},secondaryText:{color:"#D8FFE0",fontWeight:"900"},quote:{borderTopWidth:1,borderTopColor:"#1E3026",paddingTop:14,gap:10},quotePrice:{color:"#fff",fontSize:32,fontWeight:"900",letterSpacing:-1},muted:{color:"#647169",fontSize:11,lineHeight:16},tracking:{borderTopWidth:1,borderTopColor:"#1E3026",paddingTop:15,gap:5},support:{marginTop:8,borderTopWidth:1,borderTopColor:"#1E3026",paddingTop:14,gap:8},
});
