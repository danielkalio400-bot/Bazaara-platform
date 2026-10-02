import type { MetadataRoute } from "next";

const ORIGIN = (process.env.NEXT_PUBLIC_SHOPPING_WEB_BASE_URL ?? "https://shopping.bazaara.com").replace(/\/$/, "");
const API = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

type SearchProduct = { slug: string; seller?: { slug: string } | null };
type SearchResponse = {
  products?: SearchProduct[];
  pagination?: { page: number; pages: number; total: number };
  facets?: { categories?: Array<{ slug: string }> };
};

async function searchPage(page: number) {
  const response = await fetch(`${API}/v1/shopping/search?vertical=SHOPPING&limit=48&page=${page}&sort=newest`, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`Catalogue sitemap search failed with HTTP ${response.status}`);
  return response.json() as Promise<SearchResponse>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${ORIGIN}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${ORIGIN}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${ORIGIN}/explore`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${ORIGIN}/search-results`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
  ];

  try {
    const first = await searchPage(1);
    const pages: SearchResponse[] = [first];
    const pageCount = Math.min(first.pagination?.pages ?? 1, 20);
    for (let page = 2; page <= pageCount; page++) pages.push(await searchPage(page));

    const sellerSlugs = new Set<string>();
    const productSlugs = new Set<string>();
    const categorySlugs = new Set<string>();
    for (const body of pages) {
      for (const product of body.products ?? []) {
        productSlugs.add(product.slug);
        if (product.seller?.slug) sellerSlugs.add(product.seller.slug);
      }
      for (const category of body.facets?.categories ?? []) categorySlugs.add(category.slug);
    }

    for (const slug of productSlugs) entries.push({ url: `${ORIGIN}/products/${encodeURIComponent(slug)}`, lastModified: now, changeFrequency: "daily", priority: 0.8 });
    for (const slug of categorySlugs) entries.push({ url: `${ORIGIN}/search-results?category=${encodeURIComponent(slug)}`, lastModified: now, changeFrequency: "daily", priority: 0.7 });
    for (const slug of sellerSlugs) entries.push({ url: `${ORIGIN}/sellers/${encodeURIComponent(slug)}`, lastModified: now, changeFrequency: "daily", priority: 0.7 });
  } catch {
    // Keep static public routes discoverable while the catalogue API is temporarily unavailable.
  }
  return entries;
}
