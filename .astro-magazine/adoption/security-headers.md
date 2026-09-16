# Security headers story — RevelTek on GitHub Pages

Date: 2026-09-16 · Branch: `sota/distribution` · Status: documented, partially shipped

## TL;DR

- GitHub Pages **cannot send custom HTTP response headers**. There is no
  `_config.yml`, Pages UI toggle, or `meta`-tag trick that adds
  `Strict-Transport-Security`, `X-Frame-Options`, or a real
  `Content-Security-Policy`. What *is* shipped vs deferred is listed below.
- **Shipped:** `<meta name="referrer" content="strict-origin-when-cross-origin">`
  in `src/layouts/BaseLayout.astro` (real `Referrer-Policy` equivalent, safe).
- **Shipped:** `public/_headers` with the full recommended policy in Netlify
  `_headers` syntax, inert on Pages today, enforced automatically on a future
  move to Netlify / Cloudflare Pages / a CDN worker.
- **Deliberately NOT shipped:** any `<meta http-equiv="Content-Security-Policy">`.
  Reason: the theme relies on patterns a strict CSP blocks — inline
  `onload="this.media='all'"` deferred-stylesheet handlers (4× in
  `BaseLayout.astro`), inline `style="…"` attributes on 43 pages, and inline
  scripts. A meta CSP without `'unsafe-inline'` would visibly break styling
  and widgets; a meta CSP *with* `'unsafe-inline'` provides negligible value
  over no CSP while suggesting a false sense of protection. Shipping breakage
  (or theater) is worse than documenting the path. See §3 for the rollout plan.

## 1. What GitHub Pages does and does not give us

| Control | Pages behavior |
|---|---|
| HTTPS | Enforced platform-side (Let's Encrypt, HSTS on `*.github.io`; custom domain `reveltek.com` served over HTTPS with redirect). No action needed. |
| Custom response headers | **Not supported.** No per-repo header configuration exists. |
| `_headers` / `_config.yml` / `vercel.json` equivalents | Ignored. The `public/_headers` file in this repo deploys as a static text file only. |
| `<meta http-equiv>` equivalents | Only headers with a defined meta mapping work: `referrer` (Referrer-Policy), `content-security-policy` (restricted subset), `x-ua-compatible`, `content-type`, `refresh`. `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy` have **no** meta equivalent. |
| SBTM / malware review | Platform-side. No action needed. |

## 2. Shipped now (safe subset)

1. `Referrer-Policy: strict-origin-when-cross-origin` via
   `<meta name="referrer" …>` — trims cross-origin leak (notably the Google
   Maps/YouTube embeds) while keeping in-site analytics-less navigation intact.
2. `public/_headers` — full policy, ready for a CDN host (contents: HSTS,
   nosniff, DENY framing, referrer, least-privilege permissions-policy, a
   vetted CSP, COOP/CORP, immutable `/assets/*` caching). Treated as the
   canonical policy source; any header change lands there first.

## 3. CSP rollout plan (when leaving Pages, or after theme hardening)

The draft CSP in `public/_headers` currently allows `'unsafe-inline'` in
`style-src` (required by the theme's inline `style=""` attributes) and keeps
`script-src` tight (`'self'` + Google Fonts). To reach a strict policy:

1. Extract the 4 `onload="this.media='all'"` handlers into the existing
   deferred-JS bundle (or `sw-register.js` pattern) so `script-src` needs no
   `'unsafe-inline'`.
2. Migrate per-element inline `style="background-image: …"` to classes or
   CSS custom properties set from a single external stylesheet pass.
3. Remove `'unsafe-inline'` from `style-src`, add `require-trusted-types-for`
   only if the JS justifies it, then enforce (not report-only) at the CDN.
4. Re-run the SW-offline + navigation smoke test (§5) — CSP `frame-src` must
   keep covering `https://www.google.com` (Maps embeds) and
   `https://www.youtube.com` (video posts) or those widgets go dark.

Until (1)–(2) land, **do not** add a `<meta>` CSP: partial enforcement breaks
more than it protects.

## 4. Recommended header set (canonical — keep `public/_headers` in sync)

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (belt-and-braces alongside `frame-ancestors 'none'`)
- `Referrer-Policy: strict-origin-when-cross-origin` (also shipped as meta)
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Content-Security-Policy:` (draft in `_headers`; see §3 before enforcing)
- `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`
- `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` only

## 5. Verification (re-run after any header/CSP change)

- `npx astro build` green; `dist/_headers` present at root.
- Home + one page per chrome variant load with zero console CSP errors.
- SW offline test: load `index.html`, go offline, navigate — cached page or
  `404.html` fallback renders (no blank tab, no redirect loop).
- Maps embed on contact page + YouTube popup on blog/events still render
  (these are the `frame-src` allowlist canaries).
- `curl -sI https://reveltek.com/` shows no custom headers (expected on
  Pages — documents the limitation rather than hiding it).
