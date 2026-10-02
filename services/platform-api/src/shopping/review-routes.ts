import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { audit } from "../audit.js";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { listProductReviews, listSellerReviews, moderateReview, reportReview, reviewMerchantContext, upsertMerchantReviewResponse, upsertProductReview, upsertSellerReview } from "./reviews.js";

const mediaSchema = z.object({ type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"), url: z.string().url().refine((url) => url.startsWith("https://"), "Review media must use HTTPS"), alt: z.string().trim().max(180).optional() });
const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().max(120).optional(), body: z.string().trim().max(2000).optional(), media: z.array(mediaSchema).max(5).optional() });
const pageSchema = z.object({ page: z.coerce.number().int().min(1).max(1000).default(1), limit: z.coerce.number().int().min(1).max(50).default(20) });
const reportSchema = z.object({ reason: z.enum(["SPAM", "ABUSE", "IRRELEVANT", "MISLEADING", "PRIVACY", "OTHER"]), details: z.string().trim().max(1000).optional() });
const responseSchema = z.object({ body: z.string().trim().min(2).max(1500) });
const moderationSchema = z.object({ status: z.enum(["PUBLISHED", "HIDDEN", "REMOVED"]), reason: z.string().trim().max(500).optional() });
const kindSchema = z.enum(["product", "seller"]);

export async function shoppingReviewRoutes(app: FastifyInstance) {
  app.get("/v1/shopping/products/:productId/reviews", async (request) => {
    const { productId } = request.params as { productId: string }; const query = pageSchema.parse(request.query);
    return listProductReviews(productId, query.page, query.limit);
  });
  app.post("/v1/shopping/products/:productId/reviews", async (request, reply) => {
    const auth = await requireAuth(request); const { productId } = request.params as { productId: string }; const input = reviewSchema.parse(request.body);
    const result = await upsertProductReview(auth.userId, productId, input);
    await audit({ actorUserId: auth.userId, action: "shopping.review.product.upserted", resourceType: "Product", resourceId: productId, requestId: request.id, ipAddress: request.ip });
    return reply.code(201).send(result);
  });
  app.get("/v1/shopping/sellers/:slug/reviews", async (request) => {
    const { slug } = request.params as { slug: string }; const query = pageSchema.parse(request.query);
    return listSellerReviews(slug, query.page, query.limit);
  });
  app.post("/v1/shopping/sellers/:slug/reviews", async (request, reply) => {
    const auth = await requireAuth(request); const { slug } = request.params as { slug: string }; const input = reviewSchema.parse(request.body);
    const result = await upsertSellerReview(auth.userId, slug, input);
    await audit({ actorUserId: auth.userId, action: "shopping.review.seller.upserted", resourceType: "Merchant", resourceId: slug, requestId: request.id, ipAddress: request.ip });
    return reply.code(201).send(result);
  });
  app.post("/v1/shopping/reviews/:kind/:reviewId/report", async (request, reply) => {
    const auth = await requireAuth(request); const params = request.params as { kind: string; reviewId: string }; const kind = kindSchema.parse(params.kind); const input = reportSchema.parse(request.body);
    const result = await reportReview(auth.userId, kind, params.reviewId, input.reason, input.details);
    await audit({ actorUserId: auth.userId, action: "shopping.review.reported", resourceType: kind === "product" ? "ProductReview" : "SellerReview", resourceId: params.reviewId, requestId: request.id, ipAddress: request.ip, metadata: { reason: input.reason } });
    return reply.code(201).send(result);
  });
  app.put("/v1/business/shopping/reviews/:kind/:reviewId/response", async (request) => {
    const auth = await requireAuth(request); const params = request.params as { kind: string; reviewId: string }; const kind = kindSchema.parse(params.kind); const input = responseSchema.parse(request.body);
    const merchant = await reviewMerchantContext(kind, params.reviewId);
    await requirePermission(request, kind === "product" ? "catalog.manage" : "merchant.manage", { organizationId: merchant.organizationId });
    const result = await upsertMerchantReviewResponse(auth.userId, kind, params.reviewId, merchant.id, input.body);
    await audit({ actorUserId: auth.userId, action: "shopping.review.merchant-response.upserted", resourceType: kind === "product" ? "ProductReview" : "SellerReview", resourceId: params.reviewId, requestId: request.id, ipAddress: request.ip, metadata: { organizationId: merchant.organizationId } });
    return result;
  });
  app.patch("/v1/admin/shopping/reviews/:kind/:reviewId/moderation", async (request) => {
    await requirePermission(request, "support.manage"); const params = request.params as { kind: string; reviewId: string }; const kind = kindSchema.parse(params.kind); const input = moderationSchema.parse(request.body);
    const result = await moderateReview(kind, params.reviewId, input.status, input.reason);
    await audit({ actorUserId: request.auth?.userId, action: "shopping.review.moderated", resourceType: kind === "product" ? "ProductReview" : "SellerReview", resourceId: params.reviewId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, reason: input.reason } });
    return result;
  });
}
