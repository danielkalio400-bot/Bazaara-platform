import type { DriveDriverPayoutContract } from "@bazaara/contracts";
import { db, Prisma } from "@bazaara/db";
import { postJournal } from "@bazaara/ledger";
import { env } from "../config.js";
import { AppError } from "../errors.js";
import { calculateFuelAdjustmentMinor, fuelPublicationStatus, DRIVE_FUEL_WEIGHT_BPS, DRIVE_MAX_FUEL_ADJUSTMENT_BPS, DRIVE_FUEL_MAX_AGE_DAYS } from "./fuel-policy.js";

export const DRIVE_PLATFORM_FEE_BPS = 1500;
export const DRIVE_DRIVER_CANCEL_FEE_BPS = 1000;
export const DRIVE_DROPOFF_VIOLATION_FEE_BPS = 2000;
export const DRIVE_DEFAULT_DROPOFF_GEOFENCE_METERS = 150;
export const DRIVE_CALL_UNLOCK_METERS = 1000;
export const DRIVE_CALL_UNLOCK_ETA_SECONDS = 180;
export const DRIVE_OFFER_TTL_SECONDS = 20;
export const DRIVE_DEFAULT_MAX_PICKUP_DISTANCE_METERS = 5000;
export const DRIVE_DEFAULT_MAX_PICKUP_ETA_SECONDS = 600;
export const DRIVE_INITIAL_SEARCH_RADIUS_METERS = 2000;
export const DRIVE_PRICING_RULE_VERSION = "drive-v12.0";

export type GeoPoint = { latitude: number; longitude: number };
export type DrivePriceInput = {
  rideClass: "GO" | "COMFORT" | "XL";
  distanceMeters: number;
  durationSeconds: number;
  fuelIndexBps: number;
  surgeBps?: number;
  tollsMinor?: number;
  feesMinor?: number;
  discountsMinor?: number;
};

const CLASS_PRICING = {
  GO: { base: 120_000, perKm: 55_000, perMinute: 4_000 },
  COMFORT: { base: 180_000, perKm: 75_000, perMinute: 5_500 },
  XL: { base: 260_000, perKm: 105_000, perMinute: 7_500 },
} as const;

export function safeMinor(value: bigint): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Monetary value exceeds transport range");
  return n;
}
export function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const r = 6_371_000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.min(1, Math.sqrt(h))));
}
export function estimatePickupEtaSeconds(distanceMeters: number): number {
  return Math.max(60, Math.round(distanceMeters / 6.1) + 45);
}

export function calculateDrivePrice(input: DrivePriceInput) {
  const cfg = CLASS_PRICING[input.rideClass];
  const baseFareMinor = cfg.base;
  const distanceFareMinor = Math.round((input.distanceMeters / 1000) * cfg.perKm);
  const timeFareMinor = Math.round((input.durationSeconds / 60) * cfg.perMinute);
  const subtotalMinor = baseFareMinor + distanceFareMinor + timeFareMinor;
  const fuelIndexBps = clampInt(input.fuelIndexBps, 5000, 30000);
  const surgeBps = clampInt(input.surgeBps ?? 10000, 8000, 30000);
  // Only the fuel-exposed portion changes, capped under BAZAARA pricing policy.
  // Confirmed quotes are snapshots and never change retroactively.
  const fuelAdjustmentMinor = calculateFuelAdjustmentMinor(subtotalMinor, fuelIndexBps);
  const demandAdjustmentMinor = Math.round((subtotalMinor * (surgeBps - 10000)) / 10000);
  const tollsMinor = Math.max(0, Math.round(input.tollsMinor ?? 0));
  const feesMinor = Math.max(0, Math.round(input.feesMinor ?? 0));
  const discountsMinor = Math.max(0, Math.round(input.discountsMinor ?? 0));
  const totalMinor = Math.max(baseFareMinor, subtotalMinor + fuelAdjustmentMinor + demandAdjustmentMinor + tollsMinor + feesMinor - discountsMinor);
  const platformFeeMinor = Math.round((totalMinor * DRIVE_PLATFORM_FEE_BPS) / 10000);
  const driverEarningsMinor = Math.max(0, totalMinor - platformFeeMinor);
  return {
    baseFareMinor: BigInt(baseFareMinor), distanceFareMinor: BigInt(distanceFareMinor), timeFareMinor: BigInt(timeFareMinor), subtotalMinor: BigInt(subtotalMinor),
    fuelAdjustmentMinor: BigInt(fuelAdjustmentMinor), demandAdjustmentMinor: BigInt(demandAdjustmentMinor), tollsMinor: BigInt(tollsMinor), feesMinor: BigInt(feesMinor), discountsMinor: BigInt(discountsMinor),
    surgeBps, fuelIndexBps, platformFeeBps: DRIVE_PLATFORM_FEE_BPS, platformFeeMinor: BigInt(platformFeeMinor), driverEarningsMinor: BigInt(driverEarningsMinor), totalMinor: BigInt(totalMinor),
  };
}

export async function currentDriveRules() {
  const [fuel, regional] = await Promise.all([
    db.driveFuelPrice.findFirst({ where: { region: env.REGION, fuelType: "PMS", status: "ACTIVE", effectiveFrom: { lte: new Date() } }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] }).catch(() => null),
    db.regionalConfig.findUnique({ where: { region_vertical: { region: env.REGION, vertical: "drive" } } }).catch(() => null),
  ]);
  const rules = regional?.rules as { surgeBps?: unknown; maxPickupDistanceMeters?: unknown; maxPickupEtaSeconds?: unknown; dropoffGeofenceMeters?: unknown; callUnlockMeters?: unknown; callUnlockEtaSeconds?: unknown } | null;
  const fuelStatus = fuelPublicationStatus(fuel);
  const verifiedFuel = fuelStatus === "CURRENT" ? fuel : null;
  const evidence = fuel?.metadata && typeof fuel.metadata === "object" ? fuel.metadata as Record<string, unknown> : {};
  return {
    fuelStatus,
    fuelSource: verifiedFuel?.source ?? null,
    fuelEvidenceUrl: verifiedFuel && typeof evidence.evidenceUrl === "string" ? evidence.evidenceUrl : null,
    fuelEffectiveFrom: verifiedFuel?.effectiveFrom.toISOString() ?? null,
    fuelWeightBps: DRIVE_FUEL_WEIGHT_BPS,
    fuelMaxAdjustmentBps: DRIVE_MAX_FUEL_ADJUSTMENT_BPS,
    fuelMaxAgeDays: DRIVE_FUEL_MAX_AGE_DAYS,
    fuelIndexBps: verifiedFuel?.indexBps ?? 10000,
    fuelPricePerLitreMinor: verifiedFuel?.priceMinorPerLitre ?? null,
    fuelReferencePricePerLitreMinor: verifiedFuel?.referencePriceMinorPerLitre ?? null,
    surgeBps: typeof rules?.surgeBps === "number" ? clampInt(rules.surgeBps, 8000, 30000) : 10000,
    maxPickupDistanceMeters: typeof rules?.maxPickupDistanceMeters === "number" ? clampInt(rules.maxPickupDistanceMeters, 1000, 30000) : DRIVE_DEFAULT_MAX_PICKUP_DISTANCE_METERS,
    maxPickupEtaSeconds: typeof rules?.maxPickupEtaSeconds === "number" ? clampInt(rules.maxPickupEtaSeconds, 120, 3600) : DRIVE_DEFAULT_MAX_PICKUP_ETA_SECONDS,
    dropoffGeofenceMeters: typeof rules?.dropoffGeofenceMeters === "number" ? clampInt(rules.dropoffGeofenceMeters, 50, 1000) : DRIVE_DEFAULT_DROPOFF_GEOFENCE_METERS,
    callUnlockMeters: typeof rules?.callUnlockMeters === "number" ? clampInt(rules.callUnlockMeters, 100, 5000) : DRIVE_CALL_UNLOCK_METERS,
    callUnlockEtaSeconds: typeof rules?.callUnlockEtaSeconds === "number" ? clampInt(rules.callUnlockEtaSeconds, 30, 900) : DRIVE_CALL_UNLOCK_ETA_SECONDS,
  };
}

async function ensureWalletAccount(tx: Prisma.TransactionClient, ownerKey: string, currency: string, userId?: string) {
  let wallet = await tx.wallet.findUnique({ where: { ownerKey_currency: { ownerKey, currency } } });
  if (!wallet) wallet = await tx.wallet.create({ data: { ownerKey, currency, userId } });
  let account = await tx.ledgerAccount.findFirst({ where: { walletId: wallet.id, currency, kind: "WALLET_LIABILITY" } });
  if (!account) account = await tx.ledgerAccount.create({ data: { walletId: wallet.id, code: `wallet:${wallet.id}:${currency}`, currency, kind: "WALLET_LIABILITY" } });
  return { wallet, account };
}
async function accountBalanceMinor(tx: Prisma.TransactionClient, accountId: string): Promise<bigint> {
  const grouped = await tx.ledgerEntry.groupBy({ by: ["direction"], where: { accountId }, _sum: { amountMinor: true } });
  let credit = 0n, debit = 0n;
  for (const row of grouped) row.direction === "CREDIT" ? credit = row._sum.amountMinor ?? 0n : debit = row._sum.amountMinor ?? 0n;
  return credit - debit;
}

export async function reserveRideFare(tx: Prisma.TransactionClient, input: { rideId: string; riderUserId: string; amountMinor: bigint; currency: string }) {
  const rider = await ensureWalletAccount(tx, `user:${input.riderUserId}`, input.currency, input.riderUserId);
  const available = await accountBalanceMinor(tx, rider.account.id);
  if (available < input.amountMinor) throw new AppError("CONFLICT", "Fund your Bazaara Wallet with the confirmed trip fare before requesting this ride", 409, { wallet: [`Required ${input.amountMinor.toString()} minor units; available ${available.toString()}`] });
  const escrow = await ensureWalletAccount(tx, "system:drive-escrow", input.currency);
  const reference = `drive-hold:${input.rideId}`;
  const journal = await postJournal(tx, { reference, kind: "DRIVE_FARE_HOLD", currency: input.currency, description: `Secure fare hold for Drive ride ${input.rideId}`, lines: [
    { accountId: rider.account.id, direction: "DEBIT", amountMinor: input.amountMinor }, { accountId: escrow.account.id, direction: "CREDIT", amountMinor: input.amountMinor },
  ] });
  await tx.driveFareHold.create({ data: { rideId: input.rideId, riderUserId: input.riderUserId, amountMinor: input.amountMinor, currency: input.currency, status: "HELD", reservationReference: journal.reference } });
}
export async function releaseRideFare(tx: Prisma.TransactionClient, input: { rideId: string; reason: string }) {
  const hold = await tx.driveFareHold.findUnique({ where: { rideId: input.rideId } });
  if (!hold || hold.status !== "HELD") return;
  const rider = await ensureWalletAccount(tx, `user:${hold.riderUserId}`, hold.currency, hold.riderUserId);
  const escrow = await ensureWalletAccount(tx, "system:drive-escrow", hold.currency);
  await postJournal(tx, { reference: `drive-hold-release:${hold.id}`, kind: "DRIVE_FARE_HOLD_RELEASE", currency: hold.currency, description: input.reason, lines: [
    { accountId: escrow.account.id, direction: "DEBIT", amountMinor: hold.amountMinor }, { accountId: rider.account.id, direction: "CREDIT", amountMinor: hold.amountMinor },
  ] });
  await tx.driveFareHold.update({ where: { id: hold.id }, data: { status: "RELEASED", releasedAt: new Date(), settlement: { reason: input.reason } } });
}
export async function securePlatformCharge(tx: Prisma.TransactionClient, input: { rideId: string; amountMinor: bigint; currency: string }) {
  if (input.amountMinor <= 0n) return;
  const existing = await tx.ledgerTransaction.findUnique({ where: { reference: `drive-platform-charge:${input.rideId}` } });
  if (existing) return;
  const escrow = await ensureWalletAccount(tx, "system:drive-escrow", input.currency);
  const platform = await ensureWalletAccount(tx, "system:drive-platform", input.currency);
  await postJournal(tx, { reference: `drive-platform-charge:${input.rideId}`, kind: "DRIVE_PLATFORM_CHARGE", currency: input.currency, description: "15% Drive platform charge secured when ride starts", lines: [
    { accountId: escrow.account.id, direction: "DEBIT", amountMinor: input.amountMinor }, { accountId: platform.account.id, direction: "CREDIT", amountMinor: input.amountMinor },
  ] });
}
export async function applyDriverWalletEntry(tx: Prisma.TransactionClient, input: { driverUserId: string; rideId?: string; type: string; amountMinor: bigint; metadata?: Prisma.InputJsonValue }) {
  const profile = await tx.driveDriverProfile.findUnique({ where: { userId: input.driverUserId } });
  if (!profile) throw new AppError("CONFLICT", "Driver profile is missing", 409);
  const next = profile.walletBalanceMinor + input.amountMinor;
  const debt = next < 0n ? -next : 0n;
  await tx.driveDriverProfile.update({ where: { userId: input.driverUserId }, data: { walletBalanceMinor: next, platformDebtMinor: debt } });
  await tx.driveDriverLedgerEntry.create({ data: { driverUserId: input.driverUserId, rideId: input.rideId, type: input.type, amountMinor: input.amountMinor, balanceAfterMinor: next, metadata: input.metadata } });
  return next;
}
export async function applyDriverPenalty(tx: Prisma.TransactionClient, input: { rideId: string; driverUserId: string; type: "CANCEL_AFTER_ACCEPT" | "DROPOFF_VIOLATION"; rateBps: number; baseAmountMinor: bigint; reason?: string; debitWallet?: boolean }) {
  const amountMinor = (input.baseAmountMinor * BigInt(input.rateBps) + 5000n) / 10000n;
  await tx.driveDriverPenalty.create({ data: { rideId: input.rideId, driverUserId: input.driverUserId, type: input.type, rateBps: input.rateBps, baseAmountMinor: input.baseAmountMinor, amountMinor, reason: input.reason } });
  if (input.debitWallet !== false) {
    const ride = await tx.driveRide.findUnique({ where: { id: input.rideId }, include: { quote: { select: { currency: true } } } });
    if (!ride) throw new AppError("NOT_FOUND", "Drive ride is missing for penalty settlement", 404);
    const driver = await ensureWalletAccount(tx, `drive-driver:${input.driverUserId}`, ride.quote.currency, input.driverUserId);
    const platform = await ensureWalletAccount(tx, "system:drive-platform", ride.quote.currency);
    const reference = `drive-driver-penalty:${input.rideId}:${input.type}`;
    const alreadyPosted = await tx.ledgerTransaction.findUnique({ where: { reference } });
    if (!alreadyPosted && amountMinor > 0n) {
      await postJournal(tx, {
        reference,
        kind: "DRIVE_DRIVER_PENALTY",
        currency: ride.quote.currency,
        description: `${input.type} penalty for Drive ride ${input.rideId}`,
        lines: [
          { accountId: driver.account.id, direction: "DEBIT", amountMinor },
          { accountId: platform.account.id, direction: "CREDIT", amountMinor },
        ],
      });
    }
    await applyDriverWalletEntry(tx, { driverUserId: input.driverUserId, rideId: input.rideId, type: `PENALTY_${input.type}`, amountMinor: -amountMinor, metadata: { rateBps: input.rateBps, reason: input.reason ?? null } });
  }
  return amountMinor;
}
export async function settleRideFare(tx: Prisma.TransactionClient, input: { rideId: string; driverUserId: string; driverEarningsMinor: bigint; additionalPlatformMinor?: bigint; currency: string }) {
  const hold = await tx.driveFareHold.findUnique({ where: { rideId: input.rideId } });
  if (!hold || hold.status !== "HELD") throw new AppError("CONFLICT", "Ride fare hold is not available for settlement", 409);
  const escrow = await ensureWalletAccount(tx, "system:drive-escrow", input.currency);
  const platform = await ensureWalletAccount(tx, "system:drive-platform", input.currency);
  const driver = await ensureWalletAccount(tx, `drive-driver:${input.driverUserId}`, input.currency, input.driverUserId);
  const additional = input.additionalPlatformMinor ?? 0n;
  const payout = input.driverEarningsMinor > additional ? input.driverEarningsMinor - additional : 0n;
  const lines: Array<{ accountId: string; direction: "DEBIT" | "CREDIT"; amountMinor: bigint }> = [];
  if (payout > 0n) lines.push({ accountId: escrow.account.id, direction: "DEBIT", amountMinor: payout }, { accountId: driver.account.id, direction: "CREDIT", amountMinor: payout });
  if (additional > 0n) lines.push({ accountId: escrow.account.id, direction: "DEBIT", amountMinor: additional }, { accountId: platform.account.id, direction: "CREDIT", amountMinor: additional });
  if (lines.length >= 2) await postJournal(tx, { reference: `drive-settlement:${input.rideId}`, kind: "DRIVE_RIDE_SETTLEMENT", currency: input.currency, description: `Settle Drive ride ${input.rideId}`, lines });
  await applyDriverWalletEntry(tx, { driverUserId: input.driverUserId, rideId: input.rideId, type: "RIDE_EARNINGS", amountMinor: payout });
  await tx.driveFareHold.update({ where: { id: hold.id }, data: { status: "SETTLED", releasedAt: new Date(), settlement: { driverUserId: input.driverUserId, driverPayoutMinor: payout.toString(), additionalPlatformMinor: additional.toString() } } });
  return { payoutMinor: payout };
}

function payoutContract(row: any): DriveDriverPayoutContract {
  return {
    id: row.id,
    driverUserId: row.driverUserId,
    amountMinor: safeMinor(row.amountMinor),
    currency: row.currency,
    status: row.status,
    destinationWalletId: row.destinationWalletId ?? null,
    ledgerTransactionId: row.ledgerTransactionId ?? null,
    initiatedByUserId: row.initiatedByUserId ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function getDriverWalletReconciliation(driverUserId: string, currency = env.CURRENCY) {
  const profile = await db.driveDriverProfile.findUnique({ where: { userId: driverUserId } });
  if (!profile) throw new AppError("NOT_FOUND", "Driver profile not found", 404);
  return db.$transaction(async (tx) => {
    const drive = await ensureWalletAccount(tx, `drive-driver:${driverUserId}`, currency, driverUserId);
    const pay = await ensureWalletAccount(tx, `user:${driverUserId}`, currency, driverUserId);
    const [driveLedgerBalance, payWalletBalance] = await Promise.all([
      accountBalanceMinor(tx, drive.account.id),
      accountBalanceMinor(tx, pay.account.id),
    ]);
    const reconciled = driveLedgerBalance === profile.walletBalanceMinor;
    const payoutAvailable = reconciled && profile.walletBalanceMinor > 0n && profile.platformDebtMinor === 0n
      ? profile.walletBalanceMinor
      : 0n;
    return {
      currency,
      driveWalletId: drive.wallet.id,
      driveLedgerAccountId: drive.account.id,
      destinationWalletId: pay.wallet.id,
      driveLedgerBalanceMinor: driveLedgerBalance,
      profileBalanceMinor: profile.walletBalanceMinor,
      payWalletBalanceMinor: payWalletBalance,
      platformDebtMinor: profile.platformDebtMinor,
      payoutAvailableMinor: payoutAvailable,
      reconciled,
      deltaMinor: profile.walletBalanceMinor - driveLedgerBalance,
    };
  });
}

export async function listDriverPayouts(driverUserId: string, take = 50) {
  const rows = await db.driveDriverPayout.findMany({
    where: { driverUserId },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(200, take)),
  });
  return rows.map(payoutContract);
}

export async function moveDriverEarningsToWallet(input: {
  driverUserId: string;
  amountMinor?: number;
  idempotencyKey: string;
  initiatedByUserId?: string;
}) {
  if (!input.idempotencyKey.trim()) throw new AppError("BAD_REQUEST", "Idempotency-Key is required", 400);
  const existing = await db.driveDriverPayout.findUnique({
    where: { driverUserId_idempotencyKey: { driverUserId: input.driverUserId, idempotencyKey: input.idempotencyKey } },
  });
  if (existing) return { payout: payoutContract(existing), replayed: true };

  let result;
  try {
    result = await db.$transaction(async (tx) => {
    const profile = await tx.driveDriverProfile.findUnique({ where: { userId: input.driverUserId } });
    if (!profile) throw new AppError("NOT_FOUND", "Driver profile not found", 404);
    const currency = env.CURRENCY;
    const drive = await ensureWalletAccount(tx, `drive-driver:${input.driverUserId}`, currency, input.driverUserId);
    const pay = await ensureWalletAccount(tx, `user:${input.driverUserId}`, currency, input.driverUserId);
    const ledgerBalance = await accountBalanceMinor(tx, drive.account.id);
    if (ledgerBalance !== profile.walletBalanceMinor) {
      throw new AppError("CONFLICT", "Drive earnings require Finance Operations reconciliation before payout", 409, {
        drive: [`Profile ${profile.walletBalanceMinor.toString()} vs ledger ${ledgerBalance.toString()}`],
      });
    }
    if (profile.platformDebtMinor > 0n || profile.walletBalanceMinor <= 0n) {
      throw new AppError("CONFLICT", "No Drive earnings are currently available for payout", 409);
    }
    const available = profile.walletBalanceMinor;
    const amount = input.amountMinor == null ? available : BigInt(input.amountMinor);
    if (amount <= 0n) throw new AppError("BAD_REQUEST", "Payout amount must be positive", 400);
    if (amount > available) throw new AppError("CONFLICT", "Payout exceeds available Drive earnings", 409);

    const pending = await tx.driveDriverPayout.create({
      data: {
        driverUserId: input.driverUserId,
        amountMinor: amount,
        currency,
        status: "PENDING",
        sourceLedgerAccountId: drive.account.id,
        destinationWalletId: pay.wallet.id,
        idempotencyKey: input.idempotencyKey,
        initiatedByUserId: input.initiatedByUserId ?? input.driverUserId,
        metadata: { channel: input.initiatedByUserId && input.initiatedByUserId !== input.driverUserId ? "OPERATIONS" : "DRIVER" },
      },
    });
    const journal = await postJournal(tx, {
      reference: `drive-driver-payout:${pending.id}`,
      kind: "DRIVE_DRIVER_PAYOUT_TO_WALLET",
      currency,
      description: `Move Drive earnings to BAZAARA Wallet for driver ${input.driverUserId}`,
      lines: [
        { accountId: drive.account.id, direction: "DEBIT", amountMinor: amount },
        { accountId: pay.account.id, direction: "CREDIT", amountMinor: amount },
      ],
    });
    await applyDriverWalletEntry(tx, {
      driverUserId: input.driverUserId,
      type: "PAYOUT_TO_BAZAARA_WALLET",
      amountMinor: -amount,
      metadata: { payoutId: pending.id, destinationWalletId: pay.wallet.id, ledgerTransactionId: journal.id },
    });
    return tx.driveDriverPayout.update({
      where: { id: pending.id },
      data: { status: "COMPLETED", ledgerTransactionId: journal.id, completedAt: new Date() },
    });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (cause) {
    const code = cause && typeof cause === "object" && "code" in cause ? String((cause as { code?: unknown }).code ?? "") : "";
    if (code === "P2002") {
      const replay = await db.driveDriverPayout.findUnique({
        where: { driverUserId_idempotencyKey: { driverUserId: input.driverUserId, idempotencyKey: input.idempotencyKey } },
      });
      if (replay) return { payout: payoutContract(replay), replayed: true };
    }
    throw cause;
  }

  return { payout: payoutContract(result), replayed: false };
}

export async function getDriveFinanceSnapshot(currency = env.CURRENCY) {
  const [profiles, driveWallets, held, settled, payouts, completedPayouts] = await Promise.all([
    db.driveDriverProfile.findMany({ select: { userId: true, walletBalanceMinor: true, platformDebtMinor: true, approvalStatus: true }, take: 500 }),
    db.wallet.findMany({ where: { ownerKey: { startsWith: "drive-driver:" }, currency }, include: { ledgerAccounts: { where: { kind: "WALLET_LIABILITY", currency }, take: 1 } }, take: 500 }),
    db.driveFareHold.aggregate({ where: { status: "HELD", currency }, _sum: { amountMinor: true }, _count: { _all: true } }),
    db.driveFareHold.aggregate({ where: { status: "SETTLED", currency }, _sum: { amountMinor: true }, _count: { _all: true } }),
    db.driveDriverPayout.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.driveDriverPayout.aggregate({ where: { status: "COMPLETED", currency }, _sum: { amountMinor: true }, _count: { _all: true } }),
  ]);
  const accountByDriver = new Map<string, string>();
  for (const wallet of driveWallets) {
    const driverUserId = wallet.ownerKey.startsWith("drive-driver:") ? wallet.ownerKey.slice("drive-driver:".length) : "";
    const account = wallet.ledgerAccounts[0];
    if (driverUserId && account) accountByDriver.set(driverUserId, account.id);
  }
  const accountIds = [...accountByDriver.values()];
  const grouped = accountIds.length ? await db.ledgerEntry.groupBy({
    by: ["accountId", "direction"],
    where: { accountId: { in: accountIds } },
    _sum: { amountMinor: true },
  }) : [];
  const balances = new Map<string, bigint>();
  for (const row of grouped) {
    const current = balances.get(row.accountId) ?? 0n;
    const value = row._sum.amountMinor ?? 0n;
    balances.set(row.accountId, row.direction === "CREDIT" ? current + value : current - value);
  }
  const issues = profiles.flatMap((profile) => {
    const accountId = accountByDriver.get(profile.userId);
    const ledgerBalance = accountId ? balances.get(accountId) ?? 0n : 0n;
    const delta = profile.walletBalanceMinor - ledgerBalance;
    return delta === 0n ? [] : [{
      driverUserId: profile.userId,
      profileBalanceMinor: safeMinor(profile.walletBalanceMinor),
      ledgerBalanceMinor: safeMinor(ledgerBalance),
      deltaMinor: safeMinor(delta),
      approvalStatus: profile.approvalStatus,
    }];
  });
  const drivers = profiles.map((profile) => {
    const accountId = accountByDriver.get(profile.userId);
    const ledgerBalance = accountId ? balances.get(accountId) ?? 0n : 0n;
    const reconciled = ledgerBalance === profile.walletBalanceMinor;
    const payoutAvailable = reconciled && profile.walletBalanceMinor > 0n && profile.platformDebtMinor === 0n ? profile.walletBalanceMinor : 0n;
    return {
      driverUserId: profile.userId,
      approvalStatus: profile.approvalStatus,
      profileBalanceMinor: safeMinor(profile.walletBalanceMinor),
      ledgerBalanceMinor: safeMinor(ledgerBalance),
      platformDebtMinor: safeMinor(profile.platformDebtMinor),
      payoutAvailableMinor: safeMinor(payoutAvailable),
      reconciled,
    };
  }).filter((row) => row.profileBalanceMinor !== 0 || row.platformDebtMinor !== 0 || !row.reconciled)
    .sort((a, b) => b.payoutAvailableMinor - a.payoutAvailableMinor || b.platformDebtMinor - a.platformDebtMinor)
    .slice(0, 100);
  const outstanding = profiles.reduce((sum, profile) => sum + (profile.walletBalanceMinor > 0n ? profile.walletBalanceMinor : 0n), 0n);
  const debt = profiles.reduce((sum, profile) => sum + profile.platformDebtMinor, 0n);
  return {
    currency,
    driverOutstandingMinor: safeMinor(outstanding),
    platformDebtMinor: safeMinor(debt),
    heldRiderFareMinor: safeMinor(held._sum.amountMinor ?? 0n),
    heldRiderFareCount: held._count._all,
    settledRiderFareMinor: safeMinor(settled._sum.amountMinor ?? 0n),
    settledRideCount: settled._count._all,
    paidToWalletMinor: safeMinor(completedPayouts._sum.amountMinor ?? 0n),
    completedPayoutCount: completedPayouts._count._all,
    reconciliationIssueCount: issues.length,
    reconciliationIssues: issues.slice(0, 50),
    drivers,
    payouts: payouts.map(payoutContract),
  };
}

export function pickupPointFromJson(value: unknown): GeoPoint | null {
  if (!value || typeof value !== "object") return null;
  const x = value as { latitude?: unknown; longitude?: unknown };
  return typeof x.latitude === "number" && typeof x.longitude === "number" ? { latitude: x.latitude, longitude: x.longitude } : null;
}

export async function assignNearestDriver(rideId: string) {
  const ride = await db.driveRide.findUnique({ where: { id: rideId }, include: { quote: true, dispatchOffers: { select: { driverUserId: true } } } });
  if (!ride || !["MATCHING", "REQUESTED"].includes(ride.status) || ride.driverUserId) return null;
  if (ride.scheduledFor && ride.scheduledFor.getTime() - Date.now() > 20 * 60_000) return null;
  const pickup = pickupPointFromJson(ride.quote.pickup); if (!pickup) return null;
  const rules = await currentDriveRules(); const excluded = new Set(ride.dispatchOffers.map((o) => o.driverUserId));
  const profiles = await db.driveDriverProfile.findMany({ where: {
    approvalStatus: "APPROVED", availability: "ONLINE", currentLatitude: { not: null }, currentLongitude: { not: null }, lastLocationAt: { gte: new Date(Date.now() - 2 * 60_000) }, serviceClasses: { has: ride.quote.rideClass },
    vehicles: { some: { active: true, status: "APPROVED", rideClass: ride.quote.rideClass, AND: [{OR:[{insuranceDueAt:null},{insuranceDueAt:{gt:new Date()}}]},{OR:[{inspectionDueAt:null},{inspectionDueAt:{gt:new Date()}}]}] } },
    AND: ["DRIVER_LICENCE","VEHICLE_INSURANCE","VEHICLE_INSPECTION"].map(type=>({documents:{some:{type,status:"APPROVED",expiresAt:{gt:new Date()}}}})),
  }, take: 250 });
  const candidates = profiles.filter((p) => !excluded.has(p.userId) && p.currentLatitude !== null && p.currentLongitude !== null).map((p) => {
    const distance = haversineMeters(pickup, { latitude: p.currentLatitude!, longitude: p.currentLongitude! }); const eta = estimatePickupEtaSeconds(distance);
    return { profile: p, distance, eta, maxDistance: Math.min(p.maxPickupDistanceMeters, rules.maxPickupDistanceMeters), maxEta: Math.min(p.maxPickupEtaSeconds, rules.maxPickupEtaSeconds) };
  }).filter((x) => x.distance <= x.maxDistance && x.eta <= x.maxEta).sort((a, b) => a.eta - b.eta || a.distance - b.distance);
  const initialRadius = clampInt(ride.searchRadiusMeters || DRIVE_INITIAL_SEARCH_RADIUS_METERS, 1000, rules.maxPickupDistanceMeters);
  const searchBands = Array.from(new Set([initialRadius, Math.min(rules.maxPickupDistanceMeters, Math.max(initialRadius + 1500, 3500)), rules.maxPickupDistanceMeters])).sort((a,b)=>a-b);
  let selected: (typeof candidates)[number] | undefined; let radius = initialRadius;
  for (const band of searchBands) { const within = candidates.filter((candidate) => candidate.distance <= band); if (within.length) { selected = within[0]; radius = band; break; } }
  if (!selected) { await db.driveRide.update({ where: { id: ride.id }, data: { matchingAttempt: { increment: 1 }, searchRadiusMeters: rules.maxPickupDistanceMeters } }); return null; }
  return db.$transaction(async (tx) => {
    const open = await tx.driveRide.findUnique({ where: { id: ride.id } }); if (!open || !["MATCHING","REQUESTED"].includes(open.status) || open.driverUserId) return null;
    await tx.driveRide.update({ where: { id: ride.id }, data: { status: "MATCHING", matchingAttempt: { increment: 1 }, searchRadiusMeters: radius } });
    const offer = await tx.driveDispatchOffer.create({ data: { rideId: ride.id, driverUserId: selected!.profile.userId, pickupDistanceMeters: selected!.distance, pickupEtaSeconds: selected!.eta, searchRadiusMeters: radius, expiresAt: new Date(Date.now() + DRIVE_OFFER_TTL_SECONDS * 1000) } });
    await tx.driveRideEvent.create({ data: { rideId: ride.id, type: "DISPATCH_OFFERED", payload: { driverUserId: selected!.profile.userId, pickupDistanceMeters: selected!.distance, pickupEtaSeconds: selected!.eta } } });
    return offer;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
