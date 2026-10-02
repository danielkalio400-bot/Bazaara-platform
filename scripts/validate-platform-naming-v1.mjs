import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));

function fail(message) {
  failures.push(message);
}

const naming = json("ecosystems/naming.json");
const ports = json("ecosystems/port-map.json");
const rootPackage = json("package.json");
const portal = read("apps/bazaara-web/app/page.tsx");
const portalNormalized = portal
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'");
const layout = read("apps/bazaara-web/app/layout.tsx");
const startup = read("scripts/start-bazaara-local.ps1");

if (rootPackage.name !== "bazaara-platform") fail("Root npm package must be bazaara-platform.");
if (!rootPackage.scripts?.["dev:platform"]) fail("package.json missing dev:platform alias.");
if (!rootPackage.scripts?.["dev:wallet"]) fail("package.json missing dev:wallet alias.");

if (ports["3005"]?.name !== "BAZAARA Platform Home") fail("Port 3005 must be BAZAARA Platform Home.");
if (ports["3005"]?.decision !== "KEEP_AND_REBRAND") fail("Port 3005 decision must remain KEEP_AND_REBRAND.");
if (ports["3010"]?.name !== "Wallet") fail("Port 3010 must be Wallet.");

for (const name of ["Shopping","Food","Grocery","Drive","Logistics","Wallet","Business","Pharmacy","Bazasport"]) {
  if (!portal.includes(`name: "${name}"`)) fail(`Platform Home missing canonical product name ${name}.`);
}

for (const marker of [
  "ONE PLATFORM · THREE ECOSYSTEMS",
  "Commerce & Everyday Life",
  "Social, Media & Communication",
  "Intelligence, Productivity & Infrastructure",
  "@bmail.com",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004/bazid/sign-in",
  "http://localhost:3006",
  "http://localhost:3007",
  "http://localhost:3008",
  "http://localhost:3009",
  "http://localhost:3010",
  "http://localhost:3011",
  "http://localhost:3012",
]) {
  if (!portalNormalized.includes(marker)) fail(`Platform Home missing marker: ${marker}`);
}

if (!layout.includes("BAZAARA — Platform Home")) fail("Platform Home metadata title missing.");
if (!startup.includes("Name = 'BAZAARA Platform'") || !startup.includes("Port = 3005")) {
  fail("Local startup must label port 3005 as BAZAARA Platform.");
}
if (!startup.includes("Name = 'Wallet'") || !startup.includes("Port = 3010")) {
  fail("Local startup must label port 3010 as Wallet.");
}

const forbiddenDisplayNames = [
  "Bazaara Shopping",
  "Bazaara Food",
  "Bazaara Grocery",
  "Bazaara Drive",
  "Bazaara Logistics",
  "Bazaara Pay",
  "BAZAARA PAY",
  "Bazaara Business",
  "Bazaara Pharmacy",
  "Bazaara GO",
  "Bazaara Go",
  "Bazaara Operations",
  "bazaara-ecosystem-1",
];

const skipDirs = new Set([
  "node_modules", ".next", ".turbo", "dist", "build", "coverage",
  ".git", "backups", "logs", "migration-manifests",
]);

const textExtensions = new Set([
  ".ts",".tsx",".js",".jsx",".mjs",".cjs",".json",".css",".md",".txt",
  ".ps1",".yml",".yaml",".prisma",".sql",
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const relative = path.relative(root, full).split(path.sep).join("/");
    if (relative === "scripts/validate-platform-naming-v1.mjs") continue;
    const content = fs.readFileSync(full, "utf8");
    for (const forbidden of forbiddenDisplayNames) {
      if (content.includes(forbidden)) {
        fail(`${relative}: legacy name remains: ${forbidden}`);
      }
    }
  }
}

walk(root);

if (naming.identityFoundation?.recommendedMailDomain !== "@bmail.com") {
  fail("BazID/Bmail foundation recommendation missing.");
}

if (failures.length) {
  console.error(`BAZAARA platform naming validation FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("BAZAARA platform naming validation PASS.");
