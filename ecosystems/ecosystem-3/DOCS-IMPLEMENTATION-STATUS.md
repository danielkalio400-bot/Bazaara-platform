# BAZAARA Docs — V1.4 implementation status

Status: local development alpha.

Implemented:
- Responsive Bazaara Docs web application on port 3023.
- BazID-gated server routes; browser never receives Docs or Box internal secrets.
- Dedicated Docs API on 127.0.0.1:4023.
- Box-backed `.bdoc` document bodies with local per-user metadata indexes.
- BazID subject isolation.
- Create, list, open, autosave, rename and delete flows.
- Optimistic revision control; stale saves fail with HTTP 409 rather than silently overwriting another revision.
- Copy-on-write saves: a replacement Box object is created before metadata switches to the new revision.
- Markdown-backed portable document format, live Preview mode, templates, formatting helpers, word/character counts and responsive editing UI.
- Health endpoints: `/health/live` and dependency-aware `/health/ready`.

Deliberately not production-ready yet:
- Real-time multi-user collaboration and presence.
- Comments, suggestions, tracked changes or granular sharing permissions.
- Durable PostgreSQL metadata store.
- Box object version history/recovery and garbage-collection queue.
- Offline conflict resolution.
- Rich import/export for DOCX/PDF/ODT.
- Production object storage, malware scanning and disaster recovery inherited from the current Box alpha.

Storage design:
The Docs metadata index stores only document identifiers, revision counters, title/summary data and the current Box object pointer. The document body itself is persisted as a private `.bdoc` object through Box. This avoids creating a second independent document blob store while preserving a stable Docs document ID across autosaves.

Release rule:
Do not store confidential, regulated or irreplaceable information in the local alpha. Production release remains blocked until Box and Docs storage, recovery, access-control and security requirements are completed.
