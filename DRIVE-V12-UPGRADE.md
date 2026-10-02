# BAZAARA DRIVE V12 — map-first rider/driver upgrade

Release scope: **Drive** (web, rider mobile, driver mobile), Drive API, shared contracts, Mobility Operations and the platform's validation commands. This is **not** an update to the other eight BAZAARA consumer modules. All other source files remain in the full source bundle as in the reviewed v11 baseline.

## Implemented in this source upgrade

**Rider Web (port 3009)**
- Map-first booking screen with live OpenStreetMap neighbourhood preview, responsive mobile bottom-card layout and original BAZAARA branding. The map preview is **not** live driver tracking or turn-by-turn navigation.
- GPS pickup through browser permission, approximate Port Harcourt area shortcuts, coordinate editor, stale-address/pin protection, and an explicitly indicative geodesic distance helper. A road-routing provider is still required for production-grade ETAs and pin selection.
- GO, COMFORT and XL categories from the existing server contract; native ride-now/scheduled booking; accessible interactive ride-class and scheduling selectors; upfront fare breakdown.
- Immutable fuel-source details per quote, commercial surcharge explanation, Wallet escrow handoff, ride history and support, trip-reference sharing and a one-touch phone emergency dial action.

**Rider Mobile**
- Rebuilt map-style (schematic, NOT live map) layout, real device GPS permission and pickup, PH area choices, adjustable indicative estimates, booking/schedule flows, exact pricing breakdown, fuel snapshot and Wallet funding.
- Resumed active rides, encrypted device-side pickup PIN retention via Expo SecureStore, stable request idempotency across network retries, 5-second ride-state polling, ride-sharing via native share sheet, real emergency dialler and canonical support/Wallet links.
- New dependency declaration and Expo location permission are included in package.json, app.json and the root package-lock. `expo-location` already exists in the monorepo through the driver app.

**Driver Mobile**
- Driver-provided *real* vehicle plate/make/model/colour instead of canned Toyota/plate data, a compact compliance panel, active assignment visible before the wallet block, improved online/offer/trip visual emphasis, actual link to navigation app, native trip-reference sharing and emergency dialling.
- Retains existing document uploads, arrival/verification/start/completion, fare transparency, held-fare settlement, reconciliation and payout. Driver call eligibility alone is not a working masked-call provider.

**Platform API and Operations**
- Bounded fuel formula: commercial fuel cost exposure of 30% of the fare subtotal, adjustment limited to ±12% of that subtotal; *not a statutory tariff*. Discount/toll/fee values supplied by untrusted clients are rejected until verified server-side sources are connected.
- Fuel publications now enter PENDING review with evidence URL; a separate authorized Operations account must approve. Approval metadata is audited. Unverified/expired/missing indexes **do not** add a fuel adjustment. Verified publications must be effective and at most seven days old. All new quotes receive a frozen pricing snapshot containing their actual fuel source, status and policy inputs, which is the source shown to the rider for that quote.
- Operations fuel table now shows pending evidence, source links and second-person approval; previously applied quote snapshots never change.
- Driver approval requires reviewed current licence, vehicle insurance and inspection/roadworthiness, in addition to an approved active vehicle. Going online and automatic dispatch re-check document expiry; expired vehicles are excluded. Operations must review applicability of local vehicle/transport licence requirements separately before public service.
- Existing financial ledger, refund, support and permission boundaries remain in the codebase. **No Prisma schema or migration changes in this upgrade.**

## Existing functionality preserved

Canonical BazID authentication, Wallet fare hold and double-entry settlement, no-bidding auto-dispatch, geofenced drop-off completion, driver payout reconciliation, support cases, exact ride/ledger handoffs and all current v11 validation scripts.

## External dependencies and pre-production gaps

The shipped web iframe and native schematic do not implement live vehicle maps, actual geocoding, route optimisation, congestion-aware ETA, a rider-editable pinpoint map, real trip-location sharing or masked telephony. Do not market those as complete until production mapping/communications providers are integrated and end-to-end tested. Port Harcourt quick-pick coordinates are **approximate area examples**, not verified street-level pickup/drop-off points. Disable actual public booking until route measurements, map pins and applicable licences are verified.

The API currently has GO, COMFORT and XL backed by pricing and dispatch. Premium, motorcycle, carpool, intercity and true multi-stop rides require independent vehicle definitions, route calculation, eligibility, insurance and dispatch implementation; UI placeholders are intentionally not exposed as live choices. Scheduled rides retain the existing advance Wallet hold and fixed-quote policy, which requires a commercial review before accepting very distant future bookings.

Nigeria's petrol market and ride-hailing requirements must not be reduced to a hard-coded official nationwide price or surcharge. The 30%/12%/7-day parameters above are BAZAARA policy defaults, **not Nigerian law**. An operator must verify every source and applicable state requirements. Useful primary references include the [NMDPRA](https://www.nmdpra.gov.ng/), [FRSC](https://frsc.gov.ng/), and [NEMA](https://www.nema.gov.ng/). FRSC material describes Nigeria emergency **112** and FRSC emergency **122**; the app's emergency link is a phone dial action, *not* automated dispatch.

## Verification

The source upgrade was checked in a dependency-light build environment with:

```powershell
npm run validate:current-release  # existing v11 assertions plus v12 assertions
npm run validate:drive-v12       # v12 source assertions + 4 fuel policy unit tests
```

The original v11 Business, Food, Grocery, Shopping, Pharmacy, Wallet, Operations and security validation suites remained passing during this static verification. Full dependency-backed TypeScript checks, API integration tests, Next.js production build, Android build, database migrations, live payment/mapping services and real-device journey tests **were not run in the packaging environment after these source changes**. They must be rerun in your VS Code installation:

```powershell
npm ci
npm run db:generate
npm run typecheck
npm test
npm run build:web
.\scripts\verify-drive-wallet-operations-v11.ps1 -Full
```

Do not apply Prisma migrations or reset your database simply to install this upgrade. Review current migrations against staging data before future changes. Keep your `.env`, live data and secrets outside ZIPs.

## Reference feature research

- [Bolt Nigeria rides terms](https://bolt.eu/en-ng/legal/rides/): nearby matching, vehicle categories, requested and scheduled pick-ups, fare estimation and payment methods.
- [Uber Nigeria ride products](https://www.uber.com/ng/en/ride/): categories, scheduling and ride-sharing controls, subject to local availability.
- [FRSC](https://frsc.gov.ng/): driver licensing and road-safety information; verify state rules with local transport regulators.

The interface uses broad, familiar map-first and bottom-sheet ride-booking conventions. It does **not** copy competitor logos, brand colours, artwork or proprietary UI screens.
