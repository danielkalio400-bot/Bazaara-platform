import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ApiError, groceryApi } from "@/lib/api";
import { signInWithBazId } from "@/lib/auth";
import { groceryPalette } from "./theme";

type WishlistBody = { products: Array<{ id: string }> };

export function GroceryWishlistHeart({
  productId,
  variantId,
  returnTo = "/(tabs)",
  size = 34,
}: {
  productId: string;
  variantId?: string | null;
  returnTo?: string;
  size?: number;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    void groceryApi
      .get<WishlistBody>("/v1/shopping/wishlist", {
        query: { vertical: "GROCERY" },
        cache: "no-store",
      })
      .then((body) => {
        if (active) setSaved(body.products.some((product) => product.id === productId));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [productId]);

  async function toggle() {
    if (busy) return;
    const previous = saved;
    const next = !previous;
    setBusy(true);
    setSaved(next);

    try {
      const body = next
        ? await groceryApi.put<WishlistBody>(
            `/v1/shopping/wishlist/${encodeURIComponent(productId)}`,
            variantId ? { variantId } : {},
            { query: { vertical: "GROCERY" } },
          )
        : await groceryApi.delete<WishlistBody>(
            `/v1/shopping/wishlist/${encodeURIComponent(productId)}`,
            { query: { vertical: "GROCERY" } },
          );

      setSaved(body.products.some((product) => product.id === productId));
    } catch (cause) {
      setSaved(previous);
      if (cause instanceof ApiError && cause.status === 401) {
        await signInWithBazId(returnTo);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved groceries" : "Save grocery"}
      accessibilityState={{ selected: saved, busy }}
      disabled={busy}
      onPress={() => void toggle()}
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: Math.round(size / 3),
        backgroundColor: saved ? "rgba(47,143,98,.15)" : "rgba(5,17,14,.82)",
      }}
    >
      <View style={{ opacity: busy ? 0.55 : 1 }}>
        <Text
          style={{
            color: saved ? groceryPalette.success : "#D9E7DF",
            fontSize: Math.round(size * 0.57),
            lineHeight: Math.round(size * 0.62),
          }}
        >
          {saved ? "♥" : "♡"}
        </Text>
      </View>
    </Pressable>
  );
}
