# Food Web — Phase 3 / Roadmap 32

This change introduces **Food** as an independent web vertical at **http://localhost:3007**. It does not replace or restyle Shopping (`:3003`) or Grocery (`:3006`).

Implemented in this phase:

- `apps/food-web`, a separate Next.js Food application with its own warm Food visual identity.
- Restaurant discovery, cuisine browsing, dish/restaurant search, open-now and fulfillment filtering.
- Restaurant storefronts with opening hours, ratings, ETA, delivery/service fees and minimum-order information.
- Menu sections for mains, sides, extras and drinks.
- Required/optional modifiers, multi-select extras, item quantities and special instructions.
- Restaurant-scoped guest carts with secure HTTP-only guest identifiers and BazID cart claiming after sign-in.
- Delivery or pickup, ASAP or scheduled ordering, cutlery and contactless preferences.
- Shared BazID authentication with return-to-Food support.
- Shared customer address API and reusable saved addresses at Food checkout.
- Idempotent Food order placement, order history, order detail/timeline and permitted cancellation.
- Food-specific Prisma domain models and an additive migration.
- Three seeded restaurants with menus and modifier data for local development.
- Platform API CORS/startup integration for port 3007.
- Bazaara portal Food card marked Available and linked to port 3007.

Food order payment is online-only. Supported customer methods are `BAZAARA_PAY`, `PAYSTACK_CARD`, and `PAYSTACK_BANK`; restaurants cannot accept an order until payment is confirmed. Wallet uses the shared double-entry wallet ledger, while card/bank checkout uses the shared provider adapter and server-side reconciliation. Food must not expose pay-on-delivery.
