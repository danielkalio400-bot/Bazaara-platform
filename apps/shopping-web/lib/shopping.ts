import { createApiClient } from "@bazaara/api-client";

export type MoneyProduct = {
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
  wishlist?: {
    savedAt: string;
    savedPriceMinor: number | null;
    priceChanged: boolean;
    selectedVariantId: string | null;
    selectedVariant: { id: string; sku: string; title: string; active: boolean; priceMinor: number; availableQuantity: number } | null;
    available: boolean;
  };
};

export type ProductDetail = MoneyProduct & {
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

const SERVER_API = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";
const SERVER_CLIENT = createApiClient({ baseUrl: SERVER_API, credentials: "include" });

export async function apiGet<T>(path: string): Promise<T> {
  return SERVER_CLIENT.get<T>(path, { cache: "no-store" });
}

export async function apiPublicGet<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const base = SERVER_API.endsWith("/") ? SERVER_API.slice(0, -1) : SERVER_API;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${base}${normalizedPath}`, { next: { revalidate: Math.max(1, revalidateSeconds) } });
  const body = await response.json().catch(() => null) as T | { error?: { message?: string } } | null;
  if (!response.ok || body == null) {
    const message = (body as { error?: { message?: string } } | null)?.error?.message ?? `Bazaara API returned ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export function formatMoney(amountMinor: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor / 100);
}


export type Checkout = {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "ABANDONED";
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  shippingAddress: Record<string, unknown>;
  paymentMethod: string;
  deliveryMode: "STANDARD" | "EXPRESS" | "SCHEDULED";
  scheduledFor: string | null;
  expiresAt: string;
  paymentMethods: Array<{ key: string; label: string; available: boolean; reason?: string }>;
  sellers: Array<{ merchantId: string; sellerName: string; subtotalMinor: number; shippingMinor: number; items: Array<{ id:string; productTitle:string; variantTitle:string; quantity:number; unitPriceMinor:number; lineTotalMinor:number }> }>;
};

export type ShoppingOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMode: "STANDARD" | "EXPRESS" | "SCHEDULED";
  scheduledFor: string | null;
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  shippingAddress: Record<string, unknown>;
  placedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  payment: { id:string; reference:string; provider:string; status:string; amountMinor:number } | null;
  paymentIntent: { id:string; status:string; provider:string|null; amountMinor:number; capturedMinor:number; refundedMinor:number } | null;
  sellerOrders: Array<{ id:string; status:string; seller:{slug:string;name:string}; store:{id:string;name:string}; subtotalMinor:number; shippingMinor:number; totalMinor:number; items:Array<{id:string;productId:string;variantId:string;productTitle:string;variantTitle:string;sku:string;quantity:number;unitPriceMinor:number;lineTotalMinor:number}> }>;
  returns: Array<{ id:string; status:string; reason:string; details:string|null; requestedAt:string; eligibilityExpiresAt:string|null; requestedRefundMinor:number|null; approvedRefundMinor:number|null; returnCarrier:string|null; returnService:string|null; returnTrackingId:string|null; items:Array<{id:string;orderItemId:string;quantity:number;inspectedQuantity?:number|null;inspectionOutcome?:string|null;conditionNotes?:string|null;restockApproved?:boolean|null;refundableAmountMinor?:number|null}>; evidence:Array<{id:string;type:string;url:string;note:string|null;createdAt:string}>; events:Array<{id:string;type:string;fromStatus:string|null;toStatus:string|null;note:string|null;createdAt:string}>; disputes:Array<{id:string;status:string;reason:string;details:string|null;resolution:string|null;createdAt:string;resolvedAt:string|null}>; refunds:Array<{id:string;status:string;amountMinor:number;createdAt:string;processedAt:string|null}> }>;
};
