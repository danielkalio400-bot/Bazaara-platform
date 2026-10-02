import { db, Prisma } from "@bazaara/db";
import { productSummary } from "./service.js";

const synonymMap: Record<string, string[]> = {
  phone: ["smartphone", "mobile"], smartphone: ["phone", "mobile"], mobile: ["phone", "smartphone"],
  laptop: ["notebook", "computer"], notebook: ["laptop"], tv: ["television"], television: ["tv"],
  blender: ["mixer"], mixer: ["blender"], sneakers: ["trainers", "shoes"], trainers: ["sneakers", "shoes"],
  fridge: ["refrigerator"], refrigerator: ["fridge"], powerbank: ["power bank"], "power bank": ["powerbank"],
  earphones: ["earbuds", "headphones"], earbuds: ["earphones", "headphones"], generator: ["genset"],
};

function normalizeQuery(value: string) { return value.trim().toLowerCase().replace(/\s+/g, " "); }

function expandedTerms(raw?: string) {
  const q = raw ? normalizeQuery(raw) : "";
  if (!q) return [];
  const terms = new Set<string>([q]);
  for (const token of q.split(/\s+/)) for (const synonym of synonymMap[token] ?? []) terms.add(synonym);
  return [...terms].slice(0, 10);
}

const summaryInclude = {
  media: { where: { type: "IMAGE" as const }, orderBy: { sortOrder: "asc" as const }, take: 1 },
  category: true,
  brand: true,
  merchant: { include: { organization: true } },
  variants: { where: { active: true }, select: { id: true, inventoryItems: { select: { quantityOnHand: true, quantityReserved: true, store: { select: { status: true, fulfillmentModes: true } } } } } },
} satisfies Prisma.ProductInclude;

const candidateSelect = {
  id: true, merchantId: true, priceMinor: true, compareAtPriceMinor: true, featured: true, createdAt: true, updatedAt: true,
  category: { select: { slug: true, name: true } },
  brand: { select: { slug: true, name: true } },
  merchant: { select: { id: true, slug: true, verifiedAt: true, organization: { select: { displayName: true } } } },
  variants: { where: { active: true }, select: { attributes: true, inventoryItems: { select: { quantityOnHand: true, quantityReserved: true, store: { select: { status: true, fulfillmentModes: true } } } } } },
} satisfies Prisma.ProductSelect;

type Candidate = Prisma.ProductGetPayload<{ select: typeof candidateSelect }>;

export type SearchInput = {
  q?: string; brand?: string; category?: string; seller?: string; vertical?: "SHOPPING" | "GROCERY"; material?: string; fulfillment?: string;
  minPriceMinor?: number; maxPriceMinor?: number; minDiscountPercent?: number; minProductRating?: number; minSellerScore?: number;
  inStock?: boolean; verifiedSeller?: boolean;
  sort: "featured" | "newest" | "rating_desc" | "price_asc" | "price_desc"; page: number; limit: number;
};

function isInStock(product: Candidate) { return product.variants.some((variant) => variant.inventoryItems.some((item) => item.store.status === "ACTIVE" && item.quantityOnHand - item.quantityReserved > 0)); }
function supportsFulfillment(product: Candidate, mode: string) {
  const wanted = mode.toUpperCase();
  return product.variants.some((variant) => variant.inventoryItems.some((item) => {
    if (item.store.status !== "ACTIVE" || item.quantityOnHand - item.quantityReserved <= 0) return false;
    const modes = item.store.fulfillmentModes.map((value: string) => value.toUpperCase());
    return wanted === "STANDARD" ? modes.length === 0 || modes.includes("STANDARD") : modes.includes(wanted);
  }));
}
function discountPercent(product: Candidate) { if (product.compareAtPriceMinor == null || product.compareAtPriceMinor <= product.priceMinor) return 0; return Number(product.compareAtPriceMinor - product.priceMinor) / Number(product.compareAtPriceMinor) * 100; }
function normalizeFacet(value: string) { return value.trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

function materialValues(value: unknown, keyHint = ""): string[] {
  const result = new Set<string>();
  function visit(node: unknown, key: string) {
    if (node == null) return;
    if (typeof node === "string") { if (key.toLowerCase().includes("material") && node.trim()) result.add(node.trim()); return; }
    if (Array.isArray(node)) { for (const item of node) visit(item, key); return; }
    if (typeof node === "object") for (const [childKey, childValue] of Object.entries(node as Record<string, unknown>)) visit(childValue, childKey);
  }
  visit(value, keyHint); return [...result];
}
function productMaterials(product: Candidate) { const values = new Set<string>(); for (const variant of product.variants) for (const value of materialValues(variant.attributes)) values.add(value); return [...values]; }
function compareBigInt(a: bigint, b: bigint) { return a === b ? 0 : a < b ? -1 : 1; }

function sortCandidates(rows: Candidate[], sort: SearchInput["sort"], productRating: Map<string, number>) {
  rows.sort((a, b) => {
    if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === "price_asc") return compareBigInt(a.priceMinor, b.priceMinor);
    if (sort === "price_desc") return compareBigInt(b.priceMinor, a.priceMinor);
    if (sort === "rating_desc") { const delta = (productRating.get(b.id) ?? 0) - (productRating.get(a.id) ?? 0); if (delta) return delta; }
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

function productWhere(input: SearchInput, query?: string): Prisma.ProductWhereInput {
  const terms = expandedTerms(query);
  const merchantFilter = (input.seller || input.verifiedSeller || input.vertical) ? { ...(input.seller ? { slug: input.seller } : {}), ...(input.verifiedSeller ? { verifiedAt: { not: null } } : {}), ...(input.vertical ? { vertical: input.vertical } : {}) } : undefined;
  return {
    status: "ACTIVE",
    ...(input.brand ? { brand: { slug: input.brand } } : {}), ...(input.category ? { category: { slug: input.category } } : {}), ...(merchantFilter ? { merchant: merchantFilter } : {}),
    ...((input.minPriceMinor != null || input.maxPriceMinor != null) ? { priceMinor: { ...(input.minPriceMinor != null ? { gte: BigInt(input.minPriceMinor) } : {}), ...(input.maxPriceMinor != null ? { lte: BigInt(input.maxPriceMinor) } : {}) } } : {}),
    ...(terms.length ? { OR: terms.flatMap((term) => [
      { title: { contains: term, mode: "insensitive" as const } }, { shortDescription: { contains: term, mode: "insensitive" as const } }, { description: { contains: term, mode: "insensitive" as const } },
      { brand: { name: { contains: term, mode: "insensitive" as const } } }, { category: { name: { contains: term, mode: "insensitive" as const } } }, { merchant: { organization: { displayName: { contains: term, mode: "insensitive" as const } } } },
    ]) } : {}),
  };
}

function levenshtein(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let left = i; let diagonal = i - 1;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j]!; const next = a[i - 1] === b[j - 1] ? diagonal : Math.min(diagonal, above, left) + 1;
      diagonal = above; previous[j] = next; left = next;
    }
    previous[0] = i;
  }
  return previous[b.length] ?? Math.max(a.length, b.length);
}

async function recoverQuery(raw: string) {
  const q = normalizeQuery(raw); if (!q) return undefined;
  const [products, brands, categories, merchants] = await Promise.all([
    db.product.findMany({ where: { status: "ACTIVE" }, select: { title: true }, orderBy: { updatedAt: "desc" }, take: 400 }),
    db.brand.findMany({ select: { name: true }, take: 200 }), db.category.findMany({ where: { active: true }, select: { name: true }, take: 200 }),
    db.merchant.findMany({ where: { vertical: { in: ["SHOPPING", "GROCERY"] } }, select: { organization: { select: { displayName: true } } }, take: 200 }),
  ]);
  const words = new Set<string>();
  for (const value of [...products.map((item) => item.title), ...brands.map((item) => item.name), ...categories.map((item) => item.name), ...merchants.map((item) => item.organization.displayName)]) {
    for (const word of normalizeQuery(value).split(/[^a-z0-9]+/)) if (word.length >= 3) words.add(word);
  }
  let changed = false;
  const recovered = q.split(" ").map((token) => {
    if (token.length < 3 || words.has(token)) return token;
    let best = token; let bestDistance = Number.POSITIVE_INFINITY;
    for (const word of words) {
      if (Math.abs(word.length - token.length) > 2 || word[0] !== token[0]) continue;
      const distance = levenshtein(token, word);
      if (distance < bestDistance) { best = word; bestDistance = distance; }
    }
    const threshold = token.length <= 5 ? 1 : 2;
    if (bestDistance <= threshold) { changed = true; return best; }
    return token;
  }).join(" ");
  return changed && recovered !== q ? recovered : undefined;
}

export async function advancedSearch(input: SearchInput, userId?: string) {
  const originalQuery = input.q?.trim();
  let effectiveQuery = originalQuery;
  let candidates = await db.product.findMany({ where: productWhere(input, effectiveQuery), select: candidateSelect });
  let alternativeQuery: string | undefined;
  if (originalQuery && candidates.length === 0) {
    alternativeQuery = await recoverQuery(originalQuery);
    if (alternativeQuery) { effectiveQuery = alternativeQuery; candidates = await db.product.findMany({ where: productWhere(input, effectiveQuery), select: candidateSelect }); }
  }

  const productIds = candidates.map((item) => item.id); const merchantIds = [...new Set(candidates.map((item) => item.merchantId))];
  const needsProductRatings = input.sort === "rating_desc" || input.minProductRating != null; const needsSellerRatings = input.minSellerScore != null;
  const [productRatingRows, sellerRatingRows] = await Promise.all([
    needsProductRatings && productIds.length ? db.productReview.groupBy({ by: ["productId"], where: { productId: { in: productIds }, status: "PUBLISHED" }, _avg: { rating: true } }) : Promise.resolve([]),
    needsSellerRatings && merchantIds.length ? db.sellerReview.groupBy({ by: ["merchantId"], where: { merchantId: { in: merchantIds }, status: "PUBLISHED" }, _avg: { rating: true } }) : Promise.resolve([]),
  ]);
  const productRating = new Map<string, number>(productRatingRows.map((row) => [row.productId, row._avg.rating ?? 0]));
  const sellerScore = new Map<string, number>(sellerRatingRows.map((row) => [row.merchantId, ((row._avg.rating ?? 0) / 5) * 100]));

  let filtered = candidates.filter((product) => {
    if (input.inStock && !isInStock(product)) return false; if (input.fulfillment && !supportsFulfillment(product, input.fulfillment)) return false;
    if (input.minDiscountPercent != null && discountPercent(product) < input.minDiscountPercent) return false;
    if (input.minProductRating != null && (productRating.get(product.id) ?? 0) < input.minProductRating) return false;
    if (input.minSellerScore != null && (sellerScore.get(product.merchantId) ?? 0) < input.minSellerScore) return false;
    if (input.material) { const requested = normalizeFacet(input.material); if (!productMaterials(product).some((value) => normalizeFacet(value) === requested)) return false; }
    return true;
  });
  sortCandidates(filtered, input.sort, productRating);
  const total = filtered.length; const start = (input.page - 1) * input.limit; const selected = filtered.slice(start, start + input.limit); const selectedIds = selected.map((item) => item.id);
  const fullRows = selectedIds.length ? await db.product.findMany({ where: { id: { in: selectedIds } }, include: summaryInclude }) : [];
  const fullById = new Map(fullRows.map((item) => [item.id, item]));
  const products = selectedIds.map((id) => fullById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item)).map(productSummary);

  function countBy(key: "brand" | "category" | "seller") {
    const map = new Map<string, { slug: string; name: string; count: number }>();
    for (const product of filtered) { const item = key === "seller" ? { slug: product.merchant.slug, name: product.merchant.organization.displayName } : product[key]; if (!item?.slug) continue; const current = map.get(item.slug) ?? { slug: item.slug, name: item.name, count: 0 }; current.count += 1; map.set(item.slug, current); }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 30);
  }
  const materialMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const product of filtered) { const seen = new Set<string>(); for (const value of productMaterials(product)) { const slug = normalizeFacet(value); if (!slug || seen.has(slug)) continue; seen.add(slug); const current = materialMap.get(slug) ?? { slug, name: value, count: 0 }; current.count += 1; materialMap.set(slug, current); } }
  const materials = [...materialMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 30);
  const fulfillmentModes = new Set<string>();
  for (const product of filtered) for (const variant of product.variants) for (const item of variant.inventoryItems) {
    if (item.store.status !== "ACTIVE") continue;
    for (const mode of item.store.fulfillmentModes) fulfillmentModes.add(mode.toUpperCase());
  }
  const fulfillment = [...fulfillmentModes].sort().map((mode) => ({
    slug: mode.toLowerCase(),
    name: mode.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (value) => value.toUpperCase()),
    count: filtered.filter((product) => supportsFulfillment(product, mode)).length,
  }));

  if (originalQuery && input.page === 1) void db.searchQueryEvent.create({ data: { userId, originalQuery, normalizedQuery: normalizeQuery(originalQuery), recoveredQuery: alternativeQuery, resultCount: total } }).catch(() => undefined);
  return { products, pagination: { page: input.page, limit: input.limit, total, pages: Math.max(1, Math.ceil(total / input.limit)) }, facets: { brands: countBy("brand"), categories: countBy("category"), sellers: countBy("seller"), materials, fulfillment }, query: { original: originalQuery ?? null, effective: effectiveQuery ?? null, alternative: alternativeQuery ?? null, recovered: Boolean(alternativeQuery) } };
}

export async function searchSuggestions(raw: string, take = 8, vertical?: "SHOPPING" | "GROCERY") {
  const value = raw.trim();
  if (!value) return { suggestions: [] };

  const merchantVertical = vertical ? { vertical } : { vertical: { in: ["SHOPPING", "GROCERY"] } };
  const [products, brands, categories, merchants] = await Promise.all([
    db.product.findMany({
      where: {
        status: "ACTIVE",
        title: { contains: value, mode: "insensitive" },
        ...(vertical ? { merchant: { vertical } } : {}),
      },
      select: { slug: true, title: true },
      take,
    }),
    db.brand.findMany({
      where: {
        name: { contains: value, mode: "insensitive" },
        ...(vertical ? { products: { some: { status: "ACTIVE", merchant: { vertical } } } } : {}),
      },
      select: { slug: true, name: true },
      take,
    }),
    db.category.findMany({
      where: {
        active: true,
        name: { contains: value, mode: "insensitive" },
        ...(vertical ? { products: { some: { status: "ACTIVE", merchant: { vertical } } } } : {}),
      },
      select: { slug: true, name: true },
      take,
    }),
    db.merchant.findMany({
      where: {
        ...merchantVertical,
        organization: { displayName: { contains: value, mode: "insensitive" } },
      },
      select: { slug: true, organization: { select: { displayName: true } } },
      take,
    }),
  ]);

  let suggestions: Array<{ type: "query" | "product" | "brand" | "category" | "seller"; label: string; value: string }> = [
    ...products.map((item) => ({ type: "product" as const, label: item.title, value: item.slug })),
    ...brands.map((item) => ({ type: "brand" as const, label: item.name, value: item.slug })),
    ...categories.map((item) => ({ type: "category" as const, label: item.name, value: item.slug })),
    ...merchants.map((item) => ({ type: "seller" as const, label: item.organization.displayName, value: item.slug })),
  ];
  if (!suggestions.length) {
    const recovered = await recoverQuery(value);
    if (recovered) suggestions = [{ type: "query", label: `Search for “${recovered}”`, value: recovered }];
  }
  return { suggestions: suggestions.slice(0, take) };
}

export async function popularSearches(limit = 8) {
  const events = await db.searchQueryEvent.findMany({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) }, resultCount: { gt: 0 } }, select: { normalizedQuery: true }, orderBy: { createdAt: "desc" }, take: 5000 });
  const counts = new Map<string, number>(); for (const event of events) counts.set(event.normalizedQuery, (counts.get(event.normalizedQuery) ?? 0) + 1);
  return { searches: [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([query, count]) => ({ query, count })) };
}

export async function recentSearches(userId: string, limit = 10) {
  const events = await db.searchQueryEvent.findMany({ where: { userId }, select: { originalQuery: true, normalizedQuery: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 60 });
  const seen = new Set<string>(); const searches: Array<{ query: string; searchedAt: Date }> = [];
  for (const event of events) { if (seen.has(event.normalizedQuery)) continue; seen.add(event.normalizedQuery); searches.push({ query: event.originalQuery, searchedAt: event.createdAt }); if (searches.length >= limit) break; }
  return { searches };
}
