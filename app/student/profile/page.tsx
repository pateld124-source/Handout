'use client';

import { useEffect, useRef, useState } from 'react';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { createClient } from '@/lib/supabase/client';
import { deleteAccountAction } from '@/lib/actions/account';
import { prepareImageUpload } from '@/lib/imageCompress';
import { validateName, validatePhone } from '@/lib/validation';
import { UniversitySelect } from '@/components/ui/UniversitySelect';
import { PhoneOTPVerify } from '@/components/ui/PhoneOTPVerify';
import { awardPoints } from '@/lib/points';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() + i));
const INTEREST_OPTIONS = ['Sports', 'Music', 'Gaming', 'Coding', 'Art', 'Cooking', 'Reading', 'Travel', 'Fitness', 'Photography', 'Movies', 'Dance'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const I: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px',
  background: 'rgba(18,36,28,0.04)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--white)', fontSize: 14, boxSizing: 'border-box',
  outline: 'none',
};
const L: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--light)', display: 'block', marginBottom: 6, letterSpacing: 0.3,
};
const card: React.CSSProperties = {
  background: 'var(--navy2)', border: '1px solid var(--border)',
  borderRadius: 18, padding: 24,
};

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        background: active ? 'rgba(18,161,80,0.14)' : 'rgba(18,36,28,0.04)',
        color: active ? 'var(--amber)' : 'var(--muted)',
        border: active ? '1px solid rgba(18,161,80,0.5)' : '1px solid var(--border)',
        transition: 'all 0.15s',
      }}>
      {label}
    </button>
  );
}

export default function StudentProfile() {
  const [hydrated, setHydrated] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [gender, setGender] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (fullName || email || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/auth/login'; return; }
      const { data: u } = await supabase.from('users').select('*').eq('id', user.id).single();
      const { data: sp } = await supabase.from('student_profiles').select('*').eq('user_id', user.id).maybeSingle();
      setFullName(u?.full_name || '');
      setEmail(u?.email || user.email || '');
      setPhone(u?.phone || '');
      setPhoneVerified(u?.phone_verified || false);
      setGender(u?.gender || '');
      setCity(u?.city || '');
      setAvatarUrl(u?.avatar_url || '');
      setUniversity(sp?.university || '');
      setMajor(sp?.major || '');
      setBio(sp?.bio || '');
      setYearOfStudy(sp?.year_of_study || '');
      setGraduationYear(sp?.graduation_year ? String(sp.graduation_year) : '');
      setInterests(sp?.interests || []);
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
    const phoneErr = phone ? validatePhone(phone) : '';
    if (phoneErr) { setErr(phoneErr); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const [uRes, spRes] = await Promise.all([
      supabase.from('users').update({
        full_name: fullName.trim(),
        phone: phone || null,
        gender: gender || null,
        city: city.trim() || null,
      }).eq('id', user.id),
      supabase.from('student_profiles').upsert({
        user_id: user.id,
        university: university.trim(),
        major: major.trim(),
        bio: bio.trim(),
        year_of_study: yearOfStudy || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        interests,
      }, { onConflict: 'user_id' }),
    ]);
    setSaving(false);
    if (uRes.error || spRes.error) { setErr((uRes.error || spRes.error)?.message || 'Save failed'); return; }
    awardPoints('complete_profile');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function deleteAccount() {
    if (!confirm('Delete your account permanently? All data will be removed. This cannot be undone.')) return;
    setDeleting(true); setErr('');
    const res = await deleteAccountAction();
    if (res.error) { setErr(res.error); setDeleting(false); return; }
    window.location.href = '/';
  }

  const toggleInterest = (v: string) =>
    setInterests(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  return (
    <StudentLayout title="My Profile">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {!hydrated ? (
          <div style={{ color: 'var(--muted)', padding: '40px 0', textAlign: 'center' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status messages */}
            {err && (
              <div style={{ background: 'rgba(194,91,78,0.1)', border: '1px solid rgba(194,91,78,0.3)', color: '#C25B4E', borderRadius: 12, padding: '12px 16px', fontSize: 13 }}>{err}</div>
            )}
            {saved && (
              <div style={{ background: 'rgba(18,161,80,0.1)', border: '1px solid rgba(18,161,80,0.3)', color: '#12A150', borderRadius: 12, padding: '12px 16px', fontSize: 13 }}>Profile saved ✓</div>
            )}

            {/* Header card — avatar + name */}
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div onClick={() => fileRef.current?.click()}
                  style={{
                    width: 84, height: 84, borderRadius: '50%', cursor: 'pointer',
                    background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,var(--amber),var(--purple2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 28, color: '#ffffff',
                    overflow: 'hidden', border: '3px solid var(--border)',
                  }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700 }}>…</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--white)', marginBottom: 3 }}>{fullName || 'Your Name'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{email}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {university && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', background: 'rgba(18,161,80,0.1)', border: '1px solid rgba(18,161,80,0.25)', borderRadius: 100, padding: '3px 10px' }}>{university}</span>}
                  {major && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--light)', background: 'rgba(18,36,28,0.06)', border: '1px solid var(--border)', borderRadius: 100, padding: '3px 10px' }}>{major}</span>}
                  {yearOfStudy && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--light)', background: 'rgba(18,36,28,0.06)', border: '1px solid var(--border)', borderRadius: 100, padding: '3px 10px' }}>{yearOfStudy}</span>}
                </div>
              </div>
              <button onClick={() => fileRef.current?.click()}
                style={{ flexShrink: 0, padding: '8px 16px', background: 'rgba(18,36,28,0.06)', border: '1px solid var(--border)', borderRadius: 100, color: 'var(--light)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {uploading ? 'Uploading…' : 'Change photo'}
              </button>
            </div>

            {/* Basic Info */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                Basic Information
              </div>
              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={L}>Full name</label>
                  <input style={I} value={fullName} onChange={e => setFullName(e.target.value)} maxLength={60} placeholder="Your full name" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={L}>Email <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(sign-in email — not editable here)</span></label>
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
                  <label style={L}>Gender</label>
                  <select style={{ ...I, cursor: 'pointer' }} value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">Select…</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={L}>City / Location</label>
                  <input style={I} value={city} onChange={e => setCity(e.target.value)} placeholder="Glassboro, NJ" />
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                Academic Details
              </div>
              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={L}>University</label>
                  <UniversitySelect value={university} onChange={setUniversity} inputStyle={I} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={L}>Major / Program</label>
                  <input style={I} value={major} onChange={e => setMajor(e.target.value)} placeholder="Computer Science" />
                </div>
                <div>
                  <label style={L}>Year of Study</label>
                  <select style={{ ...I, cursor: 'pointer' }} value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
                    <option value="">Select…</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={L}>Graduation Year</label>
                  <select style={{ ...I, cursor: 'pointer' }} value={graduationYear} onChange={e => setGraduationYear(e.target.value)}>
                    <option value="">Select…</option>
                    {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                About You
              </div>
              <label style={L}>Bio <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                style={{ ...I, height: 100, padding: 12, resize: 'vertical' }}
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder="A little about yourself — your background, what you're studying, what you're looking for…"
              />
            </div>

            {/* Interests */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', marginBottom: 6, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                Interests
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>Helps you find roommates and connections with similar hobbies.</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {INTEREST_OPTIONS.map(item => (
                  <Pill key={item} label={item} active={interests.includes(item)} onClick={() => toggleInterest(item)} />
                ))}
              </div>
            </div>

            {/* Save */}
            <button onClick={save} disabled={saving}
              style={{ height: 50, background: 'var(--amber)', color: '#ffffff', border: 'none', borderRadius: 100, fontWeight: 800, fontSize: 15, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>

            {/* Sign out */}
            <button onClick={async () => { await createClient().auth.signOut(); window.location.href = '/'; }}
              style={{ height: 46, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 100, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Sign out
            </button>

            {/* Danger zone */}
            <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C25B4E', marginBottom: 6 }}>Danger Zone</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Permanently delete your account, profile, and all listings. This cannot be undone.
              </p>
              <button onClick={deleteAccount} disabled={deleting}
                style={{ height: 42, padding: '0 20px', background: 'rgba(220,38,38,0.12)', color: '#C25B4E', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 100, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>

          </div>
        )}
      </div>
    </StudentLayout>
  );
}
