import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { audit } from "../audit.js";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { AppError } from "../errors.js";
import { presignObject } from "../media/s3-signing.js";
import { withIdempotency } from "../idempotency.js";
import { createCheckout, getCheckout, getOrder, listOrders, placeOrder, setCheckoutPaymentMethod, cancelOrder } from "./checkout.js";
import { claimGuestCartForAuthenticatedUser, resolveCartOwner } from "./guest-cart.js";
import { getCart, removeCartItem, setCartItem, updateCartItem } from "./service.js";
import { shippingAddressSchema } from "./schemas.js";
import {
  addGroceryListCollaborator,
  addGroceryListItem,
  addRecurringBasketItem,
  businessGroceryStores,
  businessGroceryReplacementOptions,
  completeGroceryPicking,
  createBusinessGrocerySlot,
  createGroceryGroupCart,
  createGroceryIssue,
  createGroceryList,
  createRecurringBasket,
  decideGroceryReplacement,
  getGroceryGroupCartPreview,
  getGroceryPickerMessageMediaForCustomer,
  getBusinessGroceryPickerMessageMedia,
  getGroceryMembership,
  getGroceryPreferences,
  groceryHome,
  groceryStores,
  joinGroceryGroupCart,
  listBusinessGroceryOrders,
  listGroceryLists,
  listRecurringBaskets,
  planGroceries,
  removeGroceryListCollaborator,
  removeGroceryListItem,
  removeRecurringBasketItem,
  repeatGroceryPurchases,
  sendBusinessGroceryPickerMessage,
  sendGroceryPickerMessage,
  setGroceryCartItemPreference,
  startGroceryPicking,
  updateBusinessGrocerySlot,
  updateBusinessGroceryStore,
  updateGroceryGroupAllocations,
  updateGroceryList,
  updateGroceryListItem,
  updateGroceryPickerOutcome,
  updateGroceryPreferences,
  updateRecurringBasket,
} from "./grocery.js";
import { db } from "@bazaara/db";
import { groceryPricingPublicPolicy } from "./grocery-pricing.js";

const plannerSchema = z.object({ prompt: z.string().trim().min(2).max(300) });
const listCreateSchema = z.object({ name: z.string().trim().min(1).max(80) });
const listUpdateSchema = z.object({ name: z.string().trim().min(1).max(80).optional(), archived: z.boolean().optional() }).refine((value) => value.name != null || value.archived != null, "No changes supplied");
const itemCreateSchema = z.object({ label: z.string().trim().min(1).max(120), quantity: z.coerce.number().int().min(1).max(99).default(1), productId: z.string().min(1).optional(), variantId: z.string().min(1).optional() });
const itemUpdateSchema = z.object({ quantity: z.coerce.number().int().min(0).max(99).optional(), checked: z.boolean().optional() }).refine((value) => value.quantity != null || value.checked != null, "No changes supplied");
const collaboratorSchema = z.object({ email: z.string().trim().email().max(254), role: z.enum(["VIEWER", "EDITOR"]).default("EDITOR") });
const groceryCartItemSchema = z.object({ variantId: z.string().min(1), quantity: z.coerce.number().int().min(1).max(99) });
const groceryCartItemUpdateSchema = z.object({ quantity: z.coerce.number().int().min(0).max(99) });
const substitutionSchema = z.object({
  substitutionPolicy: z.enum(["BEST_MATCH", "CONTACT_ME", "REFUND", "SPECIFIC_REPLACEMENT"]),
  replacementVariantId: z.string().min(1).nullable().optional(),
  pickerNote: z.string().trim().max(300).nullable().optional(),
  maxPriceIncreasePercent: z.coerce.number().int().min(0).max(100).nullable().optional(),
});
const preferencesSchema = z.object({
  dietaryTags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  freshnessNotes: z.string().trim().max(500).nullable().optional(),
  contactPreference: z.enum(["CHAT", "CALL", "NO_CONTACT"]).optional(),
  leaveAtDoor: z.boolean().optional(),
  maxReplacementPricePercent: z.coerce.number().int().min(0).max(100).optional(),
  substitutionPolicy: z.enum(["BEST_MATCH", "CONTACT_ME", "REFUND"]).optional(),
  preferredFulfillment: z.enum(["STANDARD", "EXPRESS", "SCHEDULED", "PICKUP"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "No changes supplied");
const groceryCheckoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  deliveryMode: z.enum(["STANDARD", "EXPRESS", "SCHEDULED", "PICKUP"]).default("STANDARD"),
  scheduledFor: z.coerce.date().optional(),
  pickupStoreId: z.string().min(1).optional(),
  deliverySlotId: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.deliveryMode === "PICKUP" && !value.pickupStoreId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pickupStoreId"], message: "Choose a pickup branch" });
  if (value.deliveryMode === "SCHEDULED" && !value.deliverySlotId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliverySlotId"], message: "Choose an available delivery slot" });
});
const paymentMethodSchema = z.object({ paymentMethod: z.enum(["PAY_ON_DELIVERY", "PAYSTACK_CARD", "PAYSTACK_BANK"]) });
const recurringCreateSchema = z.object({ name: z.string().trim().min(1).max(100), cadence: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]), nextRunAt: z.string().datetime().nullable().optional() });
const recurringUpdateSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), cadence: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(), nextRunAt: z.string().datetime().nullable().optional(), active: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, "No changes supplied");
const recurringItemSchema = z.object({ variantId: z.string().min(1), quantity: z.coerce.number().int().min(1).max(99) });
const groupCreateSchema = z.object({ spendingLimitMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional() });
const groupJoinSchema = z.object({ displayName: z.string().trim().min(1).max(80) });
const groupAllocationSchema = z.object({ allocations: z.array(z.object({ memberId: z.string().min(1), amountMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable() })).max(100) });
const messageSchema = z.object({ text: z.string().trim().max(1000).nullable().optional(), mediaKey: z.string().trim().max(1000).nullable().optional() }).refine((value) => Boolean(value.text || value.mediaKey), "Message text or media is required");
const pickerOutcomeSchema = z.object({
  status: z.enum(["FOUND", "PARTIAL", "OUT_OF_STOCK", "REPLACEMENT_PROPOSED"]),
  fulfilledQuantity: z.coerce.number().int().min(0).max(99).optional(),
  actualWeightGrams: z.coerce.number().int().min(1).max(100000).nullable().optional(),
  finalUnitPriceMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional(),
  replacementVariantId: z.string().min(1).nullable().optional(),
  replacementQuantity: z.coerce.number().int().min(1).max(99).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
const replacementDecisionSchema = z.object({ decision: z.enum(["APPROVE", "REFUND"]) });
const issueSchema = z.object({ type: z.enum(["MISSING_ITEM", "DAMAGED_ITEM", "QUALITY", "WRONG_ITEM", "LATE_DELIVERY", "OTHER"]), details: z.string().trim().max(1200).optional(), requestedAmountMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional() });
const storeConfigSchema = z.object({
  pickupEnabled: z.boolean().optional(), expressEnabled: z.boolean().optional(), scheduledEnabled: z.boolean().optional(), pickerChatEnabled: z.boolean().optional(), weightedItemsEnabled: z.boolean().optional(),
  minimumOrderMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(), maxActiveOrders: z.coerce.number().int().min(1).max(1000).optional(), prepMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  freeDeliveryThresholdMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional(), membershipDiscountBps: z.coerce.number().int().min(0).max(10000).optional(),
}).refine((value) => Object.keys(value).length > 0, "No changes supplied");
const slotCreateSchema = z.object({ startsAt: z.coerce.date(), endsAt: z.coerce.date(), capacity: z.coerce.number().int().min(1).max(10000) });
const slotUpdateSchema = z.object({ active: z.boolean().optional(), capacity: z.coerce.number().int().min(1).max(10000).optional() }).refine((value) => Object.keys(value).length > 0, "No changes supplied");

async function groceryOrganizationForSellerOrder(userId: string, sellerOrderId: string) {
  const order = await db.shoppingSellerOrder.findFirst({ where: { id: sellerOrderId, merchant: { vertical: "GROCERY", organization: { members: { some: { userId, status: "ACTIVE" } } } } }, select: { merchant: { select: { organizationId: true } } } });
  if (!order) throw new AppError("NOT_FOUND", "Grocery seller order not found", 404);
  return order.merchant.organizationId;
}

async function groceryOrganizationForStore(userId: string, storeId: string) {
  const store = await db.store.findFirst({ where: { id: storeId, merchant: { vertical: "GROCERY", organization: { members: { some: { userId, status: "ACTIVE" } } } } }, select: { merchant: { select: { organizationId: true } } } });
  if (!store) throw new AppError("NOT_FOUND", "Grocery branch not found", 404);
  return store.merchant.organizationId;
}

export async function groceryRoutes(app: FastifyInstance) {
  app.get("/v1/grocery/home", async () => groceryHome());
  app.get("/v1/grocery/stores", async () => groceryStores());
  app.get("/v1/grocery/pricing-policy", async () => groceryPricingPublicPolicy());
  app.post("/v1/grocery/planner", async (request) => planGroceries(plannerSchema.parse(request.body).prompt));

  app.get("/v1/grocery/cart", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    return { cart: await getCart(owner, "GROCERY") };
  });
  app.post("/v1/grocery/cart/items", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const input = groceryCartItemSchema.parse(request.body);
    const cart = await setCartItem(owner, input.variantId, input.quantity, "GROCERY");
    await audit({ actorUserId: owner.userId, action: "grocery.cart.item.added", resourceType: "Cart", resourceId: cart.id ?? undefined, requestId: request.id, ipAddress: request.ip, metadata: { guest: !owner.userId } });
    return reply.code(201).send({ cart });
  });
  app.patch("/v1/grocery/cart/items/:itemId", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const { itemId } = request.params as { itemId: string };
    const input = groceryCartItemUpdateSchema.parse(request.body);
    return {
      cart:
        input.quantity === 0
          ? await removeCartItem(owner, itemId, "GROCERY")
          : await updateCartItem(owner, itemId, input.quantity, "GROCERY"),
    };
  });
  app.delete("/v1/grocery/cart/items/:itemId", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const { itemId } = request.params as { itemId: string };
    return { cart: await removeCartItem(owner, itemId, "GROCERY") };
  });
  app.put("/v1/grocery/cart/items/:itemId/substitution", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const { itemId } = request.params as { itemId: string };
    return setGroceryCartItemPreference(owner, itemId, substitutionSchema.parse(request.body));
  });

  app.get("/v1/grocery/preferences", async (request) => getGroceryPreferences((await requireAuth(request)).userId));
  app.patch("/v1/grocery/preferences", async (request) => updateGroceryPreferences((await requireAuth(request)).userId, preferencesSchema.parse(request.body)));
  app.get("/v1/grocery/membership", async (request) => getGroceryMembership((await requireAuth(request)).userId));

  app.get("/v1/grocery/lists", async (request) => listGroceryLists((await requireAuth(request)).userId));
  app.post("/v1/grocery/lists", async (request, reply) => reply.code(201).send(await createGroceryList((await requireAuth(request)).userId, listCreateSchema.parse(request.body).name)));
  app.patch("/v1/grocery/lists/:listId", async (request) => { const auth = await requireAuth(request); const { listId } = request.params as { listId: string }; return updateGroceryList(auth.userId, listId, listUpdateSchema.parse(request.body)); });
  app.post("/v1/grocery/lists/:listId/items", async (request, reply) => { const auth = await requireAuth(request); const { listId } = request.params as { listId: string }; return reply.code(201).send(await addGroceryListItem(auth.userId, listId, itemCreateSchema.parse(request.body))); });
  app.patch("/v1/grocery/lists/:listId/items/:itemId", async (request) => { const auth = await requireAuth(request); const { listId, itemId } = request.params as { listId: string; itemId: string }; return updateGroceryListItem(auth.userId, listId, itemId, itemUpdateSchema.parse(request.body)); });
  app.delete("/v1/grocery/lists/:listId/items/:itemId", async (request) => { const auth = await requireAuth(request); const { listId, itemId } = request.params as { listId: string; itemId: string }; return removeGroceryListItem(auth.userId, listId, itemId); });
  app.post("/v1/grocery/lists/:listId/collaborators", async (request, reply) => { const auth = await requireAuth(request); const { listId } = request.params as { listId: string }; const input = collaboratorSchema.parse(request.body); return reply.code(201).send(await addGroceryListCollaborator(auth.userId, listId, input.email, input.role)); });
  app.delete("/v1/grocery/lists/:listId/collaborators/:userId", async (request) => { const auth = await requireAuth(request); const { listId, userId } = request.params as { listId: string; userId: string }; return removeGroceryListCollaborator(auth.userId, listId, userId); });
  app.get("/v1/grocery/repeat-purchases", async (request) => repeatGroceryPurchases((await requireAuth(request)).userId));

  app.get("/v1/grocery/recurring-baskets", async (request) => listRecurringBaskets((await requireAuth(request)).userId));
  app.post("/v1/grocery/recurring-baskets", async (request, reply) => { const auth = await requireAuth(request); const input = recurringCreateSchema.parse(request.body); return reply.code(201).send(await createRecurringBasket(auth.userId, { ...input, nextRunAt: input.nextRunAt === undefined ? undefined : input.nextRunAt === null ? null : new Date(input.nextRunAt) })); });
  app.patch("/v1/grocery/recurring-baskets/:basketId", async (request) => { const auth = await requireAuth(request); const { basketId } = request.params as { basketId: string }; const input = recurringUpdateSchema.parse(request.body); return updateRecurringBasket(auth.userId, basketId, { ...input, nextRunAt: input.nextRunAt === undefined ? undefined : input.nextRunAt === null ? null : new Date(input.nextRunAt) }); });
  app.post("/v1/grocery/recurring-baskets/:basketId/items", async (request) => { const auth = await requireAuth(request); const { basketId } = request.params as { basketId: string }; return addRecurringBasketItem(auth.userId, basketId, recurringItemSchema.parse(request.body)); });
  app.delete("/v1/grocery/recurring-baskets/:basketId/items/:itemId", async (request) => { const auth = await requireAuth(request); const { basketId, itemId } = request.params as { basketId: string; itemId: string }; return removeRecurringBasketItem(auth.userId, basketId, itemId); });

  app.post("/v1/grocery/group-carts", async (request, reply) => { const auth = await requireAuth(request); return reply.code(201).send(await createGroceryGroupCart(auth.userId, groupCreateSchema.parse(request.body ?? {}))); });
  app.get("/v1/grocery/group-carts/:token", async (request) => { const { token } = request.params as { token: string }; return getGroceryGroupCartPreview(token); });
  app.post("/v1/grocery/group-carts/join/:token", async (request) => { const auth = await requireAuth(request); const { token } = request.params as { token: string }; return joinGroceryGroupCart(auth.userId, token, groupJoinSchema.parse(request.body).displayName); });
  app.patch("/v1/grocery/group-carts/:groupId/allocations", async (request) => { const auth = await requireAuth(request); const { groupId } = request.params as { groupId: string }; return updateGroceryGroupAllocations(auth.userId, groupId, groupAllocationSchema.parse(request.body).allocations); });

  app.post("/v1/grocery/checkouts", async (request, reply) => {
    const auth = await requireAuth(request);
    await claimGuestCartForAuthenticatedUser(request, reply, auth.userId);
    const input = groceryCheckoutSchema.parse(request.body);
    const checkout = await createCheckout(auth.userId, input.shippingAddress, { vertical: "GROCERY", deliveryMode: input.deliveryMode, scheduledFor: input.scheduledFor, pickupStoreId: input.pickupStoreId, deliverySlotId: input.deliverySlotId });
    await audit({ actorUserId: auth.userId, action: "grocery.checkout.created", resourceType: "ShoppingCheckout", resourceId: checkout.id, requestId: request.id, ipAddress: request.ip });
    return reply.code(201).send({ checkout });
  });
  app.get("/v1/grocery/checkouts/:checkoutId", async (request) => { const auth = await requireAuth(request); const { checkoutId } = request.params as { checkoutId: string }; return { checkout: await getCheckout(auth.userId, checkoutId, "GROCERY") }; });
  app.patch("/v1/grocery/checkouts/:checkoutId/payment-method", async (request) => { const auth = await requireAuth(request); const { checkoutId } = request.params as { checkoutId: string }; const input = paymentMethodSchema.parse(request.body); return { checkout: await setCheckoutPaymentMethod(auth.userId, checkoutId, input.paymentMethod, "GROCERY") }; });
  app.post("/v1/grocery/checkouts/:checkoutId/place-order", async (request, reply) => {
    const auth = await requireAuth(request); const { checkoutId } = request.params as { checkoutId: string };
    const idempotencyKey = request.headers["idempotency-key"]?.toString().trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 160) throw new AppError("BAD_REQUEST", "A valid Idempotency-Key header is required", 400);
    const result = await withIdempotency({ scope: "grocery.place-order", key: idempotencyKey, actorId: auth.userId, requestPayload: { checkoutId }, execute: async () => ({ statusCode: 201, body: { order: await placeOrder(auth.userId, checkoutId, "GROCERY") } }) });
    if (!result.replayed) await audit({ actorUserId: auth.userId, action: "grocery.order.placed", resourceType: "ShoppingOrder", resourceId: (result.body as any).order?.id, requestId: request.id, ipAddress: request.ip });
    return reply.code(result.replayed ? 200 : result.statusCode).send(result.body);
  });

  app.get("/v1/grocery/orders", async (request) => listOrders((await requireAuth(request)).userId, "GROCERY"));
  app.get("/v1/grocery/orders/:orderId", async (request) => { const auth = await requireAuth(request); const { orderId } = request.params as { orderId: string }; return { order: await getOrder(auth.userId, orderId, "GROCERY") }; });
  app.post("/v1/grocery/orders/:orderId/cancel", async (request) => { const auth = await requireAuth(request); const { orderId } = request.params as { orderId: string }; return { order: await cancelOrder(auth.userId, orderId, "GROCERY") }; });
  app.post("/v1/grocery/orders/:orderId/issues", async (request, reply) => { const auth = await requireAuth(request); const { orderId } = request.params as { orderId: string }; return reply.code(201).send(await createGroceryIssue(auth.userId, orderId, issueSchema.parse(request.body))); });
  app.post("/v1/grocery/orders/:orderId/picker/:sessionId/messages", async (request, reply) => { const auth = await requireAuth(request); const { orderId, sessionId } = request.params as { orderId: string; sessionId: string }; return reply.code(201).send(await sendGroceryPickerMessage(auth.userId, orderId, sessionId, messageSchema.parse(request.body))); });
  app.get("/v1/grocery/orders/:orderId/picker/:sessionId/messages/:messageId/media", async (request) => {
    const auth = await requireAuth(request);
    const { orderId, sessionId, messageId } = request.params as { orderId: string; sessionId: string; messageId: string };
    const objectKey = await getGroceryPickerMessageMediaForCustomer(auth.userId, orderId, sessionId, messageId);
    return { url: presignObject({ method: "GET", objectKey, expiresSeconds: 300 }), expiresInSeconds: 300 };
  });
  app.post("/v1/grocery/orders/:orderId/replacements/:outcomeId/decision", async (request) => { const auth = await requireAuth(request); const { orderId, outcomeId } = request.params as { orderId: string; outcomeId: string }; return decideGroceryReplacement(auth.userId, orderId, outcomeId, replacementDecisionSchema.parse(request.body).decision); });

  app.get("/v1/business/grocery/orders", async (request) => { const auth = await requireAuth(request); return listBusinessGroceryOrders(auth.userId); });
  app.get("/v1/business/grocery/stores", async (request) => { const auth = await requireAuth(request); return businessGroceryStores(auth.userId); });
  app.patch("/v1/business/grocery/stores/:storeId/config", async (request) => { const auth = await requireAuth(request); const { storeId } = request.params as { storeId: string }; const organizationId = await groceryOrganizationForStore(auth.userId, storeId); await requirePermission(request, "catalog.manage", { organizationId }); return updateBusinessGroceryStore(auth.userId, storeId, storeConfigSchema.parse(request.body)); });
  app.post("/v1/business/grocery/stores/:storeId/slots", async (request, reply) => { const auth = await requireAuth(request); const { storeId } = request.params as { storeId: string }; const organizationId = await groceryOrganizationForStore(auth.userId, storeId); await requirePermission(request, "order.manage", { organizationId }); return reply.code(201).send(await createBusinessGrocerySlot(auth.userId, storeId, slotCreateSchema.parse(request.body))); });
  app.patch("/v1/business/grocery/stores/:storeId/slots/:slotId", async (request) => { const auth = await requireAuth(request); const { storeId, slotId } = request.params as { storeId: string; slotId: string }; const organizationId = await groceryOrganizationForStore(auth.userId, storeId); await requirePermission(request, "order.manage", { organizationId }); return updateBusinessGrocerySlot(auth.userId, storeId, slotId, slotUpdateSchema.parse(request.body)); });
  app.post("/v1/business/grocery/orders/:sellerOrderId/picking/start", async (request) => { const auth = await requireAuth(request); const { sellerOrderId } = request.params as { sellerOrderId: string }; const organizationId = await groceryOrganizationForSellerOrder(auth.userId, sellerOrderId); await requirePermission(request, "order.manage", { organizationId }); return startGroceryPicking(auth.userId, sellerOrderId); });
  app.get("/v1/business/grocery/orders/:sellerOrderId/replacement-options", async (request) => {
    const auth = await requireAuth(request);
    const { sellerOrderId } = request.params as { sellerOrderId: string };
    const { q = "" } = request.query as { q?: string };
    const organizationId = await groceryOrganizationForSellerOrder(auth.userId, sellerOrderId);
    await requirePermission(request, "order.manage", { organizationId });
    return businessGroceryReplacementOptions(auth.userId, sellerOrderId, String(q).slice(0, 120));
  });
  app.patch("/v1/business/grocery/orders/:sellerOrderId/items/:orderItemId/outcome", async (request) => { const auth = await requireAuth(request); const { sellerOrderId, orderItemId } = request.params as { sellerOrderId: string; orderItemId: string }; const organizationId = await groceryOrganizationForSellerOrder(auth.userId, sellerOrderId); await requirePermission(request, "order.manage", { organizationId }); return updateGroceryPickerOutcome(auth.userId, sellerOrderId, orderItemId, pickerOutcomeSchema.parse(request.body)); });
  app.post("/v1/business/grocery/orders/:sellerOrderId/picker/messages", async (request, reply) => { const auth = await requireAuth(request); const { sellerOrderId } = request.params as { sellerOrderId: string }; const organizationId = await groceryOrganizationForSellerOrder(auth.userId, sellerOrderId); await requirePermission(request, "order.manage", { organizationId }); return reply.code(201).send(await sendBusinessGroceryPickerMessage(auth.userId, sellerOrderId, messageSchema.parse(request.body))); });
  app.get("/v1/business/grocery/orders/:sellerOrderId/picker/messages/:messageId/media", async (request) => {
    const auth = await requireAuth(request);
    const { sellerOrderId, messageId } = request.params as { sellerOrderId: string; messageId: string };
    const organizationId = await groceryOrganizationForSellerOrder(auth.userId, sellerOrderId);
    await requirePermission(request, "order.read", { organizationId });
    const objectKey = await getBusinessGroceryPickerMessageMedia(auth.userId, sellerOrderId, messageId);
    return { url: presignObject({ method: "GET", objectKey, expiresSeconds: 300 }), expiresInSeconds: 300 };
  });
  app.post("/v1/business/grocery/orders/:sellerOrderId/picking/complete", async (request) => { const auth = await requireAuth(request); const { sellerOrderId } = request.params as { sellerOrderId: string }; const organizationId = await groceryOrganizationForSellerOrder(auth.userId, sellerOrderId); await requirePermission(request, "order.manage", { organizationId }); return completeGroceryPicking(auth.userId, sellerOrderId); });
}
