import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { EmptyState, Screen, SectionTitle } from "@bazaara/mobile-ui";

import { groceryApi, groceryCartRequest } from "@/lib/api";
import { type ProductSummary } from "@/lib/grocery";
import { GroceryProductCard } from "@/ui/product-card";
import { groceryPalette, groceryStyles as s } from "@/ui/theme";

type Home = {
  hero: { title: string; subtitle: string };
  categories: Array<{ id: string; slug: string; name: string }>;
  products: ProductSummary[];
  stores: Array<{
    slug: string;
    name: string;
    verified: boolean;
    fulfillmentModes: string[];
    storeCount: number;
  }>;
};

function categoryGlyph(name: string) {
  const value = name.toLowerCase();
  if (value.includes("fruit") || value.includes("veget")) return "✦";
  if (value.includes("meat") || value.includes("fish")) return "◈";
  if (value.includes("drink") || value.includes("beverage")) return "◒";
  if (value.includes("home") || value.includes("house")) return "⌂";
  if (value.includes("baby")) return "●";
  if (value.includes("bread") || value.includes("bakery")) return "◇";
  return "◎";
}

export default function GroceryHome() {
  const [data, setData] = useState<Home | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const home = await groceryApi.get<Home>("/v1/grocery/home", { cache: "no-store" });
      setData(home);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Grocery");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const products = useMemo(() => data?.products.slice(0, 10) ?? [], [data]);

  async function add(product: ProductSummary) {
    if (!product.defaultVariantId) return;
    setBusy(product.id);
    try {
      await groceryCartRequest("/v1/grocery/cart/items", {
        method: "POST",
        body: { variantId: product.defaultVariantId, quantity: 1 },
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add item");
    } finally {
      setBusy("");
    }
  }

  function search() {
    router.push({
      pathname: "/(tabs)/search",
      params: query.trim() ? { q: query.trim() } : {},
    });
  }

  return (
    <Screen>
      <View style={s.top}>
        <View>
          <Text style={local.platform}>BAZAARA PLATFORM</Text>
          <Text style={s.brand}>Grocery</Text>
        </View>
        <Pressable style={local.basket} onPress={() => router.push("/cart") }>
          <Text style={local.basketText}>BASKET</Text>
          <Text style={local.basketArrow}>→</Text>
        </Pressable>
      </View>

      <View style={local.hero}>
        <View style={local.heroGlow} />
        <View style={local.badgeRow}>
          <View style={local.badge}><Text style={local.badgeText}>FRESH COMMERCE</Text></View>
          <Text style={local.live}>● LIVE CATALOGUE</Text>
        </View>
        <Text style={local.heroTitle}>{data?.hero.title ?? "Fresh groceries. Less friction."}</Text>
        <Text style={local.heroCopy}>
          {data?.hero.subtitle ?? "Fresh food, pantry staples and household essentials with live availability and flexible fulfilment."}
        </Text>
        <View style={local.heroActions}>
          <Pressable style={[s.button, { flex: 1 }]} onPress={() => router.push("/(tabs)/search") }>
            <Text style={s.buttonText}>Shop groceries</Text>
          </Pressable>
          <Pressable style={[s.secondary, { flex: 1 }]} onPress={() => router.push("/assistant") }>
            <Text style={s.secondaryText}>Ask BazAI</Text>
          </Pressable>
        </View>
        <View style={local.proofs}>
          <Text style={local.proof}>✓ Branch stock checks</Text>
          <Text style={local.proof}>✓ Service fee 10–15% at checkout</Text>
          <Text style={local.proof}>✓ Express 10% · ₦1k–₦5k</Text>
        </View>
      </View>

      <TextInput
        style={[s.search, { marginTop: 10 }]}
        value={query}
        onChangeText={setQuery}
        placeholder="Search groceries, stores and essentials"
        placeholderTextColor={groceryPalette.muted2}
        returnKeyType="search"
        onSubmitEditing={search}
      />

      <View style={local.quickRow}>
        <Pressable style={local.quick} onPress={() => router.push("/(tabs)/lists") }>
          <View style={local.quickIcon}><Text style={local.quickIconText}>☷</Text></View>
          <View style={{ flex: 1 }}><Text style={local.quickKicker}>REPEAT SHOP</Text><Text style={local.quickTitle}>My lists</Text></View>
          <Text style={local.quickArrow}>↗</Text>
        </Pressable>
        <Pressable style={local.quick} onPress={() => router.push("/assistant") }>
          <View style={local.quickIcon}><Text style={local.quickIconText}>AI</Text></View>
          <View style={{ flex: 1 }}><Text style={local.quickKicker}>SMART PLANNING</Text><Text style={local.quickTitle}>Grocery AI</Text></View>
          <Text style={local.quickArrow}>↗</Text>
        </Pressable>
      </View>

      {error ? <Text style={[s.error, { marginTop: 9 }]}>{error}</Text> : null}

      {data?.categories.length ? (
        <>
          <SectionTitle eyebrow="Browse" title="Shop by aisle" action={<Pressable onPress={() => router.push("/(tabs)/search") }><Text style={local.action}>See all</Text></Pressable>} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.rail}>
            {data.categories.slice(0, 12).map((category) => (
              <Pressable
                key={category.id}
                style={local.category}
                onPress={() => router.push({ pathname: "/(tabs)/search", params: { category: category.slug } })}
              >
                <View style={local.categoryIcon}><Text style={local.categoryGlyph}>{categoryGlyph(category.name)}</Text></View>
                <Text numberOfLines={2} style={local.categoryName}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {data?.stores.length ? (
        <>
          <SectionTitle eyebrow="Stores" title="Grocery sellers" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.rail}>
            {data.stores.slice(0, 8).map((store) => (
              <Pressable
                key={store.slug}
                style={local.store}
                onPress={() => router.push({ pathname: "/(tabs)/search", params: { seller: store.slug } })}
              >
                <View style={local.storeMark}><Text style={local.storeMarkText}>{store.name.slice(0, 1).toUpperCase()}</Text></View>
                <Text numberOfLines={1} style={local.storeName}>{store.verified ? "✓ " : ""}{store.name}</Text>
                <Text numberOfLines={1} style={local.storeMeta}>{store.fulfillmentModes.slice(0, 2).join(" · ") || "Delivery"}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      <SectionTitle eyebrow="Everyday" title="Fresh essentials" action={<Pressable onPress={() => router.push("/(tabs)/search") }><Text style={local.action}>Browse</Text></Pressable>} />
      {!data && !error ? <Text style={s.p}>Loading groceries…</Text> : null}
      {products.length ? (
        <View style={[s.wrap, { justifyContent: "space-between" }]}>
          {products.map((product) => <GroceryProductCard key={product.id} product={product} onAdd={add} busy={busy === product.id} />)}
        </View>
      ) : data ? <EmptyState title="Catalogue unavailable" message="No Grocery products are currently available." /> : null}

      <View style={[s.card, { marginTop: 16 }]}>
        <Text style={local.quickKicker}>YOUR GROCERY SYSTEM</Text>
        <Text style={[s.h2, { marginTop: 3 }]}>Lists, orders and support stay connected.</Text>
        <Text style={[s.p, { marginTop: 4 }]}>Use BazID to keep repeat shopping, live picking and issue resolution together.</Text>
        <View style={[s.row, { marginTop: 10 }]}>
          <Pressable style={[s.secondary, { flex: 1 }]} onPress={() => router.push("/(tabs)/orders") }><Text style={s.secondaryText}>Orders</Text></Pressable>
          <Pressable style={[s.secondary, { flex: 1 }]} onPress={() => router.push("/support") }><Text style={s.secondaryText}>Support</Text></Pressable>
        </View>
      </View>
    </Screen>
  );
}

const local = StyleSheet.create({
  platform: { color: groceryPalette.muted2, fontSize: 6.5, fontWeight: "900", letterSpacing: 0.7 },
  basket: { minHeight: 38, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 11, backgroundColor: groceryPalette.surface2 },
  basketText: { color: groceryPalette.success, fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
  basketArrow: { color: groceryPalette.text, fontSize: 12, fontWeight: "900" },
  hero: { position: "relative", minHeight: 250, overflow: "hidden", justifyContent: "center", padding: 18, borderWidth: 1, borderColor: groceryPalette.line, borderRadius: 20, backgroundColor: groceryPalette.surface },
  heroGlow: { position: "absolute", width: 230, height: 230, top: -120, right: -85, borderRadius: 230, backgroundColor: "rgba(47,143,98,.13)" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  badge: { minHeight: 23, paddingHorizontal: 8, justifyContent: "center", borderRadius: 999, backgroundColor: groceryPalette.lime },
  badgeText: { color: "#0C1805", fontSize: 6, fontWeight: "900", letterSpacing: 0.65 },
  live: { color: groceryPalette.success, fontSize: 6.5, fontWeight: "900", letterSpacing: 0.45 },
  heroTitle: { maxWidth: 330, marginTop: 15, color: groceryPalette.text, fontSize: 31, lineHeight: 31, fontWeight: "900", letterSpacing: -1.4 },
  heroCopy: { maxWidth: 350, marginTop: 9, color: groceryPalette.muted, fontSize: 10.5, lineHeight: 16 },
  heroActions: { marginTop: 15, flexDirection: "row", gap: 7 },
  proofs: { marginTop: 13, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  proof: { color: groceryPalette.muted2, fontSize: 7, fontWeight: "700" },
  quickRow: { marginTop: 8, flexDirection: "row", gap: 7 },
  quick: { flex: 1, minHeight: 70, padding: 9, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: groceryPalette.line, borderRadius: 13, backgroundColor: groceryPalette.surface },
  quickIcon: { width: 33, height: 33, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(47,143,98,.08)" },
  quickIconText: { color: groceryPalette.success, fontSize: 10, fontWeight: "900" },
  quickKicker: { color: groceryPalette.muted2, fontSize: 6, fontWeight: "900", letterSpacing: 0.5 },
  quickTitle: { marginTop: 2, color: groceryPalette.text, fontSize: 9.5, fontWeight: "900" },
  quickArrow: { color: "#49685A", fontSize: 10 },
  action: { color: groceryPalette.success, fontSize: 10, fontWeight: "900" },
  rail: { gap: 8, paddingRight: 12 },
  category: { width: 96, minHeight: 92, padding: 10, justifyContent: "space-between", borderWidth: 1, borderColor: groceryPalette.line, borderRadius: 13, backgroundColor: groceryPalette.surface },
  categoryIcon: { width: 33, height: 33, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(47,143,98,.07)" },
  categoryGlyph: { color: groceryPalette.success, fontSize: 13, fontWeight: "900" },
  categoryName: { marginTop: 9, color: "#DCECE3", fontSize: 9, lineHeight: 11.5, fontWeight: "800" },
  store: { width: 142, minHeight: 100, padding: 10, borderWidth: 1, borderColor: groceryPalette.line, borderRadius: 13, backgroundColor: groceryPalette.surface },
  storeMark: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: groceryPalette.primary2 },
  storeMarkText: { color: "#06130E", fontSize: 12, fontWeight: "900" },
  storeName: { marginTop: 8, color: groceryPalette.text, fontSize: 9.5, fontWeight: "900" },
  storeMeta: { marginTop: 3, color: groceryPalette.muted2, fontSize: 7.5 },
});
