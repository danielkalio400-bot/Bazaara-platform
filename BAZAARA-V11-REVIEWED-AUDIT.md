# BAZAARA v11 — Source Audit and Launch Hardening

Audit date: 2026-09-22. Source: the user's `BAZAARA-V11-FULL-SOURCE.zip` archive.
This is a reviewed development source release, **not** certification of a deployed nine-module service.

## Source inventory

- Original archive: 1,195 ZIP entries, approximately 14.24 MB extracted, including historical `.bak-*` files and TypeScript build caches.
- npm workspaces monorepo: **12 web apps**, **11 Expo/React Native clients**, **one Fastify Platform API**, shared packages, PostgreSQL/Prisma, Redis and MinIO.
- All nine Ecosystem 1 module web app entry points are present. Business has **29** routed pages; Operations has **19** routed pages.
- Six active Prisma migration folders, beginning with the consolidated `20260921112622_current_schema_baseline` and ending with `20260922103000_drive_wallet_support_context`.
- Ecosystems 2 and 3 remain reserved in this source. Portal listings and domain configuration do not establish functioning applications or DNS deployments.

## Confirmed corrections in this reviewed release

1. **Fresh-source validation:** V10 Drive/Wallet/Operations validator previously failed because it expected `.bazaara-dev/run-platform-api.ps1`, which is generated locally and excluded by the collection script. Validation now checks the tracked permanent startup launcher. This removes two false failures without suppressing Drive/Wallet port checks.
2. **Local infrastructure configuration:** `.env.example` now matches `docker-compose.yml` for PostgreSQL (host port 55433, `bazaara` credentials), Redis (6380) and MinIO (9000, matching *local-only* sample credentials). Do not use sample credentials in production or overwrite a functioning existing `.env` without checking it.
3. **Bazasport mobile:** Replaced fabricated fixture cards and an inert button with calls to the public `/v1/sport/fixtures` and `/v1/sport/competitions` endpoints, sports filters, a working refresh control, and explicit empty/network-failure states. The real provider feed still must be connected and loaded into the database; empty schedules now show as empty rather than made-up results.
4. **Portal honesty:** Changed unconditionally displayed `ACTIVE` badges on all nine local app cards to `LOCAL APP` and clarified these are developer entry points, not live-production indicators.
5. **Production CORS boundary:** Production now rejects non-HTTPS or loopback `WEB_ORIGINS` and never auto-adds development aliases, even when a sample localhost origin is mistakenly retained. Real production deployments must configure explicit HTTPS origins.
6. **Safer PowerShell verification:** `-Full` no longer implicitly runs Prisma migrations. Existing database mutations require explicit `-ApplyMigrations`. The script also imports the root `.env` into its PowerShell process before workspace-level Prisma commands.
7. **Regression gate:** Added `npm run validate:v11-hardening` to `validate:current-release`, asserting these changes and all nine module web entry points.

No existing migration SQL or Prisma baseline was changed. Existing `.env`, `node_modules`, database volumes, provider credentials and local generated files are not included in the patch.

## What was actually tested here

`npm run validate:current-release` **PASS** after the above changes:
- Static repository: 563 source files, 12 web ports, 11 native clients.
- Grocery/Food source audit: 3,191 assertions.
- Food connected checks; Drive/Pharmacy: 30 assertions.
- Grocery V5.5; Shopping responsive/cart checks.
- Business/Operations V9: 88 assertions and 209 button source checks.
- Drive/Wallet/Operations V10: 149 assertions; V11: 182 assertions.
- New launch-hardening: **34 assertions**.
- Updated TS/TSX source syntax parsing: **PASS** for Bazasport Mobile, Platform Portal and API config (TypeScript 5.8.3).

**Validation limitations:** These are mainly static/source-level checks. Dependencies are not bundled in the source archive and were not installed here, so this audit does not claim a successful workspace semantic TypeScript check, test suite, PostgreSQL migration execution, Next.js/Fastify release builds, Android compilation, E2E journeys, security penetration test or real provider connectivity.

## Remaining launch gates

- **Financial integrations:** The sample environment does not contain Paystack production credentials. Live funding, disbursements, settlement reconciliation and partner lending require provider onboarding and dedicated financial E2E tests. Keep `PAY_TEST_MODE=false` in production.
- **Pharmacy:** Prescription functionality is intentionally off by default. Licensed pharmacies/pharmacists, verification, prescription handling, privacy, cold-chain evidence and jurisdiction-specific approvals require operational validation.
- **Sports:** The existing API reads `SportsCompetition`/`SportsFixture` from PostgreSQL; no sports-provider fixture ingestion write path was found in the audited source. A licensed feed, ingestion worker, data-rights agreement and provider-monitoring are required for genuinely live scores and streams.
- **Maps, AI, Lens and messaging:** Individual shopping UI affordances and platform routes exist, but this audit did not establish that the full offline maps, live navigation, real model inference, universal visual search or cross-module translated messaging requirements are delivered end-to-end.
- **Operations:** Identity, support, finance and ride handoff source code exists, but all real merchant, driver, provider, phone/SMS and clinical partner journeys still need integration tests.
- **Release infrastructure:** `deployment/production-domains.json` is a desired domain map, not evidence of DNS, HTTPS hosting or app-store approval. Production deployment, observability, backup restores, accessibility and load tests remain separate acceptance gates.
- **Grocery fee decision:** The archived source defaults `GROCERY_SERVICE_FEE_BPS` to 1000 (10%) and constrains it to 10–15%. A previous requested 20% policy conflicts with the current V5.5 code. This release deliberately does not change production pricing without confirming which policy is authoritative.

## Windows VS Code verification

From the root of the reviewed source, with Node 22+, Docker Desktop and the correct `.env`:

```powershell
npm ci
npm run validate:current-release
.\scripts\verify-drive-wallet-operations-v11.ps1 -Full
```

`-Full` validates Prisma, generates the Prisma Client, typechecks the workspaces, runs unit tests and builds web/API; it **does not** touch the database migration history.

Only after backing up the intended development database and confirming its migration history:

```powershell
.\scripts\verify-drive-wallet-operations-v11.ps1 -ApplyMigrations
```

Then start the local application suite:

```powershell
.\scripts\start-bazaara-local.ps1
```

Portal: http://localhost:3005 · API: http://localhost:4000 · BazID: http://localhost:3004 · Business: http://localhost:3001 · Operations: http://localhost:3002.

**Do not run `prisma migrate reset` against a database containing user data.** Do not edit the applied baseline SQL or assume that the ZIP implies a production deployment.
