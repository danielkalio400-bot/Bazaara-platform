import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
function must(condition, message) { (condition ? checks : failures).push(message); }
function has(file, marker, label = marker) {
  must(exists(file), `${file}: exists`);
  if (exists(file)) must(read(file).includes(marker), `${file}: ${label}`);
}
function hasAny(file, markers, label) {
  must(exists(file), `${file}: exists`);
  if (exists(file)) must(markers.some(marker => read(file).includes(marker)), `${file}: ${label}`);
}
function no(file, marker, label = marker) {
  if (exists(file)) must(!read(file).includes(marker), `${file}: no ${label}`);
}

// Keep the complete Business and Operations suites that pre-date V11.
for (const file of [
  "apps/business-web/app/revenue/page.tsx",
  "apps/business-web/app/analytics/page.tsx",
  "apps/business-web/app/reports/page.tsx",
  "apps/business-web/app/pricing/page.tsx",
  "apps/business-web/app/subscriptions/page.tsx",
  "apps/business-web/app/payments/page.tsx",
  "apps/business-web/app/customers/page.tsx",
  "apps/business-web/app/users/page.tsx",
  "apps/business-web/app/team/page.tsx",
  "apps/business-web/app/settings/page.tsx",
  "apps/business-web/app/support/page.tsx",
  "apps/operations-web/app/tickets/page.tsx",
  "apps/operations-web/app/support/page.tsx",
  "apps/operations-web/app/support-tools/page.tsx",
  "apps/operations-web/app/access/page.tsx",
  "apps/operations-web/app/audit/page.tsx",
  "apps/operations-web/app/risk/page.tsx",
  "apps/operations-web/app/reports/page.tsx",
]) must(exists(file), `baseline:${file}`);

// First-class support context in the data model.
has("packages/db/prisma/schema.prisma", 'supportCases                SupportCase[]        @relation("DriveRideSupportCases")', "DriveRide -> SupportCase relation");
has("packages/db/prisma/schema.prisma", 'supportCases SupportCase[] @relation("LedgerTransactionSupportCases")', "LedgerTransaction -> SupportCase relation");
has("packages/db/prisma/schema.prisma", "driveRideId         String?", "SupportCase driveRideId");
has("packages/db/prisma/schema.prisma", "ledgerTransactionId String?", "SupportCase ledgerTransactionId");
has("packages/db/prisma/schema.prisma", "@@index([driveRideId, createdAt])", "Drive support lookup index");
has("packages/db/prisma/schema.prisma", "@@index([ledgerTransactionId, createdAt])", "Wallet support lookup index");
has("packages/db/prisma/migrations/20260922103000_drive_wallet_support_context/migration.sql", 'FOREIGN KEY ("driveRideId") REFERENCES "DriveRide"', "Drive support FK migration");
has("packages/db/prisma/migrations/20260922103000_drive_wallet_support_context/migration.sql", 'FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"', "Wallet support FK migration");
has("packages/contracts/src/index.ts", "driveRideId: string | null;", "shared support Drive link contract");
has("packages/contracts/src/index.ts", "ledgerTransactionId: string | null;", "shared support Wallet link contract");
has("packages/contracts/src/index.ts", "transactionId: string;", "Wallet activity exposes canonical ledger transaction id");
has("services/platform-api/src/pay/service.ts", "transactionId:e.transactionId", "Wallet activity maps canonical transaction id");

// Ownership-safe API and rich admin case payloads.
has("services/platform-api/src/support/routes.ts", "driveRideId: z.string().min(1).optional()", "Drive support API input");
has("services/platform-api/src/support/routes.ts", "ledgerTransactionId: z.string().min(1).optional()", "Wallet support API input");
has("services/platform-api/src/support/service.ts", "OR: [{ riderUserId: userId }, { driverUserId: userId }]", "ride ownership guard");
has("services/platform-api/src/support/service.ts", "wallet: { is: { userId } }", "ledger ownership guard through Wallet");
has("services/platform-api/src/support/service.ts", 'throw new AppError("NOT_FOUND", "Drive ride not found"', "invalid Drive link rejected");
has("services/platform-api/src/support/service.ts", 'throw new AppError("NOT_FOUND", "Wallet transaction not found"', "invalid Wallet link rejected");
has("services/platform-api/src/support/service.ts", "driveRide: { select:", "Drive context included for Operations");
has("services/platform-api/src/support/service.ts", "ledgerTransaction: { select:", "Wallet context included for Operations");
has("services/platform-api/src/support/service.ts", "driveRideId: input.driveRideId", "Drive support persisted");
has("services/platform-api/src/support/service.ts", "ledgerTransactionId: input.ledgerTransactionId", "Wallet support persisted");
has("services/platform-api/src/support/service.ts", "driveRideId: { contains: input.q", "Drive support searchable");
has("services/platform-api/src/support/service.ts", "ledgerTransaction: { reference: { contains: input.q", "Wallet support searchable");

// Drive -> Wallet -> Support handoffs.
has("apps/drive-web/app/page.tsx", 'category: "DRIVE"', "Drive creates Drive support cases");
has("apps/drive-web/app/page.tsx", "driveRideId: linkedRideId", "Drive attaches exact ride");
hasAny("apps/drive-web/app/page.tsx", ["Get trip help", "openRideSupport(activeRideId)"], "Drive trip support action");
hasAny("apps/drive-web/app/page.tsx", ["View fare in Wallet", "&rideId=${encodeURIComponent(activeRideId)}"], "Drive -> Wallet exact-ride handoff in Account");
hasAny("apps/drive-web/app/page.tsx", ["Send to Operations", 'category: "DRIVE"'], "Drive -> Operations support handoff");
has("apps/pay-web/app/page.tsx", "supportDriveRideId", "Wallet support stores ride context");
has("apps/pay-web/app/page.tsx", "supportLedgerTransactionId", "Wallet support stores ledger context");
has("apps/pay-web/app/page.tsx", "Get help with this transaction", "transaction-level support action");
has("apps/pay-web/app/page.tsx", "setSupportLedgerTransactionId(row.transactionId)", "transaction help uses LedgerTransaction id, not LedgerEntry id");
has("apps/pay-web/app/page.tsx", "value={row.transactionId}", "support transaction selector uses canonical transaction id");
has("apps/pay-web/app/page.tsx", "LINKED DRIVE RIDE", "Wallet deep-link context banner");
has("apps/pay-web/app/page.tsx", "Open Operations case", "Wallet -> Operations support action");

// Operations retains canonical context between Support, Mobility and Finance.
has("services/platform-api/src/drive/routes.ts", "rideId:z.string().min(1).optional()", "admin Drive exact ride filter");
has("services/platform-api/src/drive/routes.ts", "id:q.rideId", "admin Drive ride id query");
has("apps/operations-web/app/support/page.tsx", "ops-v11-linked-context", "Support linked context workspace");
has("apps/operations-web/app/support/page.tsx", "Open Mobility", "Support -> Mobility handoff");
has("apps/operations-web/app/support/page.tsx", "Open Finance", "Support -> Finance handoff");
has("apps/operations-web/app/drive/page.tsx", "LINKED SUPPORT CONTEXT", "Mobility linked case focus");
has("apps/operations-web/app/drive/page.tsx", "Open support cases", "Mobility -> Support handoff");
has("apps/operations-web/app/drive/page.tsx", "Open finance context", "Mobility -> Finance handoff");
has("apps/operations-web/app/pay/page.tsx", "LINKED OPERATIONS CONTEXT", "Finance linked context focus");
has("apps/operations-web/app/pay/page.tsx", "focusLedgerTransactionId", "Finance exact ledger context");
has("apps/operations-web/app/pay/page.tsx", "ops-v11-ledger-link", "Finance -> Support ledger handoff");
has("services/platform-api/src/operations/routes.ts", 'app.get("/v1/operations/pay/ledger-transactions/:transactionId"', "Finance exact ledger lookup API");
has("services/platform-api/src/operations/routes.ts", 'requirePermission(request, "payment.read")', "ledger lookup remains payment.read gated");
has("apps/operations-web/app/pay/page.tsx", "CANONICAL LEDGER TRANSACTION", "Finance canonical ledger detail panel");
has("apps/operations-web/app/pay/page.tsx", "/v1/operations/pay/ledger-transactions/", "Finance loads exact ledger transaction");

// Responsive V11 visual system across web and native surfaces.
has("apps/drive-web/app/globals.css", "BAZAARA Drive V11", "Drive V11 theme marker");
has("apps/drive-web/app/globals.css", "#00c2b8", "Drive electric teal system");
has("apps/pay-web/app/globals.css", "BAZAARA Wallet V11", "Wallet V11 theme marker");
has("apps/pay-web/app/globals.css", "#00c2b8", "Wallet electric teal system");
has("apps/operations-web/app/globals.css", "BAZAARA Operations V11", "Operations V11 theme marker");
has("apps/operations-web/app/globals.css", "#00c2b8", "Operations electric teal system");
hasAny("apps/drive-rider-mobile/app/index.tsx", ["Wallet details", "&rideId=${encodeURIComponent(ride.ride.id)}"], "Rider mobile exact ride payment handoff in Account");
hasAny("apps/drive-rider-mobile/app/index.tsx", ["Get trip help", "section=support&category=DRIVE&rideId="], "Rider mobile trip-linked support handoff");
hasAny("apps/drive-rider-mobile/app/index.tsx", ['#071423', "backgroundColor:'#fff'"], "Rider mobile current theme");
has("apps/drive-driver-mobile/app/index.tsx", '#071423', "Driver mobile midnight navy");
has("apps/drive-driver-mobile/app/index.tsx", '#00C2B8', "Driver mobile teal action system");
has("apps/pay-mobile/app/index.tsx", "LATEST DRIVE RIDE", "Wallet mobile ride context");
has("apps/pay-mobile/app/index.tsx", "openDriveSupport", "Wallet mobile Drive support handoff");
has("apps/pay-mobile/app/index.tsx", '#00C2B8', "Wallet mobile teal action system");

// Permission boundary must stay intact: Mobility does not silently gain finance authority.
has("services/platform-api/src/drive/routes.ts", 'requirePermission(request,"payment.read")', "finance read remains permission-gated");
has("services/platform-api/src/drive/routes.ts", 'requirePermission(request,"payout.manage")', "payout/reconciliation remains finance-gated");

// Hygiene on changed files.
for (const file of [
  "apps/drive-web/app/page.tsx",
  "apps/pay-web/app/page.tsx",
  "apps/operations-web/app/drive/page.tsx",
  "apps/operations-web/app/pay/page.tsx",
  "apps/operations-web/app/support/page.tsx",
  "apps/drive-rider-mobile/app/index.tsx",
  "apps/drive-driver-mobile/app/index.tsx",
  "apps/pay-mobile/app/index.tsx",
  "services/platform-api/src/support/service.ts",
  "services/platform-api/src/support/routes.ts",
]) {
  no(file, 'href="#"', "placeholder hash link");
  no(file, "javascript:", "javascript pseudo-link");
  no(file, "TODO_V11", "V11 TODO marker");
}

if (failures.length) {
  console.error(`Drive/Wallet/Operations V11 validation FAILED (${failures.length} failures, ${checks.length} passed)`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`Drive/Wallet/Operations V11 validation PASS (${checks.length} checks).`);
