import { z } from "zod";

export const productListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  seller: z.string().trim().max(80).optional(),
  vertical: z.enum(["SHOPPING", "GROCERY"]).optional(),
  sort: z.enum(["featured", "newest", "price_asc", "price_desc"]).default("featured"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
});

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  region: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().max(100).optional(),
  street: z.string().trim().max(160).optional(),
  building: z.string().trim().max(100).optional(),
  landmark: z.string().trim().max(160).optional(),
  deliveryInstructions: z.string().trim().max(400).optional(),
});

export const checkoutCreateSchema = z.object({
  shippingAddress: shippingAddressSchema,
  deliveryMode: z.enum(["STANDARD", "EXPRESS", "SCHEDULED"]).default("STANDARD"),
  scheduledFor: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if (value.deliveryMode !== "SCHEDULED") return;
  if (!value.scheduledFor) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledFor"], message: "Choose a delivery time for scheduled delivery" });
    return;
  }
  const min = Date.now() + 60 * 60 * 1000;
  const max = Date.now() + 14 * 24 * 60 * 60 * 1000;
  if (value.scheduledFor.getTime() < min || value.scheduledFor.getTime() > max) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledFor"], message: "Scheduled delivery must be between 1 hour and 14 days from now" });
  }
});

export const checkoutPaymentMethodSchema = z.object({
  paymentMethod: z.enum(["PAY_ON_DELIVERY", "PAYSTACK_CARD", "PAYSTACK_BANK"]),
});

export const returnRequestSchema = z.object({
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(1000).optional(),
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).max(20),
  })).min(1).max(50),
  evidence: z.array(z.object({
    type: z.string().trim().min(2).max(40),
    url: z.string().url().max(2000).refine((value) => value.startsWith("https://") || value.startsWith("http://"), "Evidence URL must use http or https"),
    note: z.string().trim().max(400).optional(),
  })).max(10).optional(),
});

export const sellerOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PICKING", "PROCESSING", "PACKED", "READY_TO_SHIP"]),
});
