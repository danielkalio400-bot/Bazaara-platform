# Drive + Pharmacy — Complete Source Release

Release date: 2026-09-16

This source tree continues from the completed Grocery/Food baseline and adds the full Drive and Pharmacy foundations, customer/driver/merchant/Operations surfaces, data models, API routes, migrations, validation gates and native authentication/location/document flows.

## Drive

Identity is frozen to monochrome `#050505` / `#FFFFFF`.

Drive uses automatic Bolt/Uber-style dispatch rather than an inDrive-style marketplace. Riders do not bid and drivers cannot counteroffer or manually change a confirmed fare. Matching starts in a tight nearby radius, ranks approved eligible drivers by pickup ETA, and expands only inside the configured maximum pickup distance/ETA. The default cap is 5 km / 10 minutes.

Pricing uses server-side auditable snapshots. Regional fuel-price movement automatically changes future quotes. Confirmed/accepted ride prices are not silently rewritten. The rider fare is held from Bazaara Wallet before dispatch. Bazaara's platform charge is 15% and is secured when the ride enters `IN_PROGRESS`.

Driver cancellation after accepting a ride applies the configured 10% driver fee and rematches the rider. Trip completion is destination-geofence controlled. A driver who force-completes outside the confirmed drop-off geofence receives the configured 20% violation fee. Pickup uses a rider PIN. Masked calling is proximity controlled before pickup and available during the active trip.

Driver onboarding includes BazID, vehicle registration, live device location, compliance document upload, vehicle/document Operations review, online/offline controls, nearby offers, trip lifecycle, earnings ledger and penalties. Operations approval requires an approved active vehicle and approved, non-expired driver licence + vehicle insurance.

## Pharmacy

Identity is frozen to `#FF7A00` / `#FF9D00`.

Public Pharmacy catalogue is limited to verified, unsuspended pharmacy merchants and supports brand, generic-name, active-ingredient and barcode discovery. Inventory supports branch/product stock, batches/lots, expiry dates and FEFO reservation.

Prescription-only checkout is pharmacist gated. Customers can upload a private prescription asset, assign it to a verified pharmacy, and wait for a verified pharmacist decision. The pharmacy cannot silently substitute medicine. Substitutions are proposed explicitly and customer acceptance triggers transparent price reconfirmation.

Pharmacy orders have server-side price snapshots, live-stock checks, Bazaara Wallet payment, delivery/pickup state, GO settlement foundations, refill plans and audit/outbox events. Pharmacy Business includes catalogue, batches, prescriptions and fulfilment. Operations includes pharmacy/pharmacist verification and order/prescription oversight.

## Validation included in this release

The repository contains three source-level validation gates:

```powershell
npm run validate:static
npm run validate:grocery-food-v2
npm run validate:drive-pharmacy
```

At packaging time these passed:

- Static validation: 440 source files, 12 web ports, 11 native clients.
- Grocery/Food V2 validation: 2725 checks.
- Drive/Pharmacy validation: 30 frozen rules/surfaces.
- TypeScript parser validation for modified Drive/Pharmacy/Business/Operations/API/contracts/seed files passed.
- `package-lock.json` workspace dependency entries match workspace `package.json` dependencies.

The container could not complete dependency-backed Prisma generation/typecheck/build because npm registry downloads failed with `EAI_AGAIN` and npm exited with `Exit handler never called`. The repository therefore includes a Windows validation script to run those final dependency-backed checks on the development machine after `npm ci` succeeds.

## Final local verification

From the repository root on Windows PowerShell:

```powershell
npm ci
powershell -ExecutionPolicy Bypass -File .\scripts\validate-drive-pharmacy-release.ps1
```

To apply migrations to a configured deployment database after validation:

```powershell
npm run db:migrate:deploy
npm run db:seed
```

Do not run deployment migrations against production until `DATABASE_URL` points to the intended database and a backup exists.
