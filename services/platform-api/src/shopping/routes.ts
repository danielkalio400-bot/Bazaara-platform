import type { FastifyInstance } from "fastify";
import { shoppingCategoryNavigation } from "./category-navigation.js";
import { audit } from "../audit.js";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { withIdempotency } from "../idempotency.js";
import { AppError } from "../errors.js";
import {
  cartItemSchema,
  cartItemUpdateSchema,
  checkoutCreateSchema,
  checkoutPaymentMethodSchema,
  productListQuerySchema,
  returnRequestSchema,
  sellerOrderStatusSchema,
} from "./schemas.js";
import {
  addWishlistItem,
  getCart,
  getProduct,
  getSeller,
  getWishlist,
  homeCatalogue,
  dealRadar,
  listProducts,
  removeCartItem,
  removeWishlistItem,
  setCartItem,
  updateCartItem,
} from "./service.js";
import { resolveCartOwner, claimGuestCartForAuthenticatedUser } from "./guest-cart.js";
import {
  businessShoppingOrderOrganization,
  cancelOrder,
  createCheckout,
  getCheckout,
  getOrder,
  listBusinessShoppingOrders,
  listOperationalShoppingOrders,
  listOrders,
  placeOrder,
  setCheckoutPaymentMethod,
} from "./checkout.js";
import { transitionSellerOrder } from "./fulfillment.js";
import { createReturnRequest, openReturnDispute } from "./returns.js";
import { z } from "zod";

const wishlistQuerySchema = z.object({ vertical: z.enum(["SHOPPING", "GROCERY"]).optional() });
const dealRadarQuerySchema = z.object({
  minDiscountPercent: z.coerce.number().int().min(1).max(90).default(1),
  maxPriceMinor: z.coerce.number().int().min(1).max(1_000_000_000_000).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  verifiedSeller: z.enum(["true", "false"]).transform((value) => value === "true").default(false),
  sort: z.enum(["biggest_discount", "lowest_price"]).default("biggest_discount"),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export async function shoppingRoutes(app: FastifyInstance) {
  app.get("/v1/shopping/home", async () => homeCatalogue());
  app.get("/v1/shopping/deals", async (request) => dealRadar(dealRadarQuerySchema.parse(request.query)));

  app.get("/v1/shopping/categories", async () => {
    const home = await homeCatalogue();
    return { categories: home.categories };
  });

  app.get("/v1/shopping/category-navigation", async () => ({
    categories: shoppingCategoryNavigation,
  }));
  app.get("/v1/shopping/products", async (request) => {
    const input = productListQuerySchema.parse(request.query);
    return listProducts(input);
  });

  app.get("/v1/shopping/products/:slug", async (request) => {
    const { slug } = request.params as { slug: string };
    return { product: await getProduct(slug) };
  });

  app.get("/v1/shopping/sellers/:slug", async (request) => {
    const { slug } = request.params as { slug: string };
    return getSeller(slug);
  });

  app.get("/v1/shopping/cart", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    return { cart: await getCart(owner) };
  });

  app.post("/v1/shopping/cart/items", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const input = cartItemSchema.parse(request.body);
    const cart = await setCartItem(owner, input.variantId, input.quantity);
    await audit({ actorUserId: owner.userId, action: "shopping.cart.item.set", resourceType: "Cart", resourceId: cart.id ?? undefined, requestId: request.id, ipAddress: request.ip, metadata: { guest: !owner.userId } });
    return { cart };
  });

  app.patch("/v1/shopping/cart/items/:itemId", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const { itemId } = request.params as { itemId: string };
    const input = cartItemUpdateSchema.parse(request.body);
    const cart = await updateCartItem(owner, itemId, input.quantity);
    return { cart };
  });

  app.delete("/v1/shopping/cart/items/:itemId", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const { itemId } = request.params as { itemId: string };
    return { cart: await removeCartItem(owner, itemId) };
  });

  app.post("/v1/shopping/cart/items/:itemId/remove", async (request, reply) => {
    const owner = await resolveCartOwner(request, reply);
    const { itemId } = request.params as { itemId: string };
    const cart = await removeCartItem(owner, itemId);
    await audit({ actorUserId: owner.userId, action: "shopping.cart.item.removed", resourceType: "Cart", resourceId: cart.id ?? undefined, requestId: request.id, ipAddress: request.ip, metadata: { guest: !owner.userId } });
    return { cart };
  });

  app.get("/v1/shopping/wishlist", async (request) => {
    const auth = await requireAuth(request);
    const { vertical } = wishlistQuerySchema.parse(request.query);
    return getWishlist(auth.userId, vertical);
  });

  app.put("/v1/shopping/wishlist/:productId", async (request) => {
    const auth = await requireAuth(request);
    const { productId } = request.params as { productId: string };
    const body = (request.body ?? {}) as { variantId?: string };
    const { vertical } = wishlistQuerySchema.parse(request.query);
    return addWishlistItem(auth.userId, productId, typeof body.variantId === "string" ? body.variantId : undefined, vertical);
  });

  app.delete("/v1/shopping/wishlist/:productId", async (request) => {
    const auth = await requireAuth(request);
    const { productId } = request.params as { productId: string };
    const { vertical } = wishlistQuerySchema.parse(request.query);
    return removeWishlistItem(auth.userId, productId, vertical);
  });

  app.post("/v1/shopping/checkouts", async (request, reply) => {
    const auth = await requireAuth(request);
    await claimGuestCartForAuthenticatedUser(request, reply, auth.userId);
    const input = checkoutCreateSchema.parse(request.body);
    const checkout = await createCheckout(auth.userId, input.shippingAddress, { deliveryMode: input.deliveryMode, scheduledFor: input.scheduledFor });
    await audit({ actorUserId: auth.userId, action: "shopping.checkout.created", resourceType: "ShoppingCheckout", resourceId: checkout.id, requestId: request.id, ipAddress: request.ip });
    return reply.code(201).send({ checkout });
  });

  app.get("/v1/shopping/checkouts/:checkoutId", async (request) => {
    const auth = await requireAuth(request);
    const { checkoutId } = request.params as { checkoutId: string };
    return { checkout: await getCheckout(auth.userId, checkoutId) };
  });

  app.patch("/v1/shopping/checkouts/:checkoutId/payment-method", async (request) => {
    const auth = await requireAuth(request);
    const { checkoutId } = request.params as { checkoutId: string };
    const input = checkoutPaymentMethodSchema.parse(request.body);
    const checkout = await setCheckoutPaymentMethod(auth.userId, checkoutId, input.paymentMethod);
    await audit({ actorUserId: auth.userId, action: "shopping.checkout.payment-method.changed", resourceType: "ShoppingCheckout", resourceId: checkoutId, requestId: request.id, ipAddress: request.ip, metadata: { paymentMethod: input.paymentMethod } });
    return { checkout };
  });

  app.post("/v1/shopping/checkouts/:checkoutId/place-order", async (request, reply) => {
    const auth = await requireAuth(request);
    const { checkoutId } = request.params as { checkoutId: string };
    const idempotencyKey = request.headers["idempotency-key"]?.toString().trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 160) {
      throw new AppError("BAD_REQUEST", "A valid Idempotency-Key header is required", 400);
    }
    const result = await withIdempotency({
      scope: "shopping.place-order",
      key: idempotencyKey,
      actorId: auth.userId,
      requestPayload: { checkoutId },
      execute: async () => ({ statusCode: 201, body: { order: await placeOrder(auth.userId, checkoutId) } }),
    });
    if (!result.replayed) {
      await audit({ actorUserId: auth.userId, action: "shopping.order.placed", resourceType: "ShoppingOrder", resourceId: (result.body as any).order?.id, requestId: request.id, ipAddress: request.ip });
    }
    return reply.code(result.replayed ? 200 : result.statusCode).send(result.body);
  });

  app.get("/v1/shopping/orders", async (request) => {
    const auth = await requireAuth(request);
    return listOrders(auth.userId);
  });

  app.get("/v1/shopping/orders/:orderId", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    return { order: await getOrder(auth.userId, orderId) };
  });

  app.post("/v1/shopping/orders/:orderId/cancel", async (request) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const order = await cancelOrder(auth.userId, orderId);
    await audit({ actorUserId: auth.userId, action: "shopping.order.cancelled", resourceType: "ShoppingOrder", resourceId: orderId, requestId: request.id, ipAddress: request.ip });
    return { order };
  });

  app.post("/v1/shopping/orders/:orderId/returns", async (request, reply) => {
    const auth = await requireAuth(request);
    const { orderId } = request.params as { orderId: string };
    const input = returnRequestSchema.parse(request.body);
    const returnCase = await createReturnRequest(auth.userId, orderId, input);
    const order = await getOrder(auth.userId, orderId);
    await audit({ actorUserId: auth.userId, action: "shopping.return.requested", resourceType: "ShoppingReturn", resourceId: returnCase.id, requestId: request.id, ipAddress: request.ip, metadata: { orderId } });
    // Keep the historic { order } response for existing web/mobile clients while exposing the richer return case.
    return reply.code(201).send({ return: returnCase, order });
  });

  app.post("/v1/shopping/returns/:returnId/disputes", async (request, reply) => {
    const auth = await requireAuth(request);
    const { returnId } = request.params as { returnId: string };
    const input = z.object({ reason: z.string().trim().min(3).max(160), details: z.string().trim().max(1200).optional() }).parse(request.body);
    const dispute = await openReturnDispute(auth.userId, returnId, input);
    await audit({ actorUserId: auth.userId, action: "shopping.return-dispute.opened", resourceType: "ShoppingReturnDispute", resourceId: dispute.id, requestId: request.id, ipAddress: request.ip, metadata: { returnId } });
    return reply.code(201).send({ dispute });
  });

  app.get("/v1/business/shopping/orders", async (request) => {
    const auth = await requireAuth(request);
    return listBusinessShoppingOrders(auth.userId);
  });

  app.patch("/v1/business/shopping/orders/:sellerOrderId/status", async (request) => {
    const auth = await requireAuth(request);
    const { sellerOrderId } = request.params as { sellerOrderId: string };
    const organizationId = await businessShoppingOrderOrganization(auth.userId, sellerOrderId);
    await requirePermission(request, "order.manage", { organizationId });
    const input = sellerOrderStatusSchema.parse(request.body);
    const order = (await transitionSellerOrder(auth.userId, sellerOrderId, input.status)).order;
    await audit({ actorUserId: auth.userId, action: "shopping.seller-order.status.changed", resourceType: "ShoppingSellerOrder", resourceId: sellerOrderId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status } });
    return { order };
  });

  app.get("/v1/admin/shopping/orders", async (request) => {
    await requirePermission(request, "order.read");
    return listOperationalShoppingOrders();
  });
}
