# Local port registry — E2/E3 coordination (V1.1)

These are **proposed local development ports**, not currently reserved by the canonical port map unless the integration branch explicitly adds them. Confirm the live E2 branch before merging.

| Owner | Product | Local port | Status |
|---|---|---:|---|
| Existing platform | Platform API | 4000 | Existing |
| Existing platform | Bazaara homepage | 3005 | Existing |
| Existing platform | BazID | 3004 | Existing |
| E2 | BazChat | 3013 | Proposed in E2 screenshot |
| E2 | BazClips | 3014 | Proposed in E2 screenshot |
| E2 | BazTune | 3015 | Proposed in E2 screenshot |
| E2 | BazForum | 3016 | Proposed in E2 screenshot |
| E2 | BazCircle | 3017 | Proposed in E2 screenshot |
| E2 | BazCut | 3018 | Proposed in E2 screenshot |
| E2 | BazSend | 3019 | Proposed in E2 screenshot |
| E3 | Search Web | 3020 | Proposed, implemented in V1.1 |
| E3 | Workspace Web | 3021 | Proposed only |
| E3 | Bmail Web | 3022 | Proposed only |
| E3 | Docs Web | 3023 | Proposed only |
| E3 | Search API | 4020 | Proposed, implemented in V1.1 |

Run `node scripts/check-e3-ports.mjs --repo <repository-root>` before installing or starting Search. The check reads the actual canonical port map and scans other workspace manifests and example environment files for collisions; the Windows launcher additionally checks live port listeners. **Do not update `ecosystems/port-map.json` or production domain records on a parallel feature branch without reconciling E2 first.**
