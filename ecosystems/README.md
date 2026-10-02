# BAZAARA — one platform, three ecosystems

This repository is one permanent monorepo: `bazaara-platform`.

## Build order

1. Ecosystem 1 — Commerce & Everyday Life
2. Ecosystem 2 — Social, Media & Communication
3. Ecosystem 3 — Intelligence, Productivity & Infrastructure

The ecosystems are logically grouped here, but application source is intentionally
NOT copied or moved into these folders. Runtime source remains under `apps/`,
`services/` and `packages/` so npm workspaces, imports, validators and deployment
paths remain stable.

## Current gate

Ecosystem 1 is ACTIVE.
Ecosystem 2 is RESERVED and blocked.
Ecosystem 3 is RESERVED and blocked.

Only when Ecosystem 1 is fully validated and frozen as a stable platform foundation
does Ecosystem 2 begin. Ecosystem 3 begins only after Ecosystem 2 is stable.

## Shared foundation

BazID, Operations, GO, authorization, Wallet ledger primitives, support,
notifications, security/risk, analytics, localization, storage/media, event
contracts and the design system are shared platform capabilities.

BazID identity should recommend a matching `@bmail.com` address. Bmail itself is
an Ecosystem 3 product and is not being built during the Ecosystem 1 phase.