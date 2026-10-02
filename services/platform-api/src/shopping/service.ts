import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { curateShoppingHome } from "./home-curation.js";
import { curateDealRadar, type RadarOptions } from "./deal-radar.js";

function moneyToNumber(value: bigint | null | undefined) {
  if (value == null) return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error("Money value exceeds safe JSON integer range");
  return number;
}

function availableFromInventory(items: Array<{ quantityOnHand: number; quantityReserved: number }>) {
  return items.reduce((total, item) => total + Math.max(0, item.quantityOnHand - item.quantityReserved), 0);
}

export function productSummary(product: any) {
  const primary = product.media?.[0] ?? null;
  const available = (product.variants ?? []).reduce(
    (total: number, variant: any) => total + availableFromInventory(variant.inventoryItems ?? []),
    0,
  );
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortDescription: product.shortDescription,
    currency: product.currency,
    // Price is NOT NULL in Prisma; make that invariant explicit in the API type.
    priceMinor: moneyToNumber(product.priceMinor)!,
    compareAtPriceMinor: moneyToNumber(product.compareAtPriceMinor),
    featured: product.featured,
    image: primary ? { url: primary.url, alt: primary.alt } : null,
    category: product.category ? { slug: product.category.slug, name: product.category.name } : null,
    brand: product.brand ? { slug: product.brand.slug, name: product.brand.name } : null,
    seller: product.merchant ? {
      slug: product.merchant.slug,
      name: product.merchant.organization.displayName,
      verified: Boolean(product.merchant.verifiedAt),
      vertical: product.merchant.vertical,
    } : null,
    stock: available > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
    availableQuantity: available,
    fulfillmentModes: [...new Set((product.variants ?? []).flatMap((variant: any) =>
      (variant.inventoryItems ?? []).flatMap((item: any) =>
        item.store?.status === "ACTIVE" ? (item.store.fulfillmentModes ?? []) : []
      )
    ))].sort(),
    defaultVariantId: product.variants?.find((variant: any) => availableFromInventory(variant.inventoryItems ?? []) > 0)?.id ?? product.variants?.[0]?.id ?? null,
  };
}

const summaryInclude = {
  media: { where: { type: "IMAGE" as const }, orderBy: { sortOrder: "asc" as const }, take: 1 },
  category: true,
  brand: true,
  merchant: { include: { organization: true } },
  variants: { where: { active: true }, orderBy: { createdAt: "asc" as const }, select: { id: true, inventoryItems: { select: { quantityOnHand: true, quantityReserved: true, store: { select: { status: true, fulfillmentModes: true } } } } } },
} satisfies Prisma.ProductInclude;

export async function homeCatalogue() {
  // The previous home only loaded FEATURED products, leaving a functioning
  // marketplace looking empty whenever merchants had not promoted listings.
  // Populate each shelf exclusively from actual active Shopping records.
  const shoppingWhere = { status: "ACTIVE" as const, merchant: { vertical: "SHOPPING" as const } };
  const [categories, featuredRows, newestRows, offerRows] = await Promise.all([
    db.category.findMany({ where: { active: true, parentId: null, slug: { not: "grocery" } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 12 }),
    db.product.findMany({ where: { ...shoppingWhere, featured: true }, include: summaryInclude, orderBy: { updatedAt: "desc" }, take: 12 }),
    db.product.findMany({ where: shoppingWhere, include: summaryInclude, orderBy: { createdAt: "desc" }, take: 24 }),
    db.product.findMany({ where: { ...shoppingWhere, compareAtPriceMinor: { not: null } }, include: summaryInclude, orderBy: { updatedAt: "desc" }, take: 40 }),
  ]);
  const toSummary = (rows: typeof newestRows) => rows.map(productSummary);
  const curated = curateShoppingHome(
    toSummary(featuredRows), toSummary(newestRows), toSummary(offerRows),
  );
  return {
    categories: categories.map(({ id, slug, name, description }) => ({ id, slug, name, description })),
    ...curated,
  };
}

/** Scans the latest 400 discounted active Shopping listings; never invents discounts or stock. */
export async function dealRadar(input: RadarOptions & { page: number; limit: number }) {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    compareAtPriceMinor: { not: null },
    priceMinor: { gt: 0n, ...(input.maxPriceMinor !== undefined ? { lte: BigInt(input.maxPriceMinor) } : {}) },
    merchant: { vertical: "SHOPPING", ...(input.verifiedSeller ? { verifiedAt: { not: null } } : {}) },
    ...(input.category ? { category: { slug: input.category } } : {}),
  };
  // A bounded recent scan keeps query costs predictable. We expose truncation explicitly.
  const rows = await db.product.findMany({
    where, include: summaryInclude, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 401,
  });
  // Only inventory at active stores is purchasable; the generic summary can include
  // inactive-store inventory, so recalculate available units for this in-stock hub.
  const activeUnits = (items: typeof rows[number]["variants"][number]["inventoryItems"]) =>
    items.reduce((total, item) => item.store?.status === "ACTIVE"
      ? total + Math.max(0, item.quantityOnHand - item.quantityReserved) : total, 0);
  const candidates = rows.slice(0, 400).map((row) => {
    const availableQuantity = row.variants.reduce((total, variant) => total + activeUnits(variant.inventoryItems), 0);
    return {
      ...productSummary(row),
      availableQuantity,
      stock: availableQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      defaultVariantId: row.variants.find((variant) => activeUnits(variant.inventoryItems) > 0)?.id ?? null,
    };
  });
  const matching = curateDealRadar(candidates, input);
  const offset = (input.page - 1) * input.limit;
  return {
    offers: matching.slice(offset, offset + input.limit),
    pagination: {
      page: input.page, limit: input.limit, totalWithinScan: matching.length,
      pagesWithinScan: Math.max(1, Math.ceil(matching.length / input.limit)),
    },
    scanned: candidates.length,
    moreRecentCandidatesExist: rows.length > 400,
    pricingNote: "Savings compare each seller's current price with their advertised compare-at price; this is not independently verified price history.",
  };
}

export async function listProducts(input: {
  q?: string;
  category?: string;
  seller?: string;
  vertical?: string;
  sort: "featured" | "newest" | "price_asc" | "price_desc";
  page: number;
  limit: number;
}) {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(input.category ? { category: { slug: input.category } } : {}),
    ...((input.seller || input.vertical) ? { merchant: { ...(input.seller ? { slug: input.seller } : {}), ...(input.vertical ? { vertical: input.vertical } : {}) } } : {}),
    ...(input.q ? {
      OR: [
        { title: { contains: input.q, mode: "insensitive" } },
        { shortDescription: { contains: input.q, mode: "insensitive" } },
        { description: { contains: input.q, mode: "insensitive" } },
        { brand: { name: { contains: input.q, mode: "insensitive" } } },
      ],
    } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = input.sort === "newest"
    ? [{ createdAt: "desc" }]
    : input.sort === "price_asc"
      ? [{ priceMinor: "asc" }]
      : input.sort === "price_desc"
        ? [{ priceMinor: "desc" }]
        : [{ featured: "desc" }, { updatedAt: "desc" }];

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, include: summaryInclude, orderBy, skip: (input.page - 1) * input.limit, take: input.limit }),
  ]);

  return {
    products: products.map(productSummary),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
}

export async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      category: true,
      brand: true,
      merchant: { include: { organization: true } },
      variants: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        include: { inventoryItems: { select: { quantityOnHand: true, quantityReserved: true, store: { select: { status: true, fulfillmentModes: true } } } } },
      },
    },
  });
  if (!product || product.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Product not found", 404);
  return {
    ...productSummary(product),
    description: product.description,
    media: product.media.map((item) => ({ id: item.id, type: item.type, url: item.url, alt: item.alt })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      title: variant.title,
      attributes: variant.attributes,
      currency: variant.currency,
      priceMinor: moneyToNumber(variant.priceMinor),
      compareAtPriceMinor: moneyToNumber(variant.compareAtPriceMinor),
      availableQuantity: availableFromInventory(variant.inventoryItems),
    })),
  };
}

export async function getSeller(slug: string) {
  const merchant = await db.merchant.findUnique({
    where: { slug },
    include: {
      organization: true,
      products: { where: { status: "ACTIVE" }, include: summaryInclude, orderBy: [{ featured: "desc" }, { updatedAt: "desc" }], take: 48 },
    },
  });
  if (!merchant || !["SHOPPING", "GROCERY"].includes(merchant.vertical)) throw new AppError("NOT_FOUND", "Seller not found", 404);
  return {
    seller: {
      slug: merchant.slug,
      name: merchant.organization.displayName,
      verified: Boolean(merchant.verifiedAt),
      vertical: merchant.vertical,
      country: merchant.organization.country,
      products: merchant.products.map(productSummary),
    },
  };
}

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          inventoryItems: { select: { quantityOnHand: true, quantityReserved: true, store: { select: { status: true, fulfillmentModes: true } } } },
          product: {
            include: {
              media: { where: { type: "IMAGE" as const }, orderBy: { sortOrder: "asc" as const }, take: 1 },
              merchant: { include: { organization: true } },
            },
          },
        },
      },
      groceryPreference: { include: { replacementVariant: { include: { product: { include: { merchant: true } } } } } },
    },
  },
} satisfies Prisma.CartInclude;

function serializeCart(cart: any) {
  const items = cart.items.map((item: any) => {
    const unitPriceMinor = moneyToNumber(item.variant.priceMinor) ?? 0;
    const availableQuantity = availableFromInventory(item.variant.inventoryItems);
    const fulfillmentModes = ["STANDARD", "EXPRESS", "SCHEDULED"].filter((mode) => {
      const availableForMode = item.variant.inventoryItems.reduce((total: number, inventory: any) => {
        if (inventory.store?.status !== "ACTIVE") return total;
        const modes = (inventory.store.fulfillmentModes ?? []).map((value: string) => value.toUpperCase());
        const supports = mode === "STANDARD" ? modes.length === 0 || modes.includes("STANDARD") : modes.includes(mode);
        return supports ? total + Math.max(0, inventory.quantityOnHand - inventory.quantityReserved) : total;
      }, 0);
      return availableForMode >= item.quantity;
    });
    return {
      id: item.id,
      quantity: item.quantity,
      availableQuantity,
      fulfillmentModes,
      unitPriceMinor,
      lineTotalMinor: unitPriceMinor * item.quantity,
      variant: { id: item.variant.id, title: item.variant.title, sku: item.variant.sku, attributes: item.variant.attributes },
      product: {
        id: item.variant.product.id,
        slug: item.variant.product.slug,
        title: item.variant.product.title,
        image: item.variant.product.media[0] ?? null,
      },
      seller: {
        slug: item.variant.product.merchant.slug,
        name: item.variant.product.merchant.organization.displayName,
      },
      groceryPreference: item.groceryPreference ? {
        substitutionPolicy: item.groceryPreference.substitutionPolicy,
        replacementVariantId: item.groceryPreference.replacementVariantId,
        pickerNote: item.groceryPreference.pickerNote,
        maxPriceIncreasePercent: item.groceryPreference.maxPriceIncreasePercent,
      } : null,
    };
  });
  return {
    id: cart.id,
    vertical: cart.vertical ?? "SHOPPING",
    currency: cart.currency,
    items,
    itemCount: items.reduce((total: number, item: any) => total + item.quantity, 0),
    subtotalMinor: items.reduce((total: number, item: any) => total + item.lineTotalMinor, 0),
    updatedAt: cart.updatedAt,
  };
}

export type CartOwner = { userId?: string; guestTokenHash?: string };
export type CommerceVertical = "SHOPPING" | "GROCERY";

function cartOwnerWhere(owner: CartOwner): Prisma.CartWhereInput {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestTokenHash) return { guestTokenHash: owner.guestTokenHash };
  throw new Error("Cart owner is required");
}

async function activeCart(owner: CartOwner, vertical: CommerceVertical = "SHOPPING") {
  if (vertical === "GROCERY" && owner.userId) {
    const membership = await db.groceryGroupCartMember.findFirst({
      where: {
        userId: owner.userId,
        status: "ACTIVE",
        groupCart: { status: "OPEN", expiresAt: { gt: new Date() }, cart: { status: "ACTIVE", vertical: "GROCERY" } },
      },
      orderBy: { updatedAt: "desc" },
      select: { groupCart: { select: { cartId: true } } },
    });
    if (membership?.groupCart.cartId) {
      const shared = await db.cart.findFirst({ where: { id: membership.groupCart.cartId, vertical: "GROCERY", status: "ACTIVE" }, include: cartInclude });
      if (shared) return shared;
    }
  }
  return db.cart.findFirst({
    where: { ...cartOwnerWhere(owner), vertical, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: cartInclude,
  });
}

function cartCreateOwner(owner: CartOwner): Pick<Prisma.CartUncheckedCreateInput, "userId" | "guestTokenHash"> {
  if (owner.userId) return { userId: owner.userId, guestTokenHash: null };
  if (owner.guestTokenHash) return { userId: null, guestTokenHash: owner.guestTokenHash };
  throw new Error("Cart owner is required");
}

export async function claimGuestCart(userId: string, guestTokenHash: string, vertical: CommerceVertical = "SHOPPING") {
  const guestCart = await activeCart({ guestTokenHash }, vertical);
  if (!guestCart) return getCart({ userId }, vertical);

  const userCart = await activeCart({ userId }, vertical);
  if (!userCart) {
    const claimed = await db.cart.update({
      where: { id: guestCart.id },
      data: { userId, guestTokenHash: null },
      include: cartInclude,
    });
    return serializeCart(claimed);
  }

  if (userCart.id === guestCart.id) return serializeCart(userCart);

  if (userCart.currency !== guestCart.currency) {
    await db.cart.update({
      where: { id: guestCart.id },
      data: { status: "ABANDONED", guestTokenHash: null },
    });
    return serializeCart(userCart);
  }

  return db.$transaction(async (tx) => {
    for (const guestItem of guestCart.items) {
      const available = availableFromInventory(guestItem.variant.inventoryItems);
      if (available <= 0) continue;

      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: guestItem.variantId } },
        select: { quantity: true },
      });
      const quantity = Math.min(available, (existing?.quantity ?? 0) + guestItem.quantity);
      if (quantity <= 0) continue;

      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: guestItem.variantId } },
        create: { cartId: userCart.id, variantId: guestItem.variantId, quantity },
        update: { quantity },
      });
    }

    await tx.cart.update({
      where: { id: guestCart.id },
      data: { status: "ABANDONED", guestTokenHash: null },
    });

    const merged = await tx.cart.findUniqueOrThrow({
      where: { id: userCart.id },
      include: cartInclude,
    });
    return serializeCart(merged);
  });
}

export async function getCart(owner: CartOwner, vertical: CommerceVertical = "SHOPPING") {
  const cart = await activeCart(owner, vertical);
  if (!cart) return { id: null, currency: "NGN", items: [], itemCount: 0, subtotalMinor: 0, updatedAt: null };
  return serializeCart(cart);
}

export async function setCartItem(owner: CartOwner, variantId: string, quantity: number, vertical: CommerceVertical = "SHOPPING") {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true, inventoryItems: { select: { quantityOnHand: true, quantityReserved: true } } },
  });
  if (!variant || !variant.active || variant.product.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Product option not found", 404);
  const merchant = await db.merchant.findUnique({ where: { id: variant.product.merchantId }, select: { vertical: true } });
  if (!merchant || merchant.vertical !== vertical) throw new AppError("BAD_REQUEST", `This item belongs to ${merchant?.vertical ?? "another"} and cannot be added to a ${vertical.toLowerCase()} cart`, 400);
  const available = availableFromInventory(variant.inventoryItems);
  if (quantity > available) throw new AppError("CONFLICT", available === 0 ? "This item is out of stock" : `Only ${available} available`, 409);

  let cart = await activeCart(owner, vertical);
  if (!cart) {
    cart = await db.cart.create({ data: { ...cartCreateOwner(owner), vertical, currency: variant.currency }, include: cartInclude });
  }
  if (cart.currency !== variant.currency) throw new AppError("CONFLICT", "This cart cannot mix currencies", 409);

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity },
  });
  const refreshed = await db.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  return serializeCart(refreshed);
}

export async function updateCartItem(owner: CartOwner, itemId: string, quantity: number, vertical: CommerceVertical = "SHOPPING") {
  const accessibleCart = await activeCart(owner, vertical);
  if (!accessibleCart) throw new AppError("NOT_FOUND", "Cart item not found", 404);
  const item = await db.cartItem.findFirst({
    where: { id: itemId, cartId: accessibleCart.id },
    include: { variant: { include: { inventoryItems: { select: { quantityOnHand: true, quantityReserved: true } } } } },
  });
  if (!item) throw new AppError("NOT_FOUND", "Cart item not found", 404);
  const available = availableFromInventory(item.variant.inventoryItems);
  if (quantity > available) throw new AppError("CONFLICT", available === 0 ? "This item is out of stock" : `Only ${available} available`, 409);
  await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  const cart = await db.cart.findUniqueOrThrow({ where: { id: item.cartId }, include: cartInclude });
  return serializeCart(cart);
}

export async function removeCartItem(owner: CartOwner, itemId: string, vertical: CommerceVertical = "SHOPPING") {
  const accessibleCart = await activeCart(owner, vertical);
  if (!accessibleCart) throw new AppError("NOT_FOUND", "Cart item not found", 404);
  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId: accessibleCart.id } });
  if (!item) throw new AppError("NOT_FOUND", "Cart item not found", 404);
  await db.cartItem.delete({ where: { id: item.id } });
  const cart = await db.cart.findUniqueOrThrow({ where: { id: item.cartId }, include: cartInclude });
  return serializeCart(cart);
}

export async function getWishlist(userId: string, vertical?: CommerceVertical) {
  const wishlist = await db.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        where: vertical ? { product: { merchant: { vertical } } } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          product: { include: summaryInclude },
          variant: { include: { inventoryItems: { select: { quantityOnHand: true, quantityReserved: true } } } },
        },
      },
    },
  });
  const products = wishlist?.items.map((item) => {
    const summary = productSummary(item.product);
    const selectedVariant = item.variant;
    const selectedAvailable = selectedVariant ? availableFromInventory(selectedVariant.inventoryItems) : summary.availableQuantity;
    return {
      ...summary,
      wishlist: {
        savedAt: item.createdAt,
        savedPriceMinor: moneyToNumber(item.priceMinorAtAdd),
        priceChanged: item.priceMinorAtAdd != null && item.priceMinorAtAdd !== item.product.priceMinor,
        selectedVariantId: selectedVariant?.id ?? summary.defaultVariantId,
        selectedVariant: selectedVariant ? { id: selectedVariant.id, sku: selectedVariant.sku, title: selectedVariant.title, active: selectedVariant.active, priceMinor: moneyToNumber(selectedVariant.priceMinor), availableQuantity: selectedAvailable } : null,
        available: item.product.status === "ACTIVE" && (!selectedVariant || (selectedVariant.active && selectedAvailable > 0)),
      },
    };
  }) ?? [];
  return { products, count: products.length, updatedAt: wishlist?.updatedAt ?? null };
}

export async function addWishlistItem(userId: string, productId: string, requestedVariantId?: string, vertical?: CommerceVertical) {
  const product = await db.product.findFirst({
    where: { id: productId, status: "ACTIVE" },
    include: { variants: { where: { active: true }, orderBy: { createdAt: "asc" }, select: { id: true, priceMinor: true } } },
  });
  if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
  if (vertical) { const merchant = await db.merchant.findUnique({ where: { id: product.merchantId }, select: { vertical: true } }); if (merchant?.vertical !== vertical) throw new AppError("BAD_REQUEST", `This product is not part of ${vertical.toLowerCase()}`, 400); }
  const selected = requestedVariantId ? product.variants.find((variant) => variant.id === requestedVariantId) : product.variants[0];
  if (requestedVariantId && !selected) throw new AppError("BAD_REQUEST", "Selected product option is not available", 400);
  const wishlist = await db.wishlist.upsert({ where: { userId }, create: { userId }, update: {} });
  await db.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    create: { wishlistId: wishlist.id, productId, variantId: selected?.id, priceMinorAtAdd: product.priceMinor },
    update: { variantId: selected?.id, priceMinorAtAdd: product.priceMinor },
  });
  return getWishlist(userId, vertical);
}

export async function removeWishlistItem(userId: string, productId: string, vertical?: CommerceVertical) {
  const wishlist = await db.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return { products: [], count: 0, updatedAt: null };

  if (vertical) {
    const item = await db.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId,
        product: { merchant: { vertical } },
      },
      select: { id: true },
    });
    if (!item) return getWishlist(userId, vertical);
    await db.wishlistItem.delete({ where: { id: item.id } });
  } else {
    await db.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  }

  return getWishlist(userId, vertical);
}
