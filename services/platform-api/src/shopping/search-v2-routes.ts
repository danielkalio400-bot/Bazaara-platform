import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth, resolveAuth } from "../auth.js";
import { advancedSearch, popularSearches, recentSearches, searchSuggestions } from "./search-v2.js";

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(), brand: z.string().trim().max(80).optional(), category: z.string().trim().max(80).optional(), seller: z.string().trim().max(80).optional(), vertical: z.enum(["SHOPPING", "GROCERY"]).optional(), material: z.string().trim().max(80).optional(), fulfillment: z.string().trim().max(40).optional(),
  minPriceMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(), maxPriceMinor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(), minDiscountPercent: z.coerce.number().int().min(0).max(100).optional(), minProductRating: z.coerce.number().min(1).max(5).optional(), minSellerScore: z.coerce.number().min(0).max(100).optional(),
  inStock: z.enum(["true", "false"]).transform((value) => value === "true").optional(), verifiedSeller: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  sort: z.enum(["featured", "newest", "rating_desc", "price_asc", "price_desc"]).default("featured"), page: z.coerce.number().int().min(1).max(1000).default(1), limit: z.coerce.number().int().min(1).max(48).default(24),
});
const suggestionSchema = z.object({
  q: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(10).default(8),
  vertical: z.enum(["SHOPPING", "GROCERY"]).optional(),
});
const limitSchema = z.object({ limit: z.coerce.number().int().min(1).max(20).default(8) });

export async function shoppingSearchV2Routes(app: FastifyInstance) {
  app.get("/v1/shopping/search", async (request) => { const auth = await resolveAuth(request); return advancedSearch(searchSchema.parse(request.query), auth?.userId); });
  app.get("/v1/shopping/search/suggestions", async (request) => { const input = suggestionSchema.parse(request.query); return searchSuggestions(input.q, input.limit, input.vertical); });
  app.get("/v1/shopping/search/popular", async (request) => { const input = limitSchema.parse(request.query); return popularSearches(input.limit); });
  app.get("/v1/shopping/search/recent", async (request) => { const auth = await requireAuth(request); const input = limitSchema.parse(request.query); return recentSearches(auth.userId, input.limit); });
}
