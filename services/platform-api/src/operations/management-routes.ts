import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { requirePermission } from "../authorization.js";
import { AppError } from "../errors.js";
import { audit } from "../audit.js";

function safeMinor(value: bigint | null | undefined) {
  const n = Number(value ?? 0n);
  if (!Number.isSafeInteger(n)) throw new Error("Monetary value exceeds transport range");
  return n;
}

function sinceDays(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(1, days) + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function operationsManagementRoutes(app: FastifyInstance) {
  app.get("/v1/operations/management/overview", async (request) => {
    await requirePermission(request, "operations.command.read");
    const now = new Date();
    const [openCases, urgentCases, breachedCases, unassignedCases, openFeedback, roleAssignments, audit24h, activeBusinesses] = await Promise.all([
      db.supportCase.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.supportCase.count({ where: { priority: "URGENT", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.supportCase.count({ where: { slaDueAt: { lt: now }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.supportCase.count({ where: { assignedToUserId: null, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.platformFeedback.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.userRole.count({ where: { scopeKey: "platform", role: { key: { startsWith: "platform.operations." } } } }),
      db.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      db.organization.count({ where: { status: { in: ["ACTIVE", "VERIFIED"] } } }),
    ]);
    return { generatedAt: now.toISOString(), support: { openCases, urgentCases, breachedCases, unassignedCases }, feedback: { open: openFeedback }, access: { roleAssignments }, audit: { events24h: audit24h }, businesses: { active: activeBusinesses } };
  });

  app.get("/v1/operations/management/reports", async (request) => {
    await requirePermission(request, "operations.command.read");
    const query = z.object({ days: z.coerce.number().int().min(7).max(365).default(30) }).parse(request.query);
    const since = sinceDays(query.days);
    const [users, businesses, shopping, food, pharmacy, settlements, cases, feedback, risk] = await Promise.all([
      db.user.count({ where: { createdAt: { gte: since } } }),
      db.organization.count({ where: { createdAt: { gte: since } } }),
      db.shoppingSellerOrder.findMany({ where: { createdAt: { gte: since }, status: "DELIVERED" }, select: { totalMinor: true }, take: 10000 }),
      db.foodOrder.findMany({ where: { createdAt: { gte: since }, status: "DELIVERED" }, select: { totalMinor: true }, take: 10000 }),
      db.pharmacyOrder.findMany({ where: { createdAt: { gte: since }, status: "DELIVERED" }, select: { totalMinor: true }, take: 10000 }),
      db.businessSettlement.findMany({ where: { createdAt: { gte: since } }, select: { grossMinor: true, feeMinor: true, netMinor: true, status: true }, take: 5000 }),
      db.supportCase.findMany({ where: { createdAt: { gte: since } }, select: { status: true, priority: true, createdAt: true, resolvedAt: true }, take: 5000 }),
      db.platformFeedback.findMany({ where: { createdAt: { gte: since } }, select: { status: true, category: true, rating: true }, take: 5000 }),
      db.riskSignal.findMany({ where: { createdAt: { gte: since } }, select: { severity: true, status: true }, take: 5000 }),
    ]);
    const grossCommerceMinor = [...shopping, ...food, ...pharmacy].reduce((sum, item) => sum + safeMinor(item.totalMinor), 0);
    const resolvedCases = cases.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status));
    const resolutionHours = resolvedCases.flatMap((item) => item.resolvedAt ? [(item.resolvedAt.getTime() - item.createdAt.getTime()) / 3_600_000] : []);
    const ratings = feedback.flatMap((item) => item.rating ? [item.rating] : []);
    return {
      generatedAt: new Date().toISOString(), range: { days: query.days, since: since.toISOString() }, currency: "NGN",
      growth: { newUsers: users, newBusinesses: businesses },
      commerce: { deliveredOrders: shopping.length + food.length + pharmacy.length, grossMinor: grossCommerceMinor, shoppingOrders: shopping.length, foodOrders: food.length, pharmacyOrders: pharmacy.length },
      finance: { settlementGrossMinor: settlements.reduce((sum, item) => sum + safeMinor(item.grossMinor), 0), settlementFeesMinor: settlements.reduce((sum, item) => sum + safeMinor(item.feeMinor), 0), settlementNetMinor: settlements.reduce((sum, item) => sum + safeMinor(item.netMinor), 0), pendingSettlements: settlements.filter((item) => !["SETTLED", "PAID"].includes(item.status)).length },
      support: { created: cases.length, resolved: resolvedCases.length, urgent: cases.filter((item) => item.priority === "URGENT").length, averageResolutionHours: resolutionHours.length ? Math.round((resolutionHours.reduce((sum, item) => sum + item, 0) / resolutionHours.length) * 10) / 10 : null },
      feedback: { created: feedback.length, open: feedback.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length, averageRating: ratings.length ? Math.round((ratings.reduce((sum, item) => sum + item, 0) / ratings.length) * 10) / 10 : null },
      risk: { signals: risk.length, highOrCriticalOpen: risk.filter((item) => ["HIGH", "CRITICAL"].includes(item.severity) && !["RESOLVED", "DISMISSED"].includes(item.status)).length },
    };
  });

  app.get("/v1/operations/management/feedback", async (request) => {
    await requirePermission(request, "operations.support.manage");
    const query = z.object({ status: z.string().optional(), category: z.string().optional(), q: z.string().optional(), limit: z.coerce.number().int().min(1).max(300).default(150) }).parse(request.query);
    const feedback = await db.platformFeedback.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.q ? { OR: [{ subject: { contains: query.q, mode: "insensitive" } }, { message: { contains: query.q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: query.limit,
    });
    return { feedback };
  });

  app.patch("/v1/operations/management/feedback/:id", async (request) => {
    const auth = await requirePermission(request, "operations.support.manage");
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const input = z.object({ status: z.enum(["OPEN", "REVIEWING", "PLANNED", "RESOLVED", "CLOSED"]).optional(), priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(), assignedToUserId: z.string().nullable().optional(), resolution: z.string().trim().max(3000).nullable().optional() }).parse(request.body);
    const existing = await db.platformFeedback.findUnique({ where: { id } });
    if (!existing) throw new AppError("NOT_FOUND", "Feedback item not found", 404);
    if (input.assignedToUserId) {
      const assignee = await db.user.findFirst({
        where: { id: input.assignedToUserId, status: "ACTIVE", roleAssignments: { some: { scopeKey: "platform", role: { key: { startsWith: "platform.operations." } } } } },
        select: { id: true },
      });
      if (!assignee) throw new AppError("BAD_REQUEST", "Feedback assignee must be an active Operations user", 400);
    }
    const normalizedResolution = input.resolution === undefined ? undefined : input.resolution;
    const unchanged = (input.status === undefined || input.status === existing.status)
      && (input.priority === undefined || input.priority === existing.priority)
      && (input.assignedToUserId === undefined || input.assignedToUserId === existing.assignedToUserId)
      && (normalizedResolution === undefined || normalizedResolution === existing.resolution);
    if (unchanged) {
      await audit({ actorUserId: auth.userId, action: "operations.feedback.noop", resourceType: "PlatformFeedback", resourceId: id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "ALREADY_DONE" } });
      return { feedback: existing, actionState: "ALREADY_DONE" as const };
    }
    const status = input.status ?? existing.status;
    const feedback = await db.platformFeedback.update({ where: { id }, data: { ...input, resolvedAt: ["RESOLVED", "CLOSED"].includes(status) ? existing.resolvedAt ?? new Date() : null } });
    await audit({ actorUserId: auth.userId, action: "operations.feedback.updated", resourceType: "PlatformFeedback", resourceId: id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "COMPLETED" } });
    return { feedback, actionState: "COMPLETED" as const };
  });

  app.get("/v1/operations/management/audit", async (request) => {
    await requirePermission(request, "operations.audit.read");
    const query = z.object({ q: z.string().optional(), action: z.string().optional(), limit: z.coerce.number().int().min(1).max(300).default(150) }).parse(request.query);
    const logs = await db.auditLog.findMany({
      where: {
        ...(query.action ? { action: { contains: query.action, mode: "insensitive" } } : {}),
        ...(query.q ? { OR: [{ action: { contains: query.q, mode: "insensitive" } }, { resourceType: { contains: query.q, mode: "insensitive" } }, { resourceId: { contains: query.q, mode: "insensitive" } }] } : {}),
      },
      include: { actor: { select: { id: true, displayName: true, emails: { where: { isPrimary: true }, take: 1, select: { email: true } } } } },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });
    return { logs: logs.map((log) => ({ id: log.id, action: log.action, resourceType: log.resourceType, resourceId: log.resourceId, requestId: log.requestId, ipAddress: log.ipAddress, metadata: log.metadata, createdAt: log.createdAt.toISOString(), actor: log.actor ? { id: log.actor.id, displayName: log.actor.displayName, email: log.actor.emails[0]?.email ?? null } : null })) };
  });

  app.get("/v1/operations/management/support-agents", async (request) => {
    await requirePermission(request, "support.manage");
    const query = z.object({ q: z.string().trim().max(200).optional(), limit: z.coerce.number().int().min(1).max(100).default(100) }).parse(request.query);
    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        roleAssignments: { some: { scopeKey: "platform", role: { key: { startsWith: "platform.operations." } } } },
        ...(query.q ? { OR: [{ id: { contains: query.q, mode: "insensitive" } }, { displayName: { contains: query.q, mode: "insensitive" } }, { emails: { some: { email: { contains: query.q, mode: "insensitive" } } } }] } : {}),
      },
      select: {
        id: true, displayName: true,
        emails: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1, select: { email: true } },
        roleAssignments: { where: { scopeKey: "platform", role: { key: { startsWith: "platform.operations." } } }, include: { role: true } },
      },
      orderBy: { createdAt: "desc" }, take: query.limit,
    });
    return { agents: users.map((user) => ({ userId: user.id, displayName: user.displayName, email: user.emails[0]?.email ?? null, roles: user.roleAssignments.map((assignment) => assignment.role.name) })) };
  });

  app.get("/v1/operations/management/users", async (request) => {
    await requirePermission(request, "operations.roles.manage");
    const query = z.object({ q: z.string().trim().max(200).optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).parse(request.query);
    const users = await db.user.findMany({
      where: query.q ? { OR: [{ id: { contains: query.q, mode: "insensitive" } }, { displayName: { contains: query.q, mode: "insensitive" } }, { emails: { some: { email: { contains: query.q, mode: "insensitive" } } } }] } : undefined,
      select: { id: true, displayName: true, status: true, verificationLevel: true, createdAt: true, emails: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 2, select: { email: true, isPrimary: true, verifiedAt: true } }, roleAssignments: { where: { scopeKey: "platform", role: { key: { startsWith: "platform.operations." } } }, include: { role: true } } },
      orderBy: { createdAt: "desc" }, take: query.limit,
    });
    return { users: users.map((user) => ({ userId: user.id, displayName: user.displayName, email: user.emails[0]?.email ?? null, status: user.status, verificationLevel: user.verificationLevel, createdAt: user.createdAt.toISOString(), roles: user.roleAssignments.map((assignment) => ({ assignmentId: assignment.id, roleKey: assignment.role.key, roleName: assignment.role.name })) })) };
  });
}
