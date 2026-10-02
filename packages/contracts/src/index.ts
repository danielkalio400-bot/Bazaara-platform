export type Brand<K, T extends string> = K & { readonly __brand: T };
export type UserId = Brand<string, "UserId">;
export type SessionId = Brand<string, "SessionId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type MoneyMinor = Brand<number, "MoneyMinor">;

export type VerificationLevel = 0 | 1 | 2 | 3 | 4;

export const permissions = [
  "profile.read",
  "profile.write",
  "session.read",
  "session.revoke",
  "address.read",
  "address.write",
  "merchant.read",
  "merchant.manage",
  "catalog.read",
  "catalog.manage",
  "inventory.manage",
  "order.read",
  "order.manage",
  "courier.manage",
  "payment.read",
  "payment.refund",
  "payout.manage",
  "promotion.manage",
  "support.manage",
  "risk.read",
  "risk.manage",
  "audit.read",
  "admin.feature_flags",
  "operations.command.read",
  "operations.business.manage",
  "operations.shopping.manage",
  "operations.grocery.manage",
  "operations.food.manage",
  "operations.pharmacy.manage",
  "operations.mobility.manage",
  "operations.pay.manage",
  "operations.risk.manage",
  "operations.support.manage",
  "operations.roles.manage",
  "operations.audit.read",
] as const;
export type Permission = (typeof permissions)[number];

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    requestId?: string;
    fields?: Record<string, string[]>;
  };
}

export interface Money {
  amountMinor: number;
  currency: string;
}

export function assertCurrency(currency: string): string {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must be ISO-4217-like uppercase code");
  return currency;
}

// Shopping fulfillment / payment orchestration contracts (Roadmaps 16-20).
export type ShoppingFulfillmentStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PICKING"
  | "PROCESSING"
  | "PACKED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLATION_REQUESTED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type ShipmentStatus =
  | "DRAFT"
  | "LABEL_CREATED"
  | "PACKED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED_DELIVERY"
  | "REDELIVERY_SCHEDULED"
  | "RETURN_TO_SENDER"
  | "RETURNED_TO_SENDER"
  | "CANCELLED";

export type ShoppingReturnStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RETURN_LABEL_CREATED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "INSPECTING"
  | "REFUND_PENDING"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "DISPUTED"
  | "CLOSED"
  | "CANCELLED";

export type PaymentIntentStatus =
  | "REQUIRES_PAYMENT_METHOD"
  | "REQUIRES_ACTION"
  | "PROCESSING"
  | "REQUIRES_CAPTURE"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface FulfillmentSlaContract {
  dueAt: string | null;
  breached: boolean;
  remainingMinutes: number | null;
}

export interface ShipmentContract {
  id: string;
  sellerOrderId: string;
  status: ShipmentStatus;
  carrier: string | null;
  service: string | null;
  trackingIdentifier: string | null;
  estimatedDeliveryAt: string | null;
}

export interface PaymentIntentContract {
  id: string;
  orderId: string;
  status: PaymentIntentStatus;
  amountMinor: number;
  capturedMinor: number;
  refundedMinor: number;
  currency: string;
  provider: string | null;
}

// Shopping production-readiness contracts (Roadmaps 21-27).
export type ShoppingPaymentMethod = "PAY_ON_DELIVERY" | "PAYSTACK_CARD" | "PAYSTACK_BANK";

export type NotificationDeliveryState = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SUPPRESSED";
export type SupportCaseState = "OPEN" | "WAITING_CUSTOMER" | "WAITING_STAFF" | "ESCALATED" | "RESOLVED" | "CLOSED";
export type SupportCasePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskSignalState = "OPEN" | "ACKNOWLEDGED" | "DISMISSED" | "RESOLVED";

export interface ShoppingPaymentInitializationContract {
  paymentIntentId: string;
  orderId: string;
  provider: "PAYSTACK";
  providerReference: string;
  checkoutUrl: string;
  status: PaymentIntentStatus;
}

export interface NotificationContract {
  id: string;
  category: string;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  mandatory: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface SupportCaseContract {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: SupportCaseState;
  priority: SupportCasePriority;
  orderId: string | null;
  productId: string | null;
  paymentIntentId: string | null;
  shipmentId: string | null;
  shoppingReturnId: string | null;
  driveRideId: string | null;
  ledgerTransactionId: string | null;
  assignedToUserId: string | null;
  lastActivityAt: string;
  createdAt: string;
}

export interface RiskSignalContract {
  id: string;
  userId: string | null;
  merchantId: string | null;
  orderId: string | null;
  type: string;
  severity: RiskSeverity;
  score: number;
  status: RiskSignalState;
  explanation: string;
  evidence: unknown;
  ruleVersion: string;
  createdAt: string;
}

// Shared customer address contract used across Bazaara verticals.
export interface BazaaraAddressContract {
  id: string;
  label: string | null;
  country: string;
  region: string | null;
  city: string;
  district: string | null;
  street: string | null;
  building: string | null;
  unit: string | null;
  postcode: string | null;
  landmark: string | null;
  deliveryInstructions: string | null;
  latitude: number | null;
  longitude: number | null;
  placeIdentifier: string | null;
  contactPhone: string | null;
  isApproximate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Food web contracts (Phase 3 / Roadmap 32).
export type FoodFulfillmentType = "DELIVERY" | "PICKUP";
export type FoodOrderStatus = "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED";

export interface FoodRestaurantSummaryContract {
  id: string;
  slug: string;
  name: string;
  description: string;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  cuisineTags: string[];
  priceBand: number;
  rating: number;
  ratingCount: number;
  isOpen: boolean;
  etaMinutes: { min: number; max: number };
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  serviceFeePolicy: { rateBps: number; minimumMinor: number; maximumMinor: number };
  minimumOrderMinor: number;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  asapEnabled: boolean;
  scheduledEnabled: boolean;
  openingHours: Array<{ dayOfWeek: number; openMinute: number; closeMinute: number; closed: boolean }>;
  acceptingOrders: boolean;
  pausedUntil: string | null;
  preorderEnabled: boolean;
  capacity: { maxActiveOrders: number; prepTimeBufferMin: number };
  pickupLocation: { latitude: number; longitude: number } | null;
  distanceMeters: number | null;
}

export interface FoodModifierOptionContract {
  id: string;
  name: string;
  priceDeltaMinor: number;
}

export interface FoodModifierGroupContract {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: FoodModifierOptionContract[];
}

export interface FoodMenuItemContract {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  priceMinor: number;
  currency: string;
  available: boolean;
  featured: boolean;
  dietaryTags: string[];
  prepMinutes: number | null;
  modifierGroups: FoodModifierGroupContract[];
}

export interface FoodCartContract {
  id: string | null;
  restaurant: FoodRestaurantSummaryContract;
  fulfillmentType: FoodFulfillmentType;
  scheduledFor: string | null;
  cutleryRequired: boolean;
  contactless: boolean;
  deliveryAddress: unknown | null;
  note: string | null;
  tipMinor: number;
  promoCode: string | null;
  discountMinor: number;
  isGift: boolean;
  recipientName: string | null;
  recipientPhone: string | null;
  giftMessage: string | null;
  groupOrderId: string | null;
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    imageUrl: string | null;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    selectedModifiers: Array<{ groupId: string; groupName: string; optionId: string; optionName: string; priceDeltaMinor: number }>;
    specialInstructions: string | null;
  }>;
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
}


export interface FoodOrderContract {
  id: string;
  orderNumber: string;
  status: FoodOrderStatus;
  fulfillmentType: FoodFulfillmentType;
  scheduledFor: string | null;
  cutleryRequired: boolean;
  contactless: boolean;
  deliveryAddress: Record<string, unknown> | null;
  note: string | null;
  tipMinor: number;
  discountMinor: number;
  promoCode: string | null;
  isGift: boolean;
  recipientName: string | null;
  recipientPhone: string | null;
  giftMessage: string | null;
  groupOrderId: string | null;
  deliveryPinVerified: boolean;
  /** Returned only once when a delivery order is placed. */
  deliveryPin?: string | null;
  courierUserId: string | null;
  courierAssignedAt: string | null;
  pickedUpAt: string | null;
  /** Restaurant pickup point used by customer live tracking. */
  pickupLocation: { latitude: number; longitude: number } | null;
  /** Customer delivery point captured at checkout when coordinates are available. */
  dropoffLocation: { latitude: number; longitude: number } | null;
  economics: null | {
    serviceFeeBps:number; serviceFeeMinimumMinor:number; serviceFeeMaximumMinor:number;
    merchantCommissionBps:number; merchantCommissionMinor:number; merchantFundedDiscountMinor:number; bazaaraFundedDiscountMinor:number; merchantNetMinor:number;
    courierGrossMinor:number; goCommissionBps:number; goCommissionMinor:number; courierNetMinor:number; courierPayoutMinor:number;
  };
  courier?: { displayName:string; phone:string|null } | null;
  currency: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  totalMinor: number;
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
  restaurant: FoodRestaurantSummaryContract;
  tracking: Array<{ id:string; status:string; latitude:number|null; longitude:number|null; message:string|null; createdAt:string }>;
  messages: Array<{ id:string; senderUserId:string|null; senderRole:string; text:string|null; mediaKey:string|null; createdAt:string }>;
  review: null | { id:string; rating:number; foodRating:number|null; deliveryRating:number|null; text:string|null; photoKeys:string[]; restaurantReply:string|null; repliedAt:string|null; createdAt:string };
  supportIssues: Array<{ id:string; type:string; status:string; details:string; requestedRefundMinor:number|null; approvedRefundMinor:number|null; createdAt:string }>;
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    selectedModifiers: Array<{ groupId: string; groupName: string; optionId: string; optionName: string; priceDeltaMinor: number }>;
    specialInstructions: string | null;
  }>;
}

// Roadmaps 35-79 integration contracts. Keep these transport shapes stable across
// web, native and service clients; monetary values are integer minor units.
export type LogisticsServiceLevel = "BIKE" | "CAR" | "VAN";
export type LogisticsBookingStatus = "CONFIRMED" | "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED" | "RETURNING" | "RETURNED" | "CANCELLED";
export interface LogisticsQuoteContract {
  id: string;
  serviceLevel: LogisticsServiceLevel;
  etaMinutes: number;
  amountMinor: number;
  currency: string;
  expiresAt: string;
}
export interface LogisticsBookingContract {
  id: string;
  publicCode: string;
  trackingCode: string;
  quoteId: string;
  status: LogisticsBookingStatus;
  scheduledFor: string | null;
  createdAt: string;
  fundingStatus?: "FUNDED" | "SETTLED" | "REFUNDED" | "UNFUNDED";
  amountPaidMinor?: number;
  platformFeeBps?: number;
  platformFeeMinor?: number;
  courierPayoutMinor?: number;
  assignedCourierUserId?: string | null;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  inTransitAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  cancelledAt?: string | null;
}
export interface LogisticsVerificationContract {
  pickupCode: string;
  deliveryCode: string;
}
export interface LogisticsBookingResponseContract {
  booking: LogisticsBookingContract;
  verification: LogisticsVerificationContract;
}

export type DriveRideClass = "GO" | "COMFORT" | "XL";
export type DriveRideStatus = "REQUESTED" | "MATCHING" | "DRIVER_ASSIGNED" | "DRIVER_ARRIVING" | "DRIVER_ARRIVED" | "WAITING" | "RIDER_VERIFIED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export interface DrivePricingQuoteContract {
  id: string;
  rideClass: DriveRideClass;
  distanceMeters: number;
  durationSeconds: number;
  etaMinutes: number;
  baseFareMinor: number;
  distanceFareMinor: number;
  timeFareMinor: number;
  subtotalMinor: number;
  fuelAdjustmentMinor: number;
  demandAdjustmentMinor: number;
  tollsMinor: number;
  feesMinor: number;
  discountsMinor: number;
  surgeBps: number;
  fuelIndexBps: number;
  platformFeeBps: number;
  platformFeeMinor: number;
  driverEarningsMinor: number;
  totalMinor: number;
  currency: string;
  pricingRuleVersion: string;
  expiresAt: string;
  fuelDisclosure?: {
    status: "CURRENT" | "STALE" | "PENDING_VERIFICATION" | "UNAVAILABLE" | "LEGACY";
    source: string | null;
    evidenceUrl: string | null;
    effectiveFrom: string | null;
    weightBps: number;
    maxAdjustmentBps: number;
  };
}
export interface DriveRideContract {
  id: string;
  quoteId: string;
  status: DriveRideStatus;
  driverUserId: string | null;
  paymentMode: string;
  fareFundingStatus: string;
  fundedAmountMinor: number;
  platformFeeBps: number;
  platformChargeMinor: number;
  driverEarningsMinor: number;
  scheduledFor: string | null;
  searchRadiusMeters: number;
  createdAt: string;
}
export interface DriveRideRequestResponseContract {
  ride: DriveRideContract;
  riderPin: string;
}
export interface DriveDispatchOfferContract {
  id: string;
  rideId: string;
  status: string;
  pickupDistanceMeters: number;
  pickupEtaSeconds: number;
  searchRadiusMeters: number;
  expiresAt: string;
  quote: DrivePricingQuoteContract;
}
export interface DriveDriverProfileContract {
  userId: string;
  approvalStatus: string;
  availability: string;
  serviceClasses: string[];
  walletBalanceMinor: number;
  platformDebtMinor: number;
  maxPickupDistanceMeters: number;
  maxPickupEtaSeconds: number;
  lastLocationAt: string | null;
}

export interface DriveWalletActivityContract {
  id: string;
  transactionId: string;
  reference: string;
  kind: string;
  direction: "IN" | "OUT";
  amountMinor: number;
  currency: string;
  description: string | null;
  createdAt: string;
}

export interface DriveRideSummaryContract {
  id: string;
  status: string;
  rideClass: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
}

export interface DriveDriverWalletContract {
  currency: string;
  walletBalanceMinor: number;
  ledgerBalanceMinor: number;
  platformDebtMinor: number;
  payoutAvailableMinor: number;
  payWalletBalanceMinor: number;
  reconciled: boolean;
  payouts: DriveDriverPayoutContract[];
  entries: Array<{
    id: string;
    rideId: string | null;
    type: string;
    amountMinor: number;
    balanceAfterMinor: number;
    metadata: unknown;
    createdAt: string;
  }>;
}

export interface DriveDriverPayoutContract {
  id: string;
  driverUserId: string;
  amountMinor: number;
  currency: string;
  status: string;
  destinationWalletId: string | null;
  ledgerTransactionId: string | null;
  initiatedByUserId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DriveWalletContextContract {
  wallet: PayWalletContract;
  heldFareMinor: number;
  activeRideCount: number;
  completedRideCount: number;
  completedSpendMinor: number;
  recentActivity: DriveWalletActivityContract[];
  recentRides: DriveRideSummaryContract[];
  driver: null | {
    approvalStatus: string;
    earningsBalanceMinor: number;
    platformDebtMinor: number;
    payoutAvailableMinor: number;
    payWalletBalanceMinor: number;
    driveLedgerBalanceMinor: number;
    reconciled: boolean;
  };
}

export interface PayWalletContract {
  id: string;
  ownerKey: string;
  currency: string;
  status: string;
  availableMinor: number;
}
export interface PayTransferContract {
  id: string;
  reference: string;
  fromWalletId: string;
  toWalletId: string;
  amountMinor: number;
  feeMinor: number;
  totalDebitMinor: number;
  currency: string;
  status: string;
  ledgerTransactionId: string | null;
  createdAt: string;
  completedAt: string | null;
  note?: string | null;
}

export interface PayFundingIntentContract {
  id: string;
  walletId: string;
  provider: string;
  providerReference: string | null;
  paymentMethod: "PAYSTACK_CARD" | "PAYSTACK_BANK";
  amountMinor: number;
  currency: string;
  status: string;
  checkoutUrl: string | null;
  failureMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}


export interface PayProfileContract { userId:string; payTag:string; pinSet:boolean; dailyTransferLimitMinor:number; pinLockedUntil:string|null; }
export interface PayRecipientContract { userId:string; walletId:string; displayName:string; payTag:string; maskedContact:string|null; }
export interface PayActivityContract { id:string; transactionId:string; reference:string; kind:string; direction:"IN"|"OUT"; amountMinor:number; currency:string; description:string|null; createdAt:string; }
export interface PayMoneyRequestContract { id:string; code:string; requesterUserId:string; requesterWalletId:string; requesterDisplayName:string; requesterPayTag:string; payerUserId:string|null; payerWalletId:string|null; amountMinor:number; currency:string; note:string|null; status:string; createdAt:string; expiresAt:string; paidAt:string|null; cancelledAt:string|null; }
export interface PayBeneficiaryContract { id:string; walletId:string; displayName:string; payTag:string; label:string|null; createdAt:string; }
export interface PayBankContract { name:string; code:string; slug:string|null; }
export interface PayBankAccountContract { id:string; provider:string; bankCode:string; bankName:string; accountName:string; accountNumberLast4:string; status:string; createdAt:string; }
export interface PayWithdrawalContract { id:string; bankAccountId:string; provider:string; providerReference:string|null; amountMinor:number; currency:string; status:string; failureMessage:string|null; createdAt:string; completedAt:string|null; failedAt:string|null; }
export interface PayFeeQuoteContract { amountMinor:number; feeMinor:number; totalDebitMinor:number; currency:string; bps:number; minMinor:number; maxMinor:number; }
export interface PayFixedSavingsContract { id:string; name:string; principalMinor:number; currency:string; status:string; lockUntil:string; annualRateBps:number|null; provider:string|null; pledgedLoanApplicationId:string|null; createdAt:string; releasedAt:string|null; }
export interface PayLoanApplicationContract { id:string; requestedMinor:number; currency:string; termDays:number; purpose:string|null; status:string; pledgedSavingsId:string|null; lenderName:string|null; offeredPrincipalMinor:number|null; interestBps:number|null; feeMinor:number|null; totalRepaymentMinor:number|null; repaymentFrequency:string|null; createdAt:string; offeredAt:string|null; acceptedAt:string|null; cancelledAt:string|null; }

export interface BusinessBranchContract {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  status: string;
  timezone: string;
  address: unknown | null;
}
export interface BusinessApiCredentialContract {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}
export interface BusinessWebhookEndpointContract {
  id: string;
  organizationId: string;
  url: string;
  events: string[];
  status: string;
  signingKeyId: string;
  failureCount: number;
}
export interface BusinessInvoiceContract {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string | null;
  currency: string;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  status: string;
  lines: unknown;
  dueAt: string | null;
  paidAt: string | null;
}

export interface BusinessSettlementContract {
  id: string;
  organizationId: string;
  reference: string;
  currency: string;
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
  status: string;
  provider: string | null;
  providerRef: string | null;
  scheduledFor: string | null;
  settledAt: string | null;
  createdAt: string;
}

export interface BusinessMemberContract {
  id: string;
  organizationId: string;
  userId: string;
  displayName: string | null;
  title: string | null;
  status: string;
  primaryEmail: string | null;
  verificationLevel: string;
  createdAt: string;
}

export interface PharmacyProductContract {
  id: string;
  merchantId: string;
  sku: string;
  slug: string;
  name: string;
  genericName: string | null;
  brand: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  barcode: string | null;
  imageUrl: string | null;
  description: string;
  category: string;
  priceMinor: number;
  currency: string;
  stockOnHand: number;
  requiresPrescription: boolean;
  active: boolean;
}
export interface PharmacyPrescriptionContract {
  id: string;
  userId: string;
  merchantId: string | null;
  status: string;
  jurisdiction: string;
  documentAssetId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}
export interface PharmacyOrderContract {
  id: string;
  orderNumber: string;
  merchantId: string;
  status: string;
  fulfillmentType: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  paymentStatus: string;
  prescriptionId: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    requiresPrescription: boolean;
    status: string;
  }>;
}
export interface PharmacyRefillPlanContract {
  id: string;
  productId: string | null;
  prescriptionId: string | null;
  cadenceDays: number;
  quantity: number;
  status: string;
  nextRunAt: string;
  reminderDays: number;
}

export interface SportsCompetitionContract {
  id: string;
  provider: string;
  providerId: string;
  sport: string;
  name: string;
  country: string | null;
}
export interface SportsFixtureContract {
  id: string;
  competitionId: string;
  status: string;
  startsAt: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  clock: string | null;
}

export interface PublicPlatformConfigContract {
  region: string;
  currency: string;
  locale: string;
  timezone: string;
  pharmacyPrescriptionEnabled: boolean;
  sportsRealMoneyBettingEnabled: false;
  features: Record<string, boolean>;
}
