# BAZAARA Drive + Wallet + Operations V10

## Integration objective

V10 makes Drive money movement a first-class part of the BAZAARA Wallet and Finance Operations model instead of treating rider fares, driver earnings and Wallet funds as separate product silos.

## End-to-end money flow

1. A rider receives a server-generated Drive quote.
2. On ride confirmation, the full fare is reserved from the rider's BAZAARA Wallet into Drive escrow.
3. At trip start, the configured Drive platform charge is secured from escrow.
4. At trip completion, the driver earning portion is posted to the driver's Drive liability ledger account and mirrored in the Drive driver profile balance.
5. The driver may move reconciled earnings into the same spendable BAZAARA Wallet used elsewhere in the ecosystem.
6. The payout is journaled as `DRIVE_DRIVER_PAYOUT_TO_WALLET` and recorded by `DriveDriverPayout` with a per-driver idempotency key.
7. Finance Operations sees held rider fares, settled ride volume, outstanding driver earnings, platform debt, completed payouts and ledger/profile reconciliation exceptions.

## Security and permissions

Drive dispatch/compliance remains under mobility/order permissions. Drive financial visibility requires `payment.read`. Payout and reconciliation actions require `payout.manage`. Driver self-service payout is constrained to the authenticated driver's own balance, is ledger-backed, idempotent and blocked when the profile mirror differs from the ledger source of truth.

The reconciliation action does not invent or transfer funds. It repairs only the legacy Drive profile balance mirror from the actual Drive ledger balance and records an audit event plus a reconciliation history entry.

## Product surfaces

- Drive Web: upgraded responsive ride booking, Wallet funding state, active-trip polling, recent trips, driver settlement action when applicable, and cross-navigation to Wallet.
- Drive Rider Mobile: Wallet availability/held-fare visibility, insufficient-funds recovery into Wallet, fare-lock status and live trip state.
- Drive Driver Mobile: Drive earnings, BAZAARA Wallet balance, platform debt, reconciliation status and earnings-to-Wallet payout.
- Wallet Web: dedicated Drive workspace showing held fares, completed spend, recent Drive ledger activity, ride history and driver settlement.
- Wallet Mobile: the same money rail is visible natively, including driver payout.
- Operations Pay: consolidated Drive finance KPIs, payout history, per-driver balances and controlled reconciliation alongside merchant settlements, withdrawals, funding and loans.
- Operations Drive: keeps dispatch/compliance context and links finance-sensitive work into Pay / Finance Operations.

## Existing Business and Operations capabilities preserved

The supplied V9 platform already includes the requested professional Business surfaces: dashboard, revenue, analytics, reports/schedules, payments, subscriptions, pricing, customers, users/team access, settings, support and all major vertical workspaces. Operations already includes support, tickets, support tools, access/RBAC, audit, reports, risk, businesses and domain consoles. V10 preserves these surfaces and adds the Drive/Wallet finance integration rather than replacing them.

## Local configuration fix

The sample browser-origin allowlist now includes the complete local web port range used by this repository, including Drive `3009` and Wallet `3010`. Cross-app URL variables are included for Drive ↔ Wallet navigation. This prevents cookie-authenticated Drive/Wallet mutations from failing local origin enforcement when using the supplied environment templates.

## Validation entry point

Run:

```powershell
npm run validate:drive-wallet-operations-v10
```

For a complete local release check after dependencies and PostgreSQL are available, also run the existing database validation/generation, Business/Operations V9 validator, TypeScript checks, tests and web/API builds.
