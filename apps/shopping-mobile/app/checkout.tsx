import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Button, Card, Field, Screen, SectionTitle, colors } from "@bazaara/mobile-ui";
import { cartRequest, publicApi } from "@/lib/api";
import { clearGuestCartToken, guestCartHeaders } from "@/lib/guest-cart";
import { isSignedIn, signInWithBazId } from "@/lib/auth";
import { type Cart, type Checkout, money } from "@/lib/types";
import { useCartState } from "@/state/cart";

const NIGERIA_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

type PromotionResponse = {
  promotion: { code: string; name: string; type: string; scope: string };
  checkout: { id: string; currency: string; subtotalMinor: number; shippingMinor: number; taxMinor: number; discountMinor: number; totalMinor: number; promotionCode: string | null };
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Lagos");
  const [city, setCity] = useState("Lagos");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [landmark, setLandmark] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionMessage, setPromotionMessage] = useState("");
  const [statesOpen, setStatesOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"STANDARD" | "EXPRESS" | "SCHEDULED">("STANDARD");
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const { setCount, refresh: refreshCart } = useCartState();
  const deliveryAvailability = {
    STANDARD: cart?.items.every((item) => item.fulfillmentModes?.includes("STANDARD") ?? true) ?? true,
    EXPRESS: cart?.items.length ? cart.items.every((item) => item.fulfillmentModes?.includes("EXPRESS")) : false,
    SCHEDULED: cart?.items.length ? cart.items.every((item) => item.fulfillmentModes?.includes("SCHEDULED")) : false,
  };

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [body, signed] = await Promise.all([
        cartRequest<{ cart: Cart }>("/v1/shopping/cart", { method: "GET" }),
        isSignedIn(),
      ]);
      setCart(body.cart);
      setCount(body.cart.itemCount);
      setSignedIn(signed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load checkout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function signIn() {
    setBusy(true); setError("");
    try {
      const result = await signInWithBazId("/checkout");
      if (!result.ok) { setError("BazID authorization was cancelled."); return; }
      const body = await cartRequest<{ cart: Cart }>("/v1/shopping/cart", { method: "GET" });
      await clearGuestCartToken();
      setSignedIn(true);
      setCart(body.cart);
      setCount(body.cart.itemCount);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "BazID sign-in failed");
    } finally { setBusy(false); }
  }

  async function review() {
    if (!fullName.trim() || !phone.trim() || !region.trim() || !city.trim() || !street.trim()) {
      setError("Full name, phone, state, city and street are required.");
      return;
    }
    if (deliveryMode === "SCHEDULED" && !scheduledFor) {
      setError("Choose a scheduled delivery window.");
      return;
    }
    setBusy(true); setError("");
    try {
      const headers = await guestCartHeaders();
      const body = await publicApi.post<{ checkout: Checkout }>("/v1/shopping/checkouts", {
        shippingAddress: {
          fullName,
          phone,
          country: "NG",
          region,
          city,
          district: district || undefined,
          street,
          building: building || undefined,
          landmark: landmark || undefined,
        },
        deliveryMode,
        scheduledFor: deliveryMode === "SCHEDULED" ? scheduledFor ?? undefined : undefined,
      }, { headers });
      setCheckout(body.checkout);
      await clearGuestCartToken();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reserve checkout");
    } finally { setBusy(false); }
  }

  async function applyPromotion() {
    if (!checkout || !promotionCode.trim()) return;
    setBusy(true); setError(""); setPromotionMessage("");
    try {
      const body = await publicApi.post<PromotionResponse>(`/v1/shopping/checkouts/${encodeURIComponent(checkout.id)}/promotion`, { code: promotionCode.trim() });
      setCheckout((current) => current ? { ...current, ...body.checkout } : current);
      setPromotionCode(body.promotion.code);
      setPromotionMessage(`${body.promotion.code} applied`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not apply promotion");
    } finally { setBusy(false); }
  }

  async function clearPromotion() {
    if (!checkout) return;
    setBusy(true); setError("");
    try {
      const body = await publicApi.delete<{ checkout: { id: string; promotionCode: null; discountMinor: number; totalMinor: number; currency: string } }>(`/v1/shopping/checkouts/${encodeURIComponent(checkout.id)}/promotion`);
      setCheckout((current) => current ? { ...current, ...body.checkout } : current);
      setPromotionCode(""); setPromotionMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove promotion");
    } finally { setBusy(false); }
  }

  async function selectPaymentMethod(paymentMethod: string) {
    if (!checkout || checkout.paymentMethod === paymentMethod) return;
    setBusy(true); setError("");
    try {
      const body = await publicApi.patch<{ checkout: Checkout }>(`/v1/shopping/checkouts/${encodeURIComponent(checkout.id)}/payment-method`, { paymentMethod });
      setCheckout(body.checkout);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change payment method");
    } finally { setBusy(false); }
  }

  async function placeOrder() {
    if (!checkout) return;
    setBusy(true); setError("");
    try {
      const body = await publicApi.post<{ order: { id: string; paymentMethod?: string } }>(`/v1/shopping/checkouts/${encodeURIComponent(checkout.id)}/place-order`, undefined, { idempotencyKey: Crypto.randomUUID() });
      setCount(0);
      void refreshCart();
      if (checkout.paymentMethod.startsWith("PAYSTACK_")) {
        const initialized = await publicApi.post<{ checkoutUrl: string | null; alreadyPaid: boolean }>(`/v1/shopping/orders/${encodeURIComponent(body.order.id)}/payment/initialize`, undefined, { idempotencyKey: Crypto.randomUUID() });
        if (initialized.checkoutUrl) {
          await WebBrowser.openBrowserAsync(initialized.checkoutUrl);
          await publicApi.post(`/v1/shopping/orders/${encodeURIComponent(body.order.id)}/payment/reconcile`, {}).catch(() => undefined);
        }
      }
      router.replace({ pathname: "/order/[id]", params: { id: body.order.id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not place order");
    } finally { setBusy(false); }
  }

  return (
    <Screen tabBarSafe={false}>
      <SectionTitle eyebrow="Secure checkout" title="Delivery & payment" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <Text style={styles.muted}>Loading checkout…</Text>
      ) : !cart || signedIn === null ? (
        <Card style={styles.retryCard}><Text style={styles.title}>Checkout could not connect</Text><Text style={styles.muted}>{error || "Bazaara could not load your cart or BazID session."}</Text><Button label="Retry checkout" onPress={() => void load()} /></Card>
      ) : cart.items.length === 0 ? (
        <Card><Text style={styles.title}>Your cart is empty.</Text><Button label="Back to Shopping" onPress={() => router.replace("/(tabs)")} /></Card>
      ) : signedIn === false ? (
        <Card style={styles.signInCard}>
          <Text style={styles.title}>Sign in to checkout</Text>
          <Text style={styles.muted}>Your guest cart is preserved. BazID is required now for checkout, fraud controls and order history.</Text>
          <Button label="Continue with BazID" onPress={() => void signIn()} loading={busy} />
        </Card>
      ) : !checkout ? (
        <View style={styles.form}>
          <Field label="Full name" value={fullName} onChangeText={setFullName} />
          <Field label="Phone (+234...)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Text style={styles.fieldLabel}>State / FCT</Text>
          <Pressable onPress={() => setStatesOpen((value) => !value)} style={styles.selector}><Text style={styles.selectorText}>{region} ▾</Text></Pressable>
          {statesOpen ? <View style={styles.stateGrid}>{NIGERIA_STATES.map((state) => <Pressable key={state} onPress={() => { setRegion(state); setStatesOpen(false); }} style={[styles.stateChip, state === region && styles.stateChipActive]}><Text style={[styles.stateText, state === region && styles.stateTextActive]}>{state}</Text></Pressable>)}</View> : null}
          <Field label="City / town" value={city} onChangeText={setCity} />
          <Field label="LGA / area" value={district} onChangeText={setDistrict} />
          <Field label="Street address" value={street} onChangeText={setStreet} />
          <Field label="Building / unit" value={building} onChangeText={setBuilding} />
          <Field label="Landmark" value={landmark} onChangeText={setLandmark} />
          <Text style={styles.fieldLabel}>Delivery method</Text>
          <View style={styles.deliveryChoices}>
            {([
              ["STANDARD", "Standard", "Reliable everyday delivery"],
              ["EXPRESS", "Express", "Priority delivery when every item supports it"],
              ["SCHEDULED", "Scheduled", "Choose a future delivery window"],
            ] as const).map(([key, label, detail]) => {
              const available = deliveryAvailability[key];
              return (
                <Pressable key={key} disabled={!available} onPress={() => { setDeliveryMode(key); if (key !== "SCHEDULED") setScheduledFor(null); }} style={[styles.deliveryChoice, deliveryMode === key && styles.deliveryChoiceActive, !available && styles.deliveryChoiceDisabled]}>
                  <View style={[styles.radio, deliveryMode === key && styles.radioActive]} /><View style={styles.paymentCopy}><Text style={styles.paymentChoiceTitle}>{label}</Text><Text style={styles.paymentReason}>{available ? detail : "Unavailable for one or more cart items"}</Text></View>
                </Pressable>
              );
            })}
          </View>
          {deliveryMode === "SCHEDULED" ? <View style={styles.scheduleSlots}>{[
            { label: "Tomorrow · 10am–1pm", hour: 10 },
            { label: "Tomorrow · 2pm–5pm", hour: 14 },
            { label: "Day after · 10am–1pm", hour: 10, days: 2 },
          ].map((slot) => { const date = new Date(); date.setDate(date.getDate() + (slot.days ?? 1)); date.setHours(slot.hour, 0, 0, 0); const iso = date.toISOString(); return <Pressable key={slot.label} onPress={() => setScheduledFor(iso)} style={[styles.scheduleSlot, scheduledFor === iso && styles.scheduleSlotActive]}><Text style={[styles.scheduleText, scheduledFor === iso && styles.scheduleTextActive]}>{slot.label}</Text></Pressable>; })}</View> : null}
          <Button label="Review order" onPress={() => void review()} loading={busy} />
        </View>
      ) : (
        <>
          <Card>
            <Text style={styles.title}>Review order</Text>
            <View style={styles.deliverySummary}><Text style={styles.mutedLine}>Delivery method</Text><Text style={styles.value}>{checkout.deliveryMode === "SCHEDULED" && checkout.scheduledFor ? `Scheduled · ${new Date(checkout.scheduledFor).toLocaleString()}` : checkout.deliveryMode.toLowerCase().replace(/^./, (value) => value.toUpperCase())}</Text></View>
            {checkout.sellers.map((seller) => (
              <View key={seller.merchantId} style={styles.seller}>
                <Text style={styles.sellerName}>{seller.sellerName}</Text>
                {seller.items.map((item) => <View key={item.id} style={styles.line}><Text style={styles.mutedLine}>{item.productTitle} · {item.variantTitle} × {item.quantity}</Text><Text style={styles.value}>{money(item.lineTotalMinor, checkout.currency)}</Text></View>)}
                <View style={styles.line}><Text style={styles.mutedLine}>Delivery</Text><Text style={styles.value}>{seller.shippingMinor ? money(seller.shippingMinor, checkout.currency) : "Free"}</Text></View>
              </View>
            ))}
          </Card>

          <Card style={styles.promoCard}>
            <Text style={styles.promoTitle}>Voucher / promotion</Text>
            <View style={styles.promoRow}><View style={styles.promoInput}><Field label="Code" value={promotionCode} onChangeText={setPromotionCode} autoCapitalize="characters" /></View><View style={styles.promoButton}><Button compact label="Apply" loading={busy} onPress={() => void applyPromotion()} /></View></View>
            {promotionMessage ? <Text style={styles.success}>{promotionMessage}</Text> : null}
            {checkout.promotionCode ? <Button compact kind="secondary" label="Remove promotion" onPress={() => void clearPromotion()} /> : null}
          </Card>

          <Card style={styles.paymentCard}>
            <Text style={styles.promoTitle}>Payment method</Text>
            <Text style={styles.muted}>Online payment is confirmed only by the trusted provider/webhook. Seller fulfillment stays locked until capture.</Text>
            <View style={styles.paymentChoices}>
              {checkout.paymentMethods.filter((item) => item.key !== "BAZAARA_PAY").map((item) => (
                <Pressable key={item.key} disabled={!item.available || busy} onPress={() => void selectPaymentMethod(item.key)} style={[styles.paymentChoice, checkout.paymentMethod === item.key && styles.paymentChoiceActive, !item.available && styles.paymentChoiceDisabled]}>
                  <View style={[styles.radio, checkout.paymentMethod === item.key && styles.radioActive]} />
                  <View style={styles.paymentCopy}><Text style={styles.paymentChoiceTitle}>{item.label}</Text>{item.reason ? <Text style={styles.paymentReason}>{item.reason}</Text> : null}</View>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.totalCard}>
            <View style={styles.line}><Text style={styles.mutedLine}>Items</Text><Text style={styles.value}>{money(checkout.subtotalMinor, checkout.currency)}</Text></View>
            <View style={styles.line}><Text style={styles.mutedLine}>Delivery</Text><Text style={styles.value}>{money(checkout.shippingMinor, checkout.currency)}</Text></View>
            {checkout.discountMinor > 0 ? <View style={styles.line}><Text style={styles.success}>Discount{checkout.promotionCode ? ` (${checkout.promotionCode})` : ""}</Text><Text style={styles.success}>−{money(checkout.discountMinor, checkout.currency)}</Text></View> : null}
            <View style={styles.line}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{money(checkout.totalMinor, checkout.currency)}</Text></View>
            <Text style={styles.payment}>Payment: {checkout.paymentMethods.find((item) => item.key === checkout.paymentMethod)?.label ?? checkout.paymentMethod}</Text>
            <Button label={checkout.paymentMethod.startsWith("PAYSTACK_") ? "Place order & pay securely" : "Place order"} onPress={() => void placeOrder()} loading={busy} />
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: "#FCA5A5", marginBottom: 10, fontSize: 11 },
  muted: { color: colors.muted, lineHeight: 17, fontSize: 11 },
  mutedLine: { color: colors.muted, fontSize: 10, flex: 1 },
  title: { color: colors.text, fontSize: 18, fontWeight: "900", marginBottom: 8 },
  signInCard: { gap: 12 },
  retryCard: { gap: 12 },
  form: { gap: 1 },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", marginBottom: 5 },
  selector: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 9, backgroundColor: colors.card, paddingHorizontal: 11, marginBottom: 9 },
  selectorText: { color: colors.text, fontSize: 13 },
  deliveryChoices: { gap: 7, marginBottom: 9 },
  deliveryChoice: { minHeight: 58, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.surface },
  deliveryChoiceActive: { borderColor: colors.indigoBright, backgroundColor: "rgba(91,77,255,.10)" },
  deliveryChoiceDisabled: { opacity: 0.45 },
  scheduleSlots: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  scheduleSlot: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  scheduleSlotActive: { borderColor: colors.green, backgroundColor: "rgba(34,197,94,.10)" },
  scheduleText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  scheduleTextActive: { color: "#86EFAC" },
  deliverySummary: { flexDirection: "row", justifyContent: "space-between", gap: 10, paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  stateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  stateChip: { paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, backgroundColor: colors.surface },
  stateChipActive: { borderColor: colors.indigoBright, backgroundColor: colors.card },
  stateText: { color: colors.muted, fontSize: 9 },
  stateTextActive: { color: colors.text, fontWeight: "800" },
  seller: { paddingTop: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  sellerName: { color: colors.text, fontWeight: "800", fontSize: 11, marginBottom: 6 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 10, paddingVertical: 5 },
  value: { color: colors.text, fontWeight: "800", fontSize: 10 },
  promoCard: { marginTop: 10 },
  promoTitle: { color: colors.text, fontWeight: "900", fontSize: 14, marginBottom: 7 },
  promoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  promoInput: { flex: 1 },
  promoButton: { width: 78, paddingTop: 19 },
  paymentCard: { marginTop: 10, gap: 8 },
  paymentChoices: { gap: 8, marginTop: 4 },
  paymentChoice: { minHeight: 58, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10 },
  paymentChoiceActive: { borderColor: colors.indigoBright, backgroundColor: "rgba(91,77,255,.10)" },
  paymentChoiceDisabled: { opacity: .45 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.muted2 },
  radioActive: { borderColor: colors.indigoBright, borderWidth: 5 },
  paymentCopy: { flex: 1 },
  paymentChoiceTitle: { color: colors.text, fontWeight: "800", fontSize: 12 },
  paymentReason: { color: colors.muted, fontSize: 9, marginTop: 2 },
  totalCard: { marginTop: 10 },
  totalLabel: { color: colors.text, fontWeight: "900", fontSize: 15 },
  total: { color: colors.orange, fontWeight: "900", fontSize: 19 },
  payment: { color: colors.muted, marginVertical: 11, fontSize: 10 },
  success: { color: "#86EFAC", fontSize: 10, fontWeight: "800" },
});
