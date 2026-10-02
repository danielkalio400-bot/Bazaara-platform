export type FeeDeliveryProcess =
  | "standard"
  | "express"
  | "scheduled";

const NAIRA_MINOR = 100;

function naira(
  value: number
) {
  return Math.round(
    value * NAIRA_MINOR
  );
}

export function calculatePlatformFeeMinor(
  subtotalMinor: number
) {
  return Math.round(
    subtotalMinor * 0.02
  );
}

export function calculateDeliveryFeeMinor(
  subtotalMinor: number,
  process: FeeDeliveryProcess
) {
  const subtotalNaira =
    subtotalMinor /
    NAIRA_MINOR;

  if (process === "express") {
    if (subtotalNaira <= 50_000) {
      return naira(5_000);
    }

    if (subtotalNaira <= 200_000) {
      return naira(6_500);
    }

    if (subtotalNaira <= 500_000) {
      return naira(8_000);
    }

    return naira(10_000);
  }

  if (subtotalNaira <= 50_000) {
    return naira(1_000);
  }

  if (subtotalNaira <= 200_000) {
    return naira(2_000);
  }

  if (subtotalNaira <= 500_000) {
    return naira(2_500);
  }

  return naira(3_000);
}

export function calculateCheckoutFeePreview(
  subtotalMinor: number,
  process: FeeDeliveryProcess
) {
  const platformFeeMinor =
    calculatePlatformFeeMinor(
      subtotalMinor
    );

  const deliveryFeeMinor =
    calculateDeliveryFeeMinor(
      subtotalMinor,
      process
    );

  return {
    platformFeeMinor,
    deliveryFeeMinor,
    estimatedTotalMinor:
      subtotalMinor +
      platformFeeMinor +
      deliveryFeeMinor
  };
}
