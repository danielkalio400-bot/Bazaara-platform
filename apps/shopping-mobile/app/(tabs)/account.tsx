import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Card, Screen, colors } from "@bazaara/mobile-ui";
import { ShoppingSearchBar } from "@/components/shopping-search-bar";
import { publicApi } from "@/lib/api";
import { createBazIdAccount, isSignedIn, signInWithBazId, signOutNative } from "@/lib/auth";
import type { BazIdUser } from "@bazaara/bazid-client";
import { useCartState } from "@/state/cart";
import { registerPushNotifications } from "@/lib/notifications";

type PanelKey = "contact" | "preferences" | "security" | null;
type AccountStyles = {
  accountBand: ViewStyle; bandEyebrow: TextStyle; bandTitle: TextStyle; bandCopy: TextStyle;
  profile: ViewStyle; avatar: ViewStyle; avatarText: TextStyle; profileCopy: ViewStyle; name: TextStyle; email: TextStyle;
  connected: ViewStyle; connectedDot: ViewStyle; connectedText: TextStyle; quickGrid: ViewStyle; quick: ViewStyle; quickIcon: TextStyle; quickTitle: TextStyle;
  groupTitle: TextStyle; menuCard: ViewStyle; row: ViewStyle; pressed: ViewStyle; rowIcon: ViewStyle; dangerIcon: ViewStyle; rowIconText: TextStyle; rowCopy: ViewStyle;
  rowTitle: TextStyle; rowDetail: TextStyle; chevron: TextStyle; dangerText: TextStyle; inlinePanel: ViewStyle; inlineTitle: TextStyle; inlineValue: TextStyle; inlineCopy: TextStyle;
  signedOut: ViewStyle; copy: TextStyle; muted: TextStyle; error: TextStyle;
};


function AccountRow({ icon, title, detail, onPress, tone = "normal" }: { icon:string; title:string; detail:string; onPress?:()=>void; tone?:"normal"|"danger" }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[styles.row,pressed&&styles.pressed]}><View style={[styles.rowIcon,tone==="danger"&&styles.dangerIcon]}><Text style={styles.rowIconText}>{icon}</Text></View><View style={styles.rowCopy}><Text style={[styles.rowTitle,tone==="danger"&&styles.dangerText]}>{title}</Text><Text numberOfLines={2} style={styles.rowDetail}>{detail}</Text></View><Text style={styles.chevron}>›</Text></Pressable>;
}

export default function AccountPage() {
  const [user, setUser] = useState<BazIdUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionFailed, setSessionFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query,setQuery]=useState("");
  const [panel,setPanel]=useState<PanelKey>(null);
  const { refresh: refreshCart } = useCartState();

  const load = useCallback(async () => {
    setChecking(true);
    setSessionFailed(false);
    setError("");
    try {
      if (!(await isSignedIn())) { setUser(null); return; }
      const body = await publicApi.get<{ user: BazIdUser }>("/v1/bazid/me");
      setUser(body.user);
      void registerPushNotifications().catch(() => undefined);
    } catch (cause) {
      setSessionFailed(true);
      setError(cause instanceof Error ? cause.message : "Could not check BazID session");
    } finally { setChecking(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const primaryEmail=useMemo(()=>user?.emails?.find(item=>item.isPrimary)?.email??user?.emails?.[0]?.email??"Connected through BazID",[user]);

  function submitSearch(){const q=query.trim();router.push(q?{pathname:"/search-results",params:{q}}:"/search-results");}
  async function signIn() { setBusy(true); setError(""); try { const result=await signInWithBazId(); if(result.ok){await load();await refreshCart();} else if(result.reason!=="dismiss"&&result.reason!=="cancel")setError("BazID authorization did not complete."); } catch(cause){setError(cause instanceof Error?cause.message:"BazID sign-in failed");} finally{setBusy(false);} }
  async function createAccount() { setBusy(true); setError(""); try { const result=await createBazIdAccount(); if(result.ok){await load();await refreshCart();} else if(result.reason!=="dismiss"&&result.reason!=="cancel")setError("BazID account creation did not complete."); } catch(cause){setError(cause instanceof Error?cause.message:"BazID account creation failed");} finally{setBusy(false);} }
  async function signOut(){setBusy(true);try{await signOutNative();setUser(null);setPanel(null);await refreshCart();}finally{setBusy(false);}}

  return <Screen>
    <ShoppingSearchBar value={query} onChangeText={setQuery} onSubmit={submitSearch}/>
    <View style={styles.accountBand}><Text style={styles.bandEyebrow}>GO</Text><Text style={styles.bandTitle}>Account</Text><Text style={styles.bandCopy}>Orders, saved items, delivery details and BazID security.</Text></View>
    {error?<Text style={styles.error}>{error}</Text>:null}
    {checking?<Text style={styles.muted}>Checking BazID session…</Text>:sessionFailed?<Card style={styles.signedOut}><Text style={styles.name}>BazID connection unavailable</Text><Text style={styles.copy}>Your account was not treated as signed out. Restore the BazID/API connection, then retry.</Text><Button label="Retry session" loading={busy} onPress={()=>void load()}/></Card>:user?<>
      <Card style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{(user.displayName||primaryEmail||"B").trim().slice(0,1).toUpperCase()}</Text></View><View style={styles.profileCopy}><Text numberOfLines={1} style={styles.name}>{user.displayName||"BazID account"}</Text><Text numberOfLines={1} style={styles.email}>{primaryEmail}</Text><View style={styles.connected}><View style={styles.connectedDot}/><Text style={styles.connectedText}>BazID connected</Text></View></View></Card>
      <View style={styles.quickGrid}><Pressable onPress={()=>router.push("/(tabs)/orders")} style={styles.quick}><Text style={styles.quickIcon}>▤</Text><Text style={styles.quickTitle}>Orders</Text></Pressable><Pressable onPress={()=>router.push("/(tabs)/wishlist")} style={styles.quick}><Text style={styles.quickIcon}>♡</Text><Text style={styles.quickTitle}>Wishlist</Text></Pressable><Pressable onPress={()=>router.push("/(tabs)/cart")} style={styles.quick}><Text style={styles.quickIcon}>🛒</Text><Text style={styles.quickTitle}>Cart</Text></Pressable></View>
      <Text style={styles.groupTitle}>Commerce account</Text><Card style={styles.menuCard}><AccountRow icon="⌂" title="Address Book" detail="Delivery addresses are selected and confirmed securely during checkout." onPress={()=>router.push("/checkout")}/><AccountRow icon="◉" title="Grocery lists" detail="Reusable essentials synced to your BazID account" onPress={()=>router.push("/grocery-lists")}/><AccountRow icon="@" title="Contact details" detail={primaryEmail} onPress={()=>setPanel(panel==="contact"?null:"contact")}/><AccountRow icon="⚙" title="Settings" detail="Commerce preferences and account controls" onPress={()=>setPanel(panel==="preferences"?null:"preferences")}/><AccountRow icon="◷" title="Recently viewed" detail="Return to products you were browsing" onPress={()=>router.push("/search-results")}/></Card>
      {panel==="contact"?<Card style={styles.inlinePanel}><Text style={styles.inlineTitle}>Contact details</Text><Text style={styles.inlineValue}>{primaryEmail}</Text><Text style={styles.inlineCopy}>Identity and verified contact changes remain controlled by BazID.</Text></Card>:null}
      {panel==="preferences"?<Card style={styles.inlinePanel}><Text style={styles.inlineTitle}>Preferences</Text><Text style={styles.inlineCopy}>GO keeps marketplace, grocery, cart and Wishlist actions in this app. Identity, verification and session security stay with BazID.</Text></Card>:null}
      <Text style={styles.groupTitle}>Support & security</Text><Card style={styles.menuCard}><AccountRow icon="?" title="Help & support" detail="Order, delivery, payment and return assistance" onPress={()=>router.push("/support")}/><AccountRow icon="!" title="Notifications" detail="Order, payment and refund updates" onPress={()=>router.push("/notifications")}/><AccountRow icon="✓" title="BazID security" detail="Connected identity · session protected" onPress={()=>setPanel(panel==="security"?null:"security")}/><AccountRow icon="↗" title="Preferences" detail="Language and shopping experience" onPress={()=>setPanel(panel==="preferences"?null:"preferences")}/><AccountRow icon="⇥" title="Sign out" detail="End this BazID session on this device" tone="danger" onPress={()=>void signOut()}/></Card>
      {panel==="security"?<Card style={styles.inlinePanel}><View style={styles.connected}><View style={styles.connectedDot}/><Text style={styles.connectedText}>BazID session active</Text></View><Text style={styles.inlineCopy}>Signed-in customers are shown as BazID-connected. Security-sensitive identity changes are not duplicated inside Shopping.</Text></Card>:null}
    </>:<Card style={styles.signedOut}><View style={styles.avatar}><Text style={styles.avatarText}>B</Text></View><Text style={styles.name}>Sign in to GO</Text><Text style={styles.copy}>Browse and build your cart as a guest. BazID is required for checkout, Wishlist and order history.</Text><Button label="Continue with BazID" loading={busy} onPress={()=>void signIn()}/><Button label="Create BazID account" kind="secondary" loading={busy} onPress={()=>void createAccount()}/></Card>}
  </Screen>;
}

const styles=StyleSheet.create<AccountStyles>({
  accountBand:{marginTop:12,borderRadius:18,padding:18,backgroundColor:colors.blue},bandEyebrow:{color:"#DBEAFE",fontSize:10,fontWeight:"900",letterSpacing:1.1,textTransform:"uppercase"},bandTitle:{color:colors.white,fontSize:28,lineHeight:32,fontWeight:"900",marginTop:3},bandCopy:{color:"#E0EAFF",fontSize:11,lineHeight:16,marginTop:5,maxWidth:310},
  profile:{marginTop:12,flexDirection:"row",alignItems:"center",gap:12,padding:14},avatar:{width:54,height:54,borderRadius:27,backgroundColor:colors.indigo,alignItems:"center",justifyContent:"center",borderWidth:2,borderColor:colors.indigoBright},avatarText:{color:colors.white,fontSize:22,fontWeight:"900"},profileCopy:{flex:1,minWidth:0},name:{color:colors.text,fontSize:18,fontWeight:"900"},email:{color:colors.muted,fontSize:10,marginTop:3},connected:{flexDirection:"row",alignItems:"center",gap:6,marginTop:6},connectedDot:{width:7,height:7,borderRadius:5,backgroundColor:colors.green},connectedText:{color:colors.green,fontSize:10,fontWeight:"900"},
  quickGrid:{flexDirection:"row",gap:8,marginTop:9},quick:{flex:1,minHeight:70,borderRadius:13,borderWidth:1,borderColor:colors.borderStrong,backgroundColor:colors.surface,alignItems:"center",justifyContent:"center",gap:5},quickIcon:{color:colors.indigoBright,fontSize:19,fontWeight:"800"},quickTitle:{color:colors.text,fontSize:10,fontWeight:"800"},groupTitle:{color:colors.muted2,fontSize:9,fontWeight:"900",textTransform:"uppercase",letterSpacing:1,marginTop:18,marginBottom:7,marginLeft:2},menuCard:{padding:0,overflow:"hidden"},row:{minHeight:67,flexDirection:"row",alignItems:"center",paddingHorizontal:12,paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.border,gap:10},pressed:{opacity:.72},rowIcon:{width:34,height:34,borderRadius:10,backgroundColor:colors.card,alignItems:"center",justifyContent:"center"},dangerIcon:{backgroundColor:"rgba(239,68,68,.13)"},rowIconText:{color:colors.indigoBright,fontSize:16,fontWeight:"900"},rowCopy:{flex:1,minWidth:0},rowTitle:{color:colors.text,fontSize:12,fontWeight:"800"},rowDetail:{color:colors.muted,fontSize:9,lineHeight:13,marginTop:2},chevron:{color:colors.muted2,fontSize:25,fontWeight:"300"},dangerText:{color:"#FCA5A5"},inlinePanel:{marginTop:8,gap:5},inlineTitle:{color:colors.text,fontSize:12,fontWeight:"900"},inlineValue:{color:colors.indigoBright,fontSize:11,fontWeight:"800"},inlineCopy:{color:colors.muted,fontSize:10,lineHeight:15},signedOut:{marginTop:12,gap:10,alignItems:"stretch"},copy:{color:colors.muted,fontSize:12,lineHeight:18,marginBottom:2},muted:{color:colors.muted,marginTop:14},error:{color:"#FCA5A5",marginTop:9,fontSize:11},
});
