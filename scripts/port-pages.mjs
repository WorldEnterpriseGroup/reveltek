#!/usr/bin/env node
// Port legacy root .html pages into src/pages/*.astro.
// - Reuses BaseLayout (preloader/header/footer/head/scripts).
// - Keeps body content verbatim except: image refs -> .avif, dupes merged,
//   width/height + loading/decoding added, CSS bg urls -> .avif.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

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

// raster source -> avif target (with dupe consolidation)
function swapExt(file) {
  const base = file.replace(/\.(jpe?g|png)$/i, '');
  if (base === 'assets/img/latest-post/01') return 'assets/img/blog/04.avif';
  if (base === 'assets/img/latest-post/02') return 'assets/img/blog/05.avif';
  return `${base}.avif`;
}
function avifTarget(src) {
  return swapExt(src);
}

let eagerGiven = false;

function rewriteImgs(html) {
  eagerGiven = false;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcM = tag.match(/\ssrc="([^"]+)"/i);
    if (!srcM) return tag;
    const src = srcM[1];
    if (!/^assets\/img\/.+\.(jpe?g|png)$/i.test(src)) return tag; // svg/remote: untouched
    const target = avifTarget(src);
    let out = tag.replace(srcM[0], ` src="${target}"`);
    // intrinsic dimensions from the ORIGINAL master
    const d = dims(src === target ? src : src);
    if (d && !/\swidth=/.test(out)) {
      out = out.replace(/<img\b/i, `<img width="${d.w}" height="${d.h}"`);
    }
    if (!/\sdecoding=/.test(out)) out = out.replace(/<img\b/i, '<img decoding="async"');
    if (!/\sloading=/.test(out) && !/\sfetchpriority=/.test(out)) {
      if (!eagerGiven) {
        eagerGiven = true;
        out = out.replace(/<img\b/i, '<img fetchpriority="high"');
      } else {
        out = out.replace(/<img\b/i, '<img loading="lazy"');
      }
    }
    return out;
  });
}

function rewriteUrls(html) {
  // lightbox/anchor hrefs and content attrs pointing at raster images
  html = html.replace(
    /(href|content)="(assets\/img\/[^"]+?\.(?:jpe?g|png))"/gi,
    (_m, attr, file) => `${attr}="${swapExt(file)}"`,
  );
  // CSS background urls: url(assets/img/x.jpg) -> url(assets/img/x.avif)
  html = html.replace(
    /url\((assets\/img\/[^)]+?\.(?:jpe?g|png))\)/gi,
    (_m, file) => `url(${swapExt(file)})`,
  );
  // data-* image attributes (e.g. slider data-thumb)
  html = html.replace(
    /(data-[a-z-]+)="(assets\/img\/[^"]+?\.(?:jpe?g|png))"/gi,
    (_m, attr, file) => `${attr}="${swapExt(file)}"`,
  );
  // Astro JSX-whitespace compression would drop the rendered space between an
  // inline icon and following text: pin it explicitly.
  html = html.replace(/<\/i>\s+([A-Za-z0-9+])/g, "</i>{' '}$1");
  return html;
}

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const report = [];
fs.mkdirSync(path.join(ROOT, 'src', 'pages'), { recursive: true });

const MARKERS = {
  'index-3.html': { headEnd: 'Header Section end', footStart: 'Footer Section Start' },
};

// Approved per-page chrome, inventoried from the legacy files: inner pages
// carry the template nav + their own footer copy; updated families carry the
// custom RevelTek nav. Never unify: preservation beats consistency here.
const HEADER = {
  alt: ['ai', 'analytics', 'blog', 'cloud', 'consulting', 'events', 'guides', 'products', 'software', 'studies'],
  overview: ['education', 'fintech', 'health', 'retail'],
  contact: ['contact', 'story', 'why-us'],
  inner: ['about', 'blog-details', 'blog-grid', 'blog-standard', 'cart', 'checkout', 'faq', 'job', 'job-details', 'portfolio', 'portfolio-2', 'portfolio-details', 'product-details', 'service-details', 'services', 'services-2', 'shop', 'team', 'team-details'],
  two: ['index-2'],
  three: ['index-3'],
};
const FOOTER = {
  inner: ['about', 'cart', 'checkout', 'faq', 'job', 'job-details', 'portfolio', 'portfolio-2', 'portfolio-details', 'product-details', 'service-details', 'services-2', 'services', 'shop', 'team', 'team-details'],
  services: ['ai', 'analytics', 'cloud', 'products'],
  blog: ['blog-details', 'blog-grid', 'blog-standard'],
  insights: ['blog', 'events', 'guides', 'studies'],
  company: ['careers', 'contact', 'education', 'fintech', 'health', 'retail', 'industries', 'story', 'why-us'],
  consulting: ['consulting'],
  software: ['software'],
  two: ['index-2'],
  grey: ['index-3'],
};
const kindOf = (map, name) => Object.entries(map).find(([, v]) => v.includes(name))?.[0];

for (const file of files) {
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const title = (raw.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim().replace(/\s+/g, ' ') || file;
  const desc =
    (raw.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || title;

  const m = MARKERS[file] || { headEnd: 'Header part end', footStart: 'Footer Part Start' };
  const headEnd = raw.indexOf(m.headEnd);
  const footStart = raw.indexOf(m.footStart);
  if (headEnd < 0 || footStart < 0) {
    report.push({ file, status: 'SKIP-no-markers' });
    continue;
  }
  let body = raw.slice(raw.indexOf('-->', headEnd) + 3, raw.lastIndexOf('<!--', footStart));
  // drop IE conditional + blank edges
  body = body.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/g, '').trim();
  // normalize indentation: strip one leading tab for readability (content keeps relative structure)
  body = body
    .split('\n')
    .map((l) => (l.startsWith('\t') ? l.slice(1) : l))
    .join('\n');

  body = rewriteUrls(rewriteImgs(body));

  // hero preload: first banner background on the page, if any
  const bannerM = body.match(/url\((assets\/img\/banner\/[^)]+)\)/);
  const heroPreload = bannerM ? bannerM[1] : undefined;

  const name = file.replace(/\.html$/, '');
  const pageName = name === 'index' ? 'index' : name;
  const hKind = kindOf(HEADER, name);
  const fKind = kindOf(FOOTER, name);
  const chromeProps = `${hKind ? `\n  header="${hKind}"` : ''}${fKind ? `\n  footer="${fKind}"` : ''}`;
  const astro = `---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="${title.replace(/"/g, '&quot;')}"
  description="${desc.replace(/"/g, '&quot;')}"
  canonicalPath="/${file}"${chromeProps}${heroPreload ? `\n  heroPreload="/${heroPreload}"` : ''}
>
${body}
</BaseLayout>
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'pages', `${pageName}.astro`), astro);
  const imgs = (body.match(/<img\b/gi) || []).length;
  const avifs = (body.match(/\.avif/gi) || []).length;
  report.push({ file, status: 'ok', imgs, avifRefs: avifs, heroPreload: heroPreload || null });
}

fs.writeFileSync('/tmp/port-report.json', JSON.stringify(report, null, 2));
console.log(report.map((r) => `${r.status} ${r.file} imgs=${r.imgs ?? '-'} avif=${r.avifRefs ?? '-'}`).join('\n'));
