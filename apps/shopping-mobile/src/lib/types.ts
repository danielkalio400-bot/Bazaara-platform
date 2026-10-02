export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  currency: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  featured: boolean;
  image: { url: string; alt: string } | null;
  category: { slug: string; name: string } | null;
  brand: { slug: string; name: string } | null;
  seller: { slug: string; name: string; verified: boolean; vertical?: string } | null;
  fulfillmentModes: string[];
  stock: "IN_STOCK" | "OUT_OF_STOCK";
  availableQuantity: number;
  defaultVariantId: string | null;
};

export type ProductDetail = ProductSummary & {
  description: string;
  media: Array<{ id: string; type: "IMAGE" | "VIDEO"; url: string; alt: string }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    attributes: unknown;
    currency: string;
    priceMinor: number;
    compareAtPriceMinor: number | null;
    availableQuantity: number;
  }>;
};

export type Category = { id: string; slug: string; name: string; description: string | null };

export type Cart = {
  id: string | null;
  currency: string;
  itemCount: number;
  subtotalMinor: number;
  updatedAt: string | null;
  items: Array<{
    id: string;
    quantity: number;
    availableQuantity: number;
    fulfillmentModes: string[];
    unitPriceMinor: number;
    lineTotalMinor: number;
    variant: { id: string; title: string; sku: string; attributes: unknown };
    product: { id: string; slug: string; title: string; image: { url: string; alt: string } | null };
    seller: { slug: string; name: string };
  }>;
};

export type Checkout = {
  id: string;
  status: string;
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  promotionCode?: string | null;
  paymentMethod: string;
  deliveryMode: "STANDARD" | "EXPRESS" | "SCHEDULED";
  scheduledFor?: string | null;
  expiresAt: string;
  paymentMethods: Array<{ key: string; label: string; available: boolean; reason?: string }>;
  sellers: Array<{
    merchantId: string;
    sellerName: string;
    subtotalMinor: number;
    shippingMinor: number;
    items: Array<{
      id: string;
      productTitle: string;
      variantTitle: string;
      quantity: number;
      unitPriceMinor: number;
      lineTotalMinor: number;
    }>;
  }>;
};

export type ShoppingOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMode: "STANDARD" | "EXPRESS" | "SCHEDULED";
  scheduledFor?: string | null;
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  placedAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  sellerOrders: Array<{
    id: string;
    status: string;
    seller: { slug: string; name: string };
    store: { id: string; name: string };
    items: Array<{
      id: string;
      productId?: string;
      variantId?: string;
      productTitle: string;
      variantTitle: string;
      sku?: string;
      quantity: number;
      unitPriceMinor?: number;
      lineTotalMinor: number;
    }>;
  }>;
  returns?: Array<{
    id: string;
    status: string;
    reason: string;
    details: string | null;
    requestedAt: string;
    requestedRefundMinor: number | null;
    approvedRefundMinor: number | null;
    returnCarrier: string | null;
    returnTrackingId: string | null;
    evidence: Array<{ id: string; type: string; url: string; note: string | null }>;
    disputes: Array<{ id: string; status: string; reason: string; details: string | null }>;
    refunds: Array<{ id: string; status: string; amountMinor: number }>;
    items: Array<{ id: string; orderItemId: string; quantity: number }>;
  }>;
};

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  reviewer: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewSummary = {
  average: number;
  count: number;
  distribution?: Array<{ rating: number; count: number }>;
};

export type ReviewListResponse = {
  summary: ReviewSummary;
  reviews: PublicReview[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export function money(amountMinor: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return null;
  return `-${Math.round(((compareAt - price) / compareAt) * 100)}%`;
}
