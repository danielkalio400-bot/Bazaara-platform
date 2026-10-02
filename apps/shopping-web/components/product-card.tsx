import Link from "next/link";
import { AddToCart } from "./add-to-cart";
import { WishlistButton } from "./wishlist-button";
import { formatMoney, type MoneyProduct } from "../lib/shopping";

function fulfilmentLabel(product: MoneyProduct) {
  if (product.fulfillmentModes.includes("DELIVERY")) return "Delivery";
  if (product.fulfillmentModes.includes("PICKUP")) return "Pickup";
  return "Available";
}

export function ProductCard({ product }: { product: MoneyProduct }) {
  const discount =
    product.compareAtPriceMinor && product.compareAtPriceMinor > product.priceMinor
      ? Math.round((1 - product.priceMinor / product.compareAtPriceMinor) * 100)
      : 0;

  return (
    <article className="shop-product-card neon-product-card">
      <div className="product-card-media">
        <Link
          href={`/products/${product.slug}`}
          className="product-image-wrap"
          aria-label={product.title}
        >
          {product.image ? (
            <img
              className="product-image"
              src={product.image.url}
              alt={product.image.alt || product.title}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="product-image product-image-empty">SHOPPING</div>
          )}

          <div className="neon-product-badges">
            {discount > 0 ? <span className="discount-badge">-{discount}%</span> : null}
            {product.featured ? <span className="neon-featured-badge">Featured</span> : null}
          </div>
        </Link>

        <WishlistButton
          productId={product.id}
          variantId={product.defaultVariantId}
          compact
        />
      </div>

      <div className="product-card-body">
        <div className="neon-product-topline">
          <span className="product-kicker">
            {product.brand?.name ?? product.category?.name ?? "Shopping"}
          </span>

          <span className={product.stock === "IN_STOCK" ? "neon-stock is-live" : "neon-stock"}>
            {product.stock === "IN_STOCK"
              ? product.availableQuantity > 0 && product.availableQuantity <= 5
                ? `Only ${product.availableQuantity} left` : "In stock"
              : "Unavailable"}
          </span>
        </div>

        <Link href={`/products/${product.slug}`} className="product-title">
          {product.title}
        </Link>

        {product.shortDescription ? (
          <p className="neon-product-description">{product.shortDescription}</p>
        ) : null}

        <div className="product-price-row">
          <strong>{formatMoney(product.priceMinor, product.currency)}</strong>
          {product.compareAtPriceMinor ? (
            <s>{formatMoney(product.compareAtPriceMinor, product.currency)}</s>
          ) : null}
        </div>

        <div className="neon-product-meta">
          <span>◎ {fulfilmentLabel(product)}</span>
          {product.seller ? (
            <Link
              href={`/sellers/${product.seller.slug}`}
              className={product.seller.verified ? "is-verified" : ""}
            >
              {product.seller.verified ? "✓ " : ""}
              {product.seller.name}
            </Link>
          ) : null}
        </div>

        {product.defaultVariantId ? (
          <AddToCart
            variantId={product.defaultVariantId}
            disabled={product.stock !== "IN_STOCK"}
          />
        ) : null}
      </div>
    </article>
  );
}
