# BAZAARA Ecosystem 3 — architecture baseline

**Basis:** Bazaara-Ecosystem-1.zip inspected 2026-09-24. This document is a proposed design, not evidence of completed Ecosystem 3 implementations.

## Repository contract

Keep one canonical `bazaara-platform` monorepo. Runtime sources belong in `apps/`, `services/`, and `packages/`; `ecosystems/` contains architecture, policies, manifests and release gates only. Do not duplicate or replace BazID, Operations, GO, Wallet, security, notifications or the shared design system.

**Gate preservation:** the supplied repository declares Ecosystem 3 `RESERVED_NOT_BUILDING`, blocked until Ecosystem 2 stabilizes. This planning pack does not lift that gate or change existing services. For parallel experimentation, work on a feature branch with new, nonconflicting paths; promote the implementation only after shared-contract CI and the agreed integration gate.

## Proposed product groups (31 existing reserved products)

1. **Internet:** Bazaara.com Search, Nova, Maps, Translate, News.
2. **Communication:** Bmail, Meet, Calendar, Contacts.
3. **Productivity:** Docs, Sheets, Slides, Forms, Notes.
4. **Storage and security:** Box, Vault, Photos.
5. **Creative and intelligence:** Studio, Bazaara AI.
6. **Collaboration:** Spaces, Boards, Projects, Flow, Workspace.
7. **Platform and infrastructure:** Sites, Code, Cloud, Creator Hub, Seller OS, Business OS, Bazaara One.

These are logical user-facing groups, not seven mandatory deployable microservices.

## Proposed deployment boundaries

| Boundary | Ownership | Integration rule |
|---|---|---|
| BazID (existing) | identity, consent, authenticated sessions, future @bmail.com alias reservation | Extend using reviewed routes + schema migration; never fork users/passwords in Ecosystem 3. |
| Platform homepage (existing `apps/bazaara-web`, localhost:3005) | gateway to all ecosystems | Preserve existing `/`; use `/search` or link to a separate Search subdomain. |
| Search (proposed `apps/search-web` + `services/search-api`) | privacy controls, query API, result presentation, ranking and independent crawler/indexer later | Query providers only under published data-handling terms. Keep commerce search separate from web search. |
| Workspace (proposed `apps/workspace-web`) | navigation, permissions and unified workspaces | Federate links/permissions; don't copy private file data into the portal. |
| Box + document services (proposed) | tenant-scoped object metadata and editing APIs, collaborative change streams, export/import | Use distinct logical storage and lifecycle policies; immutable version history. |
| Bmail (proposed) | mailbox/alias mapping, SMTP/IMAP-or-equivalent interface, spam protections | Enable mailbox only after real MX/SPF/DKIM/DMARC, abuse prevention and key handling are tested. |
| AI orchestration (proposed) | provider abstraction, approvals, data minimization, safety controls and usage limits | No silent training on private workspace content; document retrieval must enforce access rights. |
| Shared Operations (existing) | alerts, RBAC, abuse investigation, service health, audit and support | Integrate into existing control plane through approved internal APIs/events. |

## Local port and domain proposal — not yet allocated

Existing production configuration claims `https://bazaara.com` as the **portal** and `https://api.bazaara.com` as the existing Platform API. It explicitly does not prove that DNS is live. Existing E1 web ports are 3001–3012, the E2 roadmap proposes 3013–3019 (BazChat through BazSend), and the shared Platform API uses 4000. E2 assignments must be reconciled against its current branch before merging.

After coordinating allocations with the Ecosystem 1 and 2 branches, suggest:

- `apps/search-web`: proposed port **3020**; candidate public domain `search.bazaara.com`.
- `apps/workspace-web`: proposed port **3021**; candidate `workspace.bazaara.com`.
- `apps/bmail-web`: proposed port **3022**; candidate `mail.bazaara.com` (must not imply `@bmail.com` email delivery exists).
- `apps/docs-web`: proposed port **3023**; candidate `docs.bazaara.com`.
- `services/search-api`: proposed **4020**; other backend services require separately approved allocations.
- Dedicated E3 backend services should use separately approved ports or infrastructure routing; do not assign API port 4000 to new services.

**Never edit shared `ecosystems/port-map.json` or `deployment/production-domains.json` in parallel branches without reconciling concurrent allocations first.**

See `PORT-REGISTRY.md` for the E2/E3 coordination table and static collision checker.

## API contracts proposed for initial implementation

- `GET /v1/search?q=...&vertical=web` — public request with conservative rate limits; provider adapter, quality metadata and explicit no-results/error states; no invented results.
- `GET /v1/bazid/bmail-alias/availability?localPart=...` — authenticated or abuse-limited availability check; response is advisory, not a reservation.
- `POST /v1/bazid/bmail-alias/reservations` — BazID-authenticated, CSRF-protected, **transactional** unique alias reservation with normalization, blocked names and abuse controls. Requires a reviewed database migration. Do not automatically assign suggested aliases.
- `GET /v1/workspace/me` — BazID-protected product links, entitlements and tenant memberships, avoiding N+1 fetches and permission leaks.
- `GET /v1/box/objects` / `POST /v1/box/uploads` — owner/tenant-scoped metadata, short-lived authorized upload URLs, size/type limits, malware quarantine and versioning.

Route examples are design contracts, not existing endpoints.

## Non-negotiable controls

- Enforce HTTPS, origin restrictions, appropriate CSP and other response headers on document-rich surfaces; do not copy the API's current `contentSecurityPolicy: false` setting into E3.
- BazID scopes must be explicitly registered (`search`, `workspace`, `mail`, `docs`, etc.) and validated per client; use authorization code + PKCE for public clients, and review web session architecture.
- Namespace all data by user and/or organization; enforce server-side object authorization on every content read/write, search filter, share link and AI retrieval.
- Encrypt transport and storage; Vault requires a separate client-side encryption/key-recovery threat model rather than relabeling ordinary object storage as a vault.
- Minimize and bound query/log retention; avoid logging private document bodies or mailbox content. Publish accurate privacy and clean-mode behavior.
- Separate untrusted HTML, uploads, indexing fetches, email attachments and AI tools from privileged internal networks; block SSRF, HTML injection, prompt-injection cross-boundary actions, and malware propagation.
- For enterprise readiness, define migrations/rollback, backups/restores, queue idempotency, observability, rate limits, quotas, and per-service SLOs before rollout.

## MVP path

First approved runtime milestone: responsive Search website with a typed API/provider adapter and truthful empty/error states, on a dedicated E3 branch. Run it independently until BazID/client scopes and shared contracts are reviewed. Second: Workspace shell and permissions. Third: Box and Docs foundations. Bmail mailbox delivery, distributed indexing and advanced AI are separate infrastructural programs, not placeholders that count as a launched product.
