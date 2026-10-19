import type { MetadataRoute } from 'next';

const BASE = 'https://www.handout.casa';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep private/app areas out of search results.
      disallow: ['/student/', '/admin/', '/provider/', '/vendor/', '/auth/', '/onboarding', '/api/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
