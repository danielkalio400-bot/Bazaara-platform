# BAZAARA Platform V11 — Drive + Wallet + Operations

This is the upgraded full-platform source package built from the supplied V10 platform. It preserves the mature Business/Operations V9 suite and V10 Drive/Wallet accounting bridge, then links Drive, Wallet and Operations Support with first-class ride and ledger context.

## What changed in V11

### Drive ↔ Wallet ↔ Support

- Drive ride IDs can be carried directly into Wallet and Support.
- Support cases can reference the exact `DriveRide` and exact `LedgerTransaction` involved in an issue.
- The API verifies ownership before accepting either link.
- Drive trip history and active rides expose Wallet and Support handoffs.
- Wallet can open support from an exact Drive ledger transaction.

### Operations

- Support shows linked Drive and Wallet context instead of forcing agents to search manually.
- Agents can jump from a case to the exact Mobility ride or Finance context.
- Drive Operations supports exact ride focus and sends that same context to Support/Finance.
- Pay/Finance Operations preserves ride/ledger focus and sends ledger references back to Support.
- Mobility permissions remain distinct from `payment.read` / `payout.manage` finance permissions.

### UI/UX

- Drive Web, Wallet Web and Operations use a unified premium midnight-navy/electric-teal visual language based on the approved BAZAARA mobility concepts.
- Drive Rider Mobile, Drive Driver Mobile and Wallet Mobile are aligned to the same visual system.
- Responsive layouts and existing loading/error/empty states are preserved.

### Business/Operations baseline

The existing professional Business suite remains present and regression-validated: revenue, analytics, reports, pricing, subscriptions, payments, customers, users/team, settings, support and vertical workspaces. Operations retains tickets, feedback, live help desk, support tools, RBAC/access, audit, risk, reports and vertical command centers.

## Database

Current migration chain:

1. `20260921112622_current_schema_baseline`
2. `20260921131500_business_operations_complete`
3. `20260921143000_smart_actions_restaurant_contact`
4. `20260921170000_support_customer_live_chat`
5. `20260921193000_drive_wallet_operations_link`
6. `20260922103000_drive_wallet_support_context`

Use `npm run db:migrate:deploy`. Do not use `prisma migrate dev` against the consolidated baseline.

## Canonical platform merge

After extracting this ZIP, `scripts\apply-v11-to-canonical.ps1` can back up and overlay V11 onto the canonical `bazaara\bazaara-platform` directory while preserving the existing `.env`.

## Validation

Source release validation:

```powershell
npm run validate:current-release
```

Complete Windows validation:

```powershell
.\scripts\verify-drive-wallet-operations-v11.ps1 -Install -ApplyMigrations -Full
```

See `TEST-RESULTS.md`, `RELEASE-V11.md` and `DRIVE-WALLET-OPERATIONS-V11.md`.
