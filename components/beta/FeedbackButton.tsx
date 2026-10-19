'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ChatIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const CheckIcon = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#12A150" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

const CATEGORIES = [
  { key: 'bug',     label: 'Found a bug?',       emoji: '🐛' },
  { key: 'feature', label: 'Suggest a feature?', emoji: '💡' },
  { key: 'general', label: 'General feedback?',  emoji: '💬' },
];

export function FeedbackButton() {
  const [open, setOpen]         = useState(false);
  const [category, setCategory] = useState('general');
  const [message, setMessage]   = useState('');
  const [busy, setBusy]         = useState(false);
  const [sent, setSent]         = useState(false);
  const [err, setErr]           = useState('');

  function reset() { setCategory('general'); setMessage(''); setSent(false); setErr(''); }
  function close() { setOpen(false); setTimeout(reset, 200); }

  async function submit() {
    if (message.trim().length < 3) { setErr('Please add a little more detail.'); return; }
    setBusy(true); setErr('');
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      const { error } = await sb.from('feedback').insert({
        user_id: user?.id ?? null, category, message: message.trim(), status: 'new',
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      console.error('Feedback submit failed:', e);
      setErr('Could not send — try again.');
    }
    setBusy(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="feedback-fab" aria-label="Send feedback"
        style={{ position: 'fixed', right: 24, zIndex: 900, display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 18px', borderRadius: 100, background: '#12A150', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 8px 22px rgba(18,161,80,0.34)' }}>
        <ChatIcon /> Feedback
      </button>

      {open && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(18,36,28,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', border: '1px solid rgba(18,36,28,0.1)', borderRadius: 22, padding: '26px 24px', width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(18,36,28,0.2)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(18,161,80,0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><CheckIcon /></div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#12241C', margin: '0 0 6px' }}>Thanks for the feedback!</h3>
                <p style={{ fontSize: 13.5, color: '#7D9188', margin: '0 0 20px' }}>We read every note — it helps shape the Beta.</p>
                <button onClick={close} className="ft-btn ft-btn-p" style={{ padding: '10px 22px' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#12241C', margin: 0 }}>Send feedback</h3>
                  <button onClick={close} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D9188', padding: 2 }}><CloseIcon /></button>
                </div>
                <p style={{ fontSize: 12.5, color: '#7D9188', margin: '0 0 16px' }}>Help us improve Handout — what’s on your mind?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => setCategory(c.key)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      border: `1.5px solid ${category === c.key ? '#12A150' : 'rgba(18,36,28,0.12)'}`,
                      background: category === c.key ? 'rgba(18,161,80,0.06)' : '#fff',
                    }}>
                      <span style={{ fontSize: 17 }}>{c.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: category === c.key ? '#0F8A44' : '#12241C' }}>{c.label}</span>
                    </button>
                  ))}
                </div>

                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} maxLength={1000} placeholder="Tell us more…"
                  style={{ width: '100%', padding: '11px 14px', background: '#F1F7F3', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 10, color: '#12241C', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />

                {err && <div style={{ marginTop: 12, padding: '9px 12px', borderRadius: 10, background: 'rgba(194,91,78,0.10)', border: '1px solid rgba(194,91,78,0.3)', color: '#C25B4E', fontSize: 12.5 }}>{err}</div>}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={submit} disabled={busy} className="ft-btn ft-btn-p" style={{ flex: 1, justifyContent: 'center', height: 44, fontSize: 14 }}>{busy ? 'Sending…' : 'Send feedback'}</button>
                  <button onClick={close} className="ft-btn ft-btn-o" style={{ height: 44, padding: '0 18px', fontSize: 14 }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
