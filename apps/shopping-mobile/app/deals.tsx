/* BAZAARA_SHOPPING_RESTORED_BLUE_V15 */
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ProductCard, Screen, useMobileLayout } from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import { isSignedIn, signInWithBazId } from "@/lib/auth";
import { useCartState } from "@/state/cart";
import { money, type ProductSummary } from "@/lib/types";

type Offer = ProductSummary & { discountPercent: number; savingsMinor: number };
type RadarResponse = {
  offers: Offer[];
  pagination: { page: number; pagesWithinScan: number; totalWithinScan: number };
  scanned: number;
  moreRecentCandidatesExist: boolean;
  pricingNote: string;
};

type Discount = 1 | 10 | 25 | 40;
type Budget = 0 | 2500000 | 10000000 | 50000000;
const discounts: Discount[] = [1, 10, 25, 40];
const budgets: { label: string; minor: Budget }[] = [
  { label: "Any budget", minor: 0 }, { label: "Under ₦25k", minor: 2500000 },
  { label: "Under ₦100k", minor: 10000000 }, { label: "Under ₦500k", minor: 50000000 },
];

export default function DealRadarScreen() {
  const layout = useMobileLayout();
  const [discount, setDiscount] = useState<Discount>(1);
  const [budget, setBudget] = useState<Budget>(0);
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState<"biggest_discount" | "lowest_price">("biggest_discount");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<RadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const { quantities, busyVariantId, refresh: refreshCart, setVariantQuantity } = useCartState();

  const loadSaved = useCallback(async () => {
    try {
      if (!(await isSignedIn())) { setSavedIds(new Set()); return; }
      const body = await publicApi.get<{ products: ProductSummary[] }>("/v1/shopping/wishlist");
      setSavedIds(new Set(body.products.map((product) => product.id)));
    } catch { /* Catalogue browsing never depends on Wishlist availability. */ }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    void publicApi.get<RadarResponse>("/v1/shopping/deals", { query: {
      minDiscountPercent: discount, ...(budget ? { maxPriceMinor: budget } : {}),
      verifiedSeller: String(verified), sort, page, limit: 12,
    } }).then((body) => { if (active) { setResult(body); setLoading(false); } })
      .catch((cause: unknown) => { if (active) { setResult(null); setError(cause instanceof Error ? cause.message : "Could not load current offers"); setLoading(false); } });
    return () => { active = false; };
  }, [discount, budget, verified, sort, page, retry]);

  useFocusEffect(useCallback(() => { void refreshCart(); void loadSaved(); }, [refreshCart, loadSaved]));

  async function toggleSave(offer: Offer) {
    try {
      if (!(await isSignedIn())) {
        const auth = await signInWithBazId();
        if (!auth.ok) return;
      }
      const saved = savedIds.has(offer.id);
      if (saved) await publicApi.delete(`/v1/shopping/wishlist/${encodeURIComponent(offer.id)}`);
      else await publicApi.put(`/v1/shopping/wishlist/${encodeURIComponent(offer.id)}`);
      setSavedIds((previous) => {
        const next = new Set(previous);
        saved ? next.delete(offer.id) : next.add(offer.id);
        return next;
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update wishlist"); }
  }
  async function setQuantity(offer: Offer, quantity: number) {
    if (!offer.defaultVariantId) return;
    try { await setVariantQuantity(offer.defaultVariantId, quantity); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update cart"); }
  }
  function reset() { setDiscount(1); setBudget(0); setVerified(false); setSort("biggest_discount"); setPage(1); }

  return <Screen tabBarSafe={false} style={styles.screen}>
    <View style={styles.hero}><Text style={styles.kicker}>BAZAARA SHOPPING / CURRENT DEALS</Text><Text style={styles.heroTitle}>Current deals. <Text style={styles.accent}>Everyday value.</Text></Text><Text style={styles.intro}>Discover current seller-advertised discounts backed by available stock. No fake countdowns, no invented savings.</Text><View style={styles.proof}><Text style={styles.proofText}>✓ Available stock</Text><Text style={styles.proofText}>✓ Live catalogue</Text></View></View>
    <View style={styles.filters}>
      <View style={styles.filterHeading}><Text style={styles.sectionTitle}>Fine-tune your offers</Text><Pressable accessibilityRole="button" onPress={reset}><Text style={styles.link}>Reset ↺</Text></Pressable></View>
      <Text style={styles.label}>MINIMUM ADVERTISED DISCOUNT</Text><View style={styles.chips}>{discounts.map((value) => <Pressable accessibilityRole="button" accessibilityState={{ selected: discount === value }} key={value} onPress={() => { setDiscount(value); setPage(1); }} style={[styles.chip, discount === value && styles.chipActive]}><Text style={[styles.chipText, discount === value && styles.chipTextActive]}>{value === 1 ? "Any deal" : `${value}%+`}</Text></Pressable>)}</View>
      <Text style={styles.label}>SHOP YOUR BUDGET</Text><View style={styles.chips}>{budgets.map((value) => <Pressable accessibilityRole="button" accessibilityState={{ selected: budget === value.minor }} key={value.minor} onPress={() => { setBudget(value.minor); setPage(1); }} style={[styles.chip, budget === value.minor && styles.chipActive]}><Text style={[styles.chipText, budget === value.minor && styles.chipTextActive]}>{value.label}</Text></Pressable>)}</View>
      <View style={styles.verifyRow}><View style={{ flex: 1 }}><Text style={styles.verifyTitle}>Verified sellers only</Text><Text style={styles.verifyHint}>Require recorded seller verification</Text></View><Switch accessibilityLabel="Verified sellers only" value={verified} onValueChange={(value) => { setVerified(value); setPage(1); }} trackColor={{ true: "#388d97", false: "#33465a" }} thumbColor={verified ? "#aaf8e0" : "#afbbcc"} /></View>
      <View style={styles.chips}><Pressable accessibilityRole="button" accessibilityState={{ selected: sort === "biggest_discount" }} onPress={() => { setSort("biggest_discount"); setPage(1); }} style={[styles.chip, sort === "biggest_discount" && styles.chipActive]}><Text style={[styles.chipText, sort === "biggest_discount" && styles.chipTextActive]}>Biggest discount</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: sort === "lowest_price" }} onPress={() => { setSort("lowest_price"); setPage(1); }} style={[styles.chip, sort === "lowest_price" && styles.chipActive]}><Text style={[styles.chipText, sort === "lowest_price" && styles.chipTextActive]}>Lowest price</Text></Pressable></View>
    </View>
    <View style={styles.resultHeading}><View><Text style={styles.label}>CURRENT CATALOGUE</Text><Text style={styles.sectionTitle}>Offers worth exploring</Text><Text style={styles.resultCount}>{loading ? "Checking current offers…" : error ? "Could not load offers" : `${result?.pagination.totalWithinScan ?? 0} matching offers`}</Text></View></View>
    {loading ? <Text style={styles.status}>Checking current stock and seller prices…</Text> : error ? <View style={styles.empty}><Text style={styles.emptyTitle}>Live offers unavailable</Text><Text style={styles.emptyText}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setRetry((n) => n + 1)} style={styles.action}><Text style={styles.actionText}>Try again</Text></Pressable></View> : result?.offers.length ? <View style={styles.grid}>{result.offers.map((offer) => {
      const variantId = offer.defaultVariantId;
      const quantity = variantId ? quantities[variantId] ?? 0 : 0;
      return <View key={offer.id} style={[styles.offer, { width: layout.cardWidth }]}><View style={styles.offerBadge}><Text style={styles.savings}>Save {money(offer.savingsMinor, offer.currency)}</Text><Text style={styles.discount}>{offer.discountPercent}% off advertised compare price</Text></View><ProductCard title={offer.title} brand={offer.brand?.name} image={offer.image?.url} seller={offer.seller?.name} price={money(offer.priceMinor, offer.currency)} oldPrice={offer.compareAtPriceMinor ? money(offer.compareAtPriceMinor, offer.currency) : null} discount={`${offer.discountPercent}%`} inStock={true} saved={savedIds.has(offer.id)} quantity={quantity} maxQuantity={offer.availableQuantity} addBusy={Boolean(variantId) && busyVariantId === variantId} onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: offer.slug } })} onAdd={() => void setQuantity(offer, 1)} onIncrement={() => void setQuantity(offer, quantity + 1)} onDecrement={() => void setQuantity(offer, quantity - 1)} onSave={() => void toggleSave(offer)} onSeller={offer.seller ? () => router.push({ pathname: "/seller/[slug]", params: { slug: offer.seller!.slug } }) : undefined} /></View>;
    })}</View> : <View style={styles.empty}><Text style={styles.emptyTitle}>No deals match yet</Text><Text style={styles.emptyText}>Expand your budget or try a lower discount threshold.</Text><Pressable accessibilityRole="button" style={styles.action} onPress={reset}><Text style={styles.actionText}>Show all deals</Text></Pressable></View>}
    {result && !loading && !error ? <><View style={styles.pager}><Pressable accessibilityRole="button" accessibilityState={{ disabled: page <= 1 }} disabled={page <= 1} onPress={() => setPage((n) => n - 1)} style={[styles.pageButton,page <= 1 && styles.disabled]}><Text style={styles.link}>← Previous</Text></Pressable><Text style={styles.pageLabel}>{page} / {result.pagination.pagesWithinScan}</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: page >= result.pagination.pagesWithinScan }} disabled={page >= result.pagination.pagesWithinScan} onPress={() => setPage((n) => n + 1)} style={[styles.pageButton, page >= result.pagination.pagesWithinScan && styles.disabled]}><Text style={styles.link}>Next →</Text></Pressable></View><Text style={styles.footnote}>{result.pricingNote}{result.moreRecentCandidatesExist ? " Results reflect the 400 most recently updated discounted products, not the entire catalogue." : ""}</Text></> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  screen:{backgroundColor: "#030915",gap:18},hero:{backgroundColor: "#14304C",borderWidth:1,borderColor:"#F1C487",borderRadius:23,padding:23,overflow:"hidden"},kicker:{fontSize:10,fontWeight:"900",letterSpacing:1.4,color: "#76D3FF"},heroTitle:{fontSize:39,lineHeight:43,fontWeight:"900",color: "#F3FBFF",marginTop:17,letterSpacing:-1.9},accent:{color: "#6CD2FF"},intro:{color: "#B5CDE1",fontSize:13,lineHeight:21,marginTop:13},proof:{flexDirection:"row",gap:13,marginTop:17,flexWrap:"wrap"},proofText:{color:"#79562C",fontSize:11,fontWeight:"800"},filters:{backgroundColor: "#101B2B",borderWidth:1,borderColor: "#294B67",borderRadius:19,padding:18,gap:14},filterHeading:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:10},sectionTitle:{color: "#F3FBFF",fontSize:21,fontWeight:"900",letterSpacing:-.7},link:{color:"#AD5F0D",fontSize:12,fontWeight:"800"},label:{color:"#976123",fontSize:10,fontWeight:"900",letterSpacing:1.1},chips:{flexDirection:"row",flexWrap:"wrap",gap:7},chip:{paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderColor: "#315877",backgroundColor: "#15273D",borderRadius:999},chipActive:{backgroundColor:"#00B8FF",borderColor:"#00B8FF"},chipText:{color:"#634A33",fontSize:11,fontWeight:"800"},chipTextActive:{color:"#FFFFFF"},verifyRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:15,borderTopWidth:1,borderColor: "#294B67",paddingTop:14},verifyTitle:{color: "#F3FBFF",fontSize:13,fontWeight:"800"},verifyHint:{color: "#A4BBCE",fontSize:11,marginTop:3},resultHeading:{marginTop:7},resultCount:{color: "#A4BBCE",fontSize:12,marginTop:5},grid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between"},offer:{gap:0,marginBottom:10},offerBadge:{backgroundColor: "#173654",padding:10,borderRadius:10,marginBottom:7,flexDirection:"row",gap:7,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"},savings:{color: "#7AD8FF",fontSize:12,fontWeight:"900"},discount:{color:"#775638",fontSize:10,fontWeight:"700"},empty:{minHeight:170,alignItems:"center",justifyContent:"center",gap:11,padding:22,borderRadius:18,borderWidth:1,borderColor: "#294B67",backgroundColor: "#101B2B"},emptyTitle:{color: "#F3FBFF",fontSize:20,fontWeight:"900",textAlign:"center"},emptyText:{color:"#676767",fontSize:13,lineHeight:20,textAlign:"center"},action:{borderRadius:11,backgroundColor:"#00B8FF",paddingVertical:12,paddingHorizontal:18},actionText:{fontSize:13,fontWeight:"900",color:"#FFFFFF"},status:{paddingVertical:35,textAlign:"center",color: "#A4BBCE"},pager:{flexDirection:"row",justifyContent:"center",alignItems:"center",gap:18,marginTop:12},pageButton:{padding:11,borderRadius:10,borderColor:"#DED2C4",borderWidth:1},disabled:{opacity:.4},pageLabel:{color:"#555555",fontSize:12,fontWeight:"800"},footnote:{color:"#737373",fontSize:11,lineHeight:19,marginTop:8,marginBottom:14},
});
