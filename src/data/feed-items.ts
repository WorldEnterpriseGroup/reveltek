/**
 * Curated feed items mirroring the recurring public content on
 * blog.html, events.html, and guides.html (copy verified 2026-09-18).
 *
 * Dates mirror the dates shown on each listing page. GUIDs are stable
 * synthetic IDs (not bare URLs) so items survive future URL changes.
 */
import type { FeedItem } from '../lib/feed';

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export const blogItems: FeedItem[] = [
  {
    title: 'Implementing AI: From Strategy to Practical Use Cases Today',
    link: 'https://reveltek.com/blog-details.html',
    guid: 'reveltek-blog-2024-12-05-ai-strategy',
    description:
      'Adopting artificial intelligence requires more than just technology. It demands a clear strategy, relevant use cases, and careful planning. Discover key steps for successful AI integration in your business.',
    pubDate: utc(2024, 12, 5),
    author: 'RevelTek Team',
    categories: ['AI'],
  },
  {
    title: 'Key Cloud Security Measures Every SaaS Platform Needs Now',
    link: 'https://reveltek.com/blog-details.html',
    guid: 'reveltek-blog-2024-11-28-cloud-security',
    description:
      'Security is paramount for SaaS success. We explore essential cloud security best practices, from identity management to data encryption, vital for protecting users and meeting compliance.',
    pubDate: utc(2024, 11, 28),
    author: 'RevelTek Team',
    categories: ['Cloud'],
  },
  {
    title: 'Digital Transformation is Not Just Tech; It Is About People And Strategy First.',
    link: 'https://reveltek.com/blog-details.html',
    guid: 'reveltek-blog-2024-11-20-digital-transformation',
    description:
      'Digital transformation succeeds on people and strategy first, technology second. Notes from the RevelTek consulting practice.',
    pubDate: utc(2024, 11, 20),
    author: 'Admin',
    categories: ['Consulting'],
  },
  {
    title: 'Turning Big Data Into Actionable Insights: Tips and Tools Available',
    link: 'https://reveltek.com/blog-details.html',
    guid: 'reveltek-blog-2024-11-12-big-data-insights',
    description:
      'Collecting data is easy, but extracting real value requires the right approach. Learn how modern analytics tools and techniques help businesses make smarter, data informed choices daily.',
    pubDate: utc(2024, 11, 12),
    author: 'Sarah Lee',
    categories: ['Analytics'],
  },
  {
    title: 'Choosing Between Custom Software vs Off The Shelf Solutions Today',
    link: 'https://reveltek.com/blog-details.html',
    guid: 'reveltek-blog-2024-11-05-custom-vs-off-the-shelf',
    description:
      'When should you invest in building custom software versus using existing tools? We break down the pros, cons, and key factors to consider for your next project decision making.',
    pubDate: utc(2024, 11, 5),
    author: 'Mike Brown',
    categories: ['Software'],
  },
];

export const eventItems: FeedItem[] = [
  {
    title: 'Webinar: Leveraging AI for Strategic Business Advantage',
    link: 'https://reveltek.com/events.html',
    guid: 'reveltek-event-2024-12-15-ai-webinar',
    description:
      'Join our experts as they discuss practical approaches to implementing AI, identifying high value use cases, and building a roadmap for intelligent automation within your organization. Online webinar, Dec 15, 2024, 2 PM EST.',
    pubDate: utc(2024, 12, 15),
    categories: ['Webinar', 'AI', 'Strategy'],
  },
  {
    title: 'Past Event: RevelTek at Cloud Innovate Summit 2024',
    link: 'https://reveltek.com/events.html',
    guid: 'reveltek-event-2024-10-10-cloud-innovate-summit',
    description:
      'We enjoyed connecting with industry leaders at the Cloud Innovate Summit. Our team presented insights on secure cloud migration and modern DevOps practices. (Oct 10-12, 2024.)',
    pubDate: utc(2024, 10, 12),
    categories: ['Conference', 'Cloud', 'DevOps'],
  },
  {
    title: 'Webinar Recording: Key Trends in Modern SaaS Development',
    link: 'https://reveltek.com/events.html',
    guid: 'reveltek-event-2024-09-20-saas-trends-webinar',
    description:
      'Missed our live session? Watch the recording to learn about microservices, API first design, security considerations, and other crucial trends impacting successful SaaS application building today. (Sep 20, 2024.)',
    pubDate: utc(2024, 9, 20),
    categories: ['Webinar Recording', 'SaaS', 'Software'],
  },
];

export const guideItems: FeedItem[] = [
  {
    title: 'AI Strategy Guide',
    link: 'https://reveltek.com/guides.html',
    guid: 'reveltek-guide-ai-strategy',
    description: 'A practical framework for developing and implementing an AI strategy.',
    pubDate: utc(2024, 12, 1),
    categories: ['Guide', 'AI'],
  },
  {
    title: 'Cloud Migration Checklist',
    link: 'https://reveltek.com/guides.html',
    guid: 'reveltek-guide-cloud-migration-checklist',
    description: 'Essential steps and considerations for a successful cloud transition.',
    pubDate: utc(2024, 11, 15),
    categories: ['Guide', 'Cloud'],
  },
  {
    title: 'SaaS Development Trends',
    link: 'https://reveltek.com/guides.html',
    guid: 'reveltek-guide-saas-development-trends',
    description: 'Insights into the latest trends shaping modern SaaS application building.',
    pubDate: utc(2024, 11, 1),
    categories: ['Guide', 'SaaS'],
  },
  {
    title: 'Data Analytics Whitepaper',
    link: 'https://reveltek.com/guides.html',
    guid: 'reveltek-guide-data-analytics-whitepaper',
    description: 'Leveraging data for growth.',
    pubDate: utc(2024, 10, 15),
    categories: ['Whitepaper', 'Analytics'],
  },
  {
    title: 'Digital Transformation Report',
    link: 'https://reveltek.com/guides.html',
    guid: 'reveltek-guide-digital-transformation-report',
    description: 'Key steps for modernizing.',
    pubDate: utc(2024, 10, 1),
    categories: ['Report', 'Strategy'],
  },
  {
    title: 'Product Management Guide',
    link: 'https://reveltek.com/guides.html',
    guid: 'reveltek-guide-product-management',
    description: 'Building successful digital items.',
    pubDate: utc(2024, 9, 15),
    categories: ['Guide', 'Product'],
  },
];

export const allItems: FeedItem[] = [...blogItems, ...eventItems, ...guideItems];
