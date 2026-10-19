'use client';

import { useEffect, useState } from 'react';

const BUILD = 'v5-cookieapi';

type Row = { name: string; ok: boolean | null; detail: string };

export function DebugChecks() {
  const [rows, setRows] = useState<Row[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const out: Row[] = [];
      const push = (r: Row) => out.push(r);

      // 1. Env vars (these are inlined at build time)
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      push({
        name: 'Env vars present',
        ok: !!(url && key),
        detail: url ? `URL: ${url}` : 'NEXT_PUBLIC_SUPABASE_URL missing',
      });

      // 2. Auth cookie present in the browser?
      const cookieStr = typeof document !== 'undefined' ? document.cookie : '';
      const hasAuthCookie = /sb-[a-z0-9]+-auth-token/.test(cookieStr);
      push({
        name: 'Auth COOKIE in browser',
        ok: hasAuthCookie,
        detail: hasAuthCookie
          ? 'Found sb-…-auth-token cookie (good — middleware can see this)'
          : 'No sb-…-auth-token cookie. If you just logged in, the cookie is NOT being set.',
      });

      // 3. Legacy localStorage session? (should be gone)
      let legacy = '';
      try {
        const keys = Object.keys(window.localStorage);
        legacy = keys.filter(k => k === 'handout-auth' || k.startsWith('sb-') || k.includes('supabase')).join(', ');
      } catch {}
      push({
        name: 'Legacy localStorage session',
        ok: !legacy,
        detail: legacy ? `Still present: ${legacy} (old code is running!)` : 'None (clean)',
      });

      // 4. Browser client getUser()
      let userId = '';
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        userId = data?.user?.id || '';
        push({
          name: 'Browser session (getUser)',
          ok: !!data?.user && !error,
          detail: error ? `Error: ${error.message}` : data?.user ? `Logged in as ${data.user.email}` : 'No session — not logged in',
        });

        // 5. Read own users row (role + verification)
        if (data?.user) {
          const { data: u, error: uErr } = await supabase
            .from('users')
            .select('role, verification_status, full_name')
            .eq('id', data.user.id)
            .single();
          push({
            name: 'Read users table (RLS)',
            ok: !uErr && !!u,
            detail: uErr ? `Error: ${uErr.message}` : `role=${u?.role}, verification=${u?.verification_status}, name=${u?.full_name}`,
          });
        }
      } catch (e: any) {
        push({ name: 'Browser session (getUser)', ok: false, detail: `Threw: ${e?.message}` });
      }

      setRows(out);
      setDone(true);
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F1F7F3', color: '#12241C', padding: '40px 24px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>🔧 Handout Diagnostics</h1>
        <p style={{ color: '#12A150', fontWeight: 700, marginBottom: 24, fontFamily: 'monospace' }}>
          BUILD: {BUILD} &nbsp;·&nbsp; {done ? 'tests complete' : 'running tests…'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((c, i) => (
            <div key={i} style={{
              background: c.ok ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
              border: `1px solid ${c.ok ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.4)'}`,
              borderRadius: 12, padding: '14px 18px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {c.ok ? '✅' : '❌'} {c.name}
              </div>
              <div style={{ fontSize: 13, color: '#4c6157', fontFamily: 'monospace', wordBreak: 'break-all' }}>{c.detail}</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 28, fontSize: 13, color: '#7d9188' }}>
          Take a screenshot of this whole page and send it. It tells us exactly what's wrong.
        </p>
      </div>
    </div>
  );
}
