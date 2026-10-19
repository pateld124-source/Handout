'use client';

import { useEffect, useRef, useState } from 'react';
import { VendorShell } from '@/components/layout/VendorShell';
import { createClient } from '@/lib/supabase/client';
import { prepareImageUpload } from '@/lib/imageCompress';
import { validateName } from '@/lib/validation';
import { PhoneOTPVerify } from '@/components/ui/PhoneOTPVerify';

const VP_PinIcon  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const VP_StarIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const VP_CamIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;

const SERVICE_CATS = ['Food / Tiffin', 'Tutoring', 'Airport Rides', 'Babysitting', 'Notary', 'Moving Help', 'Cleaning', 'Beauty', 'Tech / Repair', 'Other'];
const LANG_OPTIONS = ['English', 'Hindi', 'Spanish', 'Gujarati', 'Punjabi', 'Mandarin', 'Arabic', 'Telugu', 'Tamil', 'Urdu', 'Bengali', 'Other'];
const AVAIL_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EXP_YEARS = ['Less than 1 year', '1–2 years', '3–5 years', '5–10 years', '10+ years'];

const I: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px',
  background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.12)',
  borderRadius: 10, color: '#12241C', fontSize: 14, boxSizing: 'border-box', outline: 'none',
};
const L: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#4c6157', display: 'block', marginBottom: 6, letterSpacing: 0.3 };
const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid rgba(18,36,28,0.09)', borderRadius: 18, padding: 24,
};

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        background: active ? 'rgba(18,161,80,0.14)' : 'rgba(18,36,28,0.04)',
        color: active ? '#12A150' : '#7d9188',
        border: active ? '1px solid rgba(18,161,80,0.5)' : '1px solid rgba(18,36,28,0.12)',
        transition: 'all 0.15s',
      }}>
      {label}
    </button>
  );
}

export default function VendorProfile() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [business, setBusiness] = useState('');
  const [area, setArea] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (fullName || email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: u } = await supabase.from('users').select('*').eq('id', user.id).single();
      const { data: p } = await supabase.from('provider_profiles').select('*').eq('user_id', user.id).maybeSingle();
      setFullName(u?.full_name || '');
      setEmail(u?.email || user.email || '');
      setPhone(u?.phone || '');
      setPhoneVerified(u?.phone_verified || false);
      setAvatarUrl(u?.avatar_url || '');
      setBusiness(p?.business_name || '');
      setArea(p?.service_area || u?.address || '');
      setBio(p?.bio || '');
      setWebsite(p?.website || '');
      setExperienceYears(p?.experience_years ? String(p.experience_years) : '');
      setCategories(p?.categories || []);
      setLanguages(p?.languages || []);
      setAvailability(p?.availability || []);
      setHydrated(true);
    })();
  }, []);

  async function uploadAvatar(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Image must be under 5 MB'); return; }
    setUploading(true); setErr('');
    const jpeg = await prepareImageUpload(file).catch((e: Error) => { setErr(e.message); return null; });
    if (!jpeg) { setUploading(false); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const path = `${user.id}/avatar.jpg`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, jpeg, { upsert: true });
    if (upErr) { setErr('Upload failed: ' + upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;
    await supabase.from('users').update({ avatar_url: urlWithBust }).eq('id', user.id);
    setAvatarUrl(urlWithBust);
    setUploading(false);
  }

  async function save() {
    setErr(''); setSaved(false);
    const nameErr = validateName(fullName);
    if (nameErr) { setErr(nameErr); return; }
    if (!phone) { setErr('Phone number is required'); return; }
    if (!area.trim()) { setErr('Service area is required'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const [uRes, pRes] = await Promise.all([
      supabase.from('users').update({ full_name: fullName.trim(), phone, address: area.trim() }).eq('id', user.id),
      supabase.from('provider_profiles').upsert({
        user_id: user.id,
        business_name: business.trim(),
        service_area: area.trim(),
        bio: bio.trim(),
        website: website.trim() || null,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
        categories,
        languages,
        availability,
      }, { onConflict: 'user_id' }),
    ]);
    setSaving(false);
    if (uRes.error || pRes.error) { setErr((uRes.error || pRes.error)?.message || 'Save failed'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  // Derive exp years value (string to numeric index for upsert)
  const expYearsNumeric = experienceYears ? EXP_YEARS.indexOf(experienceYears) + 1 : null;

  return (
    <VendorShell active="My Profile" title="My Profile">
      {() => (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {!hydrated ? (
            <div style={{ color: '#7d9188', padding: '40px 0', textAlign: 'center' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Status messages */}
              {err && <div style={{ background: 'rgba(194,91,78,0.1)', border: '1px solid rgba(194,91,78,0.3)', color: '#C25B4E', borderRadius: 12, padding: '12px 16px', fontSize: 13 }}>{err}</div>}
              {saved && <div style={{ background: 'rgba(18,161,80,0.1)', border: '1px solid rgba(18,161,80,0.3)', color: '#12A150', borderRadius: 12, padding: '12px 16px', fontSize: 13 }}>Profile saved ✓</div>}

              {/* Header card */}
              <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div onClick={() => fileRef.current?.click()}
                    style={{
                      width: 84, height: 84, borderRadius: '50%', cursor: 'pointer',
                      background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#12A150,#5A4BB8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 28, color: '#ffffff',
                      overflow: 'hidden', border: '3px solid rgba(18,36,28,0.12)',
                    }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials}
                  </div>
                  {uploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: '#12A150', fontWeight: 700 }}>…</span>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#12241C', marginBottom: 3 }}>{business || fullName || 'Your Profile'}</div>
                  <div style={{ fontSize: 12, color: '#7d9188', marginBottom: 10 }}>{email}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {area && <span style={{ fontSize: 11, fontWeight: 700, color: '#12A150', background: 'rgba(18,161,80,0.1)', border: '1px solid rgba(18,161,80,0.25)', borderRadius: 100, padding: '3px 10px', display:'inline-flex', alignItems:'center', gap:4 }}><VP_PinIcon /> {area}</span>}
                    {experienceYears && <span style={{ fontSize: 11, fontWeight: 600, color: '#4c6157', background: 'rgba(18,36,28,0.06)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 100, padding: '3px 10px', display:'inline-flex', alignItems:'center', gap:4 }}><VP_StarIcon /> {experienceYears}</span>}
                    {categories.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#4c6157', background: 'rgba(18,36,28,0.06)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 100, padding: '3px 10px' }}>{categories.slice(0, 2).join(', ')}{categories.length > 2 ? ` +${categories.length - 2}` : ''}</span>}
                  </div>
                </div>
                <button onClick={() => fileRef.current?.click()}
                  style={{ flexShrink: 0, padding: '8px 16px', background: 'rgba(18,36,28,0.06)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 100, color: '#4c6157', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><VP_CamIcon /> {uploading ? 'Uploading…' : 'Change photo'}</span>
                </button>
              </div>

              {/* Basic Info */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#12241C', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid rgba(18,36,28,0.09)' }}>
                  Basic Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={L}>Full name</label>
                    <input style={I} value={fullName} onChange={e => setFullName(e.target.value)} maxLength={60} placeholder="Your full name" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={L}>Email <span style={{ color: '#7d9188', fontWeight: 400 }}>(sign-in email — not editable here)</span></label>
                    <input style={{ ...I, opacity: 0.5, cursor: 'not-allowed' }} value={email} disabled />
                  </div>
                  <div>
                    <PhoneOTPVerify
                      initialPhone={phone}
                      initialVerified={phoneVerified}
                      onVerified={(p) => { setPhone(p); setPhoneVerified(true); }}
                      inputStyle={I}
                      labelStyle={L}
                    />
                  </div>
                  <div>
                    <label style={L}>Website <span style={{ color: '#7d9188', fontWeight: 400 }}>(optional)</span></label>
                    <input style={I} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#12241C', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid rgba(18,36,28,0.09)' }}>
                  Business Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={L}>Business name <span style={{ color: '#7d9188', fontWeight: 400 }}>(optional)</span></label>
                    <input style={I} value={business} onChange={e => setBusiness(e.target.value)} placeholder="e.g. Anaya's Home Kitchen" />
                  </div>
                  <div>
                    <label style={L}>Service area</label>
                    <input style={I} value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Glassboro, NJ — near Rowan" />
                  </div>
                  <div>
                    <label style={L}>Years of experience</label>
                    <select style={{ ...I, cursor: 'pointer' }} value={experienceYears} onChange={e => setExperienceYears(e.target.value)}>
                      <option value="">Select…</option>
                      {EXP_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={L}>About you / your business</label>
                    <textarea style={{ ...I, height: 100, padding: 12, resize: 'vertical' }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell students what makes your service great, your experience, why they should book you…" />
                  </div>
                </div>
              </div>

              {/* Service Categories */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#12241C', marginBottom: 6, paddingBottom: 12, borderBottom: '1px solid rgba(18,36,28,0.09)' }}>
                  Service Categories
                </div>
                <div style={{ fontSize: 12, color: '#7d9188', marginBottom: 14 }}>What services do you offer? Select all that apply.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SERVICE_CATS.map(c => (
                    <Pill key={c} label={c} active={categories.includes(c)} onClick={() => toggle(categories, setCategories, c)} />
                  ))}
                </div>
              </div>

              {/* Languages & Availability */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#12241C', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid rgba(18,36,28,0.09)' }}>
                  Languages & Availability
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ ...L, marginBottom: 12 }}>Languages you speak</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {LANG_OPTIONS.map(l => (
                        <Pill key={l} label={l} active={languages.includes(l)} onClick={() => toggle(languages, setLanguages, l)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ ...L, marginBottom: 12 }}>Days available</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {AVAIL_OPTIONS.map(d => (
                        <Pill key={d} label={d} active={availability.includes(d)} onClick={() => toggle(availability, setAvailability, d)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save */}
              <button onClick={save} disabled={saving}
                style={{ height: 50, background: '#12A150', color: '#ffffff', border: 'none', borderRadius: 100, fontWeight: 800, fontSize: 15, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>

              {/* Sign out */}
              <button onClick={async () => { await createClient().auth.signOut(); window.location.href = '/'; }}
                style={{ height: 46, background: 'transparent', color: '#C25B4E', border: '1px solid rgba(194,91,78,0.3)', borderRadius: 100, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Sign out
              </button>

            </div>
          )}
        </div>
      )}
    </VendorShell>
  );
}
