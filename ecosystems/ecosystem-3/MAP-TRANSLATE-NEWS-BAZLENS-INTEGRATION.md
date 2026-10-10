# Ecosystem 3 — Map, Translate, News, BazLens integration (2026-10-08)

## Scope
This feature branch builds on the four existing standalone Next.js apps without changing the E3 product gate, shared identity contracts, database schemas or app port registry.

- **BMap**: accepts user-provided `?q=` search text without auto-searching and opens precision-validated `?lat=&lon=&label=` location links after map initialization. Shared places now use BMap's own URL rather than forcing an external map service.
- **Translate**: accepts `?text=&from=&to=` for explicit cross-app handoff. Language codes and length are constrained; provider calls still require user interaction.
- **News**: accepts `?q=&section=` context and offers Translate headline links when its application URL is configured or local development is used.
- **BazLens**: supports links from recognized text into Translate and from recognized objects into BMap / News, using the existing configurable application URL registry.

## Environment and behavior
Set `NEXT_PUBLIC_BAZAARA_APP_URLS` to a JSON object mapping `translate`, `bmap`, `news`, `search`, etc. to HTTPS app URLs for cross-origin deployment. Local development uses existing app ports (BMap 3038, Translate 3039, News 3040, BazLens 3041).

Provider integrations remain separate: BMap geocoding requires `BMAP_GEOCODE_CONTACT`, Translate requires `BAZAARA_TRANSLATE_ENDPOINT`, News uses its defined RSS allowlist, and BazLens analysis requires `BAZAARA_VISION_ENDPOINT`.

## Follow-up verification before merging
Run `npm run typecheck --workspace @bazaara/bmap-web`, `npm run typecheck --workspace @bazaara/translate-web`, `npm run typecheck --workspace @bazaara/news-web`, `npm run typecheck --workspace @bazaara/bazlens-web` using installed monorepo dependencies; then run each app's build and test the desktop/mobile deep links, privacy behavior and user consent paths. No production-readiness claim is made by this increment.
