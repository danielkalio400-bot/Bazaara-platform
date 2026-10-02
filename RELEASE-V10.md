# BAZAARA V10 — Drive + Wallet + Operations integrated release

This package advances the supplied full BAZAARA platform without discarding the existing Business/Operations V9 systems.

## Principal additions

- Unified Drive rider fare, escrow, driver earnings and BAZAARA Wallet settlement flow.
- Idempotent driver earnings-to-Wallet payout model and API.
- Ledger/profile reconciliation guard and controlled Finance Operations repair action.
- Drive finance KPIs, payout history and reconciliation controls inside Operations Pay.
- Drive Web upgrade with Wallet funding state, recent rides, live trip state and driver settlement action.
- Drive Rider Mobile Wallet visibility and insufficient-funds recovery.
- Drive Driver Mobile earnings/Wallet/debt/reconciliation/payout workflow.
- Wallet Web and Wallet Mobile Drive money surfaces.
- Shared Drive payout/wallet contracts.
- Correct Drive/Wallet local-origin and cross-app URL configuration.
- Corrected BazID Drive fallback port (`3009`, not Pharmacy `3011`).
- Current Grocery pricing environment fallback aligned with V5.5.
- Current release validator aggregating active platform validators.

## Validation

Run `npm run validate:current-release` for the source-level release suite. See `TEST-RESULTS.md` for the exact checks passed in this packaging environment and for the dependency-backed local release commands.
