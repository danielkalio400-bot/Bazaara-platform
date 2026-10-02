export function foodMoney(minor = 0, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}

export type FoodCartItem = {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  selectedModifiers: Array<{ groupName: string; optionName: string; priceDeltaMinor: number }>;
  specialInstructions: string | null;
};

export type FoodCart = {
  id: string | null;
  restaurant: { slug: string; name: string; deliveryEnabled: boolean; pickupEnabled: boolean; scheduledEnabled: boolean; asapEnabled: boolean };
  fulfillmentType: "DELIVERY" | "PICKUP";
  scheduledFor: string | null;
  cutleryRequired: boolean;
  contactless: boolean;
  deliveryAddress: Record<string, unknown> | null;
  note: string | null;
  tipMinor: number;
  promoCode: string | null;
  discountMinor: number;
  isGift: boolean;
  recipientName: string | null;
  recipientPhone: string | null;
  giftMessage: string | null;
  groupOrderId: string | null;
  items: FoodCartItem[];
  itemCount: number;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  serviceFeeRateBps: number;
  serviceFeeMinimumMinor: number;
  serviceFeeMaximumMinor: number;
  totalMinor: number;
  minimumOrderMinor: number;
  minimumOrderMet: boolean;
};

export type FoodOrder = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: "DELIVERY" | "PICKUP";
  scheduledFor: string | null;
  contactless: boolean;
  tipMinor: number;
  discountMinor: number;
  promoCode: string | null;
  totalMinor: number;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  placedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  timing: {
    startedAt: string;
    completedAt: string | null;
    cancelledAt: string | null;
    elapsedSeconds: number;
    elapsedMinutes: number;
    estimatedDeliveryMin: number;
    estimatedDeliveryMax: number;
    phases: {
      orderToCourierAssignedSeconds: number | null;
      courierAssignedToPickupSeconds: number | null;
      pickupToDeliverySeconds: number | null;
    };
  };
  deliveryPinVerified: boolean;
  courierUserId: string | null;
  courierAssignedAt: string | null;
  pickedUpAt: string | null;
  economics: null | { serviceFeeBps:number; serviceFeeMinimumMinor:number; serviceFeeMaximumMinor:number; merchantCommissionBps:number; merchantCommissionMinor:number; merchantFundedDiscountMinor:number; bazaaraFundedDiscountMinor:number; merchantNetMinor:number; courierGrossMinor:number; goCommissionBps:number; goCommissionMinor:number; courierNetMinor:number; courierPayoutMinor:number };
  courier?: { displayName: string; phone: string | null } | null;
  restaurant: { slug: string; name: string };
  items: Array<{ id: string; name: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number; selectedModifiers: Array<{ groupName: string; optionName: string }> }>;
  tracking: Array<{ id: string; status: string; latitude: number | null; longitude: number | null; message: string | null; createdAt: string }>;
  messages: Array<{ id: string; senderUserId: string; text: string | null; mediaKey: string | null; createdAt: string }>;
  supportIssues: Array<{ id: string; type: string; status: string; details: string; requestedRefundMinor: number | null; approvedRefundMinor: number | null; createdAt: string }>;
  review: { id: string; rating: number; foodRating: number | null; deliveryRating: number | null; text: string | null; restaurantReply: string | null } | null;
};
