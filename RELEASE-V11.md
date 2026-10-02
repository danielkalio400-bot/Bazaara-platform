# BAZAARA V11 — Drive + Wallet + Operations unified context release

Release date: 2026-09-22

V11 builds on the V10 Drive/Wallet ledger settlement bridge and closes the operational context gap between mobility, money and support.

## Principal additions

- First-class `SupportCase -> DriveRide` relation.
- First-class `SupportCase -> LedgerTransaction` relation.
- Ownership validation for linked rides and Wallet transactions before case creation.
- Drive Web ride-specific Support and Wallet handoffs.
- Wallet Web ride/ledger-specific support composer and deep-link context handling.
- Operations Support linked Drive/Wallet context with direct Mobility/Finance navigation.
- Operations Drive exact ride focus and Support/Finance handoffs.
- Operations Pay ride/ledger focus and Support handoffs.
- Rider Mobile active-ride Wallet/support deep links.
- Wallet Mobile latest-ride Wallet trace and Drive support handoff.
- Rider/Driver/Wallet native mobility palette aligned to the new premium navy/teal visual system.
- V11 Prisma migration, shared support contracts, release validator, canonical merge script and Windows verification script.

## Existing platform preserved

The V10 money lifecycle remains intact: rider Wallet fare hold -> Drive escrow -> platform charge -> driver earnings -> reconciled earnings payout -> spendable BAZAARA Wallet, with double-entry ledger journals and finance permission boundaries.

The complete Business/Operations V9 suite remains intact, including revenue, analytics, reports, pricing, subscriptions, payments, customers, users/team, settings, tickets, feedback, help desk, support tools, RBAC, audit and risk.

## Migration

`packages/db/prisma/migrations/20260922103000_drive_wallet_support_context/migration.sql`

Apply migrations with `prisma migrate deploy` / `npm run db:migrate:deploy`, not `prisma migrate dev`, on the canonical platform.

## Validation

`npm run validate:current-release` passes in the packaging workspace, including V11's 182 integration assertions. See `TEST-RESULTS.md` for the exact source checks and the dependency-backed validation boundary.
