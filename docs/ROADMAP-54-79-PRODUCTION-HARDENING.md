# Roadmaps 54–79 production/integration hardening

This repository keeps the existing Ecosystem 1 applications and data model additive. The production-domain map under `deployment/production-domains.json` is configuration only; it is not evidence that DNS, TLS certificates or hosting accounts are provisioned.

## Identity and clients

BazID native authorization now uses a registered multi-client PKCE registry for Shopping, Grocery, Food, Logistics customer/courier, Drive rider/driver, Pay, Business, Pharmacy and Bazasport. Custom callback schemes are exact-match validated; Expo development callbacks are accepted only in development. Native refresh sessions retain their original scope rather than being rewritten to Shopping scope.

Web CORS origins remain explicit. Production deployments must set `WEB_ORIGINS` to the exact HTTPS origins and must not include wildcard origins when cookies are enabled.

## Event reliability and webhooks

Domain mutations append durable outbox events in the same database transaction where possible. The outbox worker claims events, retries failures with bounded exponential backoff and moves exhausted events to `DEAD_LETTER`. Business webhook endpoints are organization-scoped, event-filtered and signed with HMAC-SHA256 using an endpoint-specific secret derived from `WEBHOOK_SIGNING_MASTER_SECRET`. The signing secret is returned only at endpoint creation time.

## Media and CDN

Media uploads reserve a `MediaAsset` row and use an S3-compatible SigV4 presigned PUT against MinIO/S3. Completion verifies the object with a signed HEAD request and exact byte length before marking it `READY`. Public CDN URLs are emitted only when `CDN_BASE_URL` is configured. Production storage credentials are external secrets.

## Notifications, support, trust and risk

The existing unified Notification/NotificationDelivery, SupportCase/SupportMessage and RiskSignal systems remain shared across verticals. New vertical events flow through the durable outbox for notification/webhook consumers. Reputation aggregates and loyalty ledgers are additive platform models; they do not overwrite Shopping reviews or existing merchant trust records.

## Payments

Wallet wallet-to-wallet transfers are ledger-backed, serializable and idempotent. Balances are derived from immutable double-entry ledger entries. External funding remains unavailable until a regulated provider account, webhook verification and settlement onboarding are configured; the API returns an explicit provider-unavailable response instead of simulating money movement.

## Pharmacy and sports regulatory boundaries

Prescription submission is disabled by default and additionally requires the configured jurisdiction plus a verified uploaded document. Bazasport real-money wagering endpoints remain disabled; the capability endpoint explicitly reports that licensing, age/KYC, geolocation and responsible-gambling controls are not active.

## Privacy, analytics and lifecycle

Consent records, data-subject requests and analytics events are first-class additive records. Analytics can be disabled by environment. Data-request completion/export/deletion still requires an operator workflow and legal retention policy before production automation is enabled.

## Regionalization and feature flags

`RegionalConfig` provides region/vertical currency, locale, timezone and rules. `FeatureFlag` remains the shared flag store. Public clients can read effective platform configuration; mutation of feature flags requires the existing `admin.feature_flags` permission.

## Observability and weak networks

The shared API client generates request IDs, retries only safe GET requests, supports abort signals and never transparently replays mutations. Server logs include request IDs. Production OpenTelemetry export is configuration-gated through `OTEL_EXPORTER_OTLP_ENDPOINT`; provider-specific telemetry wiring remains an infrastructure concern.

## Release boundaries

CI validates Prisma, generated client/types, monorepo TypeScript, tests and web builds. Web applications are independently buildable. Mobile EAS profiles are included, but iOS release signing requires Apple Developer/EAS credentials and production push configuration. Provider secrets must be supplied through CI/EAS secret stores, never committed files.
