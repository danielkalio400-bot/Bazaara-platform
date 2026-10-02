import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, CartButton, ProductCard, Screen, SectionTitle, colors } from "@bazaara/mobile-ui";
import { cartRequest, publicApi } from "@/lib/api";
import { isSignedIn, signInWithBazId } from "@/lib/auth";
import { type ProductSummary, type ReviewListResponse, discountPercent, money } from "@/lib/types";
import { useCartState } from "@/state/cart";

type SearchResponse = { products: ProductSummary[] };
type WishlistResponse = { products: ProductSummary[] };

export default function SellerPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [reviews, setReviews] = useState<ReviewListResponse | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { count, setCount } = useCartState();

  useEffect(() => {
    if (!slug) return;
    void Promise.all([
      publicApi.get<SearchResponse>("/v1/shopping/search", { query: { seller: slug, inStock: "true", sort: "featured", page: 1, limit: 30 } }),
      publicApi.get<ReviewListResponse>(`/v1/shopping/sellers/${encodeURIComponent(slug)}/reviews`, { query: { page: 1, limit: 5 } }).catch(() => null),
      isSignedIn().then(async (signed) => signed ? publicApi.get<WishlistResponse>("/v1/shopping/wishlist").catch(() => null) : null),
    ]).then(([search, reviewBody, wishlist]) => {
      setProducts(search.products);
      if (reviewBody) setReviews(reviewBody);
      if (wishlist) setSavedIds(new Set(wishlist.products.map((item) => item.id)));
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load seller"));
  }, [slug]);

  async function add(product: ProductSummary) {
    if (!product.defaultVariantId) return;
    setBusyId(product.id);
    try {
      const body = await cartRequest<{ cart: { itemCount: number } }>("/v1/shopping/cart/items", { method: "POST", body: { variantId: product.defaultVariantId, quantity: 1 } });
      setCount(body.cart.itemCount);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add item"); }
    finally { setBusyId(null); }
  }

  async function toggleSave(product: ProductSummary) {
    try {
      if (!(await isSignedIn())) {
        const auth = await signInWithBazId();
        if (!auth.ok) return;
      }
      const isSaved = savedIds.has(product.id);
      if (isSaved) await publicApi.delete(`/v1/shopping/wishlist/${encodeURIComponent(product.id)}`);
      else await publicApi.put(`/v1/shopping/wishlist/${encodeURIComponent(product.id)}`);
      setSavedIds((current) => { const next = new Set(current); if (isSaved) next.delete(product.id); else next.add(product.id); return next; });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update Wishlist"); }
  }

  const sellerName = products[0]?.seller?.name ?? slug ?? "Seller";
  return (
    <Screen tabBarSafe={false}>
      <View style={styles.top}><Button compact kind="secondary" label="‹ Back" onPress={() => router.back()} /><CartButton count={count} onPress={() => router.push("/(tabs)/cart")} /></View>
      <SectionTitle eyebrow="Seller store" title={sellerName} />
      {reviews ? <Text style={styles.rating}>{reviews.summary.average.toFixed(1)} ★ · {reviews.summary.count} seller reviews</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>
        {products.map((product) => <ProductCard key={product.id} title={product.title} brand={product.brand?.name} image={product.image?.url} seller={product.seller?.name} price={money(product.priceMinor, product.currency)} oldPrice={product.compareAtPriceMinor ? money(product.compareAtPriceMinor, product.currency) : null} discount={discountPercent(product.priceMinor, product.compareAtPriceMinor)} inStock={product.stock === "IN_STOCK"} saved={savedIds.has(product.id)} addBusy={busyId === product.id} onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })} onAdd={() => void add(product)} onSave={() => void toggleSave(product)} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rating: { color: colors.orange, fontSize: 12, fontWeight: "800", marginBottom: 12 },
  error: { color: "#FCA5A5", marginBottom: 9, fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
});
