import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { EmptyState, Screen } from "@bazaara/mobile-ui";
import { foodApi } from "@/lib/api";
import { foodStyles as s } from "@/ui/theme";

type Deal = { id: string; code: string | null; title: string; description: string | null; discountType: string; value: number; restaurant: { slug: string; name: string }; endsAt: string };
export default function Deals() { const [deals,setDeals]=useState<Deal[]>([]);const[error,setError]=useState("");const load=useCallback(async()=>{try{const b=await foodApi.get<{deals:Deal[]}>("/v1/food/deals",{cache:"no-store"});setDeals(b.deals);setError("")}catch(e){setError(e instanceof Error?e.message:"Could not load deals")}},[]);useEffect(()=>{void load()},[load]);return <Screen tabBarSafe={false}><Text style={s.h1}>Deals</Text><Text style={s.p}>Current restaurant promotions. Eligibility is revalidated at checkout.</Text>{error?<Text style={s.error}>{error}</Text>:null}{!deals.length?<EmptyState title="No active deals" message={error||"New offers will appear here when restaurants publish them."}/>:deals.map(d=><Pressable key={d.id} style={[s.card,{marginTop:12}]} onPress={()=>router.push(`/restaurant/${d.restaurant.slug}`)}><Text style={s.status}>{d.restaurant.name}</Text><Text style={s.h2}>{d.title}</Text>{d.description?<Text style={s.p}>{d.description}</Text>:null}<Text style={s.price}>{d.discountType==="PERCENT"?`${d.value}% off`:`₦${Math.round(d.value/100).toLocaleString()} off`}{d.code?` · Code ${d.code}`:""}</Text><Text style={s.small}>Ends {new Date(d.endsAt).toLocaleString("en-NG")}</Text></Pressable>)}</Screen>}
