import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pill, ProductCard, Screen, colors } from "@bazaara/mobile-ui";
import { ShoppingSearchBar } from "@/components/shopping-search-bar";
import { publicApi } from "@/lib/api";
import { isSignedIn, signInWithBazId } from "@/lib/auth";
import { type ProductSummary, discountPercent, money } from "@/lib/types";
import { useCartState } from "@/state/cart";

type Suggestion = { type: "query" | "product" | "brand" | "category" | "seller"; label: string; value: string };
type Facet = { slug: string; name: string; count: number };
type SearchResponse = {
  products: ProductSummary[];
  pagination: { page: number; limit: number; total: number; pages: number };
  facets: { brands: Facet[]; categories: Facet[]; sellers: Facet[]; materials?: Facet[]; fulfillment?: Facet[] };
  query?: { original: string | null; effective: string | null; alternative: string | null; recovered: boolean };
};
type WishlistResponse = { products: ProductSummary[] };
type SortKey = "featured" | "newest" | "rating_desc" | "price_asc" | "price_desc";
type FilterState = {
  brand?: string;
  category?: string;
  seller?: string;
  material?: string;
  fulfillment?: string;
  minPriceNaira: string;
  maxPriceNaira: string;
  minDiscountPercent?: number;
  minProductRating?: number;
  minSellerScore?: number;
  inStock: boolean;
  verifiedSeller: boolean;
};

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "featured", label: "Popularity" },
  { key: "newest", label: "New in" },
  { key: "rating_desc", label: "Best rating" },
  { key: "price_asc", label: "Lowest price" },
  { key: "price_desc", label: "Highest price" },
];

function emptyFilters(category?: string): FilterState {
  return { category, minPriceNaira: "", maxPriceNaira: "", inStock: true, verifiedSeller: false };
}

function priceMinor(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return undefined;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return Math.round(amount * 100);
}

function buildSearchQuery(q: string, filters: FilterState, sort: SortKey, limit: number, vertical?: "SHOPPING" | "GROCERY") {
  return {
    q: q.trim() || undefined,
    brand: filters.brand,
    category: filters.category,
    seller: filters.seller,
    vertical,
    material: filters.material,
    fulfillment: filters.fulfillment,
    minPriceMinor: priceMinor(filters.minPriceNaira),
    maxPriceMinor: priceMinor(filters.maxPriceNaira),
    minDiscountPercent: filters.minDiscountPercent,
    minProductRating: filters.minProductRating,
    minSellerScore: filters.minSellerScore,
    inStock: filters.inStock ? "true" : undefined,
    verifiedSeller: filters.verifiedSeller ? "true" : undefined,
    sort,
    page: 1,
    limit,
  };
}

function RadioRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.radioRow, pressed && styles.pressed]}>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>{selected ? <View style={styles.radioInner} /> : null}</View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

function filtersFromParams(params: Record<string, string | undefined>, fallbackCategory?: string): FilterState {
  const numberOrUndefined = (value?: string) => value && Number.isFinite(Number(value)) ? Number(value) : undefined;
  return {
    category: params.category ?? fallbackCategory, brand: params.brand, seller: params.seller, material: params.material, fulfillment: params.fulfillment,
    minPriceNaira: params.minPrice ?? "", maxPriceNaira: params.maxPrice ?? "", minDiscountPercent: numberOrUndefined(params.minDiscount),
    minProductRating: numberOrUndefined(params.minRating), minSellerScore: numberOrUndefined(params.minSellerScore),
    inStock: params.inStock !== "false", verifiedSeller: params.verifiedSeller === "true",
  };
}

function FilterChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceActive, pressed && styles.pressed]}>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>{selected ? <View style={styles.radioInner} /> : null}</View>
      <Text style={[styles.choiceText, selected && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function SearchResultsPage() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; vertical?: "SHOPPING" | "GROCERY"; category?: string; brand?: string; seller?: string; material?: string; fulfillment?: string; sort?: SortKey; minPrice?: string; maxPrice?: string; minDiscount?: string; minRating?: string; minSellerScore?: string; inStock?: string; verifiedSeller?: string }>();
  const routeCategory = typeof params.category === "string" ? params.category : undefined;
  const routeVertical = params.vertical === "GROCERY" ? "GROCERY" : params.vertical === "SHOPPING" ? "SHOPPING" : undefined;
  const [q, setQ] = useState(typeof params.q === "string" ? params.q : "");
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [brands, setBrands] = useState<Facet[]>([]);
  const [categories, setCategories] = useState<Facet[]>([]);
  const [sellers, setSellers] = useState<Facet[]>([]);
  const [materials, setMaterials] = useState<Facet[]>([]);
  const [fulfillment, setFulfillment] = useState<Facet[]>([]);
  const [alternativeQuery, setAlternativeQuery] = useState<string | null>(null);
  const [popular, setPopular] = useState<Array<{query:string;count:number}>>([]);
  const [recent, setRecent] = useState<Array<{query:string;searchedAt:string}>>([]);
  const [filters, setFilters] = useState<FilterState>(() => emptyFilters(routeCategory));
  const [draftFilters, setDraftFilters] = useState<FilterState>(() => emptyFilters(routeCategory));
  const [sort, setSort] = useState<SortKey>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [total, setTotal] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const { quantities, busyVariantId, refresh: refreshCart, setVariantQuantity } = useCartState();

  const sortLabel = SORT_OPTIONS.find((item) => item.key === sort)?.label ?? "Popularity";
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.brand) count += 1;
    if (filters.seller) count += 1;
    if (filters.material) count += 1;
    if (filters.fulfillment) count += 1;
    if (filters.minPriceNaira || filters.maxPriceNaira) count += 1;
    if (filters.minDiscountPercent != null) count += 1;
    if (filters.minProductRating != null) count += 1;
    if (filters.minSellerScore != null) count += 1;
    if (filters.verifiedSeller) count += 1;
    if (!filters.inStock) count += 1;
    return count;
  }, [filters]);

  const loadSaved = useCallback(async () => {
    try {
      if (!(await isSignedIn())) { setSavedIds(new Set()); return; }
      const body = await publicApi.get<WishlistResponse>("/v1/shopping/wishlist");
      setSavedIds(new Set(body.products.map((item) => item.id)));
    } catch {
      // Catalogue remains usable if Wishlist state cannot load.
    }
  }, []);

  const executeSearch = useCallback(async (nextQ: string, nextFilters: FilterState, nextSort: SortKey) => {
    setError("");
    try {
      const result = await publicApi.get<SearchResponse>("/v1/shopping/search", { query: buildSearchQuery(nextQ, nextFilters, nextSort, 30, routeVertical) });
      setProducts(result.products);
      setTotal(result.pagination.total);
      setBrands(result.facets.brands);
      setCategories(result.facets.categories);
      setSellers(result.facets.sellers);
      setMaterials(result.facets.materials ?? []);
      setFulfillment(result.facets.fulfillment ?? []);
      setAlternativeQuery(result.query?.alternative ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load products");
    }
  }, [routeVertical]);

  useEffect(() => {
    const nextQ = typeof params.q === "string" ? params.q : "";
    const nextCategory = typeof params.category === "string" ? params.category : undefined;
    const nextFilters = filtersFromParams(params as Record<string,string|undefined>, nextCategory);
    const nextSort = SORT_OPTIONS.some((item) => item.key === params.sort) ? (params.sort as SortKey) : "featured";
    setQ(nextQ); setFilters(nextFilters); setDraftFilters(nextFilters); setSort(nextSort);
    void executeSearch(nextQ, nextFilters, nextSort);
  }, [executeSearch, params.q, params.category, params.brand, params.seller, params.material, params.fulfillment, params.sort, params.minPrice, params.maxPrice, params.minDiscount, params.minRating, params.minSellerScore, params.inStock, params.verifiedSeller, params.vertical]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const value = q.trim();
      if (value.length < 2) { setSuggestions([]); return; }
      void publicApi.get<{ suggestions: Suggestion[] }>("/v1/shopping/search/suggestions", { query: { q: value, limit: 7 } })
        .then((result) => setSuggestions(result.suggestions)).catch(() => setSuggestions([]));
    }, 220);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    if (!filtersOpen) return;
    setPreviewBusy(true);
    const handle = setTimeout(() => {
      void publicApi.get<SearchResponse>("/v1/shopping/search", { query: buildSearchQuery(q, draftFilters, sort, 1, routeVertical) })
        .then((result) => setPreviewTotal(result.pagination.total))
        .catch(() => setPreviewTotal(total))
        .finally(() => setPreviewBusy(false));
    }, 220);
    return () => clearTimeout(handle);
  }, [draftFilters, filtersOpen, q, sort, total]);

  useEffect(() => {
    void publicApi.get<{ searches: Array<{query:string;count:number}> }>("/v1/shopping/search/popular", { query: { limit: 8 } }).then((body) => setPopular(body.searches)).catch(() => setPopular([]));
    void isSignedIn().then((signed) => signed ? publicApi.get<{ searches: Array<{query:string;searchedAt:string}> }>("/v1/shopping/search/recent", { query: { limit: 6 } }).then((body) => setRecent(body.searches)).catch(() => setRecent([])) : setRecent([]));
  }, []);

  useFocusEffect(useCallback(() => { void refreshCart(); void loadSaved(); }, [loadSaved, refreshCart]));

  function persist(nextQ:string,nextFilters:FilterState,nextSort:SortKey) {
    router.setParams({ q: nextQ.trim() || undefined, category: nextFilters.category, brand: nextFilters.brand, seller: nextFilters.seller, material: nextFilters.material, fulfillment: nextFilters.fulfillment, sort: nextSort === "featured" ? undefined : nextSort, minPrice: nextFilters.minPriceNaira || undefined, maxPrice: nextFilters.maxPriceNaira || undefined, minDiscount: nextFilters.minDiscountPercent?.toString(), minRating: nextFilters.minProductRating?.toString(), minSellerScore: nextFilters.minSellerScore?.toString(), inStock: nextFilters.inStock ? undefined : "false", verifiedSeller: nextFilters.verifiedSeller ? "true" : undefined });
  }
  function submitSearch() { setSuggestions([]); persist(q,filters,sort); void executeSearch(q, filters, sort); }
  function selectCategory(value?: string) { const next = { ...filters, category: value }; setFilters(next); persist(q,next,sort); void executeSearch(q, next, sort); }
  function openFilters() { setDraftFilters(filters); setPreviewTotal(total); setFiltersOpen(true); }
  function applyFilters() { setFilters(draftFilters); setFiltersOpen(false); persist(q,draftFilters,sort); void executeSearch(q, draftFilters, sort); }
  function resetDraftFilters() { setDraftFilters(emptyFilters(routeCategory)); }
  function applySort(nextSort: SortKey) { setSort(nextSort); setSortOpen(false); persist(q,filters,nextSort); void executeSearch(q, filters, nextSort); }

  async function setProductQuantity(product: ProductSummary, quantity: number) {
    if (!product.defaultVariantId) return;
    setError("");
    try { await setVariantQuantity(product.defaultVariantId, quantity); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update cart"); }
  }

  async function toggleSave(product: ProductSummary) {
    setError("");
    try {
      if (!(await isSignedIn())) { const auth = await signInWithBazId(); if (!auth.ok) return; }
      const isSaved = savedIds.has(product.id);
      if (isSaved) await publicApi.delete(`/v1/shopping/wishlist/${encodeURIComponent(product.id)}`);
      else await publicApi.put(`/v1/shopping/wishlist/${encodeURIComponent(product.id)}`);
      setSavedIds((current) => { const next = new Set(current); if (isSaved) next.delete(product.id); else next.add(product.id); return next; });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update Wishlist"); }
  }

  function chooseSuggestion(item: Suggestion) {
    setSuggestions([]);
    if (item.type === "query") { setQ(item.value); persist(item.value, filters, sort); void executeSearch(item.value, filters, sort); return; }
    if (item.type === "brand") { const next = { ...filters, brand: item.value }; setQ(""); setFilters(next); void executeSearch("", next, sort); return; }
    if (item.type === "category") { const next = { ...filters, category: item.value }; setQ(""); setFilters(next); void executeSearch("", next, sort); return; }
    if (item.type === "seller") { const next = { ...filters, seller: item.value }; setQ(""); setFilters(next); void executeSearch("", next, sort); return; }
    setQ(item.label); void executeSearch(item.label, filters, sort);
  }

  return (
    <>
      <Screen>
        <ShoppingSearchBar value={q} onChangeText={setQ} onSubmit={submitSearch} showBack onBack={() => router.back()} />

        {suggestions.length ? <View style={styles.suggestions}>{suggestions.map((item, index) => <Pill key={`${item.type}-${item.value}-${index}`} label={item.label} onPress={() => chooseSuggestion(item)} />)}</View> : null}
        {alternativeQuery ? <Pressable onPress={() => { setQ(alternativeQuery); persist(alternativeQuery, filters, sort); void executeSearch(alternativeQuery, filters, sort); }} style={styles.recovery}><Text style={styles.recoveryText}>Showing the closest match. Search “{alternativeQuery}”</Text></Pressable> : null}
        {!q.trim() && (recent.length || popular.length) ? <View style={styles.discovery}><Text style={styles.discoveryTitle}>{recent.length ? "Recent searches" : "Popular searches"}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryPills}>{(recent.length ? recent.map((item)=>item.query) : popular.map((item)=>item.query)).map((value)=><Pill key={value} label={value} onPress={()=>{setQ(value);persist(value,filters,sort);void executeSearch(value,filters,sort);}} />)}</ScrollView></View> : null}

        {categories.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPills}>
            <Pill label="All" active={!filters.category} onPress={() => selectCategory(undefined)} />
            {categories.map((item) => <Pill key={item.slug} label={item.name} active={filters.category === item.slug} onPress={() => selectCategory(filters.category === item.slug ? undefined : item.slug)} />)}
          </ScrollView>
        ) : null}

        <View style={styles.resultHead}>
          <View>
            <Text style={styles.resultTitle}>{total.toLocaleString()} products</Text>
            <Text style={styles.resultSub}>Marketplace results</Text>
          </View>
          <View style={styles.actions}>
            <Pressable onPress={() => setSortOpen(true)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Text style={styles.actionLabel}>Sort</Text><Text numberOfLines={1} style={styles.actionValue}>{sortLabel}</Text>
            </Pressable>
            <Pressable onPress={openFilters} style={({ pressed }) => [styles.actionButton, activeFilterCount > 0 && styles.actionButtonActive, pressed && styles.pressed]}>
              <Text style={styles.actionLabel}>Filter</Text><Text numberOfLines={1} style={styles.actionValue}>{activeFilterCount ? `${activeFilterCount} active` : "Refine"}</Text>
            </Pressable>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!error && total === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No products found</Text><Text style={styles.emptyCopy}>Try changing your search or clearing some filters.</Text></View> : null}

        <View style={styles.grid}>
          {products.map((product) => {
            const variantId = product.defaultVariantId;
            const quantity = variantId ? quantities[variantId] ?? 0 : 0;
            return <ProductCard
              key={product.id}
              title={product.title}
              brand={product.brand?.name}
              image={product.image?.url}
              seller={product.seller?.name}
              price={money(product.priceMinor, product.currency)}
              oldPrice={product.compareAtPriceMinor ? money(product.compareAtPriceMinor, product.currency) : null}
              discount={discountPercent(product.priceMinor, product.compareAtPriceMinor)}
              inStock={product.stock === "IN_STOCK"}
              saved={savedIds.has(product.id)}
              addBusy={!!variantId && busyVariantId === variantId}
              quantity={quantity}
              maxQuantity={product.availableQuantity}
              onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })}
              onAdd={() => void setProductQuantity(product, 1)}
              onIncrement={() => void setProductQuantity(product, quantity + 1)}
              onDecrement={() => void setProductQuantity(product, quantity - 1)}
              onSave={() => void toggleSave(product)}
              onSeller={product.seller ? () => router.push({ pathname: "/seller/[slug]", params: { slug: product.seller!.slug } }) : undefined}
            />;
          })}
        </View>
      </Screen>

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSortOpen(false)} />
          <View style={[styles.sortSheet, { paddingBottom: Math.max(10, insets.bottom + 4) }]}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Sort by</Text><Pressable onPress={() => setSortOpen(false)} hitSlop={10}><Text style={styles.closeText}>×</Text></Pressable></View>
            {SORT_OPTIONS.map((option) => <RadioRow key={option.key} label={option.label} selected={sort === option.key} onPress={() => applySort(option.key)} />)}
          </View>
        </View>
      </Modal>

      <Modal visible={filtersOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.filterScreen}>
          <View style={[styles.filterHeader, { paddingTop: Math.max(12, insets.top + 6) }]}>
            <Pressable onPress={() => setFiltersOpen(false)} hitSlop={10}><Text style={styles.closeText}>×</Text></Pressable>
            <Text style={styles.filterTitle}>Filter</Text>
            <Pressable onPress={resetDraftFilters}><Text style={styles.clearText}>Clear</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={[styles.filterScroll, { paddingBottom: 176 + Math.max(insets.bottom, 24) }]} showsVerticalScrollIndicator={false}>
            {categories.length ? <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}><Pill label="All" active={!draftFilters.category} onPress={() => setDraftFilters((current) => ({ ...current, category: undefined }))} />{categories.map((item) => <Pill key={item.slug} label={item.name} active={draftFilters.category === item.slug} onPress={() => setDraftFilters((current) => ({ ...current, category: current.category === item.slug ? undefined : item.slug }))} />)}</ScrollView></View> : null}

            {brands.length ? <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Brand</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}><Pill label="All" active={!draftFilters.brand} onPress={() => setDraftFilters((current) => ({ ...current, brand: undefined }))} />{brands.map((item) => <Pill key={item.slug} label={`${item.name} (${item.count})`} active={draftFilters.brand === item.slug} onPress={() => setDraftFilters((current) => ({ ...current, brand: current.brand === item.slug ? undefined : item.slug }))} />)}</ScrollView></View> : null}

            {materials.length ? <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Material family</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}><Pill label="All" active={!draftFilters.material} onPress={() => setDraftFilters((current) => ({ ...current, material: undefined }))} />{materials.map((item) => <Pill key={item.slug} label={`${item.name} (${item.count})`} active={draftFilters.material === item.slug} onPress={() => setDraftFilters((current) => ({ ...current, material: current.material === item.slug ? undefined : item.slug }))} />)}</ScrollView></View> : null}

            {fulfillment.length ? <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Fulfillment</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}><Pill label="All" active={!draftFilters.fulfillment} onPress={() => setDraftFilters((current) => ({ ...current, fulfillment: undefined }))} />{fulfillment.map((item) => <Pill key={item.slug} label={`${item.name} (${item.count})`} active={draftFilters.fulfillment === item.slug} onPress={() => setDraftFilters((current) => ({ ...current, fulfillment: current.fulfillment === item.slug ? undefined : item.slug }))} />)}</ScrollView></View> : null}

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price (₦)</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceField}><Text style={styles.fieldLabel}>From</Text><TextInput value={draftFilters.minPriceNaira} onChangeText={(value) => setDraftFilters((current) => ({ ...current, minPriceNaira: value }))} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted2} style={styles.priceInput} /></View>
                <View style={styles.priceField}><Text style={styles.fieldLabel}>To</Text><TextInput value={draftFilters.maxPriceNaira} onChangeText={(value) => setDraftFilters((current) => ({ ...current, maxPriceNaira: value }))} keyboardType="numeric" placeholder="Any" placeholderTextColor={colors.muted2} style={styles.priceInput} /></View>
              </View>
            </View>

            <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Discount percentage</Text>{[50,40,30,20,10].map((value) => <FilterChoice key={value} label={`${value}% or more`} selected={draftFilters.minDiscountPercent === value} onPress={() => setDraftFilters((current) => ({ ...current, minDiscountPercent: current.minDiscountPercent === value ? undefined : value }))} />)}</View>
            <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Product rating</Text>{[4,3,2,1].map((value) => <FilterChoice key={value} label={`${"★".repeat(value)}${"☆".repeat(5-value)} & above`} selected={draftFilters.minProductRating === value} onPress={() => setDraftFilters((current) => ({ ...current, minProductRating: current.minProductRating === value ? undefined : value }))} />)}</View>
            <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Seller score</Text>{[80,60,40,20].map((value) => <FilterChoice key={value} label={`${value}% or more`} selected={draftFilters.minSellerScore === value} onPress={() => setDraftFilters((current) => ({ ...current, minSellerScore: current.minSellerScore === value ? undefined : value }))} />)}</View>

            {sellers.length ? <View style={styles.filterSection}><Text style={styles.filterSectionTitle}>Seller</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}><Pill label="All" active={!draftFilters.seller} onPress={() => setDraftFilters((current) => ({ ...current, seller: undefined }))} />{sellers.map((item) => <Pill key={item.slug} label={`${item.name} (${item.count})`} active={draftFilters.seller === item.slug} onPress={() => setDraftFilters((current) => ({ ...current, seller: current.seller === item.slug ? undefined : item.slug }))} />)}</ScrollView></View> : null}

            <View style={styles.filterSection}>
              <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>In-stock products</Text><Text style={styles.switchDetail}>Hide products that cannot be ordered now.</Text></View><Switch value={draftFilters.inStock} onValueChange={(value) => setDraftFilters((current) => ({ ...current, inStock: value }))} /></View>
              <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>Verified sellers</Text><Text style={styles.switchDetail}>Show sellers verified by Bazaara.</Text></View><Switch value={draftFilters.verifiedSeller} onValueChange={(value) => setDraftFilters((current) => ({ ...current, verifiedSeller: value }))} /></View>
            </View>
          </ScrollView>

          <View style={[styles.filterFooter, { bottom: Math.max(44, insets.bottom + 10), paddingBottom: 10 }]}>
            <Pressable onPress={applyFilters} disabled={previewBusy} style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}>
              {previewBusy ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.applyButtonText}>Show {previewTotal.toLocaleString()} products</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 },
  recovery: { marginTop: 8, borderWidth: 1, borderColor: colors.indigo, backgroundColor: "rgba(91,77,255,.12)", borderRadius: 10, padding: 10 },
  recoveryText: { color: colors.indigoBright, fontSize: 10, fontWeight: "800" },
  discovery: { marginTop: 10 }, discoveryTitle: { color: colors.muted, fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: .8 }, discoveryPills: { gap: 7, paddingTop: 7, paddingRight: 12 },
  categoryPills: { gap: 7, paddingTop: 12, paddingRight: 12, paddingBottom: 2 },
  resultHead: { marginTop: 14, marginBottom: 12, gap: 12 },
  resultTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  resultSub: { marginTop: 2, color: colors.muted, fontSize: 10 },
  actions: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1, minHeight: 48, justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 11, paddingHorizontal: 12, backgroundColor: colors.surface },
  actionButtonActive: { borderColor: colors.indigo },
  actionLabel: { color: colors.muted2, fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  actionValue: { marginTop: 2, color: colors.text, fontSize: 12, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  empty: { alignItems: "center", paddingVertical: 42, paddingHorizontal: 20 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  emptyCopy: { marginTop: 6, color: colors.muted, fontSize: 12, textAlign: "center" },
  error: { color: "#FCA5A5", marginBottom: 9, fontSize: 11 },
  pressed: { opacity: 0.78 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.58)" },
  sortSheet: { maxHeight: "52%", paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.borderStrong },
  sheetHeader: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.borderStrong },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  closeText: { color: colors.text, fontSize: 27, lineHeight: 29, fontWeight: "300" },
  radioRow: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: colors.borderStrong },
  radioOuter: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.muted2 },
  radioOuterActive: { borderColor: colors.indigoBright },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.indigoBright },
  radioLabel: { color: colors.text, fontSize: 12.5, fontWeight: "700" },
  filterScreen: { flex: 1, backgroundColor: colors.navy },
  filterHeader: { minHeight: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: colors.borderStrong, backgroundColor: colors.card },
  filterTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  clearText: { color: colors.indigoBright, fontSize: 13, fontWeight: "900" },
  filterScroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 120, gap: 10 },
  filterSection: { overflow: "hidden", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 13, padding: 14, backgroundColor: colors.card },
  filterSectionTitle: { marginBottom: 12, color: colors.text, fontSize: 16, fontWeight: "900" },
  filterPills: { gap: 7, paddingRight: 10 },
  priceRow: { flexDirection: "row", gap: 10 },
  priceField: { flex: 1 },
  fieldLabel: { marginBottom: 5, color: colors.muted, fontSize: 11, fontWeight: "700" },
  priceInput: { minHeight: 46, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 9, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.surface, fontSize: 14 },
  choice: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: colors.borderStrong },
  choiceActive: { backgroundColor: "rgba(91,77,255,.07)" },
  choiceText: { flex: 1, color: colors.muted, fontSize: 14 },
  choiceTextActive: { color: colors.text, fontWeight: "800" },
  switchRow: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderTopColor: colors.borderStrong },
  switchCopy: { flex: 1 },
  switchTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  switchDetail: { marginTop: 3, color: colors.muted, fontSize: 10, lineHeight: 14 },
  dataNote: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 13, padding: 14, backgroundColor: colors.surface },
  dataNoteTitle: { color: colors.text, fontSize: 12, fontWeight: "900" },
  dataNoteCopy: { marginTop: 5, color: colors.muted, fontSize: 10, lineHeight: 15 },
  filterFooter: { position: "absolute", left: 0, right: 0, bottom: 44, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 18, borderTopWidth: 1, borderTopColor: colors.borderStrong, backgroundColor: colors.card },
  applyButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.orange },
  applyButtonText: { color: colors.white, fontSize: 15, fontWeight: "900" },
});
