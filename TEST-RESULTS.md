# BAZAARA Platform V11 — validation results

## Complete source release validation

`npm run validate:current-release` passes in the V11 packaging workspace.

Executed results:

- Repository static validation: PASS — 562 source files, 12 web ports, 11 native clients.
- Grocery/Food V2: PASS — 3,191 checks.
- Food Connected V3: PASS.
- Drive/Pharmacy regression: PASS — 30 checks.
- Grocery Normal V5.5: PASS.
- Shopping V2.4 responsive audit: PASS.
- Shopping Cart V2.7: PASS.
- Business & Operations V9: PASS — 88 checks; 209 rendered buttons audited.
- Drive/Wallet/Operations V10: PASS — 149 checks.
- Drive/Wallet/Operations V11: PASS — 182 checks.

The V11 validator covers the new Prisma relations/migration, shared contracts, ownership-safe support API, Drive/Wallet support handoffs, Operations Support/Mobility/Finance context preservation, finance permission boundaries, mobile handoffs and V11 web/native visual-system markers.

## TypeScript/TSX syntax validation

The changed TypeScript/TSX files were parsed/transpiled with TypeScript 5.8.3 available in the packaging environment. The following changed surfaces parse successfully:

- Drive Web
- Wallet Web
- Operations Drive
- Operations Pay
- Operations Support
- Drive Rider Mobile
- Drive Driver Mobile
- Wallet Mobile
- Support service/routes
- Drive admin route
- Shared contracts

## Dependency-backed validation boundary

A fresh `npm ci` was attempted in this sandbox, but package retrieval did not complete. The stalled process was stopped and the partial `node_modules` directory was removed before packaging. Therefore this release does **not** claim that Prisma CLI generation, the full workspace semantic TypeScript build, Next.js/Fastify production builds, database migration execution or browser E2E ran in this packaging sandbox.

Run these on the canonical Windows development environment where npm dependencies, Docker/PostgreSQL and your `.env` are available:

```powershell
npm ci
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run typecheck
npm test
npm run build:web
npm run build:api
npm run validate:current-release
```

Or use:

```powershell
.\scripts\verify-drive-wallet-operations-v11.ps1 -Install -ApplyMigrations -Full
```

Use `migrate deploy`; do not use `migrate dev` against the consolidated baseline.
