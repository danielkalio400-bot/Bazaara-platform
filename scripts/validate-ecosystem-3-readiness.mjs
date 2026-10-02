#!/usr/bin/env node
// Dependency-free E3 architectural audit; run at repository root.
// --audit (default) prints blockers and exits 0 when the baseline is readable;
// --enforce exits 2 until production prerequisites are actually satisfied.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const errors = [];
const blockers = [];
const warnings = [];
const exists = (p) => fs.existsSync(path.join(root, p));
const contains = (p, token) => exists(p) && read(p).includes(token);
let manifest, build, ports, domains, e2;
try {
  manifest = json('ecosystems/ecosystem-3/manifest.json');
  e2 = json('ecosystems/ecosystem-2/manifest.json');
  build = json('ecosystems/build-state.json');
  ports = json('ecosystems/port-map.json');
  domains = json('deployment/production-domains.json');
} catch (e) { console.error(`FATAL: ${e.message}`); process.exit(1); }

if (manifest.ecosystem !== 3 || !Array.isArray(manifest.products)) errors.push('Invalid E3 manifest');
for (const n of ['Bazaara.com', 'Bmail', 'Docs', 'Box', 'Bazaara AI', 'Workspace']) {
  if (!manifest.products.includes(n)) errors.push(`Core E3 product missing: ${n}`);
}
for (const p of ['apps/bazid-web', 'apps/bazaara-web', 'services/platform-api', 'packages/db/prisma/schema.prisma']) {
  if (!exists(p)) errors.push(`Existing shared foundation not found: ${p}`);
}
if (ports['3005']?.workspace !== 'apps/bazaara-web') errors.push('Port 3005 does not point to the existing platform gateway');
if (ports['4000']?.workspace !== 'services/platform-api') errors.push('Port 4000 does not point to the Platform API');
if (manifest.status === 'RESERVED_NOT_BUILDING') blockers.push('E3 manifest is RESERVED_NOT_BUILDING');
if (build.gates?.['ecosystem-3']?.startsWith('BLOCKED')) blockers.push('E3 integration is blocked by build-state gate');
if (e2.status !== 'STABLE' && e2.status !== 'COMPLETE') blockers.push(`E2 is not marked stable (current: ${e2.status})`);
if (!exists('apps/search-web/package.json')) blockers.push('No dedicated E3 Search web runtime currently present');
if (!exists('services/search-api/package.json')) blockers.push('No dedicated Search API currently present');
if (!exists('apps/workspace-web/package.json')) blockers.push('No E3 Workspace runtime currently present');
const db = read('packages/db/prisma/schema.prisma');
const identity = read('services/platform-api/src/identity/service.ts');
if (!/model\s+BmailAlias\s*\{/.test(db) || !identity.includes('bmail')) blockers.push('BazID Bmail alias reservation not implemented in baseline schema/registration flow');
if (contains('services/platform-api/src/app.ts', 'contentSecurityPolicy: false')) warnings.push('Platform API currently disables Content Security Policy; review before serving rich content');
if (domains.status === 'configuration-map-not-live-dns-proof') warnings.push('Production domains are configuration targets, not proof that DNS is live');
if (domains.portal === 'https://bazaara.com') warnings.push('bazaara.com is already assigned to Platform Home; choose separate Search route/subdomain');
// The E2 plan proposes 3013–3019; those allocations are not E3 collisions.
// E3's 3020/4020 are proposals until coordinated integration updates the canonical map.
for (const [port, expected] of [['3020', 'apps/search-web'], ['4020', 'services/search-api']]) {
  if (ports[port] && ports[port].workspace !== expected) {
    errors.push(`E3 proposed port ${port} is already allocated to ${ports[port].workspace ?? 'another service'}`);
  }
}
const allocatedE2 = Object.keys(ports).filter((k) => Number(k) >= 3013 && Number(k) <= 3019);
if (allocatedE2.length) warnings.push(`E2 web allocations present (${allocatedE2.join(', ')}) — keep E3 separate`);
console.log('BAZAARA Ecosystem 3 — architectural readiness audit');
console.log(`Reserved product count: ${manifest.products.length}`);
console.log(`Repository gate: ${build.gates?.['ecosystem-3']}`);
for (const x of errors) console.log(`ERROR: ${x}`);
for (const x of blockers) console.log(`BLOCKER: ${x}`);
for (const x of warnings) console.log(`REVIEW: ${x}`);
console.log(errors.length ? `RESULT: INVALID_BASELINE (${errors.length} error(s))` : blockers.length ? `RESULT: BASELINE_VALID__E3_NOT_RELEASE_READY (${blockers.length} blocker(s))` : 'RESULT: NO_STATIC_BLOCKERS__RUNTIME_TESTS_STILL_REQUIRED');
if (errors.length) process.exit(1);
if (process.argv.includes('--enforce') && blockers.length) process.exit(2);
