import { buildRss } from '../lib/feed';
import { blogItems } from '../data/feed-items';

export async function GET(): Promise<Response> {
  const xml = buildRss(
    {
      title: 'RevelTek — Blog & Insights',
      description:
        'Read the latest insights from RevelTek on SaaS, AI, Cloud, IT Strategy, and technology trends.',
      selfUrl: 'https://reveltek.com/blog-feed.xml',
      htmlUrl: 'https://reveltek.com/blog.html',
    },
    blogItems,
    new Date(),
  );
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
