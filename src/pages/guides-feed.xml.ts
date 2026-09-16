import { buildRss } from '../lib/feed';
import { guideItems } from '../data/feed-items';

export async function GET(): Promise<Response> {
  const xml = buildRss(
    {
      title: 'RevelTek — Guides & Reports',
      description:
        'Guides, whitepapers, and reports from RevelTek on IT strategy, AI implementation, cloud adoption, and more.',
      selfUrl: 'https://reveltek.com/guides-feed.xml',
      htmlUrl: 'https://reveltek.com/guides.html',
    },
    guideItems,
    new Date(),
  );
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
