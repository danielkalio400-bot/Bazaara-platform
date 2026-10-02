# Ecosystem 3 — integration contracts (proposed)

These contracts guide implementation and **do not** represent endpoints available in the supplied ZIP.

## Identity and entitlements

Primary `subject`: opaque BazID user ID. Each request additionally carries explicit `organizationId` or personal-workspace context, verified against authoritative membership. OAuth scopes distinguish `search`, `mail`, `workspace`, `docs`, `storage`, and `ai` as needed; scopes are not a substitute for row-level authorization. Define user consent and sign-out propagation across first- and third-party clients.

`@bmail.com` aliases are a separate immutable identifier. Store canonical lower-case local-part with a unique index and ownership history; reserve blocked/system local parts; use one atomic transaction to claim, never a check-then-write race. Plan name-change policy, abuse appeal, suspension and eventual mailbox migration. **The baseline has no active alias-reservation implementation.**

## Asynchronous events

Envelope: `{ eventId, eventType, eventVersion, occurredAt, actorUserId?, organizationId?, resourceId, traceId, payload }`. Emit from the owning service's transactional outbox, consume idempotently with schema versions and dead-letter visibility. Events carry references and minimal metadata, not entire private messages or documents.

Initial event candidates: `BmailAliasReserved.v1`, `MailboxProvisioned.v1`, `DocumentCreated.v1`, `DocumentPermissionChanged.v1`, `FileScanCompleted.v1`, `WorkspaceMembershipChanged.v1`. Do not imply these exist in the baseline.

## Search API boundary

Search requests must validate length, language/region, safe-search settings, timeout, pagination cursors and result types. Result contracts distinguish `organic`, `sponsored` and `internal` with clear labeling if any sponsored products are ever introduced. If an upstream search API is used, disclose its data-sharing behavior before asserting privacy properties. No fabricated result rows for unconnected providers.

Keep public web search independent of existing Shopping `search-v2` endpoints: commerce inventory relevance, ACL and monetization are different from public web crawling and ranking.

## Storage and document authorization

Object IDs never grant access by themselves. Check subject, organization, object ACL, share expiry, collaborator role and workspace policy at each upload, download, version read, thumbnail, full-text search and AI retrieval. Presigned upload/download URLs must be short-lived, bounded by size/type, and generated only after authorization. Text-extraction/indexing workers use scoped credentials and blocked outbound networking by default.

Real-time co-editing requires a change protocol (e.g., CRDT), conflict/replay tests, durable snapshots, access revocation handling and restore from version history. Do not present local-only autosave as collaboration.

## Readiness gates

**Current:** E3 reserved and explicitly blocked by the repository policy. Design docs and experiments can be prepared independently. **Future:** only a coordinated repository change can update E3 manifest/build-state and shipping CI, after both upstream gates are signed off.
