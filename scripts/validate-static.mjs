import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const notes = [];
const fail = (message) => failures.push(message);
const note = (message) => notes.push(message);
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));

function walk(dir, predicate, out = []) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return out;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "build", ".expo", ".git", ".bazaara-backups", ".bazaara-dev"].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, predicate, out);
    else if (predicate(rel)) out.push(rel);
  }
  return out;
}

// JSON/config validity.
for (const file of walk(".", (name) => name.endsWith(".json"))) {
  try { JSON.parse(read(file)); } catch (error) { fail(`${file}: invalid JSON (${error instanceof Error ? error.message : error})`); }
}

// Required architecture and fixed ports.
const webPorts = {
  "business-web": 3001,
  "operations-web": 3002,
  "shopping-web": 3003,
  "bazid-web": 3004,
  "bazaara-web": 3005,
  "grocery-web": 3006,
  "food-web": 3007,
  "logistics-web": 3008,
  "drive-web": 3009,
  "pay-web": 3010,
  "pharmacy-web": 3011,
  "bazasport-web": 3012,
};
for (const [app, port] of Object.entries(webPorts)) {
  const packageFile = `apps/${app}/package.json`;
  if (!fs.existsSync(path.join(root, packageFile))) { fail(`${packageFile}: missing`); continue; }
  const pkg = json(packageFile);
  for (const scriptName of ["dev", "start"]) {
    const script = pkg.scripts?.[scriptName] ?? "";
    if (!new RegExp(`(?:-p|--port)\\s*${port}(?:\\s|$)`).test(script)) fail(`${app}: ${scriptName} must bind port ${port}`);
  }
}
if (!/PORT:\s*z\.coerce\.number\(\)[\s\S]*?default\(4000\)/.test(read("services/platform-api/src/config.ts"))) {
  fail("Platform API config must default to port 4000");
}

const requiredPaths = [
  "services/platform-api/package.json",
  "packages/db/package.json",
  "packages/contracts/package.json",
  "packages/security/package.json",
  "packages/design-system/package.json",
  "packages/ledger/package.json",
  "packages/api-client/package.json",
  "packages/bazid-client/package.json",
  "packages/mobile-ui/package.json",
];
for (const item of requiredPaths) if (!fs.existsSync(path.join(root, item))) fail(`${item}: required architecture path missing`);


// Fixed vertical identity colors must remain present in the web clients.
const verticalColors = {
  "shopping-web": ["#00B8FF", "#2563FF"],
  "grocery-web": ["#2F8F62", "#3FA46F"],
  "food-web": ["#FF3D24", "#FF7A00"],
  "logistics-web": ["#00F5FF", "#00E0B8"],
  "drive-web": ["#050505"],
  "pay-web": ["#FFD600", "#FFB800"],
  "business-web": ["#7C3CFF", "#B15CFF"],
  "pharmacy-web": ["#FF7A00", "#FF9D00"],
  "bazasport-web": ["#39FF14", "#00E676"],
};
for (const [app, colors] of Object.entries(verticalColors)) {
  const cssFiles = walk(`apps/${app}`, (name) => name.endsWith(".css"));
  const combined = cssFiles.map(read).join("\n").toUpperCase();
  for (const color of colors) if (!combined.includes(color.toUpperCase())) fail(`${app}: fixed identity color ${color} missing`);
  if (app === "drive-web" && !combined.includes("#FFF") && !combined.includes("#FFFFFF")) fail("drive-web: white identity color missing");
}

// Workspace package-lock parity and links.
const lock = json("package-lock.json");
for (const base of ["apps", "services", "packages"]) {
  for (const entry of fs.readdirSync(path.join(root, base), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rel = `${base}/${entry.name}`;
    const packageFile = `${rel}/package.json`;
    if (!fs.existsSync(path.join(root, packageFile))) continue;
    const pkg = json(packageFile);
    const record = lock.packages?.[rel];
    if (!record) { fail(`${rel}: missing package-lock workspace record`); continue; }
    for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const normalizeDependencyMap = (value) =>
        Object.fromEntries(
          Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right))
        );

      const packageDependencies = normalizeDependencyMap(pkg[section]);
      const lockedDependencies = normalizeDependencyMap(record[section]);

      if (JSON.stringify(packageDependencies) !== JSON.stringify(lockedDependencies)) {
        fail(`${rel}: package-lock ${section} differs from package.json`);
      }
    }
    if (pkg.name) {
      const link = lock.packages?.[`node_modules/${pkg.name}`];
      if (!link || link.link !== true || link.resolved !== rel) fail(`${rel}: invalid package-lock workspace link for ${pkg.name}`);
    }
  }
}

// Relative import resolution (generated Next .next declarations excluded).
const sourceFiles = [
  ...walk("apps", (name) => /\.(?:ts|tsx|js|jsx|mjs)$/.test(name) && !name.endsWith("next-env.d.ts")),
  ...walk("packages", (name) => /\.(?:ts|tsx|js|jsx|mjs)$/.test(name)),
  ...walk("services", (name) => /\.(?:ts|tsx|js|jsx|mjs)$/.test(name)),
  ...walk("scripts", (name) => /\.(?:js|mjs)$/.test(name)),
];
function importExists(from, specifier) {
  const base = path.resolve(root, path.dirname(from), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.json`, `${base}.css`, `${base}.scss`, path.join(base, "index.ts"), path.join(base, "index.tsx"), path.join(base, "index.js")];
  if (specifier.endsWith(".js")) {
    const without = base.slice(0, -3);
    candidates.push(`${without}.ts`, `${without}.tsx`, path.join(without, "index.ts"), path.join(without, "index.tsx"));
  }
  return candidates.some((candidate) => fs.existsSync(candidate));
}
const importPattern = /(?:from\s*|import\s*\()\s*["'](\.{1,2}\/[^"']+)["']/g;
for (const file of sourceFiles) {
  const contents = read(file);
  for (const match of contents.matchAll(importPattern)) if (!importExists(file, match[1])) fail(`${file}: unresolved relative import ${match[1]}`);
}

// The Platform API is emitted as native Node ESM; runtime relative imports must carry .js.
for (const file of walk("services/platform-api/src", (name) => name.endsWith(".ts"))) {
  const contents = read(file);
  for (const match of contents.matchAll(importPattern)) {
    if (!/\.(?:js|json)$/.test(match[1])) fail(`${file}: Node ESM runtime import must end in .js/.json (${match[1]})`);
  }
}

// Native clients / PKCE callback scheme parity.
const nativeClients = {
  "shopping-mobile": ["bazaara-shopping-mobile", "bazaara-shopping"],
  "grocery-mobile": ["bazaara-grocery-mobile", "bazaara-grocery"],
  "food-mobile": ["bazaara-food-mobile", "bazaara-food"],
  "logistics-mobile": ["bazaara-logistics-mobile", "bazaara-logistics"],
  "logistics-courier-mobile": ["bazaara-logistics-courier-mobile", "bazaara-courier"],
  "drive-rider-mobile": ["bazaara-drive-rider-mobile", "bazaara-drive"],
  "drive-driver-mobile": ["bazaara-drive-driver-mobile", "bazaara-drive-driver"],
  "pay-mobile": ["bazaara-pay-mobile", "bazaara-pay"],
  "business-mobile": ["bazaara-business-mobile", "bazaara-business"],
  "pharmacy-mobile": ["bazaara-pharmacy-mobile", "bazaara-pharmacy"],
  "bazasport-mobile": ["bazaara-bazasport-mobile", "bazaara-sport"],
};
const nativeService = read("services/platform-api/src/identity/native-service.ts");
const bazidClient = read("packages/bazid-client/src/index.ts");
for (const [dir, [clientId, scheme]] of Object.entries(nativeClients)) {
  const appFile = `apps/${dir}/app.json`;
  const easFile = `apps/${dir}/eas.json`;
  if (!fs.existsSync(path.join(root, appFile))) { fail(`${appFile}: missing`); continue; }
  const expo = json(appFile).expo;
  if (expo?.scheme !== scheme) fail(`${appFile}: expected scheme ${scheme}`);
  if (!expo?.android?.package) fail(`${appFile}: android.package missing`);
  if (!expo?.ios?.bundleIdentifier) fail(`${appFile}: ios.bundleIdentifier missing`);
  if (!fs.existsSync(path.join(root, easFile))) fail(`${easFile}: missing release profile`);
  if (!nativeService.includes(`"${clientId}"`) || !nativeService.includes(`scheme: "${scheme}"`)) fail(`Platform BazID registry missing ${clientId}/${scheme}`);
  if (!bazidClient.includes(`clientId: "${clientId}"`) || !bazidClient.includes(`scheme: "${scheme}"`)) fail(`Shared BazID client registry missing ${clientId}/${scheme}`);
}

// CORS/local origin parity.
const configSource = read("services/platform-api/src/config.ts");
for (const port of Object.values(webPorts)) if (!configSource.includes(`http://localhost:${port}`)) fail(`WEB_ORIGINS local default missing http://localhost:${port}`);
if (!configSource.includes('process.loadEnvFile(rootEnvPath)')) fail("Platform API must load the repository .env when present");
const envExample = read(".env.example");
for (const required of [
  "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000",
  "NEXT_PUBLIC_BAZID_BASE_URL=http://localhost:3004",
  "NEXT_PUBLIC_SHOPPING_WEB_BASE_URL=http://localhost:3003",
  "NEXT_PUBLIC_GROCERY_WEB_BASE_URL=http://localhost:3006",
  "NEXT_PUBLIC_FOOD_WEB_BASE_URL=http://localhost:3007",
]) if (!envExample.includes(required)) fail(`.env.example missing ${required}`);

// Portal links.
const portal = read("apps/bazaara-web/app/page.tsx");
for (const [app, port] of Object.entries(webPorts)) {
  if (["bazaara-web", "operations-web", "bazid-web"].includes(app)) continue;
  if (!portal.includes(`http://localhost:${port}`)) fail(`Bazaara portal missing localhost link for ${app} (${port})`);
}
if (!portal.includes("http://localhost:3004/bazid/sign-in")) fail("Bazaara portal missing BazID sign-in link");

// Production domain map completeness.
const domains = json("deployment/production-domains.json");
for (const key of ["portal", "api", "bazid", "business", "operations", "shopping", "grocery", "food", "logistics", "drive", "pay", "pharmacy", "bazasport"]) {
  if (typeof domains[key] !== "string" || !domains[key].startsWith("https://")) fail(`production-domains.json: ${key} must be an HTTPS URL`);
}

// Regulated boundaries must default disabled.
if (!/PHARMACY_PRESCRIPTION_ENABLED:[\s\S]*?default\("false"\)/.test(configSource)) fail("Prescription workflow must default disabled");
if (!/SPORTS_REAL_MONEY_BETTING_ENABLED:[\s\S]*?z\.enum\(\["false", "0"\]\)/.test(configSource)) fail("Real-money betting configuration must reject enabled values");

// Consolidated current-schema baseline + incremental migration safety.
// The platform was intentionally rebased after the Prisma P3006 shadow-history repair;
// do not require the superseded 20260915230000 migration filename.
const baselineMigrationFile = "packages/db/prisma/migrations/20260921112622_current_schema_baseline/migration.sql";
if (!fs.existsSync(path.join(root, baselineMigrationFile))) fail(`${baselineMigrationFile}: current schema baseline missing`);
else {
  const baselineSql = read(baselineMigrationFile);
  if (!baselineSql.includes('CREATE TABLE "OutboxEvent"') || !baselineSql.includes('"processingStartedAt"')) fail("Current baseline is missing Outbox stale-claim recovery state");
}
const incrementalMigrationFiles = walk("packages/db/prisma/migrations", (name) => name.endsWith("migration.sql"));
for (const migrationFile of incrementalMigrationFiles) {
  if (migrationFile === baselineMigrationFile) continue;
  const sql = read(migrationFile);
  const withoutComments = sql.replace(/--.*$/gm, "");
  if (/\b(?:DROP\s+DATABASE|DROP\s+SCHEMA|TRUNCATE)\b/i.test(withoutComments)) fail(`${migrationFile}: unsafe destructive database/schema statement`);
}
const driveWalletMigration = "packages/db/prisma/migrations/20260921193000_drive_wallet_operations_link/migration.sql";
if (!fs.existsSync(path.join(root, driveWalletMigration))) fail(`${driveWalletMigration}: Drive/Wallet integration migration missing`);
else if (!read(driveWalletMigration).includes('CREATE TABLE "DriveDriverPayout"')) fail("Drive/Wallet integration migration is missing DriveDriverPayout");

// Known Roadmap-79 API/client contract mismatches must remain aligned.
const logisticsWeb = read("apps/logistics-web/app/page.tsx");
const logisticsApi = read("services/platform-api/src/logistics/routes.ts");
if (/etaMinutes\s*\.\s*(?:min|max)/.test(logisticsWeb)) fail("Logistics Web still treats etaMinutes as a range");
if (!logisticsApi.includes("etaMinutes: q.etaMinutes")) fail("Logistics API quote contract is not a single etaMinutes number");
if (!logisticsWeb.includes("result.booking.trackingCode")) fail("Logistics Web is not consuming { booking, verification }");
const driveWeb = read("apps/drive-web/app/page.tsx");
if (!driveWeb.includes("DrivePricingQuoteContract") || !driveWeb.includes("totalMinor")) fail("Drive Web is not consuming the shared server pricing contract");


// Final integration hardening gates.
const outboxWorker = read("services/platform-api/src/webhooks/worker.ts");
if (!outboxWorker.includes('{ processingStartedAt: null }') || !outboxWorker.includes('processingStartedAt: { lt: cutoff }')) fail("Outbox worker does not recover both legacy/null and timed-out PROCESSING claims");
if (!outboxWorker.includes('existing?.status === "DELIVERED"')) fail("Webhook worker does not suppress duplicate endpoint/event deliveries");
const authSource = read("services/platform-api/src/auth.ts");
if (!authSource.includes('requireNativeScope')) fail("Native-scope authorization helper missing");
if (!logisticsApi.includes('requireNativeScope(auth, "logistics.courier")') || !logisticsApi.includes('pickupVerificationHash') || !logisticsApi.includes('deliveryVerificationHash')) fail("Logistics courier authorization/verification hardening missing");
const driveApi = read("services/platform-api/src/drive/routes.ts");
if (!driveApi.includes('requireNativeScope(auth, "drive.driver")') || !driveApi.includes('riderPinHash') || !driveApi.includes('assertDriverTransition')) fail("Drive driver authorization/PIN/status hardening missing");

// Current-platform startup safety.
// The historical root Install-Bazaara-Roadmap79.ps1 was a one-time migration/repair
// artifact and is intentionally not required by the permanent bazaara-platform repo.
for (const script of ["scripts/start-bazaara-local.ps1", "scripts/validate-roadmap79.ps1"]) {
  if (!fs.existsSync(path.join(root, script))) fail(`${script}: missing current platform integration script`);
}

// If the legacy installer is still present in an older checkout, keep its destructive
// command safety checks. Its absence in the cleaned permanent repo is valid.
const legacyInstallerPath = path.join(root, "Install-Bazaara-Roadmap79.ps1");
if (fs.existsSync(legacyInstallerPath)) {
  const installer = fs.readFileSync(legacyInstallerPath, "utf8");
  for (const forbidden of [/docker\s+compose\s+down\s+-v/i, /docker\s+volume\s+(?:rm|prune)/i, /prisma\s+migrate\s+reset/i, /npm\s+audit\s+fix\s+--force/i]) {
    if (forbidden.test(installer)) fail(`Legacy installer contains forbidden destructive command: ${forbidden}`);
  }
  if (!installer.includes('pg_dump') || !installer.includes('Backup-ConfiguredPostgres')) {
    fail("Legacy installer must create a PostgreSQL pre-migration backup");
  }
  if (!installer.includes('Stop-RepoNodeProcesses') || !installer.includes('node_modules\\.prisma\\client')) {
    fail("Legacy installer missing scoped Windows Prisma-lock recovery");
  }
} else {
  note("Legacy Install-Bazaara-Roadmap79.ps1 is absent as expected in the cleaned permanent platform repo");
}

// CI scripts referenced by workflows must exist.
const rootPackage = json("package.json");
for (const script of ["db:validate", "db:generate", "db:migrate:deploy", "validate:static", "typecheck", "build:api", "test", "build:web"]) if (!rootPackage.scripts?.[script]) fail(`package.json missing CI script ${script}`);

if (notes.length) {
  console.log("Static validation notes:");
  for (const item of notes) console.log(`  - ${item}`);
}
if (failures.length) {
  console.error(`Static validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const item of failures) console.error(`  - ${item}`);
  process.exit(1);
}
console.log(`Static validation PASS (${sourceFiles.length} source files; ${Object.keys(webPorts).length} web ports; ${Object.keys(nativeClients).length} native clients).`);
