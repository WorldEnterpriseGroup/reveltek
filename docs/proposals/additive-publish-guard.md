# Proposal: additive-publish guard for gh-pages (`verify-ghpages-clean.sh` equivalent)

- Status: proposal only — no script, workflow, or settings change in this branch.
- Slice: 0 deploy-confirm (read-only verify; legacy files untouched).
- Date: 2026-09-18. Base: `origin/gh-pages` @ `26bc771`.

## Problem

`gh-pages` carries two payloads at once:

1. Legacy branch-served site: 41 tracked root `*.html` + `RTL Version/` (24 files),
   served directly while Pages source is legacy branch mode (`build_type: legacy`,
   `source: {branch: gh-pages, path: /}`, `cname: reveltek.com`).
2. Astro build input (`src/`, `public/`, `astro.config.mjs`) consumed by
   `Deploy Astro to GitHub Pages` (push on `gh-pages` + dispatch), which publishes
   `dist/` via `deploy-pages@v4`.

Any cleanup commit that deletes or renames a legacy root file changes the LIVE site
under the current legacy source mode — before the Actions cutover. Deletions are the
blast radius to guard, not additions.

## Proposal

Add a CI guard script (name TBD, e.g. `scripts/verify-ghpages-clean.sh`) that runs on
every push/PR touching `gh-pages` and FAILS closed on:

1. Tracked deletions outside an explicit allowlist (default allowlist: empty).
2. Root `*.html` count drifting from 41 (`git ls-tree HEAD --name-only | grep -c '\.html$'`).
3. `RTL Version/` removed, renamed, or file-count drift from 24.
4. `CNAME`, `public/CNAME`, `public/.nojekyll`, root `.nojekyll` missing or content drift
   (both CNAMEs must read exactly `reveltek.com`).
5. `astro.config.mjs` `site` / `outDir` / `build.format` drift
   (`https://reveltek.com`, `dist`, `file`).
6. Workflow trigger drift: `.github/workflows/deploy.yml` must keep
   `push: branches: [gh-pages]` + `workflow_dispatch` and `upload-pages-artifact path: dist`.

Pass criteria are purely additive: new/changed Astro sources, docs, and proposal files
are always allowed; nothing legacy may disappear.

## Suggested wiring (not applied here)

- New workflow job or step on `gh-pages` pushes, before `build`, running the guard with
  `fetch-depth: 0` so diff-against-base works.
- Follow repo convention: existing verifiers live in `scripts/` as `verify-*.mjs`;
  prefer `scripts/verify-ghpages-clean.mjs` (Node, no bash dependency on runners)
  unless the team wants the literal `.sh` equivalent.

## Non-goals / open decisions

- No legacy deletion, no Pages source switch in this proposal. Switching Pages source
  from legacy branch mode to GitHub Actions is a separate, user-confirmed cutover step
  (it flips what reveltek.com serves from branch root to the `dist/` artifact).
- `https_enforced: false` observed on the Pages API response — flag for the cutover
  checklist, not this guard.
- Node 20 deprecation annotations on `actions/checkout@v4`, `setup-node@v4`,
  `upload-pages-artifact@v4`, `deploy-pages@v4` (forced onto Node 24) — non-blocking;
  revisit on action major bumps.

## Verification basis (deploy-confirm evidence)

- Workflow file matches spec; latest green `Deploy Astro` run `35167059601`
  (2026-09-17, `26bc771`) + `pages-build-deployment 35167058520`; build log shows
  `./CNAME` + `./.nojekyll` archived in the pages artifact, 47 pages built.
- `dist/` is gitignored build output, correctly absent from the branch; `public/` →
  `dist/` passthrough is proven by the CI artifact log, not by a local build.
