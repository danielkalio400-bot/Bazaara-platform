import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { groceryMoney, type ProductSummary } from "@/lib/grocery";
import { GroceryWishlistHeart } from "./wishlist-heart";
import { groceryPalette, groceryStyles as s } from "./theme";

export function GroceryProductCard({
  product,
  onAdd,
  busy = false,
}: {
  product: ProductSummary;
  onAdd?: (product: ProductSummary) => void;
  busy?: boolean;
}) {
  const discount =
    product.compareAtPriceMinor && product.compareAtPriceMinor > product.priceMinor
      ? Math.round((1 - product.priceMinor / product.compareAtPriceMinor) * 100)
      : 0;

  return (
    <View style={s.product}>
      <View style={{ position: "relative" }}>
        <Pressable onPress={() => router.push(`/product/${product.slug}`)}>
          {product.image ? (
            <Image source={{ uri: product.image.url }} style={s.thumb} />
          ) : (
            <View style={[s.thumb, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: groceryPalette.muted2, fontSize: 9, fontWeight: "800" }}>
                GROCERY
              </Text>
            </View>
          )}
        </Pressable>

        <View style={{ position: "absolute", top: 7, right: 7 }}>
          <GroceryWishlistHeart
            productId={product.id}
            variantId={product.defaultVariantId}
            returnTo="/(tabs)"
            size={32}
          />
        </View>

        {discount > 0 ? (
          <View
            style={{
              position: "absolute",
              left: 7,
              bottom: 7,
              minHeight: 21,
              paddingHorizontal: 7,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              backgroundColor: groceryPalette.orange,
            }}
          >
            <Text style={{ color: "#241600", fontSize: 8, fontWeight: "900" }}>-{discount}%</Text>
          </View>
        ) : null}
      </View>

      <View style={s.productBody}>
        <Pressable onPress={() => router.push(`/product/${product.slug}`)}>
          <Text
            numberOfLines={1}
            style={{ color: groceryPalette.success, fontSize: 8, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.45 }}
          >
            {product.brand?.name ?? product.seller?.name ?? "Grocery"}
          </Text>
          <Text numberOfLines={2} style={[s.name, { marginTop: 3, fontSize: 12.5, lineHeight: 15.5 }]}>
            {product.title}
          </Text>
          <View style={{ marginTop: 5, flexDirection: "row", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
            <Text style={[s.price, { fontSize: 14.5 }]}>{groceryMoney(product.priceMinor, product.currency)}</Text>
            {product.compareAtPriceMinor ? (
              <Text style={{ color: groceryPalette.muted2, fontSize: 8.5, textDecorationLine: "line-through" }}>
                {groceryMoney(product.compareAtPriceMinor, product.currency)}
              </Text>
            ) : null}
          </View>
          <Text style={product.stock === "IN_STOCK" ? s.success : s.error}>
            {product.stock === "IN_STOCK" ? `${product.availableQuantity} available` : "Out of stock"}
          </Text>
        </Pressable>

        {onAdd ? (
          <Pressable
            style={[s.button, { minHeight: 36, marginTop: 4 }, (busy || product.stock !== "IN_STOCK") && { opacity: 0.45 }]}
            disabled={busy || product.stock !== "IN_STOCK" || !product.defaultVariantId}
            onPress={() => onAdd(product)}
          >
            <Text style={[s.buttonText, { fontSize: 10.5 }]}>{busy ? "Adding…" : "Add to basket"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
