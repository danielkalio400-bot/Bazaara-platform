import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { recordRiskSignal } from "../risk/service.js";

export type ReviewMediaInput = { type?: "IMAGE" | "VIDEO"; url: string; alt?: string };
export type ReviewInput = { rating: number; title?: string; body?: string; media?: ReviewMediaInput[] };
const EDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function maskedName(value: string | null | undefined) {
  const name = value?.trim();
  if (!name) return "BAZAARA customer";
  const first = Array.from(name)[0] ?? "B";
  return `${first}${"*".repeat(Math.min(5, Math.max(2, name.length - 1)))}`;
}

function publicReview(review: any) {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verifiedPurchase: review.verifiedPurchase,
    reviewer: maskedName(review.user?.displayName),
    media: (review.media ?? []).map((item: any) => ({ id: item.id, type: item.type, url: item.url, alt: item.alt })),
    merchantResponse: review.merchantResponse ? { body: review.merchantResponse.body, updatedAt: review.merchantResponse.updatedAt } : null,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

function editDeadline(createdAt = new Date()) { return new Date(createdAt.getTime() + EDIT_WINDOW_MS); }

function assertEditWindow(existing: { createdAt: Date; editDeadline: Date | null } | null) {
  if (!existing) return;
  const deadline = existing.editDeadline ?? editDeadline(existing.createdAt);
  if (deadline <= new Date()) throw new AppError("CONFLICT", "The review edit window has closed", 409);
}

function contentLooksAbusive(input: ReviewInput) {
  const body = `${input.title ?? ""} ${input.body ?? ""}`.trim();
  if (!body) return undefined;
  const urls = body.match(/https?:\/\//gi)?.length ?? 0;
  if (urls > 2) return "link_spam";
  if (/(.)\1{12,}/i.test(body)) return "repetitive_content";
  if (body.length > 80 && new Set(body.toLowerCase().replace(/\s/g, "")).size < 5) return "low_quality_repetition";
  return undefined;
}

async function duplicateBody(userId: string, body?: string, excludeId?: string) {
  const normalized = body?.trim();
  if (!normalized || normalized.length < 40) return false;
  const [product, seller] = await Promise.all([
    db.productReview.findFirst({ where: { userId, body: normalized, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }),
    db.sellerReview.findFirst({ where: { userId, body: normalized, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }),
  ]);
  return Boolean(product || seller);
}

function moderation(input: ReviewInput, duplicate: boolean) {
  const reason = contentLooksAbusive(input) ?? (duplicate ? "duplicate_content" : undefined);
  return { status: reason ? "HIDDEN" as const : "PUBLISHED" as const, moderationReason: reason ?? null };
}

const reviewInclude = {
  user: { select: { displayName: true } },
  media: { orderBy: { sortOrder: "asc" as const } },
  merchantResponse: true,
};

export async function productReviewSummary(productId: string) {
  const [aggregate, distribution] = await Promise.all([
    db.productReview.aggregate({ where: { productId, status: "PUBLISHED" }, _avg: { rating: true }, _count: { rating: true } }),
    db.productReview.groupBy({ by: ["rating"], where: { productId, status: "PUBLISHED" }, _count: { rating: true }, orderBy: { rating: "desc" } }),
  ]);
  const counts = new Map(distribution.map((row) => [row.rating, row._count.rating]));
  return { average: aggregate._avg.rating ?? 0, count: aggregate._count.rating, distribution: [5,4,3,2,1].map((rating) => ({ rating, count: counts.get(rating) ?? 0 })) };
}

export async function listProductReviews(productId: string, page = 1, limit = 20) {
  const [summary, total, reviews] = await Promise.all([
    productReviewSummary(productId),
    db.productReview.count({ where: { productId, status: "PUBLISHED" } }),
    db.productReview.findMany({ where: { productId, status: "PUBLISHED" }, include: reviewInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { summary, reviews: reviews.map(publicReview), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function upsertProductReview(userId: string, productId: string, input: ReviewInput) {
  const product = await db.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true, merchantId: true } });
  if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
  const deliveredOrder = await db.shoppingOrder.findFirst({ where: { userId, status: "DELIVERED", sellerOrders: { some: { items: { some: { productId } } } } }, orderBy: { deliveredAt: "desc" }, select: { id: true } });
  if (!deliveredOrder) throw new AppError("FORBIDDEN", "Only verified purchasers can review this product", 403);
  const existing = await db.productReview.findUnique({ where: { userId_productId: { userId, productId } }, select: { id: true, createdAt: true, editDeadline: true } });
  assertEditWindow(existing);
  const mod = moderation(input, await duplicateBody(userId, input.body, existing?.id));
  const review = await db.$transaction(async (tx) => {
    const saved = await tx.productReview.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, orderId: deliveredOrder.id, rating: input.rating, title: input.title, body: input.body, verifiedPurchase: true, editDeadline: editDeadline(), ...mod },
      update: { orderId: deliveredOrder.id, rating: input.rating, title: input.title, body: input.body, verifiedPurchase: true, ...mod },
    });
    if (input.media) {
      await tx.reviewMedia.deleteMany({ where: { productReviewId: saved.id } });
      if (input.media.length) await tx.reviewMedia.createMany({ data: input.media.map((item, index) => ({ productReviewId: saved.id, type: item.type ?? "IMAGE", url: item.url, alt: item.alt, sortOrder: index })) });
    }
    return tx.productReview.findUniqueOrThrow({ where: { id: saved.id }, include: reviewInclude });
  });
  if (mod.status === "HIDDEN") {
    await recordRiskSignal({ userId, merchantId: product.merchantId, type: "REVIEW_ABUSE_PATTERN", score: 55, explanation: "A verified-purchase product review matched an automated abuse/moderation pattern and was hidden for review.", evidence: { reviewKind: "product", productId, reviewId: review.id, moderationReason: mod.moderationReason ?? "unknown" } }).catch(() => undefined);
  }
  return { review: publicReview(review), summary: await productReviewSummary(productId), moderation: mod.status === "HIDDEN" ? { pending: true } : { pending: false } };
}

export async function sellerReviewSummary(merchantId: string) {
  const aggregate = await db.sellerReview.aggregate({ where: { merchantId, status: "PUBLISHED" }, _avg: { rating: true }, _count: { rating: true } });
  return { average: aggregate._avg.rating ?? 0, count: aggregate._count.rating };
}

export async function listSellerReviews(slug: string, page = 1, limit = 20) {
  const merchant = await db.merchant.findUnique({ where: { slug }, select: { id: true } });
  if (!merchant) throw new AppError("NOT_FOUND", "Seller not found", 404);
  const [summary, total, reviews] = await Promise.all([
    sellerReviewSummary(merchant.id),
    db.sellerReview.count({ where: { merchantId: merchant.id, status: "PUBLISHED" } }),
    db.sellerReview.findMany({ where: { merchantId: merchant.id, status: "PUBLISHED" }, include: reviewInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { summary, reviews: reviews.map(publicReview), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function upsertSellerReview(userId: string, slug: string, input: ReviewInput) {
  const merchant = await db.merchant.findUnique({ where: { slug }, select: { id: true } });
  if (!merchant) throw new AppError("NOT_FOUND", "Seller not found", 404);
  const deliveredOrder = await db.shoppingOrder.findFirst({ where: { userId, status: "DELIVERED", sellerOrders: { some: { merchantId: merchant.id } } }, orderBy: { deliveredAt: "desc" }, select: { id: true } });
  if (!deliveredOrder) throw new AppError("FORBIDDEN", "Only verified customers can review this seller", 403);
  const existing = await db.sellerReview.findUnique({ where: { userId_merchantId: { userId, merchantId: merchant.id } }, select: { id: true, createdAt: true, editDeadline: true } });
  assertEditWindow(existing);
  const mod = moderation(input, await duplicateBody(userId, input.body, existing?.id));
  const review = await db.$transaction(async (tx) => {
    const saved = await tx.sellerReview.upsert({
      where: { userId_merchantId: { userId, merchantId: merchant.id } },
      create: { userId, merchantId: merchant.id, orderId: deliveredOrder.id, rating: input.rating, title: input.title, body: input.body, verifiedPurchase: true, editDeadline: editDeadline(), ...mod },
      update: { orderId: deliveredOrder.id, rating: input.rating, title: input.title, body: input.body, verifiedPurchase: true, ...mod },
    });
    if (input.media) {
      await tx.reviewMedia.deleteMany({ where: { sellerReviewId: saved.id } });
      if (input.media.length) await tx.reviewMedia.createMany({ data: input.media.map((item, index) => ({ sellerReviewId: saved.id, type: item.type ?? "IMAGE", url: item.url, alt: item.alt, sortOrder: index })) });
    }
    return tx.sellerReview.findUniqueOrThrow({ where: { id: saved.id }, include: reviewInclude });
  });
  if (mod.status === "HIDDEN") {
    await recordRiskSignal({ userId, merchantId: merchant.id, type: "REVIEW_ABUSE_PATTERN", score: 55, explanation: "A verified customer seller review matched an automated abuse/moderation pattern and was hidden for review.", evidence: { reviewKind: "seller", merchantId: merchant.id, reviewId: review.id, moderationReason: mod.moderationReason ?? "unknown" } }).catch(() => undefined);
  }
  return { review: publicReview(review), summary: await sellerReviewSummary(merchant.id), moderation: mod.status === "HIDDEN" ? { pending: true } : { pending: false } };
}

export async function reportReview(userId: string, kind: "product" | "seller", reviewId: string, reason: string, details?: string) {
  if (kind === "product") {
    const review = await db.productReview.findUnique({ where: { id: reviewId }, select: { id: true, userId: true } });
    if (!review) throw new AppError("NOT_FOUND", "Review not found", 404);
    if (review.userId === userId) throw new AppError("BAD_REQUEST", "You cannot report your own review", 400);
    const report = await db.reviewReport.upsert({
      where: { reporterUserId_productReviewId: { reporterUserId: userId, productReviewId: reviewId } },
      create: { reporterUserId: userId, productReviewId: reviewId, reason, details }, update: { reason, details, status: "OPEN", reviewedAt: null },
    });
    return { reportId: report.id, status: report.status };
  }
  const review = await db.sellerReview.findUnique({ where: { id: reviewId }, select: { id: true, userId: true } });
  if (!review) throw new AppError("NOT_FOUND", "Review not found", 404);
  if (review.userId === userId) throw new AppError("BAD_REQUEST", "You cannot report your own review", 400);
  const report = await db.reviewReport.upsert({
    where: { reporterUserId_sellerReviewId: { reporterUserId: userId, sellerReviewId: reviewId } },
    create: { reporterUserId: userId, sellerReviewId: reviewId, reason, details }, update: { reason, details, status: "OPEN", reviewedAt: null },
  });
  return { reportId: report.id, status: report.status };
}

export async function reviewMerchantContext(kind: "product" | "seller", reviewId: string) {
  if (kind === "product") {
    const review = await db.productReview.findUnique({ where: { id: reviewId }, select: { product: { select: { merchant: { select: { id: true, organizationId: true } } } } } });
    if (!review) throw new AppError("NOT_FOUND", "Review not found", 404);
    return review.product.merchant;
  }
  const review = await db.sellerReview.findUnique({ where: { id: reviewId }, select: { merchant: { select: { id: true, organizationId: true } } } });
  if (!review) throw new AppError("NOT_FOUND", "Review not found", 404);
  return review.merchant;
}

export async function upsertMerchantReviewResponse(actorUserId: string, kind: "product" | "seller", reviewId: string, merchantId: string, body: string) {
  if (kind === "product") {
    const response = await db.reviewMerchantResponse.upsert({
      where: { productReviewId: reviewId }, create: { productReviewId: reviewId, merchantId, actorUserId, body }, update: { actorUserId, body },
    });
    return { response: { id: response.id, body: response.body, updatedAt: response.updatedAt } };
  }
  const response = await db.reviewMerchantResponse.upsert({
    where: { sellerReviewId: reviewId }, create: { sellerReviewId: reviewId, merchantId, actorUserId, body }, update: { actorUserId, body },
  });
  return { response: { id: response.id, body: response.body, updatedAt: response.updatedAt } };
}

export async function moderateReview(kind: "product" | "seller", reviewId: string, status: "PUBLISHED" | "HIDDEN" | "REMOVED", reason?: string) {
  if (kind === "product") {
    const review = await db.productReview.update({ where: { id: reviewId }, data: { status, moderationReason: reason ?? null } }).catch(() => null);
    if (!review) throw new AppError("NOT_FOUND", "Review not found", 404);
  } else {
    const review = await db.sellerReview.update({ where: { id: reviewId }, data: { status, moderationReason: reason ?? null } }).catch(() => null);
    if (!review) throw new AppError("NOT_FOUND", "Review not found", 404);
  }
  await db.reviewReport.updateMany({ where: kind === "product" ? { productReviewId: reviewId, status: "OPEN" } : { sellerReviewId: reviewId, status: "OPEN" }, data: { status: status === "PUBLISHED" ? "DISMISSED" : "ACTIONED", reviewedAt: new Date() } });
  return { id: reviewId, status };
}
