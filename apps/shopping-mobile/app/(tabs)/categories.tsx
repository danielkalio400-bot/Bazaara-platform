import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Screen, colors } from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import { type ProductSummary } from "@/lib/types";
import { useCartState } from "@/state/cart";
import { ShoppingSearchBar } from "@/components/shopping-search-bar";

type Leaf = { slug: string; label: string; query: string };
type Group = { slug: string; label: string; query: string; items: Leaf[] };
type ParentCategory = {
  slug: string;
  label: string;
  desktopLabel?: string;
  query: string;
  mobile?: boolean;
  desktop?: boolean;
  groups: Group[];
};
type CategoryNavigationResponse = { categories: ParentCategory[] };

const imageCache = new Map<string, string | null>();

function fallbackEmoji(_label: string) {
  return "◫";
}

function CategoryTile({
  item,
  imageUrl,
  onPress,
  tileWidth,
}: {
  item: Leaf;
  imageUrl?: string | null;
  onPress: () => void;
  tileWidth: `${number}%`;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tile, { width: tileWidth }, pressed && styles.pressed]}>
      <View style={styles.tileMedia}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} resizeMode="contain" style={styles.tileImage} />
        ) : (
          <Text style={styles.tileFallback}>{fallbackEmoji(item.label)}</Text>
        )}
      </View>
      <Text numberOfLines={2} style={styles.tileLabel}>{item.label}</Text>
    </Pressable>
  );
}

export default function CategoriesPage() {
  const { width } = useWindowDimensions();
  const tablet = width >= 600;
  const railWidth = tablet ? 172 : 112;
  const tileWidth = (tablet ? "23%" : "31%") as `${number}%`;
  const params = useLocalSearchParams<{ category?: string }>();
  const [navigation, setNavigation] = useState<ParentCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState(typeof params.category === "string" ? params.category : "");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [tileImages, setTileImages] = useState<Record<string, string | null>>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const attempted = useRef(new Set<string>());
  const { refresh: refreshCart } = useCartState();

  const mobileNavigation = useMemo(
    () => navigation.filter((item) => item.mobile !== false),
    [navigation]
  );

  const active = useMemo(
    () => mobileNavigation.find((item) => item.slug === activeSlug) ?? mobileNavigation[0],
    [activeSlug, mobileNavigation]
  );

  const load = useCallback(async () => {
    setError("");
    try {
      const body = await publicApi.get<CategoryNavigationResponse>("/v1/shopping/category-navigation");
      setNavigation(body.categories);
      const visible = body.categories.filter((item) => item.mobile !== false);
      setActiveSlug((current) => {
        if (current && visible.some((item) => item.slug === current)) return current;
        const requested = typeof params.category === "string" ? params.category : "";
        if (requested && visible.some((item) => item.slug === requested)) return requested;
        return visible[0]?.slug ?? "";
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load categories");
    }
  }, [params.category]);

  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { void refreshCart(); }, [refreshCart]));

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const leaves = active.groups.flatMap((section) => section.items);
    const queue = leaves.filter((item) => !attempted.current.has(item.slug));

    if (!queue.length) return;
    setLoadingImages(true);
    queue.forEach((item) => attempted.current.add(item.slug));

    async function resolve(item: Leaf) {
      if (imageCache.has(item.slug)) return imageCache.get(item.slug) ?? null;
      try {
        const result = await publicApi.get<{ products: ProductSummary[] }>("/v1/shopping/products", {
          query: { q: item.query, sort: "featured", page: 1, limit: 1 },
        });
        const image = result.products[0]?.image?.url ?? null;
        imageCache.set(item.slug, image);
        return image;
      } catch {
        imageCache.set(item.slug, null);
        return null;
      }
    }

    async function worker(items: Leaf[]) {
      while (items.length) {
        const item = items.shift();
        if (!item) return;
        const image = await resolve(item);
        if (!cancelled) setTileImages((current) => ({ ...current, [item.slug]: image }));
      }
    }

    const work = [...queue];
    void Promise.all([worker(work), worker(work), worker(work), worker(work)]).finally(() => {
      if (!cancelled) setLoadingImages(false);
    });

    return () => { cancelled = true; };
  }, [active]);

  function submitSearch() {
    const value = query.trim();
    router.push({ pathname: "/search-results", params: value ? { q: value } : {} });
  }

  function openQuery(value: string) {
    router.push({ pathname: "/search-results", params: { q: value } });
  }

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.searchArea}>
        <ShoppingSearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={submitSearch}
          showBack
          onBack={() => router.back()}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.browser}>
        <ScrollView
          style={[styles.rail, { width: railWidth }]}
          contentContainerStyle={styles.railContent}
          showsVerticalScrollIndicator={false}
        >
          {mobileNavigation.map((item) => {
            const selected = item.slug === active?.slug;
            return (
              <Pressable
                key={item.slug}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveSlug(item.slug)}
                style={({ pressed }) => [styles.railItem, selected && styles.railItemActive, pressed && styles.pressed]}
              >
                {selected ? <View style={styles.activeBar} /> : null}
                <Text style={[styles.railText, selected && styles.railTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.detail}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          {active ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => openQuery(active.query)}
                style={({ pressed }) => [styles.allProducts, pressed && styles.pressed]}
              >
                <Text style={styles.allProductsText}>All Products</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>

              {active.groups.map((section) => (
                <View key={section.slug} style={styles.groupCard}>
                  <View style={styles.groupHead}>
                    <Text style={styles.groupTitle}>{section.label}</Text>
                    <Pressable accessibilityRole="button" onPress={() => openQuery(section.query)} hitSlop={8}>
                      <Text style={styles.seeAll}>See All</Text>
                    </Pressable>
                  </View>

                  {section.items.length ? (
                    <View style={styles.tileGrid}>
                      {section.items.map((item) => (
                        <CategoryTile
                          key={item.slug}
                          item={item}
                          imageUrl={tileImages[item.slug]}
                          onPress={() => openQuery(item.query)}
                          tileWidth={tileWidth}
                        />
                      ))}
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openQuery(section.query)}
                      style={({ pressed }) => [styles.emptyGroup, pressed && styles.pressed]}
                    >
                      <Text style={styles.emptyGroupText}>Browse {section.label}</Text>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
                  )}
                </View>
              ))}

              {loadingImages ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.indigo} />
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    backgroundColor: colors.navy,
  },
  searchArea: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  error: {
    color: "#FCA5A5",
    backgroundColor: "#3A1B2B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
  },
  browser: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.navy,
  },
  rail: {
    flexGrow: 0,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.borderStrong,
  },
  railContent: { paddingBottom: 96 },
  railItem: {
    minHeight: 78,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    position: "relative",
  },
  railItemActive: { backgroundColor: colors.card },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.indigo,
  },
  railText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  railTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  detail: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  detailContent: {
    padding: 10,
    paddingBottom: 110,
    gap: 10,
  },
  allProducts: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 15,
  },
  allProductsText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  chevron: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 29,
    fontWeight: "400",
  },
  groupCard: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  groupHead: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  groupTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "500",
  },
  seeAll: {
    color: colors.indigoBright,
    fontSize: 14,
    fontWeight: "800",
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 15,
  },
  tile: {
    alignItems: "center",
    minHeight: 104,
  },
  tileMedia: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  tileImage: { width: "100%", height: "100%" },
  tileFallback: { color: colors.muted2, fontSize: 24, fontWeight: "800" },
  tileLabel: {
    width: "100%",
    minHeight: 32,
    marginTop: 5,
    color: colors.text,
    fontSize: 10.5,
    lineHeight: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyGroup: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  emptyGroupText: { color: colors.muted, fontSize: 12 },
  loadingRow: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.72 },
});
