import { useCallback, useEffect, useState } from "react";
import { Pressable, Share, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EmptyState, Screen } from "@bazaara/mobile-ui";
import { ApiError, foodApi, foodCartRequest } from "@/lib/api";
import { foodMoney, type FoodCart } from "@/lib/food";
import { signInWithBazId } from "@/lib/auth";
import { foodStyles as s } from "@/ui/theme";

export default function FoodCartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [cart, setCart] = useState<FoodCart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [groupToken, setGroupToken] = useState("");

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const body = await foodCartRequest<{ cart: FoodCart }>(`/v1/food/restaurants/${encodeURIComponent(slug)}/cart`, { method: "GET", cache: "no-store" });
      setCart(body.cart); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load basket"); }
  }, [slug]);
  useEffect(() => { void load(); }, [load]);

  async function quantity(id: string, next: number) {
    if (!slug || next < 0) return; setBusy(id);
    try {
      const body = await foodCartRequest<{ cart: FoodCart }>(`/v1/food/restaurants/${encodeURIComponent(slug)}/cart/items/${encodeURIComponent(id)}`, { method: "PATCH", body: { quantity: next } });
      setCart(body.cart);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update basket"); } finally { setBusy(""); }
  }

  async function createGroup() {
    if (!slug) return; setBusy("group"); setError("");
    try {
      const group = await foodApi.post<{ shareToken: string }>(`/v1/food/restaurants/${encodeURIComponent(slug)}/group-orders`, {});
      setGroupToken(group.shareToken);
      await Share.share({ message: `Join my Food group order: bazaara-food://group/${group.shareToken}` });
      await load();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) { const result = await signInWithBazId(`/cart/${slug}`); if (result.ok) await createGroup(); }
      else setError(cause instanceof Error ? cause.message : "Could not create group order");
    } finally { setBusy(""); }
  }

  async function prefs(input: Record<string, unknown>) {
    if (!slug) return;
    try {
      const body = await foodCartRequest<{ cart: FoodCart }>(`/v1/food/restaurants/${encodeURIComponent(slug)}/cart/preferences`, { method: "PATCH", body: input });
      setCart(body.cart);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update preference"); }
  }

  if (!cart) return <Screen><EmptyState title="Basket" message={error || "Loading your restaurant basket…"} /></Screen>;
  return <Screen tabBarSafe={false}>
    <View style={s.top}><View><Text style={s.h1}>Your basket</Text><Text style={s.p}>{cart.restaurant.name}</Text></View><Pressable onPress={() => router.back()}><Text style={s.status}>MENU</Text></Pressable></View>
    {error ? <Text style={s.error}>{error}</Text> : null}
    {!cart.items.length ? <EmptyState title="Your basket is empty" message="Choose dishes from this restaurant to start an order." /> : <>
      {cart.items.map((item) => <View key={item.id} style={[s.card, { marginBottom: 10 }]}>
        <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start" }]}><View style={{ flex: 1 }}><Text style={s.name}>{item.name}</Text><Text style={s.meta}>{item.selectedModifiers.map((m) => m.optionName).join(" · ") || "Standard"}</Text>{item.specialInstructions ? <Text style={s.small}>“{item.specialInstructions}”</Text> : null}</View><Text style={s.price}>{foodMoney(item.lineTotalMinor)}</Text></View>
        <View style={s.row}><Pressable style={s.secondary} disabled={busy === item.id} onPress={() => void quantity(item.id, item.quantity - 1)}><Text style={s.secondaryText}>−</Text></Pressable><Text style={s.name}>{item.quantity}</Text><Pressable style={s.secondary} disabled={busy === item.id} onPress={() => void quantity(item.id, item.quantity + 1)}><Text style={s.secondaryText}>+</Text></Pressable><Pressable style={[s.secondary, { marginLeft: "auto" }]} onPress={() => void quantity(item.id, 0)}><Text style={s.error}>Remove</Text></Pressable></View>
      </View>)}
      <View style={[s.card, { marginBottom: 10 }]}><Text style={s.h2}>Fulfilment</Text><View style={[s.wrap, { marginTop: 10 }]}>{cart.restaurant.deliveryEnabled ? <Pressable style={[s.pill, cart.fulfillmentType === "DELIVERY" && s.pillActive]} onPress={() => void prefs({ fulfillmentType: "DELIVERY" })}><Text style={[s.pillText, cart.fulfillmentType === "DELIVERY" && s.pillTextActive]}>Delivery</Text></Pressable> : null}{cart.restaurant.pickupEnabled ? <Pressable style={[s.pill, cart.fulfillmentType === "PICKUP" && s.pillActive]} onPress={() => void prefs({ fulfillmentType: "PICKUP" })}><Text style={[s.pillText, cart.fulfillmentType === "PICKUP" && s.pillTextActive]}>Pickup</Text></Pressable> : null}</View>
        <View style={[s.row, { justifyContent: "space-between", marginTop: 14 }]}><Text style={s.p}>Contactless handoff</Text><Switch value={cart.contactless} onValueChange={(value) => void prefs({ contactless: value })} /></View>
        <View style={[s.row, { justifyContent: "space-between", marginTop: 10 }]}><Text style={s.p}>Include cutlery</Text><Switch value={cart.cutleryRequired} onValueChange={(value) => void prefs({ cutleryRequired: value })} /></View>
      </View>
      <View style={[s.card, { marginBottom: 10 }]}><Text style={s.h2}>Order together</Text><Text style={s.p}>Create a share link. Everyone keeps a separate basket; the host places one combined order.</Text>{groupToken ? <Text selectable style={[s.small,{marginTop:8}]}>Invite token: {groupToken}</Text> : null}<Pressable style={[s.secondary,{marginTop:10}]} disabled={busy === "group"} onPress={() => void createGroup()}><Text style={s.secondaryText}>{busy === "group" ? "Creating…" : "Create & share group order"}</Text></Pressable></View>
      <View style={s.card}><View style={[s.row, { justifyContent: "space-between" }]}><Text style={s.p}>Subtotal</Text><Text style={s.name}>{foodMoney(cart.subtotalMinor)}</Text></View><View style={[s.row, { justifyContent: "space-between" }]}><Text style={s.p}>Delivery</Text><Text style={s.p}>{foodMoney(cart.deliveryFeeMinor)}</Text></View><View style={[s.row, { justifyContent: "space-between" }]}><Text style={s.p}>Service fee ({(cart.serviceFeeRateBps/100).toFixed(1)}%)</Text><Text style={s.p}>{foodMoney(cart.serviceFeeMinor)}</Text></View><Text style={[s.small,{marginTop:4}]}>Platform fee · min {foodMoney(cart.serviceFeeMinimumMinor)} · max {foodMoney(cart.serviceFeeMaximumMinor)}</Text>{cart.discountMinor ? <View style={[s.row, { justifyContent: "space-between" }]}><Text style={s.p}>Discount</Text><Text style={s.price}>−{foodMoney(cart.discountMinor)}</Text></View> : null}<View style={s.divider}/><View style={[s.row, { justifyContent: "space-between" }]}><Text style={s.h2}>Total</Text><Text style={s.h2}>{foodMoney(cart.totalMinor)}</Text></View>{!cart.minimumOrderMet ? <Text style={[s.error, { marginTop: 8 }]}>Add {foodMoney(cart.minimumOrderMinor - cart.subtotalMinor)} to reach the restaurant minimum.</Text> : null}<Pressable style={[s.button, { marginTop: 14 }, !cart.minimumOrderMet && { opacity: .5 }]} disabled={!cart.minimumOrderMet} onPress={() => router.push(`/checkout/${slug}`)}><Text style={s.buttonText}>Continue to checkout</Text></Pressable></View>
    </>}
  </Screen>;
}
