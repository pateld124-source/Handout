'use client';

import { ROOMMATE_PUBLIC_COLUMNS } from '@/lib/listingColumns';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function HeroFeatured() {
  const [l, setL] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        // Filter out the logged-in user's own listing at the DB level
        const { data: authData } = await supabase.auth.getUser();
        const meId = authData?.user?.id;
        let q = supabase.from('roommate_listings').select(ROOMMATE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }).limit(1);
        if (meId) q = (q as any).neq('user_id', meId);
        const { data } = await q;
        const r = (data || [])[0];
        if (!r) return;
        let poster = 'Student';
        if (r.user_id) {
          const { data: u } = await supabase.from('public_profiles').select('full_name').eq('id', r.user_id).single();
          poster = u?.full_name || 'Student';
        }
        setL({ ...r, poster });
      } catch { /* db not ready */ }
    })();
  }, []);

  if (!l) return null;
  const img = Array.isArray(l.media) && l.media.find((m: any) => m.type !== 'video')?.url;

  return (
    <Link href={`/browse/${l.id}?t=room`} style={{ textDecoration: 'none', width: 300, flexShrink: 0, background: '#FFFFFF', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 18, overflow: 'hidden', animation: 'fadeUpIn 0.9s ease 0.9s both', boxShadow: '0 20px 50px rgba(0,0,0,0.45)' }}>
      <div style={{ height: 150, background: 'linear-gradient(135deg,#5A4BB833,#12A15022)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 44 }}>🛏️</span>}
        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 100, background: 'rgba(18,161,80,0.9)', color: '#ffffff' }}>NEW</span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#12241C', lineHeight: 1.3 }}>{l.title || 'Looking for a roommate'}</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          {l.rent ? <span style={{ color: '#12A150', fontWeight: 800 }}>${l.rent}<span style={{ color: '#7d9188', fontWeight: 400 }}> /month</span></span> : null}
          <span style={{ color: '#7d9188' }}> · 📍 {l.location || 'Glassboro, NJ'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(18,36,28,0.09)' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#12A150', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>{l.poster.slice(0, 2).toUpperCase()}</div>
          <span style={{ fontSize: 12, color: '#4c6157', fontWeight: 600 }}>{l.poster}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#12A150', fontWeight: 700 }}>View →</span>
        </div>
      </div>
    </Link>
  );
}
