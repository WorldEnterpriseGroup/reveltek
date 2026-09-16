#!/usr/bin/env node
// audit-route-continuity.mjs — route-continuity gate for the RevelTek Astro migration.
// Compares the 41-route legacy baseline against the built candidate (dist/) and fails
// on blockers (lost routes, missing canonicals, h1 regressions, sitemap gaps).
// Known-benign items are reported as warnings, never blockers.
//
// Usage: node scripts/audit-route-continuity.mjs [--dist dist]
// Exit code: 0 when blockers == 0, 1 otherwise.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const distDir = join(root, (args[args.indexOf('--dist') + 1] || 'dist'));
const adoptionDir = join(root, '.astro-magazine', 'adoption');

const STUBS = new Set(['/awards.html', '/jobs.html', '/government.html', '/culture.html']);
const baseline = JSON.parse(readFileSync(join(adoptionDir, 'baseline-manifest.json'), 'utf8'));
const candidate = JSON.parse(readFileSync(join(adoptionDir, 'candidate-manifest.json'), 'utf8'));
const baselineUrls = baseline.map((r) => r.url);
const candidateUrls = new Set(candidate.map((r) => r.url));

const blockers = [];
const warnings = [];
let preserved = 0;

const read = (p) => readFileSync(p, 'utf8');
const countTag = (html, tag) => (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;

// 1. Every baseline route must exist in the built candidate.
for (const url of baselineUrls) {
  const file = join(distDir, url.replace(/^\//, ''));
  if (!existsSync(file)) {
    blockers.push(`lost route: ${url} has no built file in dist/`);
    continue;
  }
  preserved += 1;
}

// 2. Per-file SEO contract checks on everything actually built.
const built = readdirSync(distDir).filter((f) => f.endsWith('.html'));
for (const file of built) {
  const url = `/${file}`;
  const html = read(join(distDir, file));
  const isStub = STUBS.has(url);
  const is404 = url === '/404.html';

  if (!/<link[^>]*rel="canonical"/i.test(html)) blockers.push(`${url}: missing canonical`);
  if (isStub) {
    if (!/name="robots"[^>]*content="noindex"/i.test(html)) blockers.push(`${url}: stub missing noindex`);
    const h1s = countTag(html, 'h1');
    if (h1s !== 0) blockers.push(`${url}: stub should have 0 h1, found ${h1s}`);
    warnings.push(`${url}: noindex stub with 0 h1 by design (canonical to parent)`);
    continue;
  }
  if (!is404) {
    const h1s = countTag(html, 'h1');
    if (h1s !== 1) blockers.push(`${url}: expected exactly 1 h1, found ${h1s}`);
    for (const pat of [
      'property="og:title"',
      'property="og:description"',
      'property="og:image"',
      'property="og:type"',
      'property="og:url"',
      'name="twitter:card"',
      'application/ld+json',
    ]) {
      if (!html.includes(pat)) blockers.push(`${url}: missing ${pat}`);
    }
  }
}

// 3. Sitemap contract: indexable routes listed, stubs/404/RTL excluded.
const sitemap = existsSync(join(distDir, 'sitemap-0.xml'))
  ? read(join(distDir, 'sitemap-0.xml'))
  : '';
const locs = new Set([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]));
for (const url of baselineUrls) {
  if (url === '/404.html') continue; // 404 excluded from sitemap by design (warned below)
  const variants = new Set([`https://reveltek.com${url}`]);
  if (url === '/index.html') variants.add('https://reveltek.com/');
  if (![...variants].some((v) => locs.has(v))) blockers.push(`${url}: missing from sitemap-0.xml`);
}
for (const loc of locs) {
  if (/RTL Version|awards|jobs|government|culture|404/i.test(loc)) {
    blockers.push(`sitemap leaks excluded URL: ${loc}`);
  }
}
if (!locs.has('https://reveltek.com/404.html')) {
  warnings.push('/404.html excluded from sitemap by design');
}
if (locs.has('https://reveltek.com/') && !locs.has('https://reveltek.com/index.html')) {
  warnings.push('homepage sitemap entry is https://reveltek.com/ while canonical is /index.html (pre-existing variance)');
}

// 4. Added-route inventory (candidate minus baseline) — informational.
const added = [...candidateUrls].filter((u) => !baselineUrls.includes(u));

console.log('=== route continuity audit ===');
console.log(`baseline : ${baselineUrls.length} routes`);
console.log(`candidate: ${candidate.length} routes`);
console.log(`preserved: ${preserved}/${baselineUrls.length}`);
console.log(`added (${added.length}): ${added.join(', ')}`);
console.log(`sitemap entries: ${locs.size}`);
console.log(`warnings (${warnings.length}):`);
for (const w of warnings) console.log(`  WARN: ${w}`);
console.log(`blockers (${blockers.length}):`);
for (const b of blockers) console.log(`  BLOCKER: ${b}`);
console.log(blockers.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(blockers.length === 0 ? 0 : 1);
