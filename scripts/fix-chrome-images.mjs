import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Apply the same image transforms as port-pages.mjs to chrome partials
// (headers/footers carry instagram feeds, logos, line shapes, client marks).
const ROOT = '/home/mrh/repos/worldenterprisegroup/reveltek';
const dimCache = new Map();
function dims(rel) {
  if (dimCache.has(rel)) return dimCache.get(rel);
  try {
    const out = execSync(`magick identify -format "%w %h" "${path.join(ROOT, rel)}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split(' ');
    const d = { w: +out[0], h: +out[1] };
    dimCache.set(rel, d);
    return d;
  } catch {
    dimCache.set(rel, null);
    return null;
  }
}
function swapExt(file) {
  const base = file.replace(/\.(jpe?g|png)$/i, '');
  if (base === 'assets/img/latest-post/01') return 'assets/img/blog/04.avif';
  if (base === 'assets/img/latest-post/02') return 'assets/img/blog/05.avif';
  return `${base}.avif`;
}

const dir = `${ROOT}/src/components/chrome`;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.astro')) continue;
  const p = `${dir}/${f}`;
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = tag.match(/\ssrc="([^"]+)"/i);
    if (!m || !/^assets\/img\/.+\.(jpe?g|png)$/i.test(m[1])) return tag;
    let out = tag.replace(m[0], ` src="${swapExt(m[1])}"`);
    const d = dims(m[1]);
    if (d && !/\swidth=/.test(out)) out = out.replace(/<img\b/i, `<img width="${d.w}" height="${d.h}"`);
    if (!/\sdecoding=/.test(out)) out = out.replace(/<img\b/i, '<img decoding="async"');
    if (!/\sloading=/.test(out) && !/\sfetchpriority=/.test(out))
      out = out.replace(/<img\b/i, '<img loading="lazy"');
    return out;
  });
  s = s.replace(/(href|content)="(assets\/img\/[^"]+?\.(?:jpe?g|png))"/gi, (_m, a, file) => `${a}="${swapExt(file)}"`);
  s = s.replace(/url\((assets\/img\/[^)]+?\.(?:jpe?g|png))\)/gi, (_m, file) => `url(${swapExt(file)})`);
  s = s.replace(/(data-[a-z-]+)="(assets\/img\/[^"]+?\.(?:jpe?g|png))"/gi, (_m, a, file) => `${a}="${swapExt(file)}"`);
  fs.writeFileSync(p, s);
  console.log('rewrote', f);
}
