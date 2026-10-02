export const GROCERY_API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

export type GroceryCartItem = {
  id: string;
  quantity: number;
  availableQuantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  fulfillmentModes: string[];
  variant: { id: string; title: string; sku: string; attributes?: unknown };
  product: { id: string; slug: string; title: string; image: { url: string; alt?: string } | null };
  seller: { slug: string; name: string };
  groceryPreference: {
    substitutionPolicy: "BEST_MATCH" | "CONTACT_ME" | "REFUND" | "SPECIFIC_REPLACEMENT";
    replacementVariantId: string | null;
    pickerNote: string | null;
    maxPriceIncreasePercent: number | null;
  } | null;
};

export type GroceryCart = {
  id: string | null;
  vertical?: string;
  currency: string;
  items: GroceryCartItem[];
  itemCount: number;
  subtotalMinor: number;
  updatedAt?: string;
};

export type GroceryBranch = {
  id: string;
  name: string;
  fulfillmentModes: string[];
  config: null | {
    pickupEnabled: boolean;
    expressEnabled: boolean;
    scheduledEnabled: boolean;
    minimumOrderMinor: number;
    prepMinutes: number;
  };
  slots: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    remaining: number;
  }>;
};

export type GroceryStore = {
  merchantId: string;
  slug: string;
  name: string;
  verified: boolean;
  branches: GroceryBranch[];
};

export type GroceryPricingPolicy = {
  serviceFeeBps: number;
  serviceFeeMinBps: number;
  serviceFeeMaxBps: number;
  expressRateBps: number;
  expressMinimumMinor: number;
  expressMaximumMinor: number;
};

export type GroceryCheckout = {
  id: string;
  vertical: string;
  pickupStoreId: string | null;
  deliverySlotId: string | null;
  status: string;
  currency: string;
  subtotalMinor: number;
  serviceFeeBps: number;
  serviceFeeMinor: number;
  shippingMinor: number;
  expressDeliveryFeeMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  shippingAddress: Record<string, unknown>;
  deliveryMode: "STANDARD" | "EXPRESS" | "SCHEDULED" | "PICKUP";
  scheduledFor: string | null;
  paymentMethod: string;
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

export type GroceryPickerOutcome = {
  id: string;
  orderItemId: string;
  status: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  actualWeightGrams: number | null;
  finalUnitPriceMinor: string | number | null;
  replacementVariantId: string | null;
  replacementQuantity: number | null;
  customerDecision: string;
  note: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GroceryPickerMessage = {
  id: string;
  senderUserId: string;
  kind: string;
  text: string | null;
  mediaKey: string | null;
  createdAt: string;
};

export type GroceryOrder = {
  id: string;
  orderNumber: string;
  vertical: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMode: string;
  scheduledFor: string | null;
  pickupStoreId: string | null;
  currency: string;
  subtotalMinor: number;
  serviceFeeBps: number;
  serviceFeeMinor: number;
  shippingMinor: number;
  expressDeliveryFeeMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  shippingAddress: Record<string, unknown>;
  placedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  sellerOrders: Array<{
    id: string;
    status: string;
    seller: { slug: string; name: string };
    store: { id: string; name: string };
    subtotalMinor: number;
    shippingMinor: number;
    totalMinor: number;
    items: Array<{
      id: string;
      productId: string;
      variantId: string;
      productTitle: string;
      variantTitle: string;
      sku: string;
      quantity: number;
      unitPriceMinor: number;
      lineTotalMinor: number;
    }>;
    picker: null | {
      id: string;
      status: string;
      startedAt: string | null;
      completedAt: string | null;
      outcomes: GroceryPickerOutcome[];
      messages: GroceryPickerMessage[];
    };
  }>;
  groceryPreferences?: Record<string, unknown> | null;
  groceryIssues?: Array<{
    id: string;
    type: string;
    status: string;
    details: string | null;
    requestedAmountMinor: number | null;
    approvedAmountMinor: number | null;
    createdAt: string;
  }>;
};

export function groceryMoney(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((value || 0) / 100);
}

export async function groceryFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${GROCERY_API}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as
    | T
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error((body as any)?.error?.message ?? `Request failed (${response.status})`);
  }

  return body as T;
}
