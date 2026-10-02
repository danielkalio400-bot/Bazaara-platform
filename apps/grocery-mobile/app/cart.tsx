import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { EmptyState, Screen } from "@bazaara/mobile-ui";
import { groceryApi, groceryCartRequest } from "@/lib/api";
import { groceryMoney, type GroceryCart, type GroceryCartItem } from "@/lib/grocery";
import { groceryPalette, groceryStyles as s } from "@/ui/theme";

export default function GroceryCartScreen(){
  const [cart,setCart]=useState<GroceryCart|null>(null);const[error,setError]=useState("");const[busy,setBusy]=useState("");const[notice,setNotice]=useState("");
  const load=useCallback(async()=>{try{const body=await groceryCartRequest<{cart:GroceryCart}>("/v1/grocery/cart",{method:"GET",cache:"no-store"});setCart(body.cart);setError("")}catch(cause){setError(cause instanceof Error?cause.message:"Could not load basket")}},[]);
  useEffect(()=>{void load()},[load]);
  async function qty(item:GroceryCartItem,next:number){if(next<1||next>item.availableQuantity)return;setBusy(item.id);try{const body=await groceryCartRequest<{cart:GroceryCart}>(`/v1/grocery/cart/items/${item.id}`,{method:"PATCH",body:{quantity:next}});setCart(body.cart)}catch(cause){setError(cause instanceof Error?cause.message:"Could not update quantity")}finally{setBusy("")}}
  async function save(item:GroceryCartItem){setBusy(`save:${item.id}`);try{await groceryApi.request(`/v1/shopping/wishlist/${item.product.id}?vertical=GROCERY`,{method:"PUT",body:{variantId:item.variant.id}});setNotice(`${item.product.title} saved.`);setError("")}catch(cause){setError(cause instanceof Error?cause.message:"Could not save this grocery")}finally{setBusy("")}}
  async function remove(item:GroceryCartItem){setBusy(item.id);try{const body=await groceryCartRequest<{cart:GroceryCart}>(`/v1/grocery/cart/items/${item.id}`,{method:"DELETE"});setCart(body.cart);setNotice(`Removed ${item.product.title}. Save it from Saved groceries if you still want it.`)}catch(cause){setError(cause instanceof Error?cause.message:"Could not remove item")}finally{setBusy("")}}
  if(!cart)return <Screen tabBarSafe={false}><EmptyState title="Grocery basket" message={error||"Loading basket…"}/></Screen>;
  if(!cart.items.length)return <Screen tabBarSafe={false}><EmptyState title="Your Grocery basket is empty" message="Add groceries and they will stay here across refreshes." action={<Pressable style={s.button} onPress={()=>router.replace("/(tabs)")}><Text style={s.buttonText}>Browse groceries</Text></Pressable>}/></Screen>;
  return <Screen tabBarSafe={false}>
    <View style={s.top}><View><Text style={{color:groceryPalette.success,fontSize:7,fontWeight:"900",letterSpacing:.7}}>GROCERY BASKET</Text><Text style={s.h1}>Your groceries</Text><Text style={s.p}>{cart.itemCount} items</Text></View><Text style={s.price}>{groceryMoney(cart.subtotalMinor,cart.currency)}</Text></View>
    {error?<Text style={s.error}>{error}</Text>:null}{notice?<Text style={s.success}>{notice}</Text>:null}
    <View style={[s.card,{marginBottom:10,backgroundColor:groceryPalette.surface2}]}><Text style={s.label}>STORE RESPONSIBILITY</Text><Text style={[s.name,{marginTop:3}]}>The branch checks what it has.</Text><Text style={[s.p,{marginTop:3}]}>Stock is revalidated and reserved at checkout. The picker only asks about a replacement if a reserved item cannot be found on the shelf.</Text></View>
    {cart.items.map(item=><View key={item.id} style={[s.card,{marginBottom:8}]}>
      <View style={[s.row,{justifyContent:"space-between",alignItems:"flex-start"}]}><View style={{flex:1}}><Text style={s.name}>{item.product.title}</Text><Text style={s.meta}>{item.seller.name} · {item.variant.title}</Text><Text style={[s.price,{marginTop:5}]}>{groceryMoney(item.lineTotalMinor)}</Text><Text style={[s.success,{marginTop:4}]}>{item.availableQuantity} available in branch inventory</Text></View><Pressable style={[s.secondary,{minHeight:36,paddingHorizontal:10}]} disabled={busy===`save:${item.id}`} onPress={()=>void save(item)}><Text style={[s.secondaryText,{fontSize:17}]}>♡</Text></Pressable></View>
      <View style={[s.row,{marginTop:10,justifyContent:"space-between"}]}><View style={s.row}><Pressable style={s.secondary} disabled={item.quantity<=1||busy===item.id} onPress={()=>void qty(item,item.quantity-1)}><Text style={s.secondaryText}>−</Text></Pressable><Text style={[s.name,{minWidth:26,textAlign:"center"}]}>{item.quantity}</Text><Pressable style={s.secondary} disabled={item.quantity>=item.availableQuantity||busy===item.id} onPress={()=>void qty(item,item.quantity+1)}><Text style={s.secondaryText}>+</Text></Pressable></View><Pressable onPress={()=>void remove(item)}><Text style={s.error}>Remove</Text></Pressable></View>
    </View>)}
    <View style={[s.card,{marginTop:4}]}><Text style={s.h2}>Price before checkout</Text><View style={[s.row,{justifyContent:"space-between",marginTop:8}]}><Text style={s.p}>Subtotal</Text><Text style={s.name}>{groceryMoney(cart.subtotalMinor,cart.currency)}</Text></View><View style={[s.row,{justifyContent:"space-between",marginTop:5}]}><Text style={s.p}>Service fee</Text><Text style={s.meta}>10–15% at checkout</Text></View><View style={[s.row,{justifyContent:"space-between",marginTop:5}]}><Text style={s.p}>Express</Text><Text style={s.meta}>10% · min ₦1k · max ₦5k</Text></View></View>
    <Pressable style={[s.button,{marginTop:12}]} onPress={()=>router.push("/checkout")}><Text style={s.buttonText}>Continue to checkout</Text></Pressable>
  </Screen>
}
