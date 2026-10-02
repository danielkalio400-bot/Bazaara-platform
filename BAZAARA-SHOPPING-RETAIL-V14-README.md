# BAZAARA Shopping Retail V14 — retail-first correction

This is an incremental patch for **your uploaded BAZAARA-CURRENT-SOURCE.zip plus installed Bazaara-V13-Fixed.zip**. The V13 Deal Radar, V12 guided search, existing carts, Wishlist, BazID, orders and live catalogue are preserved. No Prisma migration or database reset is required.

## Changes in this release

- Retail-only Shopping identity: warm-white backgrounds, BAZAARA orange accents, concise searchable header, desktop category rail, a genuine catalogue-powered banner, responsive mobile category shortcuts and compact white product grids.
- Home prioritizes **categories, current deals and actual inventory**, not B2B sourcing. No fictitious products, review counts, countdown timers, delivery promises or historical-price guarantees are displayed.
- Web: homepage, shopping header, search shortcuts and legacy `/bulk` navigation corrected. The V13 Deal Radar and product search receive complementary light retail styling. Existing mobile-bottom-nav category list no longer includes wholesale.
- Native: compact retail hero first, categories second, current deals third; Smart Find and Deal Radar follow. Orange and white shopping-home accents; native product cards use a new opt-in `retail` treatment in the shared mobile UI. Other apps retain the old default components.
- Old web `/bulk` bookmarks redirect to `/shopping`; old native `/bulk` bookmarks redirect to the Shopping tabs. Existing database/catalogue and order records are untouched. This changes the consumer-facing Shopping UI; it does not erase third-party merchant records or unrelated Business operations.
- V12 source validator updated to test the new retail-only navigation and safe legacy redirects without reducing its 12 behavior tests. V14 adds 40 new source checks and is included in `validate:shopping-current` and `validate:current-release`.

The layout is an original BAZAARA design informed by familiar Nigerian retail marketplace patterns; it contains no Jumia branding, images, code or proprietary content.

## Installation

Prerequisite: repaired Shopping V13 installed and `npm run validate:shopping-current` previously passing. Stop local Shopping/Expo dev servers before applying.

```powershell
$Project = "C:\Users\danie\bazaara\bazaara-platform"
$Zip = "$env:USERPROFILE\Downloads\BAZAARA-SHOPPING-RETAIL-V14-PATCH.zip"
$Folder = Join-Path $env:TEMP ("BAZAARA-RETAIL-V14-" + [guid]::NewGuid().ToString("N"))
if (!(Test-Path -LiteralPath $Zip)) { throw "Download the Retail V14 PATCH ZIP first." }
Expand-Archive -LiteralPath $Zip -DestinationPath $Folder
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$Folder\Apply-BAZAARA-Shopping-Retail-V14.ps1" -ProjectRoot $Project
if ($LASTEXITCODE -ne 0) { throw "Retail V14 patch did not install. Stop; do not force-copy files." }
cd $Project
npm run validate:shopping-current
if ($LASTEXITCODE -ne 0) { throw "Shopping source validation failed." }
npm run validate:current-release
if ($LASTEXITCODE -ne 0) { throw "Full source validation failed." }
npm run typecheck --workspace=@bazaara/shopping-web
npm run typecheck --workspace=@bazaara/shopping-mobile
npm run typecheck --workspace=@bazaara/platform-api
npm run build --workspace=@bazaara/shopping-web
```

The installer preflights all source hashes before modifying anything. It backs up all replaced files outside the project and restores them on copy failure. If your source has changed since the uploaded ZIP/V13 patch, the installer **stops without modifications**; upload your current source for a reviewed merge instead.

## Verification scope

Tested on the reviewed extracted source in this environment: `npm run validate:current-release` (includes 37 V12 assertions + 12 behavior tests; 41 V13 assertions + 8 behavior tests; 40 V14 assertions); TypeScript **syntax** checks across the modified TSX sources (no syntax diagnostics). A full dependency-backed Next/Expo production build, Android device test and real API/checkout smoke test require your local machine and database. No production-readiness claim is made for unverified steps.

At web port 3003, inspect `/shopping`, `/search-results`, `/deals`, `/bulk` redirect, the product detail, cart and wishlist, including narrow phone viewport. On native, check home, deals, old bulk redirect, cart quantity and wishlist. All offers must come from real in-stock Shopping sellers.
