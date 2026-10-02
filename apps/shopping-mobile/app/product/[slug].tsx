import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, CartButton, Field, Screen, SectionTitle, Status, colors } from "@bazaara/mobile-ui";
import { publicApi, ApiError } from "@/lib/api";
import { isSignedIn, signInWithBazId } from "@/lib/auth";
import { type ProductDetail, type ProductSummary, type ReviewListResponse, money } from "@/lib/types";
import { useCartState } from "@/state/cart";

type WishlistResponse = { products: ProductSummary[] };

export default function ProductPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<ReviewListResponse | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { count, quantities, busyVariantId, refresh: refreshCart, setVariantQuantity } = useCartState();

  useEffect(() => {
    if (!slug) return;
    void publicApi
      .get<{ product: ProductDetail }>(`/v1/shopping/products/${encodeURIComponent(slug)}`)
      .then(({ product: next }) => {
        setProduct(next);
        setVariantId(next.defaultVariantId ?? next.variants[0]?.id ?? null);
        return Promise.all([
          publicApi.get<ReviewListResponse>(`/v1/shopping/products/${encodeURIComponent(next.id)}/reviews`, { query: { page: 1, limit: 8 } }).catch(() => null),
          isSignedIn().then(async (signedIn) => signedIn ? publicApi.get<WishlistResponse>("/v1/shopping/wishlist").catch(() => null) : null),
        ]).then(([reviewBodyResult, wishlist]) => {
          if (reviewBodyResult) setReviews(reviewBodyResult);
          if (wishlist) setSaved(wishlist.products.some((item) => item.id === next.id));
        });
      })
      .catch((cause) => setMessage(cause instanceof Error ? cause.message : "Could not load product"));
    void refreshCart();
  }, [refreshCart, slug]);

  const variant = useMemo(() => product?.variants.find((item) => item.id === variantId) ?? product?.variants[0], [product, variantId]);

  if (!product) return <Screen tabBarSafe={false}><Text style={styles.loading}>{message || "Loading product…"}</Text></Screen>;

  const productId = product.id;
  const media = product.media.length
    ? product.media.filter((item) => item.type === "IMAGE")
    : product.image
      ? [{ id: "primary", type: "IMAGE" as const, url: product.image.url, alt: product.image.alt }]
      : [];
  const imageWidth = Math.min(width - 32, 340);
  const quantity = variant ? quantities[variant.id] ?? 0 : 0;

  async function changeQuantity(nextQuantity: number) {
    if (!variant) return;
    setMessage("");
    try {
      await setVariantQuantity(variant.id, nextQuantity);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not update cart");
    }
  }

  async function toggleSave() {
    setMessage("");
    try {
      if (!(await isSignedIn())) {
        const auth = await signInWithBazId(`/product/${encodeURIComponent(String(slug))}`);
        if (!auth.ok) { setMessage("BazID authorization was cancelled."); return; }
      }
      if (saved) await publicApi.delete(`/v1/shopping/wishlist/${encodeURIComponent(productId)}`);
      else await publicApi.put(`/v1/shopping/wishlist/${encodeURIComponent(productId)}`);
      setSaved((value) => !value);
      setMessage(saved ? "Removed from Wishlist" : "Saved to Wishlist");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setMessage("BazID session expired. Sign in again.");
      else setMessage(cause instanceof Error ? cause.message : "Could not update Wishlist");
    }
  }

  async function submitReview() {
    setBusy(true); setMessage("");
    try {
      if (!(await isSignedIn())) {
        const auth = await signInWithBazId(`/product/${encodeURIComponent(String(slug))}`);
        if (!auth.ok) { setMessage("BazID authorization was cancelled."); return; }
      }
      const body = await publicApi.post<{ review: unknown; summary: ReviewListResponse["summary"] }>(
        `/v1/shopping/products/${encodeURIComponent(productId)}/reviews`,
        { rating, title: reviewTitle.trim() || undefined, body: reviewBody.trim() || undefined }
      );
      const refreshed = await publicApi.get<ReviewListResponse>(`/v1/shopping/products/${encodeURIComponent(productId)}/reviews`, { query: { page: 1, limit: 8 } });
      setReviews({ ...refreshed, summary: body.summary });
      setReviewTitle(""); setReviewBody("");
      setMessage("Review published");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not publish review");
    } finally { setBusy(false); }
  }

  return (
    <Screen tabBarSafe={false}>
      <View style={styles.topRow}>
        <View />
        <CartButton count={count} onPress={() => router.push("/(tabs)/cart")} />
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
        {media.map((item) => <Image key={item.id} source={{ uri: item.url }} style={[styles.image, { width: imageWidth }]} resizeMode="cover" />)}
      </ScrollView>

      <Text style={styles.brand}>{product.brand?.name ?? "BAZAARA"}</Text>
      <Text maxFontSizeMultiplier={1.1} style={styles.title}>{product.title}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{money(variant?.priceMinor ?? product.priceMinor, product.currency)}</Text>
        {variant?.compareAtPriceMinor ? <Text style={styles.oldPrice}>{money(variant.compareAtPriceMinor, product.currency)}</Text> : null}
      </View>
      <Status label={(variant?.availableQuantity ?? 0) > 0 ? "In stock" : "Out of stock"} kind={(variant?.availableQuantity ?? 0) > 0 ? "success" : "danger"} />

      {product.variants.length > 1 ? (
        <>
          <SectionTitle title="Choose option" />
          <View style={styles.variants}>
            {product.variants.map((item) => (
              <Pressable key={item.id} onPress={() => setVariantId(item.id)} style={[styles.variant, item.id === variantId && styles.variantActive]}>
                <Text style={styles.variantText}>{item.title}</Text>
                <Text style={styles.variantQty}>{item.availableQuantity} available</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        {quantity > 0 ? (
          <View style={styles.detailQty}>
            <Pressable disabled={!variant || busyVariantId === variant.id} onPress={() => void changeQuantity(quantity - 1)} style={styles.detailQtyButton}><Text style={styles.detailQtyButtonText}>−</Text></Pressable>
            <Text style={styles.detailQtyValue}>{quantity}</Text>
            <Pressable disabled={!variant || busyVariantId === variant.id || quantity >= variant.availableQuantity} onPress={() => void changeQuantity(quantity + 1)} style={styles.detailQtyButton}><Text style={styles.detailQtyButtonText}>+</Text></Pressable>
          </View>
        ) : (
          <Button label="Add to cart" onPress={() => void changeQuantity(1)} loading={!!variant && busyVariantId === variant.id} disabled={!variant || variant.availableQuantity < 1} />
        )}
        <View style={styles.actionRow}>
          <View style={styles.actionHalf}><Button label={saved ? "♥ In Wishlist" : "♡ Wishlist"} compact kind="secondary" onPress={() => void toggleSave()} /></View>
          <View style={styles.actionHalf}><Button label="View cart" compact kind="secondary" onPress={() => router.push("/(tabs)/cart")} /></View>
        </View>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Card style={styles.info}>
        {product.seller ? (
          <Pressable onPress={() => router.push({ pathname: "/seller/[slug]", params: { slug: product.seller!.slug } })}>
            <Text style={styles.seller}>Sold by {product.seller.name}{product.seller.verified ? " · Verified" : ""} ›</Text>
          </Pressable>
        ) : <Text style={styles.seller}>Sold by Bazaara seller</Text>}
        <Text style={styles.description}>{product.description}</Text>
      </Card>

      <SectionTitle eyebrow="Customer feedback" title={reviews ? `${reviews.summary.average.toFixed(1)} ★ · ${reviews.summary.count} reviews` : "Reviews"} />
      {reviews?.reviews.slice(0, 4).map((review) => (
        <Card key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHead}><Text style={styles.reviewRating}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text><Text style={styles.reviewer}>{review.reviewer}</Text></View>
          {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
          {review.body ? <Text style={styles.reviewBody}>{review.body}</Text> : null}
          {review.verifiedPurchase ? <Text style={styles.verified}>✓ Verified purchase</Text> : null}
        </Card>
      ))}

      <Card style={styles.reviewForm}>
        <Text style={styles.reviewFormTitle}>Review this product</Text>
        <View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} hitSlop={5}><Text style={[styles.star, value <= rating && styles.starActive]}>★</Text></Pressable>)}</View>
        <Field label="Title (optional)" value={reviewTitle} onChangeText={setReviewTitle} />
        <Field label="Review (optional)" value={reviewBody} onChangeText={setReviewBody} multiline />
        <Button label="Submit verified review" loading={busy} onPress={() => void submitReview()} />
        <Text style={styles.reviewNote}>Only customers with a delivered order for this product can publish a verified review.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  loading: { color: colors.muted, marginTop: 24 },
  gallery: { alignSelf: "center", width: "100%", maxWidth: 340, backgroundColor: colors.light, borderRadius: 15, overflow: "hidden" },
  image: { aspectRatio: 1.22 },
  brand: { marginTop: 13, color: colors.orange, fontWeight: "900", fontSize: 9, letterSpacing: 1, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 21, lineHeight: 25, fontWeight: "900", letterSpacing: -0.6, marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginVertical: 9 },
  price: { color: colors.orange, fontSize: 21, fontWeight: "900" },
  oldPrice: { color: colors.muted2, fontSize: 11, textDecorationLine: "line-through" },
  variants: { gap: 7 },
  variant: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, borderRadius: 10, padding: 9 },
  variantActive: { borderColor: colors.indigoBright, backgroundColor: colors.card },
  variantText: { color: colors.text, fontWeight: "800", fontSize: 11 },
  variantQty: { color: colors.muted2, fontSize: 9, marginTop: 2 },
  actions: { gap: 8, marginTop: 13 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionHalf: { flex: 1 },
  detailQty: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: colors.indigoBright, backgroundColor: colors.card },
  detailQtyButton: { width: 54, alignSelf: "stretch", alignItems: "center", justifyContent: "center", backgroundColor: colors.indigo },
  detailQtyButtonText: { color: colors.white, fontSize: 22, fontWeight: "900" },
  detailQtyValue: { color: colors.text, fontSize: 15, fontWeight: "900" },
  message: { color: "#86EFAC", fontSize: 11, marginTop: 8 },
  info: { marginTop: 14 },
  seller: { color: colors.indigoBright, fontWeight: "800", fontSize: 11, marginBottom: 7 },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  reviewCard: { marginBottom: 8, gap: 5 },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  reviewRating: { color: colors.orange, fontSize: 12, fontWeight: "900" },
  reviewer: { color: colors.muted2, fontSize: 9 },
  reviewTitle: { color: colors.text, fontWeight: "800", fontSize: 11 },
  reviewBody: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  verified: { color: colors.green, fontSize: 9, fontWeight: "800" },
  reviewForm: { marginTop: 10 },
  reviewFormTitle: { color: colors.text, fontWeight: "900", fontSize: 15, marginBottom: 6 },
  stars: { flexDirection: "row", gap: 7, marginBottom: 8 },
  star: { color: colors.muted2, fontSize: 25 },
  starActive: { color: colors.orange },
  reviewNote: { color: colors.muted2, fontSize: 9, lineHeight: 14, marginTop: 7 },
});
