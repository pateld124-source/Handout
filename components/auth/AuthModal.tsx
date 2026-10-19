'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  validateName, validateEmail, validateEduEmail, validatePhone, validatePassword,
  validateRequired, normalizePhone, formatPhone, passwordChecks,
} from '@/lib/validation';
import { APPLE_SIGNIN_ENABLED } from '@/config/features';

const CapAMIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const BriefAMIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const MailAMIcon  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;

type Mode = 'signup' | 'login';

/* ─────────────────────────────────────────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────────────────────────────────────────── */
export function AuthModal({
  open, mode, reason, onClose, onSuccess, setMode,
}: {
  open: boolean;
  mode: Mode;
  reason?: string;
  onClose: () => void;
  onSuccess: (user: any) => void;
  setMode: (m: Mode) => void;
}) {
  const [role,     setRole]     = useState<'student' | 'vendor'>('student');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [touched,  setTouched]  = useState<Record<string, boolean>>({});

  // OTP step (internal — not exposed to parent)
  const [otpStep,       setOtpStep]       = useState(false);
  const [pendingEmail,  setPendingEmail]  = useState('');
  const [pendingUserId, setPendingUserId] = useState('');

  // Reset OTP step when modal is closed or mode switches externally
  useEffect(() => { if (!open) { setOtpStep(false); setError(''); } }, [open]);
  useEffect(() => { setOtpStep(false); setError(''); }, [mode]);

  if (!open) return null;

  const isSignup = mode === 'signup';
  const e = {
    name:     isSignup ? validateName(name)                    : '',
    email:    (isSignup && role === 'student') ? validateEduEmail(email) : validateEmail(email),
    phone:    isSignup ? validatePhone(phone)                  : '',
    password: isSignup ? validatePassword(password)            : validateRequired(password, 'Password'),
  };
  const pc = passwordChecks(password);
  const t = (k: string) => setTouched(s => ({ ...s, [k]: true }));

  /* ── SUBMIT (signup / login) ── */
  async function submit() {
    setError('');
    setTouched({ name: true, email: true, phone: true, password: true });
    const firstErr = e.name || e.email || e.phone || e.password;
    if (firstErr) { setError(firstErr); return; }

    setLoading(true);
    const supabase = createClient();

    if (isSignup) {
      // Block duplicate accounts by phone number (email uniqueness is already
      // enforced by Supabase auth itself).
      const rawPhoneCheck = normalizePhone(phone);
      if (rawPhoneCheck) {
        const { data: taken } = await supabase.rpc('phone_number_taken', { p_phone: rawPhoneCheck });
        if (taken) { setError('An account already exists with this phone number.'); setLoading(false); return; }
      }

      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: name.trim(), role, phone } },
      });
      if (err) { setError(err.message); setLoading(false); return; }
      if (!data.user) { setError('Could not create account. Try again.'); setLoading(false); return; }

      if (data.session) {
        // Email confirmation is OFF in Supabase — user is in directly
        // Profile update needs a session (RLS: auth.uid() = id). onSuccess navigates away, so report via alert.
        const { error: profileErr } = await supabase.from('users').update({ full_name: name.trim(), phone, role }).eq('id', data.user.id);
        if (profileErr) {
          console.error('Profile update after sign-up failed:', profileErr);
          alert('Your account was created, but we could not save your profile details. You can update them in your profile.');
        }
        onSuccess(data.user);
      } else {
        // Email confirmation is ON — show OTP verification screen
        setPendingEmail(email.trim().toLowerCase());
        setPendingUserId(data.user.id);
        setOtpStep(true);
      }
      setLoading(false);
      return;
    }

    // LOGIN
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    if (err) {
      // If email not confirmed, prompt OTP
      if (err.message.toLowerCase().includes('email not confirmed')) {
        setPendingEmail(email.trim().toLowerCase());
        setOtpStep(true);
        setLoading(false);
        return;
      }
      setError(err.message.toLowerCase().includes('invalid') ? 'Wrong email or password.' : err.message);
      setLoading(false);
      return;
    }
    if (data.user) onSuccess(data.user);
    setLoading(false);
  }

  /* ── OTP VERIFIED ── */
  function handleOtpSuccess(user: any) {
    setOtpStep(false);
    onSuccess(user);
  }

  /* ── OTP SCREEN ── */
  if (otpStep) {
    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-card" onClick={ev => ev.stopPropagation()}>
          <ModalHeader onClose={onClose} />
          <OtpScreen
            email={pendingEmail}
            onSuccess={handleOtpSuccess}
            onBack={() => { setOtpStep(false); setError(''); }}
          />
        </div>
      </div>
    );
  }

  /* ── MAIN FORM ── */
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={ev => ev.stopPropagation()}>
        <ModalHeader onClose={onClose} />

        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
          {isSignup ? 'Create your free account' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--light)', marginTop: 6, lineHeight: 1.5 }}>
          {reason || (isSignup ? 'Join to message hosts, book, and post listings.' : 'Log in to continue.')}
        </p>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'rgba(18,36,28,0.05)', borderRadius: 12, padding: 4, margin: '18px 0' }}>
          {(['login', 'signup'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{ flex: 1, height: 34, borderRadius: 9, fontSize: 13, fontWeight: 700,
                background: mode === m ? 'var(--navy3)' : 'transparent',
                color:      mode === m ? '#fff' : 'var(--muted)' }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {error && <ErrorBanner msg={error} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isSignup && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['student', 'vendor'] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  style={{ border: `2px solid ${role === r ? '#12A150' : 'rgba(18,36,28,0.12)'}`, background: role === r ? 'rgba(18,161,80,0.10)' : 'transparent', borderRadius: 12, padding: '10px', fontSize: 13, fontWeight: 700 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>{r === 'student' ? <><CapAMIcon /> Student</> : <><BriefAMIcon /> Vendor</>}</span>
                </button>
              ))}
            </div>
          )}

          {isSignup && (
            <Field label="Full name" err={touched.name ? e.name : ''}>
              <input className={`fld-input ${touched.name && e.name ? 'err' : ''}`}
                value={name} placeholder="First and last name" disabled={loading}
                onChange={ev => setName(ev.target.value)} onBlur={() => t('name')} />
            </Field>
          )}

          <Field label="Email" err={touched.email ? e.email : ''}>
            <input className={`fld-input ${touched.email && e.email ? 'err' : ''}`}
              type="email" inputMode="email" value={email}
              placeholder="you@university.edu" disabled={loading}
              onChange={ev => setEmail(ev.target.value)} onBlur={() => t('email')} />
          </Field>

          {isSignup && (
            <Field label="Phone number" err={touched.phone ? e.phone : ''}>
              <input className={`fld-input ${touched.phone && e.phone ? 'err' : ''}`}
                type="tel" inputMode="numeric" value={formatPhone(phone)}
                placeholder="(555) 123-4567" maxLength={20} disabled={loading}
                onChange={ev => setPhone(normalizePhone(ev.target.value))} onBlur={() => t('phone')} />
            </Field>
          )}

          <Field label="Password" err={touched.password ? e.password : ''}>
            <div style={{ position: 'relative' }}>
              <input className={`fld-input ${touched.password && e.password ? 'err' : ''}`}
                type={showPw ? 'text' : 'password'} value={password}
                placeholder="••••••••" style={{ paddingRight: 58 }} disabled={loading}
                onChange={ev => setPassword(ev.target.value)} onBlur={() => t('password')} />
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {isSignup && password.length > 0 && (
              <div className="fld-checks">
                <Chk ok={pc.length} t="8+ chars" /><Chk ok={pc.upper} t="1 uppercase" />
                <Chk ok={pc.lower} t="1 lowercase" /><Chk ok={pc.number} t="1 number" />
              </div>
            )}
          </Field>

          <button className="btn-cyan" type="button" onClick={submit} disabled={loading}
            style={{ height: 48, fontSize: 15, marginTop: 4, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Please wait…' : isSignup ? 'Create account →' : 'Log in →'}
          </button>
        </div>

        {/* Social divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 4px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <OAuthButton provider="google" label={isSignup ? 'Sign up with Google' : 'Log in with Google'} />
          {/* Apple — hidden until Apple Developer / Supabase setup is done (APPLE_SIGNIN_ENABLED) */}
          {APPLE_SIGNIN_ENABLED && (
            <OAuthButton provider="apple" label={isSignup ? 'Sign up with Apple' : 'Log in with Apple'} />
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', marginTop: 16 }}>
          {isSignup ? 'Already have an account? ' : 'New to Handout? '}
          <button onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}
            style={{ color: '#12A150', fontWeight: 600 }}>
            {isSignup ? 'Log in' : 'Sign up free'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OTP SCREEN — 6-digit email verification
───────────────────────────────────────────────────────────────────────────── */
function OtpScreen({ email, onSuccess, onBack }: {
  email: string;
  onSuccess: (user: any) => void;
  onBack: () => void;
}) {
  const LEN = 6;
  const [digits,   setDigits]   = useState<string[]>(Array(LEN).fill(''));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first box
  useEffect(() => { refs.current[0]?.focus(); }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* Focus helpers */
  const focusAt = (i: number) => refs.current[Math.min(Math.max(i, 0), LEN - 1)]?.focus();

  /* Single box key handler */
  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        // Clear current
        const next = [...digits]; next[i] = ''; setDigits(next);
      } else {
        // Clear previous
        const next = [...digits]; next[Math.max(i - 1, 0)] = ''; setDigits(next);
        focusAt(i - 1);
      }
      return;
    }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); focusAt(i - 1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); focusAt(i + 1); return; }
  }

  /* Single box input */
  function handleInput(ev: React.ChangeEvent<HTMLInputElement>, i: number) {
    const val = ev.target.value.replace(/\D/g, '');
    if (!val) return;
    if (val.length > 1) {
      // Paste into single box — distribute
      handlePaste(val, i);
      return;
    }
    const next = [...digits];
    next[i] = val[0];
    setDigits(next);
    setError('');
    if (i < LEN - 1) focusAt(i + 1);
    else {
      // Auto-submit when last digit is entered
      const code = [...next].join('');
      if (code.length === LEN) verifyOtp(code);
    }
  }

  /* Paste handler (on any box) */
  function handlePaste(raw: string, startAt = 0) {
    const nums = raw.replace(/\D/g, '').slice(0, LEN);
    if (!nums) return;
    const next = [...digits];
    for (let i = 0; i < nums.length && startAt + i < LEN; i++) {
      next[startAt + i] = nums[i];
    }
    setDigits(next);
    setError('');
    const filled = startAt + nums.length;
    focusAt(Math.min(filled, LEN - 1));
    // Auto-submit if all filled
    if (next.filter(Boolean).length === LEN) verifyOtp(next.join(''));
  }

  function onPasteEvent(ev: React.ClipboardEvent<HTMLInputElement>, i: number) {
    ev.preventDefault();
    handlePaste(ev.clipboardData.getData('text'), i);
  }

  /* Verify OTP with Supabase */
  async function verifyOtp(token?: string) {
    const code = token ?? digits.join('');
    if (code.length < LEN) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    if (err) {
      // Supabase may return "Token has expired" or "OTP expired"
      setError(err.message.includes('expired') ? 'Code expired — request a new one below.' : 'Incorrect code. Please try again.');
      setDigits(Array(LEN).fill(''));
      setTimeout(() => refs.current[0]?.focus(), 50);
      setLoading(false);
      return;
    }
    if (data.user) onSuccess(data.user);
    setLoading(false);
  }

  /* Resend OTP */
  async function resend() {
    if (cooldown > 0) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const { error: err } = await createClient().auth.resend({ type: 'signup', email });
    setLoading(false);
    if (err) { setError('Could not resend. Try again in a moment.'); return; }
    setSuccess('New code sent — check your inbox.');
    setCooldown(60);
    setDigits(Array(LEN).fill(''));
    setTimeout(() => refs.current[0]?.focus(), 50);
  }

  const code = digits.join('');

  return (
    <>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13, marginBottom: 20, background: 'none', cursor: 'pointer', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        ← Back
      </button>

      {/* Icon */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(18,161,80,0.10)', border: '1px solid rgba(18,161,80,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--amber)' }}>
          <MailAMIcon />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>Check your email</h2>
        <p style={{ fontSize: 13.5, color: 'var(--light)', lineHeight: 1.6 }}>
          We sent a 6-digit code to<br />
          <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{email}</span>
        </p>
      </div>

      {/* Error / success */}
      {error   && <ErrorBanner msg={error} />}
      {success && <div style={{ background: 'rgba(18,161,80,0.10)', border: '1px solid rgba(18,161,80,0.28)', color: '#12A150', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{success}</div>}

      {/* 6-digit boxes */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '8px 0 24px' }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={d}
            disabled={loading}
            onChange={ev => handleInput(ev, i)}
            onKeyDown={ev => handleKey(ev, i)}
            onPaste={ev => onPasteEvent(ev, i)}
            onFocus={ev => ev.target.select()}
            style={{
              width: 46, height: 56,
              textAlign: 'center',
              fontSize: 22, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif",
              background: d ? 'rgba(18,161,80,0.08)' : 'rgba(18,36,28,0.04)',
              border: `2px solid ${d ? 'rgba(18,161,80,0.45)' : 'rgba(18,36,28,0.12)'}`,
              borderRadius: 12,
              color: 'var(--white)',
              outline: 'none',
              caretColor: 'transparent',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onFocusCapture={ev => {
              (ev.target as HTMLInputElement).style.borderColor = 'var(--amber)';
              (ev.target as HTMLInputElement).style.boxShadow  = '0 0 0 3px rgba(18,161,80,0.14)';
            }}
            onBlurCapture={ev => {
              (ev.target as HTMLInputElement).style.borderColor = d ? 'rgba(18,161,80,0.45)' : 'rgba(18,36,28,0.12)';
              (ev.target as HTMLInputElement).style.boxShadow  = 'none';
            }}
          />
        ))}
      </div>

      {/* Verify button */}
      <button
        className="btn-cyan"
        type="button"
        onClick={() => verifyOtp()}
        disabled={loading || code.length < LEN}
        style={{ width: '100%', height: 48, fontSize: 15, opacity: (loading || code.length < LEN) ? 0.55 : 1 }}
      >
        {loading ? 'Verifying…' : 'Verify email →'}
      </button>

      {/* Resend */}
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 20 }}>
        Didn&apos;t get the code?{' '}
        {cooldown > 0
          ? <span style={{ color: 'var(--muted)' }}>Resend in {cooldown}s</span>
          : <button onClick={resend} disabled={loading} style={{ color: '#12A150', fontWeight: 600, background: 'none', cursor: 'pointer', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 13 }}>Resend code</button>
        }
      </p>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
        Check your spam folder if it doesn&apos;t arrive within a minute.
      </p>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */
function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#12A150', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#ffffff', fontSize: 18 }}>H</div>
        <span style={{ fontWeight: 800, fontSize: 18 }}>Handout</span>
      </div>
      <button onClick={onClose} aria-label="Close" style={{ color: 'var(--muted)', fontSize: 22, lineHeight: 1, background: 'none', cursor: 'pointer' }}>✕</button>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'rgba(194,91,78,0.10)', border: '1px solid rgba(194,91,78,0.3)', color: '#C25B4E', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>
      {msg}
    </div>
  );
}

function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <div className="fld">
      <label className="fld-label">{label}</label>
      {children}
      {err && <div className="fld-err">{err}</div>}
    </div>
  );
}

function Chk({ ok, t }: { ok: boolean; t: string }) {
  return <span className={`fld-check ${ok ? 'ok' : ''}`}>{ok ? '✓' : '○'} {t}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   OAUTH BUTTON
───────────────────────────────────────────────────────────────────────────── */
function OAuthButton({ provider, label }: { provider: 'google' | 'apple'; label: string }) {
  const [busy, setBusy] = useState(false);
  const isGoogle = provider === 'google';

  async function handleClick() {
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/student/dashboard`;
    await createClient().auth.signInWithOAuth({ provider, options: { redirectTo } });
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', height: 46, borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
        border: '1px solid rgba(255,255,255,0.14)',
        background: isGoogle ? '#fff' : '#000',
        color: isGoogle ? '#111' : '#fff',
        transition: 'opacity 0.2s, box-shadow 0.2s, transform 0.15s',
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}
      onMouseEnter={e => { if (!busy) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = isGoogle ? '0 4px 20px rgba(18,36,28,0.12)' : '0 4px 20px rgba(0,0,0,0.5)'; el.style.transform = 'translateY(-1px)'; }}}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = ''; el.style.transform = ''; }}
    >
      {isGoogle ? <GoogleIcon /> : <AppleIcon />}
      {busy ? 'Redirecting…' : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46.3 794.6 0 683.3 0 577.8 0 443.6 78.4 327 159.4 263.8c61.6-48.2 155.5-83.5 245.8-83.5 97.8 0 165.4 39.5 221.8 39.5 53.9 0 137.6-41.5 220.7-41.5 28.8 0 108.2 2.6 168.5 65.5zm-137.2-195c35.2-42.2 60.2-101.5 60.2-160.9 0-8.3-.6-16.7-2-24.4-57.2 2-124.8 38.1-165.9 85.9-32.1 36.8-61.6 96.1-61.6 156.4 0 9 1.3 17.9 2 20.5 3.5.7 9 1.3 14.5 1.3 51.6 0 115.1-33.9 152.8-78.8z"/>
    </svg>
  );
}
