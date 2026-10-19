'use client';

import { ROOMMATE_PUBLIC_COLUMNS, SERVICE_PUBLIC_COLUMNS, TIFFIN_PUBLIC_COLUMNS } from '@/lib/listingColumns';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const PSFoodIcon = () => <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const PSSvcIcon  = () => <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const PSRoomIcon = () => <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PSPinIcon  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
function PSListingIcon({ kind }: { kind: string }) {
  if (kind === 'food') return <PSFoodIcon />;
  if (kind === 'room') return <PSRoomIcon />;
  return <PSSvcIcon />;
}

export function PopularServices() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const [{ data: tf }, { data: sv }, { data: rm }] = await Promise.all([
          supabase.from('tiffin_listings').select(TIFFIN_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }).limit(4),
          supabase.from('service_listings').select(SERVICE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }).limit(4),
          supabase.from('roommate_listings').select(ROOMMATE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }).limit(2),
        ]);

        const food = (tf || []).map((r: any) => ({
          t: 'food', id: r.id, title: r.name || 'Home meals', badge: r.cuisine || 'Tiffin',
          price: r.price_per_meal ? `$${r.price_per_meal}` : '—', unit: '/ meal',
          loc: r.location, kind: 'food', grad: 'linear-gradient(135deg,#12A15022,#12A15022)',
          img: null as string | null, created: r.created_at,
        }));
        const svc = (sv || []).map((r: any) => ({
          t: 'svc', id: r.id, title: r.title || 'Service', badge: r.category || 'Service',
          price: r.rate ? `$${r.rate}` : '—', unit: `/ ${r.rate_type || 'hr'}`,
          loc: r.location, kind: 'svc', grad: 'linear-gradient(135deg,#12A15022,#7C6BD122)',
          img: null as string | null, created: r.created_at,
        }));
        const rooms = (rm || []).map((r: any) => {
          const photo = Array.isArray(r.media) ? r.media.find((m: any) => m.type !== 'video') : null;
          return {
            t: 'room', id: r.id, title: r.title || 'Room listing', badge: 'Roommate',
            price: r.rent ? `$${r.rent}` : '—', unit: '/ month',
            loc: r.location, kind: 'room', grad: 'linear-gradient(135deg,#5A4BB833,#12A15022)',
            img: (photo && photo.url) || null, created: r.created_at,
          };
        });

        const all = [...food, ...svc, ...rooms]
          .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
          .slice(0, 8);
        setItems(all);
      } catch { /* db not ready */ }
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section style={{ padding: '60px 48px 80px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="section-label"><div className="section-label-line" /><span className="section-label-text">Popular services</span><span className="section-label-num">03</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <h2 data-sr style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(28px,3.8vw,44px)', fontWeight: 800, letterSpacing: -1.5, color: 'var(--white)' }}>Live on Handout <em style={{ fontStyle: 'normal', fontWeight: 300, color: 'var(--amber)' }}>right now</em></h2>
        <Link href="/browse" style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, opacity: 0.85, transition: 'opacity 0.2s' }}>Browse all →</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14, marginTop: 22 }}>
        {items.map(i => (
          <Link key={i.t + i.id} href={`/browse/${i.id}?t=${i.t}`} className="svc-card">
            {/* Image / emoji banner */}
            <div style={{ position: 'relative', height: 130, background: i.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {i.img
                ? <img src={i.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }} />
                : <span style={{ display: 'inline-flex', color: 'rgba(255,255,255,0.35)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}><PSListingIcon kind={i.kind} /></span>
              }
              {/* Badge */}
              <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'rgba(10,10,10,0.80)', backdropFilter: 'blur(8px)', color: 'var(--amber)', border: '1px solid rgba(18,161,80,0.28)' }}>
                {i.badge}
              </span>
            </div>
            {/* Body */}
            <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.2 }}>{i.title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <span style={{ color: 'var(--amber)', fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>{i.price}</span>
                <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 500 }}>{i.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}><PSPinIcon /></span> {i.loc || 'Rowan University'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
