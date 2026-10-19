'use client';

import { useState, useEffect } from 'react';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { createClient } from '@/lib/supabase/client';
import { deleteAccountAction } from '@/lib/actions/account';
import { BetaBadge } from '@/components/beta/BetaBadge';

const S = {
  card: { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' as const, marginBottom: 14 },
  cardHead: { padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--white)' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)' },
  rowLast: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--white)' },
  sub: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  inp: { width: '100%', height: 42, padding: '0 14px', background: 'rgba(18,36,28,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--white)', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' },
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? 'var(--amber)' : 'rgba(18,36,28,0.12)',
        position: 'relative', transition: 'background 0.2s',
      }}>
      <span style={{
        position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', left: on ? 21 : 3,
      }} />
    </button>
  );
}

const DEFAULT_NOTIF = {
  roommate_matches: true,
  messages: true,
  bookings: true,
  food_updates: true,
  community_replies: false,
  announcements: false,
};
const DEFAULT_PRIVACY = {
  show_to_providers: true,
  show_in_roommate: true,
  allow_dms: false,
};

export default function StudentSettingsPage() {
  const [notif, setNotif] = useState(DEFAULT_NOTIF);
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [curPw, setCurPw] = useState('');

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('student_profiles').select('notification_prefs,privacy_prefs').eq('user_id', user.id).single();
      if (data?.notification_prefs) setNotif(prev => ({ ...prev, ...data.notification_prefs }));
      if (data?.privacy_prefs) setPrivacy(prev => ({ ...prev, ...data.privacy_prefs }));
    })();
  }, []);

  async function saveNotifPrefs() {
    setNotifSaving(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb.from('student_profiles').upsert({ user_id: user.id, notification_prefs: notif, privacy_prefs: privacy }, { onConflict: 'user_id' });
    }
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwOk, setPwOk] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  async function changePassword() {
    setPwErr(''); setPwOk(false);
    if (!newPw) { setPwErr('Enter a new password'); return; }
    if (newPw.length < 8) { setPwErr('Password must be at least 8 characters'); return; }
    if (newPw !== confPw) { setPwErr('Passwords do not match'); return; }
    setPwSaving(true);
    const sb = createClient();
    // Re-authenticate with current password first
    const { data: { user } } = await sb.auth.getUser();
    if (user?.email && curPw) {
      const { error: signInErr } = await sb.auth.signInWithPassword({ email: user.email, password: curPw });
      if (signInErr) { setPwErr('Current password is incorrect'); setPwSaving(false); return; }
    }
    const { error } = await sb.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) { setPwErr(error.message); return; }
    setPwOk(true);
    setCurPw(''); setNewPw(''); setConfPw('');
    setTimeout(() => setPwOk(false), 3000);
  }

  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    setDeleting(true);
    const res = await deleteAccountAction();
    if (res.error) { setDeleting(false); alert(res.error); return; }
    window.location.href = '/';
  }

  return (
    <StudentLayout title="Settings">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Beta version badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
          <BetaBadge />
        </div>

        {/* Notifications */}
        <div style={S.card}>
          <div style={S.cardHead}>Notifications</div>
          {[
            { key: 'roommate_matches', l: 'Roommate matches',      s: 'When we find a match for you' },
            { key: 'messages',         l: 'Message notifications', s: 'New messages from providers' },
            { key: 'bookings',         l: 'Booking confirmations', s: 'When a booking is confirmed' },
            { key: 'food_updates',     l: 'Food delivery updates', s: 'Delivery status updates' },
            { key: 'community_replies',l: 'Community replies',     s: 'Replies to your posts' },
            { key: 'announcements',    l: 'Announcements',         s: 'Updates from Handout' },
          ].map(({ key, l, s }, i, arr) => (
            <div key={key} style={i === arr.length - 1 ? S.rowLast : S.row}>
              <div>
                <div style={S.label}>{l}</div>
                <div style={S.sub}>{s}</div>
              </div>
              <Toggle on={notif[key as keyof typeof notif]} onChange={v => setNotif(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
        </div>

        <div style={{ padding: '0 0 14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={saveNotifPrefs} disabled={notifSaving}
            style={{ padding: '8px 20px', background: notifSaved ? '#12A150' : 'var(--amber)', border: 'none', borderRadius: 100, color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .3s' }}>
            {notifSaving ? 'Saving…' : notifSaved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>

        {/* Privacy */}
        <div style={S.card}>
          <div style={S.cardHead}>Privacy</div>
          {[
            { key: 'show_to_providers', l: 'Show profile to providers', s: 'Providers can see your profile' },
            { key: 'show_in_roommate',  l: 'Show in roommate search',   s: 'Appear in roommate results' },
            { key: 'allow_dms',         l: 'Allow direct messages',     s: 'Anyone can message you' },
          ].map(({ key, l, s }, i, arr) => (
            <div key={key} style={i === arr.length - 1 ? S.rowLast : S.row}>
              <div>
                <div style={S.label}>{l}</div>
                <div style={S.sub}>{s}</div>
              </div>
              <Toggle on={privacy[key as keyof typeof privacy]} onChange={v => setPrivacy(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
        </div>

        {/* Password */}
        <div style={S.card}>
          <div style={S.cardHead}>Change Password</div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pwErr && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C25B4E' }}>{pwErr}</div>
            )}
            {pwOk && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2E7D5B' }}>Password updated ✓</div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Current password</label>
              <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="••••••••" style={S.inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>New password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" style={S.inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Confirm new password</label>
              <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="Re-enter new password" style={S.inp} />
            </div>
            <button
              onClick={changePassword}
              disabled={pwSaving}
              style={{ height: 44, background: 'var(--amber)', color: '#ffffff', border: 'none', borderRadius: 100, fontWeight: 700, fontSize: 14, cursor: pwSaving ? 'wait' : 'pointer', opacity: pwSaving ? 0.7 : 1 }}>
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#C25B4E', marginBottom: 6 }}>Danger Zone</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
            Permanently delete your account and all your data. This cannot be undone.
          </p>
          <button
            onClick={deleteAccount}
            disabled={deleting}
            style={{ height: 42, padding: '0 20px', background: 'rgba(220,38,38,0.12)', color: '#C25B4E', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 100, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
