import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  AddToCart
} from "../../../components/add-to-cart";

import {
  ProductGallery
} from "../../../components/product-gallery";

import {
  ShoppingHeader
} from "../../../components/shopping-header";

import {
  WishlistButton
} from "../../../components/wishlist-button";

import {
  apiPublicGet,
  formatMoney,
  type ProductDetail
} from "../../../lib/shopping";

import styles from "./product-detail.module.css";


export const revalidate = 60;

const PUBLIC_ORIGIN = (process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL ?? "https://grocery.bazaara.com").replace(/\/$/, "");
const getProduct = cache(async (slug: string) => apiPublicGet<{ product: ProductDetail }>(`/v1/shopping/products/${encodeURIComponent(slug)}`));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product } = await getProduct(slug);
    if (product.seller?.vertical !== "GROCERY") return { title: "Product", robots: { index: false, follow: false } };
    const description = cleanDisplayText(product.shortDescription || product.description).slice(0, 180);
    const canonical = `/products/${encodeURIComponent(product.slug)}`;
    const images = product.media.filter((item) => item.type === "IMAGE").slice(0, 4).map((item) => ({ url: item.url, alt: item.alt || product.title }));
    return {
      title: cleanDisplayText(product.title),
      description,
      alternates: { canonical },
      openGraph: { type: "website", title: cleanDisplayText(product.title), description, url: canonical, images },
      twitter: { card: images.length ? "summary_large_image" : "summary", title: cleanDisplayText(product.title), description, images: images.map((item) => item.url) },
    };
  } catch {
    return { title: "Product", robots: { index: false, follow: false } };
  }
}


function cleanDisplayText(
  value:
    | string
    | null
    | undefined
) {

  return (
    value ??
    ""
  )
    .replace(
      /\u00C2\u00B7/g,
      "\u00B7"
    )
    .replace(
      /\u00E2\u0080\u00A6/g,
      "\u2026"
    );
}


export default async function ProductPage({
  params
}: {
  params:
    Promise<{
      slug: string;
    }>;
}) {

  const {
    slug
  } =
    await params;


  const { product } = await getProduct(slug);

  if (product.seller?.vertical !== "GROCERY") notFound();


  const variant =
    product.variants.find(
      (
        candidate
      ) =>
        candidate.availableQuantity >
        0
    ) ??
    product.variants[0];


  const title =
    cleanDisplayText(
      product.title
    );


  const shortDescription =
    cleanDisplayText(
      product.shortDescription
    );


  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: cleanDisplayText(product.description),
    image: product.media.filter((item) => item.type === "IMAGE").map((item) => item.url),
    sku: variant?.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${PUBLIC_ORIGIN}/products/${encodeURIComponent(product.slug)}`,
      priceCurrency: product.currency,
      price: (product.priceMinor / 100).toFixed(2),
      availability: product.stock === "IN_STOCK" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: product.seller ? { "@type": "Organization", name: product.seller.name, url: `${PUBLIC_ORIGIN}/sellers/${encodeURIComponent(product.seller.slug)}` } : undefined,
    },
  };

  return (
    <div
      className="shop-shell"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
      <ShoppingHeader />

      <main
        className={
          `shop-main ${styles.page}`
        }
      >
        <nav
          className={
            styles.breadcrumbs
          }
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
          >
            Shopping
          </Link>

          <span
            aria-hidden="true"
          >
            /
          </span>

          {product.category ? (
            <>
              <Link
                href={
                  `/search-results?category=${encodeURIComponent(product.category.slug)}`
                }
              >
                {
                  product.category.name
                }
              </Link>

              <span
                aria-hidden="true"
              >
                /
              </span>
            </>
          ) : null}

          <span
            aria-current="page"
          >
            {
              title
            }
          </span>
        </nav>


        <section
          className={
            styles.productLayout
          }
        >
          <ProductGallery
            media={
              product.media
            }
            title={
              title
            }
          />


          <section
            className={
              styles.purchasePanel
            }
            aria-label="Product purchase information"
          >
            <WishlistButton
              productId={product.id}
              variantId={variant?.id}
            />

            <span
              className={
                styles.brand
              }
            >
              {
                product.brand?.name ??
                "SHOPPING"
              }
            </span>

            <h1>
              {
                title
              }
            </h1>

            {shortDescription ? (
              <p
                className={
                  styles.shortDescription
                }
              >
                {
                  shortDescription
                }
              </p>
            ) : null}


            <div
              className={
                styles.priceBlock
              }
            >
              <div
                className={
                  styles.priceRow
                }
              >
                <strong>
                  {
                    formatMoney(
                      product.priceMinor,
                      product.currency
                    )
                  }
                </strong>

                {product.compareAtPriceMinor ? (
                  <s>
                    {
                      formatMoney(
                        product.compareAtPriceMinor,
                        product.currency
                      )
                    }
                  </s>
                ) : null}
              </div>

              <span
                className={
                  product.stock ===
                  "IN_STOCK"
                    ? styles.stockIn
                    : styles.stockOut
                }
              >
                {
                  product.stock ===
                  "IN_STOCK"
                    ? `${product.availableQuantity} available`
                    : "Currently out of stock"
                }
              </span>
            </div>


            {variant ? (
              <div
                className={
                  styles.variantBox
                }
              >
                <span>
                  Option
                </span>

                <strong>
                  {
                    cleanDisplayText(
                      variant.title
                    )
                  }
                </strong>

                <small>
                  SKU {
                    cleanDisplayText(
                      variant.sku
                    )
                  }
                </small>
              </div>
            ) : null}


            <div
              className={
                styles.purchaseAction
              }
            >
              {variant ? (
                <AddToCart
                  variantId={
                    variant.id
                  }
                  disabled={
                    variant.availableQuantity <
                    1
                  }
                />
              ) : (
                <div
                  className={
                    styles.unavailable
                  }
                >
                  This item is currently unavailable.
                </div>
              )}
            </div>


            <div
              className={
                styles.purchaseTrust
              }
            >
              <div>
                <span
                  aria-hidden="true"
                >
                  ✓
                </span>

                <p>
                  <strong>
                    Verified inventory
                  </strong>

                  <small>
                    Availability is checked against current store stock.
                  </small>
                </p>
              </div>

              <div>
                <span
                  aria-hidden="true"
                >
                  ◈
                </span>

                <p>
                  <strong>
                    Secure checkout
                  </strong>

                  <small>
                    BazID protects account checkout and payment confirmation.
                  </small>
                </p>
              </div>
            </div>
          </section>


          <aside
            className={
              styles.deliveryPanel
            }
            aria-label="Delivery and returns"
          >
            <div
              className={
                styles.deliveryHeading
              }
            >
              <span>
                DELIVERY & RETURNS
              </span>

              <strong>
                Order with confidence
              </strong>
            </div>


            <div
              className={
                styles.deliverySection
              }
            >
              <span
                className={
                  styles.deliveryIcon
                }
                aria-hidden="true"
              >
                ▣
              </span>

              <div>
                <strong>
                  Delivery
                </strong>

                <p>
                  Delivery options and final charges are calculated from your checkout address.
                </p>
              </div>
            </div>


            <div
              className={
                styles.deliverySection
              }
            >
              <span
                className={
                  styles.deliveryIcon
                }
                aria-hidden="true"
              >
                ↺
              </span>

              <div>
                <strong>
                  Returns
                </strong>

                <p>
                  Eligible items can be returned within 7 days of delivery, subject to Bazaara return conditions.
                </p>
              </div>
            </div>


            <div
              className={
                styles.deliverySection
              }
            >
              <span
                className={
                  styles.deliveryIcon
                }
                aria-hidden="true"
              >
                ◈
              </span>

              <div>
                <strong>
                  Payment security
                </strong>

                <p>
                  Payment status is verified server-side before an order is treated as paid.
                </p>
              </div>
            </div>


            <div
              className={
                styles.sellerBox
              }
            >
              <span>
                SELLER
              </span>

              {product.seller ? (
                <Link
                  href={
                    `/sellers/${product.seller.slug}`
                  }
                >
                  {
                    product.seller.name
                  }
                  {
                    product.seller.verified
                      ? " · Verified"
                      : ""
                  }
                </Link>
              ) : (
                <strong>
                  Unavailable
                </strong>
              )}
            </div>
          </aside>
        </section>


        <section
          className={
            styles.detailsPanel
          }
        >
          <div
            className={
              styles.detailsHeading
            }
          >
            <span>
              PRODUCT INFORMATION
            </span>

            <h2>
              Product details
            </h2>
          </div>

          <p>
            {
              cleanDisplayText(
                product.description
              )
            }
          </p>
        </section>
      </main>
    </div>
  );
}
