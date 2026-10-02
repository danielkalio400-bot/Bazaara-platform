# BAZAARA Drive + Wallet + Operations V11

V11 advances the V10 financial bridge into a first-class operational workflow. A Drive trip, its Wallet money movement and its Support/Operations case can now carry the same canonical identifiers end-to-end instead of relying on copied text or manual lookup.

## End-to-end context flow

### Rider

`BazID -> Drive ride -> Wallet fare/escrow -> Support case -> Operations Support -> Mobility/Finance`

- Drive Web and Rider Mobile can open Wallet using the exact ride ID.
- Drive Web can create a `DRIVE` support case linked directly to that `DriveRide`.
- Rider Mobile can jump directly to Wallet support with the active ride ID.
- Wallet Web retains a ride passed from Drive and can attach it to a support case.

### Wallet

`Wallet transaction -> linked support case -> Operations Finance/Support`

- Wallet Web can attach a Drive ride and/or an exact `LedgerTransaction` to a support case.
- Drive ledger activity exposes transaction-level “Get help” actions.
- The support API verifies that a user owns the linked Wallet transaction through the ledger account -> Wallet -> user relationship.
- The support API verifies that a linked Drive ride belongs to the requester as rider or driver.

### Operations

`Support case -> linked Drive ride -> linked ledger transaction -> Mobility/Finance`

- Operations Support receives rich linked Drive and Wallet context.
- Support can open the exact ride in Drive Operations or the linked money context in Pay/Finance Operations.
- Drive Operations accepts an exact `rideId` filter and preserves it in Support/Finance handoffs.
- Finance Operations preserves ride/ledger context and links payout ledger transactions back into Support.
- Finance permissions remain separate: `payment.read` for finance visibility and `payout.manage` for payout/reconciliation actions.

## Data model

New optional `SupportCase` links:

- `driveRideId -> DriveRide`
- `ledgerTransactionId -> LedgerTransaction`

Both use `ON DELETE SET NULL` so case history remains durable if a linked operational record is removed under an allowed lifecycle. Indexed lookups support Operations search and case hydration.

Migration:

`20260922103000_drive_wallet_support_context`

## Product/UI advancement

### Drive Web

- Midnight navy/charcoal mobility canvas with electric teal interaction states.
- Premium map/mobility visual language aligned with the approved BAZAARA Drive concept.
- Active-ride Wallet trace and trip-help actions.
- Trip-history Wallet/support actions.
- First-class Drive support desk that sends linked ride context to Operations.
- Responsive desktop/tablet/mobile behavior retained and extended.

### Wallet Web

- Matching premium BAZAARA Wallet visual system.
- Deep-link `section` handling for Drive, activity and support workspaces.
- Linked Drive context banner.
- Ride-level and ledger-transaction-level support actions.
- Support composer can attach a Drive ride and Wallet ledger transaction.

### Operations

- Matching command-center palette and denser operational treatment.
- Support linked-context cards for Drive and Wallet.
- Exact ride focus in Mobility Operations.
- Exact ride/ledger focus in Finance Operations.
- Bidirectional shortcuts between Support, Mobility and Finance without relaxing RBAC.

### Native/mobile

- Rider, Driver and Wallet mobile surfaces use the same midnight navy/electric teal mobility-finance language.
- Rider active-trip actions link to the exact Wallet ride context and Drive support context.
- Wallet Mobile surfaces the latest Drive ride and Drive support handoff.
- Existing Driver payout/reconciliation workflow remains connected to the shared BAZAARA Wallet.

## Business/Operations completeness preserved

V11 does not replace the mature Business/Operations V9 suite. It preserves and regression-validates:

- Revenue dashboard and analytics
- Reports and exports
- Pricing and subscriptions
- Payments, settlements and invoices
- Customers, users, teams and invitations
- Settings and organization controls
- Tickets, feedback and help desk
- Live support and support tools
- RBAC/access control
- Audit and risk systems
- Vertical command centers and reports

## Validation

Run the V11 integration gate:

```powershell
npm run validate:drive-wallet-operations-v11
```

Run the complete source release gate:

```powershell
npm run validate:current-release
```

For dependency-backed database/build validation on the normal development machine:

```powershell
.\scripts\verify-drive-wallet-operations-v11.ps1 -Full -ApplyMigrations
```
