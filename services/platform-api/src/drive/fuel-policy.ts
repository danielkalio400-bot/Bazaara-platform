/** BAZAARA commercial pricing safeguards, not a statutory Nigerian fare tariff.
 * A verified PMS index changes only the fuel-exposed portion of a NEW quote.
 * Already accepted quotes and escrow are immutable.
 */
export const DRIVE_FUEL_WEIGHT_BPS = 3000; // 30% assumed fuel exposure; configurable after unit-economics review.
export const DRIVE_MAX_FUEL_ADJUSTMENT_BPS = 1200; // BAZAARA commercial cap: +/-12% of base subtotal.
export const DRIVE_FUEL_MAX_AGE_DAYS = 7;

export type FuelPublication = {
  status: string;
  indexBps: number;
  source: string;
  effectiveFrom: Date;
  metadata: unknown;
};

export function fuelPublicationStatus(record: FuelPublication | null, now = new Date()): "CURRENT" | "STALE" | "PENDING_VERIFICATION" | "UNAVAILABLE" {
  if (!record) return "UNAVAILABLE";
  const metadata = record.metadata && typeof record.metadata === "object" ? record.metadata as Record<string, unknown> : {};
  if (record.status !== "ACTIVE" || typeof metadata.approvedByUserId !== "string" || !metadata.evidenceUrl || !metadata.submittedByUserId || metadata.approvedByUserId === metadata.submittedByUserId) return "PENDING_VERIFICATION";
  if (record.effectiveFrom.getTime() > now.getTime() || now.getTime() - record.effectiveFrom.getTime() > DRIVE_FUEL_MAX_AGE_DAYS * 86_400_000) return "STALE";
  return "CURRENT";
}

export function calculateFuelAdjustmentMinor(subtotalMinor: number, fuelIndexBps: number): number {
  const rawBps = Math.round((Math.max(5000, Math.min(30000, fuelIndexBps)) - 10_000) * DRIVE_FUEL_WEIGHT_BPS / 10_000);
  const cappedBps = Math.max(-DRIVE_MAX_FUEL_ADJUSTMENT_BPS, Math.min(DRIVE_MAX_FUEL_ADJUSTMENT_BPS, rawBps));
  return Math.round(subtotalMinor * cappedBps / 10_000);
}
