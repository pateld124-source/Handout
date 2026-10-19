'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';

/* ── Search page SVG icons ── */
const SearchIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const RoomSIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const FoodSIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const SvcSIcon     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const PeopleSIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const SubletSIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
const VendorSIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const TutorQLIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const RideQLIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const HeartQLIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const DocQLIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;

function ResultIcon({ type, subtype }: { type: string; subtype?: string }) {
  if (type === 'room')    return subtype === 'sublet' ? <SubletSIcon /> : <RoomSIcon />;
  if (type === 'food')    return <FoodSIcon />;
  if (type === 'service') return <SvcSIcon />;
  if (type === 'people')  return subtype === 'vendor' ? <VendorSIcon /> : <PeopleSIcon />;
  return <SearchIcon />;
}

type Result = { id: string; type: string; subtype?: string; title: string; sub: string; href: string; badge?: string };

const CATEGORIES = [
  { key: 'all',     label: 'All',      Icon: SearchIcon  },
  { key: 'room',    label: 'Rooms',    Icon: RoomSIcon   },
  { key: 'food',    label: 'Food',     Icon: FoodSIcon   },
  { key: 'service', label: 'Services', Icon: SvcSIcon    },
  { key: 'people',  label: 'People',   Icon: PeopleSIcon },
];

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => runSearch(q.trim()), 350);
  }, [q, cat]);

  async function runSearch(term: string) {
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    const like = `%${term}%`;
    const all: Result[] = [];

    // Rooms
    if (cat === 'all' || cat === 'room') {
      const { data } = await sb.from('roommate_listings').select('id,title,location,rent,listing_type').ilike('title', like).eq('is_active', true).limit(6);
      (data || []).forEach(r => all.push({ id: r.id, type: 'room', subtype: r.listing_type, title: r.title, sub: `${r.location || ''}${r.rent ? ` · $${r.rent}/mo` : ''}`, href: '/student/roommates', badge: r.listing_type === 'sublet' ? 'Sublet' : r.listing_type === 'have' ? 'Available' : 'Looking' }));
    }

    // Food
    if (cat === 'all' || cat === 'food') {
      const { data } = await sb.from('tiffin_listings').select('id,name,cuisine,location,price_per_meal').or(`name.ilike.${like},cuisine.ilike.${like},location.ilike.${like}`).limit(6);
      (data || []).forEach(r => all.push({ id: r.id, type: 'food', title: r.name, sub: `${r.cuisine || ''}${r.location ? ` · ${r.location}` : ''}${r.price_per_meal ? ` · $${r.price_per_meal}/meal` : ''}`, href: '/student/food', badge: r.cuisine }));
    }

    // Services
    if (cat === 'all' || cat === 'service') {
      const { data } = await sb.from('service_listings').select('id,user_id,title,category,location').or(`title.ilike.${like},category.ilike.${like},location.ilike.${like}`).limit(6);
      (data || []).forEach(r => all.push({ id: r.id, type: 'service', title: r.title, sub: `${r.category || ''}${r.location ? ` · ${r.location}` : ''}`, href: `/student/services/vendor/${r.user_id}`, badge: r.category }));
    }

    // People / providers
    if (cat === 'all' || cat === 'people') {
      const { data } = await sb.from('public_profiles').select('id,full_name,role').ilike('full_name', like).neq('id', user?.id || '').limit(6);
      (data || []).forEach(r => all.push({ id: r.id, type: 'people', subtype: r.role, title: r.full_name || 'Student', sub: r.role === 'vendor' ? 'Service provider' : 'Student', href: `/student/messages?to=${r.id}&name=${encodeURIComponent(r.full_name || '')}`, badge: r.role === 'vendor' ? 'Vendor' : undefined }));
    }

    setResults(all);
    setSearched(true);
    setLoading(false);
  }

  const typeColor: Record<string, string> = { room: '#2E7D5B', food: '#E08A1E', service: '#2563EB', people: '#7C6BD1' };
  const typeBg: Record<string, string>    = { room: 'rgba(46,125,91,0.12)', food: 'rgba(226,138,30,0.12)', service: 'rgba(37,99,235,0.1)', people: 'rgba(124,107,209,0.14)' };

  return (
    <StudentLayout title="Search">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', display: 'inline-flex' }}><SearchIcon /></span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search rooms, food, services, people…"
            style={{ width: '100%', height: 54, padding: '0 48px 0 48px', background: 'var(--navy2)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 16, color: 'var(--white)', fontSize: 16, boxSizing: 'border-box', outline: 'none' }}
          />
          {q && <button onClick={() => setQ('')} style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', fontSize:18, cursor:'pointer' }}>×</button>}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)}
              style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1px solid ${cat === c.key ? 'var(--amber)' : 'var(--border)'}`, background: cat === c.key ? 'rgba(18,161,80,0.1)' : 'transparent', color: cat === c.key ? 'var(--amber)' : 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ display: 'inline-flex', opacity: 0.7 }}><c.Icon /></span>{c.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Searching…</div>}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ marginBottom: 12, color: 'var(--muted)', display: 'inline-flex' }}><SearchIcon /></div>
            <p style={{ color: 'var(--white)', fontWeight: 600, marginBottom: 6 }}>No results for "{q}"</p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Try different keywords or browse a category.</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {[
              { Icon: RoomSIcon,   label:'Find a room',     href:'/student/roommates',          color:'#2E7D5B' },
              { Icon: FoodSIcon,   label:'Order food',      href:'/student/food',               color:'#E08A1E' },
              { Icon: TutorQLIcon, label:'Find a tutor',    href:'/student/services?cat=Tutoring',      color:'#2563EB' },
              { Icon: RideQLIcon,  label:'Book a ride',     href:'/student/services?cat=Airport%20Rides', color:'#7C6BD1' },
              { Icon: HeartQLIcon, label:'Campus Connect',  href:'/student/dating',             color:'#C25B4E' },
              { Icon: DocQLIcon,   label:'Get handouts',    href:'/student/handouts',           color:'#4c6157' },
            ].map(s => (
              <Link key={s.href} href={s.href} style={{ display:'flex', alignItems:'center', gap:14, padding:'18px 20px', background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:14, textDecoration:'none', color:'var(--white)', fontWeight:600, fontSize:15, transition:'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='rgba(18,161,80,0.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border)'}>
                <span style={{ color: s.color, display:'inline-flex' }}><s.Icon /></span>{s.label}
              </Link>
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{results.length} result{results.length !== 1 ? 's' : ''}</div>
            {results.map(r => (
              <Link key={`${r.type}-${r.id}`} href={r.href}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:14, textDecoration:'none', transition:'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='rgba(18,161,80,0.25)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border)'}>
                <div style={{ width:44, height:44, borderRadius:12, background: typeBg[r.type], display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: typeColor[r.type] }}><ResultIcon type={r.type} subtype={r.subtype} /></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--white)', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.title}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.sub}</div>
                </div>
                {r.badge && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background: typeBg[r.type], color: typeColor[r.type], border:`1px solid ${typeColor[r.type]}33`, flexShrink:0 }}>{r.badge}</span>}
                <span style={{ color:'var(--muted)', fontSize:16, flexShrink:0 }}>→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
