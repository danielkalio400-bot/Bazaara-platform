import { randomUUID } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";

function money(value: bigint | null | undefined) {
  if (value == null) return null;
  const n = Number(value); if (!Number.isSafeInteger(n)) throw new Error("Money value exceeds safe integer range"); return n;
}
function slugify(value: string) { return value.trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `product-${randomUUID().slice(0, 8)}`; }

export type CatalogVariantInput = { id?: string; sku: string; title: string; attributes?: unknown; priceMinor: number; compareAtPriceMinor?: number | null; currency?: string; active?: boolean };
export type CatalogProductInput = { slug?: string; title: string; shortDescription?: string | null; description: string; categoryId: string; brandId?: string | null; currency?: string; priceMinor: number; compareAtPriceMinor?: number | null; status?: "DRAFT" | "ACTIVE" | "ARCHIVED"; featured?: boolean; variants: CatalogVariantInput[]; media?: Array<{ type?: "IMAGE" | "VIDEO"; url: string; alt: string; sortOrder?: number }> };

async function merchantForUser(userId: string, merchantId: string) {
  const merchant = await db.merchant.findFirst({ where: { id: merchantId, vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } }, include: { organization: true, stores: { orderBy: { createdAt: "asc" } } } });
  if (!merchant) throw new AppError("NOT_FOUND", "Shopping merchant not found", 404);
  return merchant;
}

export async function businessShoppingContext(userId: string) {
  const merchants = await db.merchant.findMany({
    where: { vertical: "SHOPPING", organization: { members: { some: { userId, status: "ACTIVE" } } } },
    include: { organization: true, stores: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "asc" },
  });
  const [categories, brands] = await Promise.all([db.category.findMany({ where: { active: true }, select: { id: true, slug: true, name: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), db.brand.findMany({ select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } })]);
  return { merchants: merchants.map((merchant) => ({ id: merchant.id, slug: merchant.slug, organizationId: merchant.organizationId, name: merchant.organization.displayName, verified: Boolean(merchant.verifiedAt), stores: merchant.stores.map((store) => ({ id: store.id, name: store.name, status: store.status, timezone: store.timezone, fulfillmentModes: store.fulfillmentModes })) })), categories, brands };
}

const productInclude = {
  category: true, brand: true, media: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { createdAt: "asc" as const }, include: { inventoryItems: { include: { store: { select: { id: true, name: true, status: true, fulfillmentModes: true } } } } } },
} satisfies Prisma.ProductInclude;

function serializeManagedProduct(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
  return { id: product.id, slug: product.slug, title: product.title, shortDescription: product.shortDescription, description: product.description, status: product.status, currency: product.currency, priceMinor: money(product.priceMinor), compareAtPriceMinor: money(product.compareAtPriceMinor), featured: product.featured, category: { id: product.category.id, slug: product.category.slug, name: product.category.name }, brand: product.brand ? { id: product.brand.id, slug: product.brand.slug, name: product.brand.name } : null, media: product.media, variants: product.variants.map((variant) => ({ id: variant.id, sku: variant.sku, title: variant.title, attributes: variant.attributes, priceMinor: money(variant.priceMinor), compareAtPriceMinor: money(variant.compareAtPriceMinor), currency: variant.currency, active: variant.active, inventory: variant.inventoryItems.map((item) => ({ id: item.id, store: item.store, quantityOnHand: item.quantityOnHand, quantityReserved: item.quantityReserved, availableQuantity: Math.max(0, item.quantityOnHand - item.quantityReserved), lowStockThreshold: item.lowStockThreshold })) })), updatedAt: product.updatedAt };
}

export async function listManagedProducts(userId: string, merchantId: string, query?: string) {
  await merchantForUser(userId, merchantId);
  const products = await db.product.findMany({ where: { merchantId, ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { variants: { some: { sku: { contains: query, mode: "insensitive" } } } }] } : {}) }, include: productInclude, orderBy: { updatedAt: "desc" }, take: 500 });
  return { products: products.map(serializeManagedProduct) };
}

async function uniqueSlug(tx: Prisma.TransactionClient, requested: string | undefined, title: string, excludeId?: string) {
  const base = slugify(requested || title); let slug = base;
  for (let suffix = 2; suffix < 1000; suffix += 1) { const existing = await tx.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }); if (!existing) return slug; slug = `${base.slice(0, 70)}-${suffix}`; }
  return `${base.slice(0, 65)}-${randomUUID().slice(0, 8)}`;
}

async function validateReferences(tx: Prisma.TransactionClient, merchantId: string, input: CatalogProductInput) {
  const [category, brand] = await Promise.all([tx.category.findFirst({ where: { id: input.categoryId, active: true }, select: { id: true } }), input.brandId ? tx.brand.findUnique({ where: { id: input.brandId }, select: { id: true } }) : Promise.resolve(null)]);
  if (!category) throw new AppError("BAD_REQUEST", "Select a valid active category", 400); if (input.brandId && !brand) throw new AppError("BAD_REQUEST", "Select a valid brand", 400);
  if (!input.variants.length) throw new AppError("BAD_REQUEST", "At least one SKU variant is required", 400);
  if (new Set(input.variants.map((v) => v.sku.trim().toUpperCase())).size !== input.variants.length) throw new AppError("BAD_REQUEST", "SKU values must be unique within the product", 400);
  const skus = input.variants.map((v) => v.sku.trim().toUpperCase());
  const existingSku = await tx.productVariant.findFirst({ where: { sku: { in: skus }, product: { merchantId: { not: merchantId } } }, select: { sku: true } });
  if (existingSku) throw new AppError("CONFLICT", `SKU ${existingSku.sku} is already in use`, 409);
}

async function createProductTx(tx: Prisma.TransactionClient, merchantId: string, input: CatalogProductInput) {
  await validateReferences(tx, merchantId, input); const slug = await uniqueSlug(tx, input.slug, input.title);
  return tx.product.create({ data: { merchantId, categoryId: input.categoryId, brandId: input.brandId ?? null, slug, title: input.title, shortDescription: input.shortDescription ?? null, description: input.description, status: input.status ?? "DRAFT", currency: input.currency ?? "NGN", priceMinor: BigInt(input.priceMinor), compareAtPriceMinor: input.compareAtPriceMinor == null ? null : BigInt(input.compareAtPriceMinor), featured: input.featured ?? false, variants: { create: input.variants.map((variant) => ({ sku: variant.sku.trim().toUpperCase(), title: variant.title, attributes: variant.attributes as Prisma.InputJsonValue | undefined, priceMinor: BigInt(variant.priceMinor), compareAtPriceMinor: variant.compareAtPriceMinor == null ? null : BigInt(variant.compareAtPriceMinor), currency: variant.currency ?? input.currency ?? "NGN", active: variant.active ?? true })) }, media: input.media?.length ? { create: input.media.map((media, index) => ({ type: media.type ?? "IMAGE", url: media.url, alt: media.alt, sortOrder: media.sortOrder ?? index })) } : undefined }, include: productInclude });
}

export async function createManagedProduct(userId: string, merchantId: string, input: CatalogProductInput) { await merchantForUser(userId, merchantId); const product = await db.$transaction((tx) => createProductTx(tx, merchantId, input)); return { product: serializeManagedProduct(product) }; }

export async function updateManagedProduct(userId: string, merchantId: string, productId: string, input: Omit<CatalogProductInput, "variants"> & { variants?: CatalogVariantInput[] }) {
  await merchantForUser(userId, merchantId); const existing = await db.product.findFirst({ where: { id: productId, merchantId }, select: { id: true } }); if (!existing) throw new AppError("NOT_FOUND", "Product not found", 404);
  const product = await db.$transaction(async (tx) => { const slug = await uniqueSlug(tx, input.slug, input.title, productId); const updated = await tx.product.update({ where: { id: productId }, data: { categoryId: input.categoryId, brandId: input.brandId ?? null, slug, title: input.title, shortDescription: input.shortDescription ?? null, description: input.description, status: input.status, currency: input.currency, priceMinor: BigInt(input.priceMinor), compareAtPriceMinor: input.compareAtPriceMinor == null ? null : BigInt(input.compareAtPriceMinor), featured: input.featured } }); if (input.media) { await tx.productMedia.deleteMany({ where: { productId } }); if (input.media.length) await tx.productMedia.createMany({ data: input.media.map((media, index) => ({ productId, type: media.type ?? "IMAGE", url: media.url, alt: media.alt, sortOrder: media.sortOrder ?? index })) }); } return tx.product.findUniqueOrThrow({ where: { id: updated.id }, include: productInclude }); });
  return { product: serializeManagedProduct(product) };
}

export async function createManagedVariant(userId: string, merchantId: string, productId: string, input: CatalogVariantInput) {
  await merchantForUser(userId, merchantId); const product = await db.product.findFirst({ where: { id: productId, merchantId }, select: { id: true, currency: true } }); if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
  const variant = await db.productVariant.create({ data: { productId, sku: input.sku.trim().toUpperCase(), title: input.title, attributes: input.attributes as Prisma.InputJsonValue | undefined, priceMinor: BigInt(input.priceMinor), compareAtPriceMinor: input.compareAtPriceMinor == null ? null : BigInt(input.compareAtPriceMinor), currency: input.currency ?? product.currency, active: input.active ?? true } }); return { variant: { ...variant, priceMinor: money(variant.priceMinor), compareAtPriceMinor: money(variant.compareAtPriceMinor) } };
}

export async function updateManagedVariant(userId: string, merchantId: string, productId: string, variantId: string, input: CatalogVariantInput) {
  await merchantForUser(userId, merchantId); const variant = await db.productVariant.findFirst({ where: { id: variantId, productId, product: { merchantId } }, select: { id: true } }); if (!variant) throw new AppError("NOT_FOUND", "Variant not found", 404);
  const saved = await db.productVariant.update({ where: { id: variantId }, data: { sku: input.sku.trim().toUpperCase(), title: input.title, attributes: input.attributes as Prisma.InputJsonValue | undefined, priceMinor: BigInt(input.priceMinor), compareAtPriceMinor: input.compareAtPriceMinor == null ? null : BigInt(input.compareAtPriceMinor), currency: input.currency, active: input.active } }); return { variant: { ...saved, priceMinor: money(saved.priceMinor), compareAtPriceMinor: money(saved.compareAtPriceMinor) } };
}

export async function adjustInventory(userId: string, merchantId: string, variantId: string, storeId: string, delta: number, reason: string, note?: string) {
  await merchantForUser(userId, merchantId);
  return db.$transaction(async (tx) => { const [store, variant] = await Promise.all([tx.store.findFirst({ where: { id: storeId, merchantId }, select: { id: true } }), tx.productVariant.findFirst({ where: { id: variantId, product: { merchantId } }, select: { id: true } })]); if (!store || !variant) throw new AppError("NOT_FOUND", "Store or SKU not found", 404); const current = await tx.inventoryItem.upsert({ where: { storeId_variantId: { storeId, variantId } }, create: { storeId, variantId, quantityOnHand: 0 }, update: {} }); const next = current.quantityOnHand + delta; if (next < current.quantityReserved) throw new AppError("CONFLICT", "Stock cannot be reduced below reserved quantity", 409); if (next < 0) throw new AppError("CONFLICT", "Stock cannot be negative", 409); const updated = await tx.inventoryItem.update({ where: { id: current.id }, data: { quantityOnHand: next } }); const adjustment = await tx.inventoryAdjustment.create({ data: { storeId, variantId, inventoryItemId: current.id, actorUserId: userId, quantityBefore: current.quantityOnHand, quantityAfter: updated.quantityOnHand, delta, reason, note } }); return { inventory: { id: updated.id, quantityOnHand: updated.quantityOnHand, quantityReserved: updated.quantityReserved, availableQuantity: Math.max(0, updated.quantityOnHand - updated.quantityReserved) }, adjustment: { id: adjustment.id, delta, reason, createdAt: adjustment.createdAt } }; });
}

export async function setStoreFulfillment(userId: string, merchantId: string, storeId: string, modes: string[]) { await merchantForUser(userId, merchantId); const store = await db.store.findFirst({ where: { id: storeId, merchantId } }); if (!store) throw new AppError("NOT_FOUND", "Store not found", 404); const saved = await db.store.update({ where: { id: storeId }, data: { fulfillmentModes: [...new Set(modes.map((value) => value.toUpperCase()))] } }); return { store: { id: saved.id, fulfillmentModes: saved.fulfillmentModes } }; }

export async function bulkImportProducts(userId: string, merchantId: string, products: CatalogProductInput[]) { await merchantForUser(userId, merchantId); const created = await db.$transaction(async (tx) => { const output = []; for (const input of products) output.push(await createProductTx(tx, merchantId, input)); return output; }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); return { imported: created.length, products: created.map(serializeManagedProduct) }; }

export async function listMerchantPromotions(userId: string, merchantId: string) {
  await merchantForUser(userId, merchantId); const rows = await db.promotion.findMany({ where: { merchantId }, include: { applications: { where: { status: "CONSUMED" }, select: { discountMinor: true } } }, orderBy: { createdAt: "desc" } });
  return { promotions: rows.map((row) => ({ id: row.id, code: row.activation === "CODE" ? row.code : null, name: row.name, description: row.description, type: row.type, scope: row.scope, status: row.status, activation: row.activation, priority: row.priority, percentOff: row.percentOff, amountOffMinor: money(row.amountOffMinor), maxDiscountMinor: money(row.maxDiscountMinor), minimumSubtotalMinor: money(row.minimumSubtotalMinor), budgetMinor: money(row.budgetMinor), spentMinor: money(row.applications.reduce((sum, item) => sum + item.discountMinor, 0n)), usageLimit: row.usageLimit, usageCount: row.applications.length, perUserLimit: row.perUserLimit, firstOrderOnly: row.firstOrderOnly, customerSegments: row.customerSegments, eligibleCountries: row.eligibleCountries, eligibleRegions: row.eligibleRegions, excludedProductIds: row.excludedProductIds, excludedCategoryIds: row.excludedCategoryIds, excludedMerchantIds: row.excludedMerchantIds, allowStacking: row.allowStacking, stackGroup: row.stackGroup, fraudRules: row.fraudRules, categoryId: row.categoryId, productId: row.productId, startsAt: row.startsAt, endsAt: row.endsAt })) };
}

export type PromotionManageInput = { code?: string; name: string; description?: string; type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DELIVERY"; scope: "PLATFORM" | "CATEGORY" | "PRODUCT" | "SELLER"; status?: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED"; activation?: "CODE" | "AUTOMATIC"; priority?: number; percentOff?: number | null; amountOffMinor?: number | null; maxDiscountMinor?: number | null; minimumSubtotalMinor?: number; budgetMinor?: number | null; usageLimit?: number | null; perUserLimit?: number; firstOrderOnly?: boolean; customerSegments?: string[]; eligibleCountries?: string[]; eligibleRegions?: string[]; excludedProductIds?: string[]; excludedCategoryIds?: string[]; excludedMerchantIds?: string[]; allowStacking?: boolean; stackGroup?: string | null; fraudRules?: unknown; categoryId?: string | null; productId?: string | null; startsAt: Date; endsAt: Date };

async function promotionData(merchantId: string, input: PromotionManageInput, existingCode?: string) {
  if (input.endsAt <= input.startsAt) throw new AppError("BAD_REQUEST", "Campaign end must be after start", 400); if (input.type === "PERCENTAGE" && (!input.percentOff || input.percentOff < 1 || input.percentOff > 100)) throw new AppError("BAD_REQUEST", "Percentage discount must be between 1 and 100", 400); if (input.type === "FIXED_AMOUNT" && (!input.amountOffMinor || input.amountOffMinor < 1)) throw new AppError("BAD_REQUEST", "Flat discount amount is required", 400);
  if (input.scope === "PRODUCT" && input.productId) { const owned = await db.product.findFirst({ where: { id: input.productId, merchantId }, select: { id: true } }); if (!owned) throw new AppError("BAD_REQUEST", "Promotion product must belong to this merchant", 400); }
  const activation = input.activation ?? "CODE"; const code = activation === "AUTOMATIC" ? (existingCode ?? `AUTO-${merchantId.slice(-6).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`) : input.code?.trim().toUpperCase(); if (!code) throw new AppError("BAD_REQUEST", "Promo code is required for code campaigns", 400);
  return { code, name: input.name, description: input.description, type: input.type, scope: input.scope === "PLATFORM" ? "SELLER" as const : input.scope, status: input.status ?? "DRAFT", activation, priority: input.priority ?? 100, percentOff: input.percentOff, amountOffMinor: input.amountOffMinor == null ? null : BigInt(input.amountOffMinor), maxDiscountMinor: input.maxDiscountMinor == null ? null : BigInt(input.maxDiscountMinor), minimumSubtotalMinor: BigInt(input.minimumSubtotalMinor ?? 0), budgetMinor: input.budgetMinor == null ? null : BigInt(input.budgetMinor), usageLimit: input.usageLimit, perUserLimit: input.perUserLimit ?? 1, firstOrderOnly: input.firstOrderOnly ?? false, customerSegments: input.customerSegments ?? [], eligibleCountries: (input.eligibleCountries ?? []).map((v) => v.toUpperCase()), eligibleRegions: (input.eligibleRegions ?? []).map((v) => v.toUpperCase()), excludedProductIds: input.excludedProductIds ?? [], excludedCategoryIds: input.excludedCategoryIds ?? [], excludedMerchantIds: input.excludedMerchantIds ?? [], allowStacking: input.allowStacking ?? false, stackGroup: input.stackGroup, fraudRules: input.fraudRules as Prisma.InputJsonValue | undefined, categoryId: input.scope === "CATEGORY" ? input.categoryId : null, productId: input.scope === "PRODUCT" ? input.productId : null, merchantId, startsAt: input.startsAt, endsAt: input.endsAt };
}

export async function createMerchantPromotion(userId: string, merchantId: string, input: PromotionManageInput) { await merchantForUser(userId, merchantId); const row = await db.promotion.create({ data: await promotionData(merchantId, input) }); return { promotion: { id: row.id, code: row.activation === "CODE" ? row.code : null, status: row.status } }; }
export async function updateMerchantPromotion(userId: string, merchantId: string, promotionId: string, input: PromotionManageInput) { await merchantForUser(userId, merchantId); const existing = await db.promotion.findFirst({ where: { id: promotionId, merchantId } }); if (!existing) throw new AppError("NOT_FOUND", "Promotion not found", 404); const row = await db.promotion.update({ where: { id: promotionId }, data: await promotionData(merchantId, input, existing.code) }); return { promotion: { id: row.id, code: row.activation === "CODE" ? row.code : null, status: row.status } }; }

export async function merchantOrganization(userId: string, merchantId: string) { const merchant = await merchantForUser(userId, merchantId); return { merchantId: merchant.id, organizationId: merchant.organizationId }; }
