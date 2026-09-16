import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// RevelTek — static-first Astro v7 build for GitHub Pages (reveltek.com).
// build.format 'file' preserves the legacy .html URL contract exactly
// (about.html stays about.html, no pretty-URL rewrites, no redirect chains).
export default defineConfig({
  site: 'https://reveltek.com',
  trailingSlash: 'never',
  outDir: 'dist',
  build: {
    format: 'file',
  },
  image: {
    responsiveStyles: true,
  },
  integrations: [
    sitemap({
      // The sitemap integration emits extensionless route paths; our public
      // URL contract keeps the legacy .html suffix, so re-attach it here.
      // Never index retired stubs, the 404 page, or RTL duplicates.
      filter: (page) =>
        !/\/RTL Version\//i.test(page) &&
        !/\/(awards|jobs|government|culture|404)$/.test(page),
      serialize: (item) => {
        if (!item.url.endsWith('/')) item.url = `${item.url}.html`;
        return item;
      },
    }),
  ],
});
