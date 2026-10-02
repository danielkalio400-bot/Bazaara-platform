import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { audit } from "../audit.js";
import { requireAuth, requireNativeScope } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { AppError } from "../errors.js";
import { allowedOrigins } from "../config.js";
import { withIdempotency } from "../idempotency.js";
import { claimFoodGuestCartsForUser, resolveFoodCartOwner } from "./guest-cart.js";
import {
  addFoodCartItem, cancelFoodOrder, foodHome, getFoodCart, getFoodOrder, reissueFoodDeliveryPin, getFoodRestaurant, listFoodOrders, placeFoodOrder, removeFoodCartItem, searchFood, updateFoodCartItem, updateFoodCartPreferences,
  listFoodFavorites, setFoodRestaurantFavorite, setFoodMenuItemFavorite, foodDeals, foodRecommendations, reorderFoodOrder,
  createFoodGroupOrder, joinFoodGroupOrder, updateFoodGroupAllocations, convertFoodGroupToPersonalOrder, sendFoodOrderMessage, createFoodSupportIssue, createFoodReview,
  businessFoodRestaurants, listBusinessFoodOrders, updateBusinessFoodRestaurant, updateBusinessFoodOrderStatus, setBusinessFoodMenuItemAvailability,
  upsertFoodAvailabilityWindow, createFoodPromotion, replyFoodReview, businessFoodReport, verifyFoodDeliveryPin,
  getFoodRestaurantReviews, businessFoodReviews, businessFoodIssues, updateBusinessFoodIssue, businessFoodPromotions, updateBusinessFoodPromotion, updateBusinessFoodOpeningHours, getFoodGroupOrderPreview, sendBusinessFoodOrderMessage, updateFoodCourierLocation,
  foodCapabilities, listFoodCourierOffers, acceptFoodCourierOffer, listFoodCourierDeliveries, listFoodCourierHistory, updateFoodCourierDeliveryStatus, adminFoodOverview, updateFoodRules, listFoodCommissionPolicies, createFoodCommissionPolicy, setFoodCommissionPolicyActive, adminFoodRestaurants, updateAdminFoodRestaurant, adminFoodIssues, updateAdminFoodIssue, adminFoodPromotions, createAdminFoodPromotion, updateAdminFoodPromotion, adminFoodReviews, adminFoodMenu, updateAdminFoodMenuItem,
} from "./service.js";
import { foodPaymentCapabilities, initializeFoodPayment, reconcileFoodPayment } from "./payment.js";

const queryBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

const discoveryLocationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).refine((value) => (value.latitude === undefined) === (value.longitude === undefined), "Latitude and longitude must be supplied together");

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  cuisine: z.string().trim().max(80).optional(),
  openNow: queryBoolean,
  fulfillment: z.enum(["DELIVERY", "PICKUP"]).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).refine((value) => (value.latitude === undefined) === (value.longitude === undefined), "Latitude and longitude must be supplied together");

const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(25).default(1),
  optionIds: z.array(z.string().min(1)).max(20).default([]),
  specialInstructions: z.string().trim().max(300).optional(),
});

const cartItemUpdateSchema = z.object({ quantity: z.coerce.number().int().min(0).max(99) });
const cartPreferencesSchema = z.object({
  fulfillmentType: z.enum(["DELIVERY", "PICKUP"]).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  cutleryRequired: z.boolean().optional(),
  contactless: z.boolean().optional(),
  deliveryAddress: z.record(z.string(), z.unknown()).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  tipMinor: z.coerce.number().int().min(0).max(10_000_000).optional(),
  promoCode: z.string().trim().max(40).nullable().optional(),
  isGift: z.boolean().optional(),
  recipientName: z.string().trim().max(120).nullable().optional(),
  recipientPhone: z.string().trim().max(40).nullable().optional(),
  giftMessage: z.string().trim().max(300).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "No changes supplied");

const placeOrderSchema = z.object({ paymentMethod: z.enum(["BAZAARA_PAY","PAYSTACK_CARD","PAYSTACK_BANK"]), walletPin: z.string().regex(/^\d{6}$/).optional() });
const favoriteSchema = z.object({ saved: z.boolean() });
const groupCreateSchema = z.object({ spendingLimitMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional() });
const groupJoinSchema = z.object({ displayName: z.string().trim().min(1).max(80) });
const allocationsSchema = z.object({ allocations: z.array(z.object({ memberId: z.string().min(1), amountMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable() })).max(100) });
const messageSchema = z.object({ text: z.string().trim().max(1000).nullable().optional(), mediaKey: z.string().trim().max(1000).nullable().optional() }).refine((v) => Boolean(v.text || v.mediaKey), "Message text or media is required");
const issueSchema = z.object({ type: z.enum(["MISSING_ITEM","WRONG_ITEM","QUALITY","LATE_DELIVERY","PAYMENT","OTHER"]), details: z.string().trim().min(2).max(1200), requestedRefundMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional() });
const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), foodRating: z.coerce.number().int().min(1).max(5).nullable().optional(), deliveryRating: z.coerce.number().int().min(1).max(5).nullable().optional(), text: z.string().trim().max(1200).nullable().optional(), photoKeys: z.array(z.string().trim().min(1).max(1000)).max(8).default([]) });
const restaurantOpsSchema = z.object({ acceptingOrders:z.boolean().optional(),maxActiveOrders:z.coerce.number().int().min(1).max(1000).optional(),prepTimeBufferMin:z.coerce.number().int().min(0).max(240).optional(),preorderEnabled:z.boolean().optional(),pauseUntil:z.string().datetime().nullable().optional(),deliveryEnabled:z.boolean().optional(),pickupEnabled:z.boolean().optional(),asapEnabled:z.boolean().optional(),scheduledEnabled:z.boolean().optional(),minOrderMinor:z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),deliveryFeeMinor:z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),latitude:z.coerce.number().min(-90).max(90).optional(),longitude:z.coerce.number().min(-180).max(180).optional() }).refine((v)=>Object.keys(v).length>0,"No changes supplied").refine((v)=>(v.latitude===undefined)===(v.longitude===undefined),"Latitude and longitude must be supplied together");
const foodStatusSchema = z.object({ status: z.enum(["ACCEPTED","PREPARING","READY","PICKED_UP","ON_THE_WAY","DELIVERED","CANCELLED"]) });
const itemAvailabilitySchema = z.object({ soldOut:z.boolean().optional(),active:z.boolean().optional(),prepMinutes:z.coerce.number().int().min(0).max(600).nullable().optional() }).refine((v)=>Object.keys(v).length>0,"No changes supplied");
const windowSchema = z.object({ id:z.string().min(1).optional(),dayOfWeek:z.coerce.number().int().min(0).max(6),startMinute:z.coerce.number().int().min(0).max(1439),endMinute:z.coerce.number().int().min(0).max(1439),kind:z.enum(["REGULAR","PREORDER"]).default("REGULAR"),minLeadMinutes:z.coerce.number().int().min(0).max(10080).optional(),maxAdvanceDays:z.coerce.number().int().min(1).max(60).optional(),active:z.boolean().optional() });
const promotionSchema = z.object({ code:z.string().trim().max(40).nullable().optional(),title:z.string().trim().min(1).max(120),description:z.string().trim().max(500).nullable().optional(),discountType:z.enum(["PERCENT","FIXED"]),value:z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER),minSubtotalMinor:z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),maxDiscountMinor:z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional(),fundingSource:z.enum(["MERCHANT","BAZAARA","SHARED"]).default("MERCHANT"),merchantFundingBps:z.coerce.number().int().min(0).max(10000).default(10000),startsAt:z.coerce.date(),endsAt:z.coerce.date() });
const promotionUpdateSchema = z.object({ active:z.boolean().optional(),endsAt:z.coerce.date().optional() }).refine((v)=>Object.keys(v).length>0,"No changes supplied");
const adminPromotionSchema = promotionSchema.extend({ restaurantId: z.string().min(1) });
const openingHourSchema = z.object({ dayOfWeek:z.coerce.number().int().min(0).max(6),openMinute:z.coerce.number().int().min(0).max(1439),closeMinute:z.coerce.number().int().min(0).max(1440),closed:z.boolean().default(false) });
const replySchema = z.object({ text:z.string().trim().min(1).max(1200) });
const pinSchema = z.object({ pin:z.string().regex(/^\d{4}$/) });
const issueUpdateSchema = z.object({ status: z.enum(["OPEN","INVESTIGATING","APPROVED","REJECTED","RESOLVED"]), approvedRefundMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional() });
const locationSchema = z.object({ latitude:z.coerce.number().min(-90).max(90), longitude:z.coerce.number().min(-180).max(180) });
const courierStatusSchema = z.object({ status:z.enum(["PICKED_UP","ON_THE_WAY","DELIVERED"]), latitude:z.coerce.number().min(-90).max(90).optional(), longitude:z.coerce.number().min(-180).max(180).optional() }).refine(v => (v.latitude == null) === (v.longitude == null), "Latitude and longitude must be supplied together");
const foodRulesSchema = z.object({ serviceFeeBps:z.coerce.number().int().min(0).max(3000).optional(),serviceFeeMinimumMinor:z.coerce.number().int().min(0).max(10_000_000).optional(),serviceFeeMaximumMinor:z.coerce.number().int().min(0).max(20_000_000).optional(),merchantCommissionBps:z.coerce.number().int().min(0).max(4000).optional(),goCommissionBps:z.coerce.number().int().min(0).max(3000).optional(),maxPickupDistanceMeters:z.coerce.number().int().min(500).max(30_000).optional(),maxPickupEtaSeconds:z.coerce.number().int().min(60).max(3600).optional(),pickupNearDistanceMeters:z.coerce.number().int().min(50).max(5_000).optional(),pickupArrivalDistanceMeters:z.coerce.number().int().min(20).max(1_000).optional() }).refine(v=>Object.keys(v).length>0,"No changes supplied");
const foodCommissionPolicySchema = z.object({
  scope: z.enum(["GLOBAL", "RESTAURANT"]),
  restaurantId: z.string().min(1).nullable().optional(),
  merchantCommissionBps: z.coerce.number().int().min(0).max(4000),
  effectiveFrom: z.coerce.date().default(() => new Date()),
  effectiveTo: z.coerce.date().nullable().optional(),
  reason: z.string().trim().min(3).max(500),
});
const foodAdminRestaurantSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "SUSPENDED"]).optional(),
  acceptingOrders: z.boolean().optional(),
  maxActiveOrders: z.coerce.number().int().min(1).max(1000).optional(),
  prepTimeBufferMin: z.coerce.number().int().min(0).max(240).optional(),
  pauseUntil: z.coerce.date().nullable().optional(),
}).refine(v => Object.keys(v).length > 0, "No changes supplied");


async function requireGoCourierAccess(request: FastifyRequest) {
  const auth = await requireAuth(request);
  if (auth.channel === "NATIVE") {
    requireNativeScope(auth, "logistics.courier");
    return auth;
  }
  await requirePermission(request, "courier.manage");
  return auth;
}
export async function foodRoutes(app: FastifyInstance) {
  app.get("/v1/food/capabilities", async () => foodCapabilities());
  app.get("/v1/food/home", async (request) => foodHome(discoveryLocationSchema.parse(request.query)));
  app.get("/v1/food/deals", async () => foodDeals());
  app.get("/v1/food/search", async (request) => searchFood(searchSchema.parse(request.query)));
  app.get("/v1/food/restaurants/:slug", async (request) => {
    const { slug } = request.params as { slug: string };
    return getFoodRestaurant(slug);
  });
  app.get("/v1/food/restaurants/:slug/reviews", async (request) => {
    const { slug } = request.params as { slug: string };
    return getFoodRestaurantReviews(slug);
  });

  app.get("/v1/food/restaurants/:slug/cart", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const owner = await resolveFoodCartOwner(request, reply);
    return { cart: await getFoodCart(slug, owner) };
  });

  app.post("/v1/food/restaurants/:slug/cart/items", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const owner = await resolveFoodCartOwner(request, reply);
    const input = cartItemSchema.parse(request.body);
    const cart = await addFoodCartItem(slug, owner, input);
    await audit({ actorUserId: owner.userId, action: "food.cart.item.added", resourceType: "FoodCart", resourceId: cart.id ?? undefined, requestId: request.id, ipAddress: request.ip, metadata: { guest: !owner.userId, restaurantSlug: slug } });
    return reply.code(201).send({ cart });
  });

  app.patch("/v1/food/restaurants/:slug/cart/items/:itemId", async (request, reply) => {
    const { slug, itemId } = request.params as { slug: string; itemId: string };
    const owner = await resolveFoodCartOwner(request, reply);
    const input = cartItemUpdateSchema.parse(request.body);
    return { cart: await updateFoodCartItem(slug, owner, itemId, input.quantity) };
  });

  app.delete("/v1/food/restaurants/:slug/cart/items/:itemId", async (request, reply) => {
    const { slug, itemId } = request.params as { slug: string; itemId: string };
    const owner = await resolveFoodCartOwner(request, reply);
    return { cart: await removeFoodCartItem(slug, owner, itemId) };
  });

  app.patch("/v1/food/restaurants/:slug/cart/preferences", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const owner = await resolveFoodCartOwner(request, reply);
    const input = cartPreferencesSchema.parse(request.body);
    return {
      cart: await updateFoodCartPreferences(slug, owner, {
        ...input,
        scheduledFor: input.scheduledFor === undefined ? undefined : input.scheduledFor === null ? null : new Date(input.scheduledFor),
      }),
    };
  });

  app.post("/v1/food/restaurants/:slug/orders", async (request, reply) => {
    const auth = await requireAuth(request);
    await claimFoodGuestCartsForUser(request, reply, auth.userId);
    const { slug } = request.params as { slug: string };
    const input = placeOrderSchema.parse(request.body ?? {});
    const idempotencyKey = request.headers["idempotency-key"]?.toString().trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 160) throw new AppError("BAD_REQUEST", "A valid Idempotency-Key header is required", 400);
    const result = await withIdempotency({
      scope: "food.place-order",
      key: idempotencyKey,
      actorId: auth.userId,
      requestPayload: { slug, input: { paymentMethod: input.paymentMethod, walletPinProvided: Boolean(input.walletPin) } },
      execute: async () => ({ statusCode: 201, body: { order: await placeFoodOrder(auth.userId, slug, input) } }),
    });
    if (!result.replayed) await audit({ actorUserId: auth.userId, action: "food.order.placed", resourceType: "FoodOrder", resourceId: (result.body as any).order?.id, requestId: request.id, ipAddress: request.ip, metadata: { restaurantSlug: slug } });
    return reply.code(result.replayed ? 200 : result.statusCode).send(result.body);
  });

  app.get("/v1/food/payment-capabilities", async (request) => {
    const auth = await requireAuth(request);
    return foodPaymentCapabilities(auth.userId);
  });

  app.post("/v1/food/orders/:orderId/payment/initialize", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const idempotencyKey = request.headers["idempotency-key"]?.toString().trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 160) throw new AppError("BAD_REQUEST","A valid Idempotency-Key header is required",400);
    const origin = request.headers.origin?.toString().replace(/\/$/, "");
    const returnOrigin = origin && allowedOrigins.has(origin) ? origin : undefined;
    return initializeFoodPayment({ userId: auth.userId, orderId, idempotencyKey, returnOrigin });
  });

  app.post("/v1/food/orders/:orderId/payment/reconcile", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    return reconcileFoodPayment({ userId: auth.userId, orderId });
  });

  app.get("/v1/food/orders", async (request) => {
    const auth = await requireAuth(request);
    return listFoodOrders(auth.userId);
  });

  app.get("/v1/food/orders/:orderId", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    return { order: await getFoodOrder(auth.userId, orderId) };
  });

  app.post("/v1/food/orders/:orderId/delivery-pin", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const result = await reissueFoodDeliveryPin(auth.userId, orderId);
    await audit({
      actorUserId: auth.userId,
      action: "food.delivery_pin.reissued",
      resourceType: "FoodOrder",
      resourceId: orderId,
      requestId: request.id,
      ipAddress: request.ip,
    });
    return result;
  });

  app.post("/v1/food/orders/:orderId/cancel", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const order = await cancelFoodOrder(auth.userId, orderId);
    await audit({ actorUserId: auth.userId, action: "food.order.cancelled", resourceType: "FoodOrder", resourceId: orderId, requestId: request.id, ipAddress: request.ip });
    return { order };
  });

  app.get("/v1/food/favorites", async (request) => listFoodFavorites((await requireAuth(request)).userId));
  app.put("/v1/food/restaurants/:slug/favorite", async (request) => { const auth=await requireAuth(request); const {slug}=request.params as {slug:string}; return setFoodRestaurantFavorite(auth.userId,slug,favoriteSchema.parse(request.body).saved); });
  app.put("/v1/food/menu-items/:itemId/favorite", async (request) => { const auth=await requireAuth(request); const {itemId}=request.params as {itemId:string}; return setFoodMenuItemFavorite(auth.userId,itemId,favoriteSchema.parse(request.body).saved); });
  app.get("/v1/food/recommendations", async (request) => foodRecommendations((await requireAuth(request)).userId));
  app.post("/v1/food/orders/:orderId/reorder", async (request) => { const auth=await requireAuth(request); const {orderId}=request.params as {orderId:string}; return reorderFoodOrder(auth.userId,orderId); });

  app.get("/v1/food/group-orders/:token", async (request) => { const {token}=request.params as {token:string}; return getFoodGroupOrderPreview(token); });
  app.post("/v1/food/restaurants/:slug/group-orders", async (request,reply) => { const auth=await requireAuth(request); const {slug}=request.params as {slug:string}; const input=groupCreateSchema.parse(request.body??{}); return reply.code(201).send(await createFoodGroupOrder(auth.userId,slug,input.spendingLimitMinor)); });
  app.post("/v1/food/group-orders/join/:token", async (request) => { const auth=await requireAuth(request); const {token}=request.params as {token:string}; return joinFoodGroupOrder(auth.userId,token,groupJoinSchema.parse(request.body).displayName); });
  app.patch("/v1/food/group-orders/:groupId/allocations", async (request) => { const auth=await requireAuth(request); const {groupId}=request.params as {groupId:string}; return updateFoodGroupAllocations(auth.userId,groupId,allocationsSchema.parse(request.body).allocations); });
  app.delete("/v1/food/restaurants/:slug/group-order", async (request) => { const auth=await requireAuth(request); const {slug}=request.params as {slug:string}; return convertFoodGroupToPersonalOrder(auth.userId,slug); });
  app.post("/v1/food/orders/:orderId/messages", async (request,reply) => { const auth=await requireAuth(request); const {orderId}=request.params as {orderId:string}; return reply.code(201).send(await sendFoodOrderMessage(auth.userId,orderId,messageSchema.parse(request.body))); });
  app.post("/v1/food/orders/:orderId/issues", async (request,reply) => { const auth=await requireAuth(request); const {orderId}=request.params as {orderId:string}; return reply.code(201).send(await createFoodSupportIssue(auth.userId,orderId,issueSchema.parse(request.body))); });
  app.put("/v1/food/orders/:orderId/review", async (request) => { const auth=await requireAuth(request); const {orderId}=request.params as {orderId:string}; return createFoodReview(auth.userId,orderId,reviewSchema.parse(request.body)); });
  app.post("/v1/food/orders/:orderId/verify-delivery-pin", async (request) => { const auth=await requireAuth(request); const {orderId}=request.params as {orderId:string}; return verifyFoodDeliveryPin(auth.userId,orderId,pinSchema.parse(request.body).pin); });

  app.get("/v1/go/food/offers", async (request) => { const auth=await requireGoCourierAccess(request); const location=locationSchema.parse(request.query); return listFoodCourierOffers(auth.userId,location); });
  app.post("/v1/go/food/offers/:orderId/accept", async (request) => { const auth=await requireGoCourierAccess(request); const {orderId}=request.params as {orderId:string}; return acceptFoodCourierOffer(auth.userId,orderId,locationSchema.parse(request.body)); });
  app.get("/v1/go/food/deliveries", async (request) => { const auth=await requireGoCourierAccess(request); return listFoodCourierDeliveries(auth.userId); });
  app.get("/v1/go/food/history", async (request) => { const auth=await requireGoCourierAccess(request); return listFoodCourierHistory(auth.userId); });
  app.patch("/v1/go/food/deliveries/:orderId/status", async (request) => { const auth=await requireGoCourierAccess(request); const {orderId}=request.params as {orderId:string}; const input=courierStatusSchema.parse(request.body); return updateFoodCourierDeliveryStatus(auth.userId,orderId,input.status,input.latitude==null?undefined:{latitude:input.latitude,longitude:input.longitude!}); });
  app.post("/v1/go/food/deliveries/:orderId/verify-pin", async (request) => { const auth=await requireGoCourierAccess(request); const {orderId}=request.params as {orderId:string}; return verifyFoodDeliveryPin(auth.userId,orderId,pinSchema.parse(request.body).pin); });
  app.post("/v1/go/food/deliveries/:orderId/location", async (request,reply) => { const auth=await requireGoCourierAccess(request); const {orderId}=request.params as {orderId:string}; return reply.code(201).send(await updateFoodCourierLocation(auth.userId,orderId,locationSchema.parse(request.body))); });

  app.get("/v1/admin/food/overview", async (request) => { await requirePermission(request,"operations.food.manage"); return adminFoodOverview(); });
  app.get("/v1/admin/food/restaurants", async (request) => { await requirePermission(request,"operations.food.manage"); return adminFoodRestaurants(); });
  app.patch("/v1/admin/food/restaurants/:restaurantId", async (request) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const { restaurantId } = z.object({ restaurantId: z.string().min(1) }).parse(request.params);
    const input = foodAdminRestaurantSchema.parse(request.body);
    const result = await updateAdminFoodRestaurant(restaurantId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "food.restaurant.admin_noop" : "food.restaurant.admin_updated", resourceType: "FoodRestaurant", resourceId: restaurantId, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: result.actionState } });
    return result;
  });
  app.patch("/v1/admin/food/rules", async (request) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const input = foodRulesSchema.parse(request.body);
    const result = await updateFoodRules(input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "food.rules.noop" : "food.rules.updated", resourceType: "RegionalConfig", resourceId: "food", requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: result.actionState } });
    return result;
  });
  app.get("/v1/admin/food/issues", async (request) => { await requirePermission(request,"operations.food.manage"); return adminFoodIssues(); });
  app.patch("/v1/admin/food/issues/:issueId", async (request) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const { issueId } = z.object({ issueId: z.string().min(1) }).parse(request.params);
    const input = issueUpdateSchema.parse(request.body);
    const result = await updateAdminFoodIssue(issueId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "food.issue.admin_noop" : "food.issue.admin_updated", resourceType: "FoodSupportIssue", resourceId: issueId, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: result.actionState } });
    return result;
  });
  app.get("/v1/admin/food/promotions", async (request) => { await requirePermission(request,"operations.food.manage"); return adminFoodPromotions(); });
  app.post("/v1/admin/food/promotions", async (request, reply) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const input = adminPromotionSchema.parse(request.body);
    const result = await createAdminFoodPromotion(input);
    await audit({ actorUserId: auth.userId, action: "food.promotion.admin_created", resourceType: "FoodPromotion", resourceId: result.promotion.id, requestId: request.id, ipAddress: request.ip, metadata: { restaurantId: input.restaurantId, fundingSource: input.fundingSource, discountType: input.discountType } });
    return reply.code(201).send(result);
  });
  app.patch("/v1/admin/food/promotions/:promotionId", async (request) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const { promotionId } = z.object({ promotionId: z.string().min(1) }).parse(request.params);
    const input = promotionUpdateSchema.parse(request.body);
    const result = await updateAdminFoodPromotion(promotionId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "food.promotion.admin_noop" : "food.promotion.admin_updated", resourceType: "FoodPromotion", resourceId: promotionId, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: result.actionState } });
    return result;
  });
  app.get("/v1/admin/food/reviews", async (request) => { await requirePermission(request,"operations.food.manage"); return adminFoodReviews(); });
  app.get("/v1/admin/food/restaurants/:restaurantId/menu", async (request) => {
    await requirePermission(request,"operations.food.manage");
    const { restaurantId } = z.object({ restaurantId: z.string().min(1) }).parse(request.params);
    return adminFoodMenu(restaurantId);
  });
  app.patch("/v1/admin/food/menu-items/:itemId", async (request) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const { itemId } = z.object({ itemId: z.string().min(1) }).parse(request.params);
    const input = itemAvailabilitySchema.parse(request.body);
    const result = await updateAdminFoodMenuItem(itemId, input);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "food.menu_item.admin_noop" : "food.menu_item.admin_updated", resourceType: "FoodMenuItem", resourceId: itemId, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: result.actionState } });
    return result;
  });
  app.get("/v1/admin/food/commission-policies", async (request) => { await requirePermission(request,"operations.food.manage"); return listFoodCommissionPolicies(); });
  app.post("/v1/admin/food/commission-policies", async (request, reply) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const input = foodCommissionPolicySchema.parse(request.body);
    const result = await createFoodCommissionPolicy(auth.userId, input);
    await audit({ actorUserId: auth.userId, action: "food.commission_policy.created", resourceType: "FoodCommissionPolicy", resourceId: result.policy.id, requestId: request.id, ipAddress: request.ip, metadata: { scope: input.scope, restaurantId: input.restaurantId ?? null, merchantCommissionBps: input.merchantCommissionBps, effectiveFrom: input.effectiveFrom.toISOString(), effectiveTo: input.effectiveTo?.toISOString() ?? null, reason: input.reason } });
    return reply.code(201).send(result);
  });
  app.patch("/v1/admin/food/commission-policies/:policyId", async (request) => {
    const auth = await requirePermission(request,"operations.food.manage");
    const { policyId } = z.object({ policyId: z.string().min(1) }).parse(request.params);
    const { active } = z.object({ active: z.boolean() }).parse(request.body);
    const result = await setFoodCommissionPolicyActive(policyId, active);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "food.commission_policy.noop" : active ? "food.commission_policy.activated" : "food.commission_policy.deactivated", resourceType: "FoodCommissionPolicy", resourceId: policyId, requestId: request.id, ipAddress: request.ip, metadata: { active, actionState: result.actionState } });
    return result;
  });

  app.get("/v1/business/food/restaurants", async (request) => businessFoodRestaurants((await requireAuth(request)).userId));
  app.get("/v1/business/food/orders", async (request) => listBusinessFoodOrders((await requireAuth(request)).userId));
  app.patch("/v1/business/food/restaurants/:restaurantId", async (request) => { const auth=await requireAuth(request); const {restaurantId}=request.params as {restaurantId:string}; const i=restaurantOpsSchema.parse(request.body); return updateBusinessFoodRestaurant(auth.userId,restaurantId,{...i,pauseUntil:i.pauseUntil===undefined?undefined:i.pauseUntil===null?null:new Date(i.pauseUntil)}); });
  app.patch("/v1/business/food/orders/:orderId/status", async (request) => { const auth=await requireAuth(request); const {orderId}=request.params as {orderId:string}; return updateBusinessFoodOrderStatus(auth.userId,orderId,foodStatusSchema.parse(request.body).status); });
  app.patch("/v1/business/food/menu-items/:itemId/availability", async (request) => { const auth=await requireAuth(request); const {itemId}=request.params as {itemId:string}; return setBusinessFoodMenuItemAvailability(auth.userId,itemId,itemAvailabilitySchema.parse(request.body)); });
  app.put("/v1/business/food/menu-items/:itemId/window", async (request) => { const auth=await requireAuth(request); const {itemId}=request.params as {itemId:string}; return upsertFoodAvailabilityWindow(auth.userId,itemId,windowSchema.parse(request.body)); });
  app.post("/v1/business/food/restaurants/:restaurantId/promotions", async (request,reply) => { const auth=await requireAuth(request); const {restaurantId}=request.params as {restaurantId:string}; const input=promotionSchema.parse(request.body); return reply.code(201).send(await createFoodPromotion(auth.userId,restaurantId,{...input,fundingSource:"MERCHANT",merchantFundingBps:10000})); });
  app.get("/v1/business/food/promotions", async (request) => businessFoodPromotions((await requireAuth(request)).userId));
  app.patch("/v1/business/food/promotions/:promotionId", async (request) => { const auth=await requireAuth(request); const {promotionId}=request.params as {promotionId:string}; return updateBusinessFoodPromotion(auth.userId,promotionId,promotionUpdateSchema.parse(request.body)); });
  app.put("/v1/business/food/restaurants/:restaurantId/opening-hours", async (request) => { const auth=await requireAuth(request); const {restaurantId}=request.params as {restaurantId:string}; return updateBusinessFoodOpeningHours(auth.userId,restaurantId,openingHourSchema.parse(request.body)); });
  app.post("/v1/business/food/reviews/:reviewId/reply", async (request) => { const auth=await requireAuth(request); const {reviewId}=request.params as {reviewId:string}; return replyFoodReview(auth.userId,reviewId,replySchema.parse(request.body).text); });
  app.get("/v1/business/food/restaurants/:restaurantId/report", async (request) => { const auth=await requireAuth(request); const {restaurantId}=request.params as {restaurantId:string}; return businessFoodReport(auth.userId,restaurantId); });
  app.get("/v1/business/food/reviews", async (request) => businessFoodReviews((await requireAuth(request)).userId));
  app.get("/v1/business/food/issues", async (request) => businessFoodIssues((await requireAuth(request)).userId));
  app.patch("/v1/business/food/issues/:issueId", async (request) => { const auth=await requireAuth(request); const {issueId}=request.params as {issueId:string}; return updateBusinessFoodIssue(auth.userId,issueId,issueUpdateSchema.parse(request.body)); });
  app.post("/v1/business/food/orders/:orderId/messages", async (request,reply) => { const auth=await requireAuth(request); const {orderId}=request.params as {orderId:string}; return reply.code(201).send(await sendBusinessFoodOrderMessage(auth.userId,orderId,messageSchema.parse(request.body))); });
  app.post("/v1/food/courier/orders/:orderId/location", async (request,reply) => { const auth=await requireAuth(request); requireNativeScope(auth,"logistics.courier"); const {orderId}=request.params as {orderId:string}; return reply.code(201).send(await updateFoodCourierLocation(auth.userId,orderId,locationSchema.parse(request.body))); });

}
