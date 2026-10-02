/** Pure catalogue curation. No artificial ratings, sales ranks or discount timers. */
export type CuratedProduct = {
  id: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
};

export function curateShoppingHome<T extends CuratedProduct>(
  featured: T[], newArrivals: T[], offerCandidates: T[],
) {
  const deals = offerCandidates
    .filter((product) => product.compareAtPriceMinor !== null &&
      product.compareAtPriceMinor > product.priceMinor && product.priceMinor >= 0)
    .sort((a, b) => {
      const first = 1 - a.priceMinor / a.compareAtPriceMinor!;
      const second = 1 - b.priceMinor / b.compareAtPriceMinor!;
      return second - first || a.id.localeCompare(b.id);
    })
    .slice(0, 12);
  const seen = new Set<string>();
  const products = [...featured, ...deals, ...newArrivals].filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  }).slice(0, 36);
  return {
    featured,
    newArrivals,
    deals,
    products,
    catalogueStatus: (products.length ? "AVAILABLE" : "EMPTY") as "AVAILABLE" | "EMPTY",
  };
}
