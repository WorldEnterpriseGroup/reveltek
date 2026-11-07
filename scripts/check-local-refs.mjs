#!/usr/bin/env node
// Fail when a page or stylesheet points at a local file that does not exist.
// Checks src/href/srcset/data-* image attributes in *.html and url(...) in *.css,
// resolved the way a browser resolves them against the page's URL (the repo
// root is the site root, so "../" above it clamps to it). Remote URLs, anchors, mailto:, tel:, data: and javascript: are skipped.
// Usage: node scripts/check-local-refs.mjs [root]   (default: cwd)
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';

const root = resolve(process.argv[2] || '.');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (['.html', '.css'].includes(extname(name))) out.push(p);
  }
  return out;
}

const isLocal = (u) => u && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\{|\$)/i.test(u);

function refs(file, text) {
  const found = [];
  if (file.endsWith('.html')) {
    for (const m of text.matchAll(/\s(?:src|href|data-src|data-bg|data-background|poster)\s*=\s*["']([^"']+)["']/gi)) found.push(m[1]);
    for (const m of text.matchAll(/\ssrcset\s*=\s*["']([^"']+)["']/gi)) for (const part of m[1].split(',')) found.push(part.trim().split(/\s+/)[0]);
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) found.push(m[1]);
  } else {
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) found.push(m[1]);
    for (const m of text.matchAll(/@import\s+["']([^"']+)["']/gi)) found.push(m[1]);
  }
  return found;
}

let missing = 0;
let checked = 0;
for (const file of walk(root)) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`cannot read ${relative(root, file)}: ${err.message}`);
    process.exitCode = 1;
    continue;
  }
  for (const raw of refs(file, text)) {
    const u = raw.trim().split(/[?#]/)[0];
    if (!isLocal(raw.trim()) || !u) continue;
    // Resolve the way a browser does, so "../" above the site root clamps to the root.
    const page = new URL('http://site/' + relative(root, file).split('\\').join('/'));
    let pathname;
    try { pathname = decodeURIComponent(new URL(u, page).pathname); } catch { pathname = new URL(u, page).pathname; }
    const target = join(root, pathname);
    checked++;
    const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    if (!ok) {
      missing++;
      console.log(`${relative(root, file)}: missing ${raw}`);
    }
  }
}
console.log(`check-local-refs: ${checked} local references, ${missing} missing`);
if (missing > 0) process.exitCode = 1;
