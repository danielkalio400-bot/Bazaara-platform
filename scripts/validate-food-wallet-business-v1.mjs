import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const mustContain = (relative, markers) => {
  const source = read(relative);
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${relative}: missing ${marker}`);
  }
  return source;
};

const service = mustContain("services/platform-api/src/food/service.ts", [
  "verifyPayPin(userId, input.walletPin)",
  "FOOD_DEFAULT_PICKUP_NEAR_DISTANCE_METERS",
  "FOOD_DEFAULT_PICKUP_ARRIVAL_DISTANCE_METERS",
  "classifyFoodPickupProximity",
  "foodOrderTiming",
  '"COURIER_NEAR_PICKUP"',
  '"COURIER_AT_PICKUP"',
  "queueFoodPickupProximityTx",
  "queueBusinessFoodOrderReceivedTx",
  "pickupNearDistanceMeters",
  "pickupArrivalDistanceMeters",
]);

const routes = mustContain("services/platform-api/src/food/routes.ts", [
  "walletPin: z.string().regex(/^\\d{6}$/).optional()",
  "walletPinProvided: Boolean(input.walletPin)",
  "pickupNearDistanceMeters",
  "pickupArrivalDistanceMeters",
]);

if (routes.includes("requestPayload: { slug, input },")) {
  failures.push("Food order idempotency payload must not hash the raw 6-digit Wallet PIN");
}

mustContain("services/platform-api/src/food/payment.ts", [
  "walletPinSet",
  "walletPinLockedUntil",
  'label: "Wallet"',
  "queueBusinessFoodOrderReceivedTx",
]);

mustContain("services/platform-api/src/food/notifications.ts", [
  'category: "FOOD_ORDER"',
  'category: "FOOD_DELIVERY"',
  'category: "FOOD_PICKUP"',
  'channels: ["PUSH"]',
]);

mustContain("packages/contracts/src/index.ts", [
  "elapsedSeconds: number",
  "orderToCourierAssignedSeconds",
  "courierAssignedToPickupSeconds",
  "pickupToDeliverySeconds",
]);

mustContain("apps/food-web/components/food-checkout-client.tsx", [
  "Enter your 6-digit Wallet PIN",
  'walletPin:paymentMethod==="BAZAARA_PAY"?walletPin:undefined',
  "NEXT_PUBLIC_WALLET_BASE_URL",
]);

mustContain("apps/food-web/components/food-order-detail-client.tsx", [
  "LIVE ORDER TIME",
  "TOTAL DELIVERY TIME",
  "COURIER AT PICKUP",
  "COURIER NEAR PICKUP",
  "Delivered in",
]);

mustContain("apps/food-mobile/app/checkout/[slug].tsx", [
  "6-digit Wallet PIN",
  'walletPin:paymentMethod==="BAZAARA_PAY"?walletPin:undefined',
  "EXPO_PUBLIC_WALLET_WEB_BASE_URL",
]);

mustContain("apps/food-mobile/app/order/[id].tsx", [
  "LIVE ORDER TIME",
  "COURIER AT PICKUP",
  "COURIER NEAR PICKUP",
]);

mustContain("apps/business-web/app/food/page.tsx", [
  "Enable order alerts",
  "AudioContext",
  "Notification.requestPermission",
  "seenPaidOrdersRef",
  "seenPickupEventsRef",
  "GO courier at pickup",
  "setInterval(() => void load(), 4000)",
]);

mustContain("apps/business-web/app/globals.css", [
  "BUSINESS FOOD LIVE ORDER ALERTS + GO PICKUP V5 START",
  ".business-alert-toggle",
  ".business-pickup-alert",
  ".courier-at-pickup",
]);

mustContain("services/platform-api/src/food/experience.test.ts", [
  "Food pickup proximity distinguishes near pickup from arrival",
  "Food order timing freezes at delivery and exposes phase durations",
]);

if (service.includes('walletPinHash') || service.includes('walletPin: input.walletPin')) {
  failures.push("Food service must never persist the Wallet PIN");
}

if (failures.length) {
  console.error(`Food + Wallet + Business V1 validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("Food + Wallet + Business V1 validation PASS.");
