export function groceryMoney(minor = 0, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  currency: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  image: { url: string; alt: string } | null;
  brand: { slug: string; name: string } | null;
  seller: { slug: string; name: string; verified: boolean; vertical?: string } | null;
  fulfillmentModes: string[];
  stock: "IN_STOCK" | "OUT_OF_STOCK";
  availableQuantity: number;
  defaultVariantId: string | null;
};

export type ProductDetail = ProductSummary & {
  description: string;
  media: Array<{ id: string; type: string; url: string; alt: string }>;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
    priceMinor: number;
    compareAtPriceMinor: number | null;
    availableQuantity: number;
  }>;
};

export type GroceryCartItem = {
  id: string;
  quantity: number;
  availableQuantity: number;
  fulfillmentModes: string[];
  unitPriceMinor: number;
  lineTotalMinor: number;
  variant: { id: string; title: string; sku: string };
  product: {
    id: string;
    slug: string;
    title: string;
    image: { url: string; alt: string } | null;
  };
  seller: { slug: string; name: string };
  groceryPreference: {
    substitutionPolicy:
      | "BEST_MATCH"
      | "CONTACT_ME"
      | "REFUND"
      | "SPECIFIC_REPLACEMENT";
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
  updatedAt?: string | null;
};

export type GroceryStore = {
  merchantId: string;
  slug: string;
  name: string;
  verified: boolean;
  branches: Array<{
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
  }>;
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
  deliveryMode: "STANDARD" | "EXPRESS" | "SCHEDULED" | "PICKUP";
  scheduledFor: string | null;
  paymentMethod: string;
  expiresAt: string;
  paymentMethods: Array<{
    key: string;
    label: string;
    available: boolean;
    reason?: string;
  }>;
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
  placedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  sellerOrders: Array<{
    id: string;
    status: string;
    seller: { slug: string; name: string };
    store: { id: string; name: string };
    items: Array<{
      id: string;
      productTitle: string;
      variantTitle: string;
      quantity: number;
      unitPriceMinor: number;
      lineTotalMinor: number;
    }>;
    picker: null | {
      id: string;
      status: string;
      startedAt: string | null;
      completedAt: string | null;
      outcomes: Array<{
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
      }>;
      messages: Array<{
        id: string;
        senderUserId: string;
        kind: string;
        text: string | null;
        mediaKey: string | null;
        createdAt: string;
      }>;
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
