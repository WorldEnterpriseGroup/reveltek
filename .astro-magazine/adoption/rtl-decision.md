# RTL Version — keep/drop decision

Date: 2026-09-16 · Branch: sota/seo-headings · Owner: tech-lead
Status: DECIDED — DROP from build, KEEP legacy dir untouched until cutover

## Context

- `RTL Version/` at repo root holds 24 legacy right-to-left duplicate pages
  (about, blog-*, careers, cart, checkout, contact, faq, index-2, …).
- The Astro v7 port (`src/pages/`, 47 routes) intentionally has no RTL routes:
  no `src/pages` counterpart exists, and `astro.config.mjs` filters
  `/RTL Version/` out of the sitemap integration.
- Verified 2026-09-16 against `dist/`: zero RTL *page* output. The only
  `rtl*` files in `dist/` are inert theme assets (`rtl-style.css`,
  `rtl-responsive.css`, `rtl-main.js`) copied from `public/assets/`; no
  built page references them and no `src/` file mentions "RTL Version".

## Options considered

1. **Port RTL duplicates as `*.rtl.html` / `/rtl/*` routes** — rejected.
   Creates ~24 duplicate indexable URLs, splits ranking signals, needs a
   full hreflang matrix (`hreflang="ar"` etc.) that does not exist today.
   No evidence of RTL traffic demand; cost with no return.
2. **Keep legacy `RTL Version/` dir co-located until cutover** — accepted.
   Matches the existing accepted exception ("legacy files co-located during
   migration", expires at cutover). The dir ships nothing to `dist/`.
3. **Delete `RTL Version/` now** — rejected. Deletion is irreversible and has
   zero build benefit (it is already excluded). Revisit post-cutover when the
   legacy root files are retired as a batch.

## Decision

- **DROP from build/sitemap permanently** (no port, no re-add). Any future RTL
  need must come back as a scoped proposal with hreflang + single-canonical
  design, not a duplicated page set.
- **KEEP the legacy dir byte-identical until cutover**; do NOT silently re-add
  duplicates to `src/pages/`, `dist/`, or any sitemap.
- Guards already in place: `astro.config.mjs` sitemap `filter` excludes
  `/RTL Version/`; `scripts/audit-route-continuity.mjs` fails the build gate
  if any `RTL Version` URL leaks into `sitemap-0.xml`.

## Recommendation

No further action this milestone. Post-cutover cleanup may remove the legacy
dir together with the other root-level legacy files.
