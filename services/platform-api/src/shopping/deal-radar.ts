/** Honest catalogue-based savings. Compare-at values are merchant listings, not price history. */
export type RadarItem = {
  id: string;
  slug: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  stock: string;
  availableQuantity: number;
  seller: { verified: boolean } | null;
  category: { slug: string } | null;
};

export type RadarOptions = {
  minDiscountPercent: number;
  maxPriceMinor?: number;
  category?: string;
  verifiedSeller: boolean;
  sort: "biggest_discount" | "lowest_price";
};

export function curateDealRadar<T extends RadarItem>(rows: readonly T[], options: RadarOptions) {
  const unique = new Map<string, T & { discountPercent: number; savingsMinor: number }>();
  for (const product of rows) {
    const before = product.compareAtPriceMinor;
    const now = product.priceMinor;
    if (!Number.isSafeInteger(before) || !Number.isSafeInteger(now) || before == null ||
        now <= 0 || before <= now || product.stock !== "IN_STOCK" || product.availableQuantity <= 0) continue;
    if (options.maxPriceMinor !== undefined && now > options.maxPriceMinor) continue;
    if (options.verifiedSeller && !product.seller?.verified) continue;
    if (options.category && product.category?.slug !== options.category) continue;
    const fraction = (before - now) / before;
    if (fraction * 100 + Number.EPSILON < options.minDiscountPercent) continue;
    const offer = { ...product, discountPercent: Math.round(fraction * 100), savingsMinor: before - now };
    const previous = unique.get(product.id);
    if (!previous || offer.discountPercent > previous.discountPercent) unique.set(product.id, offer);
  }
  return [...unique.values()].sort((a, b) => options.sort === "lowest_price"
    ? a.priceMinor - b.priceMinor || b.discountPercent - a.discountPercent || a.slug.localeCompare(b.slug)
    : b.discountPercent - a.discountPercent || b.savingsMinor - a.savingsMinor || a.slug.localeCompare(b.slug));
}
