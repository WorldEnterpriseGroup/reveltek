/**
 * Shared JSON-LD builders for RevelTek structured data (SOTA meta enrichment).
 *
 * Read-only consumer of `../data/feed-items` (curated snapshot mirroring the
 * on-page copy of blog.html / events.html / guides.html, verified 2026-09-16).
 * No dates, titles, or claims are invented here — every field is sourced from
 * either the feed snapshot or the verbatim copy of the page being marked up.
 * Pages that carry placeholder/lorem copy (blog-grid, blog-standard, …) get
 * no entity markup beyond the automatic BreadcrumbList in BaseLayout.
 */

import type { FeedItem } from './feed';
import { blogItems, eventItems, guideItems } from '../data/feed-items';

const SITE = 'https://reveltek.com';

function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** BreadcrumbList for any BaseLayout page: Home + current page (from its own props). */
export function breadcrumbSchema(pageName: string, canonicalPath: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE}/index.html`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageName,
        item: `${SITE}${canonicalPath}`,
      },
    ],
  };
}

function blogPostingFromItem(item: FeedItem, image?: string): Record<string, unknown> {
  const posting: Record<string, unknown> = {
    '@type': 'BlogPosting',
    headline: item.title,
    description: item.description,
    datePublished: isoDateOnly(item.pubDate),
    url: item.link,
    publisher: {
      '@type': 'Organization',
      name: 'RevelTek Inc.',
      url: SITE,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE}/assets/img/svg/revel.svg`,
      },
    },
  };
  if (item.author) {
    posting.author = { '@type': 'Person', name: item.author };
  }
  if (image) {
    posting.image = image;
  }
  return posting;
}

/**
 * Blog schema for /blog.html: the five listing posts, verbatim from the page
 * (titles/excerpts/authors/dates/categories match feed-items one-to-one).
 * Images are the post thumbs used on the page itself.
 */
export function blogListingSchema(): Record<string, unknown> {
  const thumbs = [
    `${SITE}/assets/img/blog/01.avif`,
    `${SITE}/assets/img/blog/02.avif`,
    undefined,
    `${SITE}/assets/img/blog/03.avif`,
    undefined,
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'RevelTek Blog & Insights',
    url: `${SITE}/blog.html`,
    blogPost: blogItems.map((item, i) => ({
      ...blogPostingFromItem(item, thumbs[i]),
      mainEntityOfPage: `${SITE}/blog.html`,
    })),
  };
}

/**
 * Single BlogPosting for /blog-details.html, sourced ONLY from that page's own
 * copy (title, author line, and date line as rendered). Feed dates are NOT
 * reused here — the detail copy differs from the listing snapshot.
 */
export function blogDetailsSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline:
      'Inspired Design Decisions With Herb Typography Can Be As Exciting As Illustration & Photo',
    datePublished: '2020-08-25',
    author: { '@type': 'Organization', name: 'RevelTek Team' },
    image: `${SITE}/assets/img/blog/12.avif`,
    url: `${SITE}/blog-details.html`,
    publisher: {
      '@type': 'Organization',
      name: 'RevelTek Inc.',
      url: SITE,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE}/assets/img/svg/revel.svg`,
      },
    },
  };
}

/**
 * Event schemas for /events.html: the three listed events, verbatim from the
 * page (titles, date lines, formats, and excerpts match feed-items one-to-one).
 */
export function eventsSchema(): Record<string, unknown>[] {
  const modes = ['OnlineEventAttendanceMode', 'OfflineEventAttendanceMode', 'OnlineEventAttendanceMode'] as const;
  // Statuses mirror the page's own framing: "Upcoming Webinar" is scheduled,
  // "Past Event" and "Webinar Recording" already happened.
  const statuses = [
    'https://schema.org/EventScheduled',
    'https://schema.org/EventCompleted',
    'https://schema.org/EventCompleted',
  ];
  return eventItems.map((item, i) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: item.title,
    description: item.description,
    startDate: isoDateOnly(item.pubDate),
    eventAttendanceMode: `https://schema.org/${modes[i]}`,
    eventStatus: statuses[i],
    location:
      modes[i] === 'OnlineEventAttendanceMode'
        ? { '@type': 'VirtualLocation', url: `${SITE}/events.html` }
        : { '@type': 'Place', name: 'Cloud Innovate Summit' },
    image: `${SITE}/assets/img/blog/0${i + 1}.avif`,
    url: `${SITE}/events.html`,
    organizer: {
      '@type': 'Organization',
      name: 'RevelTek Inc.',
      url: SITE,
    },
  }));
}

/**
 * FAQPage for /faq.html: the ten questions and answers, verbatim from the
 * page's accordion copy. Nothing is reworded or added.
 */
const faqPairs: Array<[string, string]> = [
  [
    'How long does a typical engagement last?',
    'It depends on scope. A strategy or discovery engagement usually runs a few weeks; a design-and-build engagement runs longer and is planned in stages with clear checkpoints. We agree the timeline with you before work starts.',
  ],
  [
    'How do you price your work?',
    'Fixed price for clearly defined builds, time-and-materials for ongoing or evolving work. Every proposal lists what is included so there are no surprises. Contact us with your requirements for a quote.',
  ],
  [
    'Who owns the IP in what you build for us?',
    'You do. Work product created for you under the engagement transfers to you on final payment, and we spell this out in the contract before work begins.',
  ],
  [
    'What support do you offer after launch?',
    'Every build includes a handover with documentation. After that, you can continue on a support plan covering fixes, updates, and small improvements, with response times agreed in writing.',
  ],
  [
    'How do you handle security and compliance?',
    'We follow secure development practices: least-privilege access, encrypted data in transit and at rest, and regular dependency updates. For regulated industries such as health and fintech, we work to your compliance requirements and document controls as part of delivery.',
  ],
  [
    'What does a typical project involve?',
    'Discovery talks, analysis, strategy and roadmap, then build and launch support. The exact mix depends on your goals, and we agree it with you before work starts.',
  ],
  [
    'How do you track success?',
    'We set measurable goals upfront — return on investment, efficiency gains, time to market, or reduced risk — and report against them through the engagement.',
  ],
  [
    'Which industries do you work with?',
    'We have strong experience in health, fintech, and retail, and our methods apply to any team modernizing its technology.',
  ],
  [
    'How involved do we need to be?',
    'Plan on regular check-ins: planning, sprint reviews, and feedback sessions. A named decision-maker on your side keeps things moving.',
  ],
  [
    'How do we start?',
    'Send a message through the contact page describing your goal. We reply with next steps and schedule a discovery call.',
  ],
];

export function faqSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE}/faq.html`,
    mainEntity: faqPairs.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/**
 * ItemList of guides for /guides.html: the six resources named on the page
 * (titles/descriptions match feed-items one-to-one). No dates are emitted —
 * the page itself shows no dates, so none are claimed.
 */
export function guidesSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'RevelTek Guides & Reports',
    url: `${SITE}/guides.html`,
    itemListElement: guideItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: item.title,
        description: item.description,
        url: `${SITE}/guides.html`,
      },
    })),
  };
}
