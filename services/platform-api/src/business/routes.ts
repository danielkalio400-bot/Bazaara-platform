import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { db, Prisma } from "@bazaara/db";
import { newOpaqueToken, sha256Base64Url } from "@bazaara/security";
import type {
  BusinessApiCredentialContract,
  BusinessBranchContract,
  BusinessInvoiceContract,
  BusinessMemberContract,
  BusinessSettlementContract,
  BusinessWebhookEndpointContract,
} from "@bazaara/contracts";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";
import { env } from "../config.js";


async function ensureBusinessTaxId(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { bTaxId: true, country: true },
  });
  if (!organization) throw new AppError("NOT_FOUND", "Business organization not found", 404);
  if (organization.bTaxId) return organization.bTaxId;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`
      .toUpperCase()
      .slice(-10);
    const value = `BTAX-${organization.country || "NG"}-${suffix}`;
    const existing = await db.organization.findUnique({
      where: { bTaxId: value },
      select: { id: true },
    });
    if (existing) continue;
    await db.organization.update({
      where: { id: organizationId },
      data: { bTaxId: value },
    });
    return value;
  }

  throw new AppError("CONFLICT", "Could not allocate BTaxID", 409);
}

async function requireOrganizationMember(
  request: FastifyRequest,
  organizationId: string,
) {
  const auth = await requireAuth(request);
  const member = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: auth.userId,
      },
    },
  });

  if (!member || member.status !== "ACTIVE") {
    throw new AppError(
      "FORBIDDEN",
      "Active organization membership required",
      403,
    );
  }

  return auth;
}

const BUSINESS_VERTICALS = ["SHOPPING", "FOOD", "GROCERY", "PHARMACY"] as const;
type BusinessVertical = (typeof BUSINESS_VERTICALS)[number];

function merchantSlugBase(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "bazaara-business"
  );
}

async function uniqueMerchantSlug(
  tx: Prisma.TransactionClient,
  organizationName: string,
  vertical: BusinessVertical,
) {
  const base = `${merchantSlugBase(organizationName)}-${vertical.toLowerCase()}`;
  let candidate = base;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const existing = await tx.merchant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;

    candidate = `${base}-${randomUUID().slice(0, 6).toLowerCase()}`;
  }

  throw new AppError(
    "CONFLICT",
    "Could not allocate a unique business identifier",
    409,
  );
}

const registerVerticalSchema = z.object({
  vertical: z.enum(BUSINESS_VERTICALS),
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().min(2).max(1200).optional(),
});


function branchContract(branch: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  status: string;
  timezone: string;
  address: unknown;
}): BusinessBranchContract {
  return {
    id: branch.id,
    organizationId: branch.organizationId,
    name: branch.name,
    code: branch.code,
    status: branch.status,
    timezone: branch.timezone,
    address: branch.address ?? null,
  };
}

function credentialContract(credential: {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
}): BusinessApiCredentialContract {
  return {
    id: credential.id,
    organizationId: credential.organizationId,
    name: credential.name,
    keyPrefix: credential.keyPrefix,
    scopes: credential.scopes,
    createdAt: credential.createdAt.toISOString(),
    expiresAt: credential.expiresAt?.toISOString() ?? null,
    revokedAt: credential.revokedAt?.toISOString() ?? null,
  };
}

function webhookContract(endpoint: {
  id: string;
  organizationId: string;
  url: string;
  events: string[];
  status: string;
  signingKeyId: string;
  failureCount: number;
}): BusinessWebhookEndpointContract {
  return {
    id: endpoint.id,
    organizationId: endpoint.organizationId,
    url: endpoint.url,
    events: endpoint.events,
    status: endpoint.status,
    signingKeyId: endpoint.signingKeyId,
    failureCount: endpoint.failureCount,
  };
}

function safeMinor(value: bigint) {
  const numeric = Number(value);
  if (!Number.isSafeInteger(numeric)) {
    throw new Error("Monetary value exceeds transport range");
  }
  return numeric;
}

function invoiceContract(invoice: {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string | null;
  currency: string;
  subtotalMinor: bigint;
  taxMinor: bigint;
  totalMinor: bigint;
  status: string;
  lines: unknown;
  dueAt: Date | null;
  paidAt: Date | null;
}): BusinessInvoiceContract {
  return {
    id: invoice.id,
    organizationId: invoice.organizationId,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    currency: invoice.currency,
    subtotalMinor: safeMinor(invoice.subtotalMinor),
    taxMinor: safeMinor(invoice.taxMinor),
    totalMinor: safeMinor(invoice.totalMinor),
    status: invoice.status,
    lines: invoice.lines,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
  };
}

function settlementContract(settlement: {
  id: string;
  organizationId: string;
  reference: string;
  currency: string;
  grossMinor: bigint;
  feeMinor: bigint;
  netMinor: bigint;
  status: string;
  provider: string | null;
  providerRef: string | null;
  scheduledFor: Date | null;
  settledAt: Date | null;
  createdAt: Date;
}): BusinessSettlementContract {
  return {
    id: settlement.id,
    organizationId: settlement.organizationId,
    reference: settlement.reference,
    currency: settlement.currency,
    grossMinor: safeMinor(settlement.grossMinor),
    feeMinor: safeMinor(settlement.feeMinor),
    netMinor: safeMinor(settlement.netMinor),
    status: settlement.status,
    provider: settlement.provider,
    providerRef: settlement.providerRef,
    scheduledFor: settlement.scheduledFor?.toISOString() ?? null,
    settledAt: settlement.settledAt?.toISOString() ?? null,
    createdAt: settlement.createdAt.toISOString(),
  };
}

function memberContract(member: {
  id: string;
  organizationId: string;
  userId: string;
  title: string | null;
  status: string;
  createdAt: Date;
  user: {
    displayName: string | null;
    verificationLevel: string;
    emails: Array<{
      email: string;
      normalized: string;
      isPrimary: boolean;
      verifiedAt: Date | null;
    }>;
  };
}): BusinessMemberContract {
  const primary =
    member.user.emails.find((email) => email.isPrimary && email.verifiedAt) ??
    member.user.emails.find((email) => email.isPrimary) ??
    member.user.emails.find((email) => email.verifiedAt) ??
    member.user.emails[0];

  return {
    id: member.id,
    organizationId: member.organizationId,
    userId: member.userId,
    displayName: member.user.displayName,
    title: member.title,
    status: member.status,
    primaryEmail: primary?.normalized ?? primary?.email ?? null,
    verificationLevel: member.user.verificationLevel,
    createdAt: member.createdAt.toISOString(),
  };
}

function deriveWebhookSecret(endpointId: string) {
  if (!env.WEBHOOK_SIGNING_MASTER_SECRET) {
    throw new AppError(
      "CONFIGURATION_REQUIRED",
      "Webhook creation requires WEBHOOK_SIGNING_MASTER_SECRET",
      503,
    );
  }

  return createHmac("sha256", env.WEBHOOK_SIGNING_MASTER_SECRET)
    .update(`bazaara-webhook:${endpointId}`)
    .digest("base64url");
}

const branchAddressSchema = z.object({
  line1: z.string().trim().min(2).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().max(32).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  placeIdentifier: z.string().trim().max(200).optional(),
}).refine(
  (value) => (value.latitude === undefined) === (value.longitude === undefined),
  "Latitude and longitude must be supplied together",
);

const branchSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().regex(/^[A-Za-z0-9_-]{2,32}$/),
  timezone: z.string().trim().min(3).max(80).default("Africa/Lagos"),
  address: branchAddressSchema.optional(),
});

const credentialSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(z.string().trim().min(2).max(80)).min(1).max(30),
  expiresAt: z.string().datetime().optional(),
});

const webhookSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (value) => value.startsWith("https://") || env.NODE_ENV === "development",
      "Webhook URL must use HTTPS outside development",
    ),
  events: z.array(z.string().trim().min(3).max(120)).min(1).max(100),
});

const invoiceSchema = z.object({
  customerName: z.string().trim().min(2).max(200),
  customerEmail: z.string().email().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).default("NGN"),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.number().int().positive().max(100000),
        unitPriceMinor: z.number().int().min(0).max(1_000_000_000),
      }),
    )
    .min(1)
    .max(200),
  taxMinor: z.number().int().min(0).max(1_000_000_000).default(0),
  dueAt: z.string().datetime().optional(),
});

const invoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "VOID"]),
});

export async function businessPlatformRoutes(app: FastifyInstance) {
  app.get("/v1/business/capabilities", async () => ({
    organizations: true,
    branches: true,
    team: true,
    apiCredentials: true,
    signedWebhooks: true,
    invoices: true,
    settlements: true,
    verticalRegistration: true,
    organizationScopedVerticals: true,
    advancedOnboarding: true,
    businessIds: true,
    teamRoles: true,
    catalogManagement: true,
    businessClosure: true,
  }));

  app.get("/v1/business/organizations", async (request) => {
    const auth = await requireAuth(request);
    const memberships = await db.organizationMember.findMany({
      where: {
        userId: auth.userId,
        status: "ACTIVE",
      },
      include: {
        organization: {
          include: {
            merchants: {
              select: {
                id: true,
                vertical: true,
                slug: true,
                verifiedAt: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const organizationIds = memberships.map(
      (membership) => membership.organizationId,
    );
    const registrations = organizationIds.length
      ? await db.businessVerticalRegistration.findMany({
          where: {
            organizationId: { in: organizationIds },
          },
          select: {
            organizationId: true,
            merchantId: true,
            vertical: true,
            status: true,
          },
        })
      : [];

    const registrationByMerchant = new Map(
      registrations.map((registration) => [
        registration.merchantId,
        registration,
      ]),
    );

    const bTaxByOrganization = new Map(
      await Promise.all(
        memberships.map(async (membership) => [
          membership.organizationId,
          await ensureBusinessTaxId(membership.organizationId),
        ] as const),
      ),
    );

    return {
      organizations: memberships.map((membership) => {
        const {
          merchants,
          ...organization
        } = membership.organization;

        const visibleMerchants = merchants.filter((merchant) => {
          const registration = registrationByMerchant.get(merchant.id);
          return registration?.status !== "CLOSED";
        });

        const verticals = [
          ...new Set(
            visibleMerchants
              .map((merchant) => merchant.vertical.toUpperCase())
              .filter((vertical): vertical is BusinessVertical =>
                BUSINESS_VERTICALS.includes(vertical as BusinessVertical),
              ),
          ),
        ];

        return {
          ...organization,
          bTaxId: bTaxByOrganization.get(membership.organizationId) ?? organization.bTaxId,
          verticals,
          merchants: visibleMerchants,
        };
      }),
    };
  });

  app.get(
    "/v1/business/organizations/:organizationId/verticals",
    async (request) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      const merchants = await db.merchant.findMany({
        where: { organizationId },
        select: {
          id: true,
          slug: true,
          vertical: true,
          verifiedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const registered = merchants
        .map((merchant) => ({
          ...merchant,
          vertical: merchant.vertical.toUpperCase(),
          verified: Boolean(merchant.verifiedAt),
        }))
        .filter((merchant) =>
          BUSINESS_VERTICALS.includes(merchant.vertical as BusinessVertical),
        );

      const registrations = await db.businessVerticalRegistration.findMany({
        where: { organizationId },
        select: {
          merchantId: true,
          vertical: true,
          status: true,
          submittedAt: true,
          activatedAt: true,
          closedAt: true,
        },
      });

      const registrationByMerchant = new Map(
        registrations.map((registration) => [
          registration.merchantId,
          registration,
        ]),
      );

      const visibleRegistered = registered
        .map((merchant) => ({
          ...merchant,
          registrationStatus:
            registrationByMerchant.get(merchant.id)?.status ??
            (merchant.verified ? "ACTIVE" : "SETUP"),
        }))
        .filter((merchant) => merchant.registrationStatus !== "CLOSED");

      const activeVerticals = [
        ...new Set(visibleRegistered.map((merchant) => merchant.vertical)),
      ];

      return {
        registered: visibleRegistered,
        activeVerticals,
        availableVerticals: BUSINESS_VERTICALS.filter(
          (vertical) => !activeVerticals.includes(vertical),
        ),
      };
    },
  );

  app.post(
    "/v1/business/organizations/:organizationId/verticals/register",
    async (request, reply) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      const auth = await requireOrganizationMember(request, organizationId);
      const registeringMember = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: auth.userId,
          },
        },
        select: {
          roleKey: true,
        },
      });
      if (
        !registeringMember ||
        !["OWNER", "ADMIN"].includes(registeringMember.roleKey)
      ) {
        throw new AppError(
          "FORBIDDEN",
          "Owner or Admin access is required to add a business type",
          403,
        );
      }
      const input = registerVerticalSchema.parse(request.body);

      const result = await db.$transaction(
        async (tx) => {
          const organization = await tx.organization.findUnique({
            where: { id: organizationId },
            select: {
              id: true,
              displayName: true,
              legalName: true,
            },
          });

          if (!organization) {
            throw new AppError(
              "NOT_FOUND",
              "Business organization not found",
              404,
            );
          }

          const existing = await tx.merchant.findFirst({
            where: {
              organizationId,
              vertical: input.vertical,
            },
          });

          if (existing) {
            return {
              merchant: existing,
              alreadyRegistered: true,
            };
          }

          const slug = await uniqueMerchantSlug(
            tx,
            input.name ?? organization.displayName,
            input.vertical,
          );

          const merchant = await tx.merchant.create({
            data: {
              organizationId,
              slug,
              vertical: input.vertical,
            },
          });

          const displayName = input.name ?? organization.displayName;

          if (input.vertical === "SHOPPING") {
            await tx.store.create({
              data: {
                merchantId: merchant.id,
                name: displayName,
                status: "ACTIVE",
                timezone: "Africa/Lagos",
                fulfillmentModes: ["STANDARD"],
              },
            });
          }

          if (input.vertical === "FOOD") {
            await tx.foodRestaurant.create({
              data: {
                merchantId: merchant.id,
                slug,
                description:
                  input.description ??
                  `${displayName} is setting up on Food.`,
                status: "DRAFT",
                acceptingOrders: false,
                deliveryEnabled: true,
                pickupEnabled: true,
                asapEnabled: true,
                scheduledEnabled: true,
              },
            });
          }

          if (input.vertical === "GROCERY") {
            const store = await tx.store.create({
              data: {
                merchantId: merchant.id,
                name: displayName,
                status: "SETUP",
                timezone: "Africa/Lagos",
                fulfillmentModes: ["STANDARD"],
              },
            });

            await tx.groceryStoreConfig.create({
              data: {
                storeId: store.id,
              },
            });
          }

          if (input.vertical === "PHARMACY") {
            await tx.pharmacyMerchantProfile.create({
              data: {
                merchantId: merchant.id,
                regulator: "PCN",
                verificationStatus: "PENDING",
              },
            });
          }

          return {
            merchant,
            alreadyRegistered: false,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return reply
        .code(result.alreadyRegistered ? 200 : 201)
        .send({
          merchant: {
            id: result.merchant.id,
            slug: result.merchant.slug,
            vertical: result.merchant.vertical,
            verified: Boolean(result.merchant.verifiedAt),
          },
          alreadyRegistered: result.alreadyRegistered,
          nextPath:
            result.merchant.vertical === "SHOPPING"
              ? "/shopping"
              : result.merchant.vertical === "FOOD"
                ? "/food"
                : result.merchant.vertical === "GROCERY"
                  ? "/grocery"
                  : "/pharmacy",
          registeredByUserId: auth.userId,
        });
    },
  );

  app.get(
    "/v1/business/organizations/:organizationId/branches",
    async (request) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      const branches = await db.businessBranch.findMany({
        where: { organizationId },
        orderBy: { createdAt: "asc" },
      });

      return { branches: branches.map(branchContract) };
    },
  );

  app.post(
    "/v1/business/organizations/:organizationId/branches",
    async (request, reply) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);
      const input = branchSchema.parse(request.body);

      const branch = await db.businessBranch.create({
        data: {
          organizationId,
          name: input.name,
          code: input.code.toUpperCase(),
          timezone: input.timezone,
          address:
            input.address === undefined
              ? undefined
              : (input.address as Prisma.InputJsonValue),
        },
      });

      return reply.code(201).send({ branch: branchContract(branch) });
    },
  );

  app.get(
    "/v1/business/organizations/:organizationId/members",
    async (request) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      const members = await db.organizationMember.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              displayName: true,
              verificationLevel: true,
              emails: {
                orderBy: [
                  { isPrimary: "desc" },
                  { createdAt: "asc" },
                ],
                select: {
                  email: true,
                  normalized: true,
                  isPrimary: true,
                  verifiedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return { members: members.map(memberContract) };
    },
  );


  app.patch(
    "/v1/business/organizations/:organizationId/branches/:branchId",
    async (request) => {
      const { organizationId, branchId } = z.object({
        organizationId: z.string(),
        branchId: z.string(),
      }).parse(request.params);

      await requireOrganizationMember(request, organizationId);
      const input = branchSchema.partial().parse(request.body);
      const existing = await db.businessBranch.findFirst({
        where: { id: branchId, organizationId },
      });
      if (!existing) throw new AppError("NOT_FOUND", "Business branch not found", 404);

      const branch = await db.businessBranch.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          code: input.code?.toUpperCase(),
          timezone: input.timezone,
          address: input.address === undefined
            ? undefined
            : (input.address as Prisma.InputJsonValue),
        },
      });

      return { branch: branchContract(branch) };
    },
  );

  app.get(
    "/v1/business/organizations/:organizationId/api-credentials",
    async (request) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      const credentials = await db.businessApiCredential.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      });

      return { credentials: credentials.map(credentialContract) };
    },
  );

  app.post(
    "/v1/business/organizations/:organizationId/api-credentials",
    async (request, reply) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);
      const input = credentialSchema.parse(request.body);

      const raw = `bz_live_${newOpaqueToken(32)}`;
      const keyPrefix = raw.slice(0, 16);

      const credential = await db.businessApiCredential.create({
        data: {
          organizationId,
          name: input.name,
          keyPrefix,
          secretHash: sha256Base64Url(raw),
          scopes: [...new Set(input.scopes)],
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      });

      return reply.code(201).send({
        credential: credentialContract(credential),
        secret: raw,
      });
    },
  );

  app.delete(
    "/v1/business/organizations/:organizationId/api-credentials/:id",
    async (request, reply) => {
      const { organizationId, id } = z
        .object({
          organizationId: z.string(),
          id: z.string(),
        })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      await db.businessApiCredential.updateMany({
        where: {
          id,
          organizationId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return reply.code(204).send();
    },
  );

  app.get(
    "/v1/business/organizations/:organizationId/webhooks",
    async (request) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      const endpoints = await db.businessWebhookEndpoint.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      });

      return { endpoints: endpoints.map(webhookContract) };
    },
  );

  app.post(
    "/v1/business/organizations/:organizationId/webhooks",
    async (request, reply) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);
      const input = webhookSchema.parse(request.body);

      if (!env.WEBHOOK_SIGNING_MASTER_SECRET) {
        throw new AppError(
          "CONFIGURATION_REQUIRED",
          "Webhook signing is not configured",
          503,
        );
      }

      const endpoint = await db.$transaction(async (tx) => {
        const draft = await tx.businessWebhookEndpoint.create({
          data: {
            organizationId,
            url: input.url,
            events: [...new Set(input.events)],
            secretHash: "pending",
            signingKeyId: `whk_${randomUUID().slice(0, 12)}`,
          },
        });

        const secret = deriveWebhookSecret(draft.id);

        return tx.businessWebhookEndpoint.update({
          where: { id: draft.id },
          data: {
            secretHash: sha256Base64Url(secret),
          },
        });
      });

      return reply.code(201).send({
        endpoint: webhookContract(endpoint),
        signingSecret: deriveWebhookSecret(endpoint.id),
      });
    },
  );

  app.get(
    "/v1/business/organizations/:organizationId/invoices",
    async (request) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      const invoices = await db.businessInvoice.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return { invoices: invoices.map(invoiceContract) };
    },
  );

  app.post(
    "/v1/business/organizations/:organizationId/invoices",
    async (request, reply) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);
      const input = invoiceSchema.parse(request.body);

      const subtotal = input.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitPriceMinor,
        0,
      );
      const total = subtotal + input.taxMinor;
      const invoiceNumber =
        `INV-${new Date().getUTCFullYear()}-${Date.now()
          .toString(36)
          .toUpperCase()}`;

      const invoice = await db.businessInvoice.create({
        data: {
          organizationId,
          invoiceNumber,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          currency: input.currency,
          subtotalMinor: BigInt(subtotal),
          taxMinor: BigInt(input.taxMinor),
          totalMinor: BigInt(total),
          lines: input.lines as Prisma.InputJsonValue,
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
        },
      });

      return reply.code(201).send({
        invoice: invoiceContract(invoice),
      });
    },
  );

  app.patch(
    "/v1/business/organizations/:organizationId/invoices/:id/status",
    async (request) => {
      const { organizationId, id } = z
        .object({
          organizationId: z.string(),
          id: z.string(),
        })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);
      const input = invoiceStatusSchema.parse(request.body);

      const existing = await db.businessInvoice.findFirst({
        where: {
          id,
          organizationId,
        },
      });

      if (!existing) {
        throw new AppError("NOT_FOUND", "Business invoice not found", 404);
      }

      if (existing.status === input.status) {
        return { invoice: invoiceContract(existing), actionState: "ALREADY_DONE" as const };
      }

      const invoice = await db.businessInvoice.update({
        where: { id },
        data: {
          status: input.status,
          paidAt:
            input.status === "PAID"
              ? existing.paidAt ?? new Date()
              : input.status === "DRAFT"
                ? null
                : existing.paidAt,
        },
      });

      return { invoice: invoiceContract(invoice), actionState: "COMPLETED" as const };
    },
  );

  app.get(
    "/v1/business/organizations/:organizationId/settlements",
    async (request) => {
      const { organizationId } = z
        .object({ organizationId: z.string() })
        .parse(request.params);

      await requireOrganizationMember(request, organizationId);

      const query = z
        .object({
          status: z.string().trim().min(1).max(40).optional(),
        })
        .parse(request.query);

      const settlements = await db.businessSettlement.findMany({
        where: {
          organizationId,
          ...(query.status ? { status: query.status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      return {
        settlements: settlements.map(settlementContract),
      };
    },
  );
}
