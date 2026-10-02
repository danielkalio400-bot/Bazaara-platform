# BAZAARA Ecosystem 3 — Box V1.3 status

**Milestone:** Third local alpha, after Search V1.1 and Workspace V1.2. **Not a production release.** Does not change BazID, the main Platform API, existing database, port map or ecosystem build-state policy.

## Implemented and testable

- Box Web: Next.js 16 / React 19 / TypeScript, responsive file manager with folder navigation, in-folder filtering, upload, download, deletion and capacity meter. Live on **localhost:3022**.
- Box API: separate Node 22+ HTTP service bound to loopback **127.0.0.1:4022**. Health endpoint `/health/live`, account-specific list/create/download/delete operations.
- BazID reuse: Next.js same-origin back end checks the **existing** `/v1/bazid/me` on the Platform API using the current request's session cookie **on every operation**; it never trusts a browser-provided user ID. API accepts only a 20-second HMAC-signed, HTTP-method/path-bound internal assertion, using a random shared secret generated locally by the installer.
- Disk persistence: per-user SHA-256 account namespace, metadata committed via write-then-rename and serialized per-user writes **within one API process**. 10 MB/file; 100 MB/account local development quota; up to 1000 files and 1000 folders.
- Isolation: authenticated users cannot list/download/delete another account's files; uploads and mutations use an exact-origin browser gate and file names/IDs are validated. Downloads use attachment disposition and octet-stream content type.
- Workspace V1.2 integration: safe opt-in Box catalog enablement only if existing files exactly match the supplied known version. Creates backups and rejects diverged parallel Workspace code. Installer does not overwrite other ecosystem apps.
- PowerShell: version/port checks, backup-before-upgrade, no permanent execution-policy change required, separate launch scripts, local test script. Both secret env files are written **UTF-8 without BOM** for Windows PowerShell 5.1 + Node compatibility.

## Incomplete; do not claim to be delivered

- No malware scanning, MIME content validation, preview sandbox, file version history, deleted-file recovery, retention, sharing, team ACLs, audit feed or offline sync.
- No S3-compatible replicated object storage, PostgreSQL transactional metadata, multi-process locking, geo-redundancy, backup/restore or production KMS envelope encryption. File data remains on the local machine in plaintext.
- No browser/manual BazID login or Windows PowerShell execution completed inside the build environment. Frontend production build and external security audit must be run on target environment before considering deployment.
- No changes to `ecosystems/port-map.json` or `ecosystems/build-state.json` until E1/E2 integration review. Port 3022/4022 are **proposed** for this branch and checked against the user-supplied repository snapshot; reconcile with newer parallel branches.

## Next milestone — BAZAARA Docs

After live Box login/upload/download are verified, implement Docs editing/autosave against **versioned storage** with explicit write concurrency control. Do not treat the local single-process store as a production Docs persistence backend.
