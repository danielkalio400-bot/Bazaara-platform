import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Screen, useMobileLayout } from "@bazaara/mobile-ui";
import { foodApi } from "@/lib/api";
import { foodStyles as s } from "@/ui/theme";

type SavedAddress = {
  id: string;
  label: string;
  street: string;
  city: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Loc = { latitude:number; longitude:number; label:string; detail?:string };
const KEY="bazaara.food.mobile.location";

function addressDetail(address:SavedAddress){
  return [address.street,address.city,address.region].filter(Boolean).join(", ");
}

export default function FoodLocationScreen(){
  const layout=useMobileLayout();
  const[addresses,setAddresses]=useState<SavedAddress[]>([]);
  const[current,setCurrent]=useState<Loc|null>(null);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState("");

  useEffect(()=>{void(async()=>{
    const saved=await SecureStore.getItemAsync(KEY);
    if(saved){try{setCurrent(JSON.parse(saved) as Loc)}catch{}}
    try{
      const result=await foodApi.get<{addresses:SavedAddress[]}>("/v1/addresses",{cache:"no-store"});
      setAddresses(result.addresses);
    }catch{
      setAddresses([]);
    }
  })()},[]);

  async function persist(next:Loc){
    await SecureStore.setItemAsync(KEY,JSON.stringify(next));
    setCurrent(next);
    router.back();
  }

  async function useCurrentLocation(){
    setBusy(true);setError("");
    try{
      const permission=await Location.requestForegroundPermissionsAsync();
      if(permission.status!=="granted")throw new Error("Allow location access so Bazaara can show restaurants that deliver to you.");
      const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
      await persist({
        latitude:Number(pos.coords.latitude.toFixed(7)),
        longitude:Number(pos.coords.longitude.toFixed(7)),
        label:"Current location",
        detail:`Live device pin · ~${Math.max(1,Math.round(pos.coords.accuracy??0))} m accuracy`,
      });
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Could not get your location");
    }finally{setBusy(false)}
  }

  async function choose(address:SavedAddress){
    if(address.latitude==null||address.longitude==null){
      setError("This saved address needs a map pin before it can control nearby delivery.");
      return;
    }
    await persist({
      latitude:address.latitude,
      longitude:address.longitude,
      label:address.label||address.city||"Saved address",
      detail:addressDetail(address),
    });
  }

  return <Screen tabBarSafe={false}>
    <View style={[s.locationMapPreview,{height:layout.tablet?320:layout.compact?190:238}]}>
      <View style={s.locationMapGrid}/>
      <View style={s.locationMapPin}><Text style={s.locationMapPinText}>⌖</Text></View>
      <View style={s.locationMapTitle}><Text style={s.locationMapTitleText}>{current?.label||"Choose a delivery point"}</Text></View>
      <View style={s.locationMapBrand}><Text style={s.locationMapBrandMain}>BAZAARA</Text><Text style={s.locationMapBrandSub}>MAPS · PREVIEW</Text></View>
      <Pressable style={s.locationClose} onPress={()=>router.back()}><Text style={s.locationCloseText}>×</Text></Pressable>
    </View>

    <ScrollView contentContainerStyle={s.locationSheetBody}>
      <Text style={s.locationSheetEyebrow}>SMART DELIVERY AREA</Text>
      <Text style={s.locationSheetTitle}>Where should we deliver?</Text>
      <Text style={s.locationSheetCopy}>Your selected pin controls nearby restaurants, distance and delivery availability.</Text>

      <Pressable style={s.locationCurrentRow} disabled={busy} onPress={()=>void useCurrentLocation()}>
        <Text style={s.locationRowIcon}>↗</Text>
        <View style={{flex:1}}>
          <Text style={s.locationRowTitle}>{busy?"Finding your location…":"Use current location"}</Text>
          <Text style={s.locationRowCopy}>Recommended · high-accuracy device pin</Text>
        </View>
        <Text style={s.locationRowAction}>Use</Text>
      </Pressable>

      <View style={s.locationSavedHead}>
        <Text style={s.locationSavedTitle}>Saved places</Text>
        <Text style={s.locationSavedCount}>{addresses.length} saved</Text>
      </View>

      {addresses.map(address=><Pressable key={address.id} style={s.locationSavedRow} onPress={()=>void choose(address)}>
        <Text style={s.locationRowIcon}>{address.label?.toLowerCase().includes("home")?"⌂":"◇"}</Text>
        <View style={{flex:1}}>
          <Text style={s.locationRowTitle}>{address.label||address.city||"Saved address"}</Text>
          <Text numberOfLines={2} style={s.locationRowCopy}>{addressDetail(address)||"Saved Bazaara address"}</Text>
        </View>
        <Text style={s.locationRowAction}>{address.latitude!=null&&address.longitude!=null?"›":"Add pin"}</Text>
      </Pressable>)}

      {error?<Text style={s.error}>{error}</Text>:null}
      <Pressable style={[s.secondary,{marginTop:14}]} onPress={()=>void useCurrentLocation()}>
        <Text style={s.secondaryText}>＋ Add a new delivery point</Text>
      </Pressable>
    </ScrollView>
  </Screen>
}
