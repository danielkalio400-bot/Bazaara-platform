import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, ProductCard, Screen, SectionTitle, colors } from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import { type ProductSummary, discountPercent, money } from "@/lib/types";
import { useCartState } from "@/state/cart";

type SearchResponse = { products: ProductSummary[] };
type GroceryPlan = { prompt: string; people: number; title: string; disclaimer: string; ingredients: Array<{ label: string; quantity: number; note: string | null; products: ProductSummary[] }> };

const QUICK = ["Find something", "Phone under ₦300,000", "Compare products", "Find a gift", "Plan groceries", "Track an order"];

function understandPrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  let q = prompt.trim();
  if (lower.includes("phone")) q = "phone";
  else if (lower.includes("laptop") || lower.includes("school")) q = "laptop";
  else if (lower.includes("gift")) q = "gift";
  else if (lower.includes("shoe")) q = "shoe";
  const budget = prompt.replace(/,/g, "").match(/(?:₦|ngn\s*)?([0-9]{4,})/i)?.[1];
  return { q, maxPriceMinor: budget ? Number(budget) * 100 : undefined };
}

function groceryIntent(value: string) {
  return /(grocery|groceries|jollof|breakfast|beans|akara|pantry|ingredient|meal|food list|weekly essentials)/i.test(value);
}

export default function GoAiPage() {
  const params = useLocalSearchParams<{ prompt?: string }>();
  const initialHandled = useRef(false);
  const [prompt, setPrompt] = useState("");
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [plan, setPlan] = useState<GroceryPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { quantities, busyVariantId, setVariantQuantity } = useCartState();

  async function ask(value = prompt) {
    const input = value.trim(); if (!input) return;
    if (/track an order|track order|my order/i.test(input)) { router.push("/(tabs)/orders"); return; }
    setPrompt(input); setBusy(true); setError(""); setPlan(null); setProducts([]);
    try {
      if (groceryIntent(input)) {
        const body = await publicApi.post<GroceryPlan>("/v1/grocery/planner", { prompt: input === "Plan groceries" ? "Plan my weekly groceries" : input });
        setPlan(body);
      } else {
        const understood = understandPrompt(input);
        const body = await publicApi.get<SearchResponse>("/v1/shopping/search", { query: { q: understood.q || undefined, maxPriceMinor: understood.maxPriceMinor, inStock: "true", sort: "featured", page: 1, limit: 8 } });
        setProducts(body.products);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "GO AI could not complete that request"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const value = typeof params.prompt === "string" ? params.prompt : "";
    if (value && !initialHandled.current) { initialHandled.current = true; void ask(value); }
  }, [params.prompt]);

  async function updateQuantity(product: ProductSummary, quantity: number) {
    if (!product.defaultVariantId) return;
    try { await setVariantQuantity(product.defaultVariantId, quantity); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update cart"); }
  }

  const recommendationProducts = plan ? plan.ingredients.flatMap((item) => item.products.slice(0, 1)).filter((product, index, all) => all.findIndex((item) => item.id === product.id) === index) : products;

  return (
    <Screen>
      <View style={styles.brandRow}><View style={styles.aiMark}><Text style={styles.aiB}>B</Text><Text style={styles.spark}>✦</Text></View><View><Text style={styles.brand}>GO AI</Text><Text style={styles.subBrand}>Bazaara commerce assistant</Text></View></View>
      <SectionTitle eyebrow="Ask naturally" title="What are you looking for today?" />
      <Text style={styles.intro}>Search the live catalogue by need or budget, plan groceries, or jump directly into order tracking.</Text>
      <View style={styles.quick}>{QUICK.map((item) => <Pressable key={item} onPress={() => void ask(item)} style={styles.quickButton}><Text style={styles.quickText}>{item}</Text></Pressable>)}</View>
      <Card style={styles.composer}>
        <TextInput value={prompt} onChangeText={setPrompt} onSubmitEditing={() => void ask()} placeholder="e.g. I need a good phone under ₦300,000…" placeholderTextColor={colors.muted2} style={styles.input} multiline />
        <View style={styles.composerBottom}><Text style={styles.inputModes}>Text · catalogue context</Text><View style={styles.send}><Button compact label={busy ? "Thinking…" : "Send"} loading={busy} onPress={() => void ask()} /></View></View>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {plan ? <Card style={styles.planCard}><Text style={styles.planKicker}>AI-GENERATED GROCERY PLAN</Text><Text style={styles.planTitle}>{plan.title}</Text>{plan.ingredients.map((ingredient) => <View key={ingredient.label} style={styles.ingredient}><View style={styles.ingredientCopy}><Text style={styles.ingredientTitle}>{ingredient.label} × {ingredient.quantity}</Text>{ingredient.note ? <Text style={styles.ingredientNote}>{ingredient.note}</Text> : null}</View><Text style={styles.match}>{ingredient.products.length ? `${ingredient.products.length} match${ingredient.products.length === 1 ? "" : "es"}` : "No match"}</Text></View>)}<Text style={styles.disclaimer}>{plan.disclaimer}</Text><Button compact kind="secondary" label="Open Grocery" onPress={() => router.push("/grocery")} /></Card> : null}

      {recommendationProducts.length ? <SectionTitle eyebrow={plan ? "Matched to your plan" : "Live Bazaara catalogue"} title={plan ? "Suggested grocery products" : "Recommendations"} /> : null}
      <View style={styles.grid}>{recommendationProducts.map((product) => {
        const variantId = product.defaultVariantId; const quantity = variantId ? quantities[variantId] ?? 0 : 0;
        return <ProductCard key={product.id} title={product.title} brand={product.brand?.name} image={product.image?.url} seller={product.seller?.name} price={money(product.priceMinor, product.currency)} oldPrice={product.compareAtPriceMinor ? money(product.compareAtPriceMinor, product.currency) : null} discount={discountPercent(product.priceMinor, product.compareAtPriceMinor)} inStock={product.stock === "IN_STOCK"} addBusy={!!variantId && busyVariantId === variantId} quantity={quantity} maxQuantity={product.availableQuantity} onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })} onAdd={() => void updateQuantity(product, 1)} onIncrement={() => void updateQuantity(product, quantity + 1)} onDecrement={() => void updateQuantity(product, quantity - 1)} />;
      })}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 10 }, aiMark: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.indigo, borderWidth: 1, borderColor: "rgba(255,255,255,.3)" }, aiB: { color: colors.white, fontSize: 19, fontWeight: "900", fontStyle: "italic" }, spark: { position: "absolute", top: 4, right: 6, color: "#D9D5FF", fontSize: 7 }, brand: { color: colors.indigoBright, fontSize: 17, fontWeight: "900" }, subBrand: { color: colors.muted, fontSize: 9, fontWeight: "700" }, intro: { color: colors.muted, fontSize: 10.5, lineHeight: 16, marginTop: -3, marginBottom: 10 },
  quick: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 }, quickButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface }, quickText: { color: colors.muted, fontSize: 10, fontWeight: "800" }, composer: { gap: 8 }, input: { minHeight: 78, color: colors.text, fontSize: 12, lineHeight: 17, textAlignVertical: "top" }, composerBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, inputModes: { flex: 1, color: colors.muted2, fontSize: 8.5 }, send: { width: 88 }, error: { color: "#FCA5A5", fontSize: 11, marginTop: 8 },
  planCard: { marginTop: 12, gap: 8 }, planKicker: { color: colors.orange, fontSize: 8.5, fontWeight: "900", letterSpacing: .8 }, planTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, ingredient: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border }, ingredientCopy: { flex: 1 }, ingredientTitle: { color: colors.text, fontSize: 11, fontWeight: "800" }, ingredientNote: { color: colors.muted, fontSize: 8.5, marginTop: 2 }, match: { color: colors.green, fontSize: 8.5, fontWeight: "800" }, disclaimer: { color: colors.muted2, fontSize: 8.5, lineHeight: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
});
