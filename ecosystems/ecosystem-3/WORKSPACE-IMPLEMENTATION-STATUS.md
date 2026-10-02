# E3 Workspace V1.2 — integration status

**Scope:** Additive standalone `apps/workspace-web` Next.js application. Proposed local origin `http://localhost:3021`. Installed only after Search V1.1 (`3020` / `4020`). Does not modify the original Platform API, BazID, E1/E2 apps, schema, migrations or canonical port allocation.

## Delivered
- Responsive 2026 BAZAARA workspace shell with sidebar, 31-product catalog, category search and keyboard shortcut, accessible controls, verified live/planned labels, pinned favorites stored only on device.
- Login using existing BazID `/v1/bazid/login/email` through a same-origin Workspace BFF. No new credential database and no credential logging. Existing host-only, HttpOnly session cookie is relayed from the Platform API.
- Every workspace page is authenticated server-side using existing `/v1/bazid/me`; every API identity response is `no-store` and projects only needed fields.
- Server-side logout calls existing `/v1/bazid/logout` to revoke the session; **does not** pretend local cookie clearing equals server revocation. In existing Platform API `WEB_ORIGINS`, append `http://localhost:3021` for this mutation and restart that API. Configuring this is a prerequisite for complete logout.
- Existing Platform homepage at 3005, BazID at 3004 and Search at 3020 are preserved.
- Tests for origin validation, product inventory, input validation, profile projection, non-leaking errors, port isolation, lockfile surgery and logout source ordering.

## Deliberately not implemented yet
- Organization membership, RBAC, cross-product API scopes and OIDC authorization-code + PKCE client registration. These require explicit integration review before E1/E2 platform changes.
- Box, Docs, Bmail and other planned apps. Launcher labels them in development; there are no fake working views.
- Cross-device synchronization of favorites, notification feed, cloud-saved recent documents and smart automation.
- Production-grade security review, CSP nonces, browser E2E, mobile screen-reader testing, high availability, live credential tests and production release.

## Identity caveat
For local development open Workspace as **`http://localhost:3021`** and BazID as **`http://localhost:3004`**. Platform sets an HttpOnly host-only cookie. Cookies do not depend on port but *do* depend on hostname; using `127.0.0.1` for one of these breaks cookie sharing. This package defaults to `bazid_session`; if your Platform API changed `BAZID_COOKIE_NAME`, set `WORKSPACE_SESSION_COOKIE_NAME` accordingly before running Workspace.

Do not add 3021 to production `WEB_ORIGINS` as HTTP. Production needs approved HTTPS domains, reviewed scopes and dedicated secure cookie domain policy.
