import { randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { db, Prisma } from "@bazaara/db";
import { newOpaqueToken, sha256Base64Url } from "@bazaara/security";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";
import { audit } from "../audit.js";

const VERTICALS = ["SHOPPING", "FOOD", "GROCERY", "PHARMACY"] as const;
type Vertical = (typeof VERTICALS)[number];

const ROLES = ["OWNER", "ADMIN", "MANAGER", "FINANCE", "CATALOG", "OPERATIONS", "STAFF", "CUSTOM"] as const;
type RoleKey = (typeof ROLES)[number];

const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  OWNER: ["*"],
  ADMIN: ["*"],
  MANAGER: [
    "orders.manage",
    "catalog.manage",
    "inventory.manage",
    "promotions.manage",
    "customers.read",
    "analytics.read",
    "team.read",
    "branches.manage",
  ],
  FINANCE: ["finance.read", "invoices.manage", "settlements.read", "analytics.read"],
  CATALOG: ["catalog.manage", "inventory.manage", "promotions.manage"],
  OPERATIONS: ["orders.manage", "inventory.manage", "fulfillment.manage", "customers.read"],
  STAFF: ["orders.read", "orders.manage", "inventory.read"],
  CUSTOM: [],
};

const REQUIREMENTS: Record<Vertical, Array<{ key: string; label: string; required: boolean; note: string }>> = {
  SHOPPING: [
    { key: "identity", label: "Verified BazID owner", required: true, note: "Owner identity must be verified." },
    { key: "business_profile", label: "Business profile and contact details", required: true, note: "Brand, legal type, phone and email." },
    { key: "settlement", label: "Settlement account", required: true, note: "Connect Wallet or an approved settlement method." },
    { key: "returns", label: "Returns and fulfilment setup", required: true, note: "Define delivery and return handling before publishing." },
  ],
  FOOD: [
    { key: "identity", label: "Verified BazID owner", required: true, note: "Owner identity must be verified." },
    { key: "location", label: "Kitchen or restaurant location", required: true, note: "A physical operating location is required." },
    { key: "hours_menu", label: "Operating hours and menu", required: true, note: "At least one menu section and item before activation." },
    { key: "food_docs", label: "Applicable food-business documentation", required: true, note: "Upload or provide documents required for the operating location." },
    { key: "settlement", label: "Settlement account", required: true, note: "Connect Wallet or an approved settlement method." },
  ],
  GROCERY: [
    { key: "identity", label: "Verified BazID owner", required: true, note: "Owner identity must be verified." },
    { key: "store", label: "Physical store and operating hours", required: true, note: "Store location and service hours are required." },
    { key: "catalog", label: "Catalogue and fulfilment rules", required: true, note: "Products, substitutions and fulfilment must be configured." },
    { key: "retail_docs", label: "Applicable retail / food documentation", required: true, note: "Requirements depend on products and location." },
    { key: "settlement", label: "Settlement account", required: true, note: "Connect Wallet or an approved settlement method." },
  ],
  PHARMACY: [
    { key: "identity", label: "Verified BazID owner", required: true, note: "Owner and authorized representative identity." },
    { key: "registration", label: "Business registration information", required: true, note: "Verified legal business details." },
    { key: "premises", label: "Pharmacy premises / licence information", required: true, note: "Regulatory information is reviewed before activation." },
    { key: "pharmacist", label: "Responsible pharmacist information", required: true, note: "A verified responsible pharmacist is required for regulated workflows." },
    { key: "settlement", label: "Settlement account", required: true, note: "Connect Wallet or an approved settlement method." },
  ],
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "item";
}

function safeMinor(value: bigint | null | undefined) {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isSafeInteger(numeric)) throw new Error("Monetary value exceeds transport range");
  return numeric;
}

async function ensureBusinessNumber(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, businessNumber: true },
  });
  if (!organization) throw new AppError("NOT_FOUND", "Business organization not found", 404);
  if (organization.businessNumber) return organization.businessNumber;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`.toUpperCase().slice(-10);
    const businessNumber = `BZ-BIZ-${suffix}`;
    const exists = await db.organization.findUnique({
      where: { businessNumber },
      select: { id: true },
    });
    if (exists) continue;
    await db.organization.update({
      where: { id: organizationId },
      data: { businessNumber },
    });
    return businessNumber;
  }
  throw new AppError("CONFLICT", "Could not allocate a Business ID", 409);
}

async function ensureOwnerRole(organizationId: string) {
  const owner = await db.organizationMember.findFirst({
    where: { organizationId, roleKey: "OWNER", status: "ACTIVE" },
    select: { id: true },
  });
  if (owner) return;

  const earliest = await db.organizationMember.findFirst({
    where: { organizationId, status: "ACTIVE" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (earliest) {
    await db.organizationMember.update({
      where: { id: earliest.id },
      data: { roleKey: "OWNER" },
    });
  }
}

async function requireMember(request: FastifyRequest, organizationId: string) {
  const auth = await requireAuth(request);
  await ensureOwnerRole(organizationId);
  const member = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: auth.userId,
      },
    },
  });
  if (!member || member.status !== "ACTIVE") {
    throw new AppError("FORBIDDEN", "Active organization membership required", 403);
  }
  return { auth, member };
}

function memberCan(member: { roleKey: string; permissions: string[] }, permission: string) {
  const role = ROLES.includes(member.roleKey as RoleKey)
    ? (member.roleKey as RoleKey)
    : "CUSTOM";
  const defaults = ROLE_PERMISSIONS[role] ?? [];
  return (
    defaults.includes("*") ||
    defaults.includes(permission) ||
    member.permissions.includes("*") ||
    member.permissions.includes(permission)
  );
}

async function requirePermission(request: FastifyRequest, organizationId: string, permission: string) {
  const ctx = await requireMember(request, organizationId);
  if (!memberCan(ctx.member, permission)) {
    throw new AppError("FORBIDDEN", `Business permission required: ${permission}`, 403);
  }
  return ctx;
}

async function ensureVerification(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
  });
  if (!organization) throw new AppError("NOT_FOUND", "Business organization not found", 404);

  return db.businessVerification.upsert({
    where: { organizationId },
    create: {
      organizationId,
      legalType: organization.legalType,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      status: organization.status === "ACTIVE" ? "VERIFIED" : "DOCUMENTS_REQUIRED",
      verifiedAt: organization.status === "ACTIVE" ? new Date() : null,
      checklist: {
        profile: Boolean(organization.displayName && organization.legalName),
        contact: Boolean(organization.contactEmail || organization.contactPhone),
      },
    },
    update: {},
  });
}

async function ensureVerticalRegistrations(organizationId: string) {
  const merchants = await db.merchant.findMany({
    where: { organizationId },
    select: { id: true, vertical: true, verifiedAt: true },
  });
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { status: true },
  });

  for (const merchant of merchants) {
    if (!VERTICALS.includes(merchant.vertical.toUpperCase() as Vertical)) continue;
    const vertical = merchant.vertical.toUpperCase() as Vertical;
    await db.businessVerticalRegistration.upsert({
      where: {
        organizationId_vertical: {
          organizationId,
          vertical,
        },
      },
      create: {
        organizationId,
        merchantId: merchant.id,
        vertical,
        status:
          merchant.verifiedAt || organization?.status === "ACTIVE"
            ? "ACTIVE"
            : "SETUP",
        requirements: REQUIREMENTS[vertical],
        activatedAt:
          merchant.verifiedAt || organization?.status === "ACTIVE"
            ? new Date()
            : null,
      },
      update: {
        merchantId: merchant.id,
      },
    });
  }
}

async function orgMerchant(organizationId: string, vertical: Vertical) {
  const merchant = await db.merchant.findFirst({
    where: {
      organizationId,
      vertical,
    },
    include: {
      stores: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!merchant) {
    throw new AppError("NOT_FOUND", `${vertical} is not registered for this business`, 404);
  }
  return merchant;
}

async function uniqueProductSlug(title: string) {
  const base = slugify(title);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${randomBytes(3).toString("hex")}`;
    const exists = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
  }
  throw new AppError("CONFLICT", "Could not allocate a product URL", 409);
}

async function uniqueFoodSlug(restaurantId: string, name: string) {
  const base = slugify(name);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${randomBytes(3).toString("hex")}`;
    const exists = await db.foodMenuItem.findFirst({
      where: { restaurantId, slug },
      select: { id: true },
    });
    if (!exists) return slug;
  }
  throw new AppError("CONFLICT", "Could not allocate a menu item URL", 409);
}

async function canPublish(organizationId: string, vertical: Vertical) {
  await ensureVerticalRegistrations(organizationId);
  const registration = await db.businessVerticalRegistration.findUnique({
    where: {
      organizationId_vertical: {
        organizationId,
        vertical,
      },
    },
  });
  if (registration?.status === "ACTIVE") return true;
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { status: true },
  });
  return org?.status === "ACTIVE" && !registration;
}


async function verticalBlockers(
  organizationId: string,
  vertical: Vertical,
) {
  const merchant = await db.merchant.findFirst({
    where: { organizationId, vertical },
    select: {
      id: true,
      foodRestaurant: { select: { id: true } },
    },
  });
  if (!merchant) return [];

  const blockers: string[] = [];

  if (vertical === "SHOPPING" || vertical === "GROCERY") {
    const count = await db.shoppingSellerOrder.count({
      where: {
        merchantId: merchant.id,
        status: {
          notIn: ["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] as any,
        },
      },
    });
    if (count) blockers.push(`${count} open ${vertical.toLowerCase()} order(s)`);
  }

  if (vertical === "FOOD" && merchant.foodRestaurant?.id) {
    const count = await db.foodOrder.count({
      where: {
        restaurantId: merchant.foodRestaurant.id,
        status: { notIn: ["DELIVERED", "CANCELLED"] as any },
      },
    });
    if (count) blockers.push(`${count} open Food order(s)`);
  }

  if (vertical === "PHARMACY") {
    const count = await db.pharmacyOrder.count({
      where: {
        merchantId: merchant.id,
        status: { notIn: ["DELIVERED", "CANCELLED"] as any },
      },
    });
    if (count) blockers.push(`${count} open Pharmacy order(s)`);
  }

  return blockers;
}

const organizationSchema = z.object({
  displayName: z.string().trim().min(2).max(160),
  legalName: z.string().trim().min(2).max(220),
  legalType: z.enum(["INDIVIDUAL", "SOLE_TRADER", "BUSINESS_NAME", "COMPANY"]),
  contactEmail: z.string().email(),
  contactPhone: z.string().trim().min(7).max(32),
  country: z.string().trim().length(2).default("NG"),
});

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(160).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().trim().min(7).max(32).optional(),
});

const verificationSchema = z.object({
  legalType: z.enum(["INDIVIDUAL", "SOLE_TRADER", "BUSINESS_NAME", "COMPANY"]),
  registrationNumber: z.string().trim().max(120).optional(),
  taxId: z.string().trim().max(120).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().trim().min(7).max(32),
});

const inviteSchema = z.object({
  email: z.string().email(),
  roleKey: z.enum(ROLES),
  permissions: z.array(z.string().trim().min(2).max(80)).max(100).default([]),
  branchIds: z.array(z.string()).max(100).default([]),
});

const updateMemberSchema = z.object({
  roleKey: z.enum(ROLES),
  permissions: z.array(z.string().trim().min(2).max(80)).max(100).default([]),
  branchIds: z.array(z.string()).max(100).default([]),
});

const catalogItemSchema = z.object({
  title: z.string().trim().min(2).max(220),
  description: z.string().trim().min(2).max(5000),
  categoryId: z.string().min(1),
  brandName: z.string().trim().max(120).optional(),
  priceMinor: z.number().int().min(0).max(100_000_000_000),
  compareAtPriceMinor: z.number().int().min(0).max(100_000_000_000).optional(),
  costMinor: z.number().int().min(0).max(100_000_000_000).optional(),
  sku: z.string().trim().min(1).max(120),
  barcode: z.string().trim().max(120).optional(),
  stock: z.number().int().min(0).max(10_000_000).default(0),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(5),
  weightGrams: z.number().int().min(0).max(10_000_000).optional(),
  returnEligible: z.boolean().default(true),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  imageUrl: z.string().url().optional(),
  publish: z.boolean().default(false),
  storeId: z.string().optional(),
});

const updateCatalogSchema = z.object({
  title: z.string().trim().min(2).max(220).optional(),
  description: z.string().trim().min(2).max(5000).optional(),
  priceMinor: z.number().int().min(0).max(100_000_000_000).optional(),
  compareAtPriceMinor: z.number().int().min(0).max(100_000_000_000).nullable().optional(),
  costMinor: z.number().int().min(0).max(100_000_000_000).nullable().optional(),
  barcode: z.string().trim().max(120).nullable().optional(),
  stock: z.number().int().min(0).max(10_000_000).optional(),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).optional(),
  weightGrams: z.number().int().min(0).max(10_000_000).nullable().optional(),
  returnEligible: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

const foodSectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

const foodItemSchema = z.object({
  sectionId: z.string(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(1200),
  priceMinor: z.number().int().min(0).max(100_000_000),
  imageUrl: z.string().url().optional(),
  dietaryTags: z.array(z.string().trim().max(60)).max(30).default([]),
  prepMinutes: z.number().int().min(0).max(480).optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

const modifierSchema = z.object({
  name: z.string().trim().min(1).max(100),
  required: z.boolean().default(false),
  minSelect: z.number().int().min(0).max(20).default(0),
  maxSelect: z.number().int().min(1).max(20).default(1),
  options: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    priceDeltaMinor: z.number().int().min(0).max(100_000_000).default(0),
  })).min(1).max(50),
});

export async function businessAdvancedRoutes(app: FastifyInstance) {
  app.get("/v1/business/advanced/requirements", async () => ({
    verticals: REQUIREMENTS,
    roles: ROLES.map((role) => ({
      key: role,
      permissions: ROLE_PERMISSIONS[role],
    })),
  }));

  app.post("/v1/business/advanced/organizations", async (request, reply) => {
    const auth = await requireAuth(request);
    const input = organizationSchema.parse(request.body);

    const existing = await db.organizationMember.findFirst({
      where: { userId: auth.userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(
        "CONFLICT",
        "This BazID already belongs to a business organization. Use Add business type or create another organization from the organization switcher later.",
        409,
      );
    }

    const organization = await db.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          type: "SELLER",
          legalName: input.legalName,
          displayName: input.displayName,
          status: "PENDING",
          country: input.country,
          legalType: input.legalType,
          contactEmail: normalizeEmail(input.contactEmail),
          contactPhone: input.contactPhone,
        },
      });
      await tx.organizationMember.create({
        data: {
          organizationId: created.id,
          userId: auth.userId,
          title: "Owner",
          roleKey: "OWNER",
          status: "ACTIVE",
        },
      });
      await tx.businessVerification.create({
        data: {
          organizationId: created.id,
          legalType: input.legalType,
          contactEmail: normalizeEmail(input.contactEmail),
          contactPhone: input.contactPhone,
          status: "DOCUMENTS_REQUIRED",
          checklist: { profile: true, contact: true, identity: true },
        },
      });
      return created;
    });

    const businessNumber = await ensureBusinessNumber(organization.id);
    await audit({
      actorUserId: auth.userId,
      action: "business.organization.created",
      resourceType: "Organization",
      resourceId: organization.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { businessNumber },
    });

    return reply.code(201).send({
      organization: { ...organization, businessNumber },
      nextPath: "/register",
    });
  });

  app.get("/v1/business/advanced/organizations/:organizationId/profile", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    await requireMember(request, organizationId);
    const businessNumber = await ensureBusinessNumber(organizationId);
    await ensureVerticalRegistrations(organizationId);
    const [organization, verification, registrations] = await Promise.all([
      db.organization.findUnique({ where: { id: organizationId } }),
      ensureVerification(organizationId),
      db.businessVerticalRegistration.findMany({
        where: { organizationId },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return {
      organization: { ...organization, businessNumber },
      verification: {
        ...verification,
        submittedAt: verification.submittedAt?.toISOString() ?? null,
        verifiedAt: verification.verifiedAt?.toISOString() ?? null,
        changesRequestedAt: verification.changesRequestedAt?.toISOString() ?? null,
      },
      registrations: registrations.map((item) => ({
        ...item,
        submittedAt: item.submittedAt?.toISOString() ?? null,
        activatedAt: item.activatedAt?.toISOString() ?? null,
        closedAt: item.closedAt?.toISOString() ?? null,
      })),
    };
  });

  app.patch("/v1/business/advanced/organizations/:organizationId/profile", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "business.manage");
    const input = profileSchema.parse(request.body);
    const before = await db.organization.findUnique({ where: { id: organizationId } });
    if (!before) throw new AppError("NOT_FOUND", "Business organization not found", 404);
    if (before.status === "CLOSED") throw new AppError("CONFLICT", "Closed businesses cannot be edited", 409);

    const updated = await db.$transaction(async (tx) => {
      const organization = await tx.organization.update({
        where: { id: organizationId },
        data: {
          displayName: input.displayName,
          contactEmail: input.contactEmail ? normalizeEmail(input.contactEmail) : undefined,
          contactPhone: input.contactPhone,
          brandUpdatedAt: input.displayName && input.displayName !== before.displayName ? new Date() : undefined,
        },
      });
      if (input.displayName && input.displayName !== before.displayName) {
        await tx.store.updateMany({
          where: {
            merchant: { organizationId },
            name: before.displayName,
          },
          data: { name: input.displayName },
        });
      }
      await tx.businessVerification.updateMany({
        where: { organizationId },
        data: {
          contactEmail: input.contactEmail ? normalizeEmail(input.contactEmail) : undefined,
          contactPhone: input.contactPhone,
        },
      });
      return organization;
    });

    await audit({
      actorUserId: auth.userId,
      action: "business.profile.updated",
      resourceType: "Organization",
      resourceId: organizationId,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: {
        displayNameChanged: before.displayName !== updated.displayName,
      },
    });

    return { organization: updated };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/verification/submit", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "business.manage");
    const input = verificationSchema.parse(request.body);
    const verification = await db.businessVerification.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...input,
        contactEmail: normalizeEmail(input.contactEmail),
        status: "UNDER_REVIEW",
        submittedAt: new Date(),
        checklist: { profile: true, contact: true, submitted: true },
      },
      update: {
        ...input,
        contactEmail: normalizeEmail(input.contactEmail),
        status: "UNDER_REVIEW",
        submittedAt: new Date(),
        changesRequestedAt: null,
      },
    });
    await db.organization.update({
      where: { id: organizationId },
      data: {
        legalType: input.legalType,
        contactEmail: normalizeEmail(input.contactEmail),
        contactPhone: input.contactPhone,
        status: "PENDING",
      },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.verification.submitted",
      resourceType: "Organization",
      resourceId: organizationId,
      requestId: request.id,
      ipAddress: request.ip,
    });
    return { verification };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/verticals/:vertical/setup", async (request) => {
    const { organizationId, vertical } = z.object({
      organizationId: z.string(),
      vertical: z.enum(VERTICALS),
    }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "business.manage");
    const merchant = await orgMerchant(organizationId, vertical);
    const registration = await db.businessVerticalRegistration.upsert({
      where: {
        organizationId_vertical: { organizationId, vertical },
      },
      create: {
        organizationId,
        merchantId: merchant.id,
        vertical,
        status: "SETUP",
        requirements: REQUIREMENTS[vertical],
      },
      update: {
        merchantId: merchant.id,
        requirements: REQUIREMENTS[vertical],
        status: { set: "SETUP" },
        closedAt: null,
      },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.vertical.setup",
      resourceType: "Merchant",
      resourceId: merchant.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId, vertical },
    });
    return { registration };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/verticals/:vertical/submit", async (request) => {
    const { organizationId, vertical } = z.object({
      organizationId: z.string(),
      vertical: z.enum(VERTICALS),
    }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "business.manage");
    await ensureVerticalRegistrations(organizationId);
    const registration = await db.businessVerticalRegistration.update({
      where: {
        organizationId_vertical: { organizationId, vertical },
      },
      data: {
        status: "UNDER_REVIEW",
        submittedAt: new Date(),
        requirements: REQUIREMENTS[vertical],
      },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.vertical.submitted",
      resourceType: "Merchant",
      resourceId: registration.merchantId,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId, vertical },
    });
    return { registration };
  });

  app.get("/v1/business/advanced/organizations/:organizationId/team", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    await requirePermission(request, organizationId, "team.read");
    const [members, invitations, branches] = await Promise.all([
      db.organizationMember.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              displayName: true,
              verificationLevel: true,
              emails: {
                orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
                select: {
                  normalized: true,
                  email: true,
                  isPrimary: true,
                  verifiedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.businessInvitation.findMany({
        where: { organizationId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
      db.businessBranch.findMany({
        where: { organizationId, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return {
      members: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        displayName: member.user.displayName,
        primaryEmail:
          member.user.emails.find((item) => item.isPrimary && item.verifiedAt)?.normalized ??
          member.user.emails.find((item) => item.isPrimary)?.normalized ??
          member.user.emails[0]?.normalized ??
          null,
        verificationLevel: member.user.verificationLevel,
        title: member.title,
        status: member.status,
        roleKey: member.roleKey,
        permissions: member.permissions,
        branchIds: member.branchIds,
        createdAt: member.createdAt.toISOString(),
      })),
      invitations: invitations.map((invite) => ({
        id: invite.id,
        email: invite.email,
        roleKey: invite.roleKey,
        branchIds: invite.branchIds,
        permissions: invite.permissions,
        expiresAt: invite.expiresAt.toISOString(),
        createdAt: invite.createdAt.toISOString(),
      })),
      branches,
      roleTemplates: ROLES.map((role) => ({
        key: role,
        permissions: ROLE_PERMISSIONS[role],
      })),
    };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/team/invitations", async (request, reply) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "team.manage");
    const input = inviteSchema.parse(request.body);
    const normalizedEmail = normalizeEmail(input.email);

    const current = await db.userEmail.findUnique({
      where: { normalized: normalizedEmail },
      select: { userId: true },
    });
    if (current) {
      const member = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: current.userId,
          },
        },
      });
      if (member?.status === "ACTIVE") {
        throw new AppError("CONFLICT", "That BazID is already an active member", 409);
      }
    }

    await db.businessInvitation.updateMany({
      where: {
        organizationId,
        normalizedEmail,
        status: "PENDING",
      },
      data: { status: "REVOKED" },
    });

    const rawToken = newOpaqueToken(32);
    const invitation = await db.businessInvitation.create({
      data: {
        organizationId,
        email: input.email.trim(),
        normalizedEmail,
        roleKey: input.roleKey,
        permissions: input.permissions,
        branchIds: input.branchIds,
        tokenHash: sha256Base64Url(rawToken),
        status: "PENDING",
        invitedByUserId: auth.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      },
    });

    await audit({
      actorUserId: auth.userId,
      action: "business.team.invited",
      resourceType: "Organization",
      resourceId: organizationId,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { email: normalizedEmail, roleKey: input.roleKey },
    });

    return reply.code(201).send({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        roleKey: invitation.roleKey,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      inviteUrl: `/team/invitations/${encodeURIComponent(rawToken)}`,
    });
  });

  app.post("/v1/business/advanced/invitations/:token/accept", async (request) => {
    const auth = await requireAuth(request);
    const { token } = z.object({ token: z.string().min(20) }).parse(request.params);
    const tokenHash = sha256Base64Url(token);
    const invitation = await db.businessInvitation.findUnique({ where: { tokenHash } });
    if (!invitation || invitation.status !== "PENDING") {
      throw new AppError("NOT_FOUND", "Business invitation is invalid or no longer available", 404);
    }
    if (invitation.expiresAt <= new Date()) {
      await db.businessInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new AppError("CONFLICT", "This business invitation has expired", 409);
    }

    const emails = await db.userEmail.findMany({
      where: { userId: auth.userId },
      select: { normalized: true },
    });
    if (!emails.some((item) => item.normalized === invitation.normalizedEmail)) {
      throw new AppError(
        "FORBIDDEN",
        `Sign in to the BazID account for ${invitation.email} to accept this invitation`,
        403,
      );
    }

    await db.$transaction(async (tx) => {
      await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: auth.userId,
          },
        },
        create: {
          organizationId: invitation.organizationId,
          userId: auth.userId,
          status: "ACTIVE",
          roleKey: invitation.roleKey,
          permissions: invitation.permissions,
          branchIds: invitation.branchIds,
          title: invitation.roleKey === "OWNER" ? "Owner" : invitation.roleKey,
        },
        update: {
          status: "ACTIVE",
          roleKey: invitation.roleKey,
          permissions: invitation.permissions,
          branchIds: invitation.branchIds,
        },
      });
      await tx.businessInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedByUserId: auth.userId,
          acceptedAt: new Date(),
        },
      });
    });

    await audit({
      actorUserId: auth.userId,
      action: "business.team.invitation.accepted",
      resourceType: "Organization",
      resourceId: invitation.organizationId,
      requestId: request.id,
      ipAddress: request.ip,
    });

    return { accepted: true, organizationId: invitation.organizationId };
  });

  app.patch("/v1/business/advanced/organizations/:organizationId/team/members/:memberId", async (request) => {
    const { organizationId, memberId } = z.object({
      organizationId: z.string(),
      memberId: z.string(),
    }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "team.manage");
    const input = updateMemberSchema.parse(request.body);
    const target = await db.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!target) throw new AppError("NOT_FOUND", "Team member not found", 404);
    if (target.roleKey === "OWNER" && input.roleKey !== "OWNER") {
      const ownerCount = await db.organizationMember.count({
        where: { organizationId, roleKey: "OWNER", status: "ACTIVE" },
      });
      if (ownerCount <= 1) {
        throw new AppError("CONFLICT", "Transfer ownership before changing the last owner's role", 409);
      }
    }
    const member = await db.organizationMember.update({
      where: { id: target.id },
      data: {
        roleKey: input.roleKey,
        permissions: input.permissions,
        branchIds: input.branchIds,
      },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.team.member.updated",
      resourceType: "OrganizationMember",
      resourceId: target.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId, roleKey: input.roleKey },
    });
    return { member };
  });

  app.delete("/v1/business/advanced/organizations/:organizationId/team/members/:memberId", async (request, reply) => {
    const { organizationId, memberId } = z.object({
      organizationId: z.string(),
      memberId: z.string(),
    }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "team.manage");
    const target = await db.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!target) throw new AppError("NOT_FOUND", "Team member not found", 404);
    if (target.roleKey === "OWNER") {
      const ownerCount = await db.organizationMember.count({
        where: { organizationId, roleKey: "OWNER", status: "ACTIVE" },
      });
      if (ownerCount <= 1) {
        throw new AppError("CONFLICT", "The last owner cannot be removed", 409);
      }
    }
    await db.organizationMember.update({
      where: { id: target.id },
      data: { status: "REMOVED" },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.team.member.removed",
      resourceType: "OrganizationMember",
      resourceId: target.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId },
    });
    return reply.code(204).send();
  });

  app.post("/v1/business/advanced/organizations/:organizationId/team/members/:memberId/transfer-ownership", async (request) => {
    const { organizationId, memberId } = z.object({
      organizationId: z.string(),
      memberId: z.string(),
    }).parse(request.params);
    const { auth, member: actorMember } = await requireMember(request, organizationId);
    if (actorMember.roleKey !== "OWNER") {
      throw new AppError("FORBIDDEN", "Only an owner can transfer business ownership", 403);
    }
    const target = await db.organizationMember.findFirst({
      where: { id: memberId, organizationId, status: "ACTIVE" },
    });
    if (!target) throw new AppError("NOT_FOUND", "Team member not found", 404);

    await db.$transaction(async (tx) => {
      await tx.organizationMember.update({
        where: { id: target.id },
        data: { roleKey: "OWNER", title: "Owner" },
      });
      await tx.organizationMember.update({
        where: { id: actorMember.id },
        data: { roleKey: "ADMIN", title: "Admin" },
      });
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.ownership.transferred",
      resourceType: "Organization",
      resourceId: organizationId,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { newOwnerUserId: target.userId },
    });
    return { transferred: true };
  });

  app.get("/v1/business/advanced/catalog/categories", async (request) => {
    await requireAuth(request);
    const categories = await db.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 500,
    });
    return { categories };
  });

  app.get("/v1/business/advanced/organizations/:organizationId/catalog/:vertical", async (request) => {
    const { organizationId, vertical } = z.object({
      organizationId: z.string(),
      vertical: z.enum(["SHOPPING", "GROCERY"]),
    }).parse(request.params);
    await requirePermission(request, organizationId, "catalog.manage");
    const merchant = await orgMerchant(organizationId, vertical);
    const products = await db.product.findMany({
      where: { merchantId: merchant.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        media: { orderBy: { sortOrder: "asc" } },
        variants: {
          include: {
            inventoryItems: {
              include: {
                store: { select: { id: true, name: true, status: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
    const metas = await db.businessCatalogMeta.findMany({
      where: { productId: { in: products.map((item) => item.id) } },
    });
    const metaByProduct = new Map(metas.map((item) => [item.productId, item]));
    return {
      merchant: {
        id: merchant.id,
        vertical,
        stores: merchant.stores,
      },
      products: products.map((product) => {
        const meta = metaByProduct.get(product.id);
        return {
          id: product.id,
          title: product.title,
          description: product.description,
          shortDescription: product.shortDescription,
          status: product.status,
          currency: product.currency,
          priceMinor: safeMinor(product.priceMinor),
          compareAtPriceMinor: safeMinor(product.compareAtPriceMinor),
          category: product.category,
          brand: product.brand,
          media: product.media,
          barcode: meta?.barcode ?? null,
          costMinor: safeMinor(meta?.costMinor),
          weightGrams: meta?.weightGrams ?? null,
          returnEligible: meta?.returnEligible ?? true,
          metadata: meta?.metadata ?? null,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            title: variant.title,
            attributes: variant.attributes,
            active: variant.active,
            priceMinor: safeMinor(variant.priceMinor),
            compareAtPriceMinor: safeMinor(variant.compareAtPriceMinor),
            inventory: variant.inventoryItems.map((inventory) => ({
              id: inventory.id,
              store: inventory.store,
              quantityOnHand: inventory.quantityOnHand,
              quantityReserved: inventory.quantityReserved,
              available: inventory.quantityOnHand - inventory.quantityReserved,
              lowStockThreshold: inventory.lowStockThreshold,
            })),
          })),
        };
      }),
    };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/catalog/:vertical", async (request, reply) => {
    const { organizationId, vertical } = z.object({
      organizationId: z.string(),
      vertical: z.enum(["SHOPPING", "GROCERY"]),
    }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "catalog.manage");
    const input = catalogItemSchema.parse(request.body);
    const merchant = await orgMerchant(organizationId, vertical);
    const store =
      merchant.stores.find((item) => item.id === input.storeId) ??
      merchant.stores[0];
    if (!store) throw new AppError("CONFLICT", "Create a store before adding products", 409);

    if (input.publish && !(await canPublish(organizationId, vertical))) {
      throw new AppError(
        "CONFLICT",
        "Finish business verification before publishing products. You can save this product as a draft.",
        409,
      );
    }

    const category = await db.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) throw new AppError("NOT_FOUND", "Product category not found", 404);

    const existingSku = await db.productVariant.findUnique({
      where: { sku: input.sku },
      select: { id: true },
    });
    if (existingSku) throw new AppError("CONFLICT", "That SKU is already in use", 409);

    let brandId: string | undefined;
    if (input.brandName) {
      const brandSlug = slugify(input.brandName);
      const brand = await db.brand.findFirst({
        where: {
          OR: [
            { name: { equals: input.brandName, mode: "insensitive" } },
            { slug: brandSlug },
          ],
        },
      }) ?? await db.brand.create({
        data: {
          name: input.brandName,
          slug: brandSlug,
        },
      });
      brandId = brand.id;
    }

    const slug = await uniqueProductSlug(input.title);
    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          merchantId: merchant.id,
          categoryId: input.categoryId,
          brandId,
          slug,
          title: input.title,
          shortDescription: input.description.slice(0, 240),
          description: input.description,
          status: input.publish ? "ACTIVE" : "DRAFT",
          currency: "NGN",
          priceMinor: BigInt(input.priceMinor),
          compareAtPriceMinor:
            input.compareAtPriceMinor == null
              ? null
              : BigInt(input.compareAtPriceMinor),
        },
      });
      const variant = await tx.productVariant.create({
        data: {
          productId: created.id,
          sku: input.sku,
          title: "Default",
          attributes:
            input.attributes == null
              ? undefined
              : (input.attributes as Prisma.InputJsonObject),
          priceMinor: BigInt(input.priceMinor),
          compareAtPriceMinor:
            input.compareAtPriceMinor == null
              ? null
              : BigInt(input.compareAtPriceMinor),
          currency: "NGN",
          active: true,
        },
      });
      await tx.inventoryItem.create({
        data: {
          storeId: store.id,
          variantId: variant.id,
          quantityOnHand: input.stock,
          lowStockThreshold: input.lowStockThreshold,
        },
      });
      await tx.businessCatalogMeta.create({
        data: {
          productId: created.id,
          barcode: input.barcode || null,
          costMinor: input.costMinor == null ? null : BigInt(input.costMinor),
          weightGrams: input.weightGrams,
          returnEligible: input.returnEligible,
          metadata: {
            vertical,
          },
        },
      });
      if (input.imageUrl) {
        await tx.productMedia.create({
          data: {
            productId: created.id,
            type: "IMAGE",
            url: input.imageUrl,
            alt: input.title,
            sortOrder: 0,
          },
        });
      }
      return created;
    });

    await audit({
      actorUserId: auth.userId,
      action: "business.catalog.product.created",
      resourceType: "Product",
      resourceId: product.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId, vertical, sku: input.sku },
    });

    return reply.code(201).send({ productId: product.id });
  });

  app.patch("/v1/business/advanced/organizations/:organizationId/catalog/:vertical/products/:productId", async (request) => {
    const { organizationId, vertical, productId } = z.object({
      organizationId: z.string(),
      vertical: z.enum(["SHOPPING", "GROCERY"]),
      productId: z.string(),
    }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "catalog.manage");
    const input = updateCatalogSchema.parse(request.body);
    const merchant = await orgMerchant(organizationId, vertical);
    const product = await db.product.findFirst({
      where: { id: productId, merchantId: merchant.id },
      include: {
        variants: {
          include: { inventoryItems: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
    if (input.status === "ACTIVE" && !(await canPublish(organizationId, vertical))) {
      throw new AppError("CONFLICT", "Business verification is required before publishing", 409);
    }

    const firstVariant = product.variants[0];
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          title: input.title,
          shortDescription: input.description ? input.description.slice(0, 240) : undefined,
          description: input.description,
          priceMinor: input.priceMinor == null ? undefined : BigInt(input.priceMinor),
          compareAtPriceMinor:
            input.compareAtPriceMinor === undefined
              ? undefined
              : input.compareAtPriceMinor === null
                ? null
                : BigInt(input.compareAtPriceMinor),
          status: input.status,
        },
      });
      if (firstVariant) {
        await tx.productVariant.update({
          where: { id: firstVariant.id },
          data: {
            priceMinor: input.priceMinor == null ? undefined : BigInt(input.priceMinor),
            compareAtPriceMinor:
              input.compareAtPriceMinor === undefined
                ? undefined
                : input.compareAtPriceMinor === null
                  ? null
                  : BigInt(input.compareAtPriceMinor),
          },
        });
        if (input.stock != null || input.lowStockThreshold != null) {
          const inventory = firstVariant.inventoryItems[0];
          if (inventory) {
            await tx.inventoryItem.update({
              where: { id: inventory.id },
              data: {
                quantityOnHand: input.stock,
                lowStockThreshold: input.lowStockThreshold,
              },
            });
          }
        }
      }
      await tx.businessCatalogMeta.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          barcode: input.barcode ?? null,
          costMinor: input.costMinor == null ? null : BigInt(input.costMinor),
          weightGrams: input.weightGrams ?? null,
          returnEligible: input.returnEligible ?? true,
          metadata: { vertical },
        },
        update: {
          barcode: input.barcode === undefined ? undefined : input.barcode,
          costMinor:
            input.costMinor === undefined
              ? undefined
              : input.costMinor === null
                ? null
                : BigInt(input.costMinor),
          weightGrams: input.weightGrams,
          returnEligible: input.returnEligible,
        },
      });
    });

    await audit({
      actorUserId: auth.userId,
      action: "business.catalog.product.updated",
      resourceType: "Product",
      resourceId: product.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId, vertical },
    });

    return { updated: true };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/catalog/:vertical/bulk", async (request) => {
    const { organizationId, vertical } = z.object({
      organizationId: z.string(),
      vertical: z.enum(["SHOPPING", "GROCERY"]),
    }).parse(request.params);
    await requirePermission(request, organizationId, "catalog.manage");
    const input = z.object({
      items: z.array(catalogItemSchema).min(1).max(200),
    }).parse(request.body);
    const merchant = await orgMerchant(organizationId, vertical);
    const store = merchant.stores[0];
    if (!store) throw new AppError("CONFLICT", "Create a store before importing products", 409);
    const results: Array<{ index: number; productId?: string; error?: string }> = [];

    for (const [index, item] of input.items.entries()) {
      try {
        const category = await db.category.findUnique({ where: { id: item.categoryId }, select: { id: true } });
        if (!category) throw new Error("Category not found");
        if (await db.productVariant.findUnique({ where: { sku: item.sku }, select: { id: true } })) {
          throw new Error("SKU already exists");
        }
        const slug = await uniqueProductSlug(item.title);
        const created = await db.$transaction(async (tx) => {
          const product = await tx.product.create({
            data: {
              merchantId: merchant.id,
              categoryId: item.categoryId,
              slug,
              title: item.title,
              shortDescription: item.description.slice(0, 240),
              description: item.description,
              status: "DRAFT",
              currency: "NGN",
              priceMinor: BigInt(item.priceMinor),
              compareAtPriceMinor: item.compareAtPriceMinor == null ? null : BigInt(item.compareAtPriceMinor),
            },
          });
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: item.sku,
              title: "Default",
              attributes: item.attributes as Prisma.InputJsonObject | undefined,
              priceMinor: BigInt(item.priceMinor),
              compareAtPriceMinor: item.compareAtPriceMinor == null ? null : BigInt(item.compareAtPriceMinor),
              currency: "NGN",
            },
          });
          await tx.inventoryItem.create({
            data: {
              storeId: item.storeId ?? store.id,
              variantId: variant.id,
              quantityOnHand: item.stock,
              lowStockThreshold: item.lowStockThreshold,
            },
          });
          await tx.businessCatalogMeta.create({
            data: {
              productId: product.id,
              barcode: item.barcode ?? null,
              costMinor: item.costMinor == null ? null : BigInt(item.costMinor),
              weightGrams: item.weightGrams,
              returnEligible: item.returnEligible,
              metadata: { vertical, imported: true },
            },
          });
          return product;
        });
        results.push({ index, productId: created.id });
      } catch (error) {
        results.push({
          index,
          error: error instanceof Error ? error.message : "Import failed",
        });
      }
    }
    return {
      imported: results.filter((item) => item.productId).length,
      failed: results.filter((item) => item.error).length,
      results,
    };
  });

  app.post("/v1/business/advanced/food/restaurants/:restaurantId/menu-sections", async (request, reply) => {
    const { restaurantId } = z.object({ restaurantId: z.string() }).parse(request.params);
    const restaurant = await db.foodRestaurant.findUnique({
      where: { id: restaurantId },
      include: { merchant: true },
    });
    if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
    const { auth } = await requirePermission(request, restaurant.merchant.organizationId, "catalog.manage");
    const input = foodSectionSchema.parse(request.body);
    const section = await db.foodMenuSection.create({
      data: {
        restaurantId,
        slug: `${slugify(input.title)}-${randomBytes(2).toString("hex")}`,
        title: input.title,
        description: input.description,
        active: true,
      },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.food.menu.section.created",
      resourceType: "FoodMenuSection",
      resourceId: section.id,
      requestId: request.id,
      ipAddress: request.ip,
    });
    return reply.code(201).send({ section });
  });

  app.post("/v1/business/advanced/food/restaurants/:restaurantId/menu-items", async (request, reply) => {
    const { restaurantId } = z.object({ restaurantId: z.string() }).parse(request.params);
    const restaurant = await db.foodRestaurant.findUnique({
      where: { id: restaurantId },
      include: { merchant: true },
    });
    if (!restaurant) throw new AppError("NOT_FOUND", "Restaurant not found", 404);
    const { auth } = await requirePermission(request, restaurant.merchant.organizationId, "catalog.manage");
    const input = foodItemSchema.parse(request.body);
    const section = await db.foodMenuSection.findFirst({
      where: { id: input.sectionId, restaurantId },
    });
    if (!section) throw new AppError("NOT_FOUND", "Menu section not found", 404);
    const item = await db.foodMenuItem.create({
      data: {
        restaurantId,
        sectionId: section.id,
        slug: await uniqueFoodSlug(restaurantId, input.name),
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
        currency: "NGN",
        priceMinor: BigInt(input.priceMinor),
        active: input.active,
        soldOut: false,
        featured: input.featured,
        dietaryTags: input.dietaryTags,
        prepMinutes: input.prepMinutes,
      },
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.food.menu.item.created",
      resourceType: "FoodMenuItem",
      resourceId: item.id,
      requestId: request.id,
      ipAddress: request.ip,
    });
    return reply.code(201).send({
      item: {
        ...item,
        priceMinor: safeMinor(item.priceMinor),
      },
    });
  });

  app.post("/v1/business/advanced/food/menu-items/:itemId/modifier-groups", async (request, reply) => {
    const { itemId } = z.object({ itemId: z.string() }).parse(request.params);
    const item = await db.foodMenuItem.findUnique({
      where: { id: itemId },
      include: { restaurant: { include: { merchant: true } } },
    });
    if (!item) throw new AppError("NOT_FOUND", "Menu item not found", 404);
    const { auth } = await requirePermission(request, item.restaurant.merchant.organizationId, "catalog.manage");
    const input = modifierSchema.parse(request.body);
    const group = await db.$transaction(async (tx) => {
      const created = await tx.foodModifierGroup.create({
        data: {
          itemId,
          name: input.name,
          required: input.required,
          minSelect: input.minSelect,
          maxSelect: input.maxSelect,
        },
      });
      await tx.foodModifierOption.createMany({
        data: input.options.map((option, index) => ({
          groupId: created.id,
          name: option.name,
          priceDeltaMinor: BigInt(option.priceDeltaMinor),
          active: true,
          sortOrder: index,
        })),
      });
      return created;
    });
    await audit({
      actorUserId: auth.userId,
      action: "business.food.menu.modifier.created",
      resourceType: "FoodModifierGroup",
      resourceId: group.id,
      requestId: request.id,
      ipAddress: request.ip,
    });
    return reply.code(201).send({ group });
  });



  app.get("/v1/business/advanced/organizations/:organizationId/analytics", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    await requirePermission(request, organizationId, "analytics.read");

    const merchants = await db.merchant.findMany({
      where: { organizationId },
      select: {
        id: true,
        vertical: true,
        foodRestaurant: { select: { id: true } },
      },
    });

    const merchantIds = merchants.map((merchant) => merchant.id);
    const restaurantIds = merchants
      .map((merchant) => merchant.foodRestaurant?.id)
      .filter((id): id is string => Boolean(id));

    const [shoppingOrders, foodOrders, pharmacyOrders] = await Promise.all([
      db.shoppingSellerOrder.findMany({
        where: { merchantId: { in: merchantIds } },
        select: {
          id: true,
          totalMinor: true,
          status: true,
          createdAt: true,
          merchant: { select: { vertical: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      db.foodOrder.findMany({
        where: { restaurantId: { in: restaurantIds } },
        select: {
          id: true,
          totalMinor: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      db.pharmacyOrder.findMany({
        where: { merchantId: { in: merchantIds } },
        select: {
          id: true,
          totalMinor: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

    const terminalShopping = new Set(["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"]);
    const terminalFood = new Set(["DELIVERED", "CANCELLED"]);
    const terminalPharmacy = new Set(["DELIVERED", "CANCELLED"]);

    const shoppingRevenue = shoppingOrders
      .filter((order) => order.status === "DELIVERED")
      .reduce((sum, order) => sum + safeMinor(order.totalMinor)!, 0);
    const groceryRevenue = shoppingOrders
      .filter(
        (order) =>
          order.status === "DELIVERED" &&
          order.merchant.vertical.toUpperCase() === "GROCERY",
      )
      .reduce((sum, order) => sum + safeMinor(order.totalMinor)!, 0);
    const pureShoppingRevenue = shoppingOrders
      .filter(
        (order) =>
          order.status === "DELIVERED" &&
          order.merchant.vertical.toUpperCase() === "SHOPPING",
      )
      .reduce((sum, order) => sum + safeMinor(order.totalMinor)!, 0);
    const foodRevenue = foodOrders
      .filter((order) => order.status === "DELIVERED")
      .reduce((sum, order) => sum + safeMinor(order.totalMinor)!, 0);
    const pharmacyRevenue = pharmacyOrders
      .filter((order) => order.status === "DELIVERED")
      .reduce((sum, order) => sum + safeMinor(order.totalMinor)!, 0);

    return {
      currency: "NGN",
      totals: {
        orders:
          shoppingOrders.length + foodOrders.length + pharmacyOrders.length,
        open:
          shoppingOrders.filter((order) => !terminalShopping.has(order.status)).length +
          foodOrders.filter((order) => !terminalFood.has(order.status)).length +
          pharmacyOrders.filter((order) => !terminalPharmacy.has(order.status)).length,
        grossMinor:
          pureShoppingRevenue +
          groceryRevenue +
          foodRevenue +
          pharmacyRevenue,
      },
      verticals: {
        SHOPPING: {
          orders: shoppingOrders.filter(
            (order) => order.merchant.vertical.toUpperCase() === "SHOPPING",
          ).length,
          grossMinor: pureShoppingRevenue,
        },
        GROCERY: {
          orders: shoppingOrders.filter(
            (order) => order.merchant.vertical.toUpperCase() === "GROCERY",
          ).length,
          grossMinor: groceryRevenue,
        },
        FOOD: {
          orders: foodOrders.length,
          grossMinor: foodRevenue,
        },
        PHARMACY: {
          orders: pharmacyOrders.length,
          grossMinor: pharmacyRevenue,
        },
      },
    };
  });

  app.get("/v1/business/advanced/organizations/:organizationId/customers", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    await requirePermission(request, organizationId, "customers.read");

    const merchants = await db.merchant.findMany({
      where: { organizationId },
      select: {
        id: true,
        foodRestaurant: { select: { id: true } },
      },
    });

    const merchantIds = merchants.map((merchant) => merchant.id);
    const restaurantIds = merchants
      .map((merchant) => merchant.foodRestaurant?.id)
      .filter((id): id is string => Boolean(id));

    const [shoppingOrders, foodOrders, pharmacyOrders] = await Promise.all([
      db.shoppingSellerOrder.findMany({
        where: { merchantId: { in: merchantIds } },
        select: {
          totalMinor: true,
          createdAt: true,
          order: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1500,
      }),
      db.foodOrder.findMany({
        where: { restaurantId: { in: restaurantIds } },
        select: {
          userId: true,
          totalMinor: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1500,
      }),
      db.pharmacyOrder.findMany({
        where: { merchantId: { in: merchantIds } },
        select: {
          userId: true,
          totalMinor: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1500,
      }),
    ]);

    const aggregate = new Map<
      string,
      { userId: string; orderCount: number; totalMinor: number; lastOrderAt: Date }
    >();

    const add = (userId: string, totalMinor: bigint, createdAt: Date) => {
      const current = aggregate.get(userId);
      const amount = safeMinor(totalMinor)!;
      if (!current) {
        aggregate.set(userId, {
          userId,
          orderCount: 1,
          totalMinor: amount,
          lastOrderAt: createdAt,
        });
        return;
      }
      current.orderCount += 1;
      current.totalMinor += amount;
      if (createdAt > current.lastOrderAt) current.lastOrderAt = createdAt;
    };

    for (const order of shoppingOrders) add(order.order.userId, order.totalMinor, order.createdAt);
    for (const order of foodOrders) add(order.userId, order.totalMinor, order.createdAt);
    for (const order of pharmacyOrders) add(order.userId, order.totalMinor, order.createdAt);

    const userIds = [...aggregate.keys()];
    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            displayName: true,
          },
        })
      : [];

    const userById = new Map(users.map((user) => [user.id, user]));

    return {
      customers: [...aggregate.values()]
        .sort((a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime())
        .map((customer) => ({
          userId: customer.userId,
          displayName: userById.get(customer.userId)?.displayName ?? "Bazaara customer",
          orderCount: customer.orderCount,
          totalMinor: customer.totalMinor,
          lastOrderAt: customer.lastOrderAt.toISOString(),
        })),
    };
  });

  app.get("/v1/business/advanced/organizations/:organizationId/verticals/:vertical/close-check", async (request) => {
    const { organizationId, vertical } = z.object({
      organizationId: z.string(),
      vertical: z.enum(VERTICALS),
    }).parse(request.params);
    await requirePermission(request, organizationId, "business.manage");
    const blockers = await verticalBlockers(organizationId, vertical);
    return { eligible: blockers.length === 0, blockers };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/verticals/:vertical/close", async (request) => {
    const { organizationId, vertical } = z.object({
      organizationId: z.string(),
      vertical: z.enum(VERTICALS),
    }).parse(request.params);
    const { auth } = await requirePermission(request, organizationId, "business.manage");
    const input = z.object({
      confirmVertical: z.enum(VERTICALS),
    }).parse(request.body);
    if (input.confirmVertical !== vertical) {
      throw new AppError("BAD_REQUEST", "Business type confirmation does not match", 400);
    }

    const blockers = await verticalBlockers(organizationId, vertical);
    if (blockers.length) {
      throw new AppError("CONFLICT", blockers.join("; "), 409);
    }

    const merchant = await orgMerchant(organizationId, vertical);

    await db.$transaction(async (tx) => {
      await tx.businessVerticalRegistration.upsert({
        where: {
          organizationId_vertical: { organizationId, vertical },
        },
        create: {
          organizationId,
          merchantId: merchant.id,
          vertical,
          status: "CLOSED",
          requirements: REQUIREMENTS[vertical],
          closedAt: new Date(),
        },
        update: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      if (vertical === "SHOPPING" || vertical === "GROCERY") {
        await tx.product.updateMany({
          where: { merchantId: merchant.id },
          data: { status: "ARCHIVED" },
        });
        await tx.store.updateMany({
          where: { merchantId: merchant.id },
          data: { status: "CLOSED" },
        });
      }

      if (vertical === "FOOD") {
        await tx.foodRestaurant.updateMany({
          where: { merchantId: merchant.id },
          data: {
            status: "CLOSED",
            acceptingOrders: false,
          },
        });
      }

      if (vertical === "PHARMACY") {
        await tx.pharmacyMerchantProfile.updateMany({
          where: { merchantId: merchant.id },
          data: {
            verificationStatus: "SUSPENDED",
            suspendedAt: new Date(),
          },
        });
        await tx.pharmacyProduct.updateMany({
          where: { merchantId: merchant.id },
          data: { active: false },
        });
      }
    });

    await audit({
      actorUserId: auth.userId,
      action: "business.vertical.closed",
      resourceType: "Merchant",
      resourceId: merchant.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { organizationId, vertical },
    });

    return { closed: true };
  });

  app.get("/v1/business/advanced/organizations/:organizationId/close-check", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    await requirePermission(request, organizationId, "team.manage");
    const merchants = await db.merchant.findMany({
      where: { organizationId },
      select: {
        id: true,
        vertical: true,
        foodRestaurant: { select: { id: true } },
      },
    });
    const merchantIds = merchants.map((item) => item.id);
    const restaurantIds = merchants.map((item) => item.foodRestaurant?.id).filter((id): id is string => Boolean(id));
    const [shoppingOpen, foodOpen, pharmacyOpen, settlements] = await Promise.all([
      db.shoppingSellerOrder.count({
        where: {
          merchantId: { in: merchantIds },
          status: {
            notIn: ["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] as any,
          },
        },
      }),
      db.foodOrder.count({
        where: {
          restaurantId: { in: restaurantIds },
          status: { notIn: ["DELIVERED", "CANCELLED"] as any },
        },
      }),
      db.pharmacyOrder.count({
        where: {
          merchantId: { in: merchantIds },
          status: { notIn: ["DELIVERED", "CANCELLED"] as any },
        },
      }),
      db.businessSettlement.count({
        where: {
          organizationId,
          status: { notIn: ["SETTLED", "PAID", "CANCELLED"] },
        },
      }),
    ]);
    const blockers = [
      shoppingOpen ? `${shoppingOpen} open Shopping/Grocery seller order(s)` : null,
      foodOpen ? `${foodOpen} open Food order(s)` : null,
      pharmacyOpen ? `${pharmacyOpen} open Pharmacy order(s)` : null,
      settlements ? `${settlements} unsettled settlement record(s)` : null,
    ].filter((item): item is string => Boolean(item));
    return { eligible: blockers.length === 0, blockers };
  });

  app.post("/v1/business/advanced/organizations/:organizationId/close", async (request) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
    const { auth, member } = await requireMember(request, organizationId);
    if (member.roleKey !== "OWNER") {
      throw new AppError("FORBIDDEN", "Only the business owner can close the entire organization", 403);
    }
    const input = z.object({
      confirmDisplayName: z.string(),
    }).parse(request.body);
    const organization = await db.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new AppError("NOT_FOUND", "Business organization not found", 404);
    if (input.confirmDisplayName.trim() !== organization.displayName) {
      throw new AppError("BAD_REQUEST", "Enter the exact brand name to confirm closure", 400);
    }

    const merchants = await db.merchant.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const merchantIds = merchants.map((item) => item.id);
    const settlementBlockers = await db.businessSettlement.count({
      where: {
        organizationId,
        status: { notIn: ["SETTLED", "PAID", "CANCELLED"] },
      },
    });
    const operationalBlockers = (
      await Promise.all(
        VERTICALS.map((vertical) => verticalBlockers(organizationId, vertical)),
      )
    ).flat();
    const blockers = [
      ...operationalBlockers,
      ...(settlementBlockers
        ? [`${settlementBlockers} unsettled settlement record(s)`]
        : []),
    ];
    if (blockers.length) {
      throw new AppError("CONFLICT", blockers.join("; "), 409);
    }

    await db.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { status: "CLOSED", closedAt: new Date() },
      });
      await tx.product.updateMany({
        where: { merchantId: { in: merchantIds } },
        data: { status: "ARCHIVED" },
      });
      await tx.store.updateMany({
        where: { merchantId: { in: merchantIds } },
        data: { status: "CLOSED" },
      });
      await tx.foodRestaurant.updateMany({
        where: { merchantId: { in: merchantIds } },
        data: { status: "CLOSED", acceptingOrders: false },
      });
      await tx.pharmacyMerchantProfile.updateMany({
        where: { merchantId: { in: merchantIds } },
        data: {
          verificationStatus: "SUSPENDED",
          suspendedAt: new Date(),
        },
      });
      await tx.businessVerticalRegistration.updateMany({
        where: { organizationId },
        data: { status: "CLOSED", closedAt: new Date() },
      });
      await tx.businessApiCredential.updateMany({
        where: { organizationId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.businessWebhookEndpoint.updateMany({
        where: { organizationId },
        data: { status: "DISABLED" },
      });
    });

    await audit({
      actorUserId: auth.userId,
      action: "business.organization.closed",
      resourceType: "Organization",
      resourceId: organizationId,
      requestId: request.id,
      ipAddress: request.ip,
    });
    return { closed: true };
  });
}
