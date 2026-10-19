import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Handout — The Student Community Built at Rowan University',
  description: 'Handout is a free student community started at Rowan University: roommates and sublets, a campus marketplace, food, rides and events in one place.',
  alternates: { canonical: 'https://www.handout.casa/about' },
};

const STATS = [
  { value: '12,000+', label: 'Students served' },
  { value: '400+',    label: 'Universities' },
  { value: '2,500+',  label: 'Vendor listings' },
  { value: '98%',     label: 'Satisfaction rate' },
];

const VALUES = [
  { icon: '🏠', title: 'Home away from home', desc: 'We believe every student deserves a comfortable, affordable living situation. Handout makes finding roommates and sublets simple.' },
  { icon: '🤝', title: 'Community first', desc: 'From shared rides to study groups, Handout connects students who are going through the same experiences — together.' },
  { icon: '🔒', title: 'Safe & verified', desc: 'Every vendor is verified. Every student profile is university-linked. You always know who you\'re dealing with.' },
  { icon: '💰', title: 'Free during Beta', desc: 'Every feature in the Handout Beta is completely free. No payments, no subscriptions — students shouldn\'t go broke saving money.' },
];

const TEAM = [
  { name: 'The Handout Team', role: 'Founder & Product', school: 'Rowan University', initials: 'H' },
  { name: 'Alex Chen', role: 'Head of Product', school: 'Rutgers University', initials: 'AC' },
  { name: 'Priya Sharma', role: 'Engineering Lead', school: 'NJIT', initials: 'PS' },
  { name: 'Marcus Johnson', role: 'Design Lead', school: 'Montclair State', initials: 'MJ' },
];

const FAQ = [
  { q: 'Is Handout free to use?', a: 'Yes! Handout is completely free during our public Beta — every feature, no payments and no subscriptions.' },
  { q: 'How do I become a vendor?', a: 'Sign up as a vendor during registration or switch your account type in settings. Submit your profile and start listing your services within minutes.' },
  { q: 'Is my data safe?', a: 'Absolutely. We use Supabase with row-level security, encrypted connections, and never sell your personal data to third parties.' },
  { q: 'Which universities are supported?', a: 'We support 400+ US universities. If yours isn\'t listed, contact us and we\'ll add it within 24 hours.' },
  { q: 'How do I report a bad listing?', a: 'Use the Report button on any listing or profile. Our moderation team reviews reports within 24 hours.' },
];

export default function AboutPage() {
  return (
    <div style={{ background: '#F1F7F3', minHeight: '100vh', color: '#12241C', fontFamily: 'inherit' }}>

      {/* Nav */}
      <nav style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(18,36,28,0.07)', position: 'sticky', top: 0, background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 800, color: '#12A150', textDecoration: 'none', letterSpacing: -0.5 }}>Handout</Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/help" style={{ padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, color: '#7d9188', textDecoration: 'none' }}>Help</Link>
          <Link href="/auth/login" style={{ padding: '8px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, background: 'rgba(18,36,28,0.09)', border: '1px solid rgba(18,36,28,0.12)', color: '#12241C', textDecoration: 'none' }}>Log in</Link>
          <Link href="/auth/signup" style={{ padding: '8px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, background: '#12A150', color: '#ffffff', textDecoration: 'none' }}>Sign up free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 24px 64px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#12A150', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>About Handout</span>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, margin: '0 0 20px' }}>
          Your home away from home — built by students, for students
        </h1>
        <p style={{ fontSize: 17, color: '#7d9188', lineHeight: 1.7, margin: '0 0 36px' }}>
          Handout is the all-in-one student platform that makes campus life easier. Find roommates, order tiffin, book services, share rides, and connect with your campus community.
        </p>
        <Link href="/auth/signup" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 100, background: '#12A150', color: '#ffffff', fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
          Get started free →
        </Link>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 24px 64px' }}>
        <div className="rg-4" style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ padding: '24px 20px', background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 16, textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 800, color: '#12A150', letterSpacing: -1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#7d9188' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid rgba(18,36,28,0.07)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#7d9188', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Our mission</span>
              <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px', letterSpacing: -1, lineHeight: 1.2 }}>
                Making student life easier, one connection at a time
              </h2>
              <p style={{ fontSize: 15, color: '#7d9188', lineHeight: 1.7, margin: 0 }}>
                We started Handout because we lived the problem ourselves — searching Facebook groups for roommates, paying too much for food delivery, and having no way to find other students going to the same events.
              </p>
              <p style={{ fontSize: 15, color: '#7d9188', lineHeight: 1.7, margin: '12px 0 0' }}>
                Handout brings everything together in one place, built on trust, transparency, and community.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {VALUES.map(v => (
                <div key={v.title} style={{ padding: '16px 18px', background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.07)', borderRadius: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{v.icon}</span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#12241C' }}>{v.title}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#7d9188', lineHeight: 1.5 }}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid rgba(18,36,28,0.07)', background: 'rgba(18,36,28,0.03)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#7d9188', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Team</span>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -1 }}>Built by students who get it</h2>
          </div>
          <div className="rg-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {TEAM.map(t => (
              <div key={t.name} style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#5A4BB8,#12A150)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#ffffff', margin: '0 auto 12px' }}>
                  {t.initials}
                </div>
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#12241C' }}>{t.name}</p>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: '#12A150', fontWeight: 600 }}>{t.role}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#7d9188' }}>{t.school}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid rgba(18,36,28,0.07)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#7d9188', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>FAQ</span>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -1 }}>Common questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ.map(f => (
              <div key={f.q} style={{ padding: '18px 20px', background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#12241C' }}>{f.q}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#7d9188', lineHeight: 1.6 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(18,36,28,0.07)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 14px', letterSpacing: -1 }}>Ready to simplify campus life?</h2>
        <p style={{ fontSize: 15, color: '#7d9188', margin: '0 0 28px' }}>Join 12,000+ students already on Handout.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{ padding: '14px 32px', borderRadius: 100, background: '#12A150', color: '#ffffff', fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>Sign up free</Link>
          <Link href="/browse" style={{ padding: '14px 32px', borderRadius: 100, border: '1px solid rgba(18,36,28,0.12)', color: '#12241C', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Browse listings</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', borderTop: '1px solid rgba(18,36,28,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#12A150' }}>Handout</span>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#7d9188' }}>
          <Link href="/about" style={{ color: '#7d9188', textDecoration: 'none' }}>About</Link>
          <Link href="/help" style={{ color: '#7d9188', textDecoration: 'none' }}>Help</Link>
          <Link href="/legal/privacy" style={{ color: '#7d9188', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/legal/terms" style={{ color: '#7d9188', textDecoration: 'none' }}>Terms</Link>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#7d9188' }}>© 2025 Handout. All rights reserved.</p>
      </footer>

    </div>
  );
}
