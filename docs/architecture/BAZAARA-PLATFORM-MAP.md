# BAZAARA Platform folder map

```text
bazaara-platform/
├── apps/                 # all runnable web/mobile applications
├── services/             # backend services
├── packages/             # shared contracts, DB, security, ledger, design system, etc.
├── scripts/              # repo automation and validators
├── infrastructure/       # deployment/runtime infrastructure
├── deployment/           # deployment definitions when present
├── docs/                 # platform documentation
└── ecosystems/           # logical product grouping + build gates
    ├── shared-foundation/
    ├── ecosystem-1/
    ├── ecosystem-2/
    └── ecosystem-3/
```

Do not duplicate application source under `ecosystems/`. The manifests reference
the real workspaces under `apps/`.

## Naming

Customer-facing Ecosystem 1 names:
Shopping, Food, Grocery, Drive, Logistics, Wallet, Business, Pharmacy, Bazasport.

Shared operational systems:
BazID, GO, Operations.

`pay-web` / `pay-mobile` remain technical compatibility names temporarily while
the customer-facing product is Wallet.