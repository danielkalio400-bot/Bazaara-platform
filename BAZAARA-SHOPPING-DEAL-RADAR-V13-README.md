# BAZAARA Shopping V13 — Deal Radar (incremental upgrade)

This patch is built **against the user-uploaded BAZAARA-CURRENT-SOURCE.zip (22 September 2026)** and is installed **on top of** the Shopping V12 and Drive V12 validated source. It changes Shopping Web, Shopping Mobile, and the existing Platform API without altering the Prisma schema or migrations.

## Implemented now

- A dedicated `/v1/shopping/deals` endpoint with Zod-validated min-discount, budget, verified-seller, category, order and pagination inputs. It searches **actual active Shopping products only** and uses the existing inventory calculation to exclude unavailable listings.
- Pure, unit-tested offer evaluation rejects inverted/missing/unsafe compare-at prices; calculates displayed savings from seller prices, filters false/rounded-threshold discounts, deduplicates and ranks results deterministically. Bounded **latest 400 discounted listings** scan is disclosed when truncated: results are not claimed to be exhaustive.
- New premium responsive web `/deals` page with server-derived live result counts, accessible filtering, budget validation, verified sellers, category selection, sorting, pagination, graceful errors and existing product card/cart/wishlist navigation.
- New Expo Shopping `/deals` route with the same API and discount/budget/verification filters, sorting, product cards, cart quantity and BazID-protected wishlist actions. Shopping home links to the route.
- Shopping web homepage, header, and current-deals navigation are connected to the new hub. CSS respects reduced motion and small devices.
- V13 validator added to `npm run validate:shopping-current`; eight pure behavior tests; existing V12 validators retained.

## Design reference

These are original BAZAARA components. Current-commerce reference: Shopify's official guidance on mobile product filtering and product counts (https://www.shopify.com/blog/ecommerce-filters) and its Predictive Search guide (https://help.shopify.com/en/manual/online-store/storefront-search/predictive-search). For deal and wholesale discovery, marketplace conventions of Amazon, AliExpress, Temu, Jumia and Alibaba inform product direction; no third-party proprietary layouts, brand assets or APIs are copied or represented as connected.

## Important scope and limits

A seller's compare-at price **is not independently verified historical pricing**; Deal Radar does not claim that an advertised markdown represents a genuine historical price reduction. Offers are based on the newest **400** discounted listings, disclose whether more may exist, and are not a catalogue-wide rank. No manufactured timers, sales, ratings or stock. Live API/database/device smoke tests and release builds **still require the user's local environment**. No automatic background price alerts, supplier RFQ submissions or ML personalization were added in this increment.

## Apply on Windows (PowerShell 5.1+)

1. Download `BAZAARA-SHOPPING-V13-DEAL-RADAR-PATCH.zip` to Downloads, extract it into a new folder.
2. From inside the extracted folder run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Apply-BAZAARA-Shopping-V13.ps1 -ProjectRoot 'C:\Users\danie\bazaara\bazaara-platform'
```

3. The installer verifies **all original and payload SHA-256 hashes before changes**, backs up replaced files in a separate timestamped directory, aborts without modifying files on divergence, and rolls back if file copying fails. Existing database, env and other modules are preserved.
4. Run these commands after successful installation:

```powershell
cd C:\Users\danie\bazaara\bazaara-platform
npm run validate:shopping-current
npm run validate:current-release
npm run typecheck --workspace=@bazaara/platform-api
npm run typecheck --workspace=@bazaara/shopping-web
npm run typecheck --workspace=@bazaara/shopping-mobile
npm run build --workspace=@bazaara/platform-api
npm run build --workspace=@bazaara/shopping-web
```

5. Start API at port 4000 and Shopping Web at 3003; inspect `http://localhost:3003/deals` and the mobile `Deal Radar` page on your device with **real seeded listings** and run checkout/wishlist smoke tests. No production rollout until those checks pass.
