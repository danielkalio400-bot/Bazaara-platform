import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";
import { audit } from "../audit.js";

const planCatalog = {
  STARTER: {
    key: "STARTER",
    name: "Starter",
    description: "Core Business workspace for a small team.",
    monthlyMinor: 0,
    annualMinor: 0,
    includedSeats: 3,
    features: ["Business dashboard", "Orders & catalog", "Basic analytics", "Invoices", "Support"],
  },
  GROWTH: {
    key: "GROWTH",
    name: "Growth",
    description: "Advanced analytics, automation and larger teams.",
    monthlyMinor: 2500000,
    annualMinor: 25000000,
    includedSeats: 15,
    features: ["Everything in Starter", "Advanced reports", "Scheduled reports", "Priority support", "API & webhooks", "15 seats"],
  },
  SCALE: {
    key: "SCALE",
    name: "Scale",
    description: "Multi-branch controls, high-volume operations and premium support.",
    monthlyMinor: 7500000,
    annualMinor: 75000000,
    includedSeats: 50,
    features: ["Everything in Growth", "50 seats", "Multi-branch controls", "Advanced permissions", "Dedicated support", "Higher API limits"],
  },
  ENTERPRISE: {
    key: "ENTERPRISE",
    name: "Enterprise",
    description: "Custom governance, support and commercial terms.",
    monthlyMinor: 0,
    annualMinor: 0,
    includedSeats: 100,
    features: ["Custom seats", "Dedicated account team", "Custom integrations", "SLA", "Security review", "Custom pricing"],
  },
} as const;

type PlanKey = keyof typeof planCatalog;

type BusinessAccess = {
  userId: string;
  roleKey: string;
  permissions: string[];
};

function safeMinor(value: bigint | null | undefined) {
  const n = Number(value ?? 0n);
  if (!Number.isSafeInteger(n)) throw new Error("Monetary value exceeds transport range");
  return n;
}

function serializeSubscription<T extends { priceMinor: bigint; currentPeriodStart: Date; currentPeriodEnd: Date; cancelledAt: Date | null; createdAt: Date; updatedAt: Date }>(row: T) {
  return {
    ...row,
    priceMinor: safeMinor(row.priceMinor),
    currentPeriodStart: row.currentPeriodStart.toISOString(),
    currentPeriodEnd: row.currentPeriodEnd.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeSubscriptionEvent<T extends { priceMinor: bigint | null; createdAt: Date }>(row: T) {
  return {
    ...row,
    priceMinor: row.priceMinor == null ? null : safeMinor(row.priceMinor),
    createdAt: row.createdAt.toISOString(),
  };
}

async function businessAccess(request: FastifyRequest, organizationId: string): Promise<BusinessAccess> {
  const auth = await requireAuth(request);
  const member = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: auth.userId } },
    select: { status: true, roleKey: true, permissions: true },
  });
  if (!member || member.status !== "ACTIVE") {
    throw new AppError("FORBIDDEN", "Active organization membership required", 403);
  }
  return { userId: auth.userId, roleKey: member.roleKey, permissions: member.permissions };
}

function requireBusinessAdmin(access: BusinessAccess) {
  if (["OWNER", "ADMIN"].includes(access.roleKey)) return;
  if (access.permissions.includes("*") || access.permissions.includes("finance.manage") || access.permissions.includes("settings.manage")) return;
  throw new AppError("FORBIDDEN", "Owner or admin permission required", 403);
}

function requireBusinessInsightAccess(access: BusinessAccess) {
  if (["OWNER", "ADMIN"].includes(access.roleKey)) return;
  if (access.permissions.includes("*") || access.permissions.includes("analytics.read") || access.permissions.includes("finance.read")) return;
  throw new AppError("FORBIDDEN", "Analytics or finance permission required", 403);
}

function rangeStart(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Math.max(1, days) + 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextScheduleDate(frequency: string) {
  const next = new Date();
  if (frequency === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
  else if (frequency === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
  else if (frequency === "QUARTERLY") next.setUTCMonth(next.getUTCMonth() + 3);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCHours(7, 0, 0, 0);
  return next;
}

async function organizationCommerce(organizationId: string, since: Date) {
  const merchants = await db.merchant.findMany({
    where: { organizationId },
    select: { id: true, vertical: true, foodRestaurant: { select: { id: true } } },
  });
  const merchantIds = merchants.map((merchant) => merchant.id);
  const restaurantIds = merchants.flatMap((merchant) => merchant.foodRestaurant?.id ? [merchant.foodRestaurant.id] : []);

  const [shoppingOrders, foodOrders, pharmacyOrders] = await Promise.all([
    db.shoppingSellerOrder.findMany({
      where: { merchantId: { in: merchantIds }, createdAt: { gte: since } },
      select: { id: true, totalMinor: true, status: true, createdAt: true, merchant: { select: { vertical: true } } },
      orderBy: { createdAt: "asc" },
      take: 5000,
    }),
    db.foodOrder.findMany({
      where: { restaurantId: { in: restaurantIds }, createdAt: { gte: since } },
      select: { id: true, totalMinor: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 5000,
    }),
    db.pharmacyOrder.findMany({
      where: { merchantId: { in: merchantIds }, createdAt: { gte: since } },
      select: { id: true, totalMinor: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 5000,
    }),
  ]);

  return { merchants, shoppingOrders, foodOrders, pharmacyOrders };
}

export async function businessManagementRoutes(app: FastifyInstance) {
  app.get("/v1/business/management/plans", async () => ({
    currency: "NGN",
    plans: Object.values(planCatalog),
  }));

  app.get("/v1/business/organizations/:organizationId/management/revenue", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const query = z.object({ days: z.coerce.number().int().min(7).max(365).default(30) }).parse(request.query);
    const access = await businessAccess(request, organizationId);
    requireBusinessInsightAccess(access);
    const since = rangeStart(query.days);
    const commerce = await organizationCommerce(organizationId, since);

    const deliveredShopping = commerce.shoppingOrders.filter((order) => order.status === "DELIVERED");
    const deliveredFood = commerce.foodOrders.filter((order) => order.status === "DELIVERED");
    const deliveredPharmacy = commerce.pharmacyOrders.filter((order) => order.status === "DELIVERED");

    const timeline = new Map<string, { date: string; grossMinor: number; orders: number }>();
    for (let index = 0; index < query.days; index += 1) {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + index);
      const key = dayKey(date);
      timeline.set(key, { date: key, grossMinor: 0, orders: 0 });
    }
    const add = (createdAt: Date, totalMinor: bigint) => {
      const key = dayKey(createdAt);
      const row = timeline.get(key);
      if (!row) return;
      row.grossMinor += safeMinor(totalMinor);
      row.orders += 1;
    };
    deliveredShopping.forEach((order) => add(order.createdAt, order.totalMinor));
    deliveredFood.forEach((order) => add(order.createdAt, order.totalMinor));
    deliveredPharmacy.forEach((order) => add(order.createdAt, order.totalMinor));

    const verticals = {
      SHOPPING: { orders: 0, grossMinor: 0 },
      GROCERY: { orders: 0, grossMinor: 0 },
      FOOD: { orders: deliveredFood.length, grossMinor: deliveredFood.reduce((sum, item) => sum + safeMinor(item.totalMinor), 0) },
      PHARMACY: { orders: deliveredPharmacy.length, grossMinor: deliveredPharmacy.reduce((sum, item) => sum + safeMinor(item.totalMinor), 0) },
    };
    for (const order of deliveredShopping) {
      const key = order.merchant.vertical.toUpperCase() === "GROCERY" ? "GROCERY" : "SHOPPING";
      verticals[key].orders += 1;
      verticals[key].grossMinor += safeMinor(order.totalMinor);
    }

    const grossMinor = Object.values(verticals).reduce((sum, item) => sum + item.grossMinor, 0);
    const orders = Object.values(verticals).reduce((sum, item) => sum + item.orders, 0);

    const [settlements, invoices] = await Promise.all([
      db.businessSettlement.findMany({ where: { organizationId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 500 }),
      db.businessInvoice.findMany({ where: { organizationId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 500 }),
    ]);

    return {
      currency: "NGN",
      range: { days: query.days, since: since.toISOString(), generatedAt: new Date().toISOString() },
      totals: {
        grossMinor,
        orders,
        averageOrderMinor: orders ? Math.round(grossMinor / orders) : 0,
        settledNetMinor: settlements.filter((item) => ["SETTLED", "PAID"].includes(item.status)).reduce((sum, item) => sum + safeMinor(item.netMinor), 0),
        pendingSettlementMinor: settlements.filter((item) => !["SETTLED", "PAID"].includes(item.status)).reduce((sum, item) => sum + safeMinor(item.netMinor), 0),
        outstandingInvoiceMinor: invoices.filter((item) => !["PAID", "VOID"].includes(item.status)).reduce((sum, item) => sum + safeMinor(item.totalMinor), 0),
      },
      verticals,
      timeline: [...timeline.values()],
      settlements: settlements.slice(0, 12).map((item) => ({
        id: item.id,
        reference: item.reference,
        status: item.status,
        grossMinor: safeMinor(item.grossMinor),
        feeMinor: safeMinor(item.feeMinor),
        netMinor: safeMinor(item.netMinor),
        createdAt: item.createdAt.toISOString(),
      })),
    };
  });

  app.get("/v1/business/organizations/:organizationId/management/reports", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const query = z.object({ days: z.coerce.number().int().min(7).max(365).default(30) }).parse(request.query);
    const access = await businessAccess(request, organizationId);
    requireBusinessInsightAccess(access);
    const since = rangeStart(query.days);
    const commerce = await organizationCommerce(organizationId, since);

    const [settlements, invoices, supportCases, members, branches, schedules] = await Promise.all([
      db.businessSettlement.findMany({ where: { organizationId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 1000 }),
      db.businessInvoice.findMany({ where: { organizationId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 1000 }),
      db.supportCase.findMany({ where: { organizationId, createdAt: { gte: since } }, select: { status: true, priority: true, createdAt: true, resolvedAt: true, lastActivityAt: true }, take: 1000 }),
      db.organizationMember.count({ where: { organizationId, status: "ACTIVE" } }),
      db.businessBranch.count({ where: { organizationId, status: "ACTIVE" } }),
      db.businessReportSchedule.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
    ]);

    const delivered = [
      ...commerce.shoppingOrders.filter((item) => item.status === "DELIVERED").map((item) => safeMinor(item.totalMinor)),
      ...commerce.foodOrders.filter((item) => item.status === "DELIVERED").map((item) => safeMinor(item.totalMinor)),
      ...commerce.pharmacyOrders.filter((item) => item.status === "DELIVERED").map((item) => safeMinor(item.totalMinor)),
    ];
    const grossMinor = delivered.reduce((sum, item) => sum + item, 0);

    return {
      generatedAt: new Date().toISOString(),
      range: { days: query.days, since: since.toISOString() },
      currency: "NGN",
      summary: {
        grossMinor,
        deliveredOrders: delivered.length,
        averageOrderMinor: delivered.length ? Math.round(grossMinor / delivered.length) : 0,
        settlementGrossMinor: settlements.reduce((sum, item) => sum + safeMinor(item.grossMinor), 0),
        settlementFeesMinor: settlements.reduce((sum, item) => sum + safeMinor(item.feeMinor), 0),
        settlementNetMinor: settlements.reduce((sum, item) => sum + safeMinor(item.netMinor), 0),
        outstandingInvoiceMinor: invoices.filter((item) => !["PAID", "VOID"].includes(item.status)).reduce((sum, item) => sum + safeMinor(item.totalMinor), 0),
        openSupportCases: supportCases.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length,
        urgentSupportCases: supportCases.filter((item) => item.priority === "URGENT" && !["RESOLVED", "CLOSED"].includes(item.status)).length,
        activeMembers: members,
        activeBranches: branches,
      },
      invoices: invoices.slice(0, 50).map((item) => ({ id: item.id, invoiceNumber: item.invoiceNumber, customerName: item.customerName, totalMinor: safeMinor(item.totalMinor), status: item.status, createdAt: item.createdAt.toISOString(), dueAt: item.dueAt?.toISOString() ?? null })),
      settlements: settlements.slice(0, 50).map((item) => ({ id: item.id, reference: item.reference, netMinor: safeMinor(item.netMinor), feeMinor: safeMinor(item.feeMinor), status: item.status, createdAt: item.createdAt.toISOString() })),
      support: {
        total: supportCases.length,
        open: supportCases.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length,
        resolved: supportCases.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
      },
      schedules,
    };
  });

  app.get("/v1/business/organizations/:organizationId/management/report-schedules", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    requireBusinessInsightAccess(access);
    const schedules = await db.businessReportSchedule.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return { schedules };
  });

  app.post("/v1/business/organizations/:organizationId/management/report-schedules", async (request, reply) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    requireBusinessAdmin(access);
    const input = z.object({
      name: z.string().trim().min(2).max(120),
      reportType: z.enum(["EXECUTIVE", "REVENUE", "SETTLEMENTS", "INVOICES", "SUPPORT"]),
      frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]),
      recipients: z.array(z.string().email()).min(1).max(20),
    }).parse(request.body);
    const duplicate = await db.businessReportSchedule.findFirst({
      where: {
        organizationId,
        name: input.name,
        reportType: input.reportType,
        frequency: input.frequency,
        active: true,
      },
      orderBy: { createdAt: "desc" },
    });
    if (duplicate && JSON.stringify([...duplicate.recipients].sort()) === JSON.stringify([...input.recipients].sort())) {
      await audit({ actorUserId: access.userId, action: "business.report-schedule.noop", resourceType: "BusinessReportSchedule", resourceId: duplicate.id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "ALREADY_DONE" } });
      return reply.code(200).send({ schedule: duplicate, actionState: "ALREADY_DONE" });
    }
    const schedule = await db.businessReportSchedule.create({
      data: { organizationId, createdByUserId: access.userId, ...input, nextRunAt: nextScheduleDate(input.frequency) },
    });
    await audit({ actorUserId: access.userId, action: "business.report-schedule.created", resourceType: "BusinessReportSchedule", resourceId: schedule.id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "COMPLETED" } });
    return reply.code(201).send({ schedule, actionState: "COMPLETED" });
  });

  app.patch("/v1/business/organizations/:organizationId/management/report-schedules/:scheduleId", async (request) => {
    const { organizationId, scheduleId } = z.object({ organizationId: z.string(), scheduleId: z.string() }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    requireBusinessAdmin(access);
    const input = z.object({ active: z.boolean().optional(), frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]).optional(), recipients: z.array(z.string().email()).min(1).max(20).optional() }).parse(request.body);
    const existing = await db.businessReportSchedule.findFirst({ where: { id: scheduleId, organizationId } });
    if (!existing) throw new AppError("NOT_FOUND", "Report schedule not found", 404);
    const sameRecipients = input.recipients === undefined || JSON.stringify([...existing.recipients].sort()) === JSON.stringify([...input.recipients].sort());
    const unchanged = (input.active === undefined || input.active === existing.active) && (input.frequency === undefined || input.frequency === existing.frequency) && sameRecipients;
    if (unchanged) {
      await audit({ actorUserId: access.userId, action: "business.report-schedule.noop", resourceType: "BusinessReportSchedule", resourceId: existing.id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "ALREADY_DONE" } });
      return { schedule: existing, actionState: "ALREADY_DONE" };
    }
    const schedule = await db.businessReportSchedule.update({ where: { id: scheduleId }, data: { ...input, nextRunAt: input.frequency ? nextScheduleDate(input.frequency) : undefined } });
    await audit({ actorUserId: access.userId, action: "business.report-schedule.updated", resourceType: "BusinessReportSchedule", resourceId: schedule.id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "COMPLETED" } });
    return { schedule, actionState: "COMPLETED" };
  });

  app.delete("/v1/business/organizations/:organizationId/management/report-schedules/:scheduleId", async (request, reply) => {
    const { organizationId, scheduleId } = z.object({ organizationId: z.string(), scheduleId: z.string() }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    requireBusinessAdmin(access);
    const existing = await db.businessReportSchedule.findFirst({ where: { id: scheduleId, organizationId } });
    if (!existing) return reply.code(204).send();
    await db.businessReportSchedule.delete({ where: { id: scheduleId } });
    await audit({ actorUserId: access.userId, action: "business.report-schedule.deleted", resourceType: "BusinessReportSchedule", resourceId: scheduleId, requestId: request.id, ipAddress: request.ip });
    return reply.code(204).send();
  });

  app.get("/v1/business/organizations/:organizationId/management/subscription", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    requireBusinessInsightAccess(access);
    const subscription = await db.businessSubscription.findUnique({ where: { organizationId } });
    const events = subscription ? await db.businessSubscriptionEvent.findMany({ where: { subscriptionId: subscription.id }, orderBy: { createdAt: "desc" }, take: 20 }) : [];
    return { currency: "NGN", plans: Object.values(planCatalog), subscription: subscription ? serializeSubscription(subscription) : null, events: events.map(serializeSubscriptionEvent) };
  });

  app.post("/v1/business/organizations/:organizationId/management/subscription", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    requireBusinessAdmin(access);
    const input = z.object({ planKey: z.enum(["STARTER", "GROWTH", "SCALE", "ENTERPRISE"]), billingCycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"), seats: z.number().int().min(1).max(10000).optional() }).parse(request.body);
    const plan = planCatalog[input.planKey as PlanKey];
    const existing = await db.businessSubscription.findUnique({ where: { organizationId } });
    const desiredSeats = input.seats ?? plan.includedSeats;
    if (existing && existing.planKey === plan.key && existing.billingCycle === input.billingCycle && existing.seats === desiredSeats && existing.status === "ACTIVE" && !existing.cancelAtPeriodEnd) {
      await audit({ actorUserId: access.userId, action: "business.subscription.noop", resourceType: "BusinessSubscription", resourceId: existing.id, requestId: request.id, ipAddress: request.ip, metadata: { planKey: plan.key, billingCycle: input.billingCycle, seats: desiredSeats, actionState: "ALREADY_DONE" } });
      return { subscription: serializeSubscription(existing), actionState: "ALREADY_DONE" };
    }
    const now = new Date();
    const end = new Date(now);
    if (input.billingCycle === "ANNUAL") end.setUTCFullYear(end.getUTCFullYear() + 1);
    else end.setUTCMonth(end.getUTCMonth() + 1);
    const priceMinor = input.billingCycle === "ANNUAL" ? plan.annualMinor : plan.monthlyMinor;
    const subscription = await db.businessSubscription.upsert({
      where: { organizationId },
      create: { organizationId, planKey: plan.key, billingCycle: input.billingCycle, currency: "NGN", priceMinor: BigInt(priceMinor), seats: input.seats ?? plan.includedSeats, currentPeriodStart: now, currentPeriodEnd: end },
      update: { planKey: plan.key, billingCycle: input.billingCycle, priceMinor: BigInt(priceMinor), seats: input.seats ?? plan.includedSeats, status: "ACTIVE", cancelAtPeriodEnd: false, cancelledAt: null, currentPeriodStart: now, currentPeriodEnd: end },
    });
    await db.businessSubscriptionEvent.create({ data: { organizationId, subscriptionId: subscription.id, type: "PLAN_CHANGED", planKey: plan.key, billingCycle: input.billingCycle, priceMinor: BigInt(priceMinor), actorUserId: access.userId } });
    await audit({ actorUserId: access.userId, action: "business.subscription.changed", resourceType: "BusinessSubscription", resourceId: subscription.id, requestId: request.id, ipAddress: request.ip, metadata: { planKey: plan.key, billingCycle: input.billingCycle } });
    return { subscription: serializeSubscription(subscription), actionState: "COMPLETED" };
  });

  app.patch("/v1/business/organizations/:organizationId/management/subscription", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    requireBusinessAdmin(access);
    const input = z.object({ cancelAtPeriodEnd: z.boolean(), seats: z.number().int().min(1).max(10000).optional() }).parse(request.body);
    const existing = await db.businessSubscription.findUnique({ where: { organizationId } });
    if (!existing) throw new AppError("NOT_FOUND", "No subscription exists for this business", 404);
    const desiredSeats = input.seats ?? existing.seats;
    if (existing.cancelAtPeriodEnd === input.cancelAtPeriodEnd && existing.seats === desiredSeats) {
      await audit({ actorUserId: access.userId, action: "business.subscription.noop", resourceType: "BusinessSubscription", resourceId: existing.id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "ALREADY_DONE" } });
      return { subscription: serializeSubscription(existing), actionState: "ALREADY_DONE" };
    }
    const subscription = await db.businessSubscription.update({ where: { organizationId }, data: { cancelAtPeriodEnd: input.cancelAtPeriodEnd, seats: input.seats } });
    await db.businessSubscriptionEvent.create({ data: { organizationId, subscriptionId: subscription.id, type: input.cancelAtPeriodEnd ? "CANCELLATION_SCHEDULED" : "SUBSCRIPTION_UPDATED", planKey: subscription.planKey, billingCycle: subscription.billingCycle, priceMinor: subscription.priceMinor, actorUserId: access.userId } });
    await audit({ actorUserId: access.userId, action: "business.subscription.updated", resourceType: "BusinessSubscription", resourceId: subscription.id, requestId: request.id, ipAddress: request.ip, metadata: { ...input, actionState: "COMPLETED" } });
    return { subscription: serializeSubscription(subscription), actionState: "COMPLETED" };
  });

  app.get("/v1/business/organizations/:organizationId/management/feedback", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    await businessAccess(request, organizationId);
    const feedback = await db.platformFeedback.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 });
    return { feedback };
  });

  app.post("/v1/business/organizations/:organizationId/management/feedback", async (request, reply) => {
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const access = await businessAccess(request, organizationId);
    const input = z.object({ category: z.enum(["GENERAL", "BUG", "FEATURE", "BILLING", "SUPPORT", "UX"]), rating: z.number().int().min(1).max(5).optional(), subject: z.string().trim().min(3).max(160), message: z.string().trim().min(5).max(5000), sourcePath: z.string().trim().max(300).optional() }).parse(request.body);
    const feedback = await db.platformFeedback.create({ data: { userId: access.userId, organizationId, channel: "BUSINESS", ...input } });
    await audit({ actorUserId: access.userId, action: "business.feedback.created", resourceType: "PlatformFeedback", resourceId: feedback.id, requestId: request.id, ipAddress: request.ip });
    return reply.code(201).send({ feedback });
  });
}
