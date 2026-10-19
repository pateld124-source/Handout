'use client';

import { useEffect, useState } from 'react';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { createClient } from '@/lib/supabase/client';

/* ── SVG notification type icons ── */
const CalIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const MsgIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const UsersIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const FoodIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const StarIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const BellIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;

const TYPE_CONFIG: Record<string, { Icon: () => React.JSX.Element; color: string; bg: string }> = {
  booking:      { Icon: CalIcon,   color: '#7C6BD1', bg: 'rgba(124,107,209,0.12)' },
  message:      { Icon: MsgIcon,   color: '#12A150', bg: 'rgba(18,161,80,0.12)'   },
  roommate:     { Icon: UsersIcon, color: '#12A150', bg: 'rgba(18,161,80,0.12)'  },
  food:         { Icon: FoodIcon,  color: '#E08A1E', bg: 'rgba(255,212,121,0.12)' },
  verification: { Icon: CheckIcon, color: '#12A150', bg: 'rgba(18,161,80,0.12)'  },
  review:       { Icon: StarIcon,  color: '#E08A1E', bg: 'rgba(255,212,121,0.12)' },
  system:       { Icon: BellIcon,  color: '#12A150', bg: 'rgba(18,161,80,0.10)'   },
  default:      { Icon: BellIcon,  color: '#7d9188', bg: 'rgba(18,36,28,0.06)' },
};

function getTypeCfg(type: string) { return TYPE_CONFIG[type] ?? TYPE_CONFIG.default; }

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const [meId, setMeId] = useState('');

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifs(data || []);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/auth/login'; return; }
      setMeId(user.id);
      await load(user.id);
      setReady(true);
    })();
  }, []);

  async function markAllRead() {
    if (!meId) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', meId).eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function markOneRead(id: string) {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <StudentLayout title="Notifications">
      <div className="page-enter" style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
            {ready ? `${unread} unread` : '—'}
          </span>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Mark all as read
            </button>
          )}
        </div>

        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {!ready ? (
            /* Skeleton rows */
            <div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 7 }} />
                    <div className="skeleton skeleton-text" style={{ width: '35%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(18,36,28,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--muted)' }}>
                <BellIcon />
              </div>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                No notifications yet. We'll ping you when something happens — bookings, messages, and more.
              </p>
            </div>
          ) : (
            <div>
              {notifs.map((n, i) => {
                const cfg = getTypeCfg(n.type);
                const { Icon } = cfg;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markOneRead(n.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 18px',
                      borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
                      background: !n.is_read ? 'rgba(18,161,80,0.04)' : 'transparent',
                      cursor: !n.is_read ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!n.is_read) (e.currentTarget as HTMLElement).style.background = 'rgba(18,161,80,0.07)'; }}
                    onMouseLeave={e => { if (!n.is_read) (e.currentTarget as HTMLElement).style.background = 'rgba(18,161,80,0.04)'; }}
                  >
                    {/* Typed icon bubble */}
                    <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}28` }}>
                      <Icon />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: n.is_read ? 'var(--muted)' : 'var(--white)', lineHeight: 1.4 }}>
                          {n.title}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                      </div>
                      {n.message && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: 5 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
