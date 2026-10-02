import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { queueNotificationTx } from "../notifications/service.js";

export type RestaurantContactInput = {
  name: string;
  role: string;
  phone?: string | null;
  whatsappPhone?: string | null;
  email?: string | null;
  preferredChannel?: "PHONE" | "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP";
  isPrimary?: boolean;
  isEmergency?: boolean;
  active?: boolean;
};

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function serializeContact(row: any) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    name: row.name,
    role: row.role,
    phone: row.phone,
    whatsappPhone: row.whatsappPhone,
    email: row.email,
    preferredChannel: row.preferredChannel,
    isPrimary: row.isPrimary,
    isEmergency: row.isEmergency,
    active: row.active,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

function serializeAttempt(row: any) {
  return {
    id: row.id,
    clientActionId: row.clientActionId,
    supportCaseId: row.supportCaseId,
    foodRestaurantId: row.foodRestaurantId,
    contactId: row.contactId,
    actorUserId: row.actorUserId,
    channel: row.channel,
    destination: row.destination,
    destinationLabel: row.destinationLabel,
    reason: row.reason,
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
    contact: row.contact ? serializeContact(row.contact) : null,
  };
}

async function restaurantForOrganization(organizationId: string, restaurantId: string) {
  const restaurant = await db.foodRestaurant.findFirst({
    where: { id: restaurantId, merchant: { organizationId } },
    include: { merchant: { include: { organization: true } } },
  });
  if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found for this business", 404);
  return restaurant;
}

export async function listRestaurantContactsForOrganization(organizationId: string, restaurantId: string) {
  const restaurant = await restaurantForOrganization(organizationId, restaurantId);
  const contacts = await db.restaurantContact.findMany({
    where: { restaurantId },
    orderBy: [{ active: "desc" }, { isPrimary: "desc" }, { isEmergency: "desc" }, { createdAt: "asc" }],
  });
  return {
    restaurant: {
      id: restaurant.id,
      name: restaurant.merchant.organization.displayName,
      slug: restaurant.slug,
      organizationId,
      organizationContact: {
        phone: restaurant.merchant.organization.contactPhone,
        email: restaurant.merchant.organization.contactEmail,
      },
    },
    contacts: contacts.map(serializeContact),
  };
}

export async function createRestaurantContactForOrganization(organizationId: string, restaurantId: string, input: RestaurantContactInput) {
  await restaurantForOrganization(organizationId, restaurantId);
  const normalized = {
    name: input.name.trim(),
    role: input.role.trim().toUpperCase().replace(/\s+/g, "_"),
    phone: clean(input.phone),
    whatsappPhone: clean(input.whatsappPhone),
    email: clean(input.email)?.toLowerCase() ?? null,
    preferredChannel: input.preferredChannel ?? "PHONE",
    isPrimary: Boolean(input.isPrimary),
    isEmergency: Boolean(input.isEmergency),
    active: input.active ?? true,
  };
  if (!normalized.phone && !normalized.whatsappPhone && !normalized.email) {
    throw new AppError("BAD_REQUEST", "Add at least one phone, WhatsApp number or email address", 400);
  }
  const duplicate = await db.restaurantContact.findFirst({
    where: {
      restaurantId,
      name: { equals: normalized.name, mode: "insensitive" },
      role: normalized.role,
      phone: normalized.phone,
      whatsappPhone: normalized.whatsappPhone,
      email: normalized.email,
      active: normalized.active,
    },
  });
  if (duplicate) return { contact: serializeContact(duplicate), actionState: "ALREADY_DONE" as const };

  const contact = await db.$transaction(async (tx) => {
    if (normalized.isPrimary) await tx.restaurantContact.updateMany({ where: { restaurantId, isPrimary: true }, data: { isPrimary: false } });
    return tx.restaurantContact.create({ data: { restaurantId, ...normalized } });
  });
  return { contact: serializeContact(contact), actionState: "COMPLETED" as const };
}

export async function updateRestaurantContactForOrganization(organizationId: string, restaurantId: string, contactId: string, input: Partial<RestaurantContactInput>) {
  await restaurantForOrganization(organizationId, restaurantId);
  const existing = await db.restaurantContact.findFirst({ where: { id: contactId, restaurantId } });
  if (!existing) throw new AppError("NOT_FOUND", "Restaurant contact not found", 404);

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.role !== undefined) data.role = input.role.trim().toUpperCase().replace(/\s+/g, "_");
  if (input.phone !== undefined) data.phone = clean(input.phone);
  if (input.whatsappPhone !== undefined) data.whatsappPhone = clean(input.whatsappPhone);
  if (input.email !== undefined) data.email = clean(input.email)?.toLowerCase() ?? null;
  if (input.preferredChannel !== undefined) data.preferredChannel = input.preferredChannel;
  if (input.isPrimary !== undefined) data.isPrimary = input.isPrimary;
  if (input.isEmergency !== undefined) data.isEmergency = input.isEmergency;
  if (input.active !== undefined) data.active = input.active;

  const next = { ...existing, ...data } as any;
  if (!next.phone && !next.whatsappPhone && !next.email) throw new AppError("BAD_REQUEST", "A contact must keep at least one reachable channel", 400);
  const comparableKeys = Object.keys(data);
  const same = comparableKeys.every((key) => {
    const current = (existing as any)[key];
    const desired = (data as any)[key];
    return current === desired;
  });
  if (same) return { contact: serializeContact(existing), actionState: "ALREADY_DONE" as const };

  const contact = await db.$transaction(async (tx) => {
    if (data.isPrimary === true) await tx.restaurantContact.updateMany({ where: { restaurantId, isPrimary: true, id: { not: contactId } }, data: { isPrimary: false } });
    return tx.restaurantContact.update({ where: { id: contactId }, data });
  });
  return { contact: serializeContact(contact), actionState: "COMPLETED" as const };
}

async function supportCaseRestaurant(caseId: string) {
  const supportCase = await db.supportCase.findUnique({
    where: { id: caseId },
    include: {
      foodOrder: { select: { restaurantId: true } },
      foodRestaurant: { select: { id: true } },
    },
  });
  if (!supportCase) throw new AppError("NOT_FOUND", "Support case not found", 404);
  const restaurantId = supportCase.foodRestaurantId ?? supportCase.foodRestaurant?.id ?? supportCase.foodOrder?.restaurantId;
  if (!restaurantId || supportCase.category !== "FOOD") throw new AppError("BAD_REQUEST", "This support case is not linked to a Food restaurant", 400);
  const restaurant = await db.foodRestaurant.findUnique({
    where: { id: restaurantId },
    include: { merchant: { include: { organization: true } } },
  });
  if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
  return { supportCase, restaurant };
}

export async function getSupportRestaurantContactCenter(caseId: string) {
  const { restaurant } = await supportCaseRestaurant(caseId);
  const [contacts, attempts] = await Promise.all([
    db.restaurantContact.findMany({ where: { restaurantId: restaurant.id, active: true }, orderBy: [{ isPrimary: "desc" }, { isEmergency: "desc" }, { createdAt: "asc" }] }),
    db.supportContactAttempt.findMany({
      where: { supportCaseId: caseId },
      include: { actor: { select: { id: true, displayName: true } }, contact: true },
      orderBy: { createdAt: "desc" }, take: 25,
    }),
  ]);
  const organization = restaurant.merchant.organization;
  return {
    restaurant: { id: restaurant.id, name: organization.displayName, slug: restaurant.slug, organizationId: restaurant.merchant.organizationId },
    organizationContact: { phone: organization.contactPhone, email: organization.contactEmail },
    contacts: contacts.map(serializeContact),
    attempts: attempts.map(serializeAttempt),
  };
}

function destinationFor(channel: string, contact: any | null, organization: any) {
  if (channel === "EMAIL") return contact?.email ?? organization.contactEmail ?? null;
  if (channel === "WHATSAPP") return contact?.whatsappPhone ?? contact?.phone ?? organization.contactPhone ?? null;
  if (channel === "PHONE" || channel === "SMS") return contact?.phone ?? contact?.whatsappPhone ?? organization.contactPhone ?? null;
  if (channel === "IN_APP") return `organization:${organization.id}`;
  return null;
}

export async function createSupportRestaurantContactAttempt(caseId: string, actorUserId: string, input: { clientActionId: string; contactId?: string | null; channel: "PHONE" | "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP"; reason: string }) {
  const previous = await db.supportContactAttempt.findUnique({ where: { clientActionId: input.clientActionId }, include: { actor: { select: { id: true, displayName: true } }, contact: true } });
  if (previous) return { attempt: serializeAttempt(previous), actionState: "ALREADY_DONE" as const };

  const { restaurant } = await supportCaseRestaurant(caseId);
  let contact: any = null;
  if (input.contactId) {
    contact = await db.restaurantContact.findFirst({ where: { id: input.contactId, restaurantId: restaurant.id, active: true } });
    if (!contact) throw new AppError("NOT_FOUND", "Selected restaurant contact is unavailable", 404);
  }
  const destination = destinationFor(input.channel, contact, restaurant.merchant.organization);
  if (!destination) throw new AppError("CONFLICT", `No ${input.channel.toLowerCase()} destination is configured for this restaurant`, 409);
  const label = contact ? `${contact.name} · ${contact.role.replaceAll("_", " ")}` : `${restaurant.merchant.organization.displayName} · organization contact`;

  const attempt = await db.$transaction(async (tx) => {
    let status = "INITIATED";
    let outcome: string | null = null;
    let completedAt: Date | null = null;
    if (input.channel === "IN_APP") {
      const members = await tx.organizationMember.findMany({
        where: { organizationId: restaurant.merchant.organizationId, status: "ACTIVE" },
        select: { userId: true },
        take: 25,
      });
      if (!members.length) throw new AppError("CONFLICT", "No active restaurant business user is available for in-app contact", 409);
      for (const member of members) {
        await queueNotificationTx(tx, {
          userId: member.userId,
          category: "SUPPORT",
          title: "Bazaara Operations contacted your restaurant",
          body: input.reason.trim(),
          resourceType: "SupportCase",
          resourceId: caseId,
          channels: ["PUSH"],
        });
      }
      status = "COMPLETED";
      outcome = `In-app alert sent to ${members.length} active business user${members.length === 1 ? "" : "s"}`;
      completedAt = new Date();
    }
    const created = await tx.supportContactAttempt.create({
      data: {
        clientActionId: input.clientActionId,
        supportCaseId: caseId,
        foodRestaurantId: restaurant.id,
        contactId: contact?.id ?? null,
        actorUserId,
        channel: input.channel,
        destination,
        destinationLabel: label,
        reason: input.reason.trim(),
        status,
        outcome,
        completedAt,
      },
      include: { actor: { select: { id: true, displayName: true } }, contact: true },
    });
    await tx.supportCase.update({ where: { id: caseId }, data: { lastActivityAt: new Date() } });
    await tx.supportMessage.create({ data: { caseId, authorUserId: actorUserId, kind: "INTERNAL", body: `Restaurant contact ${status === "COMPLETED" ? "completed" : "initiated"} via ${input.channel}: ${label}. Reason: ${input.reason.trim()}${outcome ? ` · ${outcome}` : ""}` } });
    return created;
  });
  return { attempt: serializeAttempt(attempt), actionState: "COMPLETED" as const };
}

export async function updateSupportRestaurantContactAttempt(attemptId: string, actorUserId: string, input: { status: "COMPLETED" | "NO_ANSWER" | "BUSY" | "FAILED" | "CANCELLED"; outcome?: string | null; notes?: string | null; durationSeconds?: number | null; followUpAt?: string | null }) {
  const existing = await db.supportContactAttempt.findUnique({ where: { id: attemptId } });
  if (!existing) throw new AppError("NOT_FOUND", "Restaurant contact attempt not found", 404);
  const terminal = ["COMPLETED", "NO_ANSWER", "BUSY", "FAILED", "CANCELLED"];
  const same = existing.status === input.status && (input.outcome === undefined || existing.outcome === input.outcome) && (input.notes === undefined || existing.notes === input.notes);
  if (same && terminal.includes(existing.status)) {
    const loaded = await db.supportContactAttempt.findUnique({ where: { id: attemptId }, include: { actor: { select: { id: true, displayName: true } }, contact: true } });
    return { attempt: serializeAttempt(loaded), actionState: "ALREADY_DONE" as const };
  }
  const completedAt = terminal.includes(input.status) ? existing.completedAt ?? new Date() : null;
  const attempt = await db.$transaction(async (tx) => {
    const updated = await tx.supportContactAttempt.update({
      where: { id: attemptId },
      data: {
        status: input.status,
        outcome: input.outcome === undefined ? undefined : clean(input.outcome),
        notes: input.notes === undefined ? undefined : clean(input.notes),
        durationSeconds: input.durationSeconds === undefined ? undefined : input.durationSeconds,
        followUpAt: input.followUpAt === undefined ? undefined : input.followUpAt ? new Date(input.followUpAt) : null,
        completedAt,
      },
      include: { actor: { select: { id: true, displayName: true } }, contact: true },
    });
    await tx.supportCase.update({ where: { id: existing.supportCaseId }, data: { lastActivityAt: new Date() } });
    await tx.supportMessage.create({ data: { caseId: existing.supportCaseId, authorUserId: actorUserId, kind: "INTERNAL", body: `Restaurant contact result: ${input.status}${input.outcome ? ` · ${input.outcome}` : ""}${input.notes ? ` · ${input.notes}` : ""}` } });
    return updated;
  });
  return { attempt: serializeAttempt(attempt), actionState: "COMPLETED" as const };
}
