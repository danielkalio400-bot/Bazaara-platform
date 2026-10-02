import Link from "next/link";

import { AddToCart } from "./add-to-cart";
import { WishlistButton } from "./wishlist-button";
import { formatMoney, type MoneyProduct } from "../lib/shopping";

function fulfilment(product: MoneyProduct) {
  const modes = new Set(product.fulfillmentModes.map((mode) => mode.toUpperCase()));
  if (modes.has("EXPRESS")) return "Express eligible";
  if (modes.has("PICKUP")) return "Pickup available";
  if (modes.has("SCHEDULED")) return "Scheduled delivery";
  return "Delivery available";
}

export function ProductCard({ product }: { product: MoneyProduct }) {
  const discount =
    product.compareAtPriceMinor && product.compareAtPriceMinor > product.priceMinor
      ? Math.round((1 - product.priceMinor / product.compareAtPriceMinor) * 100)
      : 0;

  return (
    <article className="shop-product-card grocery-product-card-v53">
      <div className="product-card-media">
        <Link href={`/products/${product.slug}`} className="product-image-wrap" aria-label={product.title}>
          {product.image ? (
            <img className="product-image" src={product.image.url} alt={product.image.alt || product.title} loading="lazy" decoding="async" />
          ) : (
            <div className="product-image product-image-empty">GROCERY</div>
          )}

          <div className="grocery-product-badges-v53">
            {discount > 0 ? <span className="discount-badge">-{discount}%</span> : null}
            {product.featured ? <span className="grocery-fresh-pick-v53">Fresh pick</span> : null}
          </div>
        </Link>

        <WishlistButton productId={product.id} variantId={product.defaultVariantId} compact />
      </div>

      <div className="product-card-body">
        <div className="grocery-product-topline-v53">
          <span className="product-kicker">{product.brand?.name ?? product.category?.name ?? "Grocery"}</span>
          <span className={product.stock === "IN_STOCK" ? "grocery-product-stock-v53 is-live" : "grocery-product-stock-v53"}>
            {product.stock === "IN_STOCK" ? "In stock" : "Unavailable"}
          </span>
        </div>

        <Link href={`/products/${product.slug}`} className="product-title">{product.title}</Link>

        {product.shortDescription ? <p className="grocery-product-description-v53">{product.shortDescription}</p> : null}

        <div className="product-price-row">
          <strong>{formatMoney(product.priceMinor, product.currency)}</strong>
          {product.compareAtPriceMinor ? <s>{formatMoney(product.compareAtPriceMinor, product.currency)}</s> : null}
        </div>

        <div className="grocery-product-meta-v53">
          <span>◎ {fulfilment(product)}</span>
          {product.seller ? (
            <Link href={`/sellers/${product.seller.slug}`} className={product.seller.verified ? "is-verified" : ""}>
              {product.seller.verified ? "✓ " : ""}{product.seller.name}
            </Link>
          ) : null}
        </div>

        {product.defaultVariantId ? <AddToCart variantId={product.defaultVariantId} disabled={product.stock !== "IN_STOCK"} /> : null}
      </div>
    </article>
  );
}
