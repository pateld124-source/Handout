import type { Metadata } from 'next';
import Link from 'next/link';

// Public, indexable page for one Handout feature (the app itself is behind login).
// Google can list these as links under "Handout"; the buttons lead to sign up / log in -> dashboard.
export type Feature = {
  slug: string;          // URL: /<slug>
  name: string;          // short name, e.g. "Roommate Matching"
  title: string;         // <title> for Google
  description: string;   // meta description
  headline: string;      // H1
  intro: string;
  points: { title: string; text: string }[];
  steps: string[];
};

const BASE = 'https://www.handout.casa';

export function featureMetadata(f: Feature): Metadata {
  return {
    title: f.title,
    description: f.description,
    alternates: { canonical: `${BASE}/${f.slug}` },
    openGraph: { title: f.title, description: f.description, url: `${BASE}/${f.slug}`, siteName: 'Handout', type: 'website' },
  };
}

export const FEATURE_LINKS = [
  { href: '/roommates', label: 'Roommate Matching' },
  { href: '/campus-connect', label: 'Campus Connect' },
  { href: '/marketplace', label: 'Student Marketplace' },
  { href: '/events', label: 'Campus Events' },
  { href: '/find-your-people', label: 'Find Your People' },
];

export default function FeaturePage({ f }: { f: Feature }) {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg, #F4F7F5)', color: '#12241C' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/landing" style={{ fontWeight: 800, fontSize: 20, color: '#12241C', textDecoration: 'none' }}>Handout</Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login" className="btn btn-outline btn-sm">Log in</Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">Sign up free</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 24px' }}>
        <p style={{ color: 'var(--green, #12A150)', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{f.name} · Handout</p>
        <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, margin: '0 0 18px' }}>{f.headline}</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--light, #4C6157)', margin: '0 0 28px' }}>{f.intro}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/auth/signup" className="btn btn-primary btn-xl">Sign up free →</Link>
          <Link href="/auth/login" className="btn btn-outline btn-xl">Log in</Link>
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {f.points.map((p) => (
          <div key={p.title} style={{ background: '#fff', border: '1px solid var(--border, rgba(18,36,28,0.09))', borderRadius: 16, padding: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>{p.title}</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--light, #4C6157)', margin: 0 }}>{p.text}</p>
          </div>
        ))}
      </section>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '16px 24px 40px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 14px' }}>How it works</h2>
        <ol style={{ listStyle: 'decimal', paddingLeft: 22, fontSize: 15.5, lineHeight: 1.9, color: 'var(--light, #4C6157)', margin: 0 }}>
          {f.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>

      <footer style={{ borderTop: '1px solid var(--border, rgba(18,36,28,0.09))', padding: '24px', textAlign: 'center', fontSize: 14 }}>
        {FEATURE_LINKS.map((l) => (
          <Link key={l.href} href={l.href} style={{ color: 'var(--light, #4C6157)', margin: '0 10px', textDecoration: 'none' }}>{l.label}</Link>
        ))}
        <Link href="/browse" style={{ color: 'var(--light, #4C6157)', margin: '0 10px', textDecoration: 'none' }}>Browse listings</Link>
      </footer>
    </main>
  );
}
