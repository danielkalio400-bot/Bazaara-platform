# Bazaara Food Business + Operations V6

Scope is intentionally restricted to the internal Food operating stack. Customer-facing Food web/mobile UI is not redesigned by this release.

## Business → Food

The Food Business workspace is now a restaurant operating console. It contains live kitchen orders, paid-order alerts, GO pickup proximity, order details and tracking, item-level order detail, restaurant settlement snapshots, order messaging, Food issue handling, customer review replies, merchant-funded promotions, channel switches, capacity/prep settings, delivery/minimum-order settings, opening-hours management, menu links, performance KPIs and a read-only view of the effective Food commission policy.

Restaurant users can see the commission snapshot attached to each order but cannot change commission. Historical order economics remain immutable.

## Operations → Food

Operations now has a Food control centre with live orders, delay/unassigned-courier attention states, complete order economics, regional Food fee/GO rules, restaurant network health, restaurant pause/suspend controls and Food commission administration. It also includes Food issue/refund oversight, funding-aware promotion administration, review intelligence, and menu inspection with item sold-out/visibility intervention controls.

Commission supports regional default plus dated GLOBAL and RESTAURANT policies. A restaurant override wins over a global policy. A policy affects only orders placed while that policy is effective; each order persists its own `FoodOrderEconomics` snapshot.

## Food Support + AI

Support now accepts `FOOD` cases linked to a Food restaurant and optionally a Food order. Business and Operations see the same case thread. Food cases carry order/payment/economics/GO tracking context.

Food AI performs deterministic context-aware triage for order status, GO delivery, commission explanation, payout explanation and menu availability. Low-risk informational replies can be sent automatically. Refund/chargeback/fraud, food-safety/allergy/injury and legal-risk language disables auto-reply and routes the case to human review.

Operations can refresh the Food AI analysis and explicitly send a safe AI reply. AI messages use the dedicated `AI` support-message kind and are visible in both Business and Operations.

An optional provider-neutral AI webhook is supported through `FOOD_SUPPORT_AI_WEBHOOK_URL` and `FOOD_SUPPORT_AI_WEBHOOK_TOKEN`. The webhook can improve the wording of the summary/reply, but it cannot override Bazaara's deterministic safety gate; consequential Food cases remain human-controlled. If no webhook is configured, the built-in contextual triage and automated safe replies continue to work.

## Database migration

Migration added:

`packages/db/prisma/migrations/20260921103000_food_business_ops_support_v1/migration.sql`

It adds `FoodCommissionPolicy`, Food links on `SupportCase`, indexes/foreign keys for those links, and the `AI` support message kind.

## Validation / local startup

From the repository root in PowerShell:

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run validate:food-business-ops-v6
npm run typecheck
```

Then run the three surfaces as needed:

```powershell
npm run dev:api
npm run dev:business
npm run dev:operations
```

Static release assertions and TypeScript syntax-transpilation checks pass in the packaged source. Full workspace typecheck/build still requires normal dependency installation and Prisma client generation on the target machine. The API remains on the existing Platform API port and the Business/Operations ports remain unchanged by this release.
