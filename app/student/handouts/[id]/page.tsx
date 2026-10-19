'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { publicStorageUrl } from '@/lib/storageUrl';

/* ── Icons ── */
const BackIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const DownloadIcon= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const EyeIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const StarFillIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const StarEmptyIcon=() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const TrashIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const EditIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const UserIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BookIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const CalIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const FileDocIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const SendIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

function fmtSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ini(name: string) {
  return (name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
}

function fileColor(type: string) {
  if (!type) return '#7d9188';
  if (type.includes('pdf'))  return '#C25B4E';
  if (type.includes('word') || type.includes('document')) return '#5B8AF0';
  if (type.includes('image')) return '#12A150';
  if (type.includes('text') || type.includes('plain')) return '#E08A1E';
  return '#7d9188';
}

const card: React.CSSProperties = {
  background: '#FFFFFF', 
  border: '1px solid rgba(18,36,28,0.09)', borderRadius: 16,
};

function StarRating({ value, onChange, readOnly }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          style={{ color: (hover || value) >= n ? '#E08A1E' : 'rgba(255,255,255,0.2)', cursor: readOnly ? 'default' : 'pointer', transition: 'color .1s' }}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(n)}>
          <StarFillIcon />
        </span>
      ))}
    </div>
  );
}

export default function HandoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [handout, setHandout]   = useState<any>(null);
  const [uploader, setUploader] = useState<any>(null);
  const [reviews, setReviews]   = useState<any[]>([]);
  const [me, setMe]             = useState<any>(null);
  const [myReview, setMyReview] = useState<any>(null);
  const [draft, setDraft]       = useState({ rating: 0, comment: '' });
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  async function loadReviews(uid: string) {
    const sb = createClient();
    const { data } = await sb.from('handout_reviews')
      .select('*, users:public_profiles(id, full_name, avatar_url)')
      .eq('handout_id', id)
      .order('created_at', { ascending: false });
    const all = data || [];
    setReviews(all);
    const mine = all.find((r: any) => r.reviewer_id === uid);
    setMyReview(mine || null);
    if (mine) setDraft({ rating: mine.rating, comment: mine.comment || '' });
  }

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: u } = await sb.from('users').select('*').eq('id', user.id).single();
      setMe(u || { id: user.id });

      const { data: h } = await sb.from('handouts').select('*').eq('id', id).single();
      if (!h) { setLoading(false); return; }
      setHandout(h);

      const [{ data: upl }] = await Promise.all([
        sb.from('public_profiles').select('id, full_name, avatar_url').eq('id', h.user_id).single(),
      ]);
      setUploader(upl);
      await loadReviews(user.id);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitReview() {
    if (!draft.rating || !me) return;
    setSaving(true);
    const sb = createClient();
    await sb.from('handout_reviews').upsert({
      handout_id: id, reviewer_id: me.id,
      rating: draft.rating, comment: draft.comment.trim() || null,
    }, { onConflict: 'handout_id,reviewer_id' });
    setSaving(false);
    setEditing(false);
    await loadReviews(me.id);
  }

  async function deleteReview() {
    if (!myReview) return;
    const sb = createClient();
    await sb.from('handout_reviews').delete().eq('id', myReview.id);
    setMyReview(null);
    setDraft({ rating: 0, comment: '' });
    await loadReviews(me.id);
  }

  if (loading) return (
    <StudentLayout title="Handout">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#7d9188', fontSize: 14 }}>Loading…</div>
    </StudentLayout>
  );

  if (!handout) return (
    <StudentLayout title="Not Found">
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: '#7d9188', fontSize: 14 }}>Handout not found or was removed.</p>
        <Link href="/student/handouts" style={{ color: '#12A150', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>← Back to Handouts</Link>
      </div>
    </StudentLayout>
  );

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const isPdf = handout.file_type?.includes('pdf') || handout.file_url?.endsWith('.pdf');
  const isImage = handout.file_type?.includes('image');
  const fileUrl = publicStorageUrl(handout.file_url, 'handouts');
  const color = fileColor(handout.file_type);
  const isOwn = me && handout.user_id === me.id;
  const uploaderName = uploader?.full_name || 'Student';

  return (
    <StudentLayout title="Handout">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 0 80px' }}>

        <Link href="/student/handouts" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7d9188', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 20 }}>
          <BackIcon /> Back to Handouts
        </Link>

        <div className="rg-side" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Preview */}
            <div style={{ ...card, overflow: 'hidden', minHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(18,36,28,0.04)' }}>
              {isImage && fileUrl ? (
                <img src={fileUrl} alt={handout.title} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }} />
              ) : isPdf && fileUrl ? (
                <iframe src={fileUrl} style={{ width: '100%', height: 440, border: 'none', display: 'block' }} title={handout.title} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, color: color }}>
                  <FileDocIcon />
                  <p style={{ margin: 0, fontSize: 13, color: '#7d9188' }}>{handout.file_type?.split('/').pop()?.toUpperCase() || 'FILE'}</p>
                </div>
              )}
            </div>

            {/* Info card */}
            <div style={{ ...card, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  {handout.subject_code && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: `${color}18`, color, border: `1px solid ${color}30`, marginRight: 8 }}>{handout.subject_code}</span>
                  )}
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#12241C', margin: '8px 0 4px', letterSpacing: -0.5 }}>{handout.title}</h1>
                  {handout.course && (
                    <p style={{ margin: 0, fontSize: 13, color: '#7d9188', display: 'flex', alignItems: 'center', gap: 5 }}><BookIcon /> {handout.course}</p>
                  )}
                </div>
                {reviews.length > 0 && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#E08A1E', lineHeight: 1 }}>{avgRating.toFixed(1)}</p>
                    <StarRating value={Math.round(avgRating)} readOnly />
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7d9188' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#7d9188', paddingTop: 12, borderTop: '1px solid rgba(18,36,28,0.07)' }}>
                {uploader && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><UserIcon /> {uploaderName}</span>}
                {handout.created_at && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CalIcon /> {new Date(handout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                {handout.file_size && <span style={{ color: '#7d9188' }}>{fmtSize(handout.file_size)}</span>}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#7d9188', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Reviews</p>

              {/* My review / review form */}
              {!isOwn && (
                <div style={{ ...card, padding: '16px 18px', marginBottom: 12 }}>
                  {myReview && !editing ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#12A150' }}>Your review</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: '#7d9188', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><EditIcon /></button>
                          <button onClick={deleteReview} style={{ background: 'none', border: 'none', color: '#7d9188', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#C25B4E')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#7d9188')}><TrashIcon /></button>
                        </div>
                      </div>
                      <StarRating value={myReview.rating} readOnly />
                      {myReview.comment && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#4c6157', lineHeight: 1.6 }}>{myReview.comment}</p>}
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#7d9188' }}>{myReview ? 'Edit your review' : 'Rate this handout'}</p>
                      <StarRating value={draft.rating} onChange={v => setDraft(d => ({ ...d, rating: v }))} />
                      <textarea
                        value={draft.comment}
                        onChange={e => setDraft(d => ({ ...d, comment: e.target.value }))}
                        placeholder="Write a comment (optional)…"
                        rows={3}
                        style={{ width: '100%', marginTop: 10, padding: '10px 12px', boxSizing: 'border-box', background: 'rgba(18,36,28,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, color: '#12241C', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                        {editing && <button onClick={() => setEditing(false)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(18,36,28,0.12)', background: 'transparent', color: '#7d9188', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>}
                        <button onClick={submitReview} disabled={!draft.rating || saving}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, border: 'none', background: draft.rating ? '#12A150' : 'rgba(18,36,28,0.09)', color: draft.rating ? '#ffffff' : '#7d9188', fontSize: 12, fontWeight: 700, cursor: draft.rating ? 'pointer' : 'default' }}>
                          <SendIcon /> {saving ? 'Saving…' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {reviews.filter(r => !me || r.reviewer_id !== me.id).length === 0 && !(!isOwn && !myReview) ? (
                <div style={{ ...card, padding: '28px 24px', textAlign: 'center' }}>
                  <p style={{ color: '#7d9188', fontSize: 14, margin: 0 }}>No reviews yet.</p>
                </div>
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.filter(r => !me || r.reviewer_id !== me.id).map(r => {
                  const rName = r.users?.full_name || 'Student';
                  return (
                    <div key={r.id} style={{ ...card, padding: '14px 18px', display: 'flex', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#5A4BB8,#12A150)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#ffffff', flexShrink: 0 }}>
                        {r.users?.avatar_url ? <img src={r.users.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : ini(rName)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#12241C' }}>{rName}</span>
                          <StarRating value={r.rating} readOnly />
                          <span style={{ fontSize: 11, color: '#7d9188', marginLeft: 'auto' }}>{timeAgo(r.created_at)}</span>
                        </div>
                        {r.comment && <p style={{ margin: 0, fontSize: 13, color: '#4c6157', lineHeight: 1.6 }}>{r.comment}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — sticky action card */}
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...card, padding: '20px 22px' }}>
              <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 800, color: '#7d9188', textTransform: 'uppercase', letterSpacing: 1 }}>Actions</p>

              {fileUrl ? (
                <>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, background: '#12A150', color: '#ffffff', fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 10 }}>
                    <EyeIcon /> Preview
                  </a>
                  <a href={fileUrl} download
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, border: '1px solid rgba(18,36,28,0.12)', background: 'rgba(18,36,28,0.04)', color: '#12241C', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    <DownloadIcon /> Download
                  </a>
                </>
              ) : (
                <div style={{ padding: 14, background: 'rgba(18,36,28,0.04)', borderRadius: 10, fontSize: 13, color: '#7d9188', textAlign: 'center' }}>File not available</div>
              )}
            </div>

            {/* File details */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 800, color: '#7d9188', textTransform: 'uppercase', letterSpacing: 1 }}>File Info</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Type', value: (handout.file_type || 'Unknown').split('/').pop()?.toUpperCase() },
                  { label: 'Size', value: handout.file_size ? fmtSize(handout.file_size) : '—' },
                  { label: 'Course', value: handout.course || '—' },
                  { label: 'Code', value: handout.subject_code || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#7d9188' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#4c6157' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div style={{ ...card, padding: '16px 18px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 800, color: '#7d9188', textTransform: 'uppercase', letterSpacing: 1 }}>Rating</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#E08A1E', lineHeight: 1 }}>{avgRating.toFixed(1)}</span>
                  <div>
                    <StarRating value={Math.round(avgRating)} readOnly />
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7d9188' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {/* Distribution bars */}
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[5,4,3,2,1].map(n => {
                    const count = reviews.filter(r => r.rating === n).length;
                    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: '#7d9188', width: 8 }}>{n}</span>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(18,36,28,0.09)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#E08A1E', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#7d9188', width: 24, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Uploader message */}
            {!isOwn && uploader && (
              <Link href={`/student/messages?to=${uploader.id}&name=${encodeURIComponent(uploaderName)}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 12, border: '1px solid rgba(18,161,80,0.3)', background: 'rgba(18,161,80,0.06)', color: '#12A150', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                Message uploader
              </Link>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
