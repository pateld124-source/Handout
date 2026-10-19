import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Public, indexable pages only. Everything behind auth (student/admin/provider),
// the auth screens, onboarding and debug are intentionally excluded — see robots.ts.
// "/" is left out on purpose: it redirects to /landing, and sitemaps should only list final URLs.
const BASE = 'https://www.handout.casa';

export const revalidate = 3600; // rebuild at most once an hour

const STATIC: { path: string; priority: number }[] = [
  { path: '/landing',        priority: 1.0 },
  { path: '/browse',         priority: 0.9 },
  { path: '/explore',        priority: 0.8 },
  { path: '/about',          priority: 0.7 },
  { path: '/contact',        priority: 0.6 },
  { path: '/help',           priority: 0.6 },
  { path: '/legal/terms',    priority: 0.4 },
  { path: '/legal/privacy',  priority: 0.4 },
  { path: '/legal/safety',   priority: 0.4 },
];

// Each active roommate/sublet listing has a public page (/browse/<id>): real content Google can rank.
async function listingPages(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const { data } = await createClient(url, key)
      .from('roommate_listings').select('id, created_at').eq('is_active', true).limit(5000);
    return (data || []).map((l) => ({
      url: `${BASE}/browse/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    return []; // the static pages still go out if the database is unreachable
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return [
    ...STATIC.map(({ path, priority }) => ({ url: `${BASE}${path}`, lastModified: now, changeFrequency: 'weekly' as const, priority })),
    ...(await listingPages()),
  ];
}
