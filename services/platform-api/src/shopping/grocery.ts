import { queueNotificationTx } from "../notifications/service.js";
import { randomBytes } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { listProducts, productSummary, type CartOwner } from "./service.js";

const productInclude = {
  media: { where: { type: "IMAGE" as const }, orderBy: { sortOrder: "asc" as const }, take: 1 },
  category: true,
  brand: true,
  merchant: { include: { organization: true } },
  variants: {
    where: { active: true },
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      inventoryItems: {
        select: {
          quantityOnHand: true,
          quantityReserved: true,
          store: { select: { status: true, fulfillmentModes: true } },
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function peopleFromPrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  const numeric = lower.match(/(?:for|feed(?:ing)?|serves?)\s+(\d{1,2})\b/)?.[1];
  if (numeric) return Math.max(1, Math.min(30, Number(numeric)));
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  for (const [word, count] of Object.entries(words)) if (new RegExp(`(?:for|serves?)\\s+${word}\\b`).test(lower)) return count;
  return 1;
}

type PlannedIngredient = { label: string; search: string; baseQuantity: number; note?: string };

function ingredientsForPrompt(prompt: string): PlannedIngredient[] {
  const lower = prompt.toLowerCase();
  if (lower.includes("jollof")) {
    return [
      { label: "Long grain rice", search: "rice", baseQuantity: 1, note: "Main grain" },
      { label: "Tomatoes", search: "tomatoes", baseQuantity: 1, note: "For the tomato base" },
      { label: "Red onions", search: "onions", baseQuantity: 1, note: "For the sauce base" },
      { label: "Vegetable oil", search: "vegetable oil", baseQuantity: 1, note: "For frying the base" },
    ];
  }
  if (lower.includes("breakfast")) {
    return [
      { label: "Fresh eggs", search: "eggs", baseQuantity: 1 },
      { label: "Sliced bread", search: "bread", baseQuantity: 1 },
      { label: "Milk", search: "milk", baseQuantity: 1 },
    ];
  }
  if (lower.includes("beans") || lower.includes("akara")) {
    return [
      { label: "Brown beans", search: "beans", baseQuantity: 1 },
      { label: "Red onions", search: "onions", baseQuantity: 1 },
      { label: "Vegetable oil", search: "vegetable oil", baseQuantity: 1 },
    ];
  }
  if (lower.includes("weekly") || lower.includes("week") || lower.includes("essentials") || lower.includes("groceries")) {
    return [
      { label: "Long grain rice", search: "rice", baseQuantity: 1 },
      { label: "Brown beans", search: "beans", baseQuantity: 1 },
      { label: "Fresh eggs", search: "eggs", baseQuantity: 1 },
      { label: "Milk", search: "milk", baseQuantity: 1 },
      { label: "Sliced bread", search: "bread", baseQuantity: 1 },
      { label: "Tomatoes", search: "tomatoes", baseQuantity: 1 },
      { label: "Red onions", search: "onions", baseQuantity: 1 },
      { label: "Vegetable oil", search: "vegetable oil", baseQuantity: 1 },
    ];
  }
  return [
    { label: prompt.trim(), search: prompt.trim(), baseQuantity: 1 },
  ];
}

export async function groceryHome() {
  const [root, products, stores] = await Promise.all([
    db.category.findUnique({
      where: { slug: "grocery" },
      include: { children: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    }),
    listProducts({ vertical: "GROCERY", sort: "featured", page: 1, limit: 16 }),
    db.merchant.findMany({
      where: { vertical: "GROCERY", organization: { status: "ACTIVE" } },
      orderBy: { updatedAt: "desc" },
      include: { organization: true, stores: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } } },
      take: 12,
    }),
  ]);

  return {
    hero: {
      title: "Groceries, without the long trip.",
      subtitle: "Fresh food, pantry staples and household essentials from trusted grocery stores across Bazaara.",
    },
    categories: (root?.children ?? []).map(({ id, slug, name, description }) => ({ id, slug, name, description })),
    products: products.products,
    stores: stores.map((merchant) => ({
      slug: merchant.slug,
      name: merchant.organization.displayName,
      verified: Boolean(merchant.verifiedAt),
      country: merchant.organization.country,
      fulfillmentModes: [...new Set(merchant.stores.flatMap((store) => store.fulfillmentModes))].sort(),
      storeCount: merchant.stores.length,
    })),
    capabilities: [
      { key: "express", label: "Express delivery", description: "Shown only where the selected store supports it." },
      { key: "scheduled", label: "Scheduled delivery", description: "Choose a supported future delivery window at checkout." },
      { key: "lists", label: "Grocery lists", description: "Save repeatable grocery lists to your BazID account." },
      { key: "planner", label: "Smart grocery planner", description: "Turn a meal or household need into an editable grocery plan." },
    ],
  };
}

export async function planGroceries(prompt: string) {
  const people = peopleFromPrompt(prompt);
  const scale = Math.max(1, Math.ceil(people / 4));
  const ingredients = ingredientsForPrompt(prompt).slice(0, 12);

  const planned = await Promise.all(ingredients.map(async (ingredient) => {
    const result = await listProducts({
      q: ingredient.search,
      vertical: "GROCERY",
      sort: "featured",
      page: 1,
      limit: 3,
    });
    return {
      label: ingredient.label,
      quantity: Math.max(1, ingredient.baseQuantity * scale),
      note: ingredient.note ?? null,
      products: result.products,
    };
  }));

  return {
    prompt,
    people,
    title: prompt.toLowerCase().includes("jollof") ? `Jollof rice plan${people > 1 ? ` for ${people}` : ""}` : "Grocery plan",
    disclaimer: "Planner suggestions are a starting point. Check quantities, dietary needs and product availability before checkout.",
    ingredients: planned,
  };
}

function money(value: bigint | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "bigint" ? Number(value) : Number(value);
}

function collaboratorRole(list: any, userId: string) {
  if (list.userId === userId) return "OWNER";
  return list.collaborators?.find((entry: any) => entry.userId === userId)?.role ?? null;
}

function serializeList(list: any, actorUserId: string) {
  const accessRole = collaboratorRole(list, actorUserId);
  return {
    id: list.id,
    name: list.name,
    archived: list.archived,
    accessRole,
    canEdit: accessRole === "OWNER" || accessRole === "EDITOR",
    canManage: accessRole === "OWNER",
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    items: (list.items ?? []).map((item: any) => ({
      id: item.id,
      label: item.label,
      quantity: item.quantity,
      checked: item.checked,
      productId: item.productId,
      variantId: item.variantId,
      product: item.product ? productSummary(item.product) : null,
    })),
    collaborators: accessRole === "OWNER" ? (list.collaborators ?? []).map((entry: any) => ({
      id: entry.id,
      userId: entry.userId,
      role: entry.role,
      displayName: entry.user?.displayName ?? null,
      email: entry.user?.emails?.find((email: any) => email.isPrimary)?.email ?? entry.user?.emails?.[0]?.email ?? null,
    })) : [],
  };
}

const groceryListInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: { product: { include: productInclude } },
  },
  collaborators: {
    orderBy: { createdAt: "asc" as const },
    include: { user: { include: { emails: { where: { verifiedAt: { not: null } }, orderBy: { isPrimary: "desc" as const }, take: 2 } } } },
  },
} satisfies Prisma.GroceryListInclude;

async function groceryListAccess(userId: string, listId: string, minimum: "VIEWER" | "EDITOR" | "OWNER" = "VIEWER") {
  const list = await db.groceryList.findFirst({
    where: { id: listId, OR: [{ userId }, { collaborators: { some: { userId } } }] },
    include: groceryListInclude,
  });
  if (!list) throw new AppError("NOT_FOUND", "Grocery list not found", 404);
  const role = collaboratorRole(list, userId) as "VIEWER" | "EDITOR" | "OWNER" | null;
  const rank = { VIEWER: 1, EDITOR: 2, OWNER: 3 } as const;
  if (!role || rank[role] < rank[minimum]) throw new AppError("FORBIDDEN", "You do not have permission to change this grocery list", 403);
  return { list, role };
}

export async function listGroceryLists(userId: string) {
  const lists = await db.groceryList.findMany({
    where: { archived: false, OR: [{ userId }, { collaborators: { some: { userId } } }] },
    orderBy: { updatedAt: "desc" },
    include: groceryListInclude,
    take: 50,
  });
  return { lists: lists.map((list) => serializeList(list, userId)) };
}

export async function createGroceryList(userId: string, name: string) {
  const list = await db.groceryList.create({ data: { userId, name: name.trim() }, include: groceryListInclude });
  return { list: serializeList(list, userId) };
}

export async function updateGroceryList(userId: string, listId: string, input: { name?: string; archived?: boolean }) {
  await groceryListAccess(userId, listId, "OWNER");
  const updated = await db.groceryList.update({ where: { id: listId }, data: { ...(input.name ? { name: input.name.trim() } : {}), ...(typeof input.archived === "boolean" ? { archived: input.archived } : {}) }, include: groceryListInclude });
  return { list: serializeList(updated, userId) };
}

export async function addGroceryListItem(userId: string, listId: string, input: { label: string; quantity: number; productId?: string; variantId?: string }) {
  await groceryListAccess(userId, listId, "EDITOR");
  const normalizedLabel = normalizeLabel(input.label);
  let productId = input.productId;
  const variantId = input.variantId;
  if (variantId) {
    const variant = await db.productVariant.findFirst({
      where: { id: variantId, active: true, product: { status: "ACTIVE", merchant: { vertical: "GROCERY" } } },
      select: { productId: true },
    });
    if (!variant) throw new AppError("BAD_REQUEST", "Selected variant is not an active grocery variant", 400);
    if (productId && productId !== variant.productId) throw new AppError("BAD_REQUEST", "Selected product and variant do not match", 400);
    productId = variant.productId;
  }
  if (productId) {
    const product = await db.product.findFirst({ where: { id: productId, status: "ACTIVE", merchant: { vertical: "GROCERY" } }, select: { id: true } });
    if (!product) throw new AppError("BAD_REQUEST", "Selected product is not an active grocery product", 400);
  }
  await db.groceryListItem.upsert({
    where: { listId_normalizedLabel: { listId, normalizedLabel } },
    create: { listId, label: input.label.trim(), normalizedLabel, quantity: input.quantity, productId, variantId },
    update: { label: input.label.trim(), quantity: input.quantity, productId, variantId, checked: false },
  });
  const updated = await db.groceryList.findUniqueOrThrow({ where: { id: listId }, include: groceryListInclude });
  return { list: serializeList(updated, userId) };
}

export async function updateGroceryListItem(userId: string, listId: string, itemId: string, input: { quantity?: number; checked?: boolean }) {
  await groceryListAccess(userId, listId, "EDITOR");
  const item = await db.groceryListItem.findFirst({ where: { id: itemId, listId }, select: { id: true } });
  if (!item) throw new AppError("NOT_FOUND", "Grocery list item not found", 404);

  if (input.quantity === 0) {
    await db.groceryListItem.delete({ where: { id: itemId } });
  } else {
    await db.groceryListItem.update({
      where: { id: itemId },
      data: {
        ...(input.quantity != null ? { quantity: input.quantity } : {}),
        ...(typeof input.checked === "boolean" ? { checked: input.checked } : {}),
      },
    });
  }

  const updated = await db.groceryList.findUniqueOrThrow({ where: { id: listId }, include: groceryListInclude });
  return { list: serializeList(updated, userId) };
}

export async function removeGroceryListItem(userId: string, listId: string, itemId: string) {
  await groceryListAccess(userId, listId, "EDITOR");
  const item = await db.groceryListItem.findFirst({ where: { id: itemId, listId }, select: { id: true } });
  if (!item) throw new AppError("NOT_FOUND", "Grocery list item not found", 404);
  await db.groceryListItem.delete({ where: { id: itemId } });
  const updated = await db.groceryList.findUniqueOrThrow({ where: { id: listId }, include: groceryListInclude });
  return { list: serializeList(updated, userId) };
}

export async function addGroceryListCollaborator(userId: string, listId: string, email: string, role: "VIEWER" | "EDITOR") {
  const { list } = await groceryListAccess(userId, listId, "OWNER");
  const normalized = email.trim().toLowerCase();
  const targetEmail = await db.userEmail.findUnique({ where: { normalized }, include: { user: true } });
  if (!targetEmail?.verifiedAt) throw new AppError("NOT_FOUND", "No verified BazID account was found for that email", 404);
  if (targetEmail.userId === list.userId) throw new AppError("BAD_REQUEST", "The list owner already has access", 400);
  await db.groceryListCollaborator.upsert({
    where: { listId_userId: { listId, userId: targetEmail.userId } },
    create: { listId, userId: targetEmail.userId, role },
    update: { role },
  });
  const updated = await db.groceryList.findUniqueOrThrow({ where: { id: listId }, include: groceryListInclude });
  return { list: serializeList(updated, userId) };
}

export async function removeGroceryListCollaborator(userId: string, listId: string, collaboratorUserId: string) {
  await groceryListAccess(userId, listId, "OWNER");
  await db.groceryListCollaborator.deleteMany({ where: { listId, userId: collaboratorUserId } });
  const updated = await db.groceryList.findUniqueOrThrow({ where: { id: listId }, include: groceryListInclude });
  return { list: serializeList(updated, userId) };
}

export async function repeatGroceryPurchases(userId: string) {
  const items = await db.shoppingOrderItem.findMany({
    where: { sellerOrder: { order: { userId }, merchant: { vertical: "GROCERY" } } },
    orderBy: { createdAt: "desc" },
    select: { productId: true, variantId: true, productTitle: true, variantTitle: true, quantity: true, createdAt: true },
    take: 80,
  });
  const seen = new Set<string>();
  const repeats = [] as typeof items;
  for (const item of items) {
    const key = `${item.productId}:${item.variantId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    repeats.push(item);
    if (repeats.length >= 16) break;
  }
  return { items: repeats };
}

export async function getGroceryPreferences(userId: string) {
  const preference = await db.groceryCustomerPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  return { preference };
}

export async function updateGroceryPreferences(userId: string, input: {
  dietaryTags?: string[];
  freshnessNotes?: string | null;
  contactPreference?: "CHAT" | "CALL" | "NO_CONTACT";
  leaveAtDoor?: boolean;
  maxReplacementPricePercent?: number;
  substitutionPolicy?: "BEST_MATCH" | "CONTACT_ME" | "REFUND";
  preferredFulfillment?: "STANDARD" | "EXPRESS" | "SCHEDULED" | "PICKUP";
}) {
  const preference = await db.groceryCustomerPreference.upsert({
    where: { userId },
    create: {
      userId,
      dietaryTags: input.dietaryTags ?? [],
      freshnessNotes: input.freshnessNotes?.trim() || null,
      contactPreference: input.contactPreference ?? "CHAT",
      leaveAtDoor: input.leaveAtDoor ?? false,
      maxReplacementPricePercent: input.maxReplacementPricePercent ?? 10,
      substitutionPolicy: input.substitutionPolicy ?? "BEST_MATCH",
      preferredFulfillment: input.preferredFulfillment ?? "STANDARD",
    },
    update: {
      ...(input.dietaryTags ? { dietaryTags: [...new Set(input.dietaryTags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 20) } : {}),
      ...(input.freshnessNotes !== undefined ? { freshnessNotes: input.freshnessNotes?.trim() || null } : {}),
      ...(input.contactPreference ? { contactPreference: input.contactPreference } : {}),
      ...(input.leaveAtDoor !== undefined ? { leaveAtDoor: input.leaveAtDoor } : {}),
      ...(input.maxReplacementPricePercent !== undefined ? { maxReplacementPricePercent: input.maxReplacementPricePercent } : {}),
      ...(input.substitutionPolicy ? { substitutionPolicy: input.substitutionPolicy } : {}),
      ...(input.preferredFulfillment ? { preferredFulfillment: input.preferredFulfillment } : {}),
    },
  });
  return { preference };
}

function ownerWhere(owner: CartOwner) {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestTokenHash) return { guestTokenHash: owner.guestTokenHash };
  throw new Error("Cart owner is required");
}

export async function setGroceryCartItemPreference(owner: CartOwner, itemId: string, input: {
  substitutionPolicy: "BEST_MATCH" | "CONTACT_ME" | "REFUND" | "SPECIFIC_REPLACEMENT";
  replacementVariantId?: string | null;
  pickerNote?: string | null;
  maxPriceIncreasePercent?: number | null;
}) {
  const cartItem = await db.cartItem.findFirst({
    where: { id: itemId, cart: { ...ownerWhere(owner), vertical: "GROCERY", status: "ACTIVE" } },
    include: { variant: { include: { product: true } } },
  });
  if (!cartItem) throw new AppError("NOT_FOUND", "Grocery cart item not found", 404);
  let replacementVariantId = input.replacementVariantId ?? null;
  if (input.substitutionPolicy === "SPECIFIC_REPLACEMENT") {
    if (!replacementVariantId) throw new AppError("BAD_REQUEST", "Choose a replacement product", 400);
    const replacement = await db.productVariant.findFirst({
      where: {
        id: replacementVariantId,
        active: true,
        product: { status: "ACTIVE", merchantId: cartItem.variant.product.merchantId, merchant: { vertical: "GROCERY" } },
        inventoryItems: { some: { store: { status: "ACTIVE" }, quantityOnHand: { gt: 0 } } },
      },
      select: { id: true },
    });
    if (!replacement) throw new AppError("BAD_REQUEST", "Replacement must be an in-stock product from the same Grocery store", 400);
  } else {
    replacementVariantId = null;
  }
  const preference = await db.groceryCartItemPreference.upsert({
    where: { cartItemId: cartItem.id },
    create: {
      cartItemId: cartItem.id,
      substitutionPolicy: input.substitutionPolicy,
      replacementVariantId,
      pickerNote: input.pickerNote?.trim().slice(0, 300) || null,
      maxPriceIncreasePercent: input.maxPriceIncreasePercent ?? null,
    },
    update: {
      substitutionPolicy: input.substitutionPolicy,
      replacementVariantId,
      pickerNote: input.pickerNote?.trim().slice(0, 300) || null,
      maxPriceIncreasePercent: input.maxPriceIncreasePercent ?? null,
    },
  });
  return { preference };
}

export async function groceryStores() {
  const merchants = await db.merchant.findMany({
    where: { vertical: "GROCERY", organization: { status: "ACTIVE" } },
    orderBy: { updatedAt: "desc" },
    include: {
      organization: true,
      stores: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        include: {
          groceryConfig: true,
          groceryDeliverySlots: { where: { active: true, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 20 },
        },
      },
    },
  });
  return {
    stores: merchants.map((merchant) => ({
      merchantId: merchant.id,
      slug: merchant.slug,
      name: merchant.organization.displayName,
      verified: Boolean(merchant.verifiedAt),
      branches: merchant.stores.map((store) => ({
        id: store.id,
        name: store.name,
        fulfillmentModes: store.fulfillmentModes,
        config: store.groceryConfig ? {
          pickupEnabled: store.groceryConfig.pickupEnabled,
          expressEnabled: store.groceryConfig.expressEnabled,
          scheduledEnabled: store.groceryConfig.scheduledEnabled,
          minimumOrderMinor: money(store.groceryConfig.minimumOrderMinor),
          prepMinutes: store.groceryConfig.prepMinutes,
        } : null,
        slots: store.groceryDeliverySlots.map((slot) => ({ id: slot.id, startsAt: slot.startsAt, endsAt: slot.endsAt, capacity: slot.capacity, remaining: Math.max(0, slot.capacity - slot.reserved) })),
      })),
    })),
  };
}

export async function getGroceryMembership(userId: string) {
  const membership = await db.groceryMembership.upsert({ where: { userId }, create: { userId }, update: {} });
  return { membership };
}

export async function listRecurringBaskets(userId: string) {
  const baskets = await db.groceryRecurringBasket.findMany({
    where: { userId },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
    include: { items: { include: { product: { include: productInclude }, variant: true } } },
  });
  return {
    baskets: baskets.map((basket) => ({
      ...basket,
      items: basket.items.map((item) => ({ id: item.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity, product: productSummary(item.product), variant: { id: item.variant.id, title: item.variant.title, priceMinor: money(item.variant.priceMinor), currency: item.variant.currency } })),
    })),
  };
}

export async function createRecurringBasket(userId: string, input: { name: string; cadence: "WEEKLY" | "BIWEEKLY" | "MONTHLY"; nextRunAt?: Date | null }) {
  const basket = await db.groceryRecurringBasket.create({ data: { userId, name: input.name.trim(), cadence: input.cadence, nextRunAt: input.nextRunAt ?? null } });
  return { basket };
}

export async function updateRecurringBasket(userId: string, basketId: string, input: { name?: string; cadence?: string; nextRunAt?: Date | null; active?: boolean }) {
  const basket = await db.groceryRecurringBasket.findFirst({ where: { id: basketId, userId } });
  if (!basket) throw new AppError("NOT_FOUND", "Recurring basket not found", 404);
  return { basket: await db.groceryRecurringBasket.update({ where: { id: basket.id }, data: { ...(input.name ? { name: input.name.trim() } : {}), ...(input.cadence ? { cadence: input.cadence } : {}), ...(input.nextRunAt !== undefined ? { nextRunAt: input.nextRunAt } : {}), ...(input.active !== undefined ? { active: input.active } : {}) } }) };
}

export async function addRecurringBasketItem(userId: string, basketId: string, input: { variantId: string; quantity: number }) {
  const basket = await db.groceryRecurringBasket.findFirst({ where: { id: basketId, userId } });
  if (!basket) throw new AppError("NOT_FOUND", "Recurring basket not found", 404);
  const variant = await db.productVariant.findFirst({ where: { id: input.variantId, active: true, product: { status: "ACTIVE", merchant: { vertical: "GROCERY" } } }, select: { id: true, productId: true } });
  if (!variant) throw new AppError("BAD_REQUEST", "Grocery product option not found", 400);
  await db.groceryRecurringBasketItem.upsert({ where: { basketId_variantId: { basketId, variantId: variant.id } }, create: { basketId, productId: variant.productId, variantId: variant.id, quantity: input.quantity }, update: { quantity: input.quantity } });
  return listRecurringBaskets(userId);
}

export async function removeRecurringBasketItem(userId: string, basketId: string, itemId: string) {
  const item = await db.groceryRecurringBasketItem.findFirst({ where: { id: itemId, basketId, basket: { userId } } });
  if (!item) throw new AppError("NOT_FOUND", "Recurring basket item not found", 404);
  await db.groceryRecurringBasketItem.delete({ where: { id: item.id } });
  return listRecurringBaskets(userId);
}

function shareToken() {
  return randomBytes(18).toString("base64url");
}

export async function createGroceryGroupCart(userId: string, input: { spendingLimitMinor?: number | null }) {
  const cart = await db.cart.findFirst({ where: { userId, vertical: "GROCERY", status: "ACTIVE" }, orderBy: { updatedAt: "desc" } });
  if (!cart) throw new AppError("CONFLICT", "Add at least one Grocery item before starting a group cart", 409);
  const existing = await db.groceryGroupCart.findUnique({ where: { cartId: cart.id }, include: { members: true } });
  if (existing && existing.status === "OPEN" && existing.expiresAt > new Date()) return serializeGroupCart(existing);
  const group = await db.groceryGroupCart.create({
    data: {
      cartId: cart.id,
      hostUserId: userId,
      shareToken: shareToken(),
      spendingLimitMinor: input.spendingLimitMinor == null ? null : BigInt(input.spendingLimitMinor),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      members: { create: { userId, displayName: "Host", role: "HOST" } },
    },
    include: { members: true },
  });
  return serializeGroupCart(group);
}

function serializeGroupCart(group: any) {
  return {
    id: group.id,
    shareToken: group.shareToken,
    status: group.status,
    spendingLimitMinor: group.spendingLimitMinor == null ? null : money(group.spendingLimitMinor),
    expiresAt: group.expiresAt,
    members: (group.members ?? []).map((member: any) => ({ ...member, paymentAllocationMinor: member.paymentAllocationMinor == null ? null : money(member.paymentAllocationMinor) })),
    settlement: "ALLOCATIONS_ONLY",
    settlementNote: "Split amounts are recorded for coordination. Real multi-party money movement requires the configured payment provider.",
  };
}

export async function getGroceryGroupCartPreview(token: string) {
  const group = await db.groceryGroupCart.findUnique({
    where: { shareToken: token },
    include: { members: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } }, cart: { include: { items: true } } },
  });
  if (!group || group.status !== "OPEN" || group.expiresAt <= new Date() || group.cart.status !== "ACTIVE") throw new AppError("NOT_FOUND", "This group cart link is no longer active", 404);
  return { group: { ...serializeGroupCart(group), itemCount: group.cart.items.reduce((sum, item) => sum + item.quantity, 0) } };
}

export async function joinGroceryGroupCart(userId: string, token: string, displayName: string) {
  const group = await db.groceryGroupCart.findUnique({ where: { shareToken: token }, include: { members: true, cart: true } });
  if (!group || group.status !== "OPEN" || group.expiresAt <= new Date() || group.cart.status !== "ACTIVE") throw new AppError("NOT_FOUND", "This group cart link is no longer active", 404);
  if (group.hostUserId === userId) return serializeGroupCart(await db.groceryGroupCart.findUniqueOrThrow({ where: { id: group.id }, include: { members: true } }));

  const personalCart = await db.cart.findFirst({
    where: { userId, vertical: "GROCERY", status: "ACTIVE", id: { not: group.cartId } },
    orderBy: { updatedAt: "desc" },
    include: {
      shoppingCheckouts: { where: { status: "ACTIVE", expiresAt: { gt: new Date() } }, select: { id: true }, take: 1 },
      items: { include: { groceryPreference: true, variant: { include: { inventoryItems: { select: { quantityOnHand: true, quantityReserved: true } } } } } },
    },
  });
  if (personalCart?.shoppingCheckouts.length) throw new AppError("CONFLICT", "Your current Grocery checkout is still reserving stock. Finish it or wait for it to expire before joining a group cart", 409);

  await db.$transaction(async (tx) => {
    await tx.groceryGroupCartMember.updateMany({ where: { userId, status: "ACTIVE", groupCartId: { not: group.id } }, data: { status: "LEFT" } });
    await tx.groceryGroupCartMember.upsert({
      where: { groupCartId_userId: { groupCartId: group.id, userId } },
      create: { groupCartId: group.id, userId, displayName: displayName.trim().slice(0, 80) || "Member" },
      update: { displayName: displayName.trim().slice(0, 80) || "Member", status: "ACTIVE" },
    });

    if (personalCart) {
      for (const item of personalCart.items) {
        const available = item.variant.inventoryItems.reduce((sum, inventory) => sum + Math.max(0, inventory.quantityOnHand - inventory.quantityReserved), 0);
        if (available <= 0) continue;
        const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: group.cartId, variantId: item.variantId } }, include: { groceryPreference: true } });
        if (existing) {
          await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(available, existing.quantity + item.quantity) } });
          if (!existing.groceryPreference && item.groceryPreference) {
            await tx.groceryCartItemPreference.create({ data: { cartItemId: existing.id, substitutionPolicy: item.groceryPreference.substitutionPolicy, replacementVariantId: item.groceryPreference.replacementVariantId, pickerNote: item.groceryPreference.pickerNote, maxPriceIncreasePercent: item.groceryPreference.maxPriceIncreasePercent } });
          }
          await tx.cartItem.delete({ where: { id: item.id } });
        } else {
          await tx.cartItem.update({ where: { id: item.id }, data: { cartId: group.cartId, quantity: Math.min(available, item.quantity) } });
        }
      }
      await tx.cart.update({ where: { id: personalCart.id }, data: { status: "ABANDONED" } });
    }
  });

  const updated = await db.groceryGroupCart.findUniqueOrThrow({ where: { id: group.id }, include: { members: true } });
  return serializeGroupCart(updated);
}

export async function updateGroceryGroupAllocations(userId: string, groupId: string, allocations: Array<{ memberId: string; amountMinor: number | null }>) {
  const group = await db.groceryGroupCart.findFirst({ where: { id: groupId, hostUserId: userId, status: "OPEN" }, include: { members: true } });
  if (!group) throw new AppError("NOT_FOUND", "Group cart not found", 404);
  const memberIds = new Set(group.members.map((member) => member.id));
  for (const allocation of allocations) if (!memberIds.has(allocation.memberId)) throw new AppError("BAD_REQUEST", "An allocation references a non-member", 400);
  await db.$transaction(allocations.map((allocation) => db.groceryGroupCartMember.update({ where: { id: allocation.memberId }, data: { paymentAllocationMinor: allocation.amountMinor == null ? null : BigInt(allocation.amountMinor) } })));
  const updated = await db.groceryGroupCart.findUniqueOrThrow({ where: { id: group.id }, include: { members: true } });
  return serializeGroupCart(updated);
}

async function customerGroceryOrder(userId: string, orderId: string) {
  const order = await db.shoppingOrder.findFirst({ where: { id: orderId, userId, vertical: "GROCERY" }, select: { id: true } });
  if (!order) throw new AppError("NOT_FOUND", "Grocery order not found", 404);
  return order;
}

async function requireReadyOwnedMedia(userId: string, objectKey: string) {
  if (!objectKey.startsWith(`users/${userId}/`)) throw new AppError("BAD_REQUEST", "Use a completed private Bazaara media upload", 400);
  const asset = await db.mediaAsset.findFirst({ where: { ownerUserId: userId, objectKey, status: "READY" }, select: { objectKey: true } });
  if (!asset) throw new AppError("BAD_REQUEST", "Complete the Bazaara media upload before attaching it", 400);
  return asset.objectKey;
}

export async function sendGroceryPickerMessage(userId: string, orderId: string, sessionId: string, input: { text?: string | null; mediaKey?: string | null }) {
  await customerGroceryOrder(userId, orderId);
  const session = await db.groceryPickerSession.findFirst({ where: { id: sessionId, sellerOrder: { orderId } } });
  if (!session) throw new AppError("NOT_FOUND", "Picker conversation not found", 404);
  if (!input.text?.trim() && !input.mediaKey) throw new AppError("BAD_REQUEST", "Message text or uploaded media is required", 400);
  if (input.mediaKey) await requireReadyOwnedMedia(userId, input.mediaKey);
  const message = await db.groceryPickerMessage.create({ data: { sessionId, senderUserId: userId, kind: input.mediaKey ? "IMAGE" : "TEXT", text: input.text?.trim().slice(0, 1000) || null, mediaKey: input.mediaKey ?? null } });
  return { message };
}

export async function getGroceryPickerMessageMediaForCustomer(userId: string, orderId: string, sessionId: string, messageId: string) {
  await customerGroceryOrder(userId, orderId);
  const message = await db.groceryPickerMessage.findFirst({
    where: { id: messageId, sessionId, session: { sellerOrder: { orderId } }, mediaKey: { not: null } },
    select: { mediaKey: true },
  });
  if (!message?.mediaKey) throw new AppError("NOT_FOUND", "Image message not found", 404);
  const asset = await db.mediaAsset.findFirst({ where: { objectKey: message.mediaKey, status: "READY" }, select: { objectKey: true } });
  if (!asset) throw new AppError("NOT_FOUND", "Image message is unavailable", 404);
  return asset.objectKey;
}

export async function decideGroceryReplacement(userId: string, orderId: string, outcomeId: string, decision: "APPROVE" | "REFUND") {
  const order = await db.shoppingOrder.findFirst({ where: { id: orderId, userId, vertical: "GROCERY" }, include: { sellerOrders: { include: { items: true } } } });
  if (!order) throw new AppError("NOT_FOUND", "Grocery order not found", 404);
  const outcome = await db.groceryPickerItemOutcome.findFirst({ where: { id: outcomeId, session: { sellerOrder: { orderId } } }, include: { session: { include: { sellerOrder: true } }, orderItem: true, replacementVariant: { include: { product: true } } } });
  if (!outcome || outcome.status !== "REPLACEMENT_PROPOSED" || !outcome.replacementVariantId) throw new AppError("CONFLICT", "There is no pending replacement for this item", 409);
  const sellerOrder = outcome.session.sellerOrder;
  const replacementQuantity = outcome.replacementQuantity ?? outcome.requestedQuantity;
  await db.$transaction(async (tx) => {
    const locked = await tx.groceryPickerItemOutcome.findUniqueOrThrow({ where: { id: outcome.id } });
    if (locked.customerDecision !== "PENDING") throw new AppError("CONFLICT", "This replacement has already been decided", 409);
    // The original units were already consumed from InventoryItem when the order was placed.
    // A shelf shortage is an inventory discrepancy, not returned stock, so do not add those
    // units back here. Only allocate replacement stock when the customer approves it.
    if (decision === "APPROVE") {
      const replacementInventory = await tx.inventoryItem.findUnique({ where: { storeId_variantId: { storeId: sellerOrder.storeId, variantId: outcome.replacementVariantId! } } });
      if (!replacementInventory || replacementInventory.quantityOnHand - replacementInventory.quantityReserved < replacementQuantity) throw new AppError("CONFLICT", "The proposed replacement is no longer in stock", 409);
      await tx.inventoryItem.update({ where: { id: replacementInventory.id }, data: { quantityOnHand: { decrement: replacementQuantity } } });
      await tx.groceryPickerItemOutcome.update({ where: { id: outcome.id }, data: { customerDecision: "APPROVED", status: "REPLACED", fulfilledQuantity: 0 } });
    } else {
      await tx.groceryPickerItemOutcome.update({ where: { id: outcome.id }, data: { customerDecision: "REFUND", status: "REFUNDED", fulfilledQuantity: 0 } });
      await tx.groceryIssue.create({ data: { orderId, sellerOrderId: sellerOrder.id, userId, merchantId: sellerOrder.merchantId, type: "SHORTAGE_REFUND", status: order.paymentMethod === "PAY_ON_DELIVERY" ? "RESOLVED" : "OPEN", details: `Refund requested for ${outcome.orderItem.productTitle}`, requestedAmountMinor: outcome.orderItem.lineTotalMinor, approvedAmountMinor: order.paymentMethod === "PAY_ON_DELIVERY" ? outcome.orderItem.lineTotalMinor : null } });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await recalculateGroceryOrderTotals(orderId);
  return { outcome: await db.groceryPickerItemOutcome.findUnique({ where: { id: outcome.id } }) };
}

async function groceryMerchantContext(userId: string, sellerOrderId: string) {
  const sellerOrder = await db.shoppingSellerOrder.findFirst({
    where: { id: sellerOrderId, merchant: { vertical: "GROCERY", organization: { members: { some: { userId, status: "ACTIVE" } } } } },
    include: { order: true, items: true, merchant: true, store: true, groceryPickerSession: { include: { outcomes: true, messages: true } } },
  });
  if (!sellerOrder) throw new AppError("NOT_FOUND", "Grocery seller order not found", 404);
  return sellerOrder;
}

export async function listBusinessGroceryOrders(userId: string) {
  const sellerOrders = await db.shoppingSellerOrder.findMany({
    where: { merchant: { vertical: "GROCERY", organization: { members: { some: { userId, status: "ACTIVE" } } } }, order: { vertical: "GROCERY" } },
    orderBy: { createdAt: "desc" },
    include: { order: true, items: true, merchant: { include: { organization: true } }, store: true, groceryPickerSession: { include: { outcomes: true, messages: { orderBy: { createdAt: "asc" } } } } },
    take: 200,
  });
  return { orders: sellerOrders.map((entry) => ({ id: entry.id, orderId: entry.orderId, orderNumber: entry.order.orderNumber, status: entry.status, paymentStatus: entry.order.paymentStatus, deliveryMode: entry.order.deliveryMode, scheduledFor: entry.order.scheduledFor, totalMinor: money(entry.totalMinor), currency: entry.order.currency, seller: entry.merchant.organization.displayName, store: { id: entry.store.id, name: entry.store.name }, items: entry.items.map((item) => ({ ...item, unitPriceMinor: money(item.unitPriceMinor), lineTotalMinor: money(item.lineTotalMinor) })), picker: entry.groceryPickerSession }) ) };
}

export async function businessGroceryStores(userId: string) {
  const stores = await db.store.findMany({
    where: { merchant: { vertical: "GROCERY", organization: { members: { some: { userId, status: "ACTIVE" } } } } },
    orderBy: { createdAt: "asc" },
    include: { merchant: { include: { organization: true } }, groceryConfig: true, groceryDeliverySlots: { where: { startsAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, orderBy: { startsAt: "asc" }, take: 100 } },
  });
  return { stores: stores.map((store) => ({ id: store.id, name: store.name, status: store.status, fulfillmentModes: store.fulfillmentModes, merchant: store.merchant.organization.displayName, config: store.groceryConfig ? { ...store.groceryConfig, minimumOrderMinor: money(store.groceryConfig.minimumOrderMinor), freeDeliveryThresholdMinor: store.groceryConfig.freeDeliveryThresholdMinor == null ? null : money(store.groceryConfig.freeDeliveryThresholdMinor) } : null, slots: store.groceryDeliverySlots.map((slot) => ({ ...slot })) })) };
}

async function ownedGroceryStore(userId: string, storeId: string) {
  const store = await db.store.findFirst({ where: { id: storeId, merchant: { vertical: "GROCERY", organization: { members: { some: { userId, status: "ACTIVE" } } } } }, include: { groceryConfig: true } });
  if (!store) throw new AppError("NOT_FOUND", "Grocery branch not found", 404);
  return store;
}

export async function updateBusinessGroceryStore(userId: string, storeId: string, input: {
  pickupEnabled?: boolean; expressEnabled?: boolean; scheduledEnabled?: boolean; pickerChatEnabled?: boolean; weightedItemsEnabled?: boolean;
  minimumOrderMinor?: number; maxActiveOrders?: number; prepMinutes?: number; freeDeliveryThresholdMinor?: number | null; membershipDiscountBps?: number;
}) {
  await ownedGroceryStore(userId, storeId);
  const config = await db.groceryStoreConfig.upsert({
    where: { storeId },
    create: { storeId, ...(input.minimumOrderMinor !== undefined ? { minimumOrderMinor: BigInt(input.minimumOrderMinor) } : {}), ...(input.freeDeliveryThresholdMinor !== undefined ? { freeDeliveryThresholdMinor: input.freeDeliveryThresholdMinor == null ? null : BigInt(input.freeDeliveryThresholdMinor) } : {}), ...input, minimumOrderMinor: BigInt(input.minimumOrderMinor ?? 0), freeDeliveryThresholdMinor: input.freeDeliveryThresholdMinor == null ? null : BigInt(input.freeDeliveryThresholdMinor) },
    update: { ...input, ...(input.minimumOrderMinor !== undefined ? { minimumOrderMinor: BigInt(input.minimumOrderMinor) } : {}), ...(input.freeDeliveryThresholdMinor !== undefined ? { freeDeliveryThresholdMinor: input.freeDeliveryThresholdMinor == null ? null : BigInt(input.freeDeliveryThresholdMinor) } : {}) },
  });
  return { config: { ...config, minimumOrderMinor: money(config.minimumOrderMinor), freeDeliveryThresholdMinor: config.freeDeliveryThresholdMinor == null ? null : money(config.freeDeliveryThresholdMinor) } };
}

export async function createBusinessGrocerySlot(userId: string, storeId: string, input: { startsAt: Date; endsAt: Date; capacity: number }) {
  const store = await ownedGroceryStore(userId, storeId);
  if (input.endsAt <= input.startsAt) throw new AppError("BAD_REQUEST", "Delivery slot end must be after its start", 400);
  if (input.startsAt < new Date(Date.now() + 15 * 60 * 1000)) throw new AppError("BAD_REQUEST", "Delivery slots must start at least 15 minutes in the future", 400);
  if (store.groceryConfig && !store.groceryConfig.scheduledEnabled) throw new AppError("CONFLICT", "Enable scheduled delivery for this branch before creating slots", 409);
  const slot = await db.groceryDeliverySlot.create({ data: { storeId, startsAt: input.startsAt, endsAt: input.endsAt, capacity: input.capacity } });
  return { slot };
}

export async function updateBusinessGrocerySlot(userId: string, storeId: string, slotId: string, input: { active?: boolean; capacity?: number }) {
  await ownedGroceryStore(userId, storeId);
  const slot = await db.groceryDeliverySlot.findFirst({ where: { id: slotId, storeId } });
  if (!slot) throw new AppError("NOT_FOUND", "Delivery slot not found", 404);
  if (input.capacity !== undefined && input.capacity < slot.reserved) throw new AppError("CONFLICT", "Capacity cannot be lower than existing reservations", 409);
  return { slot: await db.groceryDeliverySlot.update({ where: { id: slot.id }, data: input }) };
}

export async function startGroceryPicking(userId: string, sellerOrderId: string) {
  const sellerOrder = await groceryMerchantContext(userId, sellerOrderId);
  if (!sellerOrder.groceryPickerSession) throw new AppError("CONFLICT", "Picker session is not initialized for this order", 409);
  if (!["QUEUED", "PICKING"].includes(sellerOrder.groceryPickerSession.status)) throw new AppError("CONFLICT", "This picking session cannot be started", 409);
  const session = await db.groceryPickerSession.update({ where: { id: sellerOrder.groceryPickerSession.id }, data: { pickerUserId: userId, status: "PICKING", startedAt: sellerOrder.groceryPickerSession.startedAt ?? new Date() } });
  if (sellerOrder.status === "PLACED" || sellerOrder.status === "CONFIRMED") await db.shoppingSellerOrder.update({ where: { id: sellerOrder.id }, data: { status: "PICKING", pickingStartedAt: new Date(), assignedToUserId: userId } });
  return { session };
}

export async function updateGroceryPickerOutcome(userId: string, sellerOrderId: string, orderItemId: string, input: {
  status: "FOUND" | "PARTIAL" | "OUT_OF_STOCK" | "REPLACEMENT_PROPOSED";
  fulfilledQuantity?: number;
  actualWeightGrams?: number | null;
  finalUnitPriceMinor?: number | null;
  replacementVariantId?: string | null;
  replacementQuantity?: number | null;
  note?: string | null;
}) {
  const sellerOrder = await groceryMerchantContext(userId, sellerOrderId);
  const session = sellerOrder.groceryPickerSession;
  if (!session || !["PICKING", "WAITING_CUSTOMER"].includes(session.status)) {
    throw new AppError("CONFLICT", "Start picking before updating items", 409);
  }

  const orderItem = sellerOrder.items.find((item) => item.id === orderItemId);
  if (!orderItem) throw new AppError("NOT_FOUND", "Order item not found", 404);

  const existing = session.outcomes.find((entry) => entry.orderItemId === orderItemId);
  if (!existing) throw new AppError("NOT_FOUND", "Picker item outcome not initialized", 404);

  const preferenceSnapshot = await db.groceryOrderPreferenceSnapshot.findUnique({
    where: { orderId: sellerOrder.orderId },
    select: { preferences: true },
  });

  const snapshot =
    preferenceSnapshot?.preferences &&
    typeof preferenceSnapshot.preferences === "object" &&
    !Array.isArray(preferenceSnapshot.preferences)
      ? (preferenceSnapshot.preferences as Record<string, any>)
      : {};

  const customerPreference =
    snapshot.customer &&
    typeof snapshot.customer === "object" &&
    !Array.isArray(snapshot.customer)
      ? (snapshot.customer as Record<string, any>)
      : {};

  const substitutionPolicy =
    customerPreference.substitutionPolicy === "CONTACT_ME" ||
    customerPreference.substitutionPolicy === "REFUND"
      ? customerPreference.substitutionPolicy
      : "BEST_MATCH";

  const maxReplacementPricePercent =
    typeof customerPreference.maxReplacementPricePercent === "number"
      ? Math.max(0, Math.min(100, Math.floor(customerPreference.maxReplacementPricePercent)))
      : 10;

  const fulfilledQuantity =
    input.status === "FOUND"
      ? orderItem.quantity
      : Math.max(0, Math.min(orderItem.quantity, input.fulfilledQuantity ?? 0));

  if (
    input.status === "PARTIAL" &&
    (fulfilledQuantity <= 0 || fulfilledQuantity >= orderItem.quantity)
  ) {
    throw new AppError(
      "BAD_REQUEST",
      "Partial fulfillment quantity must be between zero and the requested quantity",
      400,
    );
  }

  let replacementVariantId: string | null = null;
  let replacementQuantity: number | null = null;
  let replacement: any = null;
  let autoApproveReplacement = false;

  if (input.status === "REPLACEMENT_PROPOSED") {
    if (substitutionPolicy === "REFUND") {
      throw new AppError(
        "CONFLICT",
        "Customer preference is refund unavailable items. Mark this item out of stock instead of proposing a replacement",
        409,
      );
    }

    if (!input.replacementVariantId) {
      throw new AppError("BAD_REQUEST", "Choose a replacement item", 400);
    }

    replacementQuantity = Math.max(
      1,
      Math.min(orderItem.quantity, input.replacementQuantity ?? orderItem.quantity),
    );

    replacement = await db.productVariant.findFirst({
      where: {
        id: input.replacementVariantId,
        active: true,
        product: {
          status: "ACTIVE",
          merchantId: sellerOrder.merchantId,
        },
        inventoryItems: {
          some: {
            storeId: sellerOrder.storeId,
            quantityOnHand: { gt: 0 },
          },
        },
      },
      include: {
        product: { select: { title: true } },
        inventoryItems: {
          where: { storeId: sellerOrder.storeId },
        },
      },
    });

    if (
      !replacement ||
      (replacement.inventoryItems[0]?.quantityOnHand ?? 0) -
        (replacement.inventoryItems[0]?.quantityReserved ?? 0) <
        replacementQuantity
    ) {
      throw new AppError(
        "CONFLICT",
        "The proposed replacement is not in stock at this branch",
        409,
      );
    }

    replacementVariantId = replacement.id;

    if (substitutionPolicy === "BEST_MATCH") {
      const maximumAllowedPrice =
        orderItem.unitPriceMinor +
        (orderItem.unitPriceMinor * BigInt(maxReplacementPricePercent)) / 100n;

      autoApproveReplacement = replacement.priceMinor <= maximumAllowedPrice;
    }
  }

  await db.$transaction(async (tx) => {
    // Inventory for the originally ordered SKU was already decremented at order placement.
    // Picker outcomes must never recreate stock when an item is short on the shelf.
    // Only a replacement that becomes approved consumes additional inventory.
    const previousReplacementVariantId =
      existing.status === "REPLACED" && existing.customerDecision === "APPROVED"
        ? existing.replacementVariantId
        : null;
    const previousReplacementQuantity = previousReplacementVariantId
      ? existing.replacementQuantity ?? existing.requestedQuantity
      : 0;

    const desiredReplacementVariantId =
      input.status === "REPLACEMENT_PROPOSED" && autoApproveReplacement
        ? replacementVariantId
        : null;
    const desiredReplacementQuantity = desiredReplacementVariantId
      ? replacementQuantity ?? orderItem.quantity
      : 0;

    if (previousReplacementVariantId) {
      const sameReplacement =
        previousReplacementVariantId === desiredReplacementVariantId;
      const restoreQuantity = sameReplacement
        ? Math.max(0, previousReplacementQuantity - desiredReplacementQuantity)
        : previousReplacementQuantity;

      if (restoreQuantity > 0) {
        const previousInventory = await tx.inventoryItem.findUnique({
          where: {
            storeId_variantId: {
              storeId: sellerOrder.storeId,
              variantId: previousReplacementVariantId,
            },
          },
        });
        if (previousInventory) {
          await tx.inventoryItem.update({
            where: { id: previousInventory.id },
            data: { quantityOnHand: { increment: restoreQuantity } },
          });
        }
      }
    }

    if (desiredReplacementVariantId) {
      const sameReplacement =
        previousReplacementVariantId === desiredReplacementVariantId;
      const allocateQuantity = sameReplacement
        ? Math.max(0, desiredReplacementQuantity - previousReplacementQuantity)
        : desiredReplacementQuantity;

      if (allocateQuantity > 0) {
        const replacementInventory = await tx.inventoryItem.findUnique({
          where: {
            storeId_variantId: {
              storeId: sellerOrder.storeId,
              variantId: desiredReplacementVariantId,
            },
          },
        });

        if (
          !replacementInventory ||
          replacementInventory.quantityOnHand -
            replacementInventory.quantityReserved <
            allocateQuantity
        ) {
          throw new AppError(
            "CONFLICT",
            "The replacement went out of stock before it could be confirmed",
            409,
          );
        }

        await tx.inventoryItem.update({
          where: { id: replacementInventory.id },
          data: { quantityOnHand: { decrement: allocateQuantity } },
        });
      }
    }

    if (
      (input.status === "PARTIAL" || input.status === "OUT_OF_STOCK") &&
      existing.status !== "PARTIAL" &&
      existing.status !== "OUT_OF_STOCK"
    ) {
      await tx.groceryIssue.create({
        data: {
          orderId: sellerOrder.orderId,
          sellerOrderId: sellerOrder.id,
          userId: sellerOrder.order.userId,
          merchantId: sellerOrder.merchantId,
          type: "INVENTORY_SHORTAGE",
          status: "OPEN",
          details: `${orderItem.productTitle}: picker reported ${input.status.toLowerCase().replaceAll("_", " ")}. Branch inventory requires review.`,
        },
      });
    }

    const waitingForCustomer =
      input.status === "REPLACEMENT_PROPOSED" && !autoApproveReplacement;

    await tx.groceryPickerItemOutcome.update({
      where: { id: existing.id },
      data: {
        status:
          input.status === "REPLACEMENT_PROPOSED" && autoApproveReplacement
            ? "REPLACED"
            : input.status,
        fulfilledQuantity:
          input.status === "REPLACEMENT_PROPOSED" ? 0 : fulfilledQuantity,
        actualWeightGrams: input.actualWeightGrams ?? null,
        finalUnitPriceMinor:
          input.finalUnitPriceMinor == null
            ? null
            : BigInt(input.finalUnitPriceMinor),
        replacementVariantId,
        replacementQuantity,
        customerDecision:
          input.status === "REPLACEMENT_PROPOSED"
            ? autoApproveReplacement
              ? "APPROVED"
              : "PENDING"
            : "NOT_REQUIRED",
        note: input.note?.trim().slice(0, 500) || null,
      },
    });

    await tx.groceryPickerSession.update({
      where: { id: session.id },
      data: {
        status: waitingForCustomer ? "WAITING_CUSTOMER" : "PICKING",
      },
    });

    if (waitingForCustomer) {
      await queueNotificationTx(tx, {
        userId: sellerOrder.order.userId,
        category: "ORDER",
        title: "Grocery replacement needs approval",
        body: `${orderItem.productTitle} is unavailable. Review the proposed replacement before picking continues.`,
        resourceType: "ShoppingOrder",
        resourceId: sellerOrder.orderId,
        channels: ["PUSH"],
      });
    } else if (
      input.status === "REPLACEMENT_PROPOSED" &&
      autoApproveReplacement
    ) {
      await queueNotificationTx(tx, {
        userId: sellerOrder.order.userId,
        category: "ORDER",
        title: "Grocery item replaced",
        body: `${orderItem.productTitle} was replaced within your Best Match price limit.`,
        resourceType: "ShoppingOrder",
        resourceId: sellerOrder.orderId,
        channels: ["PUSH"],
      });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await recalculateGroceryOrderTotals(sellerOrder.orderId);

  return {
    outcome: await db.groceryPickerItemOutcome.findUnique({
      where: { id: existing.id },
    }),
  };
}

async function recalculateGroceryOrderTotals(orderId: string) {
  const order = await db.shoppingOrder.findUnique({
    where: { id: orderId },
    include: { sellerOrders: { include: { items: true, groceryPickerSession: { include: { outcomes: { include: { replacementVariant: true } } } } } } },
  });
  if (!order || order.vertical !== "GROCERY") return;
  const desiredSellerSubtotals = new Map<string, bigint>();
  for (const seller of order.sellerOrders) {
    const outcomeByItem = new Map((seller.groceryPickerSession?.outcomes ?? []).map((outcome) => [outcome.orderItemId, outcome] as const));
    let subtotal = 0n;
    for (const item of seller.items) {
      const outcome = outcomeByItem.get(item.id);
      if (!outcome || ["PENDING", "REPLACEMENT_PROPOSED"].includes(outcome.status)) subtotal += item.lineTotalMinor;
      else if (["FOUND", "PARTIAL"].includes(outcome.status)) subtotal += (outcome.finalUnitPriceMinor ?? item.unitPriceMinor) * BigInt(outcome.fulfilledQuantity);
      else if (outcome.status === "REPLACED" && outcome.customerDecision === "APPROVED" && outcome.replacementVariant) subtotal += outcome.replacementVariant.priceMinor * BigInt(outcome.replacementQuantity ?? outcome.requestedQuantity);
    }
    desiredSellerSubtotals.set(seller.id, subtotal);
  }
  const subtotal = [...desiredSellerSubtotals.values()].reduce((sum, value) => sum + value, 0n);
  const serviceFeeMinor = (subtotal * BigInt(order.serviceFeeBps ?? 0)) / 10000n;
  const desiredTotal = subtotal + serviceFeeMinor + order.shippingMinor + order.taxMinor - order.discountMinor;
  if (order.paymentMethod === "PAY_ON_DELIVERY") {
    await db.$transaction([
      ...order.sellerOrders.map((seller) => db.shoppingSellerOrder.update({ where: { id: seller.id }, data: { subtotalMinor: desiredSellerSubtotals.get(seller.id) ?? seller.subtotalMinor, totalMinor: (desiredSellerSubtotals.get(seller.id) ?? seller.subtotalMinor) + seller.shippingMinor } })),
      db.shoppingOrder.update({ where: { id: order.id }, data: { subtotalMinor: subtotal, serviceFeeMinor, totalMinor: desiredTotal } }),
      ...(order.paymentId ? [db.payment.update({ where: { id: order.paymentId }, data: { amountMinor: desiredTotal } })] : []),
    ]);
  } else if (desiredTotal !== order.totalMinor) {
    const existing = await db.groceryIssue.findFirst({ where: { orderId: order.id, type: "SETTLEMENT_ADJUSTMENT", status: "OPEN" } });
    if (!existing) await db.groceryIssue.create({ data: { orderId: order.id, userId: order.userId, type: "SETTLEMENT_ADJUSTMENT", status: "OPEN", details: "Final Grocery picking total differs from the already-initialized online payment. Provider refund/capture adjustment is required.", requestedAmountMinor: desiredTotal - order.totalMinor } });
  }
}

export async function sendBusinessGroceryPickerMessage(userId: string, sellerOrderId: string, input: { text?: string | null; mediaKey?: string | null }) {
  const sellerOrder = await groceryMerchantContext(userId, sellerOrderId);
  if (!sellerOrder.groceryPickerSession) throw new AppError("NOT_FOUND", "Picker conversation not found", 404);
  if (!input.text?.trim() && !input.mediaKey) throw new AppError("BAD_REQUEST", "Message text or uploaded media is required", 400);
  if (input.mediaKey) await requireReadyOwnedMedia(userId, input.mediaKey);
  const message = await db.groceryPickerMessage.create({ data: { sessionId: sellerOrder.groceryPickerSession.id, senderUserId: userId, kind: input.mediaKey ? "IMAGE" : "TEXT", text: input.text?.trim().slice(0, 1000) || null, mediaKey: input.mediaKey ?? null } });
  return { message };
}

export async function getBusinessGroceryPickerMessageMedia(userId: string, sellerOrderId: string, messageId: string) {
  const sellerOrder = await groceryMerchantContext(userId, sellerOrderId);
  const sessionId = sellerOrder.groceryPickerSession?.id;
  if (!sessionId) throw new AppError("NOT_FOUND", "Picker conversation not found", 404);
  const message = await db.groceryPickerMessage.findFirst({ where: { id: messageId, sessionId, mediaKey: { not: null } }, select: { mediaKey: true } });
  if (!message?.mediaKey) throw new AppError("NOT_FOUND", "Image message not found", 404);
  const asset = await db.mediaAsset.findFirst({ where: { objectKey: message.mediaKey, status: "READY" }, select: { objectKey: true } });
  if (!asset) throw new AppError("NOT_FOUND", "Image message is unavailable", 404);
  return asset.objectKey;
}

export async function businessGroceryReplacementOptions(userId: string, sellerOrderId: string, query: string) {
  const sellerOrder = await groceryMerchantContext(userId, sellerOrderId);
  const q = query.trim();
  const variants = await db.productVariant.findMany({
    where: {
      active: true,
      product: { merchantId: sellerOrder.merchantId, status: "ACTIVE" },
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { product: { title: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
      inventoryItems: { some: { storeId: sellerOrder.storeId } },
    },
    include: { product: { select: { id: true, title: true, slug: true } }, inventoryItems: { where: { storeId: sellerOrder.storeId }, select: { quantityOnHand: true, quantityReserved: true } } },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });
  return {
    options: variants.map((variant) => ({
      variantId: variant.id,
      productId: variant.product.id,
      productTitle: variant.product.title,
      productSlug: variant.product.slug,
      variantTitle: variant.title,
      priceMinor: money(variant.priceMinor),
      currency: variant.currency,
      availableQuantity: variant.inventoryItems.reduce((sum, row) => sum + Math.max(0, row.quantityOnHand - row.quantityReserved), 0),
    })).filter((option) => option.availableQuantity > 0).slice(0, 20),
  };
}

export async function completeGroceryPicking(userId: string, sellerOrderId: string) {
  const sellerOrder = await groceryMerchantContext(userId, sellerOrderId);
  const session = sellerOrder.groceryPickerSession;
  if (!session) throw new AppError("NOT_FOUND", "Picker session not found", 404);
  if (session.outcomes.some((outcome) => outcome.status === "PENDING" || outcome.status === "REPLACEMENT_PROPOSED" || outcome.customerDecision === "PENDING")) throw new AppError("CONFLICT", "Resolve every item and pending customer replacement before completing picking", 409);
  await db.$transaction([
    db.groceryPickerSession.update({ where: { id: session.id }, data: { status: "COMPLETED", completedAt: new Date() } }),
    db.shoppingSellerOrder.update({ where: { id: sellerOrder.id }, data: { status: "PACKED", packedAt: new Date() } }),
  ]);
  await recalculateGroceryOrderTotals(sellerOrder.orderId);
  return { success: true };
}

export async function createGroceryIssue(userId: string, orderId: string, input: { type: string; details?: string; requestedAmountMinor?: number | null }) {
  const order = await db.shoppingOrder.findFirst({ where: { id: orderId, userId, vertical: "GROCERY" }, include: { sellerOrders: true } });
  if (!order) throw new AppError("NOT_FOUND", "Grocery order not found", 404);
  const issue = await db.groceryIssue.create({ data: { orderId, userId, type: input.type, details: input.details?.trim().slice(0, 1200) || null, requestedAmountMinor: input.requestedAmountMinor == null ? null : BigInt(input.requestedAmountMinor) } });
  return { issue: { ...issue, requestedAmountMinor: issue.requestedAmountMinor == null ? null : money(issue.requestedAmountMinor) } };
}
