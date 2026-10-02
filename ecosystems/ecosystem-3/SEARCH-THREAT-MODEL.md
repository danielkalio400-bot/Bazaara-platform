# BAZAARA Search alpha — threat model and release gates

## Data flow

Browser -> Search Next.js same-origin `/api/search` BFF -> Search API bound to `127.0.0.1:4020` -> Brave Search API. Browser navigation to an external result **leaves** Bazaara. Remote image thumbnails, if enabled by user, connect directly to the remote thumbnail host.

## Assets and trust boundaries

- User search text is sensitive; it can appear in local browser history, reverse-proxy logs, process monitoring or Brave's systems even when the Bazaara Search API itself is stateless and does not log queries.
- `BRAVE_SEARCH_API_KEY` is server-only and never returned in API payloads, rendered HTML, Next `NEXT_PUBLIC_*` variables or logs.
- Provider text, titles and URLs are untrusted. The API strips control codes, validates HTTP(S) links, caps lengths and serializes JSON. React renders text nodes; no raw HTML is injected. External links use `noopener noreferrer` and `no-referrer`.
- Client query parameters are untrusted. Both the Next BFF and API constrain forwarding and validation. Provider URL/hostname is static in server code; callers cannot supply an alternative upstream host.

## Implemented alpha controls

| Threat | Current control | Remaining production work |
|---|---|---|
| API key exposure | Secret read from Search API process environment | Managed secrets/rotation and audit |
| Query/PII persistence | No application query logs, session cookies or query database | Disable query strings in front-proxy/access logs; provider DPA and retention review |
| Query abuse and quotas | API memory-backed per-socket rate limit, concurrency cap, input and time bounds | Distributed edge rate limiting with trusted client identity; provider quota alerts |
| SSRF / malicious links | Fixed upstream API endpoints; HTTP(S) URL validation for returned links | Browser safe-browsing integration, link reputation controls |
| Stored XSS | No raw HTML; text cleaned/capped and rendered by React | CSP with nonces, third-party content isolation and penetration test |
| Search-provider outage | 429/502/503/504 error classes; no fabricated results | SLOs, circuit breaker, licensed provider failover |
| External image tracking | Thumbnail display is opt-in, off by default | Controlled image proxy if feature enters production |
| Unsafe region/safety params | Enumerated allowlists; image strict/off mapping | Further policy/legal review by market |

**Release gate:** This code is an isolated runnable alpha. It has no production DNS or verified provider key, no BazID client, no deployment-scale rate limiter, no browser E2E coverage and no audited production CSP. Do not promote to production before E2 stability and coordinated release review.
