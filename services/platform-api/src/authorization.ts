import type { FastifyRequest } from "fastify";
import type { Permission } from "@bazaara/contracts";
import { db } from "@bazaara/db";
import { requireAuth } from "./auth.js";
import { AppError } from "./errors.js";

const businessRolePermissions: Record<string, Permission[] | "*"> = {
  OWNER: "*",
  ADMIN: "*",
  MANAGER: [
    "merchant.read",
    "catalog.read",
    "catalog.manage",
    "inventory.manage",
    "order.read",
    "order.manage",
    "payment.read",
    "promotion.manage",
  ],
  FINANCE: [
    "merchant.read",
    "order.read",
    "payment.read",
    "payout.manage",
  ],
  STAFF: [
    "merchant.read",
    "catalog.read",
    "order.read",
  ],
  MEMBER: [
    "merchant.read",
    "catalog.read",
    "order.read",
  ],
  CUSTOM: [],
};

async function ensureOrganizationOwner(organizationId: string) {
  const currentOwner = await db.organizationMember.findFirst({
    where: {
      organizationId,
      roleKey: "OWNER",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (currentOwner) return;

  const earliestActive = await db.organizationMember.findFirst({
    where: {
      organizationId,
      status: "ACTIVE",
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  if (earliestActive) {
    await db.organizationMember.update({
      where: { id: earliestActive.id },
      data: {
        roleKey: "OWNER",
        title: "Owner",
      },
    });
  }
}

function membershipAllows(
  roleKey: string,
  explicitPermissions: string[],
  permission: Permission,
) {
  if (
    explicitPermissions.includes("*") ||
    explicitPermissions.includes(permission)
  ) {
    return true;
  }

  const defaults = businessRolePermissions[roleKey] ?? [];
  return defaults === "*" || defaults.includes(permission);
}

export async function requirePermission(
  request: FastifyRequest,
  permission: Permission,
  context: { organizationId?: string } = {},
) {
  const auth = await requireAuth(request);

  // Platform/employee roles remain the first authorization source.
  const assignment = await db.userRole.findFirst({
    where: {
      userId: auth.userId,
      OR: context.organizationId
        ? [
            { organizationId: null },
            { organizationId: context.organizationId },
          ]
        : [{ organizationId: null }],
      role: {
        permissions: {
          some: {
            permission: {
              key: permission,
            },
          },
        },
      },
    },
    select: { id: true },
  });

  if (assignment) {
    return auth;
  }

  // Business-scoped actions may also be authorized by OrganizationMember.
  // This is intentionally available only when the route has resolved the
  // organization. It never turns a Business role into a platform employee role.
  if (context.organizationId) {
    await ensureOrganizationOwner(context.organizationId);

    const member = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: context.organizationId,
          userId: auth.userId,
        },
      },
      select: {
        status: true,
        roleKey: true,
        permissions: true,
      },
    });

    if (
      member?.status === "ACTIVE" &&
      membershipAllows(member.roleKey, member.permissions, permission)
    ) {
      return auth;
    }
  }

  throw new AppError(
    "FORBIDDEN",
    "You do not have permission to perform this action",
    403,
  );
}
