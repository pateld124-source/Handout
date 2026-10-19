'use client';

// PUBLIC preview — no login required to BROWSE. Logged-out visitors see real
// roommate + marketplace listings (anon-readable via RLS), and every ACTION
// (message / connect / view contact) routes them to sign up. This is the
// "show value before the wall" conversion page: people see the app is alive,
// then create an account to actually reach someone.

import { ROOMMATE_PUBLIC_COLUMNS } from '@/lib/listingColumns';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const SIGNUP = '/auth/signup';

const BoxIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const HomeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const LockIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const GlobeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const BoltIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const SparkIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const HeartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;

type Room = { id:string; title:string; location:string; rent:number; rent_min:number; rent_max:number; listing_type:string; room_type:string; media:any; university:string };
type Item = { id:string; title:string; price:number; category:string; media:string[]; description:string };
type Post = { id:string; title:string; content:string; created_at:string };
type Event = { id:string; title:string; category:string; location:string; event_date:string; event_time:string; is_free:boolean; price:number };

// Campus Connect preview. These are ILLUSTRATIVE EXAMPLES, not real users —
// every card is visibly badged "Example" so nobody is misled into thinking a
// specific person is on the app. Real dating profiles are never exposed publicly
// (dating_profiles is authenticated-only by RLS, and students didn't consent to
// having their photo/name shown to the open internet).
const CONNECT_EXAMPLES = [
  { initials:'E', name:'Emily, 21', sub:'Computer Science · Rowan University' },
  { initials:'M', name:'Maya, 24',  sub:'Biology (Grad) · Rowan University' },
  { initials:'J', name:'Jordan, 20', sub:'Business · Rowan University' },
];

// Sample room listings shown only when no real rooms exist yet, under a clearly
// labelled "what listings look like" section so they're never mistaken for real
// inventory. They disappear the moment a student posts a real room.
const ROOM_EXAMPLES = [
  { title:'Private room in 3-bed apartment', price:'$500/mo', sub:'Glassboro · Utilities included · From Sept 1' },
  { title:'Shared room near campus',         price:'$250/mo', sub:'Glassboro · Utilities split · From Oct 1' },
  { title:'Studio sublet, own bathroom',     price:'$800/mo', sub:'Rowan Blvd · Utilities included · From Dec 15' },
];

// Personal-profile features stay behind the wall (we never expose real students'
// dating / matching profiles publicly) — they're shown as locked teasers.
const LOCKED_FEATURES = [
  { emoji:'⭐', title:'Find Your People', blurb:'Study buddies, gym partners and project teammates who fit your vibe.' },
  { emoji:'💬', title:'Messages',         blurb:'Chat directly with any student about a room, an item or a meetup.' },
  { emoji:'🎁', title:'Rewards',          blurb:'Earn points for posting, referring friends and being active.' },
];

// Preserved-but-not-yet-live services (mirrors config/features COMING_SOON).
const SOON_FEATURES = [
  { emoji:'🚗', title:'Airport Pickup' },
  { emoji:'💼', title:'Student Jobs' },
  { emoji:'🧹', title:'Student Services' },
  { emoji:'🎓', title:'Tutoring' },
];

function fmtDate(d: string): string {
  if (!d) return '';
  try { return new Date(d + 'T00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' }); }
  catch { return d; }
}

function firstPhoto(media: any): string {
  if (!media) return '';
  if (Array.isArray(media)) {
    const m = media[0];
    if (!m) return '';
    return typeof m === 'string' ? m : (m.url || '');
  }
  return '';
}

export default function ExplorePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const today = new Date().toISOString().split('T')[0];
      const [{ data: r }, { data: m }, { data: p }, { data: e }] = await Promise.all([
        sb.from('roommate_listings').select(ROOMMATE_PUBLIC_COLUMNS).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
        sb.from('market_listings').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
        sb.from('community_posts').select('id,title,content,created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(6),
        sb.from('campus_events').select('*').eq('is_active', true).gte('event_date', today).order('event_date', { ascending: true }).limit(6),
      ]);
      setRooms((r || []) as Room[]);
      setItems((m || []) as Item[]);
      setPosts((p || []) as Post[]);
      setEvents((e || []) as Event[]);
      setLoading(false);
    })();
  }, []);

  const total = rooms.length + items.length + posts.length + events.length;

  return (
    <div style={{ minHeight:'100vh', background:'#F1F7F3', color:'#12241C' }}>
      {/* Top bar */}
      <header style={{ position:'sticky', top:0, zIndex:20, background:'rgba(241,247,243,0.9)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(18,36,28,0.08)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/landing" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <div style={{ width:32, height:32, background:'#12A150', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:800, fontSize:16, color:'#fff' }}>H</div>
          <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:18, color:'#12241C' }}>Handout</span>
        </Link>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/auth/login" className="ft-btn ft-btn-o" style={{ padding:'8px 14px', fontSize:13 }}>Log in</Link>
          <Link href={SIGNUP} className="ft-btn ft-btn-p" style={{ padding:'8px 16px', fontSize:13 }}>Sign up free</Link>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px 120px' }}>
        {/* Hero */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(18,161,80,0.1)', border:'1px solid rgba(18,161,80,0.22)', borderRadius:100, padding:'5px 12px', fontSize:12, fontWeight:700, color:'#0F8A44', marginBottom:14 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#12A150', display:'inline-block' }} /> Live on campus right now
          </div>
          <h1 className="ft-num" style={{ fontSize:'clamp(28px,5vw,40px)', letterSpacing:-1, margin:'0 0 8px', color:'#12241C' }}>
            See what students are posting
          </h1>
          <p style={{ fontSize:15, color:'#4c6157', maxWidth:560, lineHeight:1.55, margin:0 }}>
            Rooms, roommates and marketplace deals from students on your campus. Browse free — <strong style={{ color:'#12241C' }}>sign up to message anyone.</strong>
          </p>
        </div>

        {loading ? (
          <p style={{ color:'#7D9188', fontSize:14 }}>Loading listings…</p>
        ) : (
          <>
            {/* Rooms & roommates — always shown so the feature is visible */}
            <Section title="Rooms & roommates" icon={<HomeIcon />}>
              {rooms.length === 0 ? (
                ROOM_EXAMPLES.map(r => (
                  <PreviewCard key={r.title} img="" title={r.title} price={r.price} sub={r.sub} action="Message" />
                ))
              ) : (
                rooms.map(r => {
                  const img = firstPhoto(r.media);
                  const price = r.listing_type === 'need'
                    ? (r.rent_min || r.rent_max ? `$${r.rent_min || 0}–${r.rent_max || r.rent_min || 0}` : 'Budget flexible')
                    : (r.rent != null ? `$${Number(r.rent).toFixed(0)}/mo` : '—');
                  return (
                    <PreviewCard key={r.id} img={img} title={r.title || 'Roommate listing'} price={price}
                      sub={[r.location, r.room_type].filter(Boolean).join(' · ') || r.university || 'On campus'} action="Message" />
                  );
                })
              )}
            </Section>

            {/* Marketplace — always shown so the feature is visible */}
            <Section title="Marketplace" icon={<BoxIcon />}>
              {items.length === 0 ? (
                <EmptyCard label="No items listed yet" hint="Sell your textbooks and dorm items to students on campus." />
              ) : (
                items.map(it => (
                  <PreviewCard key={it.id} img={firstPhoto(it.media)} title={it.title} price={it.price != null ? `$${Number(it.price).toFixed(0)}` : '—'}
                    sub={it.category || 'Item'} action="Message seller" />
                ))
              )}
            </Section>

            {/* Campus Connect — ILLUSTRATIVE examples, each badged "Example" */}
            <Section title="Campus Connect" icon={<HeartIcon />}>
              {CONNECT_EXAMPLES.map(c => (
                <Link key={c.name} href={SIGNUP} className="ft-card" style={{ overflow:'hidden', display:'flex', flexDirection:'column', textDecoration:'none', color:'inherit' }}>
                  <div style={{ height:150, background:'linear-gradient(160deg,#7C6BD1,#5A4BB8)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ width:58, height:58, borderRadius:'50%', background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff' }}>{c.initials}</span>
                  </div>
                  <div style={{ padding:14, display:'flex', flexDirection:'column', gap:6, flex:1 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#12241C' }}>{c.name}</span>
                    <span style={{ fontSize:12.5, color:'#7D9188' }}>{c.sub}</span>
                    <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 0', borderRadius:10, background:'rgba(124,107,209,0.1)', border:'1px solid rgba(124,107,209,0.28)', color:'#5A4BB8', fontSize:13, fontWeight:700 }}>
                      <LockIcon /> Sign in to unlock
                    </div>
                  </div>
                </Link>
              ))}
            </Section>

            {/* Campus events */}
            {events.length > 0 && (
              <Section title="Campus events" icon={<BoltIcon />}>
                {events.map(ev => (
                  <PreviewCard key={ev.id} img="" title={ev.title}
                    price={ev.is_free ? 'Free' : (ev.price != null ? `$${Number(ev.price).toFixed(0)}` : '—')}
                    sub={[fmtDate(ev.event_date), ev.location].filter(Boolean).join(' · ') || ev.category || 'Event'}
                    action="RSVP" />
                ))}
              </Section>
            )}

            {/* Community feed */}
            {posts.length > 0 && (
              <Section title="Community feed" icon={<GlobeIcon />}>
                {posts.map(po => (
                  <Link key={po.id} href={SIGNUP} className="ft-card" style={{ padding:16, display:'flex', flexDirection:'column', gap:8, textDecoration:'none', color:'inherit' }}>
                    {po.title && <span style={{ fontSize:14.5, fontWeight:700, color:'#12241C', lineHeight:1.3 }}>{po.title}</span>}
                    <p style={{ margin:0, fontSize:13, color:'#4c6157', lineHeight:1.55, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{po.content}</p>
                    <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:6, color:'#0F8A44', fontSize:12.5, fontWeight:700 }}>
                      <LockIcon /> Join to reply
                    </div>
                  </Link>
                ))}
              </Section>
            )}
          </>
        )}

        {/* Everything else — gated because it involves real students' profiles */}
        <Section title="Also inside Handout" icon={<SparkIcon />}>
          {LOCKED_FEATURES.map(f => (
            <Link key={f.title} href={SIGNUP} className="ft-card" style={{ padding:18, display:'flex', flexDirection:'column', gap:8, textDecoration:'none', color:'inherit' }}>
              <span style={{ fontSize:26 }}>{f.emoji}</span>
              <span style={{ fontSize:15, fontWeight:800, color:'#12241C' }}>{f.title}</span>
              <span style={{ fontSize:13, color:'#4c6157', lineHeight:1.55 }}>{f.blurb}</span>
              <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:6, color:'#0F8A44', fontSize:12.5, fontWeight:700, paddingTop:6 }}>
                <LockIcon /> Sign up to unlock
              </div>
            </Link>
          ))}
        </Section>

        {/* What's Next */}
        <section style={{ marginBottom:34 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
            <h2 className="ft-num" style={{ fontSize:20, color:'#12241C', margin:0 }}>Coming soon</h2>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {SOON_FEATURES.map(f => (
              <span key={f.title} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#fff', border:'1px solid rgba(18,36,28,0.1)', borderRadius:100, padding:'9px 16px', fontSize:13.5, color:'#4c6157', fontWeight:600 }}>
                <span style={{ fontSize:16 }}>{f.emoji}</span> {f.title}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky sign-up bar */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:30, background:'#12241C', color:'#fff', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:14, fontWeight:600 }}>Like what you see? Join free and start connecting.</span>
        <Link href={SIGNUP} className="ft-btn" style={{ background:'#12A150', color:'#fff', padding:'9px 20px', fontSize:14, fontWeight:700 }}>Sign up free →</Link>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title:string; icon:React.ReactNode; children:React.ReactNode }) {
  return (
    <section style={{ marginBottom:34 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
        <span style={{ color:'#12A150', display:'inline-flex' }}>{icon}</span>
        <h2 className="ft-num" style={{ fontSize:20, color:'#12241C', margin:0 }}>{title}</h2>
      </div>
      <div className="rg-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>{children}</div>
    </section>
  );
}

// Honest empty state for a section with no listings yet — invites the visitor to
// be the first rather than implying hidden inventory.
function EmptyCard({ label, hint }: { label:string; hint:string }) {
  return (
    <Link href={SIGNUP} className="ft-card" style={{ gridColumn:'1 / -1', padding:'30px 22px', display:'flex', flexDirection:'column', alignItems:'center', gap:7, textAlign:'center', textDecoration:'none', color:'inherit' }}>
      <span style={{ fontSize:14.5, fontWeight:700, color:'#12241C' }}>{label}</span>
      <span style={{ fontSize:13, color:'#7D9188' }}>{hint}</span>
      <span style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, background:'rgba(18,161,80,0.08)', border:'1px solid rgba(18,161,80,0.2)', color:'#0F8A44', fontSize:13, fontWeight:700 }}>
        Sign up & post free →
      </span>
    </Link>
  );
}

// A card that shows the listing but sends every click to sign-up.
function PreviewCard({ img, title, price, sub, action }: { img:string; title:string; price:string; sub:string; action:string }) {
  return (
    <Link href={SIGNUP} className="ft-card" style={{ overflow:'hidden', display:'flex', flexDirection:'column', textDecoration:'none', color:'inherit' }}>
      <div style={{ height:150, background:'#E6EFE9', position:'relative', flexShrink:0 }}>
        {img
          ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#B7C6BD' }}><BoxIcon /></div>}
      </div>
      <div style={{ padding:14, display:'flex', flexDirection:'column', gap:7, flex:1 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#12241C', lineHeight:1.3 }}>{title}</span>
          <span className="ft-num" style={{ fontSize:14, color:'#12A150', flexShrink:0 }}>{price}</span>
        </div>
        <span style={{ fontSize:12.5, color:'#7D9188', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</span>
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 0', borderRadius:10, background:'rgba(18,161,80,0.08)', border:'1px solid rgba(18,161,80,0.2)', color:'#0F8A44', fontSize:13, fontWeight:700 }}>
          <LockIcon /> {action}
        </div>
      </div>
    </Link>
  );
}
