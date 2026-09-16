import { buildRss } from '../lib/feed';
import { allItems } from '../data/feed-items';

export async function GET(): Promise<Response> {
  const xml = buildRss(
    {
      title: 'RevelTek — Insights (Blog, Events & Guides)',
      description:
        'The latest insights from RevelTek: blog articles, events and webinars, guides and reports.',
      selfUrl: 'https://reveltek.com/feed.xml',
      htmlUrl: 'https://reveltek.com/blog.html',
    },
    allItems,
    new Date(),
  );
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
