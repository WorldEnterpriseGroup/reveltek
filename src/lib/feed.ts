/**
 * Shared RSS 2.0 builder for RevelTek public feeds.
 *
 * The site has no content collections (pages are static marketing pages), so
 * feed items are a curated snapshot of the recurring public content surfaced
 * on blog.html, events.html, and guides.html. Item titles/excerpts mirror the
 * on-page copy; links point at the closest real route (blog items resolve to
 * blog-details.html, which exists; event/guide detail/download targets are
 * placeholder `#`/missing routes, so those items link to their listing page).
 *
 * If genuine per-post routes are ever added, replace the static arrays in
 * ../data/feed-items with a glob over that collection — the builder below
 * does not need to change.
 */

export interface FeedItem {
  /** Short human title, mirrored from the listing page. */
  title: string;
  /** Absolute URL the item resolves to. */
  link: string;
  /** Stable unique ID — defaults to link + index; keep stable across builds. */
  guid: string;
  /** Plain-text excerpt, mirrored from the listing page. */
  description: string;
  /** Publication date (UTC). Mirrors the date shown on the listing page. */
  pubDate: Date;
  /** Optional author display name. */
  author?: string;
  /** Optional category/topic tags. */
  categories?: string[];
}

export interface FeedMeta {
  title: string;
  description: string;
  /** Absolute self URL of this feed, e.g. https://reveltek.com/feed.xml */
  selfUrl: string;
  /** Absolute URL of the HTML listing page this feed mirrors. */
  htmlUrl: string;
}

const SITE = 'https://reveltek.com';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(date: Date): string {
  return date.toUTCString();
}

export function buildRss(meta: FeedMeta, items: FeedItem[], buildDate: Date): string {
  const sorted = [...items].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  const lastBuild = toRfc822(buildDate);

  const itemXml = sorted
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${toRfc822(item.pubDate)}</pubDate>
${
  item.author
    ? `      <author>noreply@reveltek.com (${escapeXml(item.author)})</author>\n`
    : ''
}${
        (item.categories ?? [])
          .map((c) => `      <category>${escapeXml(c)}</category>`)
          .join('\n')
      }
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(meta.title)}</title>
    <link>${escapeXml(meta.htmlUrl)}</link>
    <description>${escapeXml(meta.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>RevelTek Astro feed builder (static, no dependencies)</generator>
    <atom:link href="${escapeXml(meta.selfUrl)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>
`;
}

export const SITE_URL = SITE;
