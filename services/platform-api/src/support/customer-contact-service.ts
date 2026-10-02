import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotificationTx } from "../notifications/service.js";

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function serializeAttempt(row: any) {
  const deliveries = row.notification?.deliveries ?? [];
  const requestedDelivery = deliveries.find((delivery: any) => delivery.channel === row.channel) ?? null;
  return {
    id: row.id,
    clientActionId: row.clientActionId,
    supportCaseId: row.supportCaseId,
    customerUserId: row.customerUserId,
    actorUserId: row.actorUserId,
    notificationId: row.notificationId,
    channel: row.channel,
    destination: row.destination,
    destinationLabel: row.destinationLabel,
    reason: row.reason,
    message: row.message,
    status: row.status,
    outcome: row.outcome,
    notes: row.notes,
    durationSeconds: row.durationSeconds,
    followUpAt: row.followUpAt?.toISOString?.() ?? null,
    startedAt: row.startedAt?.toISOString?.() ?? row.startedAt,
    completedAt: row.completedAt?.toISOString?.() ?? null,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    actor: row.actor ? { id: row.actor.id, displayName: row.actor.displayName } : undefined,
    delivery: requestedDelivery ? {
      id: requestedDelivery.id,
      channel: requestedDelivery.channel,
      status: requestedDelivery.status,
      provider: requestedDelivery.provider,
      providerReference: requestedDelivery.providerReference,
      sentAt: requestedDelivery.sentAt?.toISOString?.() ?? null,
      lastError: requestedDelivery.lastError,
      attempts: requestedDelivery.attempts,
    } : null,
  };
}

async function supportCaseCustomer(caseId: string) {
  const supportCase = await db.supportCase.findUnique({
    where: { id: caseId },
    include: {
      user: {
        include: {
          emails: { where: { isPrimary: true }, take: 1 },
          phones: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });
  if (!supportCase) throw new AppError("NOT_FOUND", "Support case not found", 404);
  return { supportCase, customer: supportCase.user };
}

export async function getSupportCustomerContactCenter(caseId: string) {
  const { customer } = await supportCaseCustomer(caseId);
  const attempts = await db.supportCustomerContactAttempt.findMany({
    where: { supportCaseId: caseId },
    include: {
      actor: { select: { id: true, displayName: true } },
      notification: { include: { deliveries: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return {
    customer: {
      id: customer.id,
      displayName: customer.displayName,
      email: customer.emails[0]?.email ?? null,
      phone: customer.phones[0]?.e164 ?? null,
    },
    attempts: attempts.map(serializeAttempt),
  };
}

function destinationFor(channel: string, customer: any) {
  if (channel === "EMAIL") return customer.emails[0]?.email ?? null;
  if (["PHONE", "SMS", "WHATSAPP"].includes(channel)) return customer.phones[0]?.e164 ?? null;
  if (channel === "IN_APP") return `user:${customer.id}`;
  return null;
}

export async function createSupportCustomerContactAttempt(
  caseId: string,
  actorUserId: string,
  input: {
    clientActionId: string;
    channel: "PHONE" | "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP";
    reason: string;
    message?: string | null;
  },
) {
  const previous = await db.supportCustomerContactAttempt.findUnique({
    where: { clientActionId: input.clientActionId },
    include: {
      actor: { select: { id: true, displayName: true } },
      notification: { include: { deliveries: true } },
    },
  });
  if (previous) return { attempt: serializeAttempt(previous), actionState: "ALREADY_DONE" as const };

  const { customer } = await supportCaseCustomer(caseId);
  const destination = destinationFor(input.channel, customer);
  if (!destination) throw new AppError("CONFLICT", `Customer has no ${input.channel.toLowerCase()} destination configured`, 409);
  const message = clean(input.message) ?? input.reason.trim();

  const created = await db.$transaction(async (tx) => {
    let notificationId: string | null = null;
    let status = "INITIATED";
    let outcome: string | null = null;

    if (input.channel === "IN_APP") {
      await tx.supportMessage.create({
        data: { caseId, authorUserId: actorUserId, kind: "STAFF", body: message },
      });
      await tx.supportCase.update({
        where: { id: caseId },
        data: { status: "WAITING_CUSTOMER", lastActivityAt: new Date() },
      });
      const notification = await queueNotificationTx(tx, {
        userId: customer.id,
        category: "SUPPORT",
        title: "Bazaara Support replied",
        body: message,
        resourceType: "SupportCase",
        resourceId: caseId,
        channels: ["PUSH"],
      });
      notificationId = notification.id;
      status = "COMPLETED";
      outcome = "In-app support message sent";
    } else if (input.channel === "EMAIL" || input.channel === "SMS") {
      const notification = await queueNotificationTx(tx, {
        userId: customer.id,
        category: "SUPPORT",
        title: "Message from Bazaara Support",
        body: message,
        resourceType: "SupportCase",
        resourceId: caseId,
        channels: [input.channel],
      });
      notificationId = notification.id;
      status = "QUEUED";
      outcome = `${input.channel} queued for provider delivery`;
      await tx.supportCase.update({ where: { id: caseId }, data: { lastActivityAt: new Date() } });
    } else {
      await tx.supportCase.update({ where: { id: caseId }, data: { lastActivityAt: new Date() } });
    }

    const attempt = await tx.supportCustomerContactAttempt.create({
      data: {
        clientActionId: input.clientActionId,
        supportCaseId: caseId,
        customerUserId: customer.id,
        actorUserId,
        notificationId,
        channel: input.channel,
        destination,
        destinationLabel: customer.displayName || customer.emails[0]?.email || customer.phones[0]?.e164 || "Customer",
        reason: input.reason.trim(),
        message,
        status,
        outcome,
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
      include: {
        actor: { select: { id: true, displayName: true } },
        notification: { include: { deliveries: true } },
      },
    });

    await tx.supportMessage.create({
      data: {
        caseId,
        authorUserId: actorUserId,
        kind: "INTERNAL",
        body: `Customer contact ${status === "COMPLETED" ? "completed" : "started"} via ${input.channel}. Reason: ${input.reason.trim()}`,
      },
    });

    return attempt;
  });

  return { attempt: serializeAttempt(created), actionState: "COMPLETED" as const };
}

export async function updateSupportCustomerContactAttempt(
  attemptId: string,
  actorUserId: string,
  input: {
    status: "COMPLETED" | "NO_ANSWER" | "BUSY" | "FAILED" | "CANCELLED";
    outcome?: string | null;
    notes?: string | null;
    durationSeconds?: number | null;
    followUpAt?: string | null;
  },
) {
  const existing = await db.supportCustomerContactAttempt.findUnique({ where: { id: attemptId } });
  if (!existing) throw new AppError("NOT_FOUND", "Customer contact attempt not found", 404);
  const terminal = ["COMPLETED", "NO_ANSWER", "BUSY", "FAILED", "CANCELLED"];
  const same = existing.status === input.status &&
    (input.outcome === undefined || existing.outcome === input.outcome) &&
    (input.notes === undefined || existing.notes === input.notes);
  if (same && terminal.includes(existing.status)) {
    const loaded = await db.supportCustomerContactAttempt.findUnique({
      where: { id: attemptId },
      include: { actor: { select: { id: true, displayName: true } }, notification: { include: { deliveries: true } } },
    });
    return { attempt: serializeAttempt(loaded), actionState: "ALREADY_DONE" as const };
  }

  const completedAt = terminal.includes(input.status) ? existing.completedAt ?? new Date() : null;
  const updated = await db.$transaction(async (tx) => {
    const attempt = await tx.supportCustomerContactAttempt.update({
      where: { id: attemptId },
      data: {
        status: input.status,
        outcome: input.outcome === undefined ? undefined : clean(input.outcome),
        notes: input.notes === undefined ? undefined : clean(input.notes),
        durationSeconds: input.durationSeconds === undefined ? undefined : input.durationSeconds,
        followUpAt: input.followUpAt === undefined ? undefined : input.followUpAt ? new Date(input.followUpAt) : null,
        completedAt,
      },
      include: { actor: { select: { id: true, displayName: true } }, notification: { include: { deliveries: true } } },
    });
    await tx.supportCase.update({ where: { id: existing.supportCaseId }, data: { lastActivityAt: new Date() } });
    await tx.supportMessage.create({
      data: {
        caseId: existing.supportCaseId,
        authorUserId: actorUserId,
        kind: "INTERNAL",
        body: `Customer contact result: ${input.status}${input.outcome ? ` · ${input.outcome}` : ""}${input.notes ? ` · ${input.notes}` : ""}`,
      },
    });
    return attempt;
  });
  return { attempt: serializeAttempt(updated), actionState: "COMPLETED" as const };
}
