import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, EmptyState, Screen, SectionTitle, colors } from "@bazaara/mobile-ui";
import { money } from "@/lib/types";
import { useCartState } from "@/state/cart";

export default function CartPage() {
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const { cart, busyVariantId, refresh, setVariantQuantity } = useCartState();
  const load = useCallback(async () => { setError(""); try { await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load cart"); } }, [refresh]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { void load(); }, [load]);
  async function change(variantId:string,quantity:number){setError("");try{await setVariantQuantity(variantId,quantity);}catch(cause){setError(cause instanceof Error?cause.message:"Could not update cart");}}

  const hasItems=Boolean(cart?.items.length);
  return <Screen scroll={false} style={styles.screen}>
    <SectionTitle eyebrow="Your basket" title={`Cart${cart?` (${cart.itemCount})`:""}`}/>
    {error?<Text style={styles.error}>{error}</Text>:null}
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent,hasItems&&styles.scrollContentWithFooter,{paddingBottom:hasItems?132+insets.bottom:18}]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {!cart?<Text style={styles.muted}>Loading cart…</Text>:cart.items.length===0?<EmptyState title="Your cart is empty" message="Add products from Shopping. BazID is required only when checkout begins." action={<Button label="Start shopping" onPress={()=>router.push("/(tabs)")}/>}/>:<View style={styles.list}>{cart.items.map(item=>{const busy=busyVariantId===item.variant.id;return <Card key={item.id} style={styles.item}><Pressable onPress={()=>router.push({pathname:"/product/[slug]",params:{slug:item.product.slug}})}>{item.product.image?<Image source={{uri:item.product.image.url}} style={styles.image}/>:<View style={styles.image}/>}</Pressable><View style={styles.copy}><Pressable onPress={()=>router.push({pathname:"/product/[slug]",params:{slug:item.product.slug}})}><Text maxFontSizeMultiplier={1.08} numberOfLines={2} style={styles.title}>{item.product.title}</Text></Pressable><Text maxFontSizeMultiplier={1.08} numberOfLines={1} style={styles.meta}>{item.variant.title} · {item.seller.name}</Text><Text maxFontSizeMultiplier={1.08} style={styles.price}>{money(item.lineTotalMinor,cart.currency)}</Text><View style={styles.qty}><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void change(item.variant.id,item.quantity-1)} style={({pressed})=>[styles.qtyButton,pressed&&styles.pressed,busy&&styles.disabled]}><Text style={styles.qtyText}>−</Text></Pressable><Text maxFontSizeMultiplier={1.05} style={styles.qtyValue}>{item.quantity}</Text><Pressable accessibilityRole="button" disabled={busy||item.quantity>=item.availableQuantity} onPress={()=>void change(item.variant.id,item.quantity+1)} style={({pressed})=>[styles.qtyButton,pressed&&styles.pressed,(busy||item.quantity>=item.availableQuantity)&&styles.disabled]}><Text style={styles.qtyText}>+</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void change(item.variant.id,0)} hitSlop={7}><Text maxFontSizeMultiplier={1.08} style={styles.remove}>Remove</Text></Pressable></View></View></Card>;})}</View>}
    </ScrollView>
    {cart&&cart.items.length>0?<View style={[styles.stickyFooter,{paddingBottom:Math.max(10,insets.bottom+6)}]}><View style={styles.summaryRow}><View><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.note}>Delivery and discounts at checkout</Text></View><Text style={styles.total}>{money(cart.subtotalMinor,cart.currency)}</Text></View><Button label="Continue to checkout" kind="orange" onPress={()=>router.push("/checkout")}/></View>:null}
  </Screen>;
}

const styles=StyleSheet.create({screen:{flex:1,paddingBottom:112},scroll:{flex:1},scrollContent:{paddingBottom:18},scrollContentWithFooter:{paddingBottom:118},list:{gap:8},item:{flexDirection:"row",gap:10,padding:10},image:{width:82,height:82,borderRadius:10,backgroundColor:"#E7EBF2"},copy:{flex:1,minWidth:0},title:{color:colors.text,fontWeight:"800",fontSize:13,lineHeight:17},meta:{color:colors.muted2,fontSize:9,marginTop:3},price:{color:colors.orange,fontWeight:"900",fontSize:15,marginTop:5},qty:{flexDirection:"row",alignItems:"center",gap:7,marginTop:7,flexWrap:"wrap"},qtyButton:{width:36,height:36,alignItems:"center",justifyContent:"center",borderRadius:9,backgroundColor:colors.indigo,borderWidth:1,borderColor:colors.indigoBright},qtyText:{color:colors.text,fontSize:18,fontWeight:"800"},qtyValue:{minWidth:20,color:colors.text,fontWeight:"900",textAlign:"center",fontSize:12},remove:{color:"#FCA5A5",fontWeight:"800",fontSize:10,marginLeft:3},pressed:{opacity:.72},disabled:{opacity:.45},stickyFooter:{position:"absolute",left:0,right:0,bottom:0,paddingHorizontal:16,paddingTop:10,paddingBottom:10,borderTopWidth:1,borderTopColor:colors.borderStrong,backgroundColor:colors.card,gap:9,shadowColor:"#000",shadowOpacity:.22,shadowRadius:10,shadowOffset:{width:0,height:-4},elevation:12},summaryRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:10},summaryLabel:{color:colors.text,fontSize:11,fontWeight:"900"},total:{color:colors.orange,fontSize:19,fontWeight:"900"},note:{color:colors.muted2,fontSize:8,marginTop:2},muted:{color:colors.muted},error:{color:"#FCA5A5",marginBottom:9,fontSize:11}});
