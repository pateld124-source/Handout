'use client';

import { ROOMMATE_PUBLIC_COLUMNS, SERVICE_PUBLIC_COLUMNS, TIFFIN_PUBLIC_COLUMNS } from '@/lib/listingColumns';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthGate } from '@/components/auth/AuthGate';
import { createClient } from '@/lib/supabase/client';

/* ── Browse page SVG icons ── */
const AllBrIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
const PeopleBrIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const FoodBrIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const SvcBrIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const RoomBrIcon  = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const FoodLgIcon  = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const SvcLgIcon   = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const EmptyBrIcon = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PinBrIcon   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
function BrowseListingIcon({ kind, cat }: { kind: string; cat?: string }) {
  if (kind === 'food') return <FoodLgIcon />;
  if (kind === 'roommates') return <RoomBrIcon />;
  return <SvcLgIcon />;
}

type Tab = 'all' | 'roommates' | 'food' | 'services';

export default function Browse() {
  const { user, openAuth, signOut } = useAuthGate();
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [showF, setShowF] = useState(false);
  const [pMin, setPMin] = useState('');
  const [pMax, setPMax] = useState('');
  const [sort, setSort] = useState<'recent' | 'low' | 'high'>('recent');
  const [items, setItems] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const c = new URLSearchParams(window.location.search).get('c');
      if (c === 'roommates' || c === 'food' || c === 'services') setTab(c as Tab);
      try {
        const supabase = createClient();
        const [{ data: tf }, { data: sv }, { data: rm }] = await Promise.all([
          supabase.from('tiffin_listings').select(TIFFIN_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('service_listings').select(SERVICE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('roommate_listings').select(ROOMMATE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }),
        ]);
        const all = [
          ...(rm || []).map((r: any) => ({
            kind: 'roommates', t: 'room', id: r.id, title: r.title || 'Room listing',
            price: r.rent ? `$${r.rent}` : '—', unit: '/ month', priceNum: r.rent ? Number(r.rent) : null, location: r.location || '—',
            img: Array.isArray(r.media) && r.media[0]?.url ? r.media[0].url : null,
            grad: 'linear-gradient(135deg,#5A4BB833,#12A15022)', badge: 'Roommate',
            uid: r.user_id, created: r.created_at,
          })),
          ...(tf || []).map((r: any) => ({
            kind: 'food', t: 'food', id: r.id, title: r.name || 'Home meals',
            price: r.price_per_meal ? `$${r.price_per_meal}` : '—', unit: '/ meal', priceNum: r.price_per_meal ? Number(r.price_per_meal) : null, location: r.location || '—',
            img: null, grad: 'linear-gradient(135deg,#12A15022,#12A15022)', badge: r.cuisine || 'Tiffin / Food',
            uid: r.user_id, created: r.created_at,
          })),
          ...(sv || []).map((r: any) => ({
            kind: 'services', t: 'svc', id: r.id, title: r.title || 'Service',
            price: r.rate ? `$${r.rate}` : '—', unit: `/ ${r.rate_type || 'hr'}`, priceNum: r.rate ? Number(r.rate) : null, location: r.location || '—',
            img: null, grad: 'linear-gradient(135deg,#12A15022,#7C6BD122)', badge: r.category || 'Service',
            uid: r.user_id, created: r.created_at,
          })),
        ].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        // poster names
        const uids = Array.from(new Set(all.map(i => i.uid).filter(Boolean)));
        const names: Record<string, string> = {};
        if (uids.length) {
          const { data: us } = await supabase.from('public_profiles').select('id, full_name').in('id', uids);
          (us || []).forEach((u: any) => { names[u.id] = u.full_name || 'Member'; });
        }
        setItems(all.map(i => ({ ...i, poster: names[i.uid] || 'Member' })));
      } catch { /* DB not configured yet */ }
      setReady(true);
    })();
  }, []);

  const tabs: { key: Tab; label: string; Icon: () => React.JSX.Element }[] = [
    { key: 'all',       label: 'All',           Icon: AllBrIcon    },
    { key: 'roommates', label: 'Roommates',      Icon: PeopleBrIcon },
    { key: 'food',      label: 'Tiffin / Food',  Icon: FoodBrIcon   },
    { key: 'services',  label: 'Services',       Icon: SvcBrIcon    },
  ];

  let visible = items
    .filter(i => tab === 'all' || i.kind === tab)
    .filter(i => !q.trim() || (i.title + ' ' + i.location + ' ' + i.badge).toLowerCase().includes(q.toLowerCase()))
    .filter(i => !pMin || (i.priceNum != null && i.priceNum >= parseFloat(pMin)))
    .filter(i => !pMax || (i.priceNum != null && i.priceNum <= parseFloat(pMax)));
  if (sort === 'low') visible = [...visible].sort((a, b) => (a.priceNum ?? Infinity) - (b.priceNum ?? Infinity));
  if (sort === 'high') visible = [...visible].sort((a, b) => (b.priceNum ?? -1) - (a.priceNum ?? -1));
  const fActive = !!(pMin || pMax || sort !== 'recent');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#F1F7F3' }}>
      <div className="glow-blob" style={{ width: 520, height: 520, background: 'rgba(18,161,80,0.08)', top: -220, right: -160 }} />

      <header className="glass-strong" style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px clamp(20px,5vw,56px)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#12A150', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#ffffff', fontSize: 18 }}>H</div>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: -0.5 }}>Handout</span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <Link href="/student/dashboard" className="btn-cyan" style={{ padding: '9px 18px', fontSize: 14 }}>Dashboard</Link>
              <button onClick={signOut} className="btn-ghost" style={{ padding: '9px 16px', fontSize: 14 }}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={() => openAuth('login')} className="btn-ghost" style={{ padding: '9px 18px', fontSize: 14, fontWeight: 600 }}>Log in</button>
              <button onClick={() => openAuth('signup')} className="btn-cyan" style={{ padding: '9px 20px', fontSize: 14 }}>Sign up free</button>
            </>
          )}
        </nav>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 20px 80px', position: 'relative' }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(30px,4.5vw,44px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05 }}>
          Browse <span style={{ color: '#12A150' }}>all listings</span>
        </h1>
        <p style={{ color: '#7d9188', fontSize: 14, marginTop: 8 }}>Roommates, tiffin, rides, tutoring and more — everything you need, all in one place.</p>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, maxWidth: 660, alignItems: 'center' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by service, location or keyword…"
            style={{ flex: 1, height: 48, padding: '0 18px', background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 100, color: '#12241C', fontSize: 14 }} />
          <button onClick={() => setShowF(f => !f)} style={{ height: 48, padding: '0 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: fActive || showF ? 'rgba(18,161,80,0.12)' : 'rgba(18,36,28,0.05)', color: fActive || showF ? '#12A150' : '#4c6157', border: fActive || showF ? '1px solid rgba(18,161,80,0.4)' : '1px solid rgba(18,36,28,0.12)', flexShrink: 0 }}><span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>Filters{fActive ? ' •' : ''}</span></button>
        </div>

        {showF && (
          <div style={{ marginTop: 12, maxWidth: 660, background: '#FFFFFF', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 14, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4c6157', marginBottom: 6 }}>Min price ($)</div>
              <input type="number" min="0" value={pMin} onChange={e => setPMin(e.target.value)} placeholder="0" style={{ width: 110, height: 40, padding: '0 12px', background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 10, color: '#12241C', fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4c6157', marginBottom: 6 }}>Max price ($)</div>
              <input type="number" min="0" value={pMax} onChange={e => setPMax(e.target.value)} placeholder="1000" style={{ width: 110, height: 40, padding: '0 12px', background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 10, color: '#12241C', fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4c6157', marginBottom: 6 }}>Sort by</div>
              <select value={sort} onChange={e => setSort(e.target.value as any)} style={{ width: 170, height: 40, padding: '0 10px', background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 10, color: '#12241C', fontSize: 13, cursor: 'pointer' }}>
                <option value="recent">Most recent</option>
                <option value="low">Price: low → high</option>
                <option value="high">Price: high → low</option>
              </select>
            </div>
            <button onClick={() => { setPMin(''); setPMax(''); setSort('recent'); }} style={{ height: 40, padding: '0 16px', borderRadius: 100, background: 'transparent', color: '#7d9188', border: '1px solid rgba(18,36,28,0.12)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear all</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === t.key ? '#12A150' : 'rgba(18,36,28,0.05)', color: tab === t.key ? '#ffffff' : '#4c6157', border: tab === t.key ? 'none' : '1px solid rgba(18,36,28,0.09)' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, verticalAlign:'middle' }}><t.Icon /> {t.label}</span>
            </button>
          ))}
        </div>

        {!ready ? <div style={{ color: '#7d9188', marginTop: 40 }}>Loading listings…</div> :
        visible.length === 0 ? (
          <div style={{ marginTop: 40, background: '#FFFFFF', border: '1px dashed rgba(18,36,28,0.12)', borderRadius: 16, padding: 56, textAlign: 'center' }}>
            <div style={{ marginBottom: 12, color: 'var(--muted)', display:'inline-flex' }}><EmptyBrIcon /></div>
            <p style={{ fontSize: 16, color: '#4c6157', marginBottom: 6 }}>No listings here yet.</p>
            <p style={{ fontSize: 13, color: '#7d9188' }}>Be the first — sign up and post a room, meals, or a service.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, marginTop: 28 }}>
            {visible.map(i => (
              <Link key={i.t + i.id} href={`/browse/${i.id}?t=${i.t}`} style={{ textDecoration: 'none', background: '#FFFFFF', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                <div style={{ position: 'relative', height: 150, background: i.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i.img ? <img src={i.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display:'inline-flex', color:'rgba(255,255,255,0.4)' }}><BrowseListingIcon kind={i.kind} /></span>}
                  <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'rgba(18,18,18,0.8)', color: '#12A150', border: '1px solid rgba(18,161,80,0.3)' }}>{i.badge}</span>
                </div>
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#12241C', lineHeight: 1.3 }}>{i.title}</div>
                  <div><span style={{ color: '#12A150', fontWeight: 800, fontSize: 16 }}>{i.price}</span> <span style={{ color: '#7d9188', fontSize: 12 }}>{i.unit}</span></div>
                  <div style={{ fontSize: 12, color: '#7d9188', display:'flex', alignItems:'center', gap:3 }}><PinBrIcon />{i.location}</div>
                  <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(18,36,28,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#12A150', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{(i.poster || '?').slice(0, 2).toUpperCase()}</div>
                    <span style={{ fontSize: 12, color: '#4c6157' }}>{i.poster}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
