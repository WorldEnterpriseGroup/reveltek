# Analytics & consent decision — RevelTek

Date: 2026-09-16 · Branch: `sota/distribution` · Status: **awaiting user approval — NO tracking shipped**

## Current state (verified)

The site is **privacy-clean**: zero third-party tracking snippets anywhere in
`src/`, `public/`, or `astro.config.mjs`. The only cross-origin requests are
user-initiated content, not tracking:

- Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`) — stylesheet + font files.
- Google Maps embeds (`www.google.com`) on contact/location pages.
- YouTube embeds (`youtube.com`) on video-style blog/event posts.

No cookies are set by first-party code. No consent banner exists — correctly,
because there is nothing to consent to. **This branch ships no analytics
snippet, no tag manager, and no fingerprinting of any kind.**

## Options for approval (pick at most one)

### Option A — Stay with nothing (recommended default)

Keep the site tracking-free. Feeds (`feed.xml`), server-agnostic log
analysis (if the host ever exposes logs — Pages does not), and Search
Console suffice for a marketing site.

- Cost: $0. Privacy: maximal. Maintenance: zero. GDPR/ePrivacy: no banner needed.
- Downside: no client-side conversion funnels or campaign attribution.

### Option B — Plausible (EU-hosted, cookie-less)

Privacy-first, cookie-less by default, GDPR-compliant without a banner when
self-configured per their guidance; EU data residency available.

- Cost: Cloud from ~$9/mo, or self-hosted (single Docker container + Postgres).
- Integration: one deferred `<script>` on `BaseLayout`, *after* approval only.
- Downside: recurring cost / self-host ops; less detail than GA.

### Option C — Umami (self-hosted, cookie-less capable)

Open-source, cookie-less tracking available, data stays in our database
(aligns with the Azure/Key Vault posture in global standards).

- Cost: infra only (App container + Postgres/MySQL).
- Integration: one deferred `<script data-website-id>` on `BaseLayout`, *after* approval only.
- Downside: we own uptime, backups, upgrades.

### Explicitly NOT recommended

- **Google Analytics 4 / Universal Analytics**: third-party cookies (or
  identifiers requiring consent in the EU), US data transfer exposure, needs a
  consent banner + CMP + DPA. Disproportionate for this site.
- **Meta Pixel / TikTok / ad pixels**: surveillance-grade tracking, consent
  burden, brand mismatch for a consulting firm.
- **Session replay (Hotjar/FullStory/Clarity)**: records user behavior;
  highest consent and reputational risk. Reject unless a specific UX study
  justifies it with explicit opt-in.

## Consent & implementation rules (binding once any option is approved)

1. **No tracking ships without written approval of this doc** (reply with the
   chosen option). Analytics is opt-in infrastructure, never a drive-by commit.
2. If B or C is chosen: single deferred first-party-style script, cookieless
   mode, IP anonymization on, `referrer` policy already strict; **no**
   cross-domain, **no** advertising features, **no** tag manager.
3. A consent banner is required only if the chosen tool/config sets cookies or
   identifiers — B/C in cookie-less mode do not. If requirements change, a
   banner + policy page ships *in the same release* as the snippet, never after.
4. `public/_headers` CSP draft (`connect-src 'self'`) must gain the
   analytics endpoint explicitly — a silent snippet would be blocked by the
   future CSP, which doubles as a tripwire against drive-by tracking.
5. Privacy page: publish/refresh a plain-language privacy note alongside any
   approval (what is collected, where it lives, retention, contact).

## Decision log

| Date | Decision | By |
|---|---|---|
| 2026-09-16 | No tracking shipped on `sota/distribution`; options drafted for review | agent |
| — | _Awaiting user pick: A (none) / B (Plausible) / C (Umami)_ | user |
