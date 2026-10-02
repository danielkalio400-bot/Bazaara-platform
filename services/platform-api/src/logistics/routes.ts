import { randomBytes, randomInt } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, Prisma } from "@bazaara/db";
import { postJournal } from "@bazaara/ledger";
import { constantTimeStringEqual, sha256Base64Url } from "@bazaara/security";
import type {
  LogisticsBookingContract,
  LogisticsBookingResponseContract,
  LogisticsQuoteContract,
} from "@bazaara/contracts";
import type { FastifyRequest } from "fastify";
import { requireAuth, requireNativeScope, resolveAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { env } from "../config.js";
import { AppError } from "../errors.js";
import { withIdempotency } from "../idempotency.js";
import { appendOutboxEvent } from "../outbox.js";
import { verifyPayPin } from "../pay/service.js";

const locationSchema = z.object({
  label: z.string().trim().min(2).max(240),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const quoteSchema = z.object({
  pickup: locationSchema,
  dropoff: locationSchema,
  serviceLevel: z.enum(["BIKE", "CAR", "VAN"]),
  weightGrams: z.number().int().min(1).max(500_000),
  distanceMeters: z.number().int().min(100).max(500_000),
});

const bookingSchema = z.object({
  quoteId: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
  payPin: z.string().regex(/^\d{6}$/),
});

const statusSchema = z.object({
  status: z.enum([
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED",
    "RETURNING",
    "RETURNED",
    "CANCELLED",
  ]),
  verificationCode: z.string().regex(/^\d{6}$/).optional(),
  proof: z.unknown().optional(),
  reason: z.string().trim().min(2).max(600).optional(),
});

const courierLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  accuracyMeters: z.number().min(0).max(10_000).optional(),
});

const courierOfferQuery = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});


async function requireGoCourierAccess(request: FastifyRequest) {
  const auth = await requireAuth(request);
  if (auth.channel === "NATIVE") {
    requireNativeScope(auth, "logistics.courier");
    return auth;
  }
  await requirePermission(request, "courier.manage");
  return auth;
}

const allowedTransitions: Record<string, readonly string[]> = {
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "FAILED", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "RETURNING"],
  IN_TRANSIT: ["DELIVERED", "FAILED", "RETURNING"],
  FAILED: ["RETURNING", "CANCELLED"],
  RETURNING: ["RETURNED"],
  RETURNED: [],
  DELIVERED: [],
  CANCELLED: [],
};

function safeMinor(value: bigint | null | undefined) {
  const n = Number(value ?? 0n);
  if (!Number.isSafeInteger(n)) {
    throw new Error("Monetary value exceeds transport range");
  }
  return n;
}

function publicCode(prefix: string) {
  return `${prefix}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

function verificationCode() {
  return randomInt(100000, 1_000_000).toString();
}

function quoteContract(q: {
  id: string;
  serviceLevel: string;
  etaMinutes: number;
  amountMinor: bigint;
  currency: string;
  expiresAt: Date;
}): LogisticsQuoteContract {
  return {
    id: q.id,
    serviceLevel: q.serviceLevel as LogisticsQuoteContract["serviceLevel"],
    etaMinutes: q.etaMinutes,
    amountMinor: safeMinor(q.amountMinor),
    currency: q.currency,
    expiresAt: q.expiresAt.toISOString(),
  };
}

function bookingContract(b: any): LogisticsBookingContract {
  return {
    id: b.id,
    publicCode: b.publicCode,
    trackingCode: b.trackingCode,
    quoteId: b.quoteId,
    status: b.status as LogisticsBookingContract["status"],
    scheduledFor: b.scheduledFor?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    fundingStatus: b.fundingStatus,
    amountPaidMinor: safeMinor(b.amountPaidMinor),
    platformFeeBps: b.platformFeeBps,
    platformFeeMinor: safeMinor(b.platformFeeMinor),
    courierPayoutMinor: safeMinor(b.courierPayoutMinor),
    assignedCourierUserId: b.assignedCourierUserId ?? null,
    acceptedAt: b.acceptedAt?.toISOString() ?? null,
    pickedUpAt: b.pickedUpAt?.toISOString() ?? null,
    inTransitAt: b.inTransitAt?.toISOString() ?? null,
    deliveredAt: b.deliveredAt?.toISOString() ?? null,
    returnedAt: b.returnedAt?.toISOString() ?? null,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
  };
}

function calculateQuote(
  serviceLevel: "BIKE" | "CAR" | "VAN",
  distanceMeters: number,
  weightGrams: number,
) {
  const km = distanceMeters / 1000;
  const kg = weightGrams / 1000;
  const table = {
    BIKE: {
      base: 100_000,
      perKm: 9_000,
      perKg: 20_000,
      speedKmh: 18,
      handling: 12,
    },
    CAR: {
      base: 150_000,
      perKm: 12_000,
      perKg: 10_000,
      speedKmh: 25,
      handling: 15,
    },
    VAN: {
      base: 300_000,
      perKm: 22_000,
      perKg: 8_000,
      speedKmh: 22,
      handling: 20,
    },
  }[serviceLevel];

  const amountMinor = Math.max(
    table.base,
    Math.round(table.base + km * table.perKm + kg * table.perKg),
  );
  const etaMinutes = Math.max(
    10,
    Math.ceil((km / table.speedKmh) * 60 + table.handling),
  );

  return { amountMinor: BigInt(amountMinor), etaMinutes };
}

function assertTransition(current: string, next: string) {
  if (!(allowedTransitions[current] ?? []).includes(next)) {
    throw new AppError(
      "CONFLICT",
      `Cannot transition logistics booking from ${current} to ${next}`,
      409,
    );
  }
}

function assertVerificationCode(
  inputCode: string | undefined,
  expectedHash: string,
  label: string,
) {
  if (
    !inputCode ||
    !constantTimeStringEqual(sha256Base64Url(inputCode), expectedHash)
  ) {
    throw new AppError(
      "FORBIDDEN",
      `${label} verification code is invalid`,
      403,
    );
  }
}

async function ledgerBalanceMinor(
  tx: Prisma.TransactionClient,
  accountId: string,
) {
  const grouped = await tx.ledgerEntry.groupBy({
    by: ["direction"],
    where: { accountId },
    _sum: { amountMinor: true },
  });

  let credit = 0n;
  let debit = 0n;

  for (const row of grouped) {
    if (row.direction === "CREDIT") {
      credit = row._sum.amountMinor ?? 0n;
    } else {
      debit = row._sum.amountMinor ?? 0n;
    }
  }

  return credit - debit;
}

async function ensureWalletAccount(
  tx: Prisma.TransactionClient,
  userId: string,
  currency: string,
) {
  const ownerKey = `user:${userId}`;
  const wallet = await tx.wallet.upsert({
    where: { ownerKey_currency: { ownerKey, currency } },
    create: { userId, ownerKey, currency },
    update: {},
  });

  let account = await tx.ledgerAccount.findFirst({
    where: {
      walletId: wallet.id,
      currency,
      kind: "WALLET_LIABILITY",
    },
  });

  if (!account) {
    account = await tx.ledgerAccount.create({
      data: {
        walletId: wallet.id,
        code: `wallet:${wallet.id}:${currency}`,
        currency,
        kind: "WALLET_LIABILITY",
      },
    });
  }

  return { wallet, account };
}

async function ensurePlatformFeeAccount(
  tx: Prisma.TransactionClient,
  currency: string,
) {
  const code = `bazaara:go:parcel-fee-revenue:${currency}`;
  return (
    (await tx.ledgerAccount.findUnique({ where: { code } })) ??
    (await tx.ledgerAccount.create({
      data: {
        code,
        currency,
        kind: "PLATFORM_FEE_REVENUE",
      },
    }))
  );
}

function economics(amountMinor: bigint) {
  const fee =
    (amountMinor * BigInt(env.GO_PARCEL_COMMISSION_BPS) + 9999n) / 10000n;
  return {
    platformFeeBps: env.GO_PARCEL_COMMISSION_BPS,
    platformFeeMinor: fee,
    courierPayoutMinor: amountMinor - fee,
  };
}

async function fundBooking(
  tx: Prisma.TransactionClient,
  bookingId: string,
  userId: string,
  currency: string,
  amountMinor: bigint,
) {
  const { account } = await ensureWalletAccount(tx, userId, currency);
  const available = await ledgerBalanceMinor(tx, account.id);

  if (available < amountMinor) {
    throw new AppError(
      "CONFLICT",
      "Insufficient Wallet balance. Add money to Pay before confirming this delivery.",
      409,
    );
  }

  const escrow = await tx.ledgerAccount.create({
    data: {
      code: `logistics:escrow:${bookingId}:${currency}`,
      currency,
      kind: "LOGISTICS_ESCROW_LIABILITY",
    },
  });

  const journal = await postJournal(tx, {
    reference: `logistics-fund:${bookingId}`,
    kind: "LOGISTICS_ADVANCE_FUNDING",
    currency,
    description: `GO advance payment · ${bookingId}`,
    lines: [
      {
        accountId: account.id,
        direction: "DEBIT",
        amountMinor,
      },
      {
        accountId: escrow.id,
        direction: "CREDIT",
        amountMinor,
      },
    ],
  });

  const e = economics(amountMinor);

  await tx.logisticsBooking.update({
    where: { id: bookingId },
    data: {
      fundingStatus: "FUNDED",
      amountPaidMinor: amountMinor,
      platformFeeBps: e.platformFeeBps,
      platformFeeMinor: e.platformFeeMinor,
      courierPayoutMinor: e.courierPayoutMinor,
      escrowLedgerAccountId: escrow.id,
      fundingLedgerTransactionId: journal.id,
    },
  });
}

async function settleBooking(
  tx: Prisma.TransactionClient,
  booking: any,
) {
  if (booking.fundingStatus === "SETTLED") return;
  if (booking.fundingStatus !== "FUNDED" || !booking.escrowLedgerAccountId) {
    throw new AppError(
      "CONFLICT",
      "Delivery payment is not funded and cannot be settled",
      409,
    );
  }
  if (!booking.assignedCourierUserId) {
    throw new AppError("CONFLICT", "Delivery has no assigned courier", 409);
  }

  const courier = await ensureWalletAccount(
    tx,
    booking.assignedCourierUserId,
    booking.quote.currency,
  );
  const feeAccount = await ensurePlatformFeeAccount(
    tx,
    booking.quote.currency,
  );

  const journal = await postJournal(tx, {
    reference: `logistics-settle:${booking.id}`,
    kind: "LOGISTICS_DELIVERY_SETTLEMENT",
    currency: booking.quote.currency,
    description: `GO delivered · ${booking.publicCode}`,
    lines: [
      {
        accountId: booking.escrowLedgerAccountId,
        direction: "DEBIT",
        amountMinor: booking.amountPaidMinor,
      },
      {
        accountId: courier.account.id,
        direction: "CREDIT",
        amountMinor: booking.courierPayoutMinor,
      },
      {
        accountId: feeAccount.id,
        direction: "CREDIT",
        amountMinor: booking.platformFeeMinor,
      },
    ],
  });

  await tx.logisticsBooking.update({
    where: { id: booking.id },
    data: {
      fundingStatus: "SETTLED",
      settlementLedgerTransactionId: journal.id,
    },
  });
}

async function refundBooking(
  tx: Prisma.TransactionClient,
  booking: any,
) {
  if (booking.fundingStatus === "REFUNDED") return;
  if (booking.fundingStatus !== "FUNDED" || !booking.escrowLedgerAccountId) {
    return;
  }

  const customer = await ensureWalletAccount(
    tx,
    booking.userId,
    booking.quote.currency,
  );

  const journal = await postJournal(tx, {
    reference: `logistics-refund:${booking.id}`,
    kind: "LOGISTICS_ADVANCE_REFUND",
    currency: booking.quote.currency,
    description: `GO refund · ${booking.publicCode}`,
    lines: [
      {
        accountId: booking.escrowLedgerAccountId,
        direction: "DEBIT",
        amountMinor: booking.amountPaidMinor,
      },
      {
        accountId: customer.account.id,
        direction: "CREDIT",
        amountMinor: booking.amountPaidMinor,
      },
    ],
  });

  await tx.logisticsBooking.update({
    where: { id: booking.id },
    data: {
      fundingStatus: "REFUNDED",
      refundLedgerTransactionId: journal.id,
    },
  });
}

function pointFromJson(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const latitude = (value as Record<string, unknown>).latitude;
  const longitude = (value as Record<string, unknown>).longitude;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return { latitude, longitude };
}

function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const radius = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * radius * Math.asin(Math.sqrt(h));
}

function parcelOffer(row: any, current: { latitude: number; longitude: number } | null) {
  const pickup = pointFromJson(row.quote.pickup);
  const dropoff = pointFromJson(row.quote.dropoff);
  const pickupDistanceMeters =
    current && pickup ? Math.round(haversineMeters(current, pickup)) : null;

  return {
    id: row.id,
    publicCode: row.publicCode,
    trackingCode: row.trackingCode,
    status: row.status,
    scheduledFor: row.scheduledFor?.toISOString() ?? null,
    pickup: row.quote.pickup,
    dropoff: row.quote.dropoff,
    serviceLevel: row.quote.serviceLevel,
    weightGrams: row.quote.weightGrams,
    distanceMeters: row.quote.distanceMeters,
    etaMinutes: row.quote.etaMinutes,
    currency: row.quote.currency,
    amountMinor: safeMinor(row.quote.amountMinor),
    pickupDistanceMeters,
    economics: {
      grossMinor: safeMinor(row.amountPaidMinor),
      platformFeeBps: row.platformFeeBps,
      platformFeeMinor: safeMinor(row.platformFeeMinor),
      courierPayoutMinor: safeMinor(row.courierPayoutMinor),
    },
  };
}

export async function logisticsRoutes(app: FastifyInstance) {
  app.get("/v1/logistics/capabilities", async () => ({
    serviceLevels: ["BIKE", "CAR", "VAN"],
    quoteTtlSeconds: 600,
    bookingRequiresBazId: true,
    advancePaymentRequired: true,
    paymentRail: "BAZAARA_PAY",
    verification: ["PICKUP_CODE", "DELIVERY_CODE"],
    commissionBps: env.GO_PARCEL_COMMISSION_BPS,
    maxCourierPickupDistanceMeters:
      env.GO_MAX_PARCEL_PICKUP_DISTANCE_METERS,
    region: env.REGION,
    currency: env.CURRENCY,
  }));

  app.post("/v1/logistics/quotes", async (request, reply) => {
    const input = quoteSchema.parse(request.body);
    const auth = await resolveAuth(request);
    const calculated = calculateQuote(
      input.serviceLevel,
      input.distanceMeters,
      input.weightGrams,
    );

    const quote = await db.logisticsQuote.create({
      data: {
        userId: auth?.userId,
        pickup: input.pickup as Prisma.InputJsonValue,
        dropoff: input.dropoff as Prisma.InputJsonValue,
        serviceLevel: input.serviceLevel,
        weightGrams: input.weightGrams,
        distanceMeters: input.distanceMeters,
        etaMinutes: calculated.etaMinutes,
        amountMinor: calculated.amountMinor,
        currency: env.CURRENCY,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });

    return reply.code(201).send(quoteContract(quote));
  });

  app.post("/v1/logistics/bookings", async (request, reply) => {
    const auth = await requireAuth(request);
    const input = bookingSchema.parse(request.body);
    const key = request.headers["idempotency-key"]?.toString();

    if (!key) {
      throw new AppError(
        "BAD_REQUEST",
        "Idempotency-Key is required",
        400,
      );
    }

    await verifyPayPin(auth.userId, input.payPin);

    const result = await withIdempotency<LogisticsBookingResponseContract>({
      scope: "logistics.booking",
      key,
      actorId: auth.userId,
      requestPayload: {
        quoteId: input.quoteId,
        scheduledFor: input.scheduledFor,
      },
      execute: async () => {
        const quote = await db.logisticsQuote.findUnique({
          where: { id: input.quoteId },
        });

        if (!quote || quote.expiresAt <= new Date()) {
          throw new AppError(
            "CONFLICT",
            "Logistics quote is missing or expired",
            409,
          );
        }

        if (quote.userId && quote.userId !== auth.userId) {
          throw new AppError(
            "FORBIDDEN",
            "Quote belongs to another account",
            403,
          );
        }

        const pickupCode = verificationCode();
        const deliveryCode = verificationCode();

        const booking = await db.$transaction(
          async (tx) => {
            const created = await tx.logisticsBooking.create({
              data: {
                quoteId: quote.id,
                userId: auth.userId,
                publicCode: publicCode("BZL"),
                trackingCode: publicCode("TRK"),
                scheduledFor: input.scheduledFor
                  ? new Date(input.scheduledFor)
                  : null,
                pickupVerificationHash: sha256Base64Url(pickupCode),
                deliveryVerificationHash: sha256Base64Url(deliveryCode),
                events: {
                  create: {
                    type: "BOOKING_CONFIRMED",
                    payload: {
                      payment: "ADVANCE_REQUIRED",
                      amountMinor: safeMinor(quote.amountMinor),
                    },
                  },
                },
              },
            });

            await fundBooking(
              tx,
              created.id,
              auth.userId,
              quote.currency,
              quote.amountMinor,
            );

            await appendOutboxEvent(tx, {
              aggregateType: "LogisticsBooking",
              aggregateId: created.id,
              eventType: "logistics.booking.confirmed",
              payload: {
                bookingId: created.id,
                userId: auth.userId,
                fundingStatus: "FUNDED",
              },
            });

            return tx.logisticsBooking.findUniqueOrThrow({
              where: { id: created.id },
            });
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        return {
          statusCode: 201,
          body: {
            booking: bookingContract(booking),
            verification: { pickupCode, deliveryCode },
          },
        };
      },
    });

    return reply
      .code(result.statusCode)
      .header("x-idempotent-replay", String(result.replayed))
      .send(result.body);
  });

  app.get("/v1/logistics/bookings", async (request) => {
    const auth = await requireAuth(request);
    const rows = await db.logisticsBooking.findMany({
      where: { userId: auth.userId },
      include: {
        quote: true,
        events: {
          orderBy: { createdAt: "desc" },
          take: 4,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      bookings: rows.map((row) => ({
        booking: bookingContract(row),
        quote: quoteContract(row.quote),
        pickup: row.quote.pickup,
        dropoff: row.quote.dropoff,
        lastEvent: row.events[0]
          ? {
              type: row.events[0].type,
              createdAt: row.events[0].createdAt.toISOString(),
            }
          : null,
      })),
    };
  });

  app.get("/v1/logistics/bookings/:id", async (request) => {
    const auth = await requireAuth(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const booking = await db.logisticsBooking.findFirst({
      where: {
        id,
        OR: [
          { userId: auth.userId },
          { assignedCourierUserId: auth.userId },
        ],
      },
      include: {
        quote: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!booking) {
      throw new AppError("NOT_FOUND", "Booking not found", 404);
    }

    return {
      booking: bookingContract(booking),
      quote: quoteContract(booking.quote),
      pickup: booking.quote.pickup,
      dropoff: booking.quote.dropoff,
      lastCourierLocation: booking.lastCourierLocation,
      events: booking.events.map((event) => ({
        type: event.type,
        createdAt: event.createdAt.toISOString(),
        payload: event.payload,
      })),
    };
  });

  app.get("/v1/logistics/tracking/:trackingCode", async (request) => {
    const { trackingCode } = z
      .object({ trackingCode: z.string().min(4) })
      .parse(request.params);

    const booking = await db.logisticsBooking.findUnique({
      where: { trackingCode },
      include: {
        quote: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!booking) {
      throw new AppError(
        "NOT_FOUND",
        "Tracking code not found",
        404,
      );
    }

    return {
      trackingCode: booking.trackingCode,
      publicCode: booking.publicCode,
      status: booking.status,
      fundingStatus: booking.fundingStatus,
      updatedAt: booking.updatedAt.toISOString(),
      serviceLevel: booking.quote.serviceLevel,
      etaMinutes: booking.quote.etaMinutes,
      lastCourierLocation: booking.lastCourierLocation,
      events: booking.events.map((event) => ({
        type: event.type,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  });

  app.get("/v1/logistics/courier/offers", async (request) => {
    const auth = await requireGoCourierAccess(request);
    const query = courierOfferQuery.parse(request.query);
    const current =
      query.latitude == null || query.longitude == null
        ? null
        : {
            latitude: query.latitude,
            longitude: query.longitude,
          };

    const rows = await db.logisticsBooking.findMany({
      where: {
        status: "CONFIRMED",
        fundingStatus: "FUNDED",
        assignedCourierUserId: null,
        OR: [
          { scheduledFor: null },
          {
            scheduledFor: {
              lte: new Date(Date.now() + 45 * 60_000),
            },
          },
        ],
      },
      include: { quote: true },
      orderBy: [
        { scheduledFor: "asc" },
        { createdAt: "asc" },
      ],
      take: 120,
    });

    const offers = rows
      .map((row) => parcelOffer(row, current))
      .filter(
        (item) =>
          item.pickupDistanceMeters == null ||
          item.pickupDistanceMeters <=
            env.GO_MAX_PARCEL_PICKUP_DISTANCE_METERS,
      )
      .sort(
        (a, b) =>
          (a.pickupDistanceMeters ?? Number.MAX_SAFE_INTEGER) -
          (b.pickupDistanceMeters ?? Number.MAX_SAFE_INTEGER),
      )
      .slice(0, 40);

    return {
      offers,
      rules: {
        maxPickupDistanceMeters:
          env.GO_MAX_PARCEL_PICKUP_DISTANCE_METERS,
        commissionBps: env.GO_PARCEL_COMMISSION_BPS,
      },
    };
  });

  app.post(
    "/v1/logistics/courier/offers/:id/accept",
    async (request) => {
      const auth = await requireGoCourierAccess(request);
      const { id } = z
        .object({ id: z.string().min(1) })
        .parse(request.params);

      const accepted = await db.$transaction(async (tx) => {
        const changed = await tx.logisticsBooking.updateMany({
          where: {
            id,
            status: "CONFIRMED",
            fundingStatus: "FUNDED",
            assignedCourierUserId: null,
          },
          data: {
            status: "ASSIGNED",
            assignedCourierUserId: auth.userId,
            acceptedAt: new Date(),
          },
        });

        if (changed.count !== 1) {
          throw new AppError(
            "CONFLICT",
            "This delivery is no longer available",
            409,
          );
        }

        await tx.logisticsBookingEvent.create({
          data: {
            bookingId: id,
            type: "STATUS_ASSIGNED",
            payload: { courierUserId: auth.userId },
          },
        });

        await appendOutboxEvent(tx, {
          aggregateType: "LogisticsBooking",
          aggregateId: id,
          eventType: "logistics.booking.assigned",
          payload: {
            bookingId: id,
            courierUserId: auth.userId,
          },
        });

        return tx.logisticsBooking.findUniqueOrThrow({
          where: { id },
          include: { quote: true },
        });
      });

      return {
        booking: bookingContract(accepted),
        quote: quoteContract(accepted.quote),
      };
    },
  );

  app.get("/v1/logistics/courier/deliveries", async (request) => {
    const auth = await requireGoCourierAccess(request);

    const rows = await db.logisticsBooking.findMany({
      where: {
        assignedCourierUserId: auth.userId,
        status: {
          in: [
            "ASSIGNED",
            "PICKED_UP",
            "IN_TRANSIT",
            "FAILED",
            "RETURNING",
          ],
        },
      },
      include: { quote: true },
      orderBy: [{ acceptedAt: "asc" }, { createdAt: "asc" }],
      take: 25,
    });

    return {
      deliveries: rows.map((row) => parcelOffer(row, null)),
    };
  });

  app.get("/v1/logistics/courier/history", async (request) => {
    const auth = await requireGoCourierAccess(request);

    const rows = await db.logisticsBooking.findMany({
      where: { assignedCourierUserId: auth.userId },
      include: { quote: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const completed = rows.filter(
      (row) => row.status === "DELIVERED",
    );
    const today = completed.filter(
      (row) => (row.deliveredAt ?? row.updatedAt) >= start,
    );

    return {
      deliveries: rows.map((row) => parcelOffer(row, null)),
      summary: {
        deliveredCount: completed.length,
        todayDeliveredCount: today.length,
        todayPayoutMinor: today.reduce(
          (sum, row) => sum + safeMinor(row.courierPayoutMinor),
          0,
        ),
        recentPayoutMinor: completed.reduce(
          (sum, row) => sum + safeMinor(row.courierPayoutMinor),
          0,
        ),
      },
    };
  });

  app.post(
    "/v1/logistics/courier/bookings/:id/location",
    async (request, reply) => {
      const auth = await requireGoCourierAccess(request);
      const { id } = z
        .object({ id: z.string().min(1) })
        .parse(request.params);
      const input = courierLocationSchema.parse(request.body);

      const changed = await db.logisticsBooking.updateMany({
        where: {
          id,
          assignedCourierUserId: auth.userId,
          status: {
            in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "RETURNING"],
          },
        },
        data: {
          lastCourierLocation: input as Prisma.InputJsonValue,
        },
      });

      if (changed.count !== 1) {
        throw new AppError(
          "NOT_FOUND",
          "Active assigned delivery not found",
          404,
        );
      }

      return reply.code(201).send({ ok: true });
    },
  );

  app.patch("/v1/logistics/bookings/:id/status", async (request) => {
    const auth = await requireAuth(request);
    const { id } = z
      .object({ id: z.string() })
      .parse(request.params);
    const input = statusSchema.parse(request.body);

    const existing = await db.logisticsBooking.findUnique({
      where: { id },
      include: { quote: true },
    });

    if (!existing) {
      throw new AppError("NOT_FOUND", "Booking not found", 404);
    }

    assertTransition(existing.status, input.status);

    const isCustomerCancellation =
      input.status === "CANCELLED" &&
      existing.userId === auth.userId;

    if (!isCustomerCancellation) {
      if (auth.channel === "NATIVE") {
        requireNativeScope(auth, "logistics.courier");
      } else {
        await requirePermission(request, "courier.manage");
      }

      if (
        input.status !== "ASSIGNED" &&
        existing.assignedCourierUserId !== auth.userId
      ) {
        throw new AppError(
          "FORBIDDEN",
          "Only the assigned courier can update this booking",
          403,
        );
      }
    }

    if (input.status === "PICKED_UP") {
      assertVerificationCode(
        input.verificationCode,
        existing.pickupVerificationHash,
        "Pickup",
      );
    }

    if (input.status === "DELIVERED") {
      assertVerificationCode(
        input.verificationCode,
        existing.deliveryVerificationHash,
        "Delivery",
      );
    }

    const booking = await db.$transaction(
      async (tx) => {
        const now = new Date();
        const data: any = {
          status: input.status,
          proof:
            input.proof === undefined
              ? undefined
              : (input.proof as Prisma.InputJsonValue),
          completedAt:
            ["DELIVERED", "RETURNED", "CANCELLED"].includes(
              input.status,
            )
              ? now
              : undefined,
          cancelReason:
            input.status === "CANCELLED" ? input.reason ?? null : undefined,
          failedReason:
            input.status === "FAILED" ? input.reason ?? null : undefined,
          acceptedAt:
            input.status === "ASSIGNED"
              ? existing.acceptedAt ?? now
              : undefined,
          pickedUpAt:
            input.status === "PICKED_UP" ? now : undefined,
          inTransitAt:
            input.status === "IN_TRANSIT" ? now : undefined,
          deliveredAt:
            input.status === "DELIVERED" ? now : undefined,
          returnedAt:
            input.status === "RETURNED" ? now : undefined,
          cancelledAt:
            input.status === "CANCELLED" ? now : undefined,
          attemptCount:
            input.status === "FAILED"
              ? { increment: 1 }
              : undefined,
        };

        const changed = await tx.logisticsBooking.updateMany({
          where: {
            id,
            status: existing.status,
            ...(!isCustomerCancellation
              ? { assignedCourierUserId: auth.userId }
              : {}),
          },
          data,
        });

        if (changed.count !== 1) {
          throw new AppError(
            "CONFLICT",
            "Booking changed while this update was being processed",
            409,
          );
        }

        let updated = await tx.logisticsBooking.findUniqueOrThrow({
          where: { id },
          include: { quote: true },
        });

        if (input.status === "DELIVERED") {
          await settleBooking(tx, updated);
          updated = await tx.logisticsBooking.findUniqueOrThrow({
            where: { id },
            include: { quote: true },
          });
        }

        if (
          input.status === "CANCELLED" ||
          input.status === "RETURNED"
        ) {
          await refundBooking(tx, updated);
          updated = await tx.logisticsBooking.findUniqueOrThrow({
            where: { id },
            include: { quote: true },
          });
        }

        await tx.logisticsBookingEvent.create({
          data: {
            bookingId: id,
            type: `STATUS_${input.status}`,
            payload:
              input.proof === undefined && !input.reason
                ? undefined
                : ({
                    proof: input.proof,
                    reason: input.reason,
                  } as Prisma.InputJsonValue),
          },
        });

        await appendOutboxEvent(tx, {
          aggregateType: "LogisticsBooking",
          aggregateId: id,
          eventType: `logistics.booking.${input.status.toLowerCase()}`,
          payload: {
            bookingId: id,
            actorUserId: auth.userId,
            status: input.status,
            fundingStatus: updated.fundingStatus,
          },
        });

        return updated;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return { booking: bookingContract(booking) };
  });
}
