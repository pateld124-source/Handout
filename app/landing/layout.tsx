import type { Metadata } from 'next';

const BASE = 'https://www.handout.casa';

export const metadata: Metadata = {
  title: 'Handout — Student Roommates, Sublets & Campus Marketplace',
  description:
    'Free student community for Rowan University and nearby campuses. Find a roommate or sublet near campus, buy and sell textbooks, and meet students.',
  alternates: { canonical: `${BASE}/landing` },
};

// Tells Google the site name and logo-level facts (helps the brand result and sitelinks).
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: 'Handout', alternateName: 'Handout Casa', url: `${BASE}/landing` },
    { '@type': 'Organization', name: 'Handout', url: BASE },
  ],
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
