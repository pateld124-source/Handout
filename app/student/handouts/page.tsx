'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { validateText, validateParagraph } from '@/lib/validation';
import { publicStorageUrl } from '@/lib/storageUrl';

/* ── SVG file type icons ── */
const PdfIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const DocIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const SlidesIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const SheetIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>;
const ImgFileIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const GenFileIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
/* Other handout-page icons */
const SearchHdIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const AllHdIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const MyHdIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const UploadHdIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const SuccessHdIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const EmptyHdIcon  = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const WarnHdIcon   = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const DeleteHdIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const StarFillIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const StarOutIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

function FileIcon({ type }: { type?: string | null }) {
  if (!type) return <GenFileIcon />;
  if (type.includes('pdf'))        return <PdfIcon />;
  if (type.includes('word') || type.includes('document')) return <DocIcon />;
  if (type.includes('presentation') || type.includes('powerpoint')) return <SlidesIcon />;
  if (type.includes('sheet') || type.includes('excel'))   return <SheetIcon />;
  if (type.startsWith('image/'))   return <ImgFileIcon />;
  return <GenFileIcon />;
}

/* ── helpers ─────────────────────────────────────────── */
function fileIcon(_type?: string | null) { return ''; } // legacy — replaced by <FileIcon />
function fileColor(type?: string | null) {
  if (!type) return '#5A4BB8';
  if (type.includes('pdf'))        return '#C25B4E';
  if (type.includes('word') || type.includes('document')) return '#2E7D5B';
  if (type.includes('presentation') || type.includes('powerpoint')) return '#FF9F43';
  if (type.includes('sheet') || type.includes('excel'))   return '#12A150';
  if (type.startsWith('image/'))   return '#7C6BD1';
  return '#12A150';
}
function fmtSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── shared styles ───────────────────────────────────── */
const MODAL_WRAP: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' };
const MODAL_INP: React.CSSProperties  = { width:'100%', height:44, padding:'0 14px', background:'rgba(18,36,28,0.05)', border:'1px solid rgba(18,36,28,0.12)', borderRadius:10, color:'#12241C', fontSize:14, outline:'none', boxSizing:'border-box' };

/* ── course color mapping ─────────────────────────────── */
const COURSE_COLORS = ['#12A150', '#7C6BD1', '#12A150', '#FF9F43', '#C25B4E', '#2E7D5B', '#E08A1E'];
const courseColor = (() => {
  const cache: Record<string, string> = {};
  let i = 0;
  return (course: string) => {
    const key = course.toLowerCase().trim();
    if (!cache[key]) { cache[key] = COURSE_COLORS[i % COURSE_COLORS.length]; i++; }
    return cache[key];
  };
})();

/* ── star display helper ─────────────────────────────── */
function StarBar({ avg, count, size = 13 }: { avg: number; count: number; size?: number }) {
  if (!count) return null;
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ display:'inline-flex', gap:1 }}>
        {[1,2,3,4,5].map(s => (
          <span key={s} style={{ opacity: s <= full ? 1 : s === full + 1 && half ? 0.5 : 0.22, color:'#E08A1E', display:'inline-flex' }}>
            <StarFillIcon />
          </span>
        ))}
      </span>
      <span style={{ fontSize: size - 1, color: '#E08A1E', fontWeight: 700 }}>{avg.toFixed(1)}</span>
      <span style={{ fontSize: size - 2, color: '#7d9188' }}>({count})</span>
    </span>
  );
}

/* ── skeleton loader ─────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', gap: 16, alignItems: 'center', opacity: 1 - n * 0.1 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(18,36,28,0.06)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '60%', height: 14, borderRadius: 6, background: 'rgba(18,36,28,0.06)' }} />
            <div style={{ width: '35%', height: 11, borderRadius: 6, background: 'rgba(18,36,28,0.04)' }} />
          </div>
          <div style={{ width: 90, height: 36, borderRadius: 100, background: 'rgba(18,36,28,0.04)' }} />
        </div>
      ))}
    </div>
  );
}

/* ── review modal ────────────────────────────────────── */
function ReviewModal({
  handout, meId, mine, allReviews, reviewNames, onClose, onReviewed,
}: {
  handout: any;
  meId: string;
  mine: any | null;
  allReviews: any[];
  reviewNames: Record<string, string>;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [rating, setRating] = useState(mine?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(mine?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const others = allReviews.filter(r => r.handout_id === handout.id && r.user_id !== meId);

  async function submit() {
    if (!rating) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('handout_reviews').upsert({
      handout_id: handout.id,
      user_id: meId,
      rating,
      comment: comment.trim() || null,
    }, { onConflict: 'handout_id,user_id' });
    if (error) { alert('Could not save review: ' + error.message); setSubmitting(false); return; }
    onReviewed();
    onClose();
  }

  async function deleteReview() {
    if (!mine) return;
    if (!confirm('Remove your review?')) return;
    const supabase = createClient();
    await supabase.from('handout_reviews').delete().eq('id', mine.id);
    onReviewed();
    onClose();
  }

  const active = hovered || rating;

  return (
    <div style={MODAL_WRAP} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.12)', borderRadius:22, width:'100%', maxWidth:480, padding:28, margin:'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#12241C', marginBottom: 4 }}>
              {mine ? 'Edit your review' : 'Leave a review'}
            </h2>
            <p style={{ fontSize: 12, color: '#7d9188' }}>{handout.title}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(18,36,28,0.12)', background: 'transparent', color: '#7d9188', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>×</button>
        </div>

        {/* Star selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4c6157', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>Your rating *</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  width: 44, height: 44, borderRadius: 10, border: `2px solid ${s <= active ? '#E08A1E' : 'rgba(18,36,28,0.09)'}`,
                  background: s <= active ? 'rgba(255,212,121,0.12)' : 'transparent',
                  fontSize: 24, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.1s',
                }}>
                {s <= active ? <StarFillIcon /> : <StarOutIcon />}
              </button>
            ))}
            {rating > 0 && (
              <span style={{ fontSize: 13, color: '#E08A1E', fontWeight: 700, alignSelf: 'center', marginLeft: 4 }}>
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4c6157', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Comment <span style={{ fontWeight: 400, opacity: 0.6, textTransform: 'none' }}>(optional)</span>
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Was this helpful? What was covered?"
            rows={3}
            style={{ ...MODAL_INP, height: 'auto', padding: '10px 14px', resize: 'vertical', fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1.5 }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {mine && (
            <button onClick={deleteReview}
              style={{ height: 44, padding: '0 18px', borderRadius: 100, border: '1px solid rgba(194,91,78,0.3)', background: 'transparent', color: '#C25B4E', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Remove
            </button>
          )}
          <button onClick={submit} disabled={!rating || submitting}
            style={{ flex: 1, height: 44, borderRadius: 100, border: 'none', background: rating ? '#12A150' : 'rgba(18,36,28,0.09)', color: rating ? '#ffffff' : '#7d9188', fontSize: 14, fontWeight: 800, cursor: rating && !submitting ? 'pointer' : 'default', transition: 'all 0.15s' }}>
            {submitting ? 'Saving…' : mine ? 'Update review' : 'Submit review'}
          </button>
        </div>

        {/* Others' reviews */}
        {others.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(18,36,28,0.09)', paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4c6157', marginBottom: 12 }}>
              {others.length} other review{others.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
              {others.map(r => (
                <div key={r.id} style={{ background: 'rgba(18,36,28,0.04)', border: '1px solid rgba(18,36,28,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: r.comment ? 6 : 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#12241C' }}>{reviewNames[r.user_id] || 'Student'}</span>
                    <span style={{ display:'inline-flex', gap:1, color:'#E08A1E' }}>{Array.from({ length: r.rating }).map((_, i) => <StarFillIcon key={i} />)}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 12, color: '#7d9188', margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── upload modal ────────────────────────────────────── */
function UploadModal({ me, onClose, onUploaded }: { me: any; onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [desc, setDesc] = useState('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle'|'uploading'|'done'|'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ACCEPTED = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt';

  function pickFile(f: File) {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  function simulate(to: number, speed = 40) {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(p => { if (p >= to) { clearInterval(progressRef.current!); return to; } return p + 1; });
    }, speed);
  }

  async function upload() {
    if (!file || !title.trim() || !course.trim()) return;
    // Validate text fields (letters/numbers + length limits)
    const tErr = validateText(title, 'Title', { min: 3, max: 80 });
    const cErr = validateText(course, 'Course', { min: 2, max: 40 });
    const sErr = subjectCode.trim() ? validateText(subjectCode, 'Subject code', { min: 2, max: 20, required: false }) : '';
    const dErr = validateParagraph(desc, 'Description', { max: 500 });
    if (tErr || cErr || sErr || dErr) { setPhase('error'); setErrMsg(tErr || cErr || sErr || dErr); return; }
    setPhase('uploading'); setProgress(0); setErrMsg('');
    simulate(90, 25);
    const supabase = createClient();
    const path = `${me.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
    const { error: upErr } = await supabase.storage.from('handouts').upload(path, file);
    if (upErr) {
      clearInterval(progressRef.current!);
      setPhase('error'); setErrMsg('Upload failed: ' + upErr.message); return;
    }
    const { data: pub } = supabase.storage.from('handouts').getPublicUrl(path);
    const { error: dbErr } = await supabase.from('handouts').insert({
      user_id: me.id,
      title: title.trim(),
      course: course.trim(),
      subject_code: subjectCode.trim() || null,
      description: desc.trim() || null,
      file_url: pub.publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      university: me.university || null,
    });
    if (dbErr) {
      clearInterval(progressRef.current!);
      setPhase('error'); setErrMsg('Could not save: ' + dbErr.message); return;
    }
    simulate(100, 12);
    setTimeout(() => { setPhase('done'); }, 800);
  }

  const canUpload = !!file && title.trim().length > 0 && course.trim().length > 0;

  const L: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#4c6157', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' as const };

  return (
    <div style={MODAL_WRAP} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.12)', borderRadius:22, width:'100%', maxWidth:500, padding:28, margin:'auto' }}>

        {phase === 'done' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ marginBottom: 12, color: '#12A150', display: 'inline-flex' }}><SuccessHdIcon /></div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#12241C', marginBottom: 8 }}>Handout uploaded!</h3>
            <p style={{ fontSize: 14, color: '#7d9188', marginBottom: 24 }}>"{title}" is now available to all students.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setFile(null); setTitle(''); setCourse(''); setSubjectCode(''); setDesc(''); setProgress(0); setPhase('idle'); }}
                style={{ height: 42, padding: '0 20px', borderRadius: 100, border: '1px solid rgba(18,36,28,0.12)', background: 'transparent', color: '#4c6157', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Upload another
              </button>
              <button onClick={() => { onUploaded(); onClose(); }}
                style={{ height: 42, padding: '0 24px', borderRadius: 100, border: 'none', background: '#12A150', color: '#ffffff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#12241C' }}>Upload handout</h2>
                <p style={{ fontSize: 12, color: '#7d9188', marginTop: 2 }}>Share notes, slides, or worksheets with your class.</p>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(18,36,28,0.12)', background: 'transparent', color: '#7d9188', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>×</button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => !file && fileRef.current?.click()}
              style={{
                border: `2px dashed ${drag ? '#12A150' : file ? 'rgba(18,161,80,0.5)' : 'rgba(18,36,28,0.12)'}`,
                borderRadius: 14, padding: '24px 20px', textAlign: 'center', cursor: file ? 'default' : 'pointer',
                background: drag ? 'rgba(18,161,80,0.05)' : file ? 'rgba(18,161,80,0.04)' : 'rgba(18,36,28,0.03)',
                transition: 'all 0.2s', marginBottom: 18,
              }}>
              <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <span style={{ display:'inline-flex', color: fileColor(file.type) }}><FileIcon type={file.type} /></span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#12241C' }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: '#7d9188' }}>{fmtSize(file.size)}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setTitle(''); }}
                    style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(18,36,28,0.12)', background: 'transparent', color: '#7d9188', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>×</button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 8, color: 'var(--amber)', display: 'inline-flex' }}><UploadHdIcon /></div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#12241C', marginBottom: 4 }}>Drag & drop your file here</div>
                  <div style={{ fontSize: 12, color: '#7d9188' }}>or click to browse · PDF, DOCX, PPTX, XLSX, images · max 50 MB</div>
                </div>
              )}
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={L}>Title *</label>
                <input style={MODAL_INP} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Lecture Notes" />
              </div>

              {/* Subject name + code side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={L}>Subject Name *</label>
                  <input style={MODAL_INP} value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. Data Structures" />
                </div>
                <div>
                  <label style={L}>Subject Code</label>
                  <input style={MODAL_INP} value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. CS 201" />
                </div>
              </div>

              <div>
                <label style={L}>Description <span style={{ fontWeight: 400, opacity: 0.6, textTransform: 'none' as const }}>(optional)</span></label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's covered in this handout?"
                  rows={2}
                  style={{ ...MODAL_INP, height: 'auto', padding: '10px 14px', resize: 'vertical', fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1.5 }} />
              </div>
            </div>

            {phase === 'uploading' && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#4c6157', fontWeight: 600 }}>Uploading…</span>
                  <span style={{ fontSize: 12, color: '#12A150', fontWeight: 700 }}>{progress}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(18,36,28,0.09)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#5A4BB8,#12A150)', borderRadius: 100, width: `${progress}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {errMsg && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(194,91,78,0.08)', border: '1px solid rgba(194,91,78,0.3)', borderRadius: 10, fontSize: 13, color: '#C25B4E', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'inline-flex', flexShrink:0 }}><WarnHdIcon /></span> {errMsg}
              </div>
            )}

            <button onClick={upload} disabled={!canUpload || phase === 'uploading'}
              style={{ marginTop: 20, width: '100%', height: 48, borderRadius: 100, border: 'none', background: canUpload ? '#12A150' : 'rgba(18,36,28,0.09)', color: canUpload ? '#ffffff' : '#7d9188', fontSize: 15, fontWeight: 800, cursor: canUpload && phase !== 'uploading' ? 'pointer' : 'default', transition: 'all 0.15s' }}>
              {phase === 'uploading' ? `Uploading… ${progress}%` : '↑ Upload handout'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────────── */
export default function HandoutsPage() {
  const [me, setMe] = useState<any>(null);
  const [meUniversity, setMeUniversity] = useState('');
  const [handouts, setHandouts] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [q, setQ] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');

  // Reviews state
  const [reviewStats, setReviewStats] = useState<Record<string, { avg: number; count: number; mine: any | null }>>({});
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewNames, setReviewNames] = useState<Record<string, string>>({});
  const [reviewModal, setReviewModal] = useState<{ handout: any } | null>(null);

  async function loadReviews(handoutIds: string[], myId: string) {
    if (!handoutIds.length) return;
    const supabase = createClient();
    const { data: reviews } = await supabase
      .from('handout_reviews')
      .select('*')
      .in('handout_id', handoutIds);
    const list = reviews || [];
    setAllReviews(list);

    // Compute per-handout stats
    const stats: Record<string, { avg: number; count: number; mine: any | null }> = {};
    handoutIds.forEach(id => { stats[id] = { avg: 0, count: 0, mine: null }; });
    list.forEach(r => {
      if (!stats[r.handout_id]) stats[r.handout_id] = { avg: 0, count: 0, mine: null };
      stats[r.handout_id].count++;
      if (r.user_id === myId) stats[r.handout_id].mine = r;
    });
    handoutIds.forEach(id => {
      const s = stats[id];
      if (s.count > 0) {
        const sum = list.filter(r => r.handout_id === id).reduce((acc, r) => acc + r.rating, 0);
        s.avg = sum / s.count;
      }
    });
    setReviewStats(stats);

    // Load reviewer names
    const uids = Array.from(new Set(list.map(r => r.user_id).filter(Boolean))) as string[];
    if (uids.length) {
      const { data: us } = await supabase.from('public_profiles').select('id, full_name').in('id', uids);
      const nm: Record<string, string> = {};
      (us || []).forEach((u: any) => { nm[u.id] = u.full_name || 'Student'; });
      setReviewNames(nm);
    }
  }

  async function load() {
    setLoading(true); setLoadErr('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/auth/login'; return; }

      const [{ data: u }, { data: sp }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('university').eq('user_id', user.id).maybeSingle(),
      ]);
      setMe({ ...(u || {}), id: user.id });
      setMeUniversity(sp?.university || u?.city || '');

      const { data: rows, error } = await supabase
        .from('handouts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const list = rows || [];
      setHandouts(list);

      const uids = Array.from(new Set(list.map((h: any) => h.user_id).filter(Boolean))) as string[];
      if (uids.length) {
        const { data: us } = await supabase.from('public_profiles').select('id, full_name').in('id', uids);
        const nm: Record<string, string> = {};
        (us || []).forEach((u: any) => { nm[u.id] = u.full_name || 'Student'; });
        setNames(nm);
      }

      // Load reviews for all handouts
      if (list.length) {
        await loadReviews(list.map(h => h.id), user.id);
      }
    } catch (e: any) {
      setLoadErr(e.message || 'Could not load handouts. Please try again.');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDownload(h: any, url: string) {
    const supabase = createClient();
    supabase.rpc('increment_handout_download', { p_id: h.id }).then(() => {
      setHandouts(prev => prev.map(x => x.id === h.id ? { ...x, download_count: (x.download_count || 0) + 1 } : x));
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this handout?')) return;
    const supabase = createClient();
    await supabase.from('handouts').delete().eq('id', id);
    setHandouts(prev => prev.filter(h => h.id !== id));
  }

  const courses = Array.from(new Set(handouts.map(h => h.course).filter(Boolean))).sort();

  let visible = handouts
    .filter(h => tab === 'all' || h.user_id === me?.id)
    .filter(h => courseFilter === 'all' || h.course === courseFilter)
    .filter(h => !q.trim() || `${h.title} ${h.course} ${h.subject_code || ''} ${h.description || ''} ${names[h.user_id] || ''}`.toLowerCase().includes(q.toLowerCase()));
  if (sort === 'popular') visible = [...visible].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));

  return (
    <StudentLayout title="Handouts">
      {showUpload && me && (
        <UploadModal
          me={{ ...me, university: meUniversity }}
          onClose={() => setShowUpload(false)}
          onUploaded={load}
        />
      )}
      {reviewModal && me && (
        <ReviewModal
          handout={reviewModal.handout}
          meId={me.id}
          mine={reviewStats[reviewModal.handout.id]?.mine || null}
          allReviews={allReviews}
          reviewNames={reviewNames}
          onClose={() => setReviewModal(null)}
          onReviewed={() => loadReviews(handouts.map(h => h.id), me.id)}
        />
      )}

      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Upload and find class notes, slides, and worksheets.</p>
          <button onClick={() => setShowUpload(true)}
            style={{ height: 44, padding: '0 22px', borderRadius: 100, border: 'none', background: '#12A150', color: '#ffffff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, boxShadow: '0 0 20px rgba(18,161,80,0.25)' }}>
            <span style={{ fontSize: 16 }}>↑</span> Upload handout
          </button>
        </div>

        {/* Search + sort row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#7d9188', pointerEvents: 'none', display: 'inline-flex' }}><SearchHdIcon /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, subject, or keyword…"
              style={{ width: '100%', height: 42, paddingLeft: 38, paddingRight: 14, background: 'rgba(18,36,28,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--white)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as any)}
            style={{ height: 42, padding: '0 14px', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--white)', fontSize: 13, cursor: 'pointer', outline: 'none', flexShrink: 0 }}>
            <option value="recent">Most recent</option>
            <option value="popular">Most downloaded</option>
          </select>
        </div>

        {/* Tab + course filter row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ height: 36, padding: '0 16px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1px solid ${tab === t ? '#12A150' : 'var(--border)'}`, background: tab === t ? 'rgba(18,161,80,0.12)' : 'transparent', color: tab === t ? '#12A150' : 'var(--muted)', transition: 'all 0.15s' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>{t === 'all' ? <><AllHdIcon /> All handouts</> : <><MyHdIcon /> My uploads</>}</span>
            </button>
          ))}

          {courses.length > 0 && (
            <>
              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
              <button onClick={() => setCourseFilter('all')}
                style={{ height: 32, padding: '0 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${courseFilter === 'all' ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`, background: courseFilter === 'all' ? 'rgba(18,36,28,0.09)' : 'transparent', color: courseFilter === 'all' ? 'var(--white)' : 'var(--muted)' }}>
                All subjects
              </button>
              {courses.slice(0, 8).map(c => (
                <button key={c} onClick={() => setCourseFilter(courseFilter === c ? 'all' : c)}
                  style={{ height: 32, padding: '0 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${courseFilter === c ? courseColor(c) + '80' : 'var(--border)'}`, background: courseFilter === c ? courseColor(c) + '18' : 'transparent', color: courseFilter === c ? courseColor(c) : 'var(--muted)', transition: 'all 0.15s' }}>
                  {c}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Content area */}
        {loading ? (
          <Skeleton />
        ) : loadErr ? (
          <div style={{ background: 'rgba(194,91,78,0.06)', border: '1px solid rgba(194,91,78,0.2)', borderRadius: 16, padding: 36, textAlign: 'center' }}>
            <div style={{ marginBottom: 10, color: '#E08A1E', display: 'inline-flex' }}><WarnHdIcon /></div>
            <p style={{ fontSize: 15, color: '#C25B4E', marginBottom: 6 }}>Couldn't load handouts</p>
            <p style={{ fontSize: 13, color: '#7d9188', marginBottom: 18 }}>{loadErr}</p>
            <button onClick={load} style={{ height: 40, padding: '0 22px', borderRadius: 100, background: 'rgba(18,36,28,0.09)', border: '1px solid rgba(18,36,28,0.12)', color: '#12241C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>↺ Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ background: 'var(--navy2)', border: '1px dashed var(--border)', borderRadius: 18, padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, color: 'var(--muted)', display: 'inline-flex' }}><EmptyHdIcon /></div>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
              {q ? `No handouts found for "${q}"` : tab === 'mine' ? "You haven't uploaded anything yet" : 'No handouts yet'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
              {q ? 'Try a different keyword or clear the search.' : 'Be the first to share class notes, slides, or worksheets!'}
            </p>
            {!q && (
              <button onClick={() => setShowUpload(true)}
                style={{ height: 44, padding: '0 24px', borderRadius: 100, border: 'none', background: '#12A150', color: '#ffffff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                ↑ Upload first handout
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{visible.length} handout{visible.length !== 1 ? 's' : ''}</div>
            {visible.map(h => {
              const isMine = h.user_id === me?.id;
              const color = fileColor(h.file_type);
              const poster = names[h.user_id] || 'Student';
              const cc = courseColor(h.course);
              const rs = reviewStats[h.id];
              const myReview = rs?.mine;
              const fileUrl = publicStorageUrl(h.file_url, 'handouts');
              return (
                <div key={h.id}
                  style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', transition: 'border-color 0.15s', cursor: 'pointer' }}
                  onClick={() => window.location.href = `/student/handouts/${h.id}`}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(18,36,28,0.09)')}>

                  {/* File icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    <FileIcon type={h.file_type} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{h.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: cc + '18', color: cc, border: `1px solid ${cc}40`, flexShrink: 0 }}>{h.course}</span>
                      {h.subject_code && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: 'rgba(18,36,28,0.06)', color: 'var(--muted)', border: '1px solid rgba(18,36,28,0.09)', flexShrink: 0 }}>{h.subject_code}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>by {poster}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{timeAgo(h.created_at)}</span>
                      {h.file_size && <>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtSize(h.file_size)}</span>
                      </>}
                      {(h.download_count || 0) > 0 && <>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>↓ {h.download_count}</span>
                      </>}
                      {rs && rs.count > 0 && <>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <StarBar avg={rs.avg} count={rs.count} />
                      </>}
                    </div>
                    {h.description && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.description}</p>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    {isMine && (
                      <button onClick={() => handleDelete(h.id)} title="Delete"
                        style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(194,91,78,0.25)', background: 'transparent', color: '#C25B4E', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DeleteHdIcon />
                      </button>
                    )}
                    {/* Rate button — only for others' handouts */}
                    {!isMine && (
                      <button onClick={() => setReviewModal({ handout: h })}
                        title={myReview ? 'Edit your review' : 'Rate this handout'}
                        style={{
                          height: 36, padding: '0 14px', borderRadius: 100, cursor: 'pointer',
                          border: `1px solid ${myReview ? 'rgba(255,212,121,0.35)' : 'var(--border)'}`,
                          background: myReview ? 'rgba(255,212,121,0.1)' : 'transparent',
                          color: myReview ? '#E08A1E' : 'var(--muted)',
                          fontSize: 13, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 5,
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { if (!myReview) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,212,121,0.3)'; (e.currentTarget as HTMLElement).style.color = '#E08A1E'; } }}
                        onMouseLeave={e => { if (!myReview) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; } }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>{myReview ? <><StarFillIcon /> {myReview.rating}/5</> : <><StarOutIcon /> Rate</>}</span>
                      </button>
                    )}
                    {fileUrl && (
                      <button onClick={() => handleDownload(h, fileUrl)}
                        style={{ height: 36, padding: '0 18px', borderRadius: 100, border: 'none', background: '#12A150', color: '#ffffff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                        ↓ Download
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
