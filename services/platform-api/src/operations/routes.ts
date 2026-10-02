import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { requirePermission } from "../authorization.js";
import { AppError } from "../errors.js";
import { audit } from "../audit.js";
import {
  getOrganizationPaySummary,
  settleBusinessSettlementToPay,
} from "../business/pay-service.js";
import { getDriveFinanceSnapshot } from "../drive/service.js";

function safeMinor(value: bigint | null | undefined) {
  const raw = value ?? 0n;
  const result = Number(raw);
  if (!Number.isSafeInteger(result)) {
    throw new Error("Monetary value exceeds transport range");
  }
  return result;
}

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

export async function operationsPlatformRoutes(app: FastifyInstance) {
  app.get("/v1/operations/platform-overview", async (request) => {
    await requirePermission(request, "audit.read");

    const [
      users,
      organizations,
      merchants,
      shoppingOpen,
      groceryOpen,
      foodOpen,
      pharmacyOpen,
      driveOpen,
      logisticsOpen,
      supportOpen,
      riskOpen,
      payFundingPending,
      payWithdrawalsPending,
      businessSettlementsPending,
      loanApplicationsPending,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.organization.count(),
      db.merchant.groupBy({
        by: ["vertical"],
        _count: { _all: true },
      }),
      db.shoppingOrder.count({
        where: {
          vertical: "SHOPPING",
          deliveredAt: null,
          cancelledAt: null,
        },
      }),
      db.shoppingOrder.count({
        where: {
          vertical: "GROCERY",
          deliveredAt: null,
          cancelledAt: null,
        },
      }),
      db.foodOrder.count({
        where: {
          deliveredAt: null,
          cancelledAt: null,
        },
      }),
      db.pharmacyOrder.count({
        where: {
          status: {
            notIn: ["DELIVERED", "CANCELLED", "COMPLETED"],
          },
        },
      }),
      db.driveRide.count({
        where: {
          completedAt: null,
          cancelledAt: null,
        },
      }),
      db.logisticsBooking.count({
        where: {
          completedAt: null,
          status: { not: "CANCELLED" },
        },
      }),
      db.supportCase.count({
        where: {
          resolvedAt: null,
          closedAt: null,
        },
      }),
      db.riskSignal.count({
        where: {
          status: {
            in: ["OPEN", "ACKNOWLEDGED"],
          },
        },
      }),
      db.payFundingIntent.count({
        where: {
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      }),
      db.payWithdrawal.count({
        where: {
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      }),
      db.businessSettlement.count({
        where: {
          status: {
            not: "SETTLED",
          },
        },
      }),
      db.payLoanApplication.count({
        where: {
          status: {
            in: ["PENDING_PARTNER", "OFFERED"],
          },
        },
      }),
    ]);

    const recentOrganizations = await db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        businessNumber: true,
        displayName: true,
        legalName: true,
        status: true,
        country: true,
        createdAt: true,
        merchants: {
          select: {
            id: true,
            vertical: true,
            verifiedAt: true,
          },
        },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        users,
        organizations,
        merchants: merchants.reduce(
          (sum, row) => sum + row._count._all,
          0,
        ),
      },
      verticals: Object.fromEntries(
        merchants.map((row) => [row.vertical, row._count._all]),
      ),
      workload: {
        shoppingOpen,
        groceryOpen,
        foodOpen,
        pharmacyOpen,
        driveOpen,
        logisticsOpen,
        supportOpen,
        riskOpen,
      },
      finance: {
        payFundingPending,
        payWithdrawalsPending,
        businessSettlementsPending,
        loanApplicationsPending,
      },
      recentOrganizations: recentOrganizations.map((organization) => ({
        ...organization,
        createdAt: organization.createdAt.toISOString(),
      })),
    };
  });

  app.get("/v1/operations/grocery", async (request) => {
    await requirePermission(request, "order.read");

    const [stores, sellerOrders, issues] = await Promise.all([
      db.store.findMany({
        where: {
          merchant: {
            vertical: "GROCERY",
          },
        },
        include: {
          merchant: {
            include: {
              organization: true,
            },
          },
          groceryConfig: true,
          groceryDeliverySlots: {
            where: {
              startsAt: {
                gte: new Date(Date.now() - 12 * 60 * 60 * 1000),
              },
            },
            orderBy: { startsAt: "asc" },
            take: 20,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.shoppingSellerOrder.findMany({
        where: {
          merchant: {
            vertical: "GROCERY",
          },
          order: {
            vertical: "GROCERY",
          },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              paymentStatus: true,
              deliveryMode: true,
              scheduledFor: true,
              currency: true,
            },
          },
          merchant: {
            include: {
              organization: true,
            },
          },
          store: true,
          groceryPickerSession: true,
        },
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      db.groceryIssue.findMany({
        where: {
          status: {
            notIn: ["RESOLVED", "CLOSED"],
          },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              currency: true,
            },
          },
          merchant: {
            include: {
              organization: true,
            },
          },
          user: {
            select: {
              id: true,
              displayName: true,
              emails: {
                select: {
                  email: true,
                  isPrimary: true,
                },
                take: 5,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const openOrders = sellerOrders.filter(
      (item) =>
        !["DELIVERED", "CANCELLED"].includes(String(item.status)),
    );

    const activePicking = sellerOrders.filter(
      (item) => item.groceryPickerSession?.status === "PICKING",
    ).length;

    const upcomingSlots = stores.flatMap((store) =>
      store.groceryDeliverySlots.filter(
        (slot) => slot.active && slot.endsAt > new Date(),
      ),
    );

    return {
      generatedAt: new Date().toISOString(),
      kpis: {
        stores: stores.length,
        activeStores: stores.filter((store) => store.status === "ACTIVE")
          .length,
        openOrders: openOrders.length,
        activePicking,
        unresolvedIssues: issues.length,
        upcomingSlots: upcomingSlots.length,
        reservedSlots: upcomingSlots.reduce(
          (sum, slot) => sum + slot.reserved,
          0,
        ),
      },
      stores: stores.map((store) => ({
        id: store.id,
        name: store.name,
        status: store.status,
        timezone: store.timezone,
        fulfillmentModes: store.fulfillmentModes,
        merchant: {
          id: store.merchant.id,
          organizationId: store.merchant.organizationId,
          name: store.merchant.organization.displayName,
          businessNumber: store.merchant.organization.businessNumber,
        },
        config: store.groceryConfig
          ? {
              pickupEnabled: store.groceryConfig.pickupEnabled,
              expressEnabled: store.groceryConfig.expressEnabled,
              scheduledEnabled: store.groceryConfig.scheduledEnabled,
              pickerChatEnabled: store.groceryConfig.pickerChatEnabled,
              weightedItemsEnabled:
                store.groceryConfig.weightedItemsEnabled,
              minimumOrderMinor: safeMinor(
                store.groceryConfig.minimumOrderMinor,
              ),
              maxActiveOrders: store.groceryConfig.maxActiveOrders,
              prepMinutes: store.groceryConfig.prepMinutes,
            }
          : null,
        slots: store.groceryDeliverySlots.map((slot) => ({
          id: slot.id,
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
          capacity: slot.capacity,
          reserved: slot.reserved,
          active: slot.active,
        })),
      })),
      orders: sellerOrders.map((item) => ({
        id: item.id,
        orderNumber: item.order.orderNumber,
        status: item.status,
        orderStatus: item.order.status,
        paymentStatus: item.order.paymentStatus,
        deliveryMode: item.order.deliveryMode,
        scheduledFor: iso(item.order.scheduledFor),
        totalMinor: safeMinor(item.totalMinor),
        currency: item.order.currency,
        merchant: item.merchant.organization.displayName,
        businessNumber: item.merchant.organization.businessNumber,
        store: item.store.name,
        pickerStatus: item.groceryPickerSession?.status ?? null,
        pickerUserId: item.groceryPickerSession?.pickerUserId ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
      issues: issues.map((item) => ({
        id: item.id,
        type: item.type,
        status: item.status,
        details: item.details,
        requestedAmountMinor:
          item.requestedAmountMinor == null
            ? null
            : safeMinor(item.requestedAmountMinor),
        approvedAmountMinor:
          item.approvedAmountMinor == null
            ? null
            : safeMinor(item.approvedAmountMinor),
        orderNumber: item.order.orderNumber,
        orderStatus: item.order.status,
        currency: item.order.currency,
        business:
          item.merchant?.organization.displayName ?? "Unknown business",
        customer:
          item.user.displayName ??
          item.user.emails.find((email) => email.isPrimary)?.email ??
          item.user.emails[0]?.email ??
          item.user.id,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  });

  app.patch(
    "/v1/operations/grocery/stores/:storeId/status",
    async (request) => {
      const auth = await requirePermission(request, "merchant.manage");

      const { storeId } = z
        .object({ storeId: z.string().min(1) })
        .parse(request.params);

      const input = z
        .object({
          status: z.enum(["ACTIVE", "PAUSED", "SUSPENDED"]),
        })
        .parse(request.body);

      const current = await db.store.findUnique({ where: { id: storeId } });
      if (!current) throw new AppError("NOT_FOUND", "Grocery store not found", 404);
      if (current.status === input.status) {
        await audit({ actorUserId: auth.userId, action: "operations.grocery.store-status.noop", resourceType: "Store", resourceId: current.id, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: "ALREADY_DONE" } });
        return { store: current, actionState: "ALREADY_DONE" };
      }

      const store = await db.store.update({
        where: { id: storeId },
        data: { status: input.status },
      });

      await audit({
        actorUserId: auth.userId,
        action: "operations.grocery.store-status.changed",
        resourceType: "Store",
        resourceId: store.id,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: { status: input.status, actionState: "COMPLETED" },
      });

      return { store, actionState: "COMPLETED" };
    },
  );

  app.patch(
    "/v1/operations/grocery/issues/:issueId/status",
    async (request) => {
      const auth = await requirePermission(request, "support.manage");

      const { issueId } = z
        .object({ issueId: z.string().min(1) })
        .parse(request.params);

      const input = z
        .object({
          status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "CLOSED"]),
        })
        .parse(request.body);

      const current = await db.groceryIssue.findUnique({ where: { id: issueId } });
      if (!current) throw new AppError("NOT_FOUND", "Grocery issue not found", 404);
      if (current.status === input.status) {
        await audit({ actorUserId: auth.userId, action: "operations.grocery.issue-status.noop", resourceType: "GroceryIssue", resourceId: current.id, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: "ALREADY_DONE" } });
        return { issue: current, actionState: "ALREADY_DONE" };
      }

      const issue = await db.groceryIssue.update({
        where: { id: issueId },
        data: { status: input.status },
      });

      await audit({
        actorUserId: auth.userId,
        action: "operations.grocery.issue-status.changed",
        resourceType: "GroceryIssue",
        resourceId: issue.id,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: { status: input.status, actionState: "COMPLETED" },
      });

      return { issue, actionState: "COMPLETED" };
    },
  );

  app.get("/v1/operations/mobility", async (request) => {
    await requirePermission(request, "order.read");

    const [rides, drivers, bookings] = await Promise.all([
      db.driveRide.findMany({
        include: {
          quote: {
            select: {
              rideClass: true,
              distanceMeters: true,
              durationSeconds: true,
              totalMinor: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      db.driveDriverProfile.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
        select: {
          userId: true,
          approvalStatus: true,
          availability: true,
          serviceClasses: true,
          ratingAverage: true,
          ratingCount: true,
          currentLatitude: true,
          currentLongitude: true,
          lastLocationAt: true,
          platformDebtMinor: true,
        },
      }),
      db.logisticsBooking.findMany({
        include: {
          quote: {
            select: {
              serviceLevel: true,
              distanceMeters: true,
              etaMinutes: true,
              amountMinor: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ]);

    const activeRides = rides.filter(
      (ride) => !["COMPLETED", "CANCELLED"].includes(ride.status),
    );

    const activeBookings = bookings.filter(
      (booking) =>
        booking.completedAt == null &&
        !["CANCELLED", "DELIVERED", "COMPLETED"].includes(booking.status),
    );

    return {
      generatedAt: new Date().toISOString(),
      kpis: {
        activeRides: activeRides.length,
        onlineDrivers: drivers.filter(
          (driver) => driver.availability === "ONLINE",
        ).length,
        pendingDrivers: drivers.filter(
          (driver) => driver.approvalStatus === "PENDING",
        ).length,
        activeDeliveries: activeBookings.length,
        unassignedDeliveries: activeBookings.filter(
          (booking) => !booking.assignedCourierUserId,
        ).length,
      },
      rides: rides.map((ride) => ({
        id: ride.id,
        status: ride.status,
        driverUserId: ride.driverUserId,
        fareFundingStatus: ride.fareFundingStatus,
        rideClass: ride.quote.rideClass,
        distanceMeters: ride.quote.distanceMeters,
        durationSeconds: ride.quote.durationSeconds,
        totalMinor: safeMinor(ride.quote.totalMinor),
        currency: ride.quote.currency,
        createdAt: ride.createdAt.toISOString(),
      })),
      drivers: drivers.map((driver) => ({
        ...driver,
        ratingAverage:
          driver.ratingAverage == null
            ? null
            : Number(driver.ratingAverage),
        platformDebtMinor: safeMinor(driver.platformDebtMinor),
        lastLocationAt: iso(driver.lastLocationAt),
      })),
      deliveries: bookings.map((booking) => ({
        id: booking.id,
        publicCode: booking.publicCode,
        trackingCode: booking.trackingCode,
        status: booking.status,
        assignedCourierUserId: booking.assignedCourierUserId,
        scheduledFor: iso(booking.scheduledFor),
        serviceLevel: booking.quote.serviceLevel,
        distanceMeters: booking.quote.distanceMeters,
        etaMinutes: booking.quote.etaMinutes,
        amountMinor: safeMinor(booking.quote.amountMinor),
        currency: booking.quote.currency,
        fundingStatus: booking.fundingStatus,
        amountPaidMinor: safeMinor(booking.amountPaidMinor),
        platformFeeBps: booking.platformFeeBps,
        platformFeeMinor: safeMinor(booking.platformFeeMinor),
        courierPayoutMinor: safeMinor(booking.courierPayoutMinor),
        attemptCount: booking.attemptCount,
        lastCourierLocation: booking.lastCourierLocation,
        createdAt: booking.createdAt.toISOString(),
        completedAt: iso(booking.completedAt),
      })),
    };
  });

  app.get("/v1/operations/businesses", async (request) => {
    await requirePermission(request, "merchant.read");

    const query = z
      .object({
        q: z.string().trim().max(120).optional(),
        status: z.string().trim().max(40).optional(),
      })
      .parse(request.query);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              {
                displayName: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                legalName: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                businessNumber: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const organizations = await db.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        businessNumber: true,
        displayName: true,
        legalName: true,
        legalType: true,
        status: true,
        country: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        merchants: {
          select: {
            id: true,
            vertical: true,
            slug: true,
            verifiedAt: true,
          },
        },
        members: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    const items = [];

    for (const organization of organizations) {
      const [verification, verticals, pay, pendingSettlements] =
        await Promise.all([
          db.businessVerification.findUnique({
            where: { organizationId: organization.id },
            select: {
              status: true,
              legalType: true,
              registrationNumber: true,
              submittedAt: true,
              verifiedAt: true,
            },
          }),
          db.businessVerticalRegistration.findMany({
            where: { organizationId: organization.id },
            select: {
              vertical: true,
              status: true,
              submittedAt: true,
              activatedAt: true,
            },
          }),
          getOrganizationPaySummary(organization.id),
          db.businessSettlement.aggregate({
            where: {
              organizationId: organization.id,
              status: { not: "SETTLED" },
            },
            _sum: { netMinor: true },
            _count: { _all: true },
          }),
        ]);

      items.push({
        ...organization,
        createdAt: organization.createdAt.toISOString(),
        memberCount: organization.members.length,
        verification,
        verticalRegistrations: verticals,
        pay: {
          linked: pay.linked,
          walletId: pay.wallet?.id ?? null,
          availableMinor: pay.availableMinor,
          currency: pay.currency,
        },
        pendingSettlements: {
          count: pendingSettlements._count._all,
          netMinor: safeMinor(pendingSettlements._sum.netMinor),
        },
      });
    }

    return { organizations: items };
  });

  app.patch(
    "/v1/operations/businesses/:organizationId/verification",
    async (request) => {
      const auth = await requirePermission(request, "merchant.manage");

      const { organizationId } = z
        .object({ organizationId: z.string().min(1) })
        .parse(request.params);

      const input = z
        .object({
          status: z.enum([
            "DOCUMENTS_REQUIRED",
            "UNDER_REVIEW",
            "VERIFIED",
            "CHANGES_REQUIRED",
            "REJECTED",
          ]),
        })
        .parse(request.body);

      const currentVerification = await db.businessVerification.findUnique({ where: { organizationId } });
      if (currentVerification?.status === input.status) {
        await audit({ actorUserId: auth.userId, action: "operations.business.verification.noop", resourceType: "Organization", resourceId: organizationId, requestId: request.id, ipAddress: request.ip, metadata: { status: input.status, actionState: "ALREADY_DONE" } });
        return { verification: currentVerification, actionState: "ALREADY_DONE" };
      }

      const verification = await db.businessVerification.upsert({
        where: { organizationId },
        create: {
          organizationId,
          status: input.status,
          legalType: "INDIVIDUAL",
          verifiedAt: input.status === "VERIFIED" ? new Date() : null,
          changesRequestedAt:
            input.status === "CHANGES_REQUIRED" ? new Date() : null,
        },
        update: {
          status: input.status,
          verifiedAt:
            input.status === "VERIFIED" ? new Date() : undefined,
          changesRequestedAt:
            input.status === "CHANGES_REQUIRED" ? new Date() : undefined,
        },
      });

      if (input.status === "VERIFIED") {
        await db.organization.update({
          where: { id: organizationId },
          data: { status: "ACTIVE" },
        });
      }

      await audit({
        actorUserId: auth.userId,
        action: "operations.business.verification.changed",
        resourceType: "Organization",
        resourceId: organizationId,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: { status: input.status, actionState: "COMPLETED" },
      });

      return { verification, actionState: "COMPLETED" };
    },
  );

  app.patch(
    "/v1/operations/businesses/:organizationId/verticals/:vertical/status",
    async (request) => {
      const auth = await requirePermission(request, "merchant.manage");

      const { organizationId, vertical } = z
        .object({
          organizationId: z.string().min(1),
          vertical: z.enum(["SHOPPING", "FOOD", "GROCERY", "PHARMACY"]),
        })
        .parse(request.params);

      const input = z
        .object({
          status: z.enum([
            "SETUP",
            "UNDER_REVIEW",
            "ACTIVE",
            "CHANGES_REQUIRED",
            "SUSPENDED",
            "CLOSED",
          ]),
        })
        .parse(request.body);

      const existing = await db.businessVerticalRegistration.findUnique({
        where: {
          organizationId_vertical: {
            organizationId,
            vertical,
          },
        },
      });

      if (!existing) {
        throw new AppError(
          "NOT_FOUND",
          "Business vertical registration not found",
          404,
        );
      }

      if (existing.status === input.status) {
        await audit({ actorUserId: auth.userId, action: "operations.business.vertical-status.noop", resourceType: "BusinessVerticalRegistration", resourceId: existing.id, requestId: request.id, ipAddress: request.ip, metadata: { organizationId, vertical, status: input.status, actionState: "ALREADY_DONE" } });
        return { registration: existing, actionState: "ALREADY_DONE" };
      }

      const registration = await db.businessVerticalRegistration.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          activatedAt:
            input.status === "ACTIVE"
              ? existing.activatedAt ?? new Date()
              : existing.activatedAt,
          closedAt:
            input.status === "CLOSED"
              ? existing.closedAt ?? new Date()
              : existing.closedAt,
        },
      });

      if (input.status === "ACTIVE") {
        await db.merchant.updateMany({
          where: {
            organizationId,
            vertical,
          },
          data: {
            verifiedAt: new Date(),
          },
        });
      }

      await audit({
        actorUserId: auth.userId,
        action: "operations.business.vertical-status.changed",
        resourceType: "BusinessVerticalRegistration",
        resourceId: registration.id,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: {
          organizationId,
          vertical,
          status: input.status,
          actionState: "COMPLETED",
        },
      });

      return { registration, actionState: "COMPLETED" };
    },
  );

  app.get("/v1/operations/pay", async (request) => {
    await requirePermission(request, "payment.read");

    const [funding, withdrawals, settlements, loans, driveFinance] = await Promise.all([
      db.payFundingIntent.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      db.payWithdrawal.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      db.businessSettlement.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.payLoanApplication.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      getDriveFinanceSnapshot(),
    ]);

    const organizationIds = [
      ...new Set(settlements.map((item) => item.organizationId)),
    ];

    const organizations = await db.organization.findMany({
      where: { id: { in: organizationIds } },
      select: {
        id: true,
        businessNumber: true,
        displayName: true,
      },
    });

    const organizationMap = new Map(
      organizations.map((organization) => [
        organization.id,
        organization,
      ]),
    );

    return {
      funding: funding.map((item) => ({
        id: item.id,
        userId: item.userId,
        provider: item.provider,
        amountMinor: safeMinor(item.amountMinor),
        currency: item.currency,
        status: item.status,
        paymentMethod: item.paymentMethod,
        providerReference: item.providerReference,
        createdAt: item.createdAt.toISOString(),
      })),
      withdrawals: withdrawals.map((item) => ({
        id: item.id,
        userId: item.userId,
        amountMinor: safeMinor(item.amountMinor),
        currency: item.currency,
        status: item.status,
        provider: item.provider,
        providerReference: item.providerReference,
        createdAt: item.createdAt.toISOString(),
      })),
      settlements: settlements.map((item) => ({
        id: item.id,
        organizationId: item.organizationId,
        organization:
          organizationMap.get(item.organizationId) ?? null,
        reference: item.reference,
        grossMinor: safeMinor(item.grossMinor),
        feeMinor: safeMinor(item.feeMinor),
        netMinor: safeMinor(item.netMinor),
        currency: item.currency,
        status: item.status,
        provider: item.provider,
        providerRef: item.providerRef,
        createdAt: item.createdAt.toISOString(),
        settledAt: item.settledAt?.toISOString() ?? null,
      })),
      driveFinance,
      loans: loans.map((item) => ({
        id: item.id,
        userId: item.userId,
        requestedMinor: safeMinor(item.requestedMinor),
        currency: item.currency,
        termDays: item.termDays,
        purpose: item.purpose,
        status: item.status,
        lenderName: item.lenderName,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  });

  app.get("/v1/operations/pay/ledger-transactions/:transactionId", async (request) => {
    await requirePermission(request, "payment.read");
    const { transactionId } = z.object({ transactionId: z.string().min(1) }).parse(request.params);
    const transaction = await db.ledgerTransaction.findUnique({
      where: { id: transactionId },
      include: {
        entries: {
          orderBy: { createdAt: "asc" },
          include: { account: { select: { id: true, code: true, kind: true, wallet: { select: { id: true, ownerKey: true, userId: true, organizationId: true } } } } },
        },
      },
    });
    if (!transaction) throw new AppError("NOT_FOUND", "Ledger transaction not found", 404);
    return {
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        kind: transaction.kind,
        currency: transaction.currency,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString(),
        entries: transaction.entries.map((entry) => ({
          id: entry.id,
          direction: entry.direction,
          amountMinor: safeMinor(entry.amountMinor),
          createdAt: entry.createdAt.toISOString(),
          account: {
            id: entry.account.id,
            code: entry.account.code,
            kind: entry.account.kind,
            wallet: entry.account.wallet,
          },
        })),
      },
    };
  });

  app.post(
    "/v1/operations/business-settlements/:settlementId/settle-to-pay",
    async (request) => {
      const auth = await requirePermission(request, "payout.manage");

      const { settlementId } = z
        .object({ settlementId: z.string().min(1) })
        .parse(request.params);

      const result = await settleBusinessSettlementToPay(
        settlementId,
      );

      await audit({
        actorUserId: auth.userId,
        action: "operations.business-settlement.settled-to-pay",
        resourceType: "BusinessSettlement",
        resourceId: settlementId,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: {
          replayed: result.replayed,
          provider: "BAZAARA_PAY",
        },
      });

      return result;
    },
  );


  app.post("/v1/operations/logistics/:bookingId/requeue", async (request) => {
    const auth = await requirePermission(request, "operations.mobility.manage");
    const { bookingId } = z.object({ bookingId: z.string().min(1) }).parse(request.params);

    const existing = await db.logisticsBooking.findUnique({ where: { id: bookingId } });
    if (!existing) throw new AppError("NOT_FOUND", "Logistics booking not found", 404);
    if (existing.status === "CONFIRMED" && !existing.assignedCourierUserId) {
      await audit({
        actorUserId: auth.userId,
        action: "operations.logistics.requeue.noop",
        resourceType: "LogisticsBooking",
        resourceId: bookingId,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: { actionState: "ALREADY_DONE" },
      });
      return { booking: existing, actionState: "ALREADY_DONE" as const };
    }
    if (existing.status !== "ASSIGNED") {
      throw new AppError("CONFLICT", "Only an assigned, not-yet-picked-up parcel can be requeued", 409);
    }

    const updated = await db.$transaction(async (tx) => {
      const booking = await tx.logisticsBooking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          assignedCourierUserId: null,
          acceptedAt: null,
        },
      });
      await tx.logisticsBookingEvent.create({
        data: {
          bookingId,
          type: "OPERATIONS_REQUEUED",
          payload: { actorUserId: auth.userId },
        },
      });
      return booking;
    });

    await audit({
      actorUserId: auth.userId,
      action: "operations.logistics.requeued",
      resourceType: "LogisticsBooking",
      resourceId: bookingId,
      requestId: request.id,
      ipAddress: request.ip,
    });

    return { booking: updated, actionState: "COMPLETED" as const };
  });

  app.post("/v1/operations/logistics/:bookingId/support-case", async (request, reply) => {
    const auth = await requirePermission(request, "operations.mobility.manage");
    const { bookingId } = z.object({ bookingId: z.string().min(1) }).parse(request.params);
    const input = z.object({
      subject: z.string().trim().min(3).max(160),
      message: z.string().trim().min(3).max(4000),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("HIGH"),
    }).parse(request.body);

    const booking = await db.logisticsBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        publicCode: true,
        trackingCode: true,
        status: true,
        fundingStatus: true,
      },
    });

    if (!booking) throw new AppError("NOT_FOUND", "Logistics booking not found", 404);

    const candidateCases = await db.supportCase.findMany({
      where: {
        userId: booking.userId,
        category: "LOGISTICS",
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const existingCase = candidateCases.find((item) => {
      const context = item.context && typeof item.context === "object" && !Array.isArray(item.context)
        ? item.context as Record<string, unknown>
        : null;
      return context?.bookingId === booking.id;
    });
    if (existingCase) {
      await audit({
        actorUserId: auth.userId,
        action: "operations.logistics.support-case.noop",
        resourceType: "SupportCase",
        resourceId: existingCase.id,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: { bookingId, actionState: "ALREADY_DONE" },
      });
      return reply.code(200).send({ case: existingCase, actionState: "ALREADY_DONE" });
    }

    const supportCase = await db.supportCase.create({
      data: {
        userId: booking.userId,
        channel: "OPERATIONS",
        category: "LOGISTICS",
        subject: input.subject,
        description: input.message,
        status: "WAITING_CUSTOMER",
        priority: input.priority,
        assignedToUserId: auth.userId,
        slaDueAt: new Date(Date.now() + (input.priority === "URGENT" ? 60 : 240) * 60_000),
        context: {
          bookingId: booking.id,
          publicCode: booking.publicCode,
          trackingCode: booking.trackingCode,
          bookingStatus: booking.status,
          fundingStatus: booking.fundingStatus,
        },
        messages: {
          create: {
            authorUserId: auth.userId,
            kind: "STAFF",
            body: input.message,
          },
        },
      },
    });

    await audit({
      actorUserId: auth.userId,
      action: "operations.logistics.support-case.created",
      resourceType: "SupportCase",
      resourceId: supportCase.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { bookingId },
    });

    return reply.code(201).send({ case: supportCase, actionState: "COMPLETED" });
  });

  app.get("/v1/operations/access", async (request) => {
    await requirePermission(request, "operations.roles.manage");

    const [roles, assignments] = await Promise.all([
      db.role.findMany({
        where: { key: { startsWith: "platform.operations." } },
        orderBy: { name: "asc" },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      }),
      db.userRole.findMany({
        where: {
          scopeKey: "platform",
          role: { key: { startsWith: "platform.operations." } },
        },
        orderBy: { createdAt: "asc" },
        include: {
          role: true,
          user: {
            select: {
              id: true,
              displayName: true,
              status: true,
              emails: {
                where: { isPrimary: true },
                take: 1,
                select: { email: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((item) => item.permission.key).sort(),
      })),
      employees: [...new Map(assignments.map((assignment) => [
        assignment.userId,
        {
          userId: assignment.user.id,
          displayName: assignment.user.displayName,
          email: assignment.user.emails[0]?.email ?? null,
          status: assignment.user.status,
          roles: assignments
            .filter((item) => item.userId === assignment.userId)
            .map((item) => ({
              assignmentId: item.id,
              roleId: item.roleId,
              roleKey: item.role.key,
              roleName: item.role.name,
              createdAt: item.createdAt.toISOString(),
            })),
        },
      ])).values()],
    };
  });

  app.post("/v1/operations/access/:userId/roles", async (request, reply) => {
    const auth = await requirePermission(request, "operations.roles.manage");
    const { userId } = z.object({ userId: z.string().min(1) }).parse(request.params);
    const input = z.object({
      roleKey: z.string().startsWith("platform.operations."),
    }).parse(request.body);

    const [user, role] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { id: true, status: true } }),
      db.role.findUnique({ where: { key: input.roleKey } }),
    ]);

    if (!user || user.status !== "ACTIVE") {
      throw new AppError("NOT_FOUND", "Active BazID employee not found", 404);
    }
    if (!role) {
      throw new AppError("NOT_FOUND", "Operations role not found", 404);
    }

    const currentAssignment = await db.userRole.findUnique({
      where: {
        userId_roleId_scopeKey: {
          userId,
          roleId: role.id,
          scopeKey: "platform",
        },
      },
    });
    if (currentAssignment) {
      await audit({
        actorUserId: auth.userId,
        action: "operations.role.grant.noop",
        resourceType: "UserRole",
        resourceId: currentAssignment.id,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: { userId, roleKey: input.roleKey, actionState: "ALREADY_DONE" },
      });
      return reply.code(200).send({ assignment: currentAssignment, actionState: "ALREADY_DONE" });
    }

    const assignment = await db.userRole.create({
      data: {
        userId,
        roleId: role.id,
        organizationId: null,
        scopeKey: "platform",
      },
    });

    await audit({
      actorUserId: auth.userId,
      action: "operations.role.granted",
      resourceType: "UserRole",
      resourceId: assignment.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { userId, roleKey: input.roleKey, actionState: "COMPLETED" },
    });

    return reply.code(201).send({ assignment, actionState: "COMPLETED" });
  });

  app.delete("/v1/operations/access/:userId/roles/:roleKey", async (request) => {
    const auth = await requirePermission(request, "operations.roles.manage");
    const { userId, roleKey } = z.object({
      userId: z.string().min(1),
      roleKey: z.string().startsWith("platform.operations."),
    }).parse(request.params);

    if (userId === auth.userId && roleKey === "platform.operations.admin") {
      throw new AppError("CONFLICT", "You cannot remove your own Super Admin role from this screen", 409);
    }

    const role = await db.role.findUnique({ where: { key: roleKey } });
    if (!role) throw new AppError("NOT_FOUND", "Operations role not found", 404);

    const assignment = await db.userRole.findUnique({
      where: {
        userId_roleId_scopeKey: {
          userId,
          roleId: role.id,
          scopeKey: "platform",
        },
      },
    });

    if (!assignment) {
      await audit({
        actorUserId: auth.userId,
        action: "operations.role.revoke.noop",
        resourceType: "UserRole",
        resourceId: `${userId}:${roleKey}`,
        requestId: request.id,
        ipAddress: request.ip,
        metadata: { userId, roleKey, actionState: "ALREADY_DONE" },
      });
      return { removed: false, actionState: "ALREADY_DONE" as const };
    }

    await db.userRole.delete({ where: { id: assignment.id } });

    await audit({
      actorUserId: auth.userId,
      action: "operations.role.revoked",
      resourceType: "UserRole",
      resourceId: assignment.id,
      requestId: request.id,
      ipAddress: request.ip,
      metadata: { userId, roleKey, actionState: "COMPLETED" },
    });

    return { removed: true, actionState: "COMPLETED" as const };
  });

}
