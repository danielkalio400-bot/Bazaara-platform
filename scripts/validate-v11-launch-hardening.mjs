import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
let checks = 0;
function check(condition, description) {
  assert.ok(condition, description);
  checks++;
}

const env = read(".env.example");
const compose = read("docker-compose.yml");
check(compose.includes('"55433:5432"'), "Docker exposes PostgreSQL on port 55433");
check(env.includes("DATABASE_URL=postgresql://bazaara:bazaara@localhost:55433/bazaara"), "local database URL matches compose");
check(env.includes("REDIS_URL=redis://localhost:6380"), "local Redis URL matches compose");
check(env.includes("MINIO_ENDPOINT=http://localhost:9000"), "MinIO API URL matches compose");
check(env.includes("MINIO_ACCESS_KEY=bazaara-local"), "MinIO development access key matches compose");
check(env.includes("MINIO_SECRET_KEY=bazaara-local-only-change-me"), "MinIO development secret matches compose");

const mobileSports = read("apps/bazasport-mobile/app/index.tsx");
for (const endpoint of ["/v1/sport/fixtures", "/v1/sport/competitions"]) {
  check(mobileSports.includes(endpoint), `mobile sports uses ${endpoint}`);
}
for (const fabricated of ["North City", "United FC", "Lagos Waves", "Abuja Kings"]) {
  check(!mobileSports.includes(fabricated), `mobile sports does not show fabricated ${fabricated}`);
}
check(mobileSports.includes("onRefresh"), "native sports supports refresh");
check(mobileSports.includes("No fixtures available"), "native sports has genuine empty state");
check(mobileSports.includes("Check the Platform API"), "native sports has a connectivity error state");

const portal = read("apps/bazaara-web/app/page.tsx");
check(!portal.includes('<span className="live-pill">ACTIVE</span>'), "portal does not imply all modules are live");
check(portal.includes('<span className="live-pill">LOCAL APP</span>'), "portal distinguishes locally available apps from live production");

const config = read("services/platform-api/src/config.ts");
check(config.includes('if (env.NODE_ENV === "production")'), "production origin validation enabled");
check(config.includes('url.protocol !== "https:"'), "production origins require HTTPS");
check(config.includes('const localOriginAliasesEnabled = env.NODE_ENV !== "production";'), "local aliases remain disabled in production");

const verification = read("scripts/verify-drive-wallet-operations-v11.ps1");
check(verification.includes('if ($ApplyMigrations) {'), "migrate deploy requires explicit -ApplyMigrations");
check(verification.includes("Import-ProjectEnv"), "PowerShell verification imports root .env for Prisma");
check(!verification.includes('if ($ApplyMigrations -or $Full) {\n    Invoke-Step "Prisma schema validation"'), "Full does not implicitly apply migrations");

const legacyValidator = read("scripts/validate-drive-wallet-operations-v10.mjs");
check(!legacyValidator.includes('has(".bazaara-dev/run-platform-api.ps1"'), "validation does not require generated runner");
check(legacyValidator.includes('has("scripts/start-bazaara-local.ps1"'), "validation checks tracked launcher");

for (const dir of [
  "shopping", "food", "grocery", "drive", "logistics", "pay", "business", "pharmacy", "bazasport"
]) {
  check(exists(`apps/${dir}-web/app/page.tsx`) || (dir === "business" && exists("apps/business-web/app/page.tsx")), `web app present: ${dir}`);
}
console.log(`V11 launch-hardening validation PASS (${checks} assertions).`);
