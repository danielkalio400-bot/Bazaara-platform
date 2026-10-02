import { db, Prisma } from "@bazaara/db";

export const GROCERY_SERVICE_FEE_MIN_BPS = 1000; // 10%
export const GROCERY_SERVICE_FEE_MAX_BPS = 1500; // 15%
export const GROCERY_SERVICE_FEE_DEFAULT_BPS = 1000; // 10%
export const GROCERY_EXPRESS_RATE_BPS = 1000; // 10%
export const GROCERY_EXPRESS_MINIMUM_MINOR = 100000n; // ₦1,000
export const GROCERY_EXPRESS_MAXIMUM_MINOR = 500000n; // ₦5,000

const GROCERY_PRICING_REGION = "NG";
const GROCERY_PRICING_VERTICAL = "GROCERY";

export type GroceryPricingPolicy = {
  serviceFeeBps: number;
  serviceFeeMinBps: number;
  serviceFeeMaxBps: number;
  expressRateBps: number;
  expressMinimumMinor: bigint;
  expressMaximumMinor: bigint;
};

export type GroceryPricingInput = {
  subtotalMinor: bigint;
  deliveryMode: "STANDARD" | "EXPRESS" | "SCHEDULED" | "PICKUP";
  standardShippingMinor: bigint;
  hasFreeDelivery: boolean;
  policy?: GroceryPricingPolicy;
};

export type GroceryPricingResult = {
  serviceFeeBps: number;
  serviceFeeMinor: bigint;
  shippingMinor: bigint;
  deliveryPlatformShareMinor: bigint;
  deliveryGoShareMinor: bigint;
};

function clampInteger(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  if (!Number.isFinite(value) || !Number.isInteger(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function rulesObject(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export function groceryPricingPolicyFromEnv(): GroceryPricingPolicy {
  const configuredServiceFee = Number.parseInt(
    process.env.GROCERY_SERVICE_FEE_BPS ??
      String(GROCERY_SERVICE_FEE_DEFAULT_BPS),
    10,
  );

  return {
    serviceFeeBps: clampInteger(
      configuredServiceFee,
      GROCERY_SERVICE_FEE_MIN_BPS,
      GROCERY_SERVICE_FEE_MAX_BPS,
      GROCERY_SERVICE_FEE_DEFAULT_BPS,
    ),
    serviceFeeMinBps: GROCERY_SERVICE_FEE_MIN_BPS,
    serviceFeeMaxBps: GROCERY_SERVICE_FEE_MAX_BPS,
    expressRateBps: GROCERY_EXPRESS_RATE_BPS,
    expressMinimumMinor: GROCERY_EXPRESS_MINIMUM_MINOR,
    expressMaximumMinor: GROCERY_EXPRESS_MAXIMUM_MINOR,
  };
}

export async function groceryPricingPolicy(): Promise<GroceryPricingPolicy> {
  const fallback = groceryPricingPolicyFromEnv();

  const regional = await db.regionalConfig.findFirst({
    where: {
      region: GROCERY_PRICING_REGION,
      vertical: GROCERY_PRICING_VERTICAL,
    },
    select: { rules: true },
  });

  const rules = rulesObject(regional?.rules);
  const configured = Number(rules.serviceFeeBps);

  return {
    ...fallback,
    serviceFeeBps: clampInteger(
      configured,
      GROCERY_SERVICE_FEE_MIN_BPS,
      GROCERY_SERVICE_FEE_MAX_BPS,
      fallback.serviceFeeBps,
    ),
  };
}

export async function groceryPricingPublicPolicy() {
  const policy = await groceryPricingPolicy();

  return {
    serviceFeeBps: policy.serviceFeeBps,
    serviceFeeMinBps: policy.serviceFeeMinBps,
    serviceFeeMaxBps: policy.serviceFeeMaxBps,
    expressRateBps: policy.expressRateBps,
    expressMinimumMinor: Number(policy.expressMinimumMinor),
    expressMaximumMinor: Number(policy.expressMaximumMinor),
  };
}

export async function setGroceryServiceFeeBps(serviceFeeBps: number) {
  if (
    !Number.isInteger(serviceFeeBps) ||
    serviceFeeBps < GROCERY_SERVICE_FEE_MIN_BPS ||
    serviceFeeBps > GROCERY_SERVICE_FEE_MAX_BPS
  ) {
    throw new Error("Grocery service fee must stay between 10% and 15%");
  }

  const current = await db.regionalConfig.findFirst({
    where: {
      region: GROCERY_PRICING_REGION,
      vertical: GROCERY_PRICING_VERTICAL,
    },
    select: { id: true, rules: true },
  });

  const nextRules = {
    ...rulesObject(current?.rules),
    serviceFeeBps,
  };

  if (current) {
    await db.regionalConfig.update({
      where: { id: current.id },
      data: { rules: nextRules as Prisma.InputJsonValue },
    });
  } else {
    await db.regionalConfig.create({
      data: {
        region: GROCERY_PRICING_REGION,
        vertical: GROCERY_PRICING_VERTICAL,
        enabled: true,
        currency: "NGN",
        timezone: "Africa/Lagos",
        locale: "en-NG",
        rules: nextRules as Prisma.InputJsonValue,
      },
    });
  }

  return groceryPricingPublicPolicy();
}

export function calculateGroceryServiceFeeMinor(
  subtotalMinor: bigint,
  serviceFeeBps = GROCERY_SERVICE_FEE_DEFAULT_BPS,
) {
  if (subtotalMinor < 0n) {
    throw new Error("Grocery subtotal cannot be negative");
  }

  if (
    !Number.isInteger(serviceFeeBps) ||
    serviceFeeBps < GROCERY_SERVICE_FEE_MIN_BPS ||
    serviceFeeBps > GROCERY_SERVICE_FEE_MAX_BPS
  ) {
    throw new Error("Grocery service fee must stay between 10% and 15%");
  }

  return (subtotalMinor * BigInt(serviceFeeBps) + 5000n) / 10000n;
}

export function calculateGroceryExpressFeeMinor(
  subtotalMinor: bigint,
  policy: Pick<
    GroceryPricingPolicy,
    "expressRateBps" | "expressMinimumMinor" | "expressMaximumMinor"
  > = groceryPricingPolicyFromEnv(),
) {
  if (subtotalMinor < 0n) {
    throw new Error("Grocery subtotal cannot be negative");
  }

  const percentageFee =
    (subtotalMinor * BigInt(policy.expressRateBps) + 5000n) / 10000n;

  if (percentageFee < policy.expressMinimumMinor) {
    return policy.expressMinimumMinor;
  }

  if (percentageFee > policy.expressMaximumMinor) {
    return policy.expressMaximumMinor;
  }

  return percentageFee;
}

export function calculateGroceryPricing(
  input: GroceryPricingInput,
): GroceryPricingResult {
  const policy = input.policy ?? groceryPricingPolicyFromEnv();

  const serviceFeeMinor = calculateGroceryServiceFeeMinor(
    input.subtotalMinor,
    policy.serviceFeeBps,
  );

  if (input.deliveryMode === "PICKUP") {
    return {
      serviceFeeBps: policy.serviceFeeBps,
      serviceFeeMinor,
      shippingMinor: 0n,
      deliveryPlatformShareMinor: 0n,
      deliveryGoShareMinor: 0n,
    };
  }

  if (input.deliveryMode === "EXPRESS") {
    return {
      serviceFeeBps: policy.serviceFeeBps,
      serviceFeeMinor,
      shippingMinor: calculateGroceryExpressFeeMinor(
        input.subtotalMinor,
        policy,
      ),
      // The old fixed ₦1,000/₦1,000 allocation cannot be carried into a
      // variable Express fee without a new allocation rule. Keep the stored
      // allocation neutral rather than inventing money movement.
      deliveryPlatformShareMinor: 0n,
      deliveryGoShareMinor: 0n,
    };
  }

  return {
    serviceFeeBps: policy.serviceFeeBps,
    serviceFeeMinor,
    shippingMinor: input.hasFreeDelivery ? 0n : input.standardShippingMinor,
    deliveryPlatformShareMinor: 0n,
    deliveryGoShareMinor: 0n,
  };
}
