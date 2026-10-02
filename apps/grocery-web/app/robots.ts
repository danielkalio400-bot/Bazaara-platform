import type { MetadataRoute } from "next";

const ORIGIN = process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL ?? "https://grocery.bazaara.com";

export default function robots(): MetadataRoute.Robots {
  const base = ORIGIN.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account/", "/cart", "/checkout", "/orders/", "/wishlist", "/compare", "/bazai", "/baz-lens", "/bazlens", "/shopping/cart", "/shopping/checkout", "/shopping/orders/", "/shopping/wishlist"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
