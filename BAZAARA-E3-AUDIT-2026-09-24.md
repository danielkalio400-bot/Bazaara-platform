# BAZAARA Ecosystem 3 — current archive audit

**Archive received:** `Bazaara-Ecosystem-1.zip`, inspected 24 September 2026. Source archive retained unchanged. The starter patch is additive: it only introduces E3 architecture/backlog/contract documents and a dependency-free static readiness command.

## Executive finding

One npm-workspaces monorepo contains Next.js web, Expo mobile, Fastify Platform API, Prisma/PostgreSQL and shared BazID/security/ledger/design components. Ecosystem 3 already reserves **31 products** in its manifest but is **not implemented as runnable product code**. The build-state file explicitly blocks E3 until E2 is stable. Work can proceed as a **separate E3 design and prototyping branch**, but runtime integration and promotion must be coordinated with the other ecosystem branches.

## Evidence from the current archive

- ZIP: 1,372 file entries; roughly 42.1 MB uncompressed and 27.8 MB compressed.
- Packaged root includes 23 app directories (12 web, 11 mobile), one main Platform API, and eight reusable package directories.
- Redundant packaged content: two `.exe` installers comprise 23.87 MB compressed; 344 historical backup files comprise 1.5 MB compressed; 12 TypeScript build-info files comprise 0.41 MB compressed. Exclude from future source-only ZIPs after preserving history in git.
- `npm run validate:current-release`: **PASS** on this extracted archive under Node 22.16.0, including 595-file static scan; Grocery/Food 3,191 checks; Business/Operations 88 checks; Drive/Wallet/Operations V10 169 checks and V11 182 checks; latest Drive V12 checks.
- This is not a complete production certification. `node_modules` is absent. Full Prisma generation, production builds, dependency-backed semantic typecheck, DB migration execution and browser E2E were **not** completed in this audit environment.

## Integration issues requiring an explicit decision

1. **Search URL collision:** `apps/bazaara-web` already owns the BAZAARA platform homepage on localhost:3005, with `bazaara.com` reserved for it in the production-domain map. Put Search at `/search` or a dedicated subdomain; don't overwrite the gateway. Proposed (unallocated) `search.bazaara.com`, localhost:3013.
2. **Bmail identity gap:** the naming/manifest/docs describe a suggested `@bmail.com` alias, but the active BazID registration and Prisma model do not reserve a unique Bmail alias. Implement explicit user choice and a transactionally unique reservation before advertising ownership or provisioning real mailboxes.
3. **Scope/SSO expansion:** existing OIDC discovery lists Ecommerce/Drive/Pay/etc. scopes but not Search, Docs, Workspace or Bmail. Add reviewed E3 client registrations, scopes, audience validation and tenant-level authorization.
4. **Security headers and content:** API's `helmet` setup currently disables CSP. Review it for E3 content-rich surfaces. Preserve existing CSRF checks, origin controls, rate limits and authentication; add file scanning, content isolation, shared links/access control, and AI/tool boundaries.
5. **Data and deployment:** no E3 runtime workspaces, E3 migrations or search service exist in the archive. Its domain map explicitly says it is not live DNS proof. Search indexing, SMTP inbox infrastructure, collaboration and AI are major separate systems—not live features just because they appear on the platform homepage.
6. **Gate and parallelism:** `ecosystems/build-state.json` has E1 active and E2/E3 blocked. Current starter pack does not change that policy. Use an E3 feature branch and merge through shared architecture and CI checks.

## Proposed first integrated product

**BAZAARA Search:** a standalone responsive Search web app (mobile/tablet/desktop) and typed search API/provider abstraction, designed in original navy/white/teal BAZAARA style. Initial query/provider handling must be genuine; use visible empty/error/loading states before search infrastructure exists. Privacy claims must be enforced by provider, logging, retention and telemetry settings—not just a visual toggle. Keep Shopping inventory search separate from global web search.

Then deliver Workspace shell, Box, Docs, and their identity/permission infrastructure. Implement actual Bmail delivery only after domain ownership and MX/SPF/DKIM/DMARC, abuse controls, mail security and mailbox operations are verified.

## Additive patch contents

- `ecosystems/ecosystem-3/ARCHITECTURE-BASELINE.md`: boundaries, domains, integration routes, security baseline.
- `ecosystems/ecosystem-3/IMPLEMENTATION-BACKLOG.md`: phase-by-phase deliverables and definition of done.
- `ecosystems/ecosystem-3/SERVICE-CONTRACTS.md`: identity, events, Search and storage ACL contracts.
- `scripts/validate-ecosystem-3-readiness.mjs`: dependency-free structural auditor; `--audit` exits zero if the baseline is readable but reports blockers; `--enforce` exits two until static E3 blockers are addressed. Neither mode substitutes for full test/build/deploy verification.

## Local verification (PowerShell from your canonical repository root)

```powershell
node .\scripts\validate-ecosystem-3-readiness.mjs --audit
npm run validate:current-release
# Once dependencies and infrastructure are installed/configured:
npm ci
npm run db:validate
npm run db:generate
npm run typecheck
npm test
npm run build:web
npm run build:api
```

**Do not run `migrate dev` on production or a consolidated baseline; use reviewed Prisma migration workflow and `migrate deploy` for deployment after database backup/dry-run.**

## Note on scope

This is a source inspection and isolated architecture kickoff, not a claim that 31 applications are built, that Search/Bmail is live, that database migrations have been run, or that production DNS has been verified.
