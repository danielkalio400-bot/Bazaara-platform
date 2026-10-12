# BAZAARA HTML/CSS UI Foundation
Integrated 12 October 2026 into Ecosystem 3 Workspace without replacing any existing Next.js app.

## Locations
- Workspace gallery: `/ui-foundation` on Workspace (default `localhost:3021`).
- HTML landing: `/bazaara-ui/index.html`.
- 16 app previews: Auto, Booking, Browser, Drive (local-file preview only), Flights, Hotels, Lens, Maps, News, Places, Search, Transit, Translate, Travel, Weather, Voice.
- Shared style and interactions: `apps/workspace-web/public/bazaara-ui/{ui.css,app.js}`.
- Launcher entry: `apps/workspace-web/lib/products.ts`.

## Boundary
No existing BAZAARA Search, BMap, News, Translate, BazLens, Box/BCloud Drive, ride-hailing Drive, or other app route was replaced. The standalone 'Drive' HTML preview is a local file viewer and must not be treated as either the BCloud Drive or mobility Drive production service. No fake booking confirmations, prices or AI outputs are shown. Browser-local data is unencrypted; do not enter private credentials or payment information. Camera/microphone require explicit permissions and a secure origin.

## Validation
The static preview was inspected for safe link handling and no direct API/service claims. A Chromium UI test was attempted in the sandbox but navigation was blocked by its administrator network policy. Therefore mobile/browser and production-build checks remain unverified. Run a real browser pass and `npm run build --workspace @bazaara/workspace-web` in the platform environment before release.
