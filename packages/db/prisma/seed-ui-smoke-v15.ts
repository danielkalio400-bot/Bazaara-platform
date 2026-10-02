/** Local-only, idempotent fixtures for Shopping categories and Food sections.
 * Never run against a remote, staging, or production database.
 * Only touches records whose slug starts bazaara-v15-demo-.
 */
import { db } from "../src/index";

import { assertLocalFixtureTarget } from "./demo-v15-guard";

const DEMO = "bazaara-v15-demo-";
function slugPart(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g, "").slice(0,72);
}
async function demoMerchant(vertical: "SHOPPING" | "FOOD") {
  const slug = `${DEMO}${vertical.toLowerCase()}`;
  let merchant = await db.merchant.findUnique({ where: { slug }, include: { stores: true, organization: true } });
  if (merchant && !merchant.organization.legalName.startsWith("BAZAARA ")) throw new Error(`Demo merchant slug is in use: ${slug}`);
  if (!merchant) {
    const org = await db.organization.create({ data: { type: vertical === "SHOPPING" ? "SELLER" : "RESTAURANT", legalName: `BAZAARA ${vertical} DEMO (NOT A REAL MERCHANT)`, displayName: `BAZAARA ${vertical} DEMO`, status: "ACTIVE", country: "NG" } });
    merchant = await db.merchant.create({ data: { organizationId: org.id, slug, vertical, verifiedAt: null, stores: { create: { name: "LOCAL TEST ONLY", status: "ACTIVE", fulfillmentModes: vertical === "SHOPPING" ? ["STANDARD"] : ["DELIVERY", "PICKUP"] } } }, include: { stores: true, organization: true } });
  }
  if (merchant.vertical !== vertical || !merchant.organizationId) throw new Error(`Unexpected demo merchant state: ${slug}`);
  const store = merchant.stores[0] ?? await db.store.create({ data: { merchantId: merchant.id, name: "LOCAL TEST ONLY", status: "ACTIVE", fulfillmentModes: ["STANDARD"] } });
  if (store.status !== "ACTIVE") await db.store.update({ where: { id: store.id }, data: { status: "ACTIVE" } });
  return { merchant, store };
}
const shopCategories = [
  ["phones-tablets", "Phones & Tablets"], ["electronics", "Electronics"], ["computing", "Computing"],
  ["home-kitchen", "Home & Kitchen"], ["fashion", "Fashion"], ["beauty-care", "Beauty & Care"],
  ["baby-kids", "Baby & Kids"], ["sports-outdoors", "Sports & Outdoors"],
] as const;
const categoryExamples: Record<string, { item: string; price: number; image: string }> = {
  "phones-tablets": { item: "Phone stand", price: 3900, image: "photo-1511707171634-5f897ff02aa9" },
  electronics: { item: "Wireless earbuds", price: 9800, image: "photo-1606220588913-b3aacb4d2f46" },
  computing: { item: "USB-C charging cable", price: 2800, image: "photo-1583863788434-e58a36330cf0" },
  "home-kitchen": { item: "Kitchen storage container", price: 5200, image: "photo-1570222094114-d054a817e56b" },
  fashion: { item: "Canvas trainers", price: 12000, image: "photo-1542291026-7eec264c27ff" },
  "beauty-care": { item: "Reusable toiletry pouch", price: 4800, image: "photo-1556228578-8c89e6adf883" },
  "baby-kids": { item: "Baby cotton blanket", price: 6000, image: "photo-1515488042361-ee00e0ddd4e4" },
  "sports-outdoors": { item: "Sports water bottle", price: 4100, image: "photo-1530549387789-4c1017266635" },
};

async function seedShopping() {
  const { merchant, store } = await demoMerchant("SHOPPING");
  for (const [slug, name] of shopCategories) {
    await db.category.upsert({ where: { slug }, create: { slug, name, description: `Local testing category: ${name}`, active: true, sortOrder: shopCategories.findIndex(row => row[0] === slug) * 10 + 10 }, update: {} });
  }
  const roots = await db.category.findMany({ where: { active: true, parentId: null, slug: { not: "grocery" } }, include: { children: true }, orderBy: { sortOrder: "asc" } });
  const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const byParent = new Map<string, typeof categories>();
  for (const item of categories) if (item.parentId) byParent.set(item.parentId,[...(byParent.get(item.parentId) ?? []),item]);
  const relevant = new Map<string, (typeof categories)[number]>();
  const walk = (cat: (typeof categories)[number], depth: number) => {
    if (depth > 5) throw new Error(`Unusually deep category tree: ${cat.slug}`);
    relevant.set(cat.id,cat);
    for (const child of byParent.get(cat.id) ?? []) walk(child,depth+1);
  };
  for (const root of roots) walk(root,0);
  if (relevant.size > 120) throw new Error("Too many active categories for the demo seed. Review your taxonomy first.");
  let total = 0;
  for (const cat of relevant.values()) {
    const example = categoryExamples[cat.slug] ?? { item: `${cat.name} sample accessory`, price: 5400, image: "photo-1523275335684-37898b6baf30" };
    const slug = `${DEMO}${slugPart(cat.slug)}`;
    const priceMinor = BigInt(example.price * 100);
    // Do not set a fictional compare-at price or fabricate a merchant verification badge.
    const occupied = await db.product.findUnique({ where: { slug }, select: { merchantId: true } });
    if (occupied && occupied.merchantId !== merchant.id) throw new Error(`Fixture product slug collision: ${slug}`);
    const product = await db.product.upsert({ where: { slug }, create: { merchantId: merchant.id, categoryId: cat.id, slug, title: `DEMO · ${example.item}`, shortDescription: `Local test item in ${cat.name}`, description: `NOT FOR REAL PURCHASE. Demo item for testing Shopping category ${cat.name}, product details, cart, checkout and wishlist.`, status: "ACTIVE", currency: "NGN", priceMinor, featured: true }, update: { categoryId: cat.id, featured: true, status: "ACTIVE" } });
    if (product.merchantId !== merchant.id) throw new Error(`Fixture slug collision: ${slug}`);
    const sku = `B15-${slugPart(cat.slug).slice(0,55).toUpperCase()}`;
    const existingVariant = await db.productVariant.findUnique({ where: { sku }, select: { productId: true } });
    if (existingVariant && existingVariant.productId !== product.id) throw new Error(`Fixture SKU collision: ${sku}`);
    const variant = await db.productVariant.upsert({ where: { sku }, create: { productId: product.id, sku, title: "Demo option", priceMinor, currency: "NGN", active: true }, update: { active: true } });
    if (variant.productId !== product.id) throw new Error(`Fixture SKU collision: ${sku}`);
    await db.inventoryItem.upsert({ where: { storeId_variantId: { storeId: store.id, variantId: variant.id } }, create: { storeId: store.id, variantId: variant.id, quantityOnHand: 30, lowStockThreshold: 3 }, update: {} });
    const existingImage = await db.productMedia.findFirst({ where: { productId: product.id, type: "IMAGE" } });
    if (!existingImage) await db.productMedia.create({ data: { productId: product.id, type: "IMAGE", url: `https://images.unsplash.com/${example.image}?auto=format&fit=crop&w=800&q=75`, alt: `Illustrative image, ${cat.name} test fixture`, sortOrder: 0 } });
    total++;
  }
  console.log(`SHOPPING DEMO: ${total} test products, one in each active non-grocery category.`);
}

const foodExamples = [
  { slug: "rice", title: "Rice dishes", meal: "Demo jollof rice", price: 3900, image: "photo-1512058564366-18510be2db19" },
  { slug: "local", title: "Local meals", meal: "Demo eba & vegetable soup", price: 4500, image: "photo-1547592180-85f173990554" },
  { slug: "grills", title: "Grills", meal: "Demo grilled chicken", price: 5600, image: "photo-1532550907401-a500c9a57435" },
  { slug: "fast-food", title: "Fast food", meal: "Demo chicken burger", price: 3400, image: "photo-1568901346375-23c9450c58cd" },
  { slug: "drinks", title: "Drinks", meal: "Demo fruit smoothie", price: 1800, image: "photo-1505252585461-04db1eb84625" },
  { slug: "desserts", title: "Desserts", meal: "Demo chocolate cake", price: 2100, image: "photo-1578985545062-69928b1d9587" },
] as const;
async function seedFood() {
  const { merchant } = await demoMerchant("FOOD");
  const slug = `${DEMO}food`;
  const occupied = await db.foodRestaurant.findUnique({ where: { slug }, select: { merchantId: true } });
  if (occupied && occupied.merchantId !== merchant.id) throw new Error("Fixture Food restaurant slug collision");
  const restaurant = await db.foodRestaurant.upsert({ where: { slug }, create: {
    merchantId: merchant.id, slug, description: "LOCAL TEST RESTAURANT ONLY — six sample menu categories for Food checkout and cart testing.",
    cuisineTags: ["Nigerian", "Grills", "Fast Food", "Drinks", "Desserts"],
    status: "ACTIVE", acceptingOrders: true, deliveryEnabled: true, pickupEnabled: true,
    asapEnabled: true, scheduledEnabled: true, deliveryFeeMinor: 0n, serviceFeeMinor: 0n,
    minOrderMinor: 0n, estimatedDeliveryMin: 25, estimatedDeliveryMax: 40, rating: 0, ratingCount: 0,
    latitude: 4.8156, longitude: 7.0498, heroImageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=75",
  }, update: { status: "ACTIVE", acceptingOrders: true } });
  if (restaurant.merchantId !== merchant.id) throw new Error("Fixture restaurant slug collision");
  for (let day = 0; day < 7; day++) await db.foodOpeningHour.upsert({ where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: day } }, create: { restaurantId: restaurant.id, dayOfWeek: day, openMinute: 0, closeMinute: 1440, closed: false }, update: { openMinute: 0, closeMinute: 1440, closed: false } });
  for (let i=0;i<foodExamples.length;i++) {
    const sample=foodExamples[i]!;
    const section=await db.foodMenuSection.upsert({ where: { restaurantId_slug: { restaurantId: restaurant.id, slug: sample.slug } }, create: { restaurantId: restaurant.id, slug: sample.slug, title: sample.title, sortOrder: i*10, active: true }, update: { active: true } });
    const item=await db.foodMenuItem.upsert({ where: { restaurantId_slug: { restaurantId: restaurant.id, slug: `${DEMO}${sample.slug}` } }, create: {
      restaurantId: restaurant.id, sectionId: section.id, slug: `${DEMO}${sample.slug}`, name: sample.meal,
      description: "LOCAL DEMO ONLY. Not an actual restaurant menu or available for real fulfilment.",
      imageUrl: `https://images.unsplash.com/${sample.image}?auto=format&fit=crop&w=800&q=75`, priceMinor: BigInt(sample.price * 100),
      currency: "NGN", active: true, soldOut: false, featured: true, prepMinutes: 15, sortOrder: 0,
    }, update: { active: true, soldOut: false, sectionId: section.id } });
    if(item.restaurantId !== restaurant.id) throw new Error(`Fixture food collision: ${sample.slug}`);
  }
  console.log(`FOOD DEMO: ${foodExamples.length} menu sections, each with an orderable sample item. Restaurant: ${slug}`);
}
async function main() { assertLocalFixtureTarget({ nodeEnv: process.env.NODE_ENV, ack: process.env.BAZAARA_DEMO_SEED_ACK, databaseUrl: process.env.DATABASE_URL }); await seedShopping(); await seedFood(); }
main().then(() => console.log("LOCAL DEMO FIXTURES COMPLETE")).catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode=1; }).finally(async () => db.$disconnect());
