import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Card, ProductCard, Screen, SectionTitle, colors } from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import { isSignedIn } from "@/lib/auth";
import { type Category, type ProductSummary, discountPercent, money } from "@/lib/types";
import { useCartState } from "@/state/cart";
import { ShoppingSearchBar } from "@/components/shopping-search-bar";

type RepeatPurchase = { productId: string; variantId: string; productTitle: string; variantTitle: string; quantity: number; createdAt: string };

type GroceryHome = {
  hero: { title: string; subtitle: string };
  categories: Category[];
  products: ProductSummary[];
  stores: Array<{ slug: string; name: string; verified: boolean; country: string; fulfillmentModes: string[]; storeCount: number }>;
  capabilities: Array<{ key: string; label: string; description: string }>;
};

export default function GroceryPage() {
  const [home, setHome] = useState<GroceryHome | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [repeatPurchases, setRepeatPurchases] = useState<RepeatPurchase[]>([]);
  const { quantities, busyVariantId, refresh: refreshCart, setVariantQuantity } = useCartState();

  const load = useCallback(async () => {
    setError("");
    try { setHome(await publicApi.get<GroceryHome>("/v1/grocery/home")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load Grocery"); }
  }, []);
  const loadRepeats = useCallback(async () => {
    try {
      if (!(await isSignedIn())) { setRepeatPurchases([]); return; }
      const body = await publicApi.get<{ items: RepeatPurchase[] }>("/v1/grocery/repeat-purchases");
      setRepeatPurchases(body.items);
    } catch {
      setRepeatPurchases([]);
    }
  }, []);
  useEffect(() => { void load(); void refreshCart(); void loadRepeats(); }, [load, loadRepeats, refreshCart]);
  useFocusEffect(useCallback(() => { void refreshCart(); void loadRepeats(); }, [loadRepeats, refreshCart]));

  function search() {
    const q = query.trim();
    router.push({ pathname: "/search-results", params: { ...(q ? { q } : {}), vertical: "GROCERY" } });
  }

  async function setQuantity(product: ProductSummary, quantity: number) {
    if (!product.defaultVariantId) return;
    try { await setVariantQuantity(product.defaultVariantId, quantity); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update cart"); }
  }

  async function buyAgain(item: RepeatPurchase) {
    try { await setVariantQuantity(item.variantId, (quantities[item.variantId] ?? 0) + Math.max(1, item.quantity)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add this grocery item again"); }
  }

  return (
    <Screen tabBarSafe={false}>
      <View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.brand}>BAZAARA <Text style={styles.grocery}>GROCERY</Text></Text></View>
      <ShoppingSearchBar value={query} onChangeText={setQuery} onSubmit={search} />
      <View style={styles.hero}><Text style={styles.kicker}>FRESH · PANTRY · HOUSEHOLD</Text><Text style={styles.heroTitle}>{home?.hero.title ?? "Groceries, without the long trip."}</Text><Text style={styles.heroCopy}>{home?.hero.subtitle ?? "Fresh food and essentials from grocery stores on GO."}</Text><View style={styles.heroActions}><Pressable style={styles.aiButton} onPress={() => router.push({ pathname: "/(tabs)/go-ai", params: { prompt: "Plan my weekly groceries" } })}><Text style={styles.aiButtonText}>Plan with GO AI</Text></Pressable><Button compact kind="secondary" label="My lists" onPress={() => router.push("/grocery-lists")} /></View></View>

      <View style={styles.capRow}><View style={styles.cap}><Text style={styles.capIcon}>⚡</Text><Text style={styles.capText}>Express where supported</Text></View><View style={styles.cap}><Text style={styles.capIcon}>◷</Text><Text style={styles.capText}>Schedule delivery</Text></View></View>

      {home?.categories.length ? <><SectionTitle eyebrow="Browse" title="Grocery categories" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{home.categories.map((category) => <Pressable key={category.id} onPress={() => router.push({ pathname: "/search-results", params: { category: category.slug, vertical: "GROCERY" } })} style={styles.category}><Text style={styles.categoryText}>{category.name}</Text></Pressable>)}</ScrollView></> : null}

      {home?.stores.length ? <><SectionTitle eyebrow="Grocery network" title="Grocery stores" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storeRow}>{home.stores.map((store) => <Pressable key={store.slug} onPress={() => router.push({ pathname: "/seller/[slug]", params: { slug: store.slug } })}><Card style={styles.storeCard}><Text style={styles.storeName}>{store.name}{store.verified ? " ✓" : ""}</Text><Text style={styles.storeMeta}>{store.fulfillmentModes.map((item) => item.toLowerCase()).join(" · ") || "standard"}</Text></Card></Pressable>)}</ScrollView></> : null}

      {repeatPurchases.length ? <><SectionTitle eyebrow="Buy again" title="Recent grocery purchases" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repeatRow}>{repeatPurchases.slice(0, 8).map((item) => <Card key={`${item.productId}:${item.variantId}`} style={styles.repeatCard}><Text numberOfLines={2} style={styles.repeatTitle}>{item.productTitle}</Text><Text style={styles.repeatMeta}>{item.variantTitle} · last bought × {item.quantity}</Text><Button compact kind="secondary" label={busyVariantId === item.variantId ? "Adding…" : "Add again"} loading={busyVariantId === item.variantId} onPress={() => void buyAgain(item)} /></Card>)}</ScrollView></> : null}

      <SectionTitle eyebrow="Grocery" title="Everyday essentials" action={<Pressable onPress={search}><Text style={styles.link}>See all</Text></Pressable>} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>{(home?.products ?? []).map((product) => { const variantId = product.defaultVariantId; const quantity = variantId ? quantities[variantId] ?? 0 : 0; return <ProductCard key={product.id} title={product.title} brand={product.brand?.name} image={product.image?.url} seller={product.seller?.name} price={money(product.priceMinor, product.currency)} oldPrice={product.compareAtPriceMinor ? money(product.compareAtPriceMinor, product.currency) : null} discount={discountPercent(product.priceMinor, product.compareAtPriceMinor)} inStock={product.stock === "IN_STOCK"} addBusy={!!variantId && busyVariantId === variantId} quantity={quantity} maxQuantity={product.availableQuantity} onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })} onAdd={() => void setQuantity(product, 1)} onIncrement={() => void setQuantity(product, quantity + 1)} onDecrement={() => void setQuantity(product, quantity - 1)} />; })}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { color: colors.muted, fontSize: 12, fontWeight: "800" }, brand: { color: colors.text, fontWeight: "900", fontSize: 15 }, grocery: { color: "#F0ABFC" },
  hero: { marginTop: 13, padding: 16, minHeight: 180, justifyContent: "center", borderRadius: 18, backgroundColor: "#2A0A38", borderWidth: 1, borderColor: "rgba(217,70,239,.34)" }, kicker: { color: "#F0ABFC", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, heroTitle: { color: colors.white, fontSize: 25, lineHeight: 28, fontWeight: "900", letterSpacing: -0.8, marginVertical: 7 }, heroCopy: { color: "#F2D8F7", fontSize: 11, lineHeight: 17 }, heroActions: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" }, aiButton: { minHeight: 38, alignItems: "center", justifyContent: "center", paddingHorizontal: 13, borderRadius: 10, backgroundColor: "#D946EF", borderWidth: 1, borderColor: "#FF65D8" }, aiButtonText: { color: colors.white, fontSize: 10, fontWeight: "900" },
  capRow: { flexDirection: "row", gap: 8, marginTop: 10 }, cap: { flex: 1, minHeight: 50, flexDirection: "row", alignItems: "center", gap: 7, padding: 9, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, capIcon: { color: "#F0ABFC", fontSize: 15 }, capText: { flex: 1, color: colors.muted, fontSize: 9, fontWeight: "800" },
  categoryRow: { gap: 7, paddingRight: 12 }, category: { minHeight: 36, justifyContent: "center", paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong }, categoryText: { color: colors.text, fontSize: 10, fontWeight: "800" },
  storeRow: { gap: 8, paddingRight: 12 }, storeCard: { width: 190, minHeight: 76, justifyContent: "center" }, storeName: { color: colors.text, fontSize: 12, fontWeight: "900" }, storeMeta: { color: "#E9B8F5", fontSize: 9, marginTop: 5, textTransform: "capitalize" },
  repeatRow: { gap: 8, paddingRight: 12 }, repeatCard: { width: 205, minHeight: 118, justifyContent: "space-between", gap: 8 }, repeatTitle: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: "900" }, repeatMeta: { color: colors.muted, fontSize: 9, lineHeight: 13 },
  link: { color: "#FF65D8", fontSize: 11, fontWeight: "900" }, grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }, error: { color: "#FCA5A5", marginTop: 8, fontSize: 11 },
});
