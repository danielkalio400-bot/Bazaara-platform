# Grocery :3006 implementation

This patch separates Grocery from Shopping while preserving the existing Marketplace structure and shared platform infrastructure.

Implemented:

- Shopping stays on `http://localhost:3003` and keeps the Marketplace UI.
- Shopping gets an electric/neon-blue identity without replacing its layout.
- Grocery is a dedicated Next.js workspace at `apps/grocery-web`.
- Grocery runs independently on `http://localhost:3006`.
- Grocery uses a neon purple/pink identity on web and its existing mobile Grocery surfaces.
- The Bazaara portal marks Grocery as **Available** and links to port 3006.
- Shopping `/grocery` and `/grocery/lists` hand off to the dedicated Grocery app.
- Shopping and Grocery search/suggestions are vertically scoped.
- Product and seller pages enforce merchant vertical boundaries.
- BazID safely accepts return destinations for both Shopping and Grocery.
- Platform API CORS allows Grocery on port 3006.
- Payment initialization accepts an allow-listed return origin, so Grocery provider callbacks return to Grocery instead of Shopping.
- Grocery retains the shared Bazaara cart, checkout, orders, identity, payments and Platform API.
- Grocery home, catalogue/search, products, sellers, lists, Buy Again, scheduled/express delivery, cart, checkout, orders and GO AI grocery planning remain connected.
- The all-services launcher starts and checks Grocery on port 3006.

No database reset is required. Existing BazID users, catalogue, inventory, carts and orders are preserved.
