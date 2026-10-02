# Ecosystem 2 — Independent Social, Media & Communication Products

Status: INDEPENDENT PRODUCT BETA 1

Active products and local ports:
- BChat — 3013 — messaging and calls foundation
- ZimZam — 3014 — short-form video
- BTune — 3015 — music and audio
- Bicord — 3017 — merged communities + social network
- BazCut — 3018 — video editing
- BSend — 3019 — file transfer

Port 3016 is intentionally retired from Ecosystem 2 after BazForum was merged into Bicord.

## Architecture rule
Each product is independently usable with its own product UI, navigation and workflows. BazID and platform services may be reused behind the scenes, but no product requires another Ecosystem 2 product to function. Cross-app bridges are optional future integrations only.

## Beta 1 changes
- Removed the shared Ecosystem 2 cross-app shell from active app layouts.
- Renamed the public product identities to BChat, ZimZam, BTune, Bicord, BazCut and BSend.
- Merged the existing forum/discussion and social-feed experiences into Bicord.
- Retired BazForum as a separately launched web product.
- App-specific onboarding copy now appears after BazID authentication.
- Existing API route names remain temporarily unchanged for backward compatibility.

## Safety / production claims
This build does not claim end-to-end encryption, offline peer-to-peer transfer, licensed music catalog access, or production-grade video transcoding until those systems are implemented and validated.
