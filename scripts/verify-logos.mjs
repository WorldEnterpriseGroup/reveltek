#!/usr/bin/env node
/**
 * verify-logos.mjs — Playwright logo visual gates for the RevelTek Astro port.
 *
 * Repeatable PASS/FAIL assertions per the logo diagnosis matrix. Serves NO
 * pages itself: point --base at a static server rooted at candidate dist/
 * (e.g. `python3 -m http.server 8931 --directory dist`, then
 * `node scripts/verify-logos.mjs --base http://127.0.0.1:8931`).
 *
 * Matrix:
 *   URLs: index.html (main), ai.html (alt), about.html (inner),
 *         contact.html (contact), health.html (overview),
 *         index-2.html (two), index-3.html (three).
 *   Viewports: desktop 1440x900, mobile 390x844 (+ mobile nav-open, header
 *   close-up clip of the site-logo bbox padded by 40px).
 *
 * Per page/viewport gates:
 *   header-visible  header .site-logo img is visible, naturalWidth > 0,
 *                   rendered width fits the orange wedge (<=265px @1440,
 *                   <=220px mobile).
 *   contrast-spec   distance(mean(logo-box pixels), effective .header-nav bg)
 *                   must be >= 24 (white-on-white guard, spec-literal).
 *   contrast-glyph  hiding the img must change the logo box mean by >= 12
 *                   (logo actually paints; catches buried/broken logos).
 *                   Backdrop stability is verified (two hidden shots must
 *                   agree within 8) else the check is ERROR, not FAIL.
 *   sticky          after scrolling 600px, header.sticky-header carries
 *                   .sticky-on, .header-nav bg is opaque and equals the
 *                   per-kind expectation (white, except `two` which is dark
 *                   #14212b by design); contrast gates re-asserted.
 *   wedge           main/alt/inner/contact/overview only, desktop+mobile,
 *                   top+sticky: wedge-containment (logo rect fully inside the
 *                   orange wedge box 445/265/245/220 by viewport width),
 *                   wedge-white-paint (logo box paints white: shown whiteFrac
 *                   >= 0.05 and hidden mean ~= orange [255,74,23] within 40),
 *                   wedge-sticky (containment + paint re-run after 600px
 *                   scroll with .sticky-on asserted).
 *   footer          footer .footer-logo img[src*="reveltek.svg"] exists with
 *                   naturalWidth > 0; body visible text contains zero "Finsa".
 *   console         no console.error and no 4xx for assets/img/svg/* or
 *                   assets/img/logo-*.
 *
 * Screenshots land in --out (default <repo>/gates) as
 *   <kind>/header-desktop|header-mobile|header-sticky-desktop|
 *   header-sticky-mobile|header-closeup|footer-desktop|nav-open-mobile.png
 * plus results.json. Exit 0 when every gate passes, 1 otherwise.
 * No dependencies beyond the `playwright` npm package (resolved from the
 * local install, or from the global npm root as a fallback).
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

const SPEC_DELTA_MIN = 24; // spec-literal white-on-white guard
const VIS_DELTA_MIN = 12; // glyph must contribute to its box
const STABILITY_MAX = 8; // hidden-shot repeatability ceiling
const WEDGE_MAX = { desktop: 265, mobile: 220 };
const WEDGE_ORANGE = [255, 74, 23]; // header .header-nav::before bg
const WEDGE_WHITEFRAC_MIN = 0.05; // white logo must paint inside its box
const WEDGE_ORANGE_DELTA_MAX = 40; // hidden box mean must read as orange wedge
const WEDGE_KINDS = new Set(['main', 'alt', 'inner', 'contact', 'overview']);
const SETTLE_MS = 1200;
const HIDE_SETTLE_MS = 400;

/** Orange wedge box width for a viewport width (matches style.css breakpoints). */
function wedgeWidthForViewport(vw) {
  if (vw > 1599) return 445;
  if (vw > 1199) return 265;
  if (vw > 991) return 245;
  return 220;
}

const PAGES = [
  { kind: 'main', file: 'index.html', stickyBg: [255, 255, 255] },
  { kind: 'alt', file: 'ai.html', stickyBg: [255, 255, 255] },
  { kind: 'inner', file: 'about.html', stickyBg: [255, 255, 255] },
  { kind: 'contact', file: 'contact.html', stickyBg: [255, 255, 255] },
  { kind: 'overview', file: 'health.html', stickyBg: [255, 255, 255] },
  { kind: 'two', file: 'index-2.html', stickyBg: [20, 33, 43] }, // dark sticky variant by design
  { kind: 'three', file: 'index-3.html', stickyBg: [255, 255, 255] },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

function parseArgs(argv) {
  const out = { base: 'http://127.0.0.1:8931', out: path.join(REPO, 'gates') };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--base' && argv[i + 1]) out.base = argv[++i];
    else if (argv[i] === '--out' && argv[i + 1]) out.out = path.resolve(argv[++i]);
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('usage: node scripts/verify-logos.mjs [--base URL] [--out DIR]');
      process.exit(0);
    }
  }
  out.base = out.base.replace(/\/+$/, '');
  return out;
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (firstErr) {
    try {
      const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
      return await import(path.join(npmRoot, 'playwright', 'index.mjs'));
    } catch (secondErr) {
      throw new Error(
        `playwright module not found (local: ${firstErr.message}; global: ${secondErr.message}). ` +
          'Install it (`npm i -D playwright` + `npx playwright install chromium`) and retry.',
      );
    }
  }
}

const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const round1 = (v) => Math.round(v * 10) / 10;
const fmtRgb = (v) => `[${v.map((n) => Math.round(n)).join(', ')}]`;

function parseRgb(s) {
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(s || '');
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
}

/** Mean RGB (+near-white fraction) of a page screenshot clip, decoded in-page. */
async function clipStats(page, clip) {
  const buf = await page.screenshot({ clip });
  const url = `data:image/png;base64,${buf.toString('base64')}`;
  return page.evaluate(async (u) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('shot decode failed'));
      img.src = u;
    });
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const n = d.length / 4;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let white = 0;
    for (let i = 0; i < d.length; i += 4) {
      sr += d[i];
      sg += d[i + 1];
      sb += d[i + 2];
      if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) white += 1;
    }
    return { mean: [sr / n, sg / n, sb / n], whiteFrac: white / n, px: n };
  }, url);
}

async function headerFacts(page) {
  return page.evaluate(() => {
    const img = document.querySelector('header .site-logo img');
    if (!img) return { found: false };
    const r = img.getBoundingClientRect();
    const nav = document.querySelector('header .header-nav');
    // Effective bg: first opaque computed bg walking up from .header-nav.
    let effective = null;
    let probe = nav;
    while (probe && probe !== document.documentElement) {
      const bg = getComputedStyle(probe).backgroundColor;
      const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(bg || '');
      if (m && (m[4] === undefined || Number(m[4]) >= 1)) {
        effective = [Number(m[1]), Number(m[2]), Number(m[3])];
        break;
      }
      probe = probe.parentElement;
    }
    return {
      found: true,
      src: img.getAttribute('src'),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      navBg: nav ? getComputedStyle(nav).backgroundColor : null,
      effectiveBg: effective,
      headerClass: document.querySelector('header') ? document.querySelector('header').className : null,
    };
  });
}

/** Contrast pair for the current logo box; retries once on unstable backdrop. */
async function contrastPair(page, box) {
  const clip = {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width: box.width,
    height: box.height,
  };
  const shown = await clipStats(page, clip);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.evaluate(() => {
      document.querySelector('header .site-logo img').style.visibility = 'hidden';
    });
    await page.waitForTimeout(HIDE_SETTLE_MS);
    const hiddenA = await clipStats(page, clip);
    const hiddenB = await clipStats(page, clip);
    const stability = dist3(hiddenA.mean, hiddenB.mean);
    if (stability <= STABILITY_MAX) {
      await page.evaluate(() => {
        document.querySelector('header .site-logo img').style.visibility = '';
      });
      await page.waitForTimeout(200);
      return { shown, hidden: hiddenA, visDelta: dist3(shown.mean, hiddenA.mean), stability };
    }
    if (attempt === 1) {
      await page.evaluate(() => {
        document.querySelector('header .site-logo img').style.visibility = '';
      });
      return { shown, hidden: hiddenA, visDelta: dist3(shown.mean, hiddenA.mean), stability, unstable: true };
    }
  }
  throw new Error('unreachable contrastPair');
}

function check(name, pass, detail) {
  return { name, verdict: pass ? 'PASS' : 'FAIL', detail };
}

async function runCase(browser, base, outDir, pageDef, vp) {
  const url = `${base}/${pageDef.file}`;
  const kindDir = path.join(outDir, pageDef.kind);
  fs.mkdirSync(kindDir, { recursive: true });
  const records = [];
  const shot = (name) => path.join(kindDir, name);
  const consoleErrors = [];
  const badResponses = [];
  const pg = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  try {
    pg.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
    });
    pg.on('response', (r) => {
      if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
    });
    await pg.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await pg.waitForTimeout(SETTLE_MS);

    const facts = await headerFacts(pg);
    let topPair = null;
    if (!facts.found) {
      records.push({ name: `header-${vp.name}`, verdict: 'FAIL', detail: 'header .site-logo img missing' });
    } else {
      const widthMax = WEDGE_MAX[vp.name];
      records.push(
        check(
          `header-${vp.name}`,
          facts.naturalWidth > 0 && facts.rect.width > 0 && facts.rect.height > 0 && facts.rect.width <= widthMax,
          `src=${facts.src} natural=${facts.naturalWidth}x${facts.naturalHeight} ` +
            `rect=${round1(facts.rect.width)}x${round1(facts.rect.height)} (max ${widthMax})`,
        ),
      );

      const pair = await contrastPair(pg, facts.rect);
      topPair = pair.unstable ? null : pair;
      if (pair.unstable) {
        records.push({
          name: `contrast-${vp.name}`,
          verdict: 'ERROR',
          detail: `unstable backdrop (hidden-shot drift ${round1(pair.stability)} > ${STABILITY_MAX})`,
        });
      } else {
        const eff = facts.effectiveBg || [255, 255, 255];
        const specDelta = dist3(pair.shown.mean, eff);
        records.push(
          check(
            `contrast-spec-${vp.name}`,
            specDelta >= SPEC_DELTA_MIN,
            `boxMean=${fmtRgb(pair.shown.mean)} headerBg=${facts.navBg} ` +
              `effectiveBg=${fmtRgb(eff)} delta=${round1(specDelta)} (min ${SPEC_DELTA_MIN}) whiteFrac=${pair.shown.whiteFrac.toFixed(3)}`,
          ),
        );
        records.push(
          check(
            `contrast-glyph-${vp.name}`,
            pair.visDelta >= VIS_DELTA_MIN,
            `img shown-vs-hidden delta=${round1(pair.visDelta)} (min ${VIS_DELTA_MIN}) stability=${round1(pair.stability)}`,
          ),
        );
      }

      // Wedge gates (top state): white logo fully inside the orange wedge.
      if (WEDGE_KINDS.has(pageDef.kind)) {
        const wedgeW = wedgeWidthForViewport(vp.width);
        const right = facts.rect.x + facts.rect.width;
        records.push(
          check(
            `wedge-containment-${vp.name}`,
            facts.rect.x >= -1 && right <= wedgeW + 1,
            `logo x=${round1(facts.rect.x)}..${round1(right)} vs wedge 0..${wedgeW} (vw ${vp.width})`,
          ),
        );
        if (!topPair) {
          records.push({ name: `wedge-white-paint-${vp.name}`, verdict: 'ERROR', detail: 'no stable top pair for paint check' });
        } else {
          const orangeDelta = dist3(topPair.hidden.mean, WEDGE_ORANGE);
          records.push(
            check(
              `wedge-white-paint-${vp.name}`,
              topPair.shown.whiteFrac >= WEDGE_WHITEFRAC_MIN && orangeDelta <= WEDGE_ORANGE_DELTA_MAX,
              `shown whiteFrac=${topPair.shown.whiteFrac.toFixed(3)} (min ${WEDGE_WHITEFRAC_MIN}) ` +
                `hidden mean=${fmtRgb(topPair.hidden.mean)} vs orange ${fmtRgb(WEDGE_ORANGE)} delta=${round1(orangeDelta)} (max ${WEDGE_ORANGE_DELTA_MAX})`,
            ),
          );
        }
      }
    }

    await pg.locator('header .header-nav').screenshot({ path: shot(`header-${vp.name}.png`) });
    if (vp.name === 'desktop' && facts.found) {
      const pad = 40;
      const closeup = {
        x: Math.max(0, facts.rect.x - pad),
        y: Math.max(0, facts.rect.y - pad),
        width: Math.min(vp.width - Math.max(0, facts.rect.x - pad), facts.rect.width + pad * 2),
        height: Math.min(vp.height - Math.max(0, facts.rect.y - pad), facts.rect.height + pad * 2),
      };
      await pg.screenshot({ path: shot('header-closeup.png'), clip: closeup });
    }

    // Sticky state.
    await pg.evaluate(() => window.scrollTo(0, 600));
    await pg.waitForTimeout(1000);
    const sticky = await pg.evaluate(() => {
      const nav = document.querySelector('header .header-nav');
      const img = document.querySelector('header .site-logo img');
      const r = img ? img.getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0 };
      return {
        headerClass: document.querySelector('header') ? document.querySelector('header').className : null,
        navBg: nav ? getComputedStyle(nav).backgroundColor : null,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      };
    });
    const stickyOn = /\bsticky-on\b/.test(sticky.headerClass || '');
    const stickyBg = parseRgb(sticky.navBg);
    const bgOpaque = !!stickyBg && stickyBg[3] >= 1;
    const bgMatch =
      bgOpaque &&
      Math.round(stickyBg[0]) === pageDef.stickyBg[0] &&
      Math.round(stickyBg[1]) === pageDef.stickyBg[1] &&
      Math.round(stickyBg[2]) === pageDef.stickyBg[2];
    records.push(
      check(
        `sticky-${vp.name}`,
        stickyOn && bgMatch,
        `headerClass="${sticky.headerClass}" navBg=${sticky.navBg} (expect ${fmtRgb(pageDef.stickyBg)} + .sticky-on)`,
      ),
    );
    let stickyPair = null;
    if (sticky.rect.width > 0 && sticky.rect.height > 0 && sticky.rect.y >= 0) {
      const pair = await contrastPair(pg, sticky.rect);
      if (pair.unstable) {
        records.push({ name: `contrast-sticky-${vp.name}`, verdict: 'ERROR', detail: `unstable backdrop (${round1(pair.stability)})` });
      } else {
        stickyPair = pair;
        records.push(
          check(
            `contrast-sticky-${vp.name}`,
            pair.visDelta >= VIS_DELTA_MIN,
            `sticky img shown-vs-hidden delta=${round1(pair.visDelta)} (min ${VIS_DELTA_MIN}) boxMean=${fmtRgb(pair.shown.mean)}`,
          ),
        );
      }
    } else {
      records.push({ name: `contrast-sticky-${vp.name}`, verdict: 'FAIL', detail: 'sticky logo box not measurable' });
    }
    // Wedge gates (sticky state): re-run containment + paint after 600px scroll.
    if (WEDGE_KINDS.has(pageDef.kind)) {
      const wedgeW = wedgeWidthForViewport(vp.width);
      const sRight = sticky.rect.x + sticky.rect.width;
      const contained = sticky.rect.width > 0 && sticky.rect.x >= -1 && sRight <= wedgeW + 1;
      records.push(
        check(
          `wedge-containment-sticky-${vp.name}`,
          contained,
          `sticky logo x=${round1(sticky.rect.x)}..${round1(sRight)} vs wedge 0..${wedgeW} (vw ${vp.width})`,
        ),
      );
      let painted = false;
      let paintDetail = 'no stable sticky pair for paint check';
      if (stickyPair) {
        const orangeDelta = dist3(stickyPair.hidden.mean, WEDGE_ORANGE);
        painted = stickyPair.shown.whiteFrac >= WEDGE_WHITEFRAC_MIN && orangeDelta <= WEDGE_ORANGE_DELTA_MAX;
        paintDetail =
          `sticky shown whiteFrac=${stickyPair.shown.whiteFrac.toFixed(3)} (min ${WEDGE_WHITEFRAC_MIN}) ` +
          `hidden mean=${fmtRgb(stickyPair.hidden.mean)} vs orange ${fmtRgb(WEDGE_ORANGE)} delta=${round1(orangeDelta)} (max ${WEDGE_ORANGE_DELTA_MAX})`;
        records.push(check(`wedge-white-paint-sticky-${vp.name}`, painted, paintDetail));
      } else {
        records.push({ name: `wedge-white-paint-sticky-${vp.name}`, verdict: 'ERROR', detail: paintDetail });
      }
      records.push(
        check(
          `wedge-sticky-${vp.name}`,
          stickyOn && contained && (stickyPair ? painted : false),
          `.sticky-on=${stickyOn} contained=${contained} painted=${stickyPair ? painted : 'n/a'} :: ${paintDetail}`,
        ),
      );
    }
    await pg.locator('header .header-nav').screenshot({ path: shot(`header-sticky-${vp.name}.png`) });

    // Footer + Finsa + console (desktop page only; identical across viewports).
    if (vp.name === 'desktop') {
      // Footer logos are loading="lazy": scroll into view and wait for
      // decode before reading naturalWidth, else below-fold imgs race 0.
      await pg
        .locator('footer .footer-logo img')
        .first()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await pg
        .waitForFunction(
          () => {
            const i = document.querySelector('footer .footer-logo img');
            return i && i.complete && i.naturalWidth > 0;
          },
          null,
          { timeout: 8000 },
        )
        .catch(() => {});
      const foot = await pg.evaluate(() => {
        const img = document.querySelector('footer .footer-logo img[src*="reveltek.svg"]');
        const anyLogo = document.querySelector('footer .footer-logo img');
        const text = document.body ? document.body.innerText || '' : '';
        return {
          found: !!img,
          src: img ? img.getAttribute('src') : null,
          naturalWidth: img ? img.naturalWidth : 0,
          fallbackSrc: anyLogo ? anyLogo.getAttribute('src') : null,
          finsa: (text.match(/finsa/gi) || []).length,
        };
      });
      records.push(
        check(
          'footer-logo',
          foot.found && foot.naturalWidth > 0,
          foot.found
            ? `src=${foot.src} naturalWidth=${foot.naturalWidth}`
            : `no footer .footer-logo img[src*="reveltek.svg"] (footer uses ${foot.fallbackSrc})`,
        ),
      );
      records.push(check('footer-finsa', foot.finsa === 0, `visible-text "finsa" hits=${foot.finsa} (expect 0)`));
      await pg.locator('footer').screenshot({ path: shot('footer-desktop.png') });
    }

    // Mobile nav-open (fresh state: back to top first).
    if (vp.name === 'mobile') {
      await pg.evaluate(() => window.scrollTo(0, 0));
      await pg.waitForTimeout(600);
      await pg.locator('.navbar-toggler').click({ timeout: 10000 });
      await pg.waitForTimeout(800);
      const navState = await pg.evaluate(() => {
        const m = document.querySelector('.nav-menu');
        if (!m) return { found: false };
        const r = m.getBoundingClientRect();
        const cs = getComputedStyle(m);
        return {
          found: true,
          menuOn: m.classList.contains('menu-on'),
          visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.5,
          x: Math.round(r.x),
        };
      });
      records.push(
        check(
          'nav-open-mobile',
          navState.found && navState.menuOn && navState.visible,
          navState.found ? `menu-on=${navState.menuOn} visible=${navState.visible} x=${navState.x}` : '.nav-menu missing',
        ),
      );
      await pg.screenshot({ path: shot('nav-open-mobile.png') });
    }

    const logo404 = badResponses.filter((s) => /assets\/img\/(svg\/|logo-)/.test(s));
    records.push(
      check(
        `console-${vp.name}`,
        consoleErrors.length === 0 && badResponses.length === 0,
        consoleErrors.length || badResponses.length
          ? `consoleErrors=${consoleErrors.length} badResponses=${badResponses.length} logo404=${logo404.length} :: ${(consoleErrors.concat(badResponses)).slice(0, 4).join(' | ')}`
          : 'no console.error, no 4xx',
      ),
    );
  } catch (err) {
    records.push({ name: `harness-${vp.name}`, verdict: 'ERROR', detail: `exception: ${err.message}` });
  } finally {
    await pg.close().catch(() => {});
  }
  return { kind: pageDef.kind, file: pageDef.file, viewport: vp.name, url, checks: records };
}

async function main() {
  const { base, out: outDir } = parseArgs(process.argv.slice(2));
  const { chromium } = await loadPlaywright();
  fs.mkdirSync(outDir, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error(`FAIL: chromium launch failed: ${err.message}`);
    process.exit(2);
  }
  const cases = [];
  try {
    for (const pageDef of PAGES) {
      for (const vp of VIEWPORTS) {
        cases.push(await runCase(browser, base, outDir, pageDef, vp));
      }
    }
  } finally {
    await browser.close();
  }
  const flat = cases.flatMap((c) => c.checks.map((k) => ({ ...k, kind: c.kind, viewport: c.viewport })));
  const pass = flat.filter((k) => k.verdict === 'PASS').length;
  const fail = flat.filter((k) => k.verdict === 'FAIL').length;
  const errs = flat.filter((k) => k.verdict === 'ERROR').length;
  const result = {
    generatedAt: new Date().toISOString(),
    base,
    viewports: VIEWPORTS,
    thresholds: { SPEC_DELTA_MIN, VIS_DELTA_MIN, STABILITY_MAX, WEDGE_MAX, WEDGE_ORANGE, WEDGE_WHITEFRAC_MIN, WEDGE_ORANGE_DELTA_MAX },
    summary: { total: flat.length, pass, fail, error: errs },
    cases,
  };
  fs.writeFileSync(path.join(outDir, 'results.json'), `${JSON.stringify(result, null, 2)}\n`);

  const rows = [];
  rows.push('| kind | viewport | check | verdict | detail |');
  rows.push('|---|---|---|---|---|');
  for (const c of cases) {
    for (const k of c.checks) rows.push(`| ${c.kind} | ${c.viewport} | ${k.name} | ${k.verdict} | ${k.detail} |`);
  }
  console.log(`\nlogo gates vs ${base}: ${pass} PASS / ${fail} FAIL / ${errs} ERROR (${flat.length} checks)`);
  console.log(rows.join('\n'));
  console.log(`\nresults: ${path.join(outDir, 'results.json')}`);
  process.exit(fail + errs > 0 ? 1 : 0);
}

await main();
