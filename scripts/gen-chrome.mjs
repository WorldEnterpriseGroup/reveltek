import fs from 'node:fs';

const ROOT = '/home/mrh/repos/worldenterprisegroup/reveltek';
const fix = (s) => s.replace(/<\/i>\s+([A-Za-z0-9+])/g, "</i>{' '}$1");
const lines = (f, a, b) =>
  fs.readFileSync(`${ROOT}/${f}`, 'utf8').split('\n').slice(a - 1, b).join('\n') + '\n';
const markers = (f, a, b) => {
  const h = fs.readFileSync(`${ROOT}/${f}`, 'utf8');
  return h.slice(h.indexOf(a), h.indexOf(b)) + '\n';
};

const H = [
  ['Header', 'index.html', 50, 134],
  ['HeaderInner', 'about.html', 47, 141],
  ['HeaderAlt', 'ai.html', 49, 133],
  ['HeaderOverview', 'education.html', 49, 134],
  ['HeaderContact', 'contact.html', 49, 134],
  ['HeaderTwo', 'index-2.html', 47, 187],
];
// Additive mega-panel: extend (never replace) the custom Services submenu with
// flagship destinations + the catch-all sitemap. Plain li>a items inherit the
// legacy submenu CSS/JS untouched (no nested lists, no dd-trigger side effects).
const SERVICES_FEATURED = [
  '<li class="submenu-featured"><a href="services.html">All Services</a></li>',
  '<li class="submenu-featured"><a href="service-details.html">Service Details</a></li>',
  '<li class="submenu-featured"><a href="studies.html">Case Studies</a></li>',
  '<li class="submenu-featured"><a href="sitemap.html">Visual Sitemap</a></li>',
].join('\n');
const NAVB = new Set(['Header', 'HeaderAlt', 'HeaderOverview', 'HeaderContact']);
for (const [n, f, a, b] of H) {
  let s = fix(lines(f, a, b));
  if (n === 'HeaderAlt' || n === 'HeaderOverview' || n === 'HeaderContact' || n === 'Header') {
    const anchor = '<li><a href="analytics.html">Analytics</a></li>';
    if (!s.includes(anchor)) throw new Error(`Services anchor missing in ${n}`);
    s = s.replace(anchor, `${anchor}\n${SERVICES_FEATURED}`);
  }
  fs.writeFileSync(`${ROOT}/src/components/chrome/${n}.astro`, s);
}
const F = [
  ['Footer', 'index.html', 971, 1107],
  ['FooterInner', 'about.html', 606, 739],
  ['FooterServices', 'ai.html', null, null],
  ['FooterBlog', 'blog-details.html', null, null],
  ['FooterInsights', 'blog.html', null, null],
  ['FooterCompany', 'careers.html', null, null],
  ['FooterConsulting', 'consulting.html', null, null],
  ['FooterSoftware', 'software.html', null, null],
  ['FooterTwo', 'index-2.html', 1134, 1267],
];
for (const [n, f, a, b] of F) {
  let s =
    a == null
      ? markers(f, '<!--====== Footer Part Start', '<!--====== Footer Part end')
      : lines(f, a, b);
  // Additive catch-all: one Sitemap link in Quick Links on every footer.
  const q1 = '<li><a href="contact.html">Contact RevelTek</a></li>';
  const q2 = '<li><a href="#">Financial Planning</a></li>';
  const siteLi = '<li><a href="sitemap.html">Sitemap</a></li>';
  if (s.includes(q1)) s = s.replace(q1, `${q1}\n${siteLi}`);
  else if (s.includes(q2)) s = s.replace(q2, `${q2}\n${siteLi}`);
  else throw new Error(`Quick-links anchor missing in ${n}`);
  fs.writeFileSync(`${ROOT}/src/components/chrome/${n}.astro`, fix(s));
}
console.log('partials written');
