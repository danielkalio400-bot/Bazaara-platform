import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import { z } from "zod";
import { audit } from "../audit.js";
import { requireAuth } from "../auth.js";
import { applyPromotionToCheckout, clearPromotionFromCheckout } from "./promotions.js";

const promotionSchema = z.object({ code: z.string().trim().min(2).max(40) });

function requestFingerprint(ip: string, userAgent?: string) {
  return createHash("sha256").update(`${ip}|${userAgent ?? ""}`).digest("base64url");
}

export async function shoppingPromotionRoutes(app: FastifyInstance) {
  app.post("/v1/shopping/checkouts/:checkoutId/promotion", async (request) => {
    const auth = await requireAuth(request);
    const { checkoutId } = request.params as { checkoutId: string };
    const input = promotionSchema.parse(request.body);
    const result = await applyPromotionToCheckout(auth.userId, checkoutId, input.code, {
      requestFingerprint: requestFingerprint(request.ip, request.headers["user-agent"]),
    });
    await audit({ actorUserId: auth.userId, action: "shopping.promotion.applied", resourceType: "ShoppingCheckout", resourceId: checkoutId, requestId: request.id, ipAddress: request.ip, metadata: { code: result.promotion.code } });
    return result;
  });

  app.delete("/v1/shopping/checkouts/:checkoutId/promotion", async (request) => {
    const auth = await requireAuth(request);
    const { checkoutId } = request.params as { checkoutId: string };
    const result = await clearPromotionFromCheckout(auth.userId, checkoutId);
    await audit({ actorUserId: auth.userId, action: "shopping.promotion.removed", resourceType: "ShoppingCheckout", resourceId: checkoutId, requestId: request.id, ipAddress: request.ip });
    return result;
  });
}
