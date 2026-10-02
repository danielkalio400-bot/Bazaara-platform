import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
function must(condition, message) {
  if (condition) checks.push(message);
  else failures.push(message);
}
function has(file, marker, label = marker) {
  must(exists(file), `${file}: exists`);
  if (exists(file)) must(read(file).includes(marker), `${file}: ${label}`);
}
function hasAny(file, markers, label) {
  must(exists(file), `${file}: exists`);
  if (exists(file)) must(markers.some(marker => read(file).includes(marker)), `${file}: ${label}`);
}
function count(file, marker) {
  if (!exists(file)) return 0;
  return read(file).split(marker).length - 1;
}

// Preserve the mature Business/Operations baseline.
for (const file of [
  "apps/business-web/app/revenue/page.tsx",
  "apps/business-web/app/analytics/page.tsx",
  "apps/business-web/app/reports/page.tsx",
  "apps/business-web/app/pricing/page.tsx",
  "apps/business-web/app/subscriptions/page.tsx",
  "apps/business-web/app/payments/page.tsx",
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

// Database / ledger bridge.
has("packages/db/prisma/schema.prisma", "model DriveDriverPayout", "DriveDriverPayout model");
has("packages/db/prisma/schema.prisma", "@@unique([driverUserId, idempotencyKey])", "idempotent driver payout key");
has("packages/db/prisma/migrations/20260921193000_drive_wallet_operations_link/migration.sql", 'CREATE TABLE "DriveDriverPayout"', "payout migration");
has("packages/contracts/src/index.ts", "payouts: DriveDriverPayoutContract[]", "shared driver-wallet payout contract");
has("services/platform-api/src/drive/service.ts", "export async function getDriverWalletReconciliation", "driver reconciliation service");
has("services/platform-api/src/drive/service.ts", "export async function moveDriverEarningsToWallet", "driver payout service");
has("services/platform-api/src/drive/service.ts", 'kind: "DRIVE_DRIVER_PAYOUT_TO_WALLET"', "ledger payout journal");
has("services/platform-api/src/drive/service.ts", "export async function getDriveFinanceSnapshot", "Drive finance snapshot");

// Rider/driver/user APIs.
has("services/platform-api/src/drive/routes.ts", 'app.get("/v1/drive/wallet"', "unified rider/driver wallet context");
has("services/platform-api/src/drive/routes.ts", 'app.get("/v1/drive/rides"', "ride history route");
has("services/platform-api/src/drive/routes.ts", 'app.get("/v1/drive/driver/wallet"', "driver wallet route");
has("services/platform-api/src/drive/routes.ts", 'app.post("/v1/drive/driver/payouts"', "self-service earnings payout");
has("services/platform-api/src/drive/routes.ts", 'app.get("/v1/admin/drive/finance"', "finance read route");
has("services/platform-api/src/drive/routes.ts", 'requirePermission(request,"payment.read")', "finance read permission");
has("services/platform-api/src/drive/routes.ts", 'requirePermission(request,"payout.manage")', "payout management permission");
has("services/platform-api/src/drive/routes.ts", 'app.post("/v1/admin/drive/drivers/:userId/reconcile-wallet"', "controlled ledger reconciliation");
must(count("services/platform-api/src/drive/routes.ts", 'app.get("/v1/drive/wallet"') === 1, "routes: one canonical Drive wallet route");
must(count("services/platform-api/src/drive/routes.ts", 'app.post("/v1/drive/driver/payouts"') === 1, "routes: one canonical self-service payout route");

// Operations consolidation.
has("services/platform-api/src/operations/routes.ts", "getDriveFinanceSnapshot()", "Drive finance included in Operations Pay API");
has("services/platform-api/src/operations/routes.ts", "driveFinance,", "Drive finance response contract");
has("apps/operations-web/app/pay/page.tsx", "DRIVE MONEY MOVEMENT", "Drive finance control plane");
has("apps/operations-web/app/pay/page.tsx", "/payout-to-wallet", "Operations payout action");
has("apps/operations-web/app/pay/page.tsx", "/reconcile-wallet", "Operations reconciliation action");
has("apps/operations-web/app/drive/page.tsx", "Open Pay / Finance", "Drive-to-Finance navigation");
has("services/platform-api/src/support/routes.ts", '"DRIVE"', "Drive support category accepted");
has("apps/operations-web/app/support/page.tsx", 'value="DRIVE"', "Drive support queue filter");
has("apps/pay-web/app/page.tsx", 'setSupportCategory("DRIVE")', "Wallet-to-Drive support handoff");

// Wallet web/mobile and Drive rider/driver surfaces.
has("apps/pay-web/app/page.tsx", "DRIVE + WALLET", "Wallet Web Drive workspace");
has("apps/pay-web/app/page.tsx", "/v1/drive/driver/payouts", "Wallet Web payout action");
has("apps/pay-mobile/app/index.tsx", "One money rail", "Wallet Mobile Drive workspace");
has("apps/pay-mobile/app/index.tsx", "Move Drive earnings to Wallet", "Wallet Mobile payout action");
has("apps/drive-web/app/page.tsx", "moveDriverEarnings()", "Drive Web payout action");
has("apps/drive-web/app/page.tsx", "/v1/drive/wallet", "Drive Web Wallet context");
// Account moved into a dedicated component. Verify actual Wallet balance, funding,
// refresh, authenticated handoff and the retained insufficient-balance recovery.
has("apps/drive-rider-mobile/app/index.tsx", "<DriveAccountMobile", "Rider Mobile Account mounted");
has("apps/drive-rider-mobile/app/index.tsx", "wallet={wallet ?", "Rider Mobile passes live Drive wallet balance to Account");
has("apps/drive-rider-mobile/app/index.tsx", "onRefresh={() => void refresh()}", "Rider Mobile exposes wallet refresh to Account");
has("apps/drive-rider-mobile/app/index.tsx", 'AppState.addEventListener("change"', "Rider Mobile refreshes after returning from Wallet");
has("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx", "BAZAARA WALLET", "Account displays BAZAARA Wallet workspace");
has("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx", "formatDriveWalletAmount(wallet.availableMinor, wallet.currency)", "Account displays real available balance");
has("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx", "Add money in BAZAARA Wallet", "Account offers real Wallet funding link");
has("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx", "onRefresh", "Account offers balance refresh");
has("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx", "if (!signed) { onLogin(); return; }", "Account protects funding behind BazID login");
has("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx", "await Linking.openURL(", "Account invokes the real Wallet deep-link");
has("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx", "/?section=drive", "Account opens BAZAARA Pay Drive funding workspace");
hasAny("apps/drive-rider-mobile/app/index.tsx", ["Add money in BAZAARA Wallet", "Add funds"], "Rider Mobile funding recovery at confirmation");
has("apps/drive-driver-mobile/app/index.tsx", "DRIVE + WALLET", "Driver Mobile Wallet integration");
has("apps/drive-driver-mobile/app/index.tsx", "Move earnings to Wallet", "Driver Mobile payout action");

// Local environment contract must allow both web apps to mutate the API.
has(".env.example", "http://localhost:3009", "Drive origin");
has(".env.example", "http://localhost:3010", "Wallet origin");
has(".env.example", "NEXT_PUBLIC_PAY_WEB_BASE_URL=http://localhost:3010", "Drive -> Wallet web URL");
has(".env.example", "NEXT_PUBLIC_DRIVE_BASE_URL=http://localhost:3009", "Wallet -> Drive web URL");
has(".env.example", "EXPO_PUBLIC_DRIVE_WEB_BASE_URL=http://localhost:3009", "native Wallet -> Drive web URL");
has("ENV-KEYS-ONLY.txt", "NEXT_PUBLIC_DRIVE_BASE_URL", "documented Drive web URL key");
has("ENV-KEYS-ONLY.txt", "EXPO_PUBLIC_DRIVE_WEB_BASE_URL", "documented native Drive web URL key");
for (const file of [
  "apps/bazid-web/app/bazid/register/page.tsx",
  "apps/bazid-web/app/bazid/sign-in/page.tsx",
  "apps/bazid-web/app/account/account-privacy-client.tsx",
]) {
  has(file, 'process.env.NEXT_PUBLIC_DRIVE_BASE_URL ?? "http://localhost:3009"', "BazID Drive fallback uses Drive port");
  must(!read(file).includes('process.env.NEXT_PUBLIC_DRIVE_BASE_URL ?? "http://localhost:3011"'), `${file}: no Pharmacy-port Drive fallback`);
  has(file, 'process.env.NEXT_PUBLIC_PHARMACY_BASE_URL ?? "http://localhost:3011"', "BazID Pharmacy fallback uses Pharmacy port");
  must(!read(file).includes('process.env.NEXT_PUBLIC_PHARMACY_BASE_URL ?? "http://localhost:3009"'), `${file}: no Drive-port Pharmacy fallback`);
}
// The local .bazaara-dev runner is generated/ignored and must not be required in source archives.
// Validate the tracked launcher plus the public origin configuration instead.
has("scripts/start-bazaara-local.ps1", "Port = 3009", "tracked local launcher includes Drive");
has("scripts/start-bazaara-local.ps1", "Port = 3010", "tracked local launcher includes Wallet");

// Basic static hygiene on the changed integration files.
for (const file of [
  "apps/drive-web/app/page.tsx",
  "apps/drive-rider-mobile/app/index.tsx",
  "apps/drive-driver-mobile/app/index.tsx",
  "apps/pay-web/app/page.tsx",
  "apps/pay-mobile/app/index.tsx",
  "apps/operations-web/app/pay/page.tsx",
  "services/platform-api/src/drive/routes.ts",
  "services/platform-api/src/drive/service.ts",
]) {
  const source = read(file);
  must(!source.includes('href="#"'), `${file}: no placeholder hash link`);
  must(!source.includes("javascript:"), `${file}: no javascript pseudo-link`);
  must(!source.includes("TODO_V10"), `${file}: no V10 TODO marker`);
}

if (failures.length) {
  console.error(`Drive/Wallet/Operations V10 validation FAILED (${failures.length} failures, ${checks.length} passed)`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`Drive/Wallet/Operations V10 validation PASS (${checks.length} checks).`);
