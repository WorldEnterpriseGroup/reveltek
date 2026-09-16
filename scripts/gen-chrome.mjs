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
  ['HeaderInner', 'about.html', 47, 141],
  ['HeaderAlt', 'ai.html', 49, 133],
  ['HeaderOverview', 'education.html', 49, 134],
  ['HeaderContact', 'contact.html', 49, 134],
  ['HeaderTwo', 'index-2.html', 47, 187],
];
for (const [n, f, a, b] of H) {
  fs.writeFileSync(`${ROOT}/src/components/chrome/${n}.astro`, fix(lines(f, a, b)));
}
const F = [
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
  const s =
    a == null
      ? markers(f, '<!--====== Footer Part Start', '<!--====== Footer Part end')
      : lines(f, a, b);
  fs.writeFileSync(`${ROOT}/src/components/chrome/${n}.astro`, fix(s));
}
console.log('partials written');
