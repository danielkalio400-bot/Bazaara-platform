import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { settleFoodPaymentTx, type FoodPaymentMethod } from "./payment.js";
import { verifyPayPin } from "../pay/service.js";
import { queueBusinessFoodOrderReceivedTx, queueFoodPickupProximityTx } from "./notifications.js";

function minor(value: bigint | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "bigint" ? Number(value) : Number(value);
}

export const FOOD_DEFAULT_SERVICE_FEE_BPS = 500;
export const FOOD_DEFAULT_SERVICE_FEE_MINIMUM_MINOR = 15_000;
export const FOOD_DEFAULT_SERVICE_FEE_MAXIMUM_MINOR = 100_000;
export const FOOD_DEFAULT_MERCHANT_COMMISSION_BPS = 1_200;
export const FOOD_DEFAULT_GO_COMMISSION_BPS = 1_000;
export const FOOD_DEFAULT_MAX_PICKUP_DISTANCE_METERS = 6_000;
export const FOOD_DEFAULT_MAX_PICKUP_ETA_SECONDS = 1_200;
export const FOOD_DEFAULT_PICKUP_NEAR_DISTANCE_METERS = 500;
export const FOOD_DEFAULT_PICKUP_ARRIVAL_DISTANCE_METERS = 100;

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;
}

export type FoodRules = {
  serviceFeeBps: number; serviceFeeMinimumMinor: number; serviceFeeMaximumMinor: number;
  merchantCommissionBps: number; goCommissionBps: number;
  maxPickupDistanceMeters: number; maxPickupEtaSeconds: number;
  pickupNearDistanceMeters: number; pickupArrivalDistanceMeters: number;
};

export const DEFAULT_FOOD_RULES: FoodRules = {
  serviceFeeBps: FOOD_DEFAULT_SERVICE_FEE_BPS,
  serviceFeeMinimumMinor: FOOD_DEFAULT_SERVICE_FEE_MINIMUM_MINOR,
  serviceFeeMaximumMinor: FOOD_DEFAULT_SERVICE_FEE_MAXIMUM_MINOR,
  merchantCommissionBps: FOOD_DEFAULT_MERCHANT_COMMISSION_BPS,
  goCommissionBps: FOOD_DEFAULT_GO_COMMISSION_BPS,
  maxPickupDistanceMeters: FOOD_DEFAULT_MAX_PICKUP_DISTANCE_METERS,
  maxPickupEtaSeconds: FOOD_DEFAULT_MAX_PICKUP_ETA_SECONDS,
  pickupNearDistanceMeters: FOOD_DEFAULT_PICKUP_NEAR_DISTANCE_METERS,
  pickupArrivalDistanceMeters: FOOD_DEFAULT_PICKUP_ARRIVAL_DISTANCE_METERS,
};

export async function currentFoodRules(): Promise<FoodRules> {
  const regional = await db.regionalConfig.findUnique({ where: { region_vertical: { region: env.REGION, vertical: "food" } } }).catch(() => null);
  const rules = regional?.rules as Record<string, unknown> | null;
  const minimum = clampInt(rules?.serviceFeeMinimumMinor, 0, 10_000_000, FOOD_DEFAULT_SERVICE_FEE_MINIMUM_MINOR);
  const maximum = clampInt(rules?.serviceFeeMaximumMinor, minimum, 20_000_000, FOOD_DEFAULT_SERVICE_FEE_MAXIMUM_MINOR);
  const pickupArrivalDistanceMeters = clampInt(rules?.pickupArrivalDistanceMeters, 20, 1_000, FOOD_DEFAULT_PICKUP_ARRIVAL_DISTANCE_METERS);
  const pickupNearDistanceMeters = Math.max(
    pickupArrivalDistanceMeters,
    clampInt(rules?.pickupNearDistanceMeters, 50, 5_000, FOOD_DEFAULT_PICKUP_NEAR_DISTANCE_METERS),
  );
  return {
    serviceFeeBps: clampInt(rules?.serviceFeeBps, 0, 3_000, FOOD_DEFAULT_SERVICE_FEE_BPS),
    serviceFeeMinimumMinor: minimum,
    serviceFeeMaximumMinor: maximum,
    merchantCommissionBps: clampInt(rules?.merchantCommissionBps, 0, 4_000, FOOD_DEFAULT_MERCHANT_COMMISSION_BPS),
    goCommissionBps: clampInt(rules?.goCommissionBps, 0, 3_000, FOOD_DEFAULT_GO_COMMISSION_BPS),
    maxPickupDistanceMeters: clampInt(rules?.maxPickupDistanceMeters, 500, 30_000, FOOD_DEFAULT_MAX_PICKUP_DISTANCE_METERS),
    maxPickupEtaSeconds: clampInt(rules?.maxPickupEtaSeconds, 60, 3_600, FOOD_DEFAULT_MAX_PICKUP_ETA_SECONDS),
    pickupNearDistanceMeters,
    pickupArrivalDistanceMeters,
  };
}


async function activeFoodCommissionPolicy(scope: "GLOBAL" | "RESTAURANT", restaurantId?: string, at = new Date()) {
  return db.foodCommissionPolicy.findFirst({
    where: {
      region: env.REGION,
      scope,
      active: true,
      ...(scope === "RESTAURANT" ? { restaurantId } : { restaurantId: null }),
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
    },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
  });
}

export async function foodRulesForRestaurant(restaurantId: string): Promise<FoodRules> {
  const [base, restaurantPolicy, globalPolicy] = await Promise.all([
    currentFoodRules(),
    activeFoodCommissionPolicy("RESTAURANT", restaurantId),
    activeFoodCommissionPolicy("GLOBAL"),
  ]);
  const policy = restaurantPolicy ?? globalPolicy;
  return policy ? { ...base, merchantCommissionBps: clampInt(policy.merchantCommissionBps, 0, 4_000, base.merchantCommissionBps) } : base;
}

export async function foodCommissionForRestaurant(restaurantId: string) {
  const now = new Date();
  const [restaurantPolicy, globalPolicy, base] = await Promise.all([
    activeFoodCommissionPolicy("RESTAURANT", restaurantId, now),
    activeFoodCommissionPolicy("GLOBAL", undefined, now),
    currentFoodRules(),
  ]);
  const selected = restaurantPolicy ?? globalPolicy;
  return {
    merchantCommissionBps: selected?.merchantCommissionBps ?? base.merchantCommissionBps,
    source: restaurantPolicy ? "RESTAURANT" : globalPolicy ? "GLOBAL_POLICY" : "REGIONAL_DEFAULT",
    policyId: selected?.id ?? null,
    effectiveFrom: selected?.effectiveFrom?.toISOString() ?? null,
    effectiveTo: selected?.effectiveTo?.toISOString() ?? null,
    reason: selected?.reason ?? null,
  };
}

function serviceFeeForSubtotal(subtotalMinor: number, rules: FoodRules) {
  if (subtotalMinor <= 0 || rules.serviceFeeBps <= 0) return 0;
  const percentage = Math.round((subtotalMinor * rules.serviceFeeBps) / 10_000);
  return Math.max(rules.serviceFeeMinimumMinor, Math.min(rules.serviceFeeMaximumMinor, percentage));
}

function splitPromotionFunding(discountMinor: number, promotion: any) {
  if (!promotion || discountMinor <= 0) return { merchantFundedDiscountMinor: 0, bazaaraFundedDiscountMinor: 0 };
  const fundingSource = String(promotion.fundingSource ?? "MERCHANT").toUpperCase();
  const merchantFundingBps = fundingSource === "BAZAARA" ? 0 : fundingSource === "MERCHANT" ? 10_000 : clampInt(promotion.merchantFundingBps, 0, 10_000, 5_000);
  const merchantFundedDiscountMinor = Math.round((discountMinor * merchantFundingBps) / 10_000);
  return { merchantFundedDiscountMinor, bazaaraFundedDiscountMinor: Math.max(0, discountMinor - merchantFundedDiscountMinor) };
}

function calculateFoodEconomics(input: { subtotalMinor: number; deliveryFeeMinor: number; discountMinor: number; promotion?: any; rules: FoodRules }) {
  const serviceFeeMinor = serviceFeeForSubtotal(input.subtotalMinor, input.rules);
  const funding = splitPromotionFunding(input.discountMinor, input.promotion);
  const merchantCommissionBaseMinor = Math.max(0, input.subtotalMinor - funding.merchantFundedDiscountMinor);
  const merchantCommissionMinor = Math.round((merchantCommissionBaseMinor * input.rules.merchantCommissionBps) / 10_000);
  const merchantNetMinor = Math.max(0, input.subtotalMinor - funding.merchantFundedDiscountMinor - merchantCommissionMinor);
  const courierGrossMinor = Math.max(0, input.deliveryFeeMinor);
  const goCommissionMinor = Math.round((courierGrossMinor * input.rules.goCommissionBps) / 10_000);
  const courierNetMinor = Math.max(0, courierGrossMinor - goCommissionMinor);
  return { serviceFeeMinor, merchantCommissionMinor, merchantNetMinor, courierGrossMinor, goCommissionMinor, courierNetMinor, ...funding };
}

export function haversineMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (value: number) => value * Math.PI / 180;
  const r = 6_371_000; const dLat = toRad(b.latitude - a.latitude); const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude); const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.min(1, Math.sqrt(h))));
}

export function estimateFoodPickupEtaSeconds(distanceMeters: number) {
  return Math.max(60, Math.round(distanceMeters / 5.5) + 60);
}

export function classifyFoodPickupProximity(distanceMeters: number, rules: Pick<FoodRules, "pickupNearDistanceMeters" | "pickupArrivalDistanceMeters">) {
  const distance = Math.max(0, Math.round(distanceMeters));
  if (distance <= rules.pickupArrivalDistanceMeters) return "AT_PICKUP" as const;
  if (distance <= rules.pickupNearDistanceMeters) return "NEAR_PICKUP" as const;
  return null;
}

const restaurantInclude = {
  merchant: { include: { organization: true } },
  openingHours: { orderBy: { dayOfWeek: "asc" as const } },
} as const;

const cartInclude = {
  restaurant: { include: restaurantInclude },
  items: {
    orderBy: { createdAt: "asc" as const },
    include: { menuItem: true },
  },
} as const;

export type FoodCartOwner = { userId?: string; guestTokenHash?: string };

type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaMinor: number;
};

const dayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localDayAndMinute(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return { day: dayIndex[weekday] ?? 0, minute: hour * 60 + minute };
}

export function isRestaurantOpen(restaurant: any, date = new Date()) {
  const local = localDayAndMinute(restaurant.timezone || "Africa/Lagos", date);
  const hours = (restaurant.openingHours ?? []).find((entry: any) => entry.dayOfWeek === local.day);
  if (!hours || hours.closed) return false;
  if (hours.closeMinute > hours.openMinute) return local.minute >= hours.openMinute && local.minute < hours.closeMinute;
  // Overnight schedule such as 18:00-02:00.
  return local.minute >= hours.openMinute || local.minute < hours.closeMinute;
}

function serializeHours(hours: any[]) {
  return hours.map((entry) => ({
    dayOfWeek: entry.dayOfWeek,
    openMinute: entry.openMinute,
    closeMinute: entry.closeMinute,
    closed: entry.closed,
  }));
}

type FoodDiscoveryInput = { latitude?: number; longitude?: number };
const FOOD_DISCOVERY_MAX_DISTANCE_METERS = 25_000;


function foodDiscoveryPoint(input?: FoodDiscoveryInput): { latitude: number; longitude: number } | null {
  if (input?.latitude == null || input?.longitude == null) return null;
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function foodRestaurantPickupPoint(restaurant: any): { latitude: number; longitude: number } | null {
  if (restaurant.latitude == null || restaurant.longitude == null) return null;
  const latitude = Number(restaurant.latitude);
  const longitude = Number(restaurant.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function sortRestaurantSummaries<T extends { distanceMeters: number | null; isOpen: boolean; rating: number }>(items: T[]) {
  return items.sort((a, b) => {
    if (a.distanceMeters != null || b.distanceMeters != null) {
      if (a.distanceMeters == null) return 1;
      if (b.distanceMeters == null) return -1;
      if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters;
    }
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
    return b.rating - a.rating;
  });
}

export function restaurantSummary(
  restaurant: any,
  rules: FoodRules = DEFAULT_FOOD_RULES,
  customerLocation: { latitude: number; longitude: number } | null = null,
) {
  const pickupLocation = foodRestaurantPickupPoint(restaurant);
  const distanceMeters = customerLocation && pickupLocation ? haversineMeters(customerLocation, pickupLocation) : null;
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.merchant.organization.displayName,
    description: restaurant.description,
    heroImageUrl: restaurant.heroImageUrl,
    logoImageUrl: restaurant.logoImageUrl,
    cuisineTags: restaurant.cuisineTags,
    priceBand: restaurant.priceBand,
    rating: restaurant.rating,
    ratingCount: restaurant.ratingCount,
    isOpen: isRestaurantOpen(restaurant),
    etaMinutes: { min: restaurant.estimatedDeliveryMin, max: restaurant.estimatedDeliveryMax },
    deliveryFeeMinor: minor(restaurant.deliveryFeeMinor),
    serviceFeeMinor: 0,
    serviceFeePolicy: { rateBps: rules.serviceFeeBps, minimumMinor: rules.serviceFeeMinimumMinor, maximumMinor: rules.serviceFeeMaximumMinor },
    minimumOrderMinor: minor(restaurant.minOrderMinor),
    pickupEnabled: restaurant.pickupEnabled,
    deliveryEnabled: restaurant.deliveryEnabled,
    asapEnabled: restaurant.asapEnabled,
    scheduledEnabled: restaurant.scheduledEnabled,
    openingHours: serializeHours(restaurant.openingHours ?? []),
    acceptingOrders: restaurant.acceptingOrders ?? true,
    pausedUntil: restaurant.pauseUntil?.toISOString?.() ?? null,
    preorderEnabled: restaurant.preorderEnabled ?? true,
    capacity: { maxActiveOrders: restaurant.maxActiveOrders ?? 30, prepTimeBufferMin: restaurant.prepTimeBufferMin ?? 0 },
    pickupLocation,
    distanceMeters,
  };
}

export async function foodHome(input: FoodDiscoveryInput = {}) {
  const rules = await currentFoodRules();
  const customerLocation = foodDiscoveryPoint(input);
  const restaurants = await db.foodRestaurant.findMany({
    where: { status: "ACTIVE" },
    include: restaurantInclude,
    orderBy: [{ rating: "desc" }, { updatedAt: "desc" }],
    take: 24,
  });
  const cuisineCounts = new Map<string, number>();
  for (const restaurant of restaurants) {
    for (const cuisine of restaurant.cuisineTags) cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) ?? 0) + 1);
  }
  const featuredItems = await db.foodMenuItem.findMany({
    where: { active: true, soldOut: false, featured: true, restaurant: { status: "ACTIVE" } },
    include: { restaurant: { include: restaurantInclude } },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  const restaurantSummaries = sortRestaurantSummaries(
    restaurants
      .map((restaurant) => restaurantSummary(restaurant, rules, customerLocation))
      .filter((restaurant) => !customerLocation || (restaurant.distanceMeters != null && restaurant.distanceMeters <= FOOD_DISCOVERY_MAX_DISTANCE_METERS)),
  );

  const featured = featuredItems
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      priceMinor: minor(item.priceMinor),
      currency: item.currency,
      restaurant: restaurantSummary(item.restaurant, rules, customerLocation),
    }))
    .filter((item) => !customerLocation || (item.restaurant.distanceMeters != null && item.restaurant.distanceMeters <= FOOD_DISCOVERY_MAX_DISTANCE_METERS))
    .sort((a, b) => {
      const aDistance = a.restaurant.distanceMeters;
      const bDistance = b.restaurant.distanceMeters;
      if (aDistance == null && bDistance == null) return 0;
      if (aDistance == null) return 1;
      if (bDistance == null) return -1;
      return aDistance - bDistance;
    });

  return {
    cuisines: [...cuisineCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    restaurants: restaurantSummaries,
    featuredItems: featured,
  };
}

export async function searchFood(input: { q?: string; cuisine?: string; openNow?: boolean; fulfillment?: "DELIVERY" | "PICKUP"; latitude?: number; longitude?: number }) {
  const rules = await currentFoodRules();
  const customerLocation = foodDiscoveryPoint(input);
  const q = input.q?.trim();
  const restaurants = await db.foodRestaurant.findMany({
    where: {
      status: "ACTIVE",
      ...(input.cuisine ? { cuisineTags: { has: input.cuisine } } : {}),
      ...(input.fulfillment === "DELIVERY" ? { deliveryEnabled: true } : {}),
      ...(input.fulfillment === "PICKUP" ? { pickupEnabled: true } : {}),
      ...(q ? {
        OR: [
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { merchant: { organization: { displayName: { contains: q, mode: "insensitive" } } } },
          { menuItems: { some: { active: true, OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } } },
        ],
      } : {}),
    },
    include: restaurantInclude,
    orderBy: [{ rating: "desc" }],
    take: 48,
  });
  const filteredRestaurants = input.openNow ? restaurants.filter((restaurant) => isRestaurantOpen(restaurant)) : restaurants;
  const itemResults = q ? await db.foodMenuItem.findMany({
    where: {
      active: true,
      soldOut: false,
      restaurant: { status: "ACTIVE", ...(input.cuisine ? { cuisineTags: { has: input.cuisine } } : {}) },
      OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
    },
    include: { restaurant: { include: restaurantInclude } },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 32,
  }) : [];

  const restaurantSummaries = sortRestaurantSummaries(
    filteredRestaurants
      .map((restaurant) => restaurantSummary(restaurant, rules, customerLocation))
      .filter((restaurant) => !customerLocation || (restaurant.distanceMeters != null && restaurant.distanceMeters <= FOOD_DISCOVERY_MAX_DISTANCE_METERS)),
  );

  const items = itemResults
    .filter((item) => !input.openNow || isRestaurantOpen(item.restaurant))
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      priceMinor: minor(item.priceMinor),
      currency: item.currency,
      restaurant: restaurantSummary(item.restaurant, rules, customerLocation),
    }))
    .filter((item) => !customerLocation || (item.restaurant.distanceMeters != null && item.restaurant.distanceMeters <= FOOD_DISCOVERY_MAX_DISTANCE_METERS))
    .sort((a, b) => {
      const aDistance = a.restaurant.distanceMeters;
      const bDistance = b.restaurant.distanceMeters;
      if (aDistance == null && bDistance == null) return 0;
      if (aDistance == null) return 1;
      if (bDistance == null) return -1;
      return aDistance - bDistance;
    });

  return {
    restaurants: restaurantSummaries,
    items,
  };
}

function serializeMenuItem(item: any) {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    priceMinor: minor(item.priceMinor),
    currency: item.currency,
    available: item.active && !item.soldOut,
    featured: item.featured,
    dietaryTags: item.dietaryTags,
    prepMinutes: item.prepMinutes,
    modifierGroups: (item.modifierGroups ?? []).map((group: any) => ({
      id: group.id,
      name: group.name,
      required: group.required,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      options: (group.options ?? []).filter((option: any) => option.active).map((option: any) => ({
        id: option.id,
        name: option.name,
        priceDeltaMinor: minor(option.priceDeltaMinor),
      })),
    })),
  };
}

export async function getFoodRestaurant(slug: string) {
  const rules = await currentFoodRules();
  const restaurant = await db.foodRestaurant.findUnique({
    where: { slug },
    include: {
      ...restaurantInclude,
      menuSections: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { active: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
              modifierGroups: {
                orderBy: { sortOrder: "asc" },
                include: { options: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!restaurant || restaurant.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  return {
    restaurant: restaurantSummary(restaurant, rules),
    menu: restaurant.menuSections.map((section) => ({
      id: section.id,
      slug: section.slug,
      title: section.title,
      description: section.description,
      items: section.items.map(serializeMenuItem),
    })),
  };
}

function ownerWhere(owner: FoodCartOwner) {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestTokenHash) return { guestTokenHash: owner.guestTokenHash };
  throw new Error("Food cart owner is required");
}

async function findRestaurant(slug: string) {
  const restaurant = await db.foodRestaurant.findUnique({ where: { slug }, include: restaurantInclude });
  if (!restaurant || restaurant.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  return restaurant;
}

async function activeFoodCart(restaurantId: string, owner: FoodCartOwner) {
  return db.foodCart.findFirst({
    where: { restaurantId, status: "ACTIVE", ...ownerWhere(owner) },
    orderBy: { updatedAt: "desc" },
    include: cartInclude,
  });
}

async function ensureFoodCart(restaurant: any, owner: FoodCartOwner) {
  const existing = await activeFoodCart(restaurant.id, owner);
  if (existing) return existing;
  return db.foodCart.create({
    data: {
      restaurantId: restaurant.id,
      userId: owner.userId ?? null,
      guestTokenHash: owner.guestTokenHash ?? null,
      fulfillmentType: restaurant.deliveryEnabled ? "DELIVERY" : "PICKUP",
    },
    include: cartInclude,
  });
}

function selectedModifierArray(value: any): SelectedModifier[] {
  return Array.isArray(value) ? value.map((entry) => ({
    groupId: String(entry.groupId ?? ""),
    groupName: String(entry.groupName ?? ""),
    optionId: String(entry.optionId ?? ""),
    optionName: String(entry.optionName ?? ""),
    priceDeltaMinor: Number(entry.priceDeltaMinor ?? 0),
  })) : [];
}

function serializeFoodCart(cart: any, fallbackRestaurant?: any, rules: FoodRules = DEFAULT_FOOD_RULES) {
  const restaurant = cart?.restaurant ?? fallbackRestaurant;
  const items = (cart?.items ?? []).map((item: any) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.menuItem.name,
    imageUrl: item.menuItem.imageUrl,
    quantity: item.quantity,
    unitPriceMinor: minor(item.unitPriceMinor),
    lineTotalMinor: minor(item.unitPriceMinor) * item.quantity,
    selectedModifiers: selectedModifierArray(item.selectedModifiers),
    specialInstructions: item.specialInstructions,
  }));
  const subtotalMinor = items.reduce((sum: number, item: any) => sum + item.lineTotalMinor, 0);
  const fulfillmentType = cart?.fulfillmentType ?? (restaurant.deliveryEnabled ? "DELIVERY" : "PICKUP");
  const deliveryFeeMinor = fulfillmentType === "DELIVERY" ? minor(restaurant.deliveryFeeMinor) : 0;
  const serviceFeeMinor = items.length ? serviceFeeForSubtotal(subtotalMinor, rules) : 0;
  const minimumOrderMinor = minor(restaurant.minOrderMinor);
  const tipMinor = minor(cart?.tipMinor);
  const discountMinor = minor(cart?.discountMinor);
  return {
    id: cart?.id ?? null,
    restaurant: restaurantSummary(restaurant, rules),
    fulfillmentType,
    scheduledFor: cart?.scheduledFor?.toISOString?.() ?? null,
    cutleryRequired: cart?.cutleryRequired ?? false,
    contactless: cart?.contactless ?? false,
    deliveryAddress: cart?.deliveryAddress ?? null,
    note: cart?.note ?? null,
    tipMinor,
    promoCode: cart?.promoCode ?? null,
    discountMinor,
    isGift: cart?.isGift ?? false,
    recipientName: cart?.recipientName ?? null,
    recipientPhone: cart?.recipientPhone ?? null,
    giftMessage: cart?.giftMessage ?? null,
    groupOrderId: cart?.groupOrderId ?? null,
    items,
    itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    subtotalMinor,
    deliveryFeeMinor,
    serviceFeeMinor,
    serviceFeeRateBps: rules.serviceFeeBps,
    serviceFeeMinimumMinor: rules.serviceFeeMinimumMinor,
    serviceFeeMaximumMinor: rules.serviceFeeMaximumMinor,
    totalMinor: Math.max(0, subtotalMinor + deliveryFeeMinor + serviceFeeMinor + tipMinor - discountMinor),
    minimumOrderMinor,
    minimumOrderMet: subtotalMinor >= minimumOrderMinor,
  };
}

export async function getFoodCart(restaurantSlug: string, owner: FoodCartOwner) {
  const [restaurant, rules] = await Promise.all([findRestaurant(restaurantSlug), currentFoodRules()]);
  const cart = await activeFoodCart(restaurant.id, owner);
  return serializeFoodCart(cart, restaurant, rules);
}

async function resolveConfiguration(menuItemId: string, optionIds: string[], specialInstructions?: string) {
  const item = await db.foodMenuItem.findUnique({
    where: { id: menuItemId },
    include: { modifierGroups: { orderBy: { sortOrder: "asc" }, include: { options: { where: { active: true }, orderBy: { sortOrder: "asc" } } } } },
  });
  if (!item || !item.active || item.soldOut) throw new AppError("CONFLICT", "This menu item is currently unavailable", 409);

  const uniqueOptionIds = [...new Set(optionIds)];
  const allowed = new Map<string, any>();
  const selected: SelectedModifier[] = [];
  for (const group of item.modifierGroups) {
    for (const option of group.options) allowed.set(option.id, { group, option });
  }
  for (const optionId of uniqueOptionIds) {
    const match = allowed.get(optionId);
    if (!match) throw new AppError("BAD_REQUEST", "One or more selected modifiers are invalid", 400);
    selected.push({
      groupId: match.group.id,
      groupName: match.group.name,
      optionId: match.option.id,
      optionName: match.option.name,
      priceDeltaMinor: minor(match.option.priceDeltaMinor),
    });
  }
  for (const group of item.modifierGroups) {
    const count = selected.filter((entry) => entry.groupId === group.id).length;
    const minimum = group.required ? Math.max(1, group.minSelect) : group.minSelect;
    if (count < minimum) throw new AppError("BAD_REQUEST", `Choose at least ${minimum} option(s) for ${group.name}`, 400);
    if (count > group.maxSelect) throw new AppError("BAD_REQUEST", `Choose no more than ${group.maxSelect} option(s) for ${group.name}`, 400);
  }
  const modifierDelta = selected.reduce((sum, entry) => sum + entry.priceDeltaMinor, 0);
  const normalizedInstructions = specialInstructions?.trim().slice(0, 300) || "";
  const configurationKey = createHash("sha256")
    .update(JSON.stringify({ optionIds: uniqueOptionIds.sort(), specialInstructions: normalizedInstructions.toLowerCase() }))
    .digest("hex")
    .slice(0, 40);
  return { item, selected, configurationKey, unitPriceMinor: minor(item.priceMinor) + modifierDelta, specialInstructions: normalizedInstructions || null };
}

export async function addFoodCartItem(restaurantSlug: string, owner: FoodCartOwner, input: { menuItemId: string; quantity: number; optionIds: string[]; specialInstructions?: string }) {
  const restaurant = await findRestaurant(restaurantSlug);
  const configured = await resolveConfiguration(input.menuItemId, input.optionIds, input.specialInstructions);
  if (configured.item.restaurantId !== restaurant.id) throw new AppError("BAD_REQUEST", "Menu item does not belong to this restaurant", 400);
  const cart = await ensureFoodCart(restaurant, owner);
  const existing = await db.foodCartItem.findUnique({
    where: { cartId_menuItemId_configurationKey: { cartId: cart.id, menuItemId: input.menuItemId, configurationKey: configured.configurationKey } },
  });
  const quantity = existing ? existing.quantity + input.quantity : input.quantity;
  if (quantity > 99) throw new AppError("BAD_REQUEST", "Quantity is too large", 400);
  if (existing) {
    await db.foodCartItem.update({ where: { id: existing.id }, data: { quantity, unitPriceMinor: BigInt(configured.unitPriceMinor), selectedModifiers: configured.selected as any, specialInstructions: configured.specialInstructions } });
  } else {
    await db.foodCartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: input.menuItemId,
        configurationKey: configured.configurationKey,
        quantity: input.quantity,
        unitPriceMinor: BigInt(configured.unitPriceMinor),
        selectedModifiers: configured.selected as any,
        specialInstructions: configured.specialInstructions,
      },
    });
  }
  return getFoodCart(restaurantSlug, owner);
}

export async function updateFoodCartItem(restaurantSlug: string, owner: FoodCartOwner, itemId: string, quantity: number) {
  const restaurant = await findRestaurant(restaurantSlug);
  const cart = await activeFoodCart(restaurant.id, owner);
  if (!cart) throw new AppError("NOT_FOUND", "Food cart not found", 404);
  const item = await db.foodCartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new AppError("NOT_FOUND", "Cart item not found", 404);
  if (quantity <= 0) await db.foodCartItem.delete({ where: { id: item.id } });
  else await db.foodCartItem.update({ where: { id: item.id }, data: { quantity } });
  return getFoodCart(restaurantSlug, owner);
}

export async function removeFoodCartItem(restaurantSlug: string, owner: FoodCartOwner, itemId: string) {
  return updateFoodCartItem(restaurantSlug, owner, itemId, 0);
}

export async function updateFoodCartPreferences(restaurantSlug: string, owner: FoodCartOwner, input: {
  fulfillmentType?: "DELIVERY" | "PICKUP";
  scheduledFor?: Date | null;
  cutleryRequired?: boolean;
  contactless?: boolean;
  deliveryAddress?: unknown | null;
  note?: string | null;
  tipMinor?: number;
  promoCode?: string | null;
  isGift?: boolean;
  recipientName?: string | null;
  recipientPhone?: string | null;
  giftMessage?: string | null;
}) {
  const restaurant = await findRestaurant(restaurantSlug);
  const cart = await ensureFoodCart(restaurant, owner);
  if (input.fulfillmentType === "DELIVERY" && !restaurant.deliveryEnabled) throw new AppError("CONFLICT", "Delivery is not available for this restaurant", 409);
  if (input.fulfillmentType === "PICKUP" && !restaurant.pickupEnabled) throw new AppError("CONFLICT", "Pickup is not available for this restaurant", 409);
  if (input.scheduledFor) {
    if (!restaurant.scheduledEnabled) throw new AppError("CONFLICT", "Scheduled orders are not available for this restaurant", 409);
    const min = Date.now() + 30 * 60 * 1000;
    const max = Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (input.scheduledFor.getTime() < min || input.scheduledFor.getTime() > max) throw new AppError("BAD_REQUEST", "Choose a scheduled time between 30 minutes and 7 days from now", 400);
  }
  await db.foodCart.update({
    where: { id: cart.id },
    data: {
      ...(input.fulfillmentType ? { fulfillmentType: input.fulfillmentType } : {}),
      ...(input.scheduledFor !== undefined ? { scheduledFor: input.scheduledFor } : {}),
      ...(input.cutleryRequired !== undefined ? { cutleryRequired: input.cutleryRequired } : {}),
      ...(input.contactless !== undefined ? { contactless: input.contactless } : {}),
      ...(input.deliveryAddress !== undefined ? { deliveryAddress: input.deliveryAddress as any } : {}),
      ...(input.note !== undefined ? { note: input.note?.trim().slice(0, 500) || null } : {}),
      ...(input.tipMinor !== undefined ? { tipMinor: BigInt(Math.max(0, input.tipMinor)) } : {}),
      ...(input.promoCode !== undefined ? { promoCode: input.promoCode?.trim().toUpperCase().slice(0, 40) || null } : {}),
      ...(input.isGift !== undefined ? { isGift: input.isGift } : {}),
      ...(input.recipientName !== undefined ? { recipientName: input.recipientName?.trim().slice(0, 120) || null } : {}),
      ...(input.recipientPhone !== undefined ? { recipientPhone: input.recipientPhone?.trim().slice(0, 40) || null } : {}),
      ...(input.giftMessage !== undefined ? { giftMessage: input.giftMessage?.trim().slice(0, 300) || null } : {}),
    },
  });
  await applyFoodPromotionToCart(cart.id);
  return getFoodCart(restaurantSlug, owner);
}

export async function claimGuestFoodCarts(userId: string, guestTokenHash: string) {
  const guestCarts = await db.foodCart.findMany({
    where: { guestTokenHash, status: "ACTIVE" },
    include: { items: true },
    orderBy: { updatedAt: "asc" },
  });
  for (const guest of guestCarts) {
    const userCart = await db.foodCart.findFirst({ where: { userId, restaurantId: guest.restaurantId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, include: { items: true } });
    if (!userCart) {
      await db.foodCart.update({ where: { id: guest.id }, data: { userId, guestTokenHash: null } });
      continue;
    }
    await db.$transaction(async (tx) => {
      for (const guestItem of guest.items) {
        const existing = userCart.items.find((item) => item.menuItemId === guestItem.menuItemId && item.configurationKey === guestItem.configurationKey);
        if (existing) {
          await tx.foodCartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(99, existing.quantity + guestItem.quantity) } });
        } else {
          await tx.foodCartItem.update({ where: { id: guestItem.id }, data: { cartId: userCart.id } });
        }
      }
      await tx.foodCart.update({ where: { id: guest.id }, data: { status: "ABANDONED", guestTokenHash: null } });
    });
  }
}

function foodOrderNumber() {
  return `BZFD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function foodPinHash(orderId: string, pin: string) {
  return createHash("sha256").update(`${orderId}:${pin}`).digest("hex");
}

function currentPromotionDiscount(promotion: any, subtotalMinor: number) {
  if (!promotion || subtotalMinor < minor(promotion.minSubtotalMinor)) return 0;
  let discount = promotion.discountType === "FIXED" ? promotion.value : Math.floor(subtotalMinor * Math.max(0, Math.min(100, promotion.value)) / 100);
  if (promotion.maxDiscountMinor != null) discount = Math.min(discount, minor(promotion.maxDiscountMinor));
  return Math.max(0, Math.min(subtotalMinor, discount));
}

async function applyFoodPromotionToCart(cartId: string) {
  const cart = await db.foodCart.findUnique({ where: { id: cartId }, include: { items: true } });
  if (!cart) return;
  const subtotal = cart.items.reduce((sum, item) => sum + minor(item.unitPriceMinor) * item.quantity, 0);
  let discount = 0;
  if (cart.promoCode) {
    const now = new Date();
    const promotion = await db.foodPromotion.findFirst({ where: { restaurantId: cart.restaurantId, code: cart.promoCode, active: true, startsAt: { lte: now }, endsAt: { gt: now } } });
    discount = currentPromotionDiscount(promotion, subtotal);
  }
  await db.foodCart.update({ where: { id: cart.id }, data: { discountMinor: BigInt(discount), ...(cart.promoCode && discount === 0 ? { promoCode: null } : {}) } });
}

function targetLocalAvailability(item: any, restaurant: any, target: Date) {
  const windows = item.availabilityWindows ?? [];
  if (!windows.length) return { available: true, kind: "REGULAR" };
  const local = localDayAndMinute(restaurant.timezone || "Africa/Lagos", target);
  const match = windows.find((w: any) => w.active && w.dayOfWeek === local.day && (w.endMinute > w.startMinute ? local.minute >= w.startMinute && local.minute < w.endMinute : local.minute >= w.startMinute || local.minute < w.endMinute));
  if (!match) return { available: false, kind: null };
  if (match.kind === "PREORDER") {
    const lead = target.getTime() - Date.now();
    if (lead < match.minLeadMinutes * 60_000 || lead > match.maxAdvanceDays * 86_400_000) return { available: false, kind: "PREORDER" };
  }
  return { available: true, kind: match.kind };
}

async function ensureFoodRestaurantCapacity(restaurant: any) {
  if (!restaurant.acceptingOrders) throw new AppError("CONFLICT", "This restaurant has paused new orders", 409);
  if (restaurant.pauseUntil && restaurant.pauseUntil > new Date()) throw new AppError("CONFLICT", `This restaurant is paused until ${restaurant.pauseUntil.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}`, 409);
  const active = await db.foodOrder.count({ where: { restaurantId: restaurant.id, status: { in: ["PLACED", "ACCEPTED", "PREPARING", "READY"] } } });
  if (active >= (restaurant.maxActiveOrders ?? 30)) throw new AppError("CONFLICT", "This restaurant is at order capacity. Try a scheduled time or another restaurant", 409);
}

export async function placeFoodOrder(userId: string, restaurantSlug: string, input: { paymentMethod: FoodPaymentMethod; walletPin?: string }) {
  const restaurant = await findRestaurant(restaurantSlug);
  const rules = await foodRulesForRestaurant(restaurant.id);
  await ensureFoodRestaurantCapacity(restaurant);
  const hostCart = await activeFoodCart(restaurant.id, { userId });
  if (!hostCart || hostCart.items.length === 0) throw new AppError("CONFLICT", "Your restaurant cart is empty", 409);

  let carts = [hostCart];
  let group: any = null;
  if (hostCart.groupOrderId) {
    group = await db.foodGroupOrder.findFirst({
      where: { id: hostCart.groupOrderId, restaurantId: restaurant.id, status: "OPEN" },
      include: { members: true },
    });
    if (!group) throw new AppError("CONFLICT", "This group order is no longer active", 409);
    if (group.hostUserId !== userId) throw new AppError("FORBIDDEN", "Only the group host can place the combined order", 403);
    carts = await db.foodCart.findMany({
      where: { groupOrderId: group.id, restaurantId: restaurant.id, status: "ACTIVE" },
      include: cartInclude,
      orderBy: { createdAt: "asc" },
    });
    if (!carts.some((cart) => cart.id === hostCart.id)) carts.unshift(hostCart);

    // BAZAARA_FOOD_SOLO_GROUP_COLLAPSE_V1
    // If the host is the only active participant and there are no other
    // non-empty participant carts, this is effectively a personal checkout.
    // Collapse the stale/accidental group so a forgotten host cap cannot block
    // an ordinary order. Real multi-person groups still keep all group rules.
    const hasOtherActiveMember = group.members.some(
      (member: any) =>
        member.status === "ACTIVE" &&
        member.userId != null &&
        member.userId !== userId,
    );
    const hasOtherNonEmptyCart = carts.some(
      (cart: any) =>
        cart.id !== hostCart.id &&
        Array.isArray(cart.items) &&
        cart.items.length > 0,
    );

    if (!hasOtherActiveMember && !hasOtherNonEmptyCart) {
      await db.$transaction([
        db.foodCart.update({
          where: { id: hostCart.id },
          data: { groupOrderId: null },
        }),
        db.foodGroupOrderMember.updateMany({
          where: { groupOrderId: group.id, status: "ACTIVE" },
          data: { status: "LEFT" },
        }),
        db.foodGroupOrder.update({
          where: { id: group.id },
          data: { status: "CANCELLED" },
        }),
      ]);

      group = null;
      carts = [{ ...hostCart, groupOrderId: null }];
    }
  }

  const allItems = carts.flatMap((cart) => cart.items);
  if (!allItems.length) throw new AppError("CONFLICT", "The group order has no items", 409);
  const subtotalMinor = allItems.reduce((sum, item) => sum + minor(item.unitPriceMinor) * item.quantity, 0);
  const deliveryFeeMinor = hostCart.fulfillmentType === "DELIVERY" ? minor(restaurant.deliveryFeeMinor) : 0;
  const tipMinor = minor(hostCart.tipMinor);

  let discountMinor = 0;
  let appliedPromoCode: string | null = null;
  let appliedPromotion: any = null;
  if (hostCart.promoCode) {
    const now = new Date();
    const promotion = await db.foodPromotion.findFirst({ where: { restaurantId: restaurant.id, code: hostCart.promoCode, active: true, startsAt: { lte: now }, endsAt: { gt: now } } });
    discountMinor = currentPromotionDiscount(promotion, subtotalMinor);
    appliedPromoCode = discountMinor > 0 ? hostCart.promoCode : null;
    appliedPromotion = discountMinor > 0 ? promotion : null;
  }
  const economics = calculateFoodEconomics({ subtotalMinor, deliveryFeeMinor, discountMinor, promotion: appliedPromotion, rules });
  const serviceFeeMinor = economics.serviceFeeMinor;
  const totalMinor = Math.max(0, subtotalMinor + deliveryFeeMinor + serviceFeeMinor + tipMinor - discountMinor);

  if (subtotalMinor < minor(restaurant.minOrderMinor)) throw new AppError("CONFLICT", "The restaurant minimum order has not been reached", 409);
  if (group?.spendingLimitMinor != null && BigInt(totalMinor) > group.spendingLimitMinor) throw new AppError("CONFLICT", "This group order exceeds the host spending limit. Remove items, raise the group limit, or continue as a personal order.", 409);
  if (hostCart.fulfillmentType === "DELIVERY" && !hostCart.deliveryAddress) throw new AppError("BAD_REQUEST", "A delivery address is required", 400);
  if (hostCart.isGift && (!hostCart.recipientName || !hostCart.recipientPhone)) throw new AppError("BAD_REQUEST", "Recipient name and phone are required for a gift order", 400);

  const target = hostCart.scheduledFor ?? new Date();
  if (hostCart.scheduledFor) {
    if (hostCart.scheduledFor.getTime() < Date.now() + 10 * 60 * 1000) throw new AppError("CONFLICT", "The selected scheduled time is no longer available", 409);
    if (!restaurant.scheduledEnabled) throw new AppError("CONFLICT", "Scheduled orders are not available for this restaurant", 409);
  } else if (!restaurant.asapEnabled || !isRestaurantOpen(restaurant)) {
    throw new AppError("CONFLICT", "This restaurant is currently closed for ASAP orders. Choose a scheduled time instead.", 409);
  }

  const freshItems = await db.foodMenuItem.findMany({ where: { id: { in: [...new Set(allItems.map((item) => item.menuItemId))] } }, include: { availabilityWindows: { where: { active: true } } } });
  const freshById = new Map(freshItems.map((item) => [item.id, item]));
  if (allItems.some((cartItem) => {
    const item = freshById.get(cartItem.menuItemId);
    return !item || !item.active || item.soldOut || !targetLocalAvailability(item, restaurant, target).available;
  })) throw new AppError("CONFLICT", "One or more items are unavailable for the selected order time. Review the group basket and try again.", 409);

  if (group) {
    const allocated = group.members.reduce((sum: bigint, member: any) => sum + (member.allocationMinor ?? 0n), 0n);
    if (allocated > BigInt(totalMinor)) throw new AppError("CONFLICT", "Group payment allocations exceed the current order total", 409);
  }

  if (input.paymentMethod === "BAZAARA_PAY") {
    await verifyPayPin(userId, input.walletPin);
  }

  const deliveryPin = hostCart.fulfillmentType === "DELIVERY" ? String(randomInt(1000, 10000)) : null;
  const orderId = randomBytes(12).toString("hex");
  const order = await db.$transaction(async (tx) => {
    const created = await tx.foodOrder.create({
      data: {
        id: orderId,
        orderNumber: foodOrderNumber(), userId, restaurantId: restaurant.id, status: "PLACED", fulfillmentType: hostCart.fulfillmentType,
        scheduledFor: hostCart.scheduledFor, cutleryRequired: hostCart.cutleryRequired, contactless: hostCart.contactless,
        deliveryAddress: hostCart.deliveryAddress as any, note: hostCart.note,
        currency: "NGN", subtotalMinor: BigInt(subtotalMinor), deliveryFeeMinor: BigInt(deliveryFeeMinor), serviceFeeMinor: BigInt(serviceFeeMinor),
        tipMinor: BigInt(tipMinor), discountMinor: BigInt(discountMinor), promoCode: appliedPromoCode,
        totalMinor: BigInt(totalMinor), paymentMethod: input.paymentMethod, paymentStatus: "PENDING",
        isGift: hostCart.isGift, recipientName: hostCart.recipientName, recipientPhone: hostCart.recipientPhone, giftMessage: hostCart.giftMessage,
        groupOrderId: group?.id ?? null, deliveryPinHash: deliveryPin ? foodPinHash(orderId, deliveryPin) : null,
        items: { create: allItems.map((item) => ({ menuItemId: item.menuItemId, itemName: item.menuItem.name, quantity: item.quantity, unitPriceMinor: item.unitPriceMinor, lineTotalMinor: BigInt(minor(item.unitPriceMinor) * item.quantity), selectedModifiers: item.selectedModifiers as any, specialInstructions: item.specialInstructions })) },
        economics: { create: {
          serviceFeeBps: rules.serviceFeeBps, serviceFeeMinimumMinor: BigInt(rules.serviceFeeMinimumMinor), serviceFeeMaximumMinor: BigInt(rules.serviceFeeMaximumMinor),
          merchantCommissionBps: rules.merchantCommissionBps, merchantCommissionMinor: BigInt(economics.merchantCommissionMinor),
          merchantFundedDiscountMinor: BigInt(economics.merchantFundedDiscountMinor), bazaaraFundedDiscountMinor: BigInt(economics.bazaaraFundedDiscountMinor), merchantNetMinor: BigInt(economics.merchantNetMinor),
          courierGrossMinor: BigInt(economics.courierGrossMinor), goCommissionBps: rules.goCommissionBps, goCommissionMinor: BigInt(economics.goCommissionMinor), courierNetMinor: BigInt(economics.courierNetMinor),
        } },
        trackingEvents: { create: { status: "PLACED", message: group ? "Group order received by Food" : "Order received by Food" } },
      },
      include: foodOrderInclude,
    });
    const paymentResult = await settleFoodPaymentTx(tx, {
      userId,
      orderId: created.id,
      paymentMethod: input.paymentMethod,
      amountMinor: BigInt(totalMinor),
      currency: created.currency,
    });
    const paidCreated = paymentResult.paymentStatus === "PAID"
      ? await tx.foodOrder.update({
          where: { id: created.id },
          data: { paymentStatus: "PAID" },
          include: foodOrderInclude,
        })
      : created;
    if (paymentResult.paymentStatus === "PAID") {
      await queueBusinessFoodOrderReceivedTx(tx, created.id);
    }
    await tx.foodCart.updateMany({ where: { id: { in: carts.map((cart) => cart.id) } }, data: { status: "CONVERTED" } });
    if (group) await tx.foodGroupOrder.update({ where: { id: group.id }, data: { status: "ORDERED" } });
    return paidCreated;
  });
  return { ...serializeFoodOrder(order), deliveryPin };
}

const foodOrderInclude = {
  restaurant: { include: restaurantInclude },
  items: true,
  trackingEvents: { orderBy: { createdAt: "asc" as const } },
  messages: { orderBy: { createdAt: "asc" as const } },
  review: true,
  supportIssues: { orderBy: { createdAt: "desc" as const } },
  economics: true,
} as const;

function secondsBetween(start: Date | null | undefined, end: Date | null | undefined) {
  if (!start || !end) return null;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

export function foodOrderTiming(order: any, now = new Date()) {
  const startedAt: Date = order.placedAt;
  const terminalAt: Date = order.deliveredAt ?? order.cancelledAt ?? now;
  const elapsedSeconds = Math.max(0, Math.floor((terminalAt.getTime() - startedAt.getTime()) / 1000));
  return {
    startedAt: startedAt.toISOString(),
    completedAt: order.deliveredAt?.toISOString?.() ?? null,
    cancelledAt: order.cancelledAt?.toISOString?.() ?? null,
    elapsedSeconds,
    elapsedMinutes: Math.floor(elapsedSeconds / 60),
    estimatedDeliveryMin: Number(order.restaurant?.estimatedDeliveryMin ?? 0),
    estimatedDeliveryMax: Number(order.restaurant?.estimatedDeliveryMax ?? 0),
    phases: {
      orderToCourierAssignedSeconds: secondsBetween(order.placedAt, order.courierAssignedAt),
      courierAssignedToPickupSeconds: secondsBetween(order.courierAssignedAt, order.pickedUpAt),
      pickupToDeliverySeconds: secondsBetween(order.pickedUpAt, order.deliveredAt),
    },
  };
}

function serializeFoodOrder(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentType: order.fulfillmentType,
    scheduledFor: order.scheduledFor?.toISOString?.() ?? null,
    cutleryRequired: order.cutleryRequired,
    contactless: order.contactless,
    deliveryAddress: order.deliveryAddress,
    note: order.note,
    tipMinor: minor(order.tipMinor),
    discountMinor: minor(order.discountMinor),
    promoCode: order.promoCode,
    isGift: order.isGift,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    giftMessage: order.giftMessage,
    groupOrderId: order.groupOrderId,
    deliveryPinVerified: Boolean(order.deliveryPinVerifiedAt),
    courierUserId: order.courierUserId,
    courierAssignedAt: order.courierAssignedAt?.toISOString?.() ?? null,
    pickedUpAt: order.pickedUpAt?.toISOString?.() ?? null,
    pickupLocation:
      order.restaurant.latitude == null || order.restaurant.longitude == null
        ? null
        : {
            latitude: Number(order.restaurant.latitude),
            longitude: Number(order.restaurant.longitude),
          },
    dropoffLocation: foodAddressPoint(order.deliveryAddress),
    economics: order.economics ? {
      serviceFeeBps: order.economics.serviceFeeBps,
      serviceFeeMinimumMinor: minor(order.economics.serviceFeeMinimumMinor),
      serviceFeeMaximumMinor: minor(order.economics.serviceFeeMaximumMinor),
      merchantCommissionBps: order.economics.merchantCommissionBps,
      merchantCommissionMinor: minor(order.economics.merchantCommissionMinor),
      merchantFundedDiscountMinor: minor(order.economics.merchantFundedDiscountMinor),
      bazaaraFundedDiscountMinor: minor(order.economics.bazaaraFundedDiscountMinor),
      merchantNetMinor: minor(order.economics.merchantNetMinor),
      courierGrossMinor: minor(order.economics.courierGrossMinor),
      goCommissionBps: order.economics.goCommissionBps,
      goCommissionMinor: minor(order.economics.goCommissionMinor),
      courierNetMinor: minor(order.economics.courierNetMinor),
      courierPayoutMinor: minor(order.economics.courierNetMinor) + minor(order.tipMinor),
    } : null,
    currency: order.currency,
    subtotalMinor: minor(order.subtotalMinor),
    deliveryFeeMinor: minor(order.deliveryFeeMinor),
    serviceFeeMinor: minor(order.serviceFeeMinor),
    totalMinor: minor(order.totalMinor),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    placedAt: order.placedAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString?.() ?? null,
    cancelledAt: order.cancelledAt?.toISOString?.() ?? null,
    timing: foodOrderTiming(order),
    restaurant: restaurantSummary(order.restaurant),
    tracking: (order.trackingEvents ?? []).map((event: any) => ({ id: event.id, status: event.status, latitude: event.latitude == null ? null : Number(event.latitude), longitude: event.longitude == null ? null : Number(event.longitude), message: event.message, createdAt: event.createdAt.toISOString?.() ?? event.createdAt })),
    messages: order.messages ?? [],
    review: order.review ?? null,
    supportIssues: (order.supportIssues ?? []).map((issue: any) => ({ ...issue, requestedRefundMinor: issue.requestedRefundMinor == null ? null : minor(issue.requestedRefundMinor), approvedRefundMinor: issue.approvedRefundMinor == null ? null : minor(issue.approvedRefundMinor) })),
    items: (order.items ?? []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.itemName,
      quantity: item.quantity,
      unitPriceMinor: minor(item.unitPriceMinor),
      lineTotalMinor: minor(item.lineTotalMinor),
      selectedModifiers: selectedModifierArray(item.selectedModifiers),
      specialInstructions: item.specialInstructions,
    })),
  };
}

export async function listFoodOrders(userId: string) {
  const orders = await db.foodOrder.findMany({
    where: { userId },
    include: foodOrderInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { orders: orders.map(serializeFoodOrder) };
}

export async function getFoodOrder(userId: string, orderId: string) {
  const order = await db.foodOrder.findFirst({
    where: { id: orderId, userId },
    include: foodOrderInclude,
  });
  if (!order) throw new AppError("NOT_FOUND", "Food order not found", 404);
  return { ...serializeFoodOrder(order), courier: await foodCourierContact(order.courierUserId) };
}

export async function reissueFoodDeliveryPin(userId: string, orderId: string) {
  const order = await db.foodOrder.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      status: true,
      fulfillmentType: true,
      deliveryPinVerifiedAt: true,
    },
  });
  if (!order) throw new AppError("NOT_FOUND", "Food order not found", 404);
  if (order.fulfillmentType !== "DELIVERY") throw new AppError("BAD_REQUEST", "Delivery PIN is only available for delivery orders", 400);
  if (["DELIVERED", "CANCELLED"].includes(order.status)) throw new AppError("CONFLICT", "This order no longer needs a delivery PIN", 409);
  if (order.deliveryPinVerifiedAt) throw new AppError("CONFLICT", "The delivery PIN has already been verified", 409);

  const deliveryPin = String(randomInt(1000, 10000));
  await db.foodOrder.update({
    where: { id: order.id },
    data: {
      deliveryPinHash: foodPinHash(order.id, deliveryPin),
      deliveryPinVerifiedAt: null,
    },
  });
  return { deliveryPin };
}


export async function cancelFoodOrder(userId: string, orderId: string) {
  const order = await db.foodOrder.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new AppError("NOT_FOUND", "Food order not found", 404);
  if (!["PLACED", "ACCEPTED"].includes(order.status)) throw new AppError("CONFLICT", "This order can no longer be cancelled", 409);
  await db.foodOrder.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  return getFoodOrder(userId, orderId);
}


function foodShareToken() { return randomBytes(18).toString("base64url"); }

export async function listFoodFavorites(userId: string) {
  const [restaurants, items] = await Promise.all([
    db.foodRestaurantFavorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { restaurant: { include: restaurantInclude } } }),
    db.foodMenuItemFavorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { menuItem: { include: { restaurant: { include: restaurantInclude } } } } }),
  ]);
  return { restaurants: restaurants.map((x) => restaurantSummary(x.restaurant)), items: items.map((x) => ({ ...serializeMenuItem(x.menuItem), restaurant: restaurantSummary(x.menuItem.restaurant) })) };
}

export async function setFoodRestaurantFavorite(userId: string, slug: string, saved: boolean) {
  const restaurant = await findRestaurant(slug);
  if (saved) await db.foodRestaurantFavorite.upsert({ where: { userId_restaurantId: { userId, restaurantId: restaurant.id } }, create: { userId, restaurantId: restaurant.id }, update: {} });
  else await db.foodRestaurantFavorite.deleteMany({ where: { userId, restaurantId: restaurant.id } });
  return { saved };
}

export async function setFoodMenuItemFavorite(userId: string, itemId: string, saved: boolean) {
  const item = await db.foodMenuItem.findFirst({ where: { id: itemId, active: true, restaurant: { status: "ACTIVE" } } });
  if (!item) throw new AppError("NOT_FOUND", "Dish not found", 404);
  if (saved) await db.foodMenuItemFavorite.upsert({ where: { userId_menuItemId: { userId, menuItemId: item.id } }, create: { userId, menuItemId: item.id }, update: {} });
  else await db.foodMenuItemFavorite.deleteMany({ where: { userId, menuItemId: item.id } });
  return { saved };
}

export async function foodDeals() {
  const rules = await currentFoodRules();
  const now = new Date();
  const promotions = await db.foodPromotion.findMany({ where: { active: true, startsAt: { lte: now }, endsAt: { gt: now }, restaurant: { status: "ACTIVE" } }, orderBy: { startsAt: "desc" }, include: { restaurant: { include: restaurantInclude } }, take: 50 });
  return { deals: promotions.map((p) => ({ id: p.id, code: p.code, title: p.title, description: p.description, discountType: p.discountType, value: p.value, minSubtotalMinor: minor(p.minSubtotalMinor), maxDiscountMinor: p.maxDiscountMinor == null ? null : minor(p.maxDiscountMinor), fundingSource:p.fundingSource, merchantFundingBps:p.merchantFundingBps, endsAt: p.endsAt, restaurant: restaurantSummary(p.restaurant, rules) })) };
}

export async function foodRecommendations(userId: string) {
  const rules = await currentFoodRules();
  const recent = await db.foodOrder.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { restaurantId: true, items: { select: { menuItemId: true } } }, take: 20 });
  const restaurantIds = [...new Set(recent.map((o) => o.restaurantId))];
  const restaurants = await db.foodRestaurant.findMany({ where: { status: "ACTIVE", ...(restaurantIds.length ? { id: { in: restaurantIds } } : {}) }, include: restaurantInclude, orderBy: { rating: "desc" }, take: 12 });
  const reorder = await db.foodOrder.findMany({ where: { userId }, include: { restaurant: { include: restaurantInclude }, items: true }, orderBy: { createdAt: "desc" }, take: 8 });
  return { restaurants: restaurants.map((restaurant) => restaurantSummary(restaurant, rules)), reorder: reorder.map(serializeFoodOrder) };
}

export async function reorderFoodOrder(userId: string, orderId: string) {
  const order = await db.foodOrder.findFirst({ where: { id: orderId, userId }, include: { restaurant: { include: restaurantInclude }, items: true } });
  if (!order) throw new AppError("NOT_FOUND", "Food order not found", 404);
  const owner = { userId };
  const restaurant = order.restaurant;
  let cart = await ensureFoodCart(restaurant, owner);
  await db.foodCartItem.deleteMany({ where: { cartId: cart.id } });
  for (const old of order.items) {
    const item = await db.foodMenuItem.findFirst({ where: { id: old.menuItemId, active: true, soldOut: false } });
    if (!item) continue;
    const selected = selectedModifierArray(old.selectedModifiers);
    const config = await resolveConfiguration(item.id, selected.map((x) => x.optionId), old.specialInstructions ?? undefined).catch(() => null);
    if (!config) continue;
    await db.foodCartItem.create({ data: { cartId: cart.id, menuItemId: item.id, configurationKey: config.configurationKey, quantity: old.quantity, unitPriceMinor: BigInt(config.unitPriceMinor), selectedModifiers: config.selected as any, specialInstructions: config.specialInstructions } });
  }
  return { cart: await getFoodCart(restaurant.slug, owner) };
}

export async function createFoodGroupOrder(userId: string, restaurantSlug: string, spendingLimitMinor?: number | null) {
  const restaurant = await findRestaurant(restaurantSlug);
  const group = await db.foodGroupOrder.create({ data: { restaurantId: restaurant.id, hostUserId: userId, shareToken: foodShareToken(), spendingLimitMinor: spendingLimitMinor == null ? null : BigInt(spendingLimitMinor), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), members: { create: { userId, displayName: "Host", status: "ACTIVE" } } }, include: { members: true } });
  const cart = await ensureFoodCart(restaurant, { userId });
  await db.foodCart.update({ where: { id: cart.id }, data: { groupOrderId: group.id } });
  return serializeFoodGroup(group);
}
function serializeFoodGroup(group: any) { return { id: group.id, shareToken: group.shareToken, status: group.status, spendingLimitMinor: group.spendingLimitMinor == null ? null : minor(group.spendingLimitMinor), expiresAt: group.expiresAt, members: (group.members ?? []).map((m: any) => ({ ...m, allocationMinor: m.allocationMinor == null ? null : minor(m.allocationMinor) })), settlement: "ALLOCATIONS_ONLY", settlementNote: "Member allocations coordinate the order; real multi-party settlement requires a configured payment provider." }; }
export async function joinFoodGroupOrder(userId: string, token: string, displayName: string) {
  const group = await db.foodGroupOrder.findUnique({ where: { shareToken: token }, include: { members: true, restaurant: { include: restaurantInclude } } });
  if (!group || group.status !== "OPEN" || group.expiresAt <= new Date()) throw new AppError("NOT_FOUND", "This group-order link is no longer active", 404);
  await db.foodGroupOrderMember.upsert({ where: { groupOrderId_userId: { groupOrderId: group.id, userId } }, create: { groupOrderId: group.id, userId, displayName: displayName.trim().slice(0, 80) }, update: { displayName: displayName.trim().slice(0, 80), status: "ACTIVE" } });
  const cart = await ensureFoodCart(group.restaurant, { userId }); await db.foodCart.update({ where: { id: cart.id }, data: { groupOrderId: group.id } });
  return serializeFoodGroup(await db.foodGroupOrder.findUniqueOrThrow({ where: { id: group.id }, include: { members: true } }));
}
export async function updateFoodGroupAllocations(userId: string, groupId: string, allocations: Array<{memberId:string;amountMinor:number|null}>) {
  const group = await db.foodGroupOrder.findFirst({ where: { id: groupId, hostUserId: userId, status: "OPEN" }, include: { members: true } }); if (!group) throw new AppError("NOT_FOUND", "Group order not found", 404);
  const ids = new Set(group.members.map((m) => m.id)); for (const a of allocations) if (!ids.has(a.memberId)) throw new AppError("BAD_REQUEST", "Allocation references a non-member", 400);
  await db.$transaction(allocations.map((a) => db.foodGroupOrderMember.update({ where: { id: a.memberId }, data: { allocationMinor: a.amountMinor == null ? null : BigInt(a.amountMinor), contributionStatus: a.amountMinor == null ? "UNALLOCATED" : "ALLOCATED" } }))); return serializeFoodGroup(await db.foodGroupOrder.findUniqueOrThrow({ where: { id: group.id }, include: { members: true } }));
}

export async function convertFoodGroupToPersonalOrder(userId: string, restaurantSlug: string) {
  const restaurant = await findRestaurant(restaurantSlug);
  const cart = await activeFoodCart(restaurant.id, { userId });

  if (!cart || !cart.groupOrderId) {
    return { cart: await getFoodCart(restaurantSlug, { userId }), groupEnded: false };
  }

  const group = await db.foodGroupOrder.findUnique({
    where: { id: cart.groupOrderId },
    include: { members: true },
  });

  if (!group || group.status !== "OPEN") {
    await db.foodCart.update({
      where: { id: cart.id },
      data: { groupOrderId: null },
    });
    return { cart: await getFoodCart(restaurantSlug, { userId }), groupEnded: false };
  }

  const isHost = group.hostUserId === userId;

  await db.$transaction(async (tx) => {
    if (isHost) {
      // The host explicitly chooses a personal checkout. End the shared
      // session, but preserve every participant's basket by detaching it.
      await tx.foodCart.updateMany({
        where: { groupOrderId: group.id, status: "ACTIVE" },
        data: { groupOrderId: null },
      });
      await tx.foodGroupOrderMember.updateMany({
        where: { groupOrderId: group.id, status: "ACTIVE" },
        data: { status: "LEFT" },
      });
      await tx.foodGroupOrder.update({
        where: { id: group.id },
        data: { status: "CANCELLED" },
      });
      return;
    }

    await tx.foodCart.update({
      where: { id: cart.id },
      data: { groupOrderId: null },
    });
    await tx.foodGroupOrderMember.updateMany({
      where: { groupOrderId: group.id, userId, status: "ACTIVE" },
      data: { status: "LEFT" },
    });
  });

  return {
    cart: await getFoodCart(restaurantSlug, { userId }),
    groupEnded: isHost,
  };
}
async function customerFoodOrder(userId:string, orderId:string) { const order = await db.foodOrder.findFirst({ where: { id: orderId, userId }, include: foodOrderInclude }); if (!order) throw new AppError("NOT_FOUND", "Food order not found", 404); return order; }
export async function sendFoodOrderMessage(userId:string, orderId:string, input:{text?:string|null;mediaKey?:string|null}) { await customerFoodOrder(userId,orderId); if(!input.text?.trim()&&!input.mediaKey)throw new AppError("BAD_REQUEST","Message text or uploaded media is required",400); if(input.mediaKey&&!input.mediaKey.startsWith(`users/${userId}/`))throw new AppError("BAD_REQUEST","Use a completed private Bazaara media upload",400); const message=await db.foodOrderMessage.create({data:{orderId,senderUserId:userId,senderRole:"CUSTOMER",text:input.text?.trim().slice(0,1000)||null,mediaKey:input.mediaKey??null}});return{message}; }
export async function createFoodSupportIssue(userId:string,orderId:string,input:{type:string;details:string;requestedRefundMinor?:number|null}){await customerFoodOrder(userId,orderId);const issue=await db.foodSupportIssue.create({data:{orderId,userId,type:input.type,details:input.details.trim().slice(0,1200),requestedRefundMinor:input.requestedRefundMinor==null?null:BigInt(input.requestedRefundMinor)}});return{issue:{...issue,requestedRefundMinor:issue.requestedRefundMinor==null?null:minor(issue.requestedRefundMinor),approvedRefundMinor:null}};}
export async function createFoodReview(userId:string,orderId:string,input:{rating:number;foodRating?:number|null;deliveryRating?:number|null;text?:string|null;photoKeys?:string[]}){const order=await customerFoodOrder(userId,orderId);if(order.status!=="DELIVERED")throw new AppError("CONFLICT","Reviews are available after delivery",409);for(const key of input.photoKeys??[])if(!key.startsWith(`users/${userId}/`))throw new AppError("BAD_REQUEST","Use completed private Bazaara media uploads for review photos",400);const review=await db.foodReview.upsert({where:{orderId},create:{orderId,userId,restaurantId:order.restaurantId,rating:input.rating,foodRating:input.foodRating??null,deliveryRating:input.deliveryRating??null,text:input.text?.trim().slice(0,1200)||null,photoKeys:input.photoKeys??[]},update:{rating:input.rating,foodRating:input.foodRating??null,deliveryRating:input.deliveryRating??null,text:input.text?.trim().slice(0,1200)||null,photoKeys:input.photoKeys??[]}});const aggregate=await db.foodReview.aggregate({where:{restaurantId:order.restaurantId},_avg:{rating:true},_count:{_all:true}});await db.foodRestaurant.update({where:{id:order.restaurantId},data:{rating:aggregate._avg.rating??0,ratingCount:aggregate._count._all}});return{review};}
export async function verifyFoodDeliveryPin(userId: string, orderId: string, pin: string) {
  const order = await db.foodOrder.findUnique({
    where: { id: orderId },
    include: {
      restaurant: {
        include: {
          merchant: {
            include: {
              organization: {
                include: {
                  members: { where: { userId, status: "ACTIVE" }, select: { id: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!order?.deliveryPinHash) throw new AppError("NOT_FOUND", "Delivery verification is not enabled for this order", 404);
  const isCourier = order.courierUserId === userId;
  const isMerchantMember = order.restaurant.merchant.organization.members.length > 0;
  if (!isCourier && !isMerchantMember) throw new AppError("FORBIDDEN", "Only the assigned courier or restaurant team can verify this delivery", 403);
  if (order.deliveryPinVerifiedAt) return { verified: true, alreadyVerified: true };
  const expected = Buffer.from(order.deliveryPinHash, "hex");
  const actual = Buffer.from(foodPinHash(order.id, pin), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new AppError("BAD_REQUEST", "Incorrect delivery PIN", 400);
  await db.foodOrder.update({ where: { id: order.id }, data: { deliveryPinVerifiedAt: new Date() } });
  return { verified: true, alreadyVerified: false };
}


async function foodMerchantRestaurant(userId:string,restaurantId:string){const r=await db.foodRestaurant.findFirst({where:{id:restaurantId,merchant:{organization:{members:{some:{userId,status:"ACTIVE"}}}}},include:{merchant:{include:{organization:true}},openingHours:true,menuSections:{include:{items:true}}}});if(!r)throw new AppError("NOT_FOUND","Restaurant not found",404);return r;}
export async function businessFoodRestaurants(userId:string) {
  const rules = await currentFoodRules();
  const restaurants = await db.foodRestaurant.findMany({
    where: { merchant: { organization: { members: { some: { userId, status: "ACTIVE" } } } } },
    include: {
      merchant: { include: { organization: true } },
      openingHours: true,
      menuSections: { orderBy: { sortOrder: "asc" }, include: { items: { orderBy: { sortOrder: "asc" } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const commercial = new Map(await Promise.all(restaurants.map(async (restaurant) => [restaurant.id, await foodCommissionForRestaurant(restaurant.id)] as const)));
  return { restaurants: restaurants.map((restaurant) => ({
    ...restaurantSummary(restaurant, rules),
    merchantId: restaurant.merchantId,
    organizationId: restaurant.merchant.organizationId,
    commercial: commercial.get(restaurant.id),
    pickupLocation: restaurant.latitude == null || restaurant.longitude == null ? null : { latitude: Number(restaurant.latitude), longitude: Number(restaurant.longitude) },
    menu: restaurant.menuSections.map((section) => ({
      id: section.id,
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id, name: item.name, priceMinor: minor(item.priceMinor), active: item.active, soldOut: item.soldOut, prepMinutes: item.prepMinutes,
      })),
    })),
  })) };
}

export async function listBusinessFoodOrders(userId:string){const orders=await db.foodOrder.findMany({where:{restaurant:{merchant:{organization:{members:{some:{userId,status:"ACTIVE"}}}}}},include:foodOrderInclude,orderBy:{createdAt:"desc"},take:200});return{orders:orders.map(serializeFoodOrder)};}
export async function updateBusinessFoodRestaurant(userId:string,restaurantId:string,input:{acceptingOrders?:boolean;maxActiveOrders?:number;prepTimeBufferMin?:number;preorderEnabled?:boolean;pauseUntil?:Date|null;deliveryEnabled?:boolean;pickupEnabled?:boolean;asapEnabled?:boolean;scheduledEnabled?:boolean;minOrderMinor?:number;deliveryFeeMinor?:number;latitude?:number;longitude?:number}){
  const existing=await foodMerchantRestaurant(userId,restaurantId);
  const sameDate=(a:Date|null,b:Date|null)=>a?.getTime()===b?.getTime();
  const unchanged=
    (input.acceptingOrders===undefined||input.acceptingOrders===existing.acceptingOrders)&&
    (input.maxActiveOrders===undefined||input.maxActiveOrders===existing.maxActiveOrders)&&
    (input.prepTimeBufferMin===undefined||input.prepTimeBufferMin===existing.prepTimeBufferMin)&&
    (input.preorderEnabled===undefined||input.preorderEnabled===existing.preorderEnabled)&&
    (input.pauseUntil===undefined||sameDate(input.pauseUntil,existing.pauseUntil))&&
    (input.deliveryEnabled===undefined||input.deliveryEnabled===existing.deliveryEnabled)&&
    (input.pickupEnabled===undefined||input.pickupEnabled===existing.pickupEnabled)&&
    (input.asapEnabled===undefined||input.asapEnabled===existing.asapEnabled)&&
    (input.scheduledEnabled===undefined||input.scheduledEnabled===existing.scheduledEnabled)&&
    (input.minOrderMinor===undefined||BigInt(input.minOrderMinor)===existing.minOrderMinor)&&
    (input.deliveryFeeMinor===undefined||BigInt(input.deliveryFeeMinor)===existing.deliveryFeeMinor)&&
    (input.latitude===undefined||(existing.latitude!=null&&Number(existing.latitude)===input.latitude))&&
    (input.longitude===undefined||(existing.longitude!=null&&Number(existing.longitude)===input.longitude));
  const rules=await currentFoodRules();
  if(unchanged)return{restaurant:{...restaurantSummary(existing,rules),pickupLocation:existing.latitude==null||existing.longitude==null?null:{latitude:Number(existing.latitude),longitude:Number(existing.longitude)}},actionState:"ALREADY_DONE" as const};
  const data:any={};
  for(const key of ["acceptingOrders","maxActiveOrders","prepTimeBufferMin","preorderEnabled","pauseUntil","deliveryEnabled","pickupEnabled","asapEnabled","scheduledEnabled"] as const){if(input[key]!==undefined)data[key]=input[key];}
  if(input.minOrderMinor!==undefined)data.minOrderMinor=BigInt(input.minOrderMinor);
  if(input.deliveryFeeMinor!==undefined)data.deliveryFeeMinor=BigInt(input.deliveryFeeMinor);
  if(input.latitude!==undefined)data.latitude=input.latitude;
  if(input.longitude!==undefined)data.longitude=input.longitude;
  const r=await db.foodRestaurant.update({where:{id:restaurantId},data,include:restaurantInclude});
  return{restaurant:{...restaurantSummary(r,rules),pickupLocation:r.latitude==null||r.longitude==null?null:{latitude:Number(r.latitude),longitude:Number(r.longitude)}},actionState:"COMPLETED" as const};
}
export async function updateBusinessFoodOrderStatus(userId:string,orderId:string,status:"ACCEPTED"|"PREPARING"|"READY"|"PICKED_UP"|"ON_THE_WAY"|"DELIVERED"|"CANCELLED"){
  const order=await db.foodOrder.findFirst({where:{id:orderId,restaurant:{merchant:{organization:{members:{some:{userId,status:"ACTIVE"}}}}}}});
  if(!order)throw new AppError("NOT_FOUND","Food order not found",404);
  if(order.status===status)return{order:await getBusinessFoodOrder(userId,order.id),actionState:"ALREADY_DONE" as const};
  if(status==="ACCEPTED"&&order.paymentStatus!=="PAID")throw new AppError("CONFLICT","Payment must be confirmed before the restaurant accepts this order",409);
  const deliveryAllowed:Record<string,string[]>={PLACED:["ACCEPTED","CANCELLED"],ACCEPTED:["PREPARING","CANCELLED"],PREPARING:["READY","CANCELLED"],READY:order.courierUserId?[]:["CANCELLED"]};
  const pickupAllowed:Record<string,string[]>={PLACED:["ACCEPTED","CANCELLED"],ACCEPTED:["PREPARING","CANCELLED"],PREPARING:["READY","CANCELLED"],READY:["PICKED_UP","CANCELLED"],PICKED_UP:["DELIVERED"]};
  const allowed=order.fulfillmentType==="DELIVERY"?deliveryAllowed:pickupAllowed;
  if(!allowed[order.status]?.includes(status))throw new AppError("CONFLICT",order.fulfillmentType==="DELIVERY"&&["PICKED_UP","ON_THE_WAY","DELIVERED"].includes(status)?"GO controls delivery status after the restaurant marks the order ready":`Cannot change ${order.status} to ${status}`,409);
  const now=new Date();
  await db.$transaction([
    db.foodOrder.update({where:{id:order.id},data:{status,...(status==="PICKED_UP"?{pickedUpAt:now}:{}),...(status==="DELIVERED"?{deliveredAt:now}:{}),...(status==="CANCELLED"?{cancelledAt:now}:{})}}),
    db.foodOrderTrackingEvent.create({data:{orderId:order.id,status,message:status==="READY"&&order.fulfillmentType==="DELIVERY"?"Order ready for GO pickup":`Order ${status.toLowerCase().replaceAll("_"," ")}`}})
  ]);
  return{order:await getBusinessFoodOrder(userId,order.id),actionState:"COMPLETED" as const};
}
async function getBusinessFoodOrder(userId:string,orderId:string){const o=await db.foodOrder.findFirst({where:{id:orderId,restaurant:{merchant:{organization:{members:{some:{userId,status:"ACTIVE"}}}}}},include:foodOrderInclude});if(!o)throw new AppError("NOT_FOUND","Food order not found",404);return serializeFoodOrder(o);}
export async function setBusinessFoodMenuItemAvailability(userId:string,itemId:string,input:{soldOut?:boolean;active?:boolean;prepMinutes?:number|null}){const item=await db.foodMenuItem.findFirst({where:{id:itemId},include:{restaurant:{include:{merchant:true}}}});if(!item)throw new AppError("NOT_FOUND","Menu item not found",404);await foodMerchantRestaurant(userId,item.restaurantId);const unchanged=(input.soldOut===undefined||input.soldOut===item.soldOut)&&(input.active===undefined||input.active===item.active)&&(input.prepMinutes===undefined||input.prepMinutes===item.prepMinutes);if(unchanged)return{item,actionState:"ALREADY_DONE" as const};return{item:await db.foodMenuItem.update({where:{id:item.id},data:input}),actionState:"COMPLETED" as const};}
export async function upsertFoodAvailabilityWindow(userId:string,itemId:string,input:{id?:string;dayOfWeek:number;startMinute:number;endMinute:number;kind:"REGULAR"|"PREORDER";minLeadMinutes?:number;maxAdvanceDays?:number;active?:boolean}){const item=await db.foodMenuItem.findUnique({where:{id:itemId}});if(!item)throw new AppError("NOT_FOUND","Menu item not found",404);await foodMerchantRestaurant(userId,item.restaurantId);const data={dayOfWeek:input.dayOfWeek,startMinute:input.startMinute,endMinute:input.endMinute,kind:input.kind,minLeadMinutes:input.minLeadMinutes??0,maxAdvanceDays:input.maxAdvanceDays??7,active:input.active??true};const window=input.id?await db.foodMenuAvailabilityWindow.update({where:{id:input.id},data}):await db.foodMenuAvailabilityWindow.create({data:{menuItemId:item.id,...data}});return{window};}
export async function createFoodPromotion(userId:string,restaurantId:string,input:{code?:string|null;title:string;description?:string|null;discountType:"PERCENT"|"FIXED";value:number;minSubtotalMinor?:number;maxDiscountMinor?:number|null;fundingSource?:"MERCHANT"|"BAZAARA"|"SHARED";merchantFundingBps?:number;startsAt:Date;endsAt:Date}){await foodMerchantRestaurant(userId,restaurantId);if(input.endsAt<=input.startsAt)throw new AppError("BAD_REQUEST","Promotion end must be after its start",400);const fundingSource=input.fundingSource??"MERCHANT";const merchantFundingBps=fundingSource==="MERCHANT"?10000:fundingSource==="BAZAARA"?0:Math.max(0,Math.min(10000,input.merchantFundingBps??5000));const promotion=await db.foodPromotion.create({data:{restaurantId,code:input.code?.trim().toUpperCase()||null,title:input.title.trim(),description:input.description?.trim()||null,discountType:input.discountType,value:input.value,minSubtotalMinor:BigInt(input.minSubtotalMinor??0),maxDiscountMinor:input.maxDiscountMinor==null?null:BigInt(input.maxDiscountMinor),fundingSource,merchantFundingBps,startsAt:input.startsAt,endsAt:input.endsAt}});return{promotion};}

export async function businessFoodPromotions(userId: string) {
  const promotions = await db.foodPromotion.findMany({
    where: { restaurant: { merchant: { organization: { members: { some: { userId, status: "ACTIVE" } } } } } },
    include: { restaurant: { include: restaurantInclude } },
    orderBy: [{ active: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
  return { promotions: promotions.map((promotion) => ({
    id: promotion.id, restaurantId: promotion.restaurantId, restaurant: restaurantSummary(promotion.restaurant),
    code: promotion.code, title: promotion.title, description: promotion.description, discountType: promotion.discountType, value: promotion.value,
    minSubtotalMinor: minor(promotion.minSubtotalMinor), maxDiscountMinor: promotion.maxDiscountMinor == null ? null : minor(promotion.maxDiscountMinor),
    fundingSource: promotion.fundingSource, merchantFundingBps: promotion.merchantFundingBps, startsAt: promotion.startsAt, endsAt: promotion.endsAt, active: promotion.active,
    createdAt: promotion.createdAt, updatedAt: promotion.updatedAt,
  })) };
}

export async function updateBusinessFoodPromotion(userId: string, promotionId: string, input: { active?: boolean; endsAt?: Date }) {
  const promotion = await db.foodPromotion.findUnique({ where: { id: promotionId } });
  if (!promotion) throw new AppError("NOT_FOUND", "Food promotion not found", 404);
  await foodMerchantRestaurant(userId, promotion.restaurantId);
  if (input.endsAt && input.endsAt <= promotion.startsAt) throw new AppError("BAD_REQUEST", "Promotion end must be after its start", 400);
  const unchanged = (input.active === undefined || input.active === promotion.active) && (input.endsAt === undefined || input.endsAt.getTime() === promotion.endsAt.getTime());
  if (unchanged) return { promotion, actionState: "ALREADY_DONE" as const };
  return { promotion: await db.foodPromotion.update({ where: { id: promotionId }, data: input }), actionState: "COMPLETED" as const };
}

export async function updateBusinessFoodOpeningHours(userId: string, restaurantId: string, input: { dayOfWeek: number; openMinute: number; closeMinute: number; closed: boolean }) {
  await foodMerchantRestaurant(userId, restaurantId);
  if (!input.closed && input.closeMinute <= input.openMinute) throw new AppError("BAD_REQUEST", "Closing time must be after opening time", 400);
  const existing = await db.foodOpeningHour.findUnique({ where: { restaurantId_dayOfWeek: { restaurantId, dayOfWeek: input.dayOfWeek } } });
  if (existing && existing.openMinute === input.openMinute && existing.closeMinute === input.closeMinute && existing.closed === input.closed) return { hour: existing, actionState: "ALREADY_DONE" as const };
  const hour = await db.foodOpeningHour.upsert({
    where: { restaurantId_dayOfWeek: { restaurantId, dayOfWeek: input.dayOfWeek } },
    create: { restaurantId, ...input },
    update: { openMinute: input.openMinute, closeMinute: input.closeMinute, closed: input.closed },
  });
  return { hour, actionState: "COMPLETED" as const };
}
export async function replyFoodReview(userId:string,reviewId:string,text:string){const review=await db.foodReview.findUnique({where:{id:reviewId}});if(!review)throw new AppError("NOT_FOUND","Review not found",404);await foodMerchantRestaurant(userId,review.restaurantId);const reply=text.trim().slice(0,1200);if(review.restaurantReply===reply)return{review,actionState:"ALREADY_DONE" as const};return{review:await db.foodReview.update({where:{id:review.id},data:{restaurantReply:reply,repliedAt:new Date()}}),actionState:"COMPLETED" as const};}
export async function businessFoodReport(userId:string,restaurantId:string){await foodMerchantRestaurant(userId,restaurantId);const [orders,reviews,commercial,issues]=await Promise.all([db.foodOrder.findMany({where:{restaurantId},include:{economics:true}}),db.foodReview.aggregate({where:{restaurantId},_avg:{rating:true},_count:{_all:true}}),foodCommissionForRestaurant(restaurantId),db.foodSupportIssue.count({where:{order:{restaurantId},status:{notIn:["RESOLVED","REJECTED"]}}})]);const completed=orders.filter(o=>o.status!=="CANCELLED");const delivered=orders.filter(o=>o.status==="DELIVERED");const cancelled=orders.filter(o=>o.status==="CANCELLED");return{orders:orders.length,grossFoodSalesMinor:completed.reduce((n,o)=>n+minor(o.subtotalMinor),0),merchantCommissionMinor:completed.reduce((n,o)=>n+minor(o.economics?.merchantCommissionMinor),0),merchantNetMinor:completed.reduce((n,o)=>n+minor(o.economics?.merchantNetMinor),0),open:orders.filter(o=>!["DELIVERED","CANCELLED"].includes(o.status)).length,delivered:delivered.length,cancelled:cancelled.length,cancellationRate:orders.length?cancelled.length/orders.length:0,averageOrderValueMinor:completed.length?Math.round(completed.reduce((n,o)=>n+minor(o.totalMinor),0)/completed.length):0,tipsMinor:orders.reduce((n,o)=>n+minor(o.tipMinor),0),openIssues:issues,commercial,reviews:{count:reviews._count._all,average:reviews._avg.rating??0}};}

export async function getFoodRestaurantReviews(slug: string) {
  const restaurant = await db.foodRestaurant.findFirst({ where: { slug, status: "ACTIVE" }, select: { id: true } });
  if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  const reviews = await db.foodReview.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, rating: true, foodRating: true, deliveryRating: true, text: true, photoKeys: true, restaurantReply: true, repliedAt: true, createdAt: true },
  });
  const counts = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: reviews.filter((review) => review.rating === rating).length }));
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  return { average, count: reviews.length, breakdown: counts.reverse(), reviews: reviews.map((review) => ({ id: review.id, rating: review.rating, foodRating: review.foodRating, deliveryRating: review.deliveryRating, text: review.text, photoCount: review.photoKeys.length, restaurantReply: review.restaurantReply, repliedAt: review.repliedAt, createdAt: review.createdAt })) };
}

export async function businessFoodReviews(userId: string) {
  const reviews = await db.foodReview.findMany({
    where: { restaurant: { merchant: { organization: { members: { some: { userId, status: "ACTIVE" } } } } } },
    include: { restaurant: { include: restaurantInclude }, order: { select: { orderNumber: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return { reviews: reviews.map((review) => ({
    id: review.id, orderNumber: review.order.orderNumber, restaurant: restaurantSummary(review.restaurant), rating: review.rating,
    foodRating: review.foodRating, deliveryRating: review.deliveryRating, text: review.text, photoKeys: review.photoKeys,
    restaurantReply: review.restaurantReply, repliedAt: review.repliedAt, createdAt: review.createdAt,
  })) };
}

export async function businessFoodIssues(userId: string) {
  const issues = await db.foodSupportIssue.findMany({
    where: { order: { restaurant: { merchant: { organization: { members: { some: { userId, status: "ACTIVE" } } } } } } },
    include: { order: { include: { restaurant: { include: restaurantInclude } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return { issues: issues.map((issue) => ({
    id: issue.id, orderId: issue.orderId, orderNumber: issue.order.orderNumber, restaurant: restaurantSummary(issue.order.restaurant),
    type: issue.type, status: issue.status, details: issue.details,
    requestedRefundMinor: issue.requestedRefundMinor == null ? null : minor(issue.requestedRefundMinor),
    approvedRefundMinor: issue.approvedRefundMinor == null ? null : minor(issue.approvedRefundMinor),
    paymentMethod: issue.order.paymentMethod, paymentStatus: issue.order.paymentStatus,
    settlementRequired: issue.order.paymentStatus === "PAID" && issue.approvedRefundMinor != null,
    createdAt: issue.createdAt, updatedAt: issue.updatedAt,
  })) };
}

export async function updateBusinessFoodIssue(userId: string, issueId: string, input: { status: "OPEN"|"INVESTIGATING"|"APPROVED"|"REJECTED"|"RESOLVED"; approvedRefundMinor?: number|null }) {
  const issue = await db.foodSupportIssue.findFirst({
    where: { id: issueId, order: { restaurant: { merchant: { organization: { members: { some: { userId, status: "ACTIVE" } } } } } } },
    include: { order: true },
  });
  if (!issue) throw new AppError("NOT_FOUND", "Food support issue not found", 404);
  const approved = input.status === "APPROVED" || input.status === "RESOLVED" ? input.approvedRefundMinor : null;
  if (approved != null && issue.requestedRefundMinor != null && BigInt(approved) > issue.requestedRefundMinor) {
    throw new AppError("BAD_REQUEST", "Approved refund cannot exceed the requested amount", 400);
  }
  const desiredApproved = approved == null ? null : BigInt(approved);
  if (issue.status === input.status && issue.approvedRefundMinor === desiredApproved) {
    return { issue: { ...issue, requestedRefundMinor: issue.requestedRefundMinor == null ? null : minor(issue.requestedRefundMinor), approvedRefundMinor: issue.approvedRefundMinor == null ? null : minor(issue.approvedRefundMinor), settlementRequired: issue.order.paymentStatus === "PAID" && issue.approvedRefundMinor != null, settlementNote: issue.order.paymentStatus === "PAID" && issue.approvedRefundMinor != null ? "Refund approval recorded. Provider settlement must be completed by the configured payment/refund integration." : null }, actionState: "ALREADY_DONE" as const };
  }
  const updated = await db.foodSupportIssue.update({
    where: { id: issue.id },
    data: { status: input.status, approvedRefundMinor: desiredApproved },
  });
  return {
    issue: {
      ...updated,
      requestedRefundMinor: updated.requestedRefundMinor == null ? null : minor(updated.requestedRefundMinor),
      approvedRefundMinor: updated.approvedRefundMinor == null ? null : minor(updated.approvedRefundMinor),
      settlementRequired: issue.order.paymentStatus === "PAID" && updated.approvedRefundMinor != null,
      settlementNote: issue.order.paymentStatus === "PAID" && updated.approvedRefundMinor != null
        ? "Refund approval recorded. Provider settlement must be completed by the configured payment/refund integration."
        : null,
    },
    actionState: "COMPLETED" as const,
  };
}

export async function getFoodGroupOrderPreview(token: string) {
  const group = await db.foodGroupOrder.findUnique({ where: { shareToken: token }, include: { restaurant: { include: restaurantInclude }, members: { where: { status: "ACTIVE" }, select: { id: true } } } });
  if (!group || group.status !== "OPEN" || group.expiresAt <= new Date()) throw new AppError("NOT_FOUND", "This group-order link is no longer active", 404);
  return { group: { shareToken: group.shareToken, restaurant: restaurantSummary(group.restaurant), spendingLimitMinor: group.spendingLimitMinor == null ? null : minor(group.spendingLimitMinor), expiresAt: group.expiresAt, memberCount: group.members.length } };
}

export async function sendBusinessFoodOrderMessage(userId:string, orderId:string, input:{text?:string|null;mediaKey?:string|null}) {
  const order=await db.foodOrder.findFirst({where:{id:orderId,restaurant:{merchant:{organization:{members:{some:{userId,status:"ACTIVE"}}}}}}});
  if(!order)throw new AppError("NOT_FOUND","Food order not found",404);
  if(!input.text?.trim()&&!input.mediaKey)throw new AppError("BAD_REQUEST","Message text or uploaded media is required",400);
  if(input.mediaKey&&!input.mediaKey.startsWith(`users/${userId}/`))throw new AppError("BAD_REQUEST","Use a completed private Bazaara media upload",400);
  const message=await db.foodOrderMessage.create({data:{orderId,senderUserId:userId,senderRole:"RESTAURANT",text:input.text?.trim().slice(0,1000)||null,mediaKey:input.mediaKey??null}});
  return{message};
}

export async function updateFoodCourierLocation(userId:string, orderId:string, input:{latitude:number;longitude:number}) {
  const [order, rules] = await Promise.all([
    db.foodOrder.findUnique({
      where:{id:orderId},
      select:{id:true,courierUserId:true,status:true,fulfillmentType:true,restaurant:{select:{latitude:true,longitude:true}}},
    }),
    currentFoodRules(),
  ]);
  if(!order||order.courierUserId!==userId)throw new AppError("FORBIDDEN","This Food delivery is not assigned to you",403);
  if(order.fulfillmentType!=="DELIVERY"||!["READY","PICKED_UP","ON_THE_WAY"].includes(order.status))throw new AppError("CONFLICT","Location sharing is only available during an active delivery",409);

  const pickup = order.restaurant.latitude == null || order.restaurant.longitude == null
    ? null
    : { latitude:Number(order.restaurant.latitude), longitude:Number(order.restaurant.longitude) };
  const distanceMeters = pickup ? haversineMeters(input, pickup) : null;
  const proximityState = order.status === "READY" && distanceMeters != null
    ? classifyFoodPickupProximity(distanceMeters, rules)
    : null;

  return db.$transaction(async tx => {
    const event=await tx.foodOrderTrackingEvent.create({data:{orderId:order.id,status:order.status,latitude:input.latitude,longitude:input.longitude,message:"Courier location updated"}});
    let proximityEvent = null as null | { id:string; status:string; latitude:any; longitude:any; message:string|null; createdAt:Date };

    if (proximityState && distanceMeters != null) {
      const atPickup = await tx.foodOrderTrackingEvent.findFirst({where:{orderId:order.id,status:"COURIER_AT_PICKUP"},select:{id:true}});
      const nearPickup = atPickup ? null : await tx.foodOrderTrackingEvent.findFirst({where:{orderId:order.id,status:"COURIER_NEAR_PICKUP"},select:{id:true}});
      const shouldCreate = proximityState === "AT_PICKUP" ? !atPickup : !atPickup && !nearPickup;
      if (shouldCreate) {
        const status = proximityState === "AT_PICKUP" ? "COURIER_AT_PICKUP" : "COURIER_NEAR_PICKUP";
        proximityEvent = await tx.foodOrderTrackingEvent.create({
          data:{
            orderId:order.id,
            status,
            latitude:input.latitude,
            longitude:input.longitude,
            message: proximityState === "AT_PICKUP"
              ? "GO courier has arrived at the restaurant pickup location"
              : `GO courier is close to pickup · about ${Math.max(0, Math.round(distanceMeters))} m away`,
          },
        });
        await queueFoodPickupProximityTx(tx, order.id, proximityState, distanceMeters);
      }
    }

    return {
      tracking:{id:event.id,status:event.status,latitude:Number(event.latitude),longitude:Number(event.longitude),message:event.message,createdAt:event.createdAt},
      pickupProximity: proximityState == null || distanceMeters == null ? null : {
        state: proximityState,
        distanceMeters,
        eventCreated: Boolean(proximityEvent),
      },
    };
  });
}


export async function foodCapabilities() {
  const rules = await currentFoodRules();
  return {
    serviceFee: { type: "PERCENT_WITH_CAPS", rateBps: rules.serviceFeeBps, minimumMinor: rules.serviceFeeMinimumMinor, maximumMinor: rules.serviceFeeMaximumMinor },
    merchantCommissionBps: rules.merchantCommissionBps,
    goCommissionBps: rules.goCommissionBps,
    dispatch: {
      mode: "NEARBY_AUTO_ELIGIBILITY",
      maxPickupDistanceMeters: rules.maxPickupDistanceMeters,
      maxPickupEtaSeconds: rules.maxPickupEtaSeconds,
      pickupNearDistanceMeters: rules.pickupNearDistanceMeters,
      pickupArrivalDistanceMeters: rules.pickupArrivalDistanceMeters,
    },
    tips: { courierShareBps: 10_000 },
  };
}

function foodAddressPoint(value: any): { latitude: number; longitude: number } | null {
  if (!value || typeof value !== "object") return null;
  const latitude = Number(value.latitude ?? value.lat);
  const longitude = Number(value.longitude ?? value.lng ?? value.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function foodCourierOrderSummary(order: any, pickupDistanceMeters?: number, pickupEtaSeconds?: number) {
  const serialized = serializeFoodOrder(order);
  return {
    ...serialized,
    pickup: order.restaurant.latitude == null || order.restaurant.longitude == null ? null : { latitude: Number(order.restaurant.latitude), longitude: Number(order.restaurant.longitude) },
    pickupDistanceMeters: pickupDistanceMeters ?? null,
    pickupEtaSeconds: pickupEtaSeconds ?? null,
    dropoff: foodAddressPoint(order.deliveryAddress),
    itemCount: (order.items ?? []).reduce((sum: number, item: any) => sum + item.quantity, 0),
  };
}

export async function listFoodCourierOffers(userId: string, location: { latitude: number; longitude: number }) {
  const rules = await currentFoodRules();
  const activeAssignment = await db.foodOrder.findFirst({ where: { courierUserId: userId, fulfillmentType: "DELIVERY", status: { in: ["READY", "PICKED_UP", "ON_THE_WAY"] } }, select: { id: true } });
  if (activeAssignment) return { offers: [], rules: { maxPickupDistanceMeters: rules.maxPickupDistanceMeters, maxPickupEtaSeconds: rules.maxPickupEtaSeconds, goCommissionBps: rules.goCommissionBps }, courierUserId: userId, reason: "ACTIVE_DELIVERY" };
  const orders = await db.foodOrder.findMany({
    where: { fulfillmentType: "DELIVERY", status: "READY", courierUserId: null, restaurant: { status: "ACTIVE", latitude: { not: null }, longitude: { not: null } } },
    include: foodOrderInclude,
    orderBy: { updatedAt: "asc" },
    take: 100,
  });
  const offers = orders.flatMap((order: any) => {
    const pickup = { latitude: Number(order.restaurant.latitude), longitude: Number(order.restaurant.longitude) };
    const pickupDistanceMeters = haversineMeters(location, pickup);
    const pickupEtaSeconds = estimateFoodPickupEtaSeconds(pickupDistanceMeters);
    if (pickupDistanceMeters > rules.maxPickupDistanceMeters || pickupEtaSeconds > rules.maxPickupEtaSeconds) return [];
    return [foodCourierOrderSummary(order, pickupDistanceMeters, pickupEtaSeconds)];
  }).sort((a: any, b: any) => (a.pickupDistanceMeters ?? Infinity) - (b.pickupDistanceMeters ?? Infinity)).slice(0, 30);
  return { offers, rules: { maxPickupDistanceMeters: rules.maxPickupDistanceMeters, maxPickupEtaSeconds: rules.maxPickupEtaSeconds, goCommissionBps: rules.goCommissionBps }, courierUserId: userId };
}

export async function acceptFoodCourierOffer(userId: string, orderId: string, location: { latitude: number; longitude: number }) {
  const [rules, order] = await Promise.all([
    currentFoodRules(),
    db.foodOrder.findUnique({ where: { id: orderId }, include: foodOrderInclude }),
  ]);
  if (!order || order.fulfillmentType !== "DELIVERY") throw new AppError("NOT_FOUND", "Food delivery not found", 404);
  const existingAssignment = await db.foodOrder.findFirst({ where: { courierUserId: userId, fulfillmentType: "DELIVERY", status: { in: ["READY", "PICKED_UP", "ON_THE_WAY"] }, id: { not: orderId } }, select: { id: true } });
  if (existingAssignment) throw new AppError("CONFLICT", "Complete your active GO delivery before accepting another one", 409);
  if (order.status !== "READY" || order.courierUserId) throw new AppError("CONFLICT", "This Food delivery is no longer available", 409);
  if (order.restaurant.latitude == null || order.restaurant.longitude == null) throw new AppError("CONFLICT", "Restaurant pickup coordinates are unavailable", 409);
  const pickup = { latitude: Number(order.restaurant.latitude), longitude: Number(order.restaurant.longitude) };
  const pickupDistanceMeters = haversineMeters(location, pickup);
  const pickupEtaSeconds = estimateFoodPickupEtaSeconds(pickupDistanceMeters);
  if (pickupDistanceMeters > rules.maxPickupDistanceMeters || pickupEtaSeconds > rules.maxPickupEtaSeconds) throw new AppError("CONFLICT", "This pickup is outside your GO dispatch radius", 409);
  const now = new Date();
  await db.$transaction(async (tx) => {
    const changed = await tx.foodOrder.updateMany({ where: { id: orderId, status: "READY", courierUserId: null }, data: { courierUserId: userId, courierAssignedAt: now } });
    if (changed.count !== 1) throw new AppError("CONFLICT", "Another GO courier accepted this delivery first", 409);
    await tx.foodOrderTrackingEvent.create({ data: { orderId, status: "READY", latitude: location.latitude, longitude: location.longitude, message: "GO courier assigned and heading to the restaurant" } });
    const proximityState = classifyFoodPickupProximity(pickupDistanceMeters, rules);
    if (proximityState) {
      await tx.foodOrderTrackingEvent.create({
        data: {
          orderId,
          status: proximityState === "AT_PICKUP" ? "COURIER_AT_PICKUP" : "COURIER_NEAR_PICKUP",
          latitude: location.latitude,
          longitude: location.longitude,
          message: proximityState === "AT_PICKUP"
            ? "GO courier has arrived at the restaurant pickup location"
            : `GO courier is close to pickup · about ${pickupDistanceMeters} m away`,
        },
      });
      await queueFoodPickupProximityTx(tx, orderId, proximityState, pickupDistanceMeters);
    }
  });
  const assigned = await db.foodOrder.findUniqueOrThrow({ where: { id: orderId }, include: foodOrderInclude });
  return { delivery: foodCourierOrderSummary(assigned, pickupDistanceMeters, pickupEtaSeconds) };
}

export async function listFoodCourierDeliveries(userId: string) {
  const orders = await db.foodOrder.findMany({
    where: { courierUserId: userId, fulfillmentType: "DELIVERY", status: { in: ["READY", "PICKED_UP", "ON_THE_WAY"] } },
    include: foodOrderInclude,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return { deliveries: orders.map((order: any) => foodCourierOrderSummary(order)) };
}

export async function listFoodCourierHistory(userId: string) {
  const orders = await db.foodOrder.findMany({
    where: {
      courierUserId: userId,
      fulfillmentType: "DELIVERY",
      status: "DELIVERED",
    },
    include: foodOrderInclude,
    orderBy: { deliveredAt: "desc" },
    take: 100,
  });

  const deliveries = orders.map((order: any) => foodCourierOrderSummary(order));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payoutFor = (order: any) =>
    (order.economics ? minor(order.economics.courierNetMinor) : 0) +
    minor(order.tipMinor);

  return {
    deliveries,
    summary: {
      deliveredCount: orders.length,
      todayDeliveredCount: orders.filter((order: any) => order.deliveredAt && order.deliveredAt >= today).length,
      todayPayoutMinor: orders
        .filter((order: any) => order.deliveredAt && order.deliveredAt >= today)
        .reduce((sum: number, order: any) => sum + payoutFor(order), 0),
      recentPayoutMinor: orders.reduce((sum: number, order: any) => sum + payoutFor(order), 0),
    },
  };
}
export async function updateFoodCourierDeliveryStatus(userId: string, orderId: string, status: "PICKED_UP" | "ON_THE_WAY" | "DELIVERED", location?: { latitude: number; longitude: number }) {
  const order = await db.foodOrder.findUnique({ where: { id: orderId }, include: foodOrderInclude });
  if (!order || order.courierUserId !== userId || order.fulfillmentType !== "DELIVERY") throw new AppError("FORBIDDEN", "This Food delivery is not assigned to you", 403);
  const allowed: Record<string, string[]> = { READY: ["PICKED_UP"], PICKED_UP: ["ON_THE_WAY"], ON_THE_WAY: ["DELIVERED"] };
  if (!allowed[order.status]?.includes(status)) throw new AppError("CONFLICT", `Cannot change Food delivery from ${order.status} to ${status}`, 409);
  if (status === "DELIVERED" && order.deliveryPinHash && !order.deliveryPinVerifiedAt) throw new AppError("CONFLICT", "Verify the customer delivery PIN before completing delivery", 409);
  const now = new Date();
  await db.$transaction(async (tx) => {
    const changed = await tx.foodOrder.updateMany({
      where: { id: orderId, courierUserId: userId, status: order.status },
      data: { status, ...(status === "PICKED_UP" ? { pickedUpAt: now } : {}), ...(status === "DELIVERED" ? { deliveredAt: now } : {}) },
    });
    if (changed.count !== 1) throw new AppError("CONFLICT", "Food delivery changed while this update was being processed", 409);
    await tx.foodOrderTrackingEvent.create({ data: { orderId, status, latitude: location?.latitude, longitude: location?.longitude, message: status === "PICKED_UP" ? "Order collected by GO" : status === "ON_THE_WAY" ? "Courier is on the way" : "Order delivered" } });
  });
  const updated = await db.foodOrder.findUniqueOrThrow({ where: { id: orderId }, include: foodOrderInclude });
  return { delivery: foodCourierOrderSummary(updated) };
}

export async function listFoodCommissionPolicies() {
  const policies = await db.foodCommissionPolicy.findMany({
    where: { region: env.REGION },
    orderBy: [{ active: "desc" }, { effectiveFrom: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
  const restaurantIds = [...new Set(policies.map((policy) => policy.restaurantId).filter((value): value is string => Boolean(value)))];
  const restaurants = restaurantIds.length ? await db.foodRestaurant.findMany({ where: { id: { in: restaurantIds } }, include: { merchant: { include: { organization: true } } } }) : [];
  const names = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant.merchant.organization.displayName]));
  return { policies: policies.map((policy) => ({ ...policy, restaurantName: policy.restaurantId ? names.get(policy.restaurantId) ?? null : null })) };
}

export async function createFoodCommissionPolicy(actorUserId: string, input: { scope: "GLOBAL" | "RESTAURANT"; restaurantId?: string | null; merchantCommissionBps: number; effectiveFrom: Date; effectiveTo?: Date | null; reason: string }) {
  if (input.scope === "RESTAURANT" && !input.restaurantId) throw new AppError("BAD_REQUEST", "Restaurant is required for a restaurant commission policy", 400);
  if (input.scope === "GLOBAL" && input.restaurantId) throw new AppError("BAD_REQUEST", "Global commission policy cannot target a restaurant", 400);
  if (input.effectiveTo && input.effectiveTo <= input.effectiveFrom) throw new AppError("BAD_REQUEST", "Commission policy end must be after its start", 400);
  if (input.restaurantId) {
    const restaurant = await db.foodRestaurant.findUnique({ where: { id: input.restaurantId }, select: { id: true } });
    if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  }
  const policy = await db.foodCommissionPolicy.create({
    data: {
      region: env.REGION,
      scope: input.scope,
      restaurantId: input.scope === "RESTAURANT" ? input.restaurantId : null,
      merchantCommissionBps: clampInt(input.merchantCommissionBps, 0, 4_000, FOOD_DEFAULT_MERCHANT_COMMISSION_BPS),
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo ?? null,
      reason: input.reason.trim().slice(0, 500),
      createdByUserId: actorUserId,
      approvedByUserId: actorUserId,
    },
  });
  return { policy };
}

export async function setFoodCommissionPolicyActive(policyId: string, active: boolean) {
  const existing = await db.foodCommissionPolicy.findUnique({ where: { id: policyId } });
  if (!existing || existing.region !== env.REGION) throw new AppError("NOT_FOUND", "Commission policy not found", 404);
  if (existing.active === active) return { policy: existing, actionState: "ALREADY_DONE" as const };
  return { policy: await db.foodCommissionPolicy.update({ where: { id: policyId }, data: { active } }), actionState: "COMPLETED" as const };
}

export async function adminFoodRestaurants() {
  const restaurants = await db.foodRestaurant.findMany({
    include: { merchant: { include: { organization: true } }, orders: { orderBy: { createdAt: "desc" }, take: 40, include: { economics: true } }, reviews: { orderBy: { createdAt: "desc" }, take: 50 } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const supportCases = await db.supportCase.findMany({ where: { category: "FOOD", foodRestaurantId: { not: null }, status: { notIn: ["RESOLVED", "CLOSED"] } }, select: { foodRestaurantId: true } });
  const supportMap = new Map<string, number>();
  for (const supportCase of supportCases) {
    if (!supportCase.foodRestaurantId) continue;
    supportMap.set(supportCase.foodRestaurantId, (supportMap.get(supportCase.foodRestaurantId) ?? 0) + 1);
  }
  return { restaurants: await Promise.all(restaurants.map(async (restaurant) => {
    const commercial = await foodCommissionForRestaurant(restaurant.id);
    const openOrders = restaurant.orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
    const cancelled = restaurant.orders.filter((order) => order.status === "CANCELLED").length;
    return {
      id: restaurant.id, slug: restaurant.slug, name: restaurant.merchant.organization.displayName, organizationId: restaurant.merchant.organizationId,
      status: restaurant.status, acceptingOrders: restaurant.acceptingOrders, deliveryEnabled: restaurant.deliveryEnabled, pickupEnabled: restaurant.pickupEnabled,
      maxActiveOrders: restaurant.maxActiveOrders, prepTimeBufferMin: restaurant.prepTimeBufferMin, pauseUntil: restaurant.pauseUntil?.toISOString() ?? null,
      rating: restaurant.rating, ratingCount: restaurant.ratingCount, commercial,
      metrics: { openOrders: openOrders.length, recentOrders: restaurant.orders.length, cancellationRate: restaurant.orders.length ? cancelled / restaurant.orders.length : 0, openSupportCases: supportMap.get(restaurant.id) ?? 0, recentMerchantNetMinor: restaurant.orders.reduce((sum, order) => sum + minor(order.economics?.merchantNetMinor), 0) },
    };
  })) };
}

export async function updateAdminFoodRestaurant(restaurantId: string, input: { status?: string; acceptingOrders?: boolean; maxActiveOrders?: number; prepTimeBufferMin?: number; pauseUntil?: Date | null }) {
  const restaurant = await db.foodRestaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  const samePause = input.pauseUntil === undefined || input.pauseUntil?.getTime() === restaurant.pauseUntil?.getTime();
  const unchanged = (input.status === undefined || input.status === restaurant.status) && (input.acceptingOrders === undefined || input.acceptingOrders === restaurant.acceptingOrders) && (input.maxActiveOrders === undefined || input.maxActiveOrders === restaurant.maxActiveOrders) && (input.prepTimeBufferMin === undefined || input.prepTimeBufferMin === restaurant.prepTimeBufferMin) && samePause;
  const shape = (row:any) => ({ id: row.id, status: row.status, acceptingOrders: row.acceptingOrders, maxActiveOrders: row.maxActiveOrders, prepTimeBufferMin: row.prepTimeBufferMin, pauseUntil: row.pauseUntil?.toISOString() ?? null });
  if (unchanged) return { restaurant: shape(restaurant), actionState: "ALREADY_DONE" as const };
  const updated = await db.foodRestaurant.update({ where: { id: restaurantId }, data: input });
  return { restaurant: shape(updated), actionState: "COMPLETED" as const };
}


export async function adminFoodIssues() {
  const issues = await db.foodSupportIssue.findMany({
    include: {
      order: {
        include: {
          restaurant: { include: restaurantInclude },
          economics: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return {
    issues: issues.map((issue) => ({
      id: issue.id,
      orderId: issue.orderId,
      orderNumber: issue.order.orderNumber,
      restaurant: restaurantSummary(issue.order.restaurant),
      type: issue.type,
      status: issue.status,
      details: issue.details,
      requestedRefundMinor: issue.requestedRefundMinor == null ? null : minor(issue.requestedRefundMinor),
      approvedRefundMinor: issue.approvedRefundMinor == null ? null : minor(issue.approvedRefundMinor),
      paymentMethod: issue.order.paymentMethod,
      paymentStatus: issue.order.paymentStatus,
      orderStatus: issue.order.status,
      totalMinor: minor(issue.order.totalMinor),
      merchantCommissionMinor: minor(issue.order.economics?.merchantCommissionMinor),
      merchantNetMinor: minor(issue.order.economics?.merchantNetMinor),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })),
  };
}

export async function updateAdminFoodIssue(issueId: string, input: { status: "OPEN"|"INVESTIGATING"|"APPROVED"|"REJECTED"|"RESOLVED"; approvedRefundMinor?: number|null }) {
  const issue = await db.foodSupportIssue.findUnique({ where: { id: issueId }, include: { order: true } });
  if (!issue) throw new AppError("NOT_FOUND", "Food support issue not found", 404);
  const approved = input.status === "APPROVED" || input.status === "RESOLVED" ? input.approvedRefundMinor : null;
  if (approved != null && issue.requestedRefundMinor != null && BigInt(approved) > issue.requestedRefundMinor) {
    throw new AppError("BAD_REQUEST", "Approved refund cannot exceed the requested amount", 400);
  }
  if (approved != null && BigInt(approved) > issue.order.totalMinor) {
    throw new AppError("BAD_REQUEST", "Approved refund cannot exceed the order total", 400);
  }
  const desiredApproved = approved == null ? null : BigInt(approved);
  if (issue.status === input.status && issue.approvedRefundMinor === desiredApproved) {
    return { issue: { ...issue, requestedRefundMinor: issue.requestedRefundMinor == null ? null : minor(issue.requestedRefundMinor), approvedRefundMinor: issue.approvedRefundMinor == null ? null : minor(issue.approvedRefundMinor), settlementRequired: issue.order.paymentStatus === "PAID" && issue.approvedRefundMinor != null, settlementNote: issue.order.paymentStatus === "PAID" && issue.approvedRefundMinor != null ? "Refund approval recorded. Provider settlement must be completed by the configured payment/refund integration." : null }, actionState: "ALREADY_DONE" as const };
  }
  const updated = await db.foodSupportIssue.update({
    where: { id: issue.id },
    data: { status: input.status, approvedRefundMinor: desiredApproved },
  });
  return {
    issue: {
      ...updated,
      requestedRefundMinor: updated.requestedRefundMinor == null ? null : minor(updated.requestedRefundMinor),
      approvedRefundMinor: updated.approvedRefundMinor == null ? null : minor(updated.approvedRefundMinor),
      settlementRequired: issue.order.paymentStatus === "PAID" && updated.approvedRefundMinor != null,
      settlementNote: issue.order.paymentStatus === "PAID" && updated.approvedRefundMinor != null
        ? "Refund approval recorded. Provider settlement must be completed by the configured payment/refund integration."
        : null,
    },
    actionState: "COMPLETED" as const,
  };
}

export async function adminFoodPromotions() {
  const promotions = await db.foodPromotion.findMany({
    include: { restaurant: { include: restaurantInclude } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return {
    promotions: promotions.map((promotion) => ({
      id: promotion.id,
      restaurantId: promotion.restaurantId,
      restaurant: restaurantSummary(promotion.restaurant),
      code: promotion.code,
      title: promotion.title,
      description: promotion.description,
      discountType: promotion.discountType,
      value: promotion.value,
      minSubtotalMinor: minor(promotion.minSubtotalMinor),
      maxDiscountMinor: promotion.maxDiscountMinor == null ? null : minor(promotion.maxDiscountMinor),
      fundingSource: promotion.fundingSource,
      merchantFundingBps: promotion.merchantFundingBps,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      active: promotion.active,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    })),
  };
}

export async function createAdminFoodPromotion(input: { restaurantId: string; code?: string|null; title: string; description?: string|null; discountType: "PERCENT"|"FIXED"; value: number; minSubtotalMinor?: number; maxDiscountMinor?: number|null; fundingSource: "MERCHANT"|"BAZAARA"|"SHARED"; merchantFundingBps?: number; startsAt: Date; endsAt: Date }) {
  const restaurant = await db.foodRestaurant.findUnique({ where: { id: input.restaurantId }, select: { id: true } });
  if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  if (input.endsAt <= input.startsAt) throw new AppError("BAD_REQUEST", "Promotion end must be after its start", 400);
  const merchantFundingBps = input.fundingSource === "MERCHANT"
    ? 10_000
    : input.fundingSource === "BAZAARA"
      ? 0
      : clampInt(input.merchantFundingBps, 0, 10_000, 5_000);
  const promotion = await db.foodPromotion.create({
    data: {
      restaurantId: input.restaurantId,
      code: input.code?.trim().toUpperCase() || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      discountType: input.discountType,
      value: input.value,
      minSubtotalMinor: BigInt(input.minSubtotalMinor ?? 0),
      maxDiscountMinor: input.maxDiscountMinor == null ? null : BigInt(input.maxDiscountMinor),
      fundingSource: input.fundingSource,
      merchantFundingBps,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
  return { promotion };
}

export async function updateAdminFoodPromotion(promotionId: string, input: { active?: boolean; endsAt?: Date }) {
  const promotion = await db.foodPromotion.findUnique({ where: { id: promotionId } });
  if (!promotion) throw new AppError("NOT_FOUND", "Food promotion not found", 404);
  if (input.endsAt && input.endsAt <= promotion.startsAt) throw new AppError("BAD_REQUEST", "Promotion end must be after its start", 400);
  const unchanged = (input.active === undefined || input.active === promotion.active) && (input.endsAt === undefined || input.endsAt.getTime() === promotion.endsAt.getTime());
  if (unchanged) return { promotion, actionState: "ALREADY_DONE" as const };
  return { promotion: await db.foodPromotion.update({ where: { id: promotionId }, data: input }), actionState: "COMPLETED" as const };
}

export async function adminFoodReviews() {
  const reviews = await db.foodReview.findMany({
    include: {
      restaurant: { include: restaurantInclude },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return {
    reviews: reviews.map((review) => ({
      id: review.id,
      orderNumber: review.order.orderNumber,
      restaurant: restaurantSummary(review.restaurant),
      rating: review.rating,
      foodRating: review.foodRating,
      deliveryRating: review.deliveryRating,
      text: review.text,
      restaurantReply: review.restaurantReply,
      repliedAt: review.repliedAt,
      createdAt: review.createdAt,
    })),
  };
}

export async function adminFoodMenu(restaurantId: string) {
  const restaurant = await db.foodRestaurant.findUnique({
    where: { id: restaurantId },
    include: {
      merchant: { include: { organization: true } },
      openingHours: { orderBy: { dayOfWeek: "asc" } },
      menuSections: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              modifierGroups: {
                orderBy: { sortOrder: "asc" },
                include: { options: { orderBy: { sortOrder: "asc" } } },
              },
              availabilityWindows: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
            },
          },
        },
      },
    },
  });
  if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  return {
    restaurant: restaurantSummary(restaurant),
    sections: restaurant.menuSections.map((section) => ({
      id: section.id,
      name: section.title,
      active: section.active,
      sortOrder: section.sortOrder,
      items: section.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        priceMinor: minor(item.priceMinor),
        active: item.active,
        soldOut: item.soldOut,
        prepMinutes: item.prepMinutes,
        sortOrder: item.sortOrder,
        modifierGroups: item.modifierGroups.map((group) => ({
          id: group.id,
          name: group.name,
          required: group.required,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            priceDeltaMinor: minor(option.priceDeltaMinor),
            active: option.active,
          })),
        })),
        availabilityWindows: item.availabilityWindows,
      })),
    })),
  };
}

export async function updateAdminFoodMenuItem(itemId: string, input: { active?: boolean; soldOut?: boolean; prepMinutes?: number|null }) {
  const item = await db.foodMenuItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError("NOT_FOUND", "Food menu item not found", 404);
  const unchanged = (input.active === undefined || input.active === item.active)
    && (input.soldOut === undefined || input.soldOut === item.soldOut)
    && (input.prepMinutes === undefined || input.prepMinutes === item.prepMinutes);
  if (unchanged) return { item, actionState: "ALREADY_DONE" as const };
  return { item: await db.foodMenuItem.update({ where: { id: itemId }, data: input }), actionState: "COMPLETED" as const };
}

export async function adminFoodOverview() {
  const [rules, orders] = await Promise.all([
    currentFoodRules(),
    db.foodOrder.findMany({ include: foodOrderInclude, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const now = Date.now();
  const rows = orders.map((order: any) => {
    const ageMinutes = Math.max(0, Math.round((now - order.updatedAt.getTime()) / 60_000));
    const threshold = order.status === "PLACED" ? 7 : order.status === "ACCEPTED" ? 12 : order.status === "PREPARING" ? Math.max(20, order.restaurant.estimatedDeliveryMin) : order.status === "READY" && !order.courierUserId ? 8 : order.status === "PICKED_UP" || order.status === "ON_THE_WAY" ? Math.max(20, order.restaurant.estimatedDeliveryMax) : 9999;
    return { order: serializeFoodOrder(order), ageMinutes, delayed: ageMinutes > threshold, attention: order.status === "READY" && !order.courierUserId ? "UNASSIGNED_COURIER" : ageMinutes > threshold ? "DELAYED" : null };
  });
  return {
    rules,
    kpis: {
      open: rows.filter((row) => !["DELIVERED", "CANCELLED"].includes(row.order.status)).length,
      delayed: rows.filter((row) => row.delayed && !["DELIVERED", "CANCELLED"].includes(row.order.status)).length,
      unassignedReady: rows.filter((row) => row.attention === "UNASSIGNED_COURIER").length,
      delivered: rows.filter((row) => row.order.status === "DELIVERED").length,
    },
    orders: rows,
  };
}

export async function updateFoodRules(input: Partial<FoodRules>) {
  const current = await currentFoodRules();
  const merged: FoodRules = {
    serviceFeeBps: clampInt(input.serviceFeeBps, 0, 3_000, current.serviceFeeBps),
    serviceFeeMinimumMinor: clampInt(input.serviceFeeMinimumMinor, 0, 10_000_000, current.serviceFeeMinimumMinor),
    serviceFeeMaximumMinor: clampInt(input.serviceFeeMaximumMinor, 0, 20_000_000, current.serviceFeeMaximumMinor),
    merchantCommissionBps: clampInt(input.merchantCommissionBps, 0, 4_000, current.merchantCommissionBps),
    goCommissionBps: clampInt(input.goCommissionBps, 0, 3_000, current.goCommissionBps),
    maxPickupDistanceMeters: clampInt(input.maxPickupDistanceMeters, 500, 30_000, current.maxPickupDistanceMeters),
    maxPickupEtaSeconds: clampInt(input.maxPickupEtaSeconds, 60, 3_600, current.maxPickupEtaSeconds),
    pickupNearDistanceMeters: clampInt(input.pickupNearDistanceMeters, 50, 5_000, current.pickupNearDistanceMeters),
    pickupArrivalDistanceMeters: clampInt(input.pickupArrivalDistanceMeters, 20, 1_000, current.pickupArrivalDistanceMeters),
  };
  if (merged.serviceFeeMaximumMinor < merged.serviceFeeMinimumMinor) throw new AppError("BAD_REQUEST", "Service-fee maximum must be greater than or equal to the minimum", 400);
  if (merged.pickupArrivalDistanceMeters > merged.pickupNearDistanceMeters) throw new AppError("BAD_REQUEST", "Pickup arrival distance must be less than or equal to the near-pickup distance", 400);
  const unchanged = (Object.keys(merged) as Array<keyof FoodRules>).every((key) => merged[key] === current[key]);
  if (unchanged) return { rules: current, actionState: "ALREADY_DONE" as const };
  await db.regionalConfig.upsert({
    where: { region_vertical: { region: env.REGION, vertical: "food" } },
    create: { region: env.REGION, vertical: "food", currency: env.CURRENCY, timezone: env.TIMEZONE, locale: env.LOCALE, rules: merged as any },
    update: { rules: merged as any },
  });
  return { rules: merged, actionState: "COMPLETED" as const };
}

async function foodCourierContact(courierUserId:string|null){
  if(!courierUserId)return null;
  const courier=await db.user.findUnique({where:{id:courierUserId},select:{displayName:true,phones:{where:{isPrimary:true,verifiedAt:{not:null}},select:{e164:true},take:1}}});
  if(!courier)return null;
  return{displayName:courier.displayName||"Bazaara courier",phone:courier.phones[0]?.e164??null};
}
