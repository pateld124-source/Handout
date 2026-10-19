'use client';

// "Show, don't tell" section for the landing page. Pulls real anon-readable
// listings (rooms + marketplace) so visitors SEE the product before the wall.
// Falls back to illustrative cards while a campus is still filling up.

import { ROOMMATE_PUBLIC_COLUMNS } from '@/lib/listingColumns';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Card = { id:string; img:string; title:string; price:string; sub:string; tag:string };

const SAMPLE: Card[] = [
  { id:'s1', img:'', title:'Private room in 3-bed apartment', price:'$500/mo', sub:'Glassboro · Utilities included · From Sept 1', tag:'Room' },
  { id:'s2', img:'', title:'Shared room near campus',          price:'$250/mo', sub:'Glassboro · Utilities split · From Oct 1',    tag:'Room' },
  { id:'s3', img:'', title:'Studio sublet, own bathroom',       price:'$800/mo', sub:'Rowan Blvd · Utilities included · From Dec 15', tag:'Sublet' },
];

function photo(media: any): string {
  if (Array.isArray(media) && media[0]) {
    const m = media[0];
    return typeof m === 'string' ? m : (m.url || '');
  }
  return '';
}

export function LiveListings() {
  const [cards, setCards] = useState<Card[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const [{ data: rooms }, { data: items }] = await Promise.all([
          sb.from('roommate_listings').select(ROOMMATE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending:false }).limit(3),
          sb.from('market_listings').select('*').eq('is_active', true).order('created_at', { ascending:false }).limit(3),
        ]);
        const r: Card[] = (rooms || []).map((x:any) => ({
          id:x.id, img:photo(x.media), title:x.title || 'Roommate listing',
          price: x.rent != null ? `$${Number(x.rent).toFixed(0)}/mo` : (x.rent_max ? `$${x.rent_min || 0}–${x.rent_max}` : '—'),
          sub: [x.location, x.room_type].filter(Boolean).join(' · ') || 'On campus', tag:'Room',
        }));
        const m: Card[] = (items || []).map((x:any) => ({
          id:x.id, img:photo(x.media), title:x.title,
          price: x.price != null ? `$${Number(x.price).toFixed(0)}` : '—',
          sub: x.category || 'Item', tag:'For sale',
        }));
        const real = [...r, ...m];
        setCards(real.length >= 3 ? real.slice(0, 6) : [...real, ...SAMPLE].slice(0, 6));
      } catch {
        setCards(SAMPLE);
      }
      setReady(true);
    })();
  }, []);

  return (
    <section className="lp-section" style={{ padding:'20px 48px 96px', maxWidth:1280, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap', marginBottom:24 }}>
        <div>
          <div className="section-label" style={{ marginBottom:10 }}>
            <div className="section-label-line" /><span className="section-label-text">On Handout</span>
          </div>
          <h2 style={{ fontFamily:"'Bricolage Grotesque', sans-serif", fontSize:'clamp(30px,4vw,50px)', fontWeight:800, letterSpacing:-1.6, lineHeight:1.05, margin:0, color:'var(--white)' }}>
            Rooms, roommates<br />and student deals.
          </h2>
        </div>
        <Link href="/explore" className="btn btn-outline">Browse all listings →</Link>
      </div>

      <div className="rg-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, opacity: ready ? 1 : 0, transition:'opacity .4s ease' }}>
        {cards.map(c => (
          <Link key={c.id} href="/explore" className="ft-card" style={{ overflow:'hidden', display:'flex', flexDirection:'column', textDecoration:'none', color:'inherit' }}>
            <div style={{ height:160, background:'#E6EFE9', position:'relative', flexShrink:0 }}>
              {c.img
                ? <img src={c.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ width:'100%', height:'100%', background:'linear-gradient(150deg,#DCEBE1,#EFF6F1)' }} />}
              <span style={{ position:'absolute', top:10, left:10, fontSize:10.5, fontWeight:800, color:'#0F8A44', background:'rgba(255,255,255,0.94)', borderRadius:100, padding:'4px 10px' }}>{c.tag}</span>
            </div>
            <div style={{ padding:16, display:'flex', flexDirection:'column', gap:7, flex:1 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#12241C', lineHeight:1.3 }}>{c.title}</span>
                <span className="ft-num" style={{ fontSize:15, color:'#12A150', flexShrink:0 }}>{c.price}</span>
              </div>
              <span style={{ fontSize:12.5, color:'#7D9188' }}>{c.sub}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
