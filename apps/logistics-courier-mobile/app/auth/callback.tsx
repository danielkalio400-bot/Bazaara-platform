import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BAZAARA_GO_REDIRECT_URI, completeBazIdCallback } from "../../src/lib/auth";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default function AuthCallback(){
  const params=useLocalSearchParams<{code?:string|string[];state?:string|string[];error?:string|string[];error_description?:string|string[]}>();
  const[message,setMessage]=useState("Completing secure BazID sign-in…"); const[failed,setFailed]=useState(false);
  const callbackUrl=useMemo(()=>{const url=new URL(BAZAARA_GO_REDIRECT_URI); for(const [key,value] of Object.entries({code:first(params.code),state:first(params.state),error:first(params.error),error_description:first(params.error_description)})){if(value)url.searchParams.set(key,value)} return url.toString()},[params.code,params.state,params.error,params.error_description]);
  useEffect(()=>{const code=first(params.code),state=first(params.state),oauthError=first(params.error); if(!oauthError&&(!code||!state)){setMessage("Waiting for BazID callback…");return;} let active=true; void (async()=>{try{const result=await completeBazIdCallback(callbackUrl);if(!active)return;if(result.ok){setMessage("BazID connected. Returning to GO…");router.replace("/")}else{setFailed(true);setMessage("BazID sign-in did not complete.")}}catch(e){if(active){setFailed(true);setMessage(e instanceof Error?e.message:"BazID sign-in failed")}}})();return()=>{active=false}},[callbackUrl,params.code,params.state,params.error]);
  return <SafeAreaView style={{flex:1,backgroundColor:"#07110E"}}><View style={{flex:1,alignItems:"center",justifyContent:"center",padding:28,gap:16}}>{!failed?<ActivityIndicator size="large"/>:null}<Text style={{color:"#fff",fontSize:18,fontWeight:"800",textAlign:"center"}}>{message}</Text></View></SafeAreaView>
}
