import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requirePermission } from "../authorization.js";
import { audit } from "../audit.js";
import { evaluateOrderRisk, listRiskSignals, recordRiskSignal, resolveRiskSignal } from "./service.js";

export async function riskRoutes(app: FastifyInstance) {
  app.get("/v1/admin/risk/signals", async (request) => {
    await requirePermission(request, "risk.read");
    const query = request.query as { status?: string; severity?: string; q?: string; limit?: string };
    return listRiskSignals({ status: query.status, severity: query.severity, q: query.q, limit: query.limit ? Number(query.limit) : undefined });
  });

  app.post("/v1/admin/risk/signals", async (request, reply) => {
    const auth = await requirePermission(request, "risk.manage");
    const input = z.object({
      userId: z.string().min(1).optional(), merchantId: z.string().min(1).optional(), orderId: z.string().min(1).optional(),
      type: z.string().trim().min(3).max(100), score: z.coerce.number().int().min(0).max(100),
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(), explanation: z.string().trim().min(5).max(1000),
      evidence: z.record(z.string(), z.unknown()).default({}),
    }).parse(request.body);
    const signal = await recordRiskSignal({ ...input, evidence: input.evidence as any, ruleVersion: "operations-manual-v1" });
    await audit({ actorUserId: auth.userId, action: "risk.signal.created", resourceType: "RiskSignal", resourceId: signal.id, requestId: request.id, ipAddress: request.ip, metadata: { type: input.type, orderId: input.orderId, merchantId: input.merchantId } });
    return reply.code(201).send({ signal });
  });

  app.post("/v1/admin/risk/orders/:orderId/evaluate", async (request) => {
    const auth = await requirePermission(request, "risk.manage");
    const { orderId } = request.params as { orderId: string };
    const result = await evaluateOrderRisk(orderId);
    await audit({ actorUserId: auth.userId, action: "risk.order.evaluated", resourceType: "ShoppingOrder", resourceId: orderId, requestId: request.id, ipAddress: request.ip, metadata: { signalCount: result.signals.length } });
    return result;
  });

  app.patch("/v1/admin/risk/signals/:id", async (request) => {
    const auth = await requirePermission(request, "risk.manage");
    const { id } = request.params as { id: string };
    const input = z.object({ status: z.enum(["ACKNOWLEDGED", "DISMISSED", "RESOLVED"]) }).parse(request.body);
    const result = await resolveRiskSignal(id, auth.userId, input.status);
    await audit({ actorUserId: auth.userId, action: result.actionState === "ALREADY_DONE" ? "risk.signal.noop" : "risk.signal.updated", resourceType: "RiskSignal", resourceId: id, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: result.actionState } });
    return result;
  });
}
