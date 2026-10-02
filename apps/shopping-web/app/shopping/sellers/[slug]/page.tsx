import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProductCard } from "../../../../components/product-card";
import { ShoppingHeader } from "../../../../components/shopping-header";
import { apiPublicGet, type MoneyProduct } from "../../../../lib/shopping";

export const revalidate = 60;
const PUBLIC_ORIGIN = (process.env.NEXT_PUBLIC_SHOPPING_WEB_BASE_URL ?? "https://shopping.bazaara.com").replace(/\/$/, "");
type SellerPayload = { seller: { slug: string; name: string; verified: boolean; vertical: "SHOPPING" | "GROCERY"; country: string; products: MoneyProduct[] } };
const getSeller = cache(async (slug: string) => apiPublicGet<SellerPayload>(`/v1/shopping/sellers/${encodeURIComponent(slug)}`));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { seller } = await getSeller(slug);
    if (seller.vertical !== "SHOPPING") return { title: "Seller", robots: { index: false, follow: false } };
    const description = `${seller.verified ? "Verified " : ""}Shopping seller in ${seller.country}. Browse ${seller.products.length} available product${seller.products.length === 1 ? "" : "s"}.`;
    const canonical = `/sellers/${encodeURIComponent(seller.slug)}`;
    return { title: seller.name, description, alternates: { canonical }, openGraph: { type: "website", title: seller.name, description, url: canonical } };
  } catch {
    return { title: "Seller", robots: { index: false, follow: false } };
  }
}

export default async function SellerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { seller } = await getSeller(slug);
  if (seller.vertical !== "SHOPPING") notFound();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seller.name,
    url: `${PUBLIC_ORIGIN}/sellers/${encodeURIComponent(seller.slug)}`,
    areaServed: seller.country,
  };

  return (
    <div className="shop-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }} />
      <ShoppingHeader />
      <main className="shop-main">
        <section className="seller-banner">
          <span className="eyebrow">Seller storefront</span>
          <h1>{seller.name}</h1>
          <p>{seller.verified ? "Verified Shopping seller" : "Shopping seller"}{" · "}{seller.country}</p>
        </section>
        <div className="catalogue-heading"><div><h2>Products</h2><p className="muted">{seller.products.length} available listings</p></div></div>
        <div className="shopping-grid">
          {seller.products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </main>
    </div>
  );
}
