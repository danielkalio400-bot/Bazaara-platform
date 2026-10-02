import type { Prisma } from "@bazaara/db";
import { queueNotificationTx } from "../notifications/service.js";

function minor(value: bigint | number) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : 0;
}

function orderAmountLabel(totalMinor: bigint | number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor(totalMinor) / 100);
  } catch {
    return `${currency} ${(minor(totalMinor) / 100).toFixed(0)}`;
  }
}

async function foodNotificationContext(tx: Prisma.TransactionClient, orderId: string) {
  return tx.foodOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      totalMinor: true,
      currency: true,
      fulfillmentType: true,
      restaurant: {
        select: {
          merchant: {
            select: {
              organization: {
                select: {
                  displayName: true,
                  members: {
                    where: { status: "ACTIVE" },
                    select: { userId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function queueBusinessFoodOrderReceivedTx(tx: Prisma.TransactionClient, orderId: string) {
  const order = await foodNotificationContext(tx, orderId);
  if (!order) return;
  const organization = order.restaurant.merchant.organization;
  const title = `New Food order · ${order.orderNumber}`;
  const body = `${orderAmountLabel(order.totalMinor, order.currency)} · ${order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}. Open Business to accept the order.`;
  for (const member of organization.members) {
    await queueNotificationTx(tx, {
      userId: member.userId,
      category: "FOOD_ORDER",
      title,
      body,
      resourceType: "FoodOrder",
      resourceId: order.id,
      channels: ["PUSH"],
    });
  }
}

export async function queueFoodPickupProximityTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  state: "NEAR_PICKUP" | "AT_PICKUP",
  distanceMeters: number,
) {
  const order = await foodNotificationContext(tx, orderId);
  if (!order) return;
  const organization = order.restaurant.merchant.organization;
  const atPickup = state === "AT_PICKUP";
  const distance = Math.max(0, Math.round(distanceMeters));

  await queueNotificationTx(tx, {
    userId: order.userId,
    category: "FOOD_DELIVERY",
    title: atPickup ? "Courier reached the restaurant" : "Courier is close to the restaurant",
    body: atPickup
      ? `Your GO courier is at the pickup location for ${order.orderNumber}.`
      : `Your GO courier is about ${distance} m from the pickup location for ${order.orderNumber}.`,
    resourceType: "FoodOrder",
    resourceId: order.id,
    channels: ["PUSH"],
  });

  for (const member of organization.members) {
    await queueNotificationTx(tx, {
      userId: member.userId,
      category: "FOOD_PICKUP",
      title: atPickup ? "GO courier at pickup" : "GO courier arriving soon",
      body: atPickup
        ? `${order.orderNumber}: courier is at the restaurant pickup location.`
        : `${order.orderNumber}: courier is about ${distance} m away. Prepare the handoff.`,
      resourceType: "FoodOrder",
      resourceId: order.id,
      channels: ["PUSH"],
    });
  }
}
