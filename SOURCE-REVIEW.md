# BAZAARA Platform — V11 source review

## Review scope

This release was built from the full platform archive received on 2026-09-21. The extracted repository is an npm-workspaces monorepo with Next.js/React web apps, Expo/React Native clients, a Fastify Platform API, Prisma/PostgreSQL, shared contracts/security/ledger packages, and BazID authentication.

After excluding generated `node_modules` content and historical `.bak-*` copies, the reviewed V11 working tree contains 961 active files: 603 under `apps/`, 97 under `services/`, 69 under `packages/`, and 30 under `scripts`.

The current database history is intentionally consolidated. The live migration chain is:

1. `20260921112622_current_schema_baseline`
2. `20260921131500_business_operations_complete`
3. `20260921143000_smart_actions_restaurant_contact`
4. `20260921170000_support_customer_live_chat`
5. `20260921193000_drive_wallet_operations_link`
6. `20260922103000_drive_wallet_support_context`

Older migration filenames referenced by legacy validators are not recreated because that would reintroduce the Prisma baseline/shadow-database inconsistency that the current consolidated baseline was designed to remove.

## Existing professional platform coverage preserved

The supplied platform already contains mature Business and Operations implementations. The Business application has 29 routed pages, including revenue, analytics, reports, pricing, subscriptions, payments, customers, users/team management, settings, support and vertical workspaces. Operations has 19 routed pages, including tickets, support/support-tools, access/RBAC, audit, reports, risk, businesses and domain consoles for commerce, Food, Grocery, Logistics, Drive/Mobility, Pay and Pharmacy.

V10 therefore preserves those systems and advances the missing cross-product finance boundary rather than replacing working functionality.

## Drive + Wallet + Operations integration completed

Drive rider fares already used the shared ledger, but driver earnings were surfaced primarily as a Drive-local balance. V10 makes the settlement path explicit and first-class:

- Rider fare reservation moves Wallet funds into Drive escrow.
- Ride settlement credits the driver's Drive liability ledger account.
- `DriveDriverPayout` records idempotent earnings-to-Wallet movements.
- `DRIVE_DRIVER_PAYOUT_TO_WALLET` journals move funds atomically from the Drive liability account into the user's standard BAZAARA Wallet.
- Payouts are blocked if the Drive profile mirror and ledger source of truth disagree or if platform debt prevents payout.
- Finance Operations exposes held rider fares, settled ride volume, outstanding earnings, platform debt, completed payouts and reconciliation exceptions.
- A controlled Finance Operations reconciliation action repairs only the profile mirror from the ledger balance; it does not invent or transfer money.

The corresponding flow is surfaced in Drive Web, Drive Rider Mobile, Drive Driver Mobile, Wallet Web, Wallet Mobile, Operations Pay and Operations Drive.

## Authorization boundary preserved

Mobility/dispatch work continues to use order/mobility permissions. Finance visibility requires `payment.read`; payout/reconciliation actions require `payout.manage`. Driver self-service payout is constrained to the authenticated driver's own balance and uses idempotency plus serializable ledger transactions.

## Cross-app and environment corrections

- Browser origins now include Drive (`3009`) and Wallet (`3010`) across the local web range.
- Drive ↔ Wallet URLs are documented for web and Expo clients.
- Three live BazID Drive fallback URLs incorrectly pointed at Pharmacy port `3011`; all now use Drive port `3009`.
- The Grocery service-fee environment fallback now matches the current V5.5 policy (10% default, constrained to 10–15%).
- Obsolete fixed Grocery Express-fee environment keys were removed from the active API configuration because current Grocery pricing uses percentage/min/max policy logic instead.

## Repository maintenance corrections

Legacy validators were updated to validate the actual consolidated database history and current product rules. They no longer demand deleted pre-baseline migrations or the superseded Grocery V5.4 purple/fixed-fee behavior. `validate:current-release` now provides one current static release-validation entry point covering the platform, Grocery/Food, Drive/Pharmacy, Shopping, Business/Operations and Drive/Wallet/Operations integration.

Historical `.bak-*` files are build-time/source-history clutter, not runtime dependencies. The packaged V10 release excludes those backup copies, `node_modules`, build caches and generated output to keep the deliverable clean and reproducible.


## V11 context integration review

The full V10 archive was compared with the supplied Drive/Wallet/Operations V10, Business/Operations cleaned, and integrated V6 archives before modification. The full V10 package is the authoritative newest integration layer; the other archives contain either historical backup files or narrower divergent snapshots. V11 therefore advances the full V10 source instead of overwriting it with an older subsystem ZIP.

A concrete support gap was identified: `SupportCase` could link Shopping, Food, Payment and Logistics resources but could not link a Drive ride or shared Wallet ledger transaction as a first-class relation. V11 adds both relations, ownership checks, indexed database columns, rich support-case includes and an incremental migration.

The review also found that Wallet activity exposed the `LedgerEntry` ID as the activity `id`. A support case must reference the parent `LedgerTransaction`, not the entry. V11 adds `transactionId` to `PayActivityContract` / `DriveWalletActivityContract` and the Pay service mapping; Wallet support uses that canonical transaction ID.

Drive Web, Wallet Web, Operations Support, Operations Drive and Operations Pay now preserve exact ride/ledger context across handoffs. Rider/Driver/Wallet mobile surfaces are aligned to the same premium navy/teal system and expose ride-aware Wallet/support handoffs where applicable. Existing Business/Operations V9 coverage and V10 finance permissions are preserved.
