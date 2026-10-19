'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAction } from '@/lib/actions/auth';
import { awardPoints } from '@/lib/points';
import { publicStorageUrl } from '@/lib/storageUrl';
import { prepareImageUpload } from '@/lib/imageCompress';

/* ── MessagesUI icon set ── */
const SvcMsgIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const FoodMsgIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const StarMsgFillIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="#E08A1E" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const StarMsgEmptyIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(18,36,28,0.12)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const PaperclipIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const SendIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const XSmIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const FileIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;

/* ── Emoji data ── */
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','🤗','🤩','🥳','😜','😝','🙃','😴','🤧','🥺','😭','😢','😔','😤','😡','🤔','😐','😬','😳','🫢','🤯'] },
  { label: 'Hands', emojis: ['👍','👎','❤️','🔥','💯','✅','❌','🙌','👏','🤝','👋','✌️','🤞','💪','🙏','👌','🫶','💔','⭐','💡'] },
  { label: 'Party', emojis: ['🎉','🎊','🎁','🏆','🥇','💎','🚀','🌟','✨','💫','🎯','🎮','🎶','🎵','🎤','🥂','🍾'] },
  { label: 'Food', emojis: ['🍕','🍔','🍟','☕','🍜','🍝','🍱','🍣','🎂','🍦','🥗','🍎','🍓','🍩','🌮','🥐'] },
  { label: 'Places', emojis: ['🌍','🏠','🏫','🚗','✈️','🏖️','⛅','🌙','☀️','🌈','❄️','🔑','📱','💻','📚','🎒'] },
];

/* ── Emoji Picker ── */
function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    // slight delay so the button click that opened it doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: 64, left: 0,
      width: 308, background: '#ffffff',
      border: '1px solid rgba(18,36,28,0.12)',
      borderRadius: 14, boxShadow: '0 12px 36px rgba(18,36,28,0.16)',
      zIndex: 200, overflow: 'hidden',
    }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(18,36,28,0.09)' }}>
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex: 1, padding: '9px 0',
            background: 'none', border: 'none',
            fontSize: 18, cursor: 'pointer',
            borderBottom: tab === i ? '2px solid #12A150' : '2px solid transparent',
            opacity: tab === i ? 1 : 0.45,
            transition: 'opacity .12s',
          }}>
            {cat.emojis[0]}
          </button>
        ))}
      </div>
      {/* Grid */}
      <div style={{
        padding: '8px 6px',
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2, maxHeight: 192, overflowY: 'auto',
      }}>
        {EMOJI_CATEGORIES[tab].emojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => onPick(emoji)}
            style={{
              background: 'none', border: 'none',
              fontSize: 22, cursor: 'pointer',
              borderRadius: 8, padding: '4px 0', lineHeight: 1,
              transition: 'background .1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(18,36,28,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Message content renderer (handles file attachments) ── */
function MessageContent({ content, mine }: { content: string; mine: boolean }) {
  const imgPattern = /\[📎 ([^\]]+\.(png|jpg|jpeg|gif|webp))\]\(([^)]+)\)/i;
  const filePattern = /\[📎 ([^\]]+)\]\(([^)]+)\)/;
  const simplePattern = /\[📎 ([^\]]+)\]/;
  const plain = <span style={{ wordBreak: 'break-word' }}>{content}</span>;

  const imgMatch = content.match(imgPattern);
  if (imgMatch) {
    const [full, name, , url] = imgMatch;
    const src = publicStorageUrl(url, 'message-attachments');
    if (!src) return plain;
    const pre = content.slice(0, content.indexOf(full)).trim();
    return (
      <div>
        {pre && <p style={{ margin: '0 0 8px', wordBreak: 'break-word' }}>{pre}</p>}
        <img src={src} alt={name} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block' }} />
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.65 }}>📎 {name}</div>
      </div>
    );
  }

  const fileMatch = content.match(filePattern);
  if (fileMatch) {
    const [full, name, url] = fileMatch;
    const href = publicStorageUrl(url, 'message-attachments');
    if (!href) return plain;
    const pre = content.slice(0, content.indexOf(full)).trim();
    return (
      <div>
        {pre && <p style={{ margin: '0 0 8px', wordBreak: 'break-word' }}>{pre}</p>}
        <a href={href} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 11px', borderRadius: 8,
          background: mine ? 'rgba(0,0,0,0.15)' : 'rgba(18,36,28,0.09)',
          color: mine ? '#ffffff' : '#12A150',
          textDecoration: 'none', fontSize: 12, fontWeight: 600,
        }}>
          <FileIcon /> {name}
        </a>
      </div>
    );
  }

  const simpleMatch = content.match(simplePattern);
  if (simpleMatch) {
    const [full, name] = simpleMatch;
    const pre = content.slice(0, content.indexOf(full)).trim();
    return (
      <div>
        {pre && <p style={{ margin: '0 0 6px', wordBreak: 'break-word' }}>{pre}</p>}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, opacity: 0.7 }}>
          <FileIcon /> {name}
        </span>
      </div>
    );
  }

  return plain;
}

/* ══════════════════════════════════════════════════════════════
   PROFILE PANEL
══════════════════════════════════════════════════════════════ */
function ProfilePanel({ userId, onClose, narrow }: { userId: string; onClose: () => void; narrow?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setData(null);
    (async () => {
      const supabase = createClient();

      const { data: user } = await supabase
        .from('public_profiles')
        .select('id, full_name, role, avatar_url, city, state')
        .eq('id', userId)
        .single();
      if (!user) { setLoading(false); return; }

      if (user.role === 'vendor') {
        const [
          { data: pp },
          { data: revs },
          { data: svc },
          { data: tiffin },
        ] = await Promise.all([
          supabase.from('provider_profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('reviews').select('rating, comment, created_at, reviewer_id')
            .eq('reviewee_id', userId).order('created_at', { ascending: false }).limit(5),
          supabase.from('service_listings').select('id, title, rate, rate_type, category')
            .eq('user_id', userId).eq('is_active', true).limit(4),
          supabase.from('tiffin_listings').select('id, name, price_per_meal, cuisine')
            .eq('user_id', userId).eq('is_active', true).limit(2),
        ]);

        const rids = Array.from(new Set((revs || []).map((r: any) => r.reviewer_id))) as string[];
        let reviewerNames: Record<string, string> = {};
        if (rids.length) {
          const { data: ru } = await supabase.from('public_profiles').select('id, full_name').in('id', rids);
          (ru || []).forEach((u: any) => { reviewerNames[u.id] = u.full_name || 'Student'; });
        }

        setData({ role: 'vendor', user, pp, reviews: revs || [], reviewerNames, services: svc || [], tiffin: tiffin || [] });
      } else {
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('university, major, bio, year_of_study, graduation_year, interests')
          .eq('user_id', userId)
          .maybeSingle();
        setData({ role: 'student', user, sp });
      }
      setLoading(false);
    })();
  }, [userId]);

  const ini = (s: string) =>
    (s || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

  function Avatar({ size = 64 }: { size?: number }) {
    const avatarUrl = data?.user?.avatar_url;
    return avatarUrl ? (
      <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #5A4BB8, #12A150)',
        color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.3,
      }}>
        {ini(data?.user?.full_name || '?')}
      </div>
    );
  }

  function Chip({ text, color = '#12A150' }: { text: string; color?: string }) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
        background: color + '18', color, border: `1px solid ${color}30`,
        display: 'inline-block',
      }}>{text}</span>
    );
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ fontSize: 10, fontWeight: 800, color: '#7d9188', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 18 }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#ffffff', overflowY: 'auto',
      ...(narrow
        ? {
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 150,
            width: 'min(320px, 88vw)',
            boxShadow: '-12px 0 40px rgba(18,36,28,0.22)',
            borderLeft: '1px solid rgba(18,36,28,0.09)',
          }
        : {
            width: 300, flexShrink: 0,
            borderLeft: '1px solid rgba(18,36,28,0.09)',
          }),
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid rgba(18,36,28,0.09)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#7d9188', textTransform: 'uppercase', letterSpacing: 0.8 }}>Profile</span>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(18,36,28,0.09)',
          background: 'transparent', color: '#7d9188', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>×</button>
      </div>

      <div style={{ padding: '20px 16px', flex: 1 }}>
        {loading ? (
          <div style={{ color: '#7d9188', fontSize: 13 }}>Loading profile…</div>
        ) : !data ? (
          <div style={{ color: '#7d9188', fontSize: 13 }}>Profile not available.</div>
        ) : data.role === 'vendor' ? (
          <VendorProfile data={data} Chip={Chip} SectionLabel={SectionLabel} Avatar={Avatar} />
        ) : (
          <StudentProfile data={data} Chip={Chip} SectionLabel={SectionLabel} Avatar={Avatar} />
        )}
      </div>
    </div>
  );
}

/* ── Vendor profile content ─────────────────────────────── */
function VendorProfile({ data, Chip, SectionLabel, Avatar }: any) {
  const { user, pp, reviews, reviewerNames, services, tiffin } = data;
  const allListings = [
    ...services.map((s: any) => ({ Icon: SvcMsgIcon,  name: s.title, detail: s.rate ? `$${s.rate}/${s.rate_type || 'hr'}` : '', tag: s.category })),
    ...tiffin.map((t: any) => ({ Icon: FoodMsgIcon, name: t.name, detail: t.price_per_meal ? `$${t.price_per_meal}/meal` : '', tag: t.cuisine })),
  ];
  const rating = pp?.rating || 0;
  const reviewCount = pp?.total_reviews || reviews.length || 0;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 16 }}>
        <Avatar size={68} />
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#12241C' }}>{user.full_name}</div>
          {pp?.business_name && <div style={{ fontSize: 12, color: '#12A150', fontWeight: 700, marginTop: 2 }}>{pp.business_name}</div>}
          <div style={{ fontSize: 11, color: '#7d9188', marginTop: 3 }}>Vendor{user.city ? ` · ${user.city}` : ''}</div>
        </div>
      </div>

      {rating > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} style={{ display: 'inline-flex' }}>{n <= Math.round(rating) ? <StarMsgFillIcon /> : <StarMsgEmptyIcon />}</span>
            ))}
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#E08A1E' }}>{(rating as number).toFixed(1)}</span>
          <span style={{ fontSize: 12, color: '#7d9188' }}>({reviewCount})</span>
        </div>
      )}

      {pp?.bio && <p style={{ fontSize: 13, color: '#4c6157', lineHeight: 1.6, marginBottom: 8, textAlign: 'center' }}>{pp.bio}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
        {pp?.experience_years > 0 && (
          <div style={{ background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#12241C' }}>{pp.experience_years}</div>
            <div style={{ fontSize: 10, color: '#7d9188', fontWeight: 600 }}>YRS EXP</div>
          </div>
        )}
        {pp?.availability?.length > 0 && (
          <div style={{ background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#12241C' }}>{pp.availability.length}</div>
            <div style={{ fontSize: 10, color: '#7d9188', fontWeight: 600 }}>DAYS/WK</div>
          </div>
        )}
      </div>

      {pp?.languages?.length > 0 && (<><SectionLabel>Languages</SectionLabel><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{pp.languages.map((l: string) => <Chip key={l} text={l} color="#7C6BD1" />)}</div></>)}
      {pp?.availability?.length > 0 && (<><SectionLabel>Availability</SectionLabel><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{pp.availability.map((d: string) => <Chip key={d} text={d} color="#12A150" />)}</div></>)}
      {pp?.categories?.length > 0 && (<><SectionLabel>Specialties</SectionLabel><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{pp.categories.map((c: string) => <Chip key={c} text={c} color="#12A150" />)}</div></>)}
      {pp?.service_area && (<><SectionLabel>Service area</SectionLabel><div style={{ fontSize: 13, color: '#4c6157' }}>{pp.service_area}</div></>)}

      {allListings.length > 0 && (
        <>
          <SectionLabel>Active listings</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allListings.map((l: any, i: number) => (
              <div key={i} style={{ background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-flex', flexShrink: 0, color: '#7d9188' }}><l.Icon /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#12241C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                  {(l.detail || l.tag) && <div style={{ fontSize: 11, color: '#7d9188' }}>{l.detail}{l.detail && l.tag ? ' · ' : ''}{l.tag}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {reviews.length > 0 && (
        <>
          <SectionLabel>Recent reviews</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reviews.map((r: any) => (
              <div key={r.created_at} style={{ background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: r.comment ? 5 : 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#12241C' }}>{reviewerNames[r.reviewer_id] || 'Student'}</span>
                  <span style={{ display: 'flex', gap: 1 }}>{Array.from({ length: r.rating }).map((_, i) => <span key={i} style={{ display: 'inline-flex' }}><StarMsgFillIcon /></span>)}</span>
                </div>
                {r.comment && <p style={{ fontSize: 12, color: '#7d9188', margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── Student profile content ──────────────────────────── */
function StudentProfile({ data, Chip, SectionLabel, Avatar }: any) {
  const { user, sp } = data;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 16 }}>
        <Avatar size={68} />
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#12241C' }}>{user.full_name}</div>
          <div style={{ fontSize: 11, color: '#7d9188', marginTop: 3 }}>Student{user.city ? ` · ${user.city}` : ''}</div>
        </div>
      </div>
      {sp?.bio && <p style={{ fontSize: 13, color: '#4c6157', lineHeight: 1.6, marginBottom: 4, textAlign: 'center' }}>{sp.bio}</p>}
      {sp?.university && (<><SectionLabel>University</SectionLabel><div style={{ fontSize: 13, color: '#12241C', fontWeight: 600 }}>{sp.university}</div></>)}
      {(sp?.major || sp?.year_of_study) && (<><SectionLabel>Program</SectionLabel><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{sp.major && <Chip text={sp.major} color="#7C6BD1" />}{sp.year_of_study && <Chip text={sp.year_of_study} color="#12A150" />}</div></>)}
      {sp?.graduation_year && (<><SectionLabel>Expected graduation</SectionLabel><div style={{ fontSize: 13, color: '#4c6157' }}>{sp.graduation_year}</div></>)}
      {sp?.interests?.length > 0 && (<><SectionLabel>Interests</SectionLabel><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{sp.interests.map((i: string) => <Chip key={i} text={i} color="#12A150" />)}</div></>)}
      {(user.city || user.state) && (<><SectionLabel>Location</SectionLabel><div style={{ fontSize: 13, color: '#4c6157' }}>{[user.city, user.state].filter(Boolean).join(', ')}</div></>)}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN MESSAGES UI
   Shared by student/messages and vendor/messages
══════════════════════════════════════════════════════════════ */
export function MessagesUI({ meId }: { meId: string }) {
  const [msgs, setMsgs]             = useState<any[]>([]);
  const [names, setNames]           = useState<Record<string, string>>({});
  const [avatars, setAvatars]       = useState<Record<string, string>>({});
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [text, setText]             = useState('');
  const [ready, setReady]           = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [pendingFile, setPendingFile]   = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [narrow, setNarrow]         = useState(false);
  const meRef  = useRef(meId);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { meRef.current = meId; }, [meId]);

  /* Single-panel layout on small screens */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  async function loadAll() {
    const uid = meRef.current;
    if (!uid) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: true });
    const list = data || [];
    setMsgs(list);

    const partners = Array.from(new Set(
      list.map(m => (m.sender_id === uid ? m.receiver_id : m.sender_id))
    )) as string[];
    if (partners.length) {
      const { data: us } = await supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', partners);
      const nm: Record<string, string> = {};
      const av: Record<string, string> = {};
      (us || []).forEach((u: any) => {
        nm[u.id] = u.full_name || 'User';
        if (u.avatar_url) av[u.id] = u.avatar_url;
      });
      setNames(prev => ({ ...prev, ...nm }));
      setAvatars(prev => ({ ...prev, ...av }));
    }
  }

  /* Mark incoming messages in the open thread as read
     (needs the msg_mark_read policy — see db/messages-read-policy.sql) */
  async function markThreadRead(partnerId: string) {
    const uid = meRef.current;
    if (!uid || !partnerId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', uid)
      .eq('sender_id', partnerId)
      .eq('is_read', false);
    if (!error) {
      setMsgs(prev => prev.map(m =>
        m.receiver_id === uid && m.sender_id === partnerId && !m.is_read
          ? { ...m, is_read: true }
          : m
      ));
    }
  }

  useEffect(() => {
    if (!meId) return;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const to = params.get('to');
      const nm = params.get('name');
      if (to) {
        setActiveId(to);
        if (nm) setNames(prev => ({ ...prev, [to]: decodeURIComponent(nm) }));
        const preFill = params.get('msg');
        if (preFill) setText(decodeURIComponent(preFill));
      }
      await loadAll();
      setReady(true);
    })();
    const t = setInterval(loadAll, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId]);

  const byPartner: Record<string, any> = {};
  const unread: Record<string, number> = {};
  msgs.forEach(m => {
    const p = m.sender_id === meId ? m.receiver_id : m.sender_id;
    byPartner[p] = m;
    if (m.receiver_id === meId && !m.is_read) unread[m.sender_id] = (unread[m.sender_id] || 0) + 1;
  });
  let convos = Object.keys(byPartner).map(pid => ({ pid, last: byPartner[pid] }));
  if (activeId && !byPartner[activeId]) convos.unshift({ pid: activeId, last: null });
  convos.sort((a, b) =>
    (b.last ? new Date(b.last.created_at).getTime() : Infinity) -
    (a.last ? new Date(a.last.created_at).getTime() : Infinity)
  );

  const thread = activeId
    ? msgs.filter(m =>
        (m.sender_id === meId && m.receiver_id === activeId) ||
        (m.sender_id === activeId && m.receiver_id === meId)
      )
    : [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length]);
  useEffect(() => { setShowProfile(false); }, [activeId]);

  /* Clear unread when the thread is open (re-checked after each poll) */
  useEffect(() => {
    if (!activeId) return;
    if (msgs.some(m => m.sender_id === activeId && m.receiver_id === meId && !m.is_read)) {
      markThreadRead(activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, msgs]);

  /* Conversation-list preview: strip attachment markdown, prefix own messages */
  const previewText = (m: any) => {
    if (!m) return 'Say hello…';
    const body = /\[📎 [^\]]+\]/.test(m.content) ? '📎 Attachment' : m.content;
    return (m.sender_id === meId ? 'You: ' : '') + body;
  };

  /* Time for today, date + time for older messages */
  const fmtWhen = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return time;
    const date = d.toLocaleDateString([], d.getFullYear() === now.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' });
    return `${date} · ${time}`;
  };

  /* ── File select ── */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10 MB.'); return; }
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setPendingPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPendingPreview(null);
    }
    e.target.value = '';
  }

  function clearFile() { setPendingFile(null); setPendingPreview(null); }

  /* ── Emoji insert ── */
  function insertEmoji(emoji: string) {
    setText(prev => prev + emoji);
    setShowEmoji(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  /* ── Send ── */
  async function send() {
    const body = text.trim();
    if (!body && !pendingFile) return;
    if (!activeId) return;

    let content = body;

    if (pendingFile) {
      setUploading(true);
      let file = pendingFile;
      // Photos are re-encoded to strip EXIF/GPS; GIFs stay as-is so they keep animating.
      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        try { file = await prepareImageUpload(file); }
        catch (e) { setUploading(false); alert((e as Error).message); return; }
      }
      try {
        const supabase = createClient();
        const ext = file.name.split('.').pop() || 'bin';
        const path = `${meId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: upData, error: upErr } = await supabase.storage
          .from('message-attachments')
          .upload(path, file, { upsert: false });
        if (!upErr && upData) {
          const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path);
          const tag = `[📎 ${file.name}](${urlData.publicUrl})`;
          content = content ? `${content}\n${tag}` : tag;
        } else {
          const tag = `[📎 ${file.name}]`;
          content = content ? `${content}\n${tag}` : tag;
        }
      } catch {
        const tag = `[📎 ${file.name}]`;
        content = content ? `${content}\n${tag}` : tag;
      }
      setUploading(false);
      clearFile();
    }

    if (!content.trim()) return;
    if (content.length > 2000) { alert('Message too long (2000 characters max).'); return; }

    setText('');
    setShowEmoji(false);
    const fd = new FormData();
    fd.set('receiverId', activeId);
    fd.set('content', content);
    const res = await sendMessageAction(fd);
    if (res?.error) { alert('Could not send: ' + res.error); setText(body); return; }
    awardPoints('send_message');
    await loadAll();
  }

  const ini = (s: string) =>
    (s || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

  function PartnerAvatar({ pid, size = 40 }: { pid: string; size?: number }) {
    return avatars[pid] ? (
      <img src={avatars[pid]} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #5A4BB8, #12A150)',
        color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.35,
      }}>
        {ini(names[pid] || '?')}
      </div>
    );
  }

  const canSend = (text.trim().length > 0 || !!pendingFile) && !uploading;

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0, background: '#ffffff' }}>

      {/* ── Conversation list ── */}
      <div style={{
        width: narrow ? '100%' : 280, flexShrink: 0,
        display: narrow && activeId ? 'none' : 'flex',
        borderRight: narrow ? 'none' : '1px solid rgba(18,36,28,0.09)',
        overflowY: 'auto', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(18,36,28,0.09)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7d9188', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Conversations
          </div>
        </div>

        {!ready ? (
          <div style={{ padding: 20, color: '#7d9188', fontSize: 13 }}>Loading…</div>
        ) : convos.length === 0 ? (
          <div style={{ padding: '20px 16px', color: '#7d9188', fontSize: 13, lineHeight: 1.6 }}>
            No conversations yet. Contact someone from a listing page to start.
          </div>
        ) : (
          convos.map(c => (
            <button key={c.pid} onClick={() => setActiveId(c.pid)} style={{
              width: '100%', display: 'flex', gap: 10, alignItems: 'center',
              padding: '12px 16px',
              background: activeId === c.pid ? 'rgba(18,161,80,0.07)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(18,36,28,0.04)',
              borderLeft: `3px solid ${activeId === c.pid ? '#12A150' : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left',
            }}>
              <PartnerAvatar pid={c.pid} size={40} />
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: unread[c.pid] ? 800 : 700, color: '#12241C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {names[c.pid] || 'User'}
                </div>
                <div style={{ fontSize: 12, fontWeight: unread[c.pid] ? 600 : 400, color: unread[c.pid] ? '#12241C' : '#7d9188', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {previewText(c.last)}
                </div>
              </div>
              {unread[c.pid] > 0 && (
                <span style={{
                  flexShrink: 0, minWidth: 19, height: 19, borderRadius: 100,
                  background: '#12A150', color: '#ffffff',
                  fontSize: 10.5, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {unread[c.pid] > 9 ? '9+' : unread[c.pid]}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* ── Thread panel ── */}
      <div style={{ flex: 1, display: narrow && !activeId ? 'none' : 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {!activeId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(18,161,80,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>💬</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#12241C', marginBottom: 4 }}>Pick a conversation</div>
              <div style={{ fontSize: 13, color: '#7d9188' }}>Or contact someone from a listing page</div>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px', borderBottom: '1px solid rgba(18,36,28,0.09)',
              flexShrink: 0, background: '#ffffff',
            }}>
              {narrow && (
                <button
                  onClick={() => setActiveId(null)}
                  aria-label="Back to conversations"
                  style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(18,36,28,0.05)', border: '1px solid rgba(18,36,28,0.09)',
                    color: '#12241C', fontSize: 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  ←
                </button>
              )}
              <button
                onClick={() => setShowProfile(v => !v)}
                title="View profile"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  flex: 1, textAlign: 'left', minWidth: 0,
                }}>
                <PartnerAvatar pid={activeId} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#12241C', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {names[activeId] || 'User'}
                    <span style={{ fontSize: 10, color: showProfile ? '#12A150' : '#7d9188', fontWeight: 600 }}>
                      {showProfile ? '← hide' : 'view profile →'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#7d9188' }}>Conversation</div>
                </div>
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F1F7F3' }}>
              {thread.length === 0 && (
                <div style={{ color: '#7d9188', fontSize: 13, textAlign: 'center', marginTop: 30 }}>
                  No messages yet — send the first one!
                </div>
              )}
              {thread.map(m => {
                const mine = m.sender_id === meId;
                return (
                  <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 14, lineHeight: 1.5,
                      background: mine ? '#12A150' : '#FFFFFF',
                      color: mine ? '#ffffff' : '#12241C',
                      border: mine ? 'none' : '1px solid rgba(18,36,28,0.09)',
                    }}>
                      <MessageContent content={m.content} mine={mine} />
                    </div>
                    <div style={{ fontSize: 10, color: '#7d9188', marginTop: 3, textAlign: mine ? 'right' : 'left' }}>
                      {fmtWhen(m.created_at)}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* ── Input area ── */}
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(18,36,28,0.09)', position: 'relative' }}>

              {/* File preview chip */}
              {pendingFile && (
                <div style={{
                  padding: '8px 14px',
                  background: 'rgba(18,161,80,0.05)',
                  borderBottom: '1px solid rgba(18,36,28,0.06)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  {pendingPreview ? (
                    <img src={pendingPreview} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(18,36,28,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7d9188', flexShrink: 0 }}>
                      <FileIcon />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#12241C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</div>
                    <div style={{ fontSize: 11, color: '#7d9188' }}>{(pendingFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={clearFile} style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(18,36,28,0.09)', border: 'none',
                    color: '#7d9188', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <XSmIcon />
                  </button>
                </div>
              )}

              {/* Emoji picker */}
              {showEmoji && (
                <EmojiPicker onPick={insertEmoji} onClose={() => setShowEmoji(false)} />
              )}

              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>

                {/* Emoji btn */}
                <button
                  onClick={() => setShowEmoji(v => !v)}
                  title="Add emoji"
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: showEmoji ? 'rgba(18,161,80,0.12)' : 'rgba(18,36,28,0.05)',
                    border: `1px solid ${showEmoji ? 'rgba(18,161,80,0.3)' : 'rgba(18,36,28,0.09)'}`,
                    fontSize: 19, lineHeight: 1, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s',
                  }}
                >
                  😊
                </button>

                {/* Attach file btn */}
                <button
                  onClick={() => fileRef.current?.click()}
                  title="Attach file"
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: pendingFile ? 'rgba(18,161,80,0.12)' : 'rgba(18,36,28,0.05)',
                    border: `1px solid ${pendingFile ? 'rgba(18,161,80,0.3)' : 'rgba(18,36,28,0.09)'}`,
                    color: pendingFile ? '#12A150' : '#7d9188',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s',
                  }}
                >
                  <PaperclipIcon />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.csv"
                />

                {/* Text input */}
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message…"
                  style={{
                    flex: 1, height: 40, padding: '0 16px',
                    background: 'rgba(18,36,28,0.05)',
                    border: '1px solid rgba(18,36,28,0.12)',
                    borderRadius: 100, color: '#12241C', fontSize: 14, outline: 'none',
                  }}
                />

                {/* Send btn */}
                <button
                  onClick={send}
                  disabled={!canSend}
                  title="Send"
                  style={{
                    width: 40, height: 40, borderRadius: 100, flexShrink: 0,
                    background: canSend ? '#12A150' : 'rgba(18,36,28,0.07)',
                    color: canSend ? '#ffffff' : '#7d9188',
                    border: 'none', cursor: canSend ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s',
                  }}
                >
                  {uploading
                    ? <span style={{ fontSize: 11, fontWeight: 700 }}>…</span>
                    : <SendIcon />
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Profile panel ── */}
      {showProfile && activeId && (
        <ProfilePanel userId={activeId} onClose={() => setShowProfile(false)} narrow={narrow} />
      )}
    </div>
  );
}
