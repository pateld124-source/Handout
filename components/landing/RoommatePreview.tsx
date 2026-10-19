'use client';

import { ROOMMATE_PUBLIC_COLUMNS } from '@/lib/listingColumns';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGate } from '@/components/auth/AuthGate';
import { createClient } from '@/lib/supabase/client';

const AV = ['#12A150', '#5A4BB8', '#12A150', '#7C6BD1'];

export function RoommatePreview() {
  const { requireAuth } = useAuthGate();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('roommate_listings').select(ROOMMATE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }).limit(3);
        const list = data || [];
        const uids = Array.from(new Set(list.map(r => r.user_id).filter(Boolean)));
        const names: Record<string, any> = {};
        if (uids.length) {
          const { data: us } = await supabase.from('public_profiles').select('id, full_name').in('id', uids);
          (us || []).forEach((u: any) => { names[u.id] = u.full_name || 'Student'; });
        }
        setRows(list.map(r => ({ ...r, poster: names[r.user_id] || 'Student' })));
      } catch { /* db not ready */ }
    })();
  }, []);

  function message(r: any) {
    // Guests must sign in before contacting anyone.
    requireAuth(() => {
      window.location.href = `/student/messages?to=${r.user_id}&name=${encodeURIComponent(r.poster)}`;
    }, 'Sign in to message students on Handout');
  }

  if (rows.length === 0) return null;

  return (
    <section style={{ padding: '70px 48px 30px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 800, letterSpacing: -1, color: '#12241C' }}>Roommates looking for a match</h2>
          <p style={{ color: '#7d9188', fontSize: 13, marginTop: 6 }}>A few of the students searching right now.</p>
        </div>
        <Link href="/browse?c=roommates" style={{ color: '#12A150', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>See all →</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(285px,1fr))', gap: 16, marginTop: 22 }}>
        {rows.map((r, i) => (
          <div key={r.id} style={{ background: '#FFFFFF', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: AV[i % AV.length], color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{r.poster.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/browse/${r.id}?t=room`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontWeight: 800, color: '#12241C', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.poster}</div>
                </Link>
                <div style={{ fontSize: 12, color: '#7d9188', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.university || 'Rowan University'}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 100, background: 'rgba(18,161,80,0.1)', color: '#12A150', border: '1px solid rgba(18,161,80,0.3)' }}>NEW</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12.5, color: '#4c6157', flexWrap: 'wrap' }}>
              {r.rent ? <span>💰 ${r.rent}/mo</span> : null}
              <span>📍 {r.location || 'Glassboro'}</span>
            </div>
            <button onClick={() => message(r)} style={{ marginTop: 14, width: '100%', height: 40, background: 'rgba(18,161,80,0.1)', color: '#12A150', border: '1px solid rgba(18,161,80,0.35)', borderRadius: 100, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              Message {r.poster.split(' ')[0]}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
