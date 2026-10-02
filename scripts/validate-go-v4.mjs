import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: missing`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function has(rel, markers) {
  const text = read(rel);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${rel}: ${marker}`);
  }
}

has("services/platform-api/src/logistics/routes.ts", [
  "LOGISTICS_ADVANCE_FUNDING",
  "LOGISTICS_DELIVERY_SETTLEMENT",
  "LOGISTICS_ADVANCE_REFUND",
  "/v1/logistics/courier/offers",
  "/v1/logistics/courier/history",
  "GO_PARCEL_COMMISSION_BPS",
  "verifyPayPin",
]);

has("packages/db/prisma/schema.prisma", [
  "fundingStatus",
  "courierPayoutMinor",
  "slaDueAt",
  "organizationId",
  "lastCourierLocation",
]);

has("apps/logistics-web/app/page.tsx", [
  "Food, parcels and Bazaara commerce.",
  "100% ADVANCE",
  "advancePaymentRequired",
  "Contact Operations",
  "/v1/logistics/courier/offers",
  "/v1/go/food/offers",
]);

has("apps/logistics-mobile/app/index.tsx", [
  "ONE DELIVERY NETWORK",
  "Get live quote",
  "Track parcel",
  "Pay securely & book",
]);

has("apps/logistics-courier-mobile/app/index.tsx", [
  "Delivery cockpit",
  "ACTIVE FOOD",
  "ACTIVE PARCEL",
  "/v1/logistics/courier/offers",
  "/v1/go/food/offers",
]);

has("apps/business-web/app/support/page.tsx", [
  "Support",
  "Open support case",
  "/support/cases",
]);

has("apps/business-web/app/logistics/page.tsx", [
  "Go & Logistics",
  "Business Pay",
  "Fulfillment",
]);

has("apps/operations-web/app/logistics/page.tsx", [
  "GO · LOGISTICS OPERATIONS",
  "advance funding",
  "Contact / case",
  "/v1/operations/logistics/",
]);

has("apps/operations-web/app/access/page.tsx", [
  "Least privilege by responsibility.",
  "/v1/operations/access",
  "Grant role",
]);

has("apps/pay-web/app/page.tsx", [
  "GO",
  "Withdraw securely",
  "Add verified bank",
  "Open Operations case",
  "Reset test wallet",
]);

has("services/platform-api/src/support/routes.ts", [
  "/v1/business/organizations/:organizationId/support/cases",
  "LOGISTICS",
  "GO",
]);

has("packages/db/prisma/seed-operations-roles-v4.ts", [
  "Operations Super Admin",
  "Mobility & Logistics Operations",
  "Customer & Business Support",
  "Operations Auditor",
]);

const migration = read("packages/db/prisma/migrations/20260919190000_go_full_ecosystem_v4/migration.sql");
for (const marker of [
  'ALTER TABLE "SupportCase"',
  'ALTER TABLE "LogisticsBooking"',
  '"fundingStatus"',
  '"organizationId"',
  '"slaDueAt"',
]) {
  if (!migration.includes(marker)) failures.push(`Go V4 migration: ${marker}`);
}

if (failures.length) {
  console.error(`GO V4 validation FAILED (${failures.length} checks)`);
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log("GO V4 validation PASS.");
