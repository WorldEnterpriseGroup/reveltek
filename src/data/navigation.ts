export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
}

// Canonical top-level navigation. Labels, destinations, and order match the
// approved rendered shell exactly. The Services entry keeps its 5 legacy
// children untouched; the mega panel EXTENDS it (see servicesPanel) and must
// never replace or collapse these links.
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Services',
    href: '#',
    children: [
      { label: 'Software', href: 'software.html' },
      { label: 'Consulting', href: 'consulting.html' },
      { label: 'AI', href: 'ai.html' },
      { label: 'Products', href: 'products.html' },
      { label: 'Cloud', href: 'cloud.html' },
      { label: 'Analytics', href: 'analytics.html' },
    ],
  },
  {
    label: 'Industries',
    href: '#',
    children: [
      { label: 'Health', href: 'health.html' },
      { label: 'Fintech', href: 'fintech.html' },
      { label: 'Retail', href: 'retail.html' },
      { label: 'Education', href: 'education.html' },
    ],
  },
  {
    label: 'Insights',
    href: '#',
    children: [
      { label: 'Blog', href: 'blog.html' },
      { label: 'Studies', href: 'studies.html' },
      { label: 'Guides', href: 'guides.html' },
      { label: 'Events', href: 'events.html' },
    ],
  },
  {
    label: 'About',
    href: '#',
    children: [
      { label: 'Story', href: 'story.html' },
      { label: 'Why Us', href: 'why-us.html' },
      { label: 'Careers', href: 'careers.html' },
    ],
  },
  { label: 'Contact', href: 'contact.html' },
];

// Additive mega-panel for Services: flagship destinations surfaced beside —
// not instead of — the legacy submenu. Every panel links to the visual
// sitemap so the complete route graph stays one hop away.
export const SERVICES_PANEL: NavChild[] = [
  { label: 'All Services', href: 'services.html' },
  { label: 'Service Details', href: 'service-details.html' },
  { label: 'Why RevelTek', href: 'why-us.html' },
  { label: 'Case Studies', href: 'studies.html' },
  { label: 'Visual Sitemap', href: 'sitemap.html' },
];

export const BUSINESS_ACTION = { label: 'Get Started', href: 'contact.html' };
