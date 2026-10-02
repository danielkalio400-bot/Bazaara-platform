import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";

const RULE_VERSION = "shopping-risk-2026-09-v1";
const HIGH_VALUE_MINOR = 50_000_000n; // NGN 500,000

type Candidate = {
  type: string;
  score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
  evidence: Prisma.InputJsonObject;
};

function severity(score: number): Candidate["severity"] {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

async function upsertOpenSignal(orderId: string, userId: string, candidate: Omit<Candidate, "severity"> & { severity?: Candidate["severity"] }) {
  const existing = await db.riskSignal.findFirst({
    where: { orderId, type: candidate.type, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    orderBy: { createdAt: "desc" },
  });
  const data = {
    userId,
    orderId,
    type: candidate.type,
    score: Math.max(0, Math.min(100, candidate.score)),
    severity: candidate.severity ?? severity(candidate.score),
    explanation: candidate.explanation,
    evidence: candidate.evidence,
    ruleVersion: RULE_VERSION,
  } as const;
  if (existing) return db.riskSignal.update({ where: { id: existing.id }, data });
  return db.riskSignal.create({ data });
}

export async function evaluateOrderRisk(orderId: string) {
  const order = await db.shoppingOrder.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, createdAt: true } },
      paymentIntent: { include: { failures: { where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } } } },
    },
  });
  if (!order) return { signals: [] };

  const candidates: Candidate[] = [];
  if (order.totalMinor >= HIGH_VALUE_MINOR) {
    const score = order.totalMinor >= HIGH_VALUE_MINOR * 3n ? 75 : 45;
    candidates.push({ type: "HIGH_ORDER_VALUE", score, severity: severity(score), explanation: "Order value is materially above the standard Shopping risk review threshold.", evidence: { totalMinor: order.totalMinor.toString(), thresholdMinor: HIGH_VALUE_MINOR.toString() } });
  }

  if (order.subtotalMinor > 0n && order.discountMinor > 0n) {
    const ratio = Number((order.discountMinor * 10_000n) / order.subtotalMinor) / 100;
    if (ratio >= 30) {
      const score = ratio >= 50 ? 80 : 55;
      candidates.push({ type: "HIGH_PROMOTION_RATIO", score, severity: severity(score), explanation: "The applied promotion represents an unusually high share of merchandise value.", evidence: { discountPercent: ratio, discountMinor: order.discountMinor.toString(), subtotalMinor: order.subtotalMinor.toString() } });
    }
  }

  const recentOrderCount = await db.shoppingOrder.count({ where: { userId: order.userId, placedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
  if (recentOrderCount >= 5) {
    const score = recentOrderCount >= 10 ? 85 : 60;
    candidates.push({ type: "RAPID_ORDERING", score, severity: severity(score), explanation: "Several orders were placed by the same BazID account within one hour.", evidence: { orderCountLastHour: recentOrderCount } });
  }

  const paymentFailures = order.paymentIntent?.failures.length ?? 0;
  if (paymentFailures >= 3) {
    const score = Math.min(90, 45 + paymentFailures * 8);
    candidates.push({ type: "REPEATED_PAYMENT_FAILURES", score, severity: severity(score), explanation: "This payment has accumulated repeated provider/payment failures in a short window.", evidence: { failuresLast24Hours: paymentFailures } });
  }

  const [recentReturns, recentDelivered] = await Promise.all([
    db.shoppingReturn.count({ where: { order: { userId: order.userId }, requestedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } }),
    db.shoppingOrder.count({ where: { userId: order.userId, status: { in: ["DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUND_PENDING", "REFUNDED"] }, placedAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } }),
  ]);
  if (recentReturns >= 3 && recentDelivered > 0 && recentReturns / recentDelivered >= 0.6) {
    const ratio = Math.round((recentReturns / recentDelivered) * 100);
    const score = ratio >= 85 ? 85 : 65;
    candidates.push({ type: "ELEVATED_RETURN_RATE", score, severity: severity(score), explanation: "The account has an elevated recent return-to-delivered-order ratio. This is a review signal, not an automatic rejection.", evidence: { returnsLast90Days: recentReturns, deliveredOrdersLast180Days: recentDelivered, ratioPercent: ratio } });
  }

  const saved = [];
  for (const candidate of candidates) saved.push(await upsertOpenSignal(order.id, order.userId, candidate));
  return { signals: saved };
}


export async function recordRiskSignal(input: {
  userId?: string;
  merchantId?: string;
  orderId?: string;
  type: string;
  score: number;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
  evidence: Prisma.InputJsonObject;
  ruleVersion?: string;
}) {
  const score = Math.max(0, Math.min(100, Math.round(input.score)));
  return db.riskSignal.create({
    data: {
      userId: input.userId,
      merchantId: input.merchantId,
      orderId: input.orderId,
      type: input.type.trim().slice(0, 100),
      score,
      severity: input.severity ?? severity(score),
      explanation: input.explanation.trim().slice(0, 1000),
      evidence: input.evidence,
      ruleVersion: input.ruleVersion ?? RULE_VERSION,
    },
  });
}

export async function listRiskSignals(input: { status?: string; severity?: string; q?: string; limit?: number } = {}) {
  const limit = Math.min(250, Math.max(1, input.limit ?? 150));
  const rows = await db.riskSignal.findMany({
    where: {
      ...(input.status ? { status: input.status as any } : {}),
      ...(input.severity ? { severity: input.severity as any } : {}),
      ...(input.q ? { OR: [{ type: { contains: input.q, mode: "insensitive" } }, { explanation: { contains: input.q, mode: "insensitive" } }, { order: { orderNumber: { contains: input.q, mode: "insensitive" } } }] } : {}),
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true, totalMinor: true, currency: true } }, user: { select: { id: true, displayName: true, emails: { where: { isPrimary: true }, take: 1 } } }, merchant: { include: { organization: { select: { displayName: true } } } }, resolvedBy: { select: { id: true, displayName: true } } },
  });
  return { signals: rows.map((row) => ({ ...row, order: row.order ? { ...row.order, totalMinor: Number(row.order.totalMinor) } : null, user: row.user ? { id: row.user.id, displayName: row.user.displayName, email: row.user.emails[0]?.email ?? null } : null, merchant: row.merchant ? { id: row.merchant.id, name: row.merchant.organization.displayName } : null })) };
}

export async function resolveRiskSignal(id: string, resolverUserId: string, status: "ACKNOWLEDGED" | "DISMISSED" | "RESOLVED") {
  const signal = await db.riskSignal.findUnique({ where: { id } });
  if (!signal) throw new AppError("NOT_FOUND", "Risk signal not found", 404);
  if (signal.status === status) return { signal, actionState: "ALREADY_DONE" as const };
  const updated = await db.riskSignal.update({ where: { id }, data: { status, resolvedByUserId: status === "ACKNOWLEDGED" ? null : resolverUserId, resolvedAt: status === "ACKNOWLEDGED" ? null : new Date() } });
  return { signal: updated, actionState: "COMPLETED" as const };
}
