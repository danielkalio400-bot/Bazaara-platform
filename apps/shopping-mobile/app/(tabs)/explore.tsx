import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Card, Screen, SectionTitle, colors } from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import { type Category } from "@/lib/types";
import { ShoppingSearchBar } from "@/components/shopping-search-bar";

type PopularResponse = { searches: Array<{ query: string; count: number }> };

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      publicApi.get<{ categories: Category[] }>("/v1/shopping/categories"),
      publicApi.get<PopularResponse>("/v1/shopping/search/popular", { query: { limit: 8 } }),
    ]).then(([categoryBody, popularBody]) => { setCategories(categoryBody.categories); setPopular(popularBody.searches.map((item) => item.query)); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load Explore"));
  }, []);

  function search(value = query) { const q = value.trim(); router.push({ pathname: "/search-results", params: q ? { q } : {} }); }

  return (
    <Screen>
      <SectionTitle eyebrow="GO" title="Explore" />
      <ShoppingSearchBar value={query} onChangeText={setQuery} onSubmit={() => search()} />
      <View style={styles.verticals}>
        <Pressable onPress={() => router.push({ pathname: "/search-results", params: { vertical: "SHOPPING" } })} style={styles.vertical}><Text style={styles.verticalIcon}>▦</Text><View><Text style={styles.verticalTitle}>Marketplace</Text><Text style={styles.verticalCopy}>Products & stores</Text></View></Pressable>
        <Pressable onPress={() => router.push("/grocery")} style={styles.vertical}><Text style={styles.verticalIcon}>◉</Text><View><Text style={styles.verticalTitle}>Grocery</Text><Text style={styles.verticalCopy}>Fresh & pantry</Text></View></Pressable>
      </View>
      {popular.length ? <><SectionTitle eyebrow="Discovery" title="Trending searches" /><View style={styles.chips}>{popular.map((item) => <Pressable key={item} onPress={() => search(item)} style={styles.chip}><Text style={styles.chipText}>{item}</Text></Pressable>)}</View></> : null}
      <SectionTitle eyebrow="Browse" title="Categories" action={<Pressable onPress={() => router.push("/(tabs)/categories")}><Text style={styles.link}>All categories</Text></Pressable>} />
      <View style={styles.categoryGrid}>{categories.slice(0, 10).map((category) => <Pressable key={category.id} onPress={() => router.push({ pathname: "/search-results", params: { category: category.slug } })} style={styles.category}><Text style={styles.categoryTitle}>{category.name}</Text><Text style={styles.categoryArrow}>›</Text></Pressable>)}</View>
      <SectionTitle eyebrow="Universal discovery" title="More ways to find it" />
      <Card style={styles.info}><Text style={styles.infoTitle}>Camera search is ready</Text><Text style={styles.infoCopy}>Use the camera icon in the search field to open BazLens visual search. GO AI can also help narrow products by budget and intent.</Text><Pressable onPress={() => router.push("/(tabs)/go-ai")}><Text style={styles.link}>Ask GO AI →</Text></Pressable></Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  verticals: { flexDirection: "row", gap: 9, marginTop: 14 }, vertical: { flex: 1, minHeight: 82, flexDirection: "row", gap: 10, alignItems: "center", borderRadius: 14, padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, verticalIcon: { color: colors.orange, fontSize: 25, fontWeight: "900" }, verticalTitle: { color: colors.text, fontSize: 12, fontWeight: "900" }, verticalCopy: { color: colors.muted, fontSize: 9, marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong }, chipText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  categoryGrid: { gap: 7 }, category: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 13, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, categoryTitle: { color: colors.text, fontSize: 11, fontWeight: "800" }, categoryArrow: { color: colors.indigoBright, fontSize: 20 },
  link: { color: colors.indigoBright, fontSize: 10.5, fontWeight: "900" }, info: { gap: 6 }, infoTitle: { color: colors.text, fontWeight: "900", fontSize: 13 }, infoCopy: { color: colors.muted, fontSize: 10.5, lineHeight: 16 }, error: { color: "#FCA5A5", marginTop: 10, fontSize: 11 },
});
