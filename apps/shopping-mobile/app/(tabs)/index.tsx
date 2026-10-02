/* BAZAARA_SHOPPING_RESTORED_BLUE_V15 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  CartButton,
  ProductCard,
  Screen,
  SectionTitle,
  colors,
  useMobileLayout,
} from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import {
  type Category,
  type ProductSummary,
  discountPercent,
  money,
} from "@/lib/types";
import { isSignedIn, signInWithBazId } from "@/lib/auth";
import { useCartState } from "@/state/cart";
import { ShoppingSearchBar } from "@/components/shopping-search-bar";

type ShoppingHome = {
  categories?: Category[];
  products?: ProductSummary[];
  featured?: ProductSummary[];
  deals?: ProductSummary[];
  newArrivals?: ProductSummary[];
};

type WishlistResponse = { products: ProductSummary[] };

function categoryGlyph(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("elect")) return "⌁";
  if (normalized.includes("comput")) return "▰";
  if (normalized.includes("home") || normalized.includes("kitchen")) return "⌂";
  if (normalized.includes("fashion")) return "◇";
  if (normalized.includes("beaut")) return "✦";
  if (normalized.includes("baby") || normalized.includes("kid")) return "●";
  if (normalized.includes("sport")) return "◉";
  return "◆";
}

export default function ShoppingNeonHomePage() {
  const layout = useMobileLayout();
  const [home, setHome] = useState<ShoppingHome | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const {
    count,
    quantities,
    busyVariantId,
    refresh: refreshCart,
    setVariantQuantity,
  } = useCartState();

  const products = home?.products ?? home?.featured ?? [];

  const deals = useMemo(() => {
    const discounted = home?.deals?.length ? home.deals : products.filter(
      (product) => Boolean(product.compareAtPriceMinor) &&
        Number(product.compareAtPriceMinor) > product.priceMinor,
    );
    return discounted.slice(0, 6);
  }, [products, home?.deals]);

  const recommended = useMemo(
    () => (home?.newArrivals?.length ? home.newArrivals.slice(0, 6) :
      products.length > 6 ? products.slice(6, 12) : products.slice(0, 6)),
    [products, home?.newArrivals],
  );

  const loadSaved = useCallback(async () => {
    try {
      if (!(await isSignedIn())) {
        setSavedIds(new Set());
        return;
      }

      const body = await publicApi.get<WishlistResponse>("/v1/shopping/wishlist");
      setSavedIds(new Set(body.products.map((product) => product.id)));
    } catch {
      // Home remains useful without wishlist state.
    }
  }, []);

  const load = useCallback(async () => {
    setError("");

    try {
      setHome(await publicApi.get<ShoppingHome>("/v1/shopping/home"));
    } catch (cause) {
      setHome(null);
      setError(cause instanceof Error ? cause.message : "Could not load Shopping");
    }
  }, []);

  useEffect(() => {
    void load();
    void refreshCart();
    void loadSaved();
  }, [load, loadSaved, refreshCart]);

  useFocusEffect(
    useCallback(() => {
      void refreshCart();
      void loadSaved();
    }, [loadSaved, refreshCart]),
  );

  function submitSearch() {
    const q = query.trim();
    router.push({ pathname: "/search-results", params: q ? { q } : {} });
  }

  async function setProductQuantity(product: ProductSummary, quantity: number) {
    if (!product.defaultVariantId) return;

    try {
      await setVariantQuantity(product.defaultVariantId, quantity);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update cart");
    }
  }

  async function toggleSave(product: ProductSummary) {
    try {
      if (!(await isSignedIn())) {
        const auth = await signInWithBazId();
        if (!auth.ok) return;
      }

      const saved = savedIds.has(product.id);

      if (saved) {
        await publicApi.delete(`/v1/shopping/wishlist/${encodeURIComponent(product.id)}`);
      } else {
        await publicApi.put(`/v1/shopping/wishlist/${encodeURIComponent(product.id)}`);
      }

      setSavedIds((current) => {
        const next = new Set(current);
        saved ? next.delete(product.id) : next.add(product.id);
        return next;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update Wishlist");
    }
  }

  function renderProduct(product: ProductSummary) {
    const variantId = product.defaultVariantId;
    const quantity = variantId ? quantities[variantId] ?? 0 : 0;

    return (
      <ProductCard
        key={product.id}
        title={product.title}
        brand={product.brand?.name}
        image={product.image?.url}
        seller={product.seller?.name}
        price={money(product.priceMinor, product.currency)}
        oldPrice={
          product.compareAtPriceMinor
            ? money(product.compareAtPriceMinor, product.currency)
            : null
        }
        discount={discountPercent(product.priceMinor, product.compareAtPriceMinor)}
        inStock={product.stock === "IN_STOCK"}
        saved={savedIds.has(product.id)}
        addBusy={Boolean(variantId) && busyVariantId === variantId}
        quantity={quantity}
        maxQuantity={product.availableQuantity}
        onPress={() =>
          router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })
        }
        onAdd={() => void setProductQuantity(product, 1)}
        onIncrement={() => void setProductQuantity(product, quantity + 1)}
        onDecrement={() => void setProductQuantity(product, quantity - 1)}
        onSave={() => void toggleSave(product)}
        onSeller={
          product.seller
            ? () =>
                router.push({
                  pathname: "/seller/[slug]",
                  params: { slug: product.seller!.slug },
                })
            : undefined
        }
      />
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <View style={styles.brandLine}>
            <Text style={styles.brand}>BAZAARA <Text style={styles.brandAccent}>Shopping</Text></Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SHOPPING</Text>
            </View>
          </View>
          <Text style={styles.subBrand}>Discover deals, favourites and everyday essentials.</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Notifications"
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Text style={styles.iconText}>●</Text>
          </Pressable>
          <CartButton count={count} onPress={() => router.push("/(tabs)/cart")} />
        </View>
      </View>

      <ShoppingSearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={submitSearch}
      />

      <View style={styles.hero}>

        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>YOUR EVERYDAY SHOP</Text>
          </View>
          <Text style={styles.heroSignal}>SHOP · SAVE · ENJOY</Text>
        </View>

        <Text style={[styles.heroTitle, layout.compact && styles.heroTitleCompact]}>
          FIND GREAT{"\n"}
          <Text style={styles.heroAccent}>EVERYDAY DEALS</Text>
        </Text>

        <Text style={styles.heroCopy}>
          Browse categories, discover current deals and check out with BAZAARA.
        </Text>

        <View style={styles.heroActions}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/search-results",
                params: { vertical: "SHOPPING", sort: "featured" },
              })
            }
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Shop now</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/bazai")}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Ask BazAI</Text>
          </Pressable>
        </View>

        <View style={styles.heroProof}>
          <Text style={styles.heroProofText}>✓ BazID</Text>
          <Text style={styles.heroProofText}>✓ Verified sellers</Text>
          <Text style={styles.heroProofText}>✓ Guest cart</Text>
        </View>
      </View>

      {(home?.categories ?? []).length > 0 ? (
        <>
          <SectionTitle
            eyebrow="SHOP BY CATEGORY"
            title="What are you shopping for?"
            action={
              <Pressable onPress={() => router.push("/(tabs)/categories")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            }
          />

          <View style={styles.categories}>
            {(home?.categories ?? []).slice(0, 8).map((category) => (
              <Pressable
                key={category.id}
                onPress={() =>
                  router.push({
                    pathname: "/search-results",
                    params: { category: category.slug },
                  })
                }
                style={({ pressed }) => [styles.category, pressed && styles.pressed]}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryGlyph}>{categoryGlyph(category.name)}</Text>
                </View>
                <Text numberOfLines={1} style={styles.categoryLabel}>{category.name}</Text>
                <Text style={styles.categoryArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionTitle
        eyebrow={deals.length ? "CURRENT DEALS" : "FEATURED PRODUCTS"}
        title={deals.length ? "Deals you can shop" : "Explore products"}
        action={
          <Pressable
            onPress={() =>
              router.push(deals.length ? "/deals" : "/search-results")
            }
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        }
      />

      {(deals.length ? deals : products.slice(0, 6)).length > 0 ? (
        <View style={styles.grid}>{(deals.length ? deals : products.slice(0, 6)).map(renderProduct)}</View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyKicker}>SHOPPING</Text>
          <Text style={styles.emptyTitle}>{error ? "Catalogue unavailable" : "Products will appear here"}</Text>
          <Text style={styles.emptyText}>{error || "There are no active listings yet."}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load()}><Text style={styles.seeAll}>Retry loading ↗</Text></Pressable>
        </View>
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="Open Smart Find guided shopping" onPress={() => router.push("/smart-shop")}
        style={({pressed}) => [styles.smartEntry, pressed && styles.pressed]}>
        <View style={{flex:1,minWidth:0}}><Text style={styles.smartEntryKicker}>NEED SOMETHING SPECIFIC?</Text>
          <Text style={styles.smartEntryTitle}>Smart Find</Text>
          <Text style={styles.smartEntryHint}>Try “verified headphones under ₦50k”</Text></View>
        <Text style={styles.smartEntryArrow}>↗</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Open Deal Radar, real in-stock discounted products" onPress={() => router.push("/deals")}
        style={({pressed}) => [styles.smartEntry, styles.dealsEntry, pressed && styles.pressed]}>
        <View style={{flex:1,minWidth:0}}><Text style={styles.smartEntryKicker}>CURRENT OFFERS</Text>
          <Text style={styles.smartEntryTitle}>Shop available deals</Text>
          <Text style={styles.smartEntryHint}>Browse discounted, in-stock products.</Text></View>
        <Text style={styles.smartEntryArrow}>↗</Text>
      </Pressable>

      <SectionTitle eyebrow="VALUE PICKS" title="Shop by budget" action={<Pressable onPress={() => router.push("/smart-shop")}><Text style={styles.seeAll}>Smart Find ↗</Text></Pressable>} />
      <View style={styles.smartShelves}>
        {[
          { label: "Under ₦25k", maxPriceMinor: "2500000" },
          { label: "Under ₦100k", maxPriceMinor: "10000000" },
          { label: "Under ₦500k", maxPriceMinor: "50000000" },
        ].map((range) => <Pressable key={range.label} accessibilityRole="button" onPress={() => router.push({pathname:"/search-results",params:{maxPriceMinor:range.maxPriceMinor,inStock:"true",vertical:"SHOPPING"}})}
          style={({pressed}) => [styles.smartShelf, pressed && styles.pressed]}><Text style={styles.smartShelfLabel}>BUDGET FINDS</Text><Text style={styles.smartShelfTitle}>{range.label}</Text><Text style={styles.smartShelfLink}>Browse items ↗</Text></Pressable>)}
        <Pressable accessibilityRole="button" onPress={() => router.push({pathname:"/search-results",params:{verifiedSeller:"true",inStock:"true",vertical:"SHOPPING"}})}
          style={({pressed}) => [styles.smartShelf, styles.verifiedShelf, pressed && styles.pressed]}><Text style={styles.smartShelfLabel}>SHOP CONFIDENTLY</Text><Text style={styles.smartShelfTitle}>Verified sellers</Text><Text style={styles.smartShelfLink}>Browse sellers ↗</Text></Pressable>
      </View>

      <View style={styles.quickGrid}>
        <Pressable
          onPress={() => router.push("/baz-lens")}
          style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
        >
          <View style={styles.quickIcon}><Text style={styles.quickIconText}>◉</Text></View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickKicker}>VISUAL SEARCH</Text>
            <Text style={styles.quickTitle}>Baz Lens</Text>
          </View>
          <Text style={styles.quickArrow}>↗</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/wishlist")}
          style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
        >
          <View style={[styles.quickIcon, styles.quickIconViolet]}><Text style={styles.quickIconText}>♡</Text></View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickKicker}>SAVE PRODUCTS</Text>
            <Text style={styles.quickTitle}>Wishlist</Text>
          </View>
          <Text style={styles.quickArrow}>↗</Text>
        </Pressable>
      </View>

      {recommended.length > 0 ? (
        <>
          <SectionTitle
            eyebrow="JUST ADDED"
            title="New arrivals"
            action={
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/search-results",
                    params: { vertical: "SHOPPING", sort: "featured" },
                  })
                }
              >
                <Text style={styles.seeAll}>Browse</Text>
              </Pressable>
            }
          />
          <View style={styles.grid}>{recommended.map(renderProduct)}</View>
        </>
      ) : null}

      <View style={styles.systemPanel}>
        <Text style={styles.systemKicker}>YOUR SHOPPING SYSTEM</Text>
        <Text style={styles.systemTitle}>Connected through BazID.</Text>
        <Text style={styles.systemCopy}>
          Orders, Wishlist and support remain attached to your Shopping account.
        </Text>

        <View style={styles.systemActions}>
          <Pressable onPress={() => router.push("/(tabs)/orders")} style={styles.systemAction}>
            <Text style={styles.systemActionText}>Orders</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/wishlist")} style={styles.systemAction}>
            <Text style={styles.systemActionText}>Wishlist</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/support")} style={styles.systemAction}>
            <Text style={styles.systemActionText}>Support</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#030915",
  },
  header: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  brandBlock: { flex: 1, minWidth: 0 },
  brandLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  brandAccent: { color: "#00B8FF" },
  brand: {
    color: "#F3FBFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  liveBadge: {
    minHeight: 21,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(66,216,138,.2)",
    backgroundColor: "rgba(66,216,138,.05)",
  },
  liveDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: "#329B5E" },
  liveText: {
    color: "#2D804F",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  subBrand: {
    color: "#A4BBCE",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 4,
  },
  headerActions: { flexDirection: "row", gap: 7, alignItems: "center" },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#294B67",
    backgroundColor: "#101B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#00B8FF", fontSize: 10 },

  hero: {
    position: "relative",
    minHeight: 225,
    overflow: "hidden",
    justifyContent: "center",
    borderRadius: 14,
    padding: 19,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#3F82A7",
    backgroundColor: "#0F2C4C",
  },
  heroGridA: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "31%",
    height: 1,
    backgroundColor: "rgba(71,227,255,.08)",
  },
  heroGridB: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "67%",
    width: 1,
    backgroundColor: "rgba(71,227,255,.07)",
  },
  heroGlowBlue: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    top: -110,
    right: -95,
    backgroundColor: "rgba(0,168,255,.13)",
  },
  heroGlowViolet: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 210,
    bottom: -120,
    right: 55,
    backgroundColor: "rgba(165,65,255,.09)",
  },
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroBadge: {
    minHeight: 24,
    paddingHorizontal: 8,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#00B8FF",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  heroSignal: {
    color: "#9CBFDE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#F3FBFF",
    fontSize: 31,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -2,
    marginTop: 18,
  },
  heroTitleCompact: { fontSize: 28, lineHeight: 29 },
  heroAccent: { color: "#57CCFF" },
  heroCopy: {
    maxWidth: 430,
    color: "#B5CDE1",
    fontSize: 11.5,
    lineHeight: 18.5,
    marginTop: 13,
  },
  heroActions: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButton: {
    minHeight: 43,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 10,
    backgroundColor: "#00B8FF",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 10.5, fontWeight: "900" },
  primaryButtonArrow: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  secondaryButton: {
    minHeight: 43,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(71,227,255,.22)",
    backgroundColor: "rgba(255,255,255,.8)",
  },
  secondaryButtonText: { color: "#653A18", fontSize: 9.5, fontWeight: "800" },
  heroProof: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroProofText: { color: "#B5CDE1", fontSize: 11, fontWeight: "700" },

  dealsEntry: { backgroundColor: "#142A3D", borderColor: "#315A82" },
  smartEntry: { marginTop: 12, padding: 16, minHeight: 90, borderRadius: 16, borderWidth: 1, borderColor: "#315877", backgroundColor: "#101B2B", flexDirection: "row", alignItems: "center", gap: 10 },
  smartEntryKicker: { fontSize: 10, letterSpacing: 1.2, color: "#81D7FF", fontWeight: "900" },
  smartEntryTitle: { fontSize: 17, color: "#F3FBFF", fontWeight: "900", marginTop: 4, letterSpacing: -.4 },
  smartEntryHint: { fontSize: 12, lineHeight: 17, marginTop: 5, color: "#A4BBCE" },
  smartEntryArrow: { fontSize: 24, color: "#81D7FF", fontWeight: "800" },
  smartShelves: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  smartShelf: { width: "48%", flexGrow: 1, minHeight: 115, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: "#294E73", backgroundColor: "#101B2B", justifyContent: "space-between" },
  verifiedShelf: { backgroundColor: "#182E49", borderColor: "#39776E" },
  smartShelfLabel: { fontSize: 10, color: "#81D7FF", letterSpacing: 1, fontWeight: "900" },
  smartShelfTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900", letterSpacing: -.6, color: "#F3FBFF" },
  smartShelfLink: { fontSize: 12, color: "#7AD8FF", fontWeight: "800" },
  quickGrid: { flexDirection: "row", gap: 8, marginTop: 9 },
  quickCard: {
    flex: 1,
    minHeight: 82,
    padding: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#294B67",
    backgroundColor: "#101B2B",
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1DF",
  },
  quickIconViolet: { backgroundColor: "#FFF1DF" },
  quickIconText: { color: "#00B8FF", fontSize: 12, fontWeight: "900" },
  quickCopy: { flex: 1, minWidth: 0 },
  quickKicker: {
    color: "#96602B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.55,
  },
  quickTitle: { color: "#DCEBF7", fontSize: 13, fontWeight: "900", marginTop: 2 },
  quickArrow: { color: "#7AD8FF", fontSize: 10 },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  category: {
    width: "49%",
    minHeight: 64,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#294B67",
    backgroundColor: "#101B2B",
  },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1DF",
  },
  categoryGlyph: { color: "#00B8FF", fontSize: 13, fontWeight: "900" },
  categoryLabel: {
    flex: 1,
    color: "#F3FBFF",
    fontSize: 12,
    fontWeight: "800",
  },
  categoryArrow: { color: "#7AD8FF", fontSize: 10 },

  seeAll: { color: "#00B8FF", fontSize: 10.5, fontWeight: "900" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  error: { color: "#FDA4AF", marginTop: 10, fontSize: 10.5 },
  empty: {
    minHeight: 130,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#294B67",
    backgroundColor: "#0F2C4C",
  },
  emptyKicker: {
    color: "#00B8FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  emptyTitle: { color: "#F3FBFF", fontSize: 14, fontWeight: "900", marginTop: 5 },
  emptyText: { color: "#A4BBCE", fontSize: 12, marginTop: 3 },

  systemPanel: {
    marginTop: 23,
    padding: 16,
    borderWidth: 1,
    borderColor: "#294B67",
    borderRadius: 16,
    backgroundColor: "#101B2B",
  },
  systemKicker: {
    color: "#00B8FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  systemTitle: {
    color: "#F3FBFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
  },
  systemCopy: { color: "#71879F", fontSize: 9.5, lineHeight: 14, marginTop: 4 },
  systemActions: { flexDirection: "row", gap: 7, marginTop: 12 },
  systemAction: {
    flex: 1,
    minHeight: 37,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#294B67",
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,.015)",
  },
  systemActionText: { color: "#A5B7C8", fontSize: 8.8, fontWeight: "800" },
  pressed: { opacity: 0.82 },
});
