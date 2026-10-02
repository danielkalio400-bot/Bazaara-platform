import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@bazaara/mobile-ui";
import { groceryApi } from "@/lib/api";
import { groceryPalette, groceryStyles as s } from "@/ui/theme";

type Plan={title:string;disclaimer:string;ingredients:Array<{label:string;quantity:number;note:string|null}>};
const prompts=["Weekly restock","Jollof for six","Breakfast week","Basket under ₦30,000"];
export default function GroceryAssistant(){
  const[prompt,setPrompt]=useState("");const[plan,setPlan]=useState<Plan|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  async function ask(value=prompt){const input=value.trim();if(!input)return;setPrompt(input);setBusy(true);setError("");try{setPlan(await groceryApi.post<Plan>("/v1/grocery/planner",{prompt:input}))}catch(cause){setError(cause instanceof Error?cause.message:"Could not build Grocery plan")}finally{setBusy(false)}}
  return <Screen tabBarSafe={false}><Text style={{color:groceryPalette.success,fontSize:7,fontWeight:"900",letterSpacing:.7}}>SMART GROCERY PLANNING</Text><Text style={s.h1}>Build the basket before you shop it.</Text><Text style={[s.p,{marginTop:5}]}>Start from a meal, a budget or a household restock. Grocery AI returns quantities and live Grocery suggestions.</Text>
    <View style={[s.wrap,{marginTop:12}]}>{prompts.map(item=><Pressable key={item} style={s.pill} onPress={()=>void ask(item)}><Text style={s.pillText}>{item}</Text></Pressable>)}</View>
    <View style={[s.card,{marginTop:12}]}><Text style={s.label}>WHAT DO YOU NEED?</Text><TextInput style={[s.input,{minHeight:100,marginTop:7,textAlignVertical:"top"}]} multiline value={prompt} onChangeText={setPrompt} placeholder="Plan one week of groceries for a family of four under ₦50,000" placeholderTextColor={groceryPalette.muted2}/><Pressable style={[s.button,{marginTop:9}]} disabled={busy||!prompt.trim()} onPress={()=>void ask()}><Text style={s.buttonText}>{busy?"Planning…":"Build plan"}</Text></Pressable></View>
    {error?<Text style={[s.error,{marginTop:9}]}>{error}</Text>:null}
    {plan?<View style={[s.card,{marginTop:12}]}><Text style={s.label}>YOUR PLAN</Text><Text style={[s.h2,{marginTop:4}]}>{plan.title}</Text>{plan.ingredients.map(item=><View key={item.label} style={[s.row,{justifyContent:"space-between",paddingVertical:9,borderBottomWidth:1,borderBottomColor:groceryPalette.line}]}><View style={{flex:1}}><Text style={s.name}>{item.label}</Text>{item.note?<Text style={s.small}>{item.note}</Text>:null}</View><Text style={s.price}>× {item.quantity}</Text></View>)}<Text style={[s.small,{marginTop:10}]}>{plan.disclaimer}</Text><View style={[s.row,{marginTop:10}]}><Pressable style={[s.secondary,{flex:1}]} onPress={()=>router.push("/(tabs)/lists")}><Text style={s.secondaryText}>Open lists</Text></Pressable><Pressable style={[s.button,{flex:1}]} onPress={()=>router.push("/(tabs)/search")}><Text style={s.buttonText}>Shop plan</Text></Pressable></View></View>:null}
    <View style={[s.card,{marginTop:12,backgroundColor:groceryPalette.surface2}]}><Text style={s.label}>STOCK RULE</Text><Text style={[s.name,{marginTop:3}]}>The branch confirms inventory.</Text><Text style={[s.p,{marginTop:3}]}>Grocery AI does not pretend stock exists. Availability is checked against the branch before checkout and again by the picker.</Text></View>
  </Screen>
}
