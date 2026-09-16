import { buildRss } from '../lib/feed';
import { eventItems } from '../data/feed-items';

export async function GET(): Promise<Response> {
  const xml = buildRss(
    {
      title: 'RevelTek — Events & Webinars',
      description:
        'Upcoming events, webinars, and workshops from RevelTek covering AI, SaaS, Cloud, IT Strategy, and more.',
      selfUrl: 'https://reveltek.com/events-feed.xml',
      htmlUrl: 'https://reveltek.com/events.html',
    },
    eventItems,
    new Date(),
  );
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
