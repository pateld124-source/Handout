'use client';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { UniversitySelect } from '@/components/ui/UniversitySelect';
import { validateText, validateParagraph } from '@/lib/validation';
import { prepareImageUpload } from '@/lib/imageCompress';
import { PointsBadge } from '@/components/rewards/PointsBadge';
import { BETA_MODE } from '@/config/features';
import Link from 'next/link';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const Heart   = ({ size=16, color='currentColor', filled=true }: {size?:number;color?:string;filled?:boolean}) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?color:'none'} stroke={filled?'none':color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const LockIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const EyeIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const ChatIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const PhotoIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const StarIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const SendIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const EditIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14H5L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const CheckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const SearchIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const CapIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const PinIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const SparkIcon = () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const BigEye    = () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const MoreIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>;
const FlagIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
const BlockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;

const DT_FEAT = [
  { Icon: LockIcon, txt: 'University-locked — your campus only' },
  { Icon: EyeIcon,  txt: 'See who liked you' },
  { Icon: ChatIcon, txt: 'Message matches directly' },
  { Icon: PhotoIcon,txt: 'Up to 3 profile photos' },
  { Icon: StarIcon, txt: 'Interest-based suggestions' },
];

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface DProfile { id:string; user_id:string; display_name:string; age:number; gender:string; looking_for:string; bio:string; interests:string[]; photo_url:string; photos:string[]; university:string; major:string; year_of_study:string; height_cm:number; hometown:string; is_visible:boolean; }
interface Me { id:string; plan:string; university:string; full_name:string; avatar_url:string; }

/* ── Shared constants ──────────────────────────────────────────────────────── */
const INTERESTS = ['Hiking','Gaming','Cooking','Movies','Music','Art','Travel','Fitness','Reading','Photography','Coffee','Yoga','Dance','Coding','Fashion'];
const GENDERS   = ['Man','Woman','Non-binary','Prefer not to say'];
const LOOKING   = ['Women','Men','Everyone'];
const YEARS     = ['Freshman','Sophomore','Junior','Senior','Graduate','PhD'];
const LOOKING_LABEL: Record<string,string> = { women:'Looking for women', men:'Looking for men', everyone:'Open to everyone' };
const OVERLAY: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(18,36,28,0.6)', backdropFilter:'blur(12px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
const INP: React.CSSProperties     = { width:'100%', height:44, padding:'0 14px', background:'#F1F7F3', border:'1px solid rgba(18,36,28,0.12)', borderRadius:10, color:'var(--white)', fontSize:14, outline:'none', boxSizing:'border-box' };

/* ── Chip helper (shared) ─────────────────────────────────────────────────── */
function Chip(lbl:string, active:boolean, fn:()=>void, col='var(--amber)') {
  return <button key={lbl} onClick={fn} style={{ padding:'7px 15px', borderRadius:100, fontSize:13, fontWeight:600, cursor:'pointer', border:`1px solid ${active?col:'rgba(18,36,28,0.12)'}`, background:active?`${col}1A`:'transparent', color:active?col:'var(--muted)' }}>{lbl}</button>;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────*/
function allPhotos(p:Partial<DProfile>): string[] {
  const arr: string[] = [];
  if (p.photo_url) arr.push(p.photo_url);
  if (p.photos) p.photos.forEach(u => { if (u && !arr.includes(u)) arr.push(u); });
  return arr;
}
function Avi({ photo, name, size=72 }: { photo?:string; name?:string; size?:number }) {
  const COLS = ['#12A150','#7C6BD1','#12A150','#FFD166','#C25B4E'];
  const col  = COLS[(name?.charCodeAt(0)??0) % COLS.length];
  const init = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  if (photo) return <img src={photo} alt="" style={{ width:size, height:size, borderRadius:size*0.28, objectFit:'cover', flexShrink:0 }}/>;
  return <div style={{ width:size, height:size, borderRadius:size*0.28, background:col, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.36, fontWeight:800, color:'#fff', flexShrink:0 }}>{init}</div>;
}
async function uploadPhoto(file:File, userId:string): Promise<string> {
  const sb = createClient();
  const path = `${userId}/dating-${Date.now()}.jpg`;
  const { error } = await sb.storage.from('avatars').upload(path, file, { upsert:true });
  if (error) throw error;
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/* ── 3-slot photo grid ───────────────────────────────────────────────────────*/
function PhotoGrid({ photos, userId, onChange }: { photos:string[]; userId:string; onChange:(arr:string[])=>void }) {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [uploading, setUploading] = useState<number|null>(null);
  const [err, setErr] = useState('');

  const pick = async (idx:number, e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(idx); setErr('');
    const jpeg = await prepareImageUpload(f).catch((x:Error) => { setErr(x.message); return null; });
    if (!jpeg) { setUploading(null); return; }
    try { const url = await uploadPhoto(jpeg, userId); const next=[...photos]; next[idx]=url; onChange(next); }
    catch { setErr('Photo upload failed — please try again.'); }
    setUploading(null);
  };
  const remove = (idx:number) => { const next=[...photos]; next.splice(idx,1); onChange(next); };

  return (
    <div>
      <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:10 }}>Photos <span style={{ color:'#9aa8a0' }}>(up to 3 — first is your main photo)</span></label>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[0,1,2].map(idx => {
          const url = photos[idx];
          return (
            <div key={idx} style={{ position:'relative', width:'100%', paddingTop:'100%', borderRadius:14, overflow:'hidden', border:`2px dashed ${url?'transparent':'rgba(18,36,28,0.12)'}`, background:'rgba(18,36,28,0.04)', cursor:'pointer' }}
              onClick={() => !url && refs[idx].current?.click()}>
              <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {url ? <>
                  <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', opacity:0, transition:'opacity 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                    onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='0')}>
                    <button onClick={e=>{ e.stopPropagation(); refs[idx].current?.click(); }} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><EditIcon /></button>
                    <button onClick={e=>{ e.stopPropagation(); remove(idx); }} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,80,80,0.7)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                  {idx===0 && <div style={{ position:'absolute', bottom:6, left:6, fontSize:10, fontWeight:700, background:'var(--amber)', color:'#fff', borderRadius:6, padding:'2px 7px' }}>MAIN</div>}
                </> : (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:28, color:'var(--muted)' }}>{uploading===idx ? '…' : '+'}</span>
                    <span style={{ fontSize:11, color:'var(--muted)' }}>{idx===0?'Main photo':`Photo ${idx+1}`}</span>
                  </div>
                )}
              </div>
              <input ref={refs[idx]} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>pick(idx,e)} />
            </div>
          );
        })}
      </div>
      {err && <div style={{ marginTop:14, padding:'10px 14px', borderRadius:10, background:'rgba(255,60,60,0.12)', border:'1px solid rgba(255,60,60,0.3)', color:'#ff6b6b', fontSize:13 }}>{err}</div>}
    </div>
  );
}

/* ── Premium gate ────────────────────────────────────────────────────────────*/
function PremiumGate() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 130px)', padding:24 }}>
      <div style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:28, maxWidth:480, width:'100%', overflow:'hidden', boxShadow:'0 24px 60px rgba(18,36,28,0.16)' }}>
        {/* Gradient hero band */}
        <div style={{ background:'linear-gradient(135deg,#7C6BD1,#12A150)', padding:'36px 40px 30px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.12)', top:-90, right:-50 }}/>
          <div style={{ position:'relative' }}>
            <div style={{ width:74, height:74, borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'3px solid rgba(255,255,255,0.5)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}><Heart size={34} color="#fff" /></div>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', marginBottom:8 }}>Premium Feature</div>
            <h2 style={{ fontSize:28, fontWeight:800, letterSpacing:-1, color:'#fff', margin:0, lineHeight:1.15 }}>Meet students at<br/>your university</h2>
          </div>
        </div>
        <div style={{ padding:'28px 40px 40px', textAlign:'center' }}>
          <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, marginBottom:24 }}>Campus Connect is university-locked — you only match with students from <strong style={{ color:'var(--light)' }}>your own campus</strong>.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:11, marginBottom:26, textAlign:'left' }}>
            {DT_FEAT.map(({Icon, txt}) => (
              <div key={txt} style={{ display:'flex', alignItems:'center', gap:12, fontSize:14, color:'var(--light)' }}>
                <span style={{ width:30, height:30, borderRadius:9, background:'rgba(124,107,209,0.10)', border:'1px solid rgba(124,107,209,0.18)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#7C6BD1', flexShrink:0 }}><Icon /></span>{txt}
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
            {[{name:'Plus',price:'$9/mo',col:'#12A150'},{name:'Pro',price:'$19/mo',col:'#7C6BD1'}].map(p=>(
              <div key={p.name} style={{ background:'rgba(18,36,28,0.03)', border:`1px solid ${p.col}44`, borderRadius:14, padding:'14px 16px' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:p.col, textTransform:'uppercase', marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--white)' }}>{p.price}</div>
              </div>
            ))}
          </div>
          <Link href="/student/membership" style={{ display:'block', height:50, lineHeight:'50px', background:'linear-gradient(135deg,#7C6BD1,#12A150)', borderRadius:100, color:'#fff', fontSize:15, fontWeight:800, textDecoration:'none', boxShadow:'0 10px 26px rgba(124,107,209,0.34)' }}>Upgrade to unlock Campus Connect →</Link>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:12 }}>14-day free trial · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}

/* ── Setup modal ─────────────────────────────────────────────────────────────*/
function SetupModal({ me, onSave }: { me:Me; onSave:(p:DProfile)=>void }) {
  const [step,      setStep]      = useState(0);
  const [name,      setName]      = useState(me.full_name||'');
  const [age,       setAge]       = useState('');
  const [gender,    setGender]    = useState('');
  const [looking,   setLooking]   = useState('Everyone');
  const [major,     setMajor]     = useState('');
  const [year,      setYear]      = useState('');
  const [height,    setHeight]    = useState('');
  const [hometown,  setHometown]  = useState('');
  const [university,setUniversity]= useState(me.university||'');
  const [bio,       setBio]       = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photos,    setPhotos]    = useState<string[]>(me.avatar_url?[me.avatar_url]:[]);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');

  const toggleI = (i:string) => setInterests(p=>p.includes(i)?p.filter(x=>x!==i):p.length<6?[...p,i]:p);
  const canNext  = step===0 ? (!!name && !!age && parseInt(age)>=18 && parseInt(age)<=60 && !!gender) : true;

  const save = async () => {
    if (!name||!age||!gender) return;
    // Validate name (letters/numbers), age range, and bio length
    const nErr = validateText(name, 'Name', { min: 2, max: 40 });
    const aNum = parseInt(age);
    const aErr = (!aNum || aNum < 18 || aNum > 60) ? 'Age must be between 18 and 60' : '';
    const bErr = validateParagraph(bio, 'Bio', { max: 500 });
    if (nErr || aErr || bErr) { setSaveErr(nErr || aErr || bErr); return; }
    setSaving(true); setSaveErr('');
    const sb = createClient();
    const base = { user_id:me.id, display_name:name, age:parseInt(age), gender, looking_for:looking.toLowerCase(), bio, interests, photo_url:photos[0]||'', university, is_visible:true };
    const full = { ...base, photos, major, year_of_study:year, height_cm:height?parseInt(height):null, hometown };
    let data:any=null, error:any=null;
    ({ data, error } = await sb.from('dating_profiles').upsert(full, { onConflict:'user_id' }).select().single());
    if (error) ({ data, error } = await sb.from('dating_profiles').upsert(base, { onConflict:'user_id' }).select().single());
    setSaving(false);
    if (error) { setSaveErr(error.message||'Something went wrong.'); return; }
    if (data) onSave(data as DProfile);
  };

  return (
    <div style={OVERLAY}>
      <div style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.12)', borderRadius:28, padding:'32px 28px', width:'100%', maxWidth:480, maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', gap:6, marginBottom:22 }}>
          {[0,1,2].map(i=><div key={i} style={{ flex:1, height:3, borderRadius:3, background:i<=step?'var(--amber)':'rgba(18,36,28,0.12)', transition:'background 0.3s' }}/>)}
        </div>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--amber)', textTransform:'uppercase', marginBottom:6 }}>Step {step+1} of 3</div>
        <h3 style={{ fontSize:22, fontWeight:800, color:'var(--white)', marginBottom:4 }}>{step===0?'The basics':step===1?'About you':'Interests & bio'}</h3>
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>{step===0?'A photo and your core details.':step===1?'Let people know what you\'re studying.':'Pick up to 6 interests to find better matches.'}</p>

        {step===0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <PhotoGrid photos={photos} userId={me.id} onChange={setPhotos} />
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Display name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your first name" style={INP}/></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Your age</label>
                <input type="number" min={18} max={60} value={age} onChange={e=>setAge(e.target.value)} placeholder="21" style={INP}/></div>
              <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Height <span style={{ color:'#9aa8a0' }}>(cm, optional)</span></label>
                <input type="number" value={height} onChange={e=>setHeight(e.target.value)} placeholder="170" style={INP}/></div>
            </div>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8 }}>I am a…</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{GENDERS.map(g=>Chip(g,gender===g,()=>setGender(g)))}</div></div>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8 }}>Looking for</label>
              <div style={{ display:'flex', gap:8 }}>{LOOKING.map(l=>Chip(l,looking===l,()=>setLooking(l)))}</div></div>
          </div>
        )}

        {step===1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>University</label>
              <UniversitySelect value={university} onChange={setUniversity} inputStyle={{ ...INP }}/></div>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Major / Field of study</label>
              <input value={major} onChange={e=>setMajor(e.target.value)} placeholder="e.g. Computer Science" style={INP}/></div>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8 }}>Year of study</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{YEARS.map(y=>Chip(y,year===y,()=>setYear(y)))}</div></div>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Hometown <span style={{ color:'#9aa8a0' }}>(optional)</span></label>
              <input value={hometown} onChange={e=>setHometown(e.target.value)} placeholder="e.g. Mumbai, India" style={INP}/></div>
          </div>
        )}

        {step===2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Bio <span style={{ color:'#9aa8a0' }}>(optional)</span></label>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="A little about yourself…" rows={3}
                style={{ ...INP, height:'auto', padding:'10px 14px', resize:'none' }}/></div>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8 }}>Interests <span style={{ color:'#9aa8a0' }}>(up to 6)</span></label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {INTERESTS.map(i=>(
                  <button key={i} onClick={()=>toggleI(i)} style={{ padding:'7px 13px', borderRadius:100, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${interests.includes(i)?'#7C6BD1':'rgba(18,36,28,0.12)'}`, background:interests.includes(i)?'rgba(124,107,209,0.12)':'transparent', color:interests.includes(i)?'#7C6BD1':'var(--muted)', opacity:!interests.includes(i)&&interests.length>=6?0.35:1 }}>{i}</button>
                ))}
              </div></div>
          </div>
        )}

        {saveErr && <div style={{ marginTop:14, padding:'10px 14px', borderRadius:10, background:'rgba(255,60,60,0.12)', border:'1px solid rgba(255,60,60,0.3)', color:'#ff6b6b', fontSize:13 }}>{saveErr}</div>}

        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{ width:44, height:44, borderRadius:100, border:'1px solid rgba(18,36,28,0.12)', background:'transparent', color:'var(--white)', cursor:'pointer', fontSize:18, flexShrink:0 }}>←</button>}
          <button onClick={step===2?save:()=>{ setSaveErr(''); setStep(s=>s+1); }} disabled={!canNext||saving}
            style={{ flex:1, height:44, borderRadius:100, background:canNext?'var(--amber)':'#EDEFEE', color:canNext?'#fff':'#9aa8a0', fontWeight:800, fontSize:14, cursor:canNext?'pointer':'not-allowed', border:'none', transition:'background 0.2s' }}>
            {saving?'Saving…':step===2?'Start matching':'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit modal ──────────────────────────────────────────────────────────────*/
function EditModal({ profile, me, onClose, onSave, onDelete }: { profile:DProfile; me:Me; onClose:()=>void; onSave:(p:DProfile)=>void; onDelete:()=>void }) {
  const [photos,    setPhotos]    = useState<string[]>(allPhotos(profile));
  const [bio,       setBio]       = useState(profile.bio||'');
  const [major,     setMajor]     = useState(profile.major||'');
  const [year,      setYear]      = useState(profile.year_of_study||'');
  const [height,    setHeight]    = useState(profile.height_cm?String(profile.height_cm):'');
  const [hometown,  setHometown]  = useState(profile.hometown||'');
  const [university,setUniversity]= useState(profile.university||me.university||'');
  const [interests, setInterests] = useState<string[]>(profile.interests||[]);
  const [visible,   setVisible]   = useState(profile.is_visible);
  const [saving,    setSaving]    = useState(false);
  const [confirm,   setConfirm]   = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const toggle = (i:string) => setInterests(p=>p.includes(i)?p.filter(x=>x!==i):p.length<6?[...p,i]:p);
  const INP2 = { ...INP, height:42, fontSize:13 };

  const save = async () => {
    setSaving(true);
    const { data } = await createClient().from('dating_profiles')
      .update({ bio, interests, photo_url:photos[0]||'', photos, major, year_of_study:year, height_cm:height?parseInt(height):null, hometown, university, is_visible:visible, updated_at:new Date().toISOString() })
      .eq('user_id', profile.user_id).select().single();
    setSaving(false);
    if (data) { onSave(data as DProfile); onClose(); }
  };

  const del = async () => {
    setDeleting(true);
    const sb = createClient();
    await sb.from('dating_likes').delete().or(`liker_id.eq.${me.id},liked_id.eq.${me.id}`);
    await sb.from('dating_profiles').delete().eq('user_id', me.id);
    setDeleting(false); onDelete();
  };

  return (
    <div style={OVERLAY} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.12)', borderRadius:24, padding:'28px 24px', width:'100%', maxWidth:480, maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontSize:20, fontWeight:800, color:'var(--white)' }}>Edit profile</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:24, lineHeight:1 }}>×</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <PhotoGrid photos={photos} userId={me.id} onChange={setPhotos} />
          <div style={{ height:1, background:'rgba(18,36,28,0.09)' }}/>
          <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>University</label>
            <UniversitySelect value={university} onChange={setUniversity} inputStyle={{ ...INP2 }}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Major</label>
              <input value={major} onChange={e=>setMajor(e.target.value)} placeholder="Computer Science" style={INP2}/></div>
            <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Height (cm)</label>
              <input type="number" value={height} onChange={e=>setHeight(e.target.value)} placeholder="170" style={INP2}/></div>
          </div>
          <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8 }}>Year of study</label>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>{YEARS.map(y=>Chip(y,year===y,()=>setYear(y)))}</div></div>
          <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Hometown</label>
            <input value={hometown} onChange={e=>setHometown(e.target.value)} placeholder="Mumbai, India" style={INP2}/></div>
          <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Bio</label>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} style={{ ...INP2, height:'auto', padding:'10px 14px', resize:'none' }}/></div>
          <div><label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8 }}>Interests (max 6)</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {INTERESTS.map(i=>(
                <button key={i} onClick={()=>toggle(i)} style={{ padding:'6px 12px', borderRadius:100, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${interests.includes(i)?'#7C6BD1':'rgba(18,36,28,0.12)'}`, background:interests.includes(i)?'rgba(124,107,209,0.12)':'transparent', color:interests.includes(i)?'#7C6BD1':'var(--muted)', opacity:!interests.includes(i)&&interests.length>=6?0.35:1 }}>{i}</button>
              ))}
            </div></div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(18,36,28,0.04)', borderRadius:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--white)' }}>Visible to others</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>Pause your profile anytime</div>
            </div>
            <button onClick={()=>setVisible(v=>!v)} style={{ width:48, height:26, borderRadius:100, background:visible?'var(--amber)':'rgba(18,36,28,0.2)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:4, left:visible?24:4, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }}/>
            </button>
          </div>
        </div>
        <button onClick={save} disabled={saving} style={{ width:'100%', height:46, marginTop:20, borderRadius:100, background:'var(--amber)', color:'#fff', fontWeight:800, fontSize:14, cursor:saving?'not-allowed':'pointer', border:'none' }}>
          {saving?'Saving…':'Save changes'}
        </button>
        <div style={{ marginTop:18, borderTop:'1px solid rgba(18,36,28,0.09)', paddingTop:16 }}>
          {!confirm
            ? <button onClick={()=>setConfirm(true)} style={{ width:'100%', height:42, borderRadius:100, background:'transparent', border:'1px solid rgba(194,91,78,0.44)', color:'#C25B4E', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><TrashIcon /> Delete my dating profile</button>
            : <div style={{ background:'rgba(194,91,78,0.07)', border:'1px solid rgba(194,91,78,0.44)', borderRadius:14, padding:'14px 16px' }}>
                <p style={{ fontSize:13, color:'var(--light)', marginBottom:12, lineHeight:1.5 }}>Permanently deletes your profile and all likes. Cannot be undone.</p>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>setConfirm(false)} style={{ flex:1, height:38, borderRadius:100, background:'transparent', border:'1px solid rgba(18,36,28,0.12)', color:'var(--muted)', cursor:'pointer', fontSize:13 }}>Cancel</button>
                  <button onClick={del} disabled={deleting} style={{ flex:1, height:38, borderRadius:100, background:'#C25B4E', color:'#fff', fontWeight:700, border:'none', cursor:deleting?'not-allowed':'pointer', fontSize:13 }}>{deleting?'Deleting…':'Yes, delete'}</button>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

/* ── Match modal ─────────────────────────────────────────────────────────────*/
function MatchModal({ match, meId, onClose }: { match:DProfile; meId:string; onClose:()=>void }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const pics = allPhotos(match);

  const send = async () => {
    const t = msg.trim(); if (!t) return;
    setSending(true);
    try {
      await createClient().from('messages').insert({ sender_id:meId, receiver_id:match.user_id, content:t });
      setSent(true);
      setTimeout(() => { onClose(); router.push(`/student/dating/chat?to=${match.user_id}`); }, 900);
    } catch { setSending(false); }
  };

  return (
    <div style={{ ...OVERLAY, backdropFilter:'blur(18px)', zIndex:2000 }}>
      <div style={{ background:'#fff', border:'2px solid rgba(18,161,80,0.35)', borderRadius:32, padding:'36px 28px', maxWidth:400, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <div style={{ marginBottom:8, display:'inline-flex' }}><Heart size={46} color="#7C6BD1" /></div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:4, color:'#7C6BD1', textTransform:'uppercase', marginBottom:8 }}>It's a Match!</div>
          <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5, color:'var(--white)', marginBottom:4 }}>You & {match.display_name} liked each other</h2>
          <p style={{ fontSize:13, color:'var(--muted)' }}>Start a conversation before someone else does.</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(18,36,28,0.05)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:18, padding:'14px 16px', marginBottom:22 }}>
          {pics[0] ? <img src={pics[0]} alt="" style={{ width:60, height:60, borderRadius:14, objectFit:'cover', flexShrink:0 }}/> : <Avi name={match.display_name} size={60}/>}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--white)' }}>{match.display_name}{match.age?`, ${match.age}`:''}</div>
            {(match.major||match.year_of_study) && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{[match.major, match.year_of_study].filter(Boolean).join(' · ')}</div>}
            {match.interests?.length>0 && (
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:7 }}>
                {match.interests.slice(0,3).map(i=><span key={i} style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(124,107,209,0.12)', color:'#7C6BD1' }}>{i}</span>)}
              </div>
            )}
          </div>
        </div>
        {!sent ? (
          <>
            <div style={{ position:'relative', marginBottom:12 }}>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } }}
                placeholder={`Say something to ${match.display_name}…`} rows={2}
                style={{ width:'100%', padding:'12px 14px', background:'rgba(18,36,28,0.06)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:14, color:'var(--white)', fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' }}/>
              {msg.trim() && <button onClick={send} disabled={sending} style={{ position:'absolute', right:10, bottom:10, width:32, height:32, borderRadius:'50%', background:'var(--amber)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>{sending?'…':<SendIcon />}</button>}
            </div>
            <button onClick={send} disabled={!msg.trim()||sending}
              style={{ width:'100%', height:48, borderRadius:100, background:msg.trim()?'var(--amber)':'rgba(18,36,28,0.06)', color:msg.trim()?'#fff':'var(--muted)', fontWeight:800, fontSize:15, border:'none', cursor:msg.trim()?'pointer':'default', transition:'all 0.2s', marginBottom:10 }}>
              {sending?'Sending…':'Send message'}
            </button>
          </>
        ) : (
          <div style={{ height:48, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10 }}>
            <span style={{ display:'inline-flex', color:'var(--green)' }}><CheckIcon /></span>
            <span style={{ fontSize:15, fontWeight:700, color:'var(--green)' }}>Message sent! Opening chat…</span>
          </div>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>{ onClose(); router.push(`/student/dating/chat?to=${match.user_id}`); }} style={{ flex:1, height:42, borderRadius:100, background:'transparent', border:'1px solid rgba(18,36,28,0.09)', color:'var(--muted)', fontWeight:600, fontSize:13, cursor:'pointer' }}>Open chat →</button>
          <button onClick={onClose} style={{ flex:1, height:42, borderRadius:100, background:'transparent', border:'1px solid rgba(18,36,28,0.06)', color:'#9aa8a0', fontWeight:600, fontSize:13, cursor:'pointer' }}>Keep swiping</button>
        </div>
      </div>
    </div>
  );
}

/* ── Gender / looking_for compatibility ──────────────────────────────────────*/
function fitsLooking(gender:string, looking:string) {
  if (!looking || looking === 'everyone') return true;
  if (looking === 'women') return gender === 'Woman';
  if (looking === 'men')   return gender === 'Man';
  return true;
}
function mutualFit(a:Partial<DProfile>, b:Partial<DProfile>) {
  return fitsLooking(b.gender||'', a.looking_for||'') && fitsLooking(a.gender||'', b.looking_for||'');
}
function sharedCount(a?:string[], b?:string[]) {
  if (!a?.length || !b?.length) return 0;
  const s = new Set(a);
  return b.filter(i => s.has(i)).length;
}

/* ── Block a user (unmatches + hides them from Discover/Liked You too) ───────*/
async function blockDatingUser(blockedId: string) {
  await createClient().rpc('block_dating_user', { p_blocked_id: blockedId });
}

/* ── Report reasons ───────────────────────────────────────────────────────────*/
const REPORT_REASONS = ['Harassment or threats', 'Fake profile', 'Inappropriate photos', 'Spam or scam', 'Underage', 'Other'];

/* ── Report modal ─────────────────────────────────────────────────────────────*/
function ReportModal({ profile, onClose, onSubmitted }: { profile:DProfile; onClose:()=>void; onSubmitted:()=>void }) {
  const [reason, setReason]   = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');

  async function submit() {
    if (!reason) { setErr('Please choose a reason.'); return; }
    setBusy(true); setErr('');
    const sb = createClient();
    const { data:{user} } = await sb.auth.getUser();
    const { error } = await sb.from('dating_reports').insert({
      reporter_id: user?.id, reported_id: profile.user_id, reason, details: details.trim() || null,
    });
    setBusy(false);
    if (error) { setErr('Could not submit — try again.'); return; }
    onSubmitted();
  }

  return (
    <div style={{ ...OVERLAY, zIndex:2100 }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', border:'1px solid rgba(18,36,28,0.1)', borderRadius:22, padding:'26px 24px', width:'100%', maxWidth:400 }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontSize:18, fontWeight:800, color:'var(--white)', margin:'0 0 4px' }}>Report {profile.display_name}</h3>
        <p style={{ fontSize:12.5, color:'var(--muted)', margin:'0 0 18px' }}>Our team reviews every report. This won't notify {profile.display_name}.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          {REPORT_REASONS.map(r => (
            <button key={r} type="button" onClick={()=>setReason(r)} style={{ textAlign:'left', padding:'10px 14px', borderRadius:12, cursor:'pointer', border:`1.5px solid ${reason===r?'#C25B4E':'rgba(18,36,28,0.12)'}`, background:reason===r?'rgba(194,91,78,0.06)':'#fff', fontSize:13.5, fontWeight:600, color:reason===r?'#C25B4E':'var(--white)' }}>{r}</button>
          ))}
        </div>
        <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={3} placeholder="Additional details (optional)"
          style={{ width:'100%', padding:'11px 14px', background:'#F1F7F3', border:'1px solid rgba(18,36,28,0.12)', borderRadius:10, color:'var(--white)', fontSize:13.5, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        {err && <div style={{ marginTop:12, padding:'9px 12px', borderRadius:10, background:'rgba(194,91,78,0.10)', border:'1px solid rgba(194,91,78,0.3)', color:'#C25B4E', fontSize:12.5 }}>{err}</div>}
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <button onClick={submit} disabled={busy} style={{ flex:1, height:44, borderRadius:100, background:'#C25B4E', border:'none', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>{busy?'Submitting…':'Submit report'}</button>
          <button onClick={onClose} style={{ height:44, padding:'0 18px', borderRadius:100, background:'transparent', border:'1px solid rgba(18,36,28,0.12)', color:'var(--muted)', fontWeight:600, fontSize:14, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Safety menu (••• → Block / Report) ───────────────────────────────────────*/
function SafetyMenu({ profile, onBlocked, showReport=true }: { profile:DProfile; onBlocked:()=>void; showReport?:boolean }) {
  const [open, setOpen]           = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported]   = useState(false);
  const [pos, setPos]             = useState<{top:number; left:number}>({ top:0, left:0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  async function doBlock() {
    setOpen(false);
    if (!confirm(`Block ${profile.display_name}? You'll unmatch and won't see each other again.`)) return;
    await blockDatingUser(profile.user_id);
    onBlocked();
  }

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 150) });
    }
    setOpen(o=>!o);
  }

  return (
    <div onClick={e=>e.stopPropagation()}>
      <button ref={btnRef} onClick={toggle} title="Safety options" style={{ width:34, height:34, borderRadius:'50%', background:'rgba(18,36,28,0.05)', border:'1px solid rgba(18,36,28,0.09)', color:'var(--muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><MoreIcon /></button>
      {/* Rendered via portal to document.body so it's never clipped by an ancestor's overflow:hidden (e.g. the match card). Positioned with `fixed` from the trigger button's real coordinates. */}
      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div style={{ position:'fixed', inset:0, zIndex:2050 }} onClick={()=>setOpen(false)}/>
          <div style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2051, background:'#fff', border:'1px solid rgba(18,36,28,0.1)', borderRadius:14, boxShadow:'0 12px 30px rgba(18,36,28,0.16)', overflow:'hidden', minWidth:150 }}>
            {showReport && (
              <button onClick={()=>{ setOpen(false); setReporting(true); }} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'11px 14px', background:'transparent', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#12241C', textAlign:'left' }}><FlagIcon /> Report</button>
            )}
            <button onClick={doBlock} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'11px 14px', background:'transparent', border:'none', borderTop: showReport ? '1px solid rgba(18,36,28,0.07)' : 'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#C25B4E', textAlign:'left' }}><BlockIcon /> Block</button>
          </div>
        </>,
        document.body
      )}
      {reporting && !reported && <ReportModal profile={profile} onClose={()=>setReporting(false)} onSubmitted={()=>{ setReported(true); setTimeout(()=>setReporting(false), 1400); }}/>}
      {reporting && reported && (
        <div style={{ ...OVERLAY, zIndex:2100 }}>
          <div style={{ background:'#fff', borderRadius:22, padding:'32px 28px', textAlign:'center', maxWidth:320 }}>
            <div style={{ color:'#12A150', marginBottom:10, display:'inline-flex' }}><CheckIcon /></div>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--white)', margin:0 }}>Report submitted</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Profile card ────────────────────────────────────────────────────────────*/
function ProfileCard({ profile, myInterests }: { profile:DProfile; myInterests?:string[] }) {
  const pics = allPhotos(profile);
  const [picIdx, setPicIdx] = useState(0);
  const mine = new Set(myInterests || []);
  const nShared = (profile.interests || []).filter(i => mine.has(i)).length;

  return (
    <div style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.10)', borderRadius:28, overflow:'hidden', boxShadow:'0 20px 48px rgba(18,36,28,0.13)' }}>
      <div style={{ height:360, background:'linear-gradient(150deg,#9d8bec 0%,#5ec98f 100%)', position:'relative', overflow:'hidden' }}>
        {pics.length > 0
          ? <img src={pics[picIdx]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:112, height:112, borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'3px solid rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, fontWeight:800, color:'#fff', backdropFilter:'blur(2px)' }}>{(profile.display_name||'?')[0].toUpperCase()}</div>
            </div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(10,20,14,0.94) 0%, rgba(10,20,14,0.35) 42%, transparent 68%)' }}/>
        {pics.length > 1 && (
          <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
            {pics.map((_,i) => <div key={i} onClick={e=>{ e.stopPropagation(); setPicIdx(i); }} style={{ width:i===picIdx?22:6, height:6, borderRadius:3, background:i===picIdx?'var(--amber)':'rgba(255,255,255,0.4)', transition:'width 0.2s, background 0.2s', cursor:'pointer' }}/>)}
          </div>
        )}
        {pics.length > 1 && picIdx > 0 && <button onClick={e=>{ e.stopPropagation(); setPicIdx(i=>Math.max(0,i-1)); }} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'none', color:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>}
        {pics.length > 1 && picIdx < pics.length-1 && <button onClick={e=>{ e.stopPropagation(); setPicIdx(i=>Math.min(pics.length-1,i+1)); }} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'none', color:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 18px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:10 }}>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', letterSpacing:-0.5, lineHeight:1.1 }}>{profile.display_name}{profile.age?`, ${profile.age}`:''}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
                {profile.gender && <span style={{ fontSize:12, color:'rgba(186,201,204,0.8)' }}>{profile.gender}</span>}
                {profile.height_cm && <span style={{ fontSize:12, color:'rgba(186,201,204,0.6)' }}>· {profile.height_cm} cm</span>}
              </div>
            </div>
            {profile.university && <div style={{ fontSize:10, background:'rgba(0,0,0,0.55)', borderRadius:100, padding:'4px 10px', color:'var(--muted)', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}><span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><CapIcon /> {profile.university.split(' ').slice(0,3).join(' ')}</span></div>}
          </div>
        </div>
      </div>
      <div style={{ padding:'14px 18px 18px', display:'flex', flexDirection:'column', gap:10 }}>
        {(profile.major||profile.year_of_study||profile.hometown) && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {profile.major && <span style={{ fontSize:12, color:'var(--amber)', background:'rgba(18,161,80,0.07)', border:'1px solid rgba(18,161,80,0.15)', borderRadius:100, padding:'3px 10px' }}>{profile.major}</span>}
            {profile.year_of_study && <span style={{ fontSize:12, color:'var(--light)', background:'rgba(18,36,28,0.05)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:100, padding:'3px 10px', display:'inline-flex', alignItems:'center', gap:3 }}><CapIcon /> {profile.year_of_study}</span>}
            {profile.hometown && <span style={{ fontSize:12, color:'var(--muted)', background:'rgba(18,36,28,0.04)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:100, padding:'3px 10px', display:'inline-flex', alignItems:'center', gap:3 }}><PinIcon /> {profile.hometown}</span>}
          </div>
        )}
        {profile.looking_for && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:100, background:'rgba(18,161,80,0.07)', border:'1px solid rgba(18,161,80,0.15)', color:'var(--amber)', width:'fit-content' }}>
            <Heart size={10} color="var(--amber)" /> {LOOKING_LABEL[profile.looking_for]||`Looking for ${profile.looking_for}`}
          </div>
        )}
        {profile.bio && <p style={{ fontSize:13, color:'var(--light)', lineHeight:1.65, margin:0 }}>{profile.bio}</p>}
        {profile.interests?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
            {nShared > 0 && <span style={{ fontSize:10.5, fontWeight:800, padding:'4px 10px', borderRadius:100, background:'#12A150', color:'#fff' }}>✦ {nShared} shared</span>}
            {[...profile.interests].sort((a,b)=>Number(mine.has(b))-Number(mine.has(a))).map(i=> mine.has(i)
              ? <span key={i} style={{ fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:100, background:'rgba(18,161,80,0.12)', color:'#0F8A44', border:'1px solid rgba(18,161,80,0.3)' }}>{i}</span>
              : <span key={i} style={{ fontSize:11, fontWeight:600, padding:'4px 11px', borderRadius:100, background:'rgba(124,107,209,0.09)', color:'#7C6BD1', border:'1px solid rgba(124,107,209,0.18)' }}>{i}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Discover ─────────────────────────────────────────────────────────────── */
function DiscoverView({ me, meId, myProfile }: { me:Me; meId:string; myProfile:DProfile }) {
  const [profiles, setProfiles] = useState<DProfile[]>([]);
  const [matchedProfile, setMatchedProfile] = useState<DProfile|null>(null);
  const [loading, setLoading] = useState(true);
  const [swipeDir, setSwipeDir] = useState<'left'|'right'|null>(null);
  const [passed, setPassed] = useState<DProfile[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const sb = createClient();
    const [{ data:done }, { data:blocked }] = await Promise.all([
      sb.from('dating_likes').select('liked_id').eq('liker_id', me.id),
      sb.from('dating_blocks').select('blocked_id').eq('blocker_id', me.id),
    ]);
    const doneIds = new Set((done||[]).map((l:any)=>l.liked_id));
    const blockedIds = new Set((blocked||[]).map((b:any)=>b.blocked_id));
    let q = sb.from('dating_profiles').select('*').eq('is_visible',true).neq('user_id',me.id);
    if (me.university) q = q.eq('university', me.university);
    const { data:rows } = await q;
    // 1) hide already-swiped  2) hide blocked  3) respect who each side is
    // looking for  4) rank by shared interests (random within equal overlap)
    const pool = (rows||[])
      .filter((p:DProfile)=>!doneIds.has(p.user_id))
      .filter((p:DProfile)=>!blockedIds.has(p.user_id))
      .filter((p:DProfile)=>mutualFit(myProfile, p))
      .map((p:DProfile)=>({ p, shared: sharedCount(myProfile.interests, p.interests), r: Math.random() }))
      .sort((a,b)=>b.shared-a.shared || a.r-b.r)
      .map(x=>x.p);
    setProfiles(pool);
    setPassed([]);
    setLoading(false);
  };

  const act = async (profile:DProfile, action:'like'|'pass') => {
    setSwipeDir(action==='like'?'right':'left');
    await new Promise(r=>setTimeout(r,260));
    setSwipeDir(null);
    setProfiles(p=>p.slice(1));
    if (action==='like') {
      const sb = createClient();
      await sb.from('dating_likes').insert({ liker_id:me.id, liked_id:profile.user_id });
      const { data:m } = await sb.from('dating_likes').select('id').eq('liker_id',profile.user_id).eq('liked_id',me.id).maybeSingle();
      if (m) setMatchedProfile(profile);
    } else {
      setPassed(prev=>[...prev, profile]);
    }
  };

  const undoPass = () => {
    setPassed(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length-1];
      setProfiles(p=>[last, ...p]);
      return prev.slice(0,-1);
    });
  };

  /* ← pass · → like · ⌫ undo */
  useEffect(() => {
    const onKey = (e:KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || matchedProfile || swipeDir) return;
      const cur = profiles[0];
      if (!cur) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); act(cur,'pass'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); act(cur,'like'); }
      if (e.key === 'Backspace')  { e.preventDefault(); undoPass(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, matchedProfile, swipeDir]);

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'var(--muted)', fontSize:14 }}>Finding people near you…</div>;
  const [cur,nxt,nxt2] = profiles;

  return (
    <>
      {matchedProfile && <MatchModal match={matchedProfile} meId={meId} onClose={()=>setMatchedProfile(null)}/>}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
        <div style={{ fontSize:12, color:'var(--muted)', background:'rgba(18,36,28,0.04)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:100, padding:'6px 18px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><CapIcon /> {me.university||'Your university'} only</span>
        </div>
        {!cur ? (
          <div style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:24, padding:'52px 28px', textAlign:'center', maxWidth:400, width:'100%' }}>
            <div style={{ marginBottom:14, display:'inline-flex', color:'var(--amber)' }}><SparkIcon /></div>
            <p style={{ fontSize:17, fontWeight:700, color:'var(--white)', marginBottom:8 }}>You've seen everyone!</p>
            <p style={{ fontSize:13, color:'var(--muted)', marginBottom:22, lineHeight:1.6 }}>Check back as more students join your campus.</p>
            <button onClick={load} style={{ height:42, padding:'0 28px', borderRadius:100, background:'var(--amber)', color:'#fff', fontWeight:700, border:'none', cursor:'pointer', fontSize:13 }}>Refresh</button>
          </div>
        ) : (
          <div style={{ position:'relative', width:'100%', maxWidth:420, paddingBottom:22 }}>
            {nxt2 && <div style={{ position:'absolute', top:22, left:22, right:22, bottom:0, borderRadius:28, overflow:'hidden', zIndex:0, opacity:0.38, transform:'scale(0.94)', transformOrigin:'bottom center', pointerEvents:'none' }}><ProfileCard profile={nxt2} myInterests={myProfile.interests}/></div>}
            {nxt  && <div style={{ position:'absolute', top:11, left:11, right:11, bottom:-11, borderRadius:28, overflow:'hidden', zIndex:1, opacity:0.68, transform:'scale(0.97)', transformOrigin:'bottom center', pointerEvents:'none' }}><ProfileCard profile={nxt} myInterests={myProfile.interests}/></div>}
            <div style={{ position:'relative', zIndex:2, borderRadius:28, overflow:'hidden', transition:'transform 0.26s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.26s ease', transform:swipeDir==='right'?'translateX(145%) rotate(22deg)':swipeDir==='left'?'translateX(-145%) rotate(-22deg)':'none', opacity:swipeDir?0:1 }}>
              {swipeDir==='right' && <div style={{ position:'absolute', inset:0, zIndex:10, background:'rgba(18,161,80,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}><Heart size={60} color="#12A150" /></div>}
              {swipeDir==='left'  && <div style={{ position:'absolute', inset:0, zIndex:10, background:'rgba(194,91,78,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:72 }}>✕</div>}
              <ProfileCard profile={cur} myInterests={myProfile.interests}/>
            </div>
            <div style={{ display:'flex', gap:20, justifyContent:'center', alignItems:'center', marginTop:24, position:'relative', zIndex:3 }}>
              {passed.length > 0 && (
                <button onClick={undoPass} title="Undo last pass (Backspace)" style={{ width:46, height:46, borderRadius:'50%', background:'#fff', border:'1.5px solid rgba(228,168,58,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, cursor:'pointer', color:'#E0A81E', boxShadow:'0 6px 16px rgba(18,36,28,0.10)', transition:'transform 0.15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.1)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>↩</button>
              )}
              <button onClick={()=>act(cur,'pass')} title="Pass (←)" style={{ width:64, height:64, borderRadius:'50%', background:'#fff', border:'2px solid rgba(194,91,78,0.30)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#C25B4E', cursor:'pointer', transition:'all 0.15s', boxShadow:'0 8px 20px rgba(194,91,78,0.14)' }}
                onMouseEnter={e=>{(e.currentTarget.style.background='#C25B4E');(e.currentTarget.style.color='#fff');(e.currentTarget.style.borderColor='#C25B4E');(e.currentTarget.style.transform='scale(1.08)');}}
                onMouseLeave={e=>{(e.currentTarget.style.background='#fff');(e.currentTarget.style.color='#C25B4E');(e.currentTarget.style.borderColor='rgba(194,91,78,0.30)');(e.currentTarget.style.transform='scale(1)');}}>✕</button>
              <button onClick={()=>act(cur,'like')} title="Like (→)" style={{ width:74, height:74, borderRadius:'50%', background:'linear-gradient(135deg,#7C6BD1,#12A150)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s', boxShadow:'0 10px 26px rgba(124,107,209,0.42)' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.1)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
                <Heart size={30} color="#fff" />
              </button>
            </div>
            <div style={{ textAlign:'center', fontSize:11, color:'var(--muted)', marginTop:10 }}>
              {profiles.length} profile{profiles.length!==1?'s':''} remaining · sorted by shared interests · ← pass · → like
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Liked You ───────────────────────────────────────────────────────────────*/
function LikedYouView({ me }: { me:Me }) {
  const [likers, setLikers] = useState<DProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string|null>(null);
  const [viewing, setViewing] = useState<DProfile|null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const sb = createClient();
    const { data:them } = await sb.from('dating_likes').select('liker_id').eq('liked_id', me.id);
    const theirIds = (them||[]).map((l:any)=>l.liker_id);
    if (!theirIds.length) { setLoading(false); return; }
    const [{ data:mine }, { data:blocked }] = await Promise.all([
      sb.from('dating_likes').select('liked_id').eq('liker_id', me.id),
      sb.from('dating_blocks').select('blocked_id').eq('blocker_id', me.id),
    ]);
    const myLiked = new Set((mine||[]).map((l:any)=>l.liked_id));
    const blockedIds = new Set((blocked||[]).map((b:any)=>b.blocked_id));
    const pending = theirIds.filter((id:string)=>!myLiked.has(id) && !blockedIds.has(id));
    if (!pending.length) { setLoading(false); return; }
    const { data:rows } = await sb.from('dating_profiles').select('*').in('user_id',pending).eq('is_visible',true);
    setLikers(rows||[]);
    setLoading(false);
  };

  const act = async (profile:DProfile, like:boolean) => {
    setActingOn(profile.user_id);
    if (like) await createClient().from('dating_likes').insert({ liker_id:me.id, liked_id:profile.user_id });
    setLikers(p=>p.filter(x=>x.user_id!==profile.user_id));
    setViewing(null); setActingOn(null);
  };

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'var(--muted)', fontSize:14 }}>Loading…</div>;
  if (!likers.length) return (
    <div style={{ textAlign:'center', padding:'56px 24px' }}>
      <div style={{ marginBottom:12, display:'inline-flex', color:'var(--muted)' }}><BigEye /></div>
      <p style={{ fontSize:17, fontWeight:700, color:'var(--white)', marginBottom:8 }}>No new likes yet</p>
      <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>When someone likes your profile, they'll appear here.</p>
    </div>
  );

  return (
    <>
      {viewing && (
        <div style={OVERLAY} onClick={e=>{ if(e.target===e.currentTarget) setViewing(null); }}>
          <div style={{ width:'100%', maxWidth:420, maxHeight:'92vh', overflowY:'auto', borderRadius:28, background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.09)', position:'relative' }}>
            <button onClick={()=>setViewing(null)} style={{ position:'absolute', top:14, right:14, zIndex:10, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'none', color:'var(--white)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            <div style={{ background:'linear-gradient(135deg,rgba(124,107,209,0.15),rgba(18,161,80,0.08))', padding:'12px 20px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(18,36,28,0.09)' }}>
              <span style={{ display:'inline-flex', color:'#7C6BD1' }}><Heart size={20} color="#7C6BD1" /></span>
              <span style={{ fontSize:14, fontWeight:700, color:'#7C6BD1' }}>{viewing.display_name} liked your profile</span>
            </div>
            <ProfileCard profile={viewing} />
            <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(18,36,28,0.09)', display:'flex', gap:12, alignItems:'center' }}>
              <button onClick={()=>act(viewing,false)} disabled={actingOn===viewing.user_id} style={{ flex:1, height:50, borderRadius:14, background:'transparent', border:'1px solid rgba(194,91,78,0.4)', color:'#C25B4E', cursor:'pointer', fontSize:14, fontWeight:700 }}>✕ Pass</button>
              <button onClick={()=>act(viewing,true)}  disabled={actingOn===viewing.user_id} style={{ flex:1, height:50, borderRadius:14, background:'linear-gradient(135deg,#7C6BD1,#12A150)', border:'none', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Heart size={16} color="#fff" /> Like back</button>
              <SafetyMenu profile={viewing} showReport={false} onBlocked={()=>{ setLikers(p=>p.filter(x=>x.user_id!==viewing.user_id)); setViewing(null); }}/>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:4 }}>{likers.length} person{likers.length!==1?'s':''} liked your profile</p>
        {likers.map(p=>(
          <div key={p.id} style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:18, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}
            onClick={()=>setViewing(p)} onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(124,107,209,0.4)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(18,36,28,0.09)')}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <Avi photo={allPhotos(p)[0]} name={p.display_name} size={58}/>
              <div style={{ position:'absolute', bottom:-2, right:-2, background:'linear-gradient(135deg,#7C6BD1,#12A150)', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--navy2)', color:'#fff' }}><Heart size={10} color="#fff" /></div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--white)' }}>{p.display_name}{p.age?`, ${p.age}`:''}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{[p.major, p.year_of_study, p.hometown].filter(Boolean).join(' · ')}</div>
              {p.bio && <div style={{ fontSize:13, color:'var(--muted)', marginTop:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.bio}</div>}
              {p.interests?.length>0 && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                  {p.interests.slice(0,3).map(i=><span key={i} style={{ fontSize:10, padding:'3px 8px', borderRadius:100, background:'rgba(124,107,209,0.1)', color:'#7C6BD1', border:'1px solid rgba(124,107,209,0.15)' }}>{i}</span>)}
                  {p.interests.length>3 && <span style={{ fontSize:10, padding:'3px 8px', borderRadius:100, color:'var(--muted)' }}>+{p.interests.length-3}</span>}
                </div>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }}>
              <span style={{ fontSize:11, color:'var(--amber)', fontWeight:700 }}>View →</span>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <button onClick={e=>{ e.stopPropagation(); act(p,false); }} disabled={actingOn===p.user_id} style={{ width:38, height:38, borderRadius:'50%', background:'transparent', border:'1px solid rgba(194,91,78,0.35)', color:'#C25B4E', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                <button onClick={e=>{ e.stopPropagation(); act(p,true); }}  disabled={actingOn===p.user_id} style={{ width:38, height:38, borderRadius:'50%', background:'var(--amber)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Heart size={16} color="#fff" /></button>
                <SafetyMenu profile={p} showReport={false} onBlocked={()=>setLikers(prev=>prev.filter(x=>x.user_id!==p.user_id))}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Matches ─────────────────────────────────────────────────────────────────*/
function MatchesView({ me }: { me:Me }) {
  const [matches, setMatches] = useState<DProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<DProfile|null>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data:iLiked } = await sb.from('dating_likes').select('liked_id').eq('liker_id', me.id);
      const iIds = (iLiked||[]).map((l:any)=>l.liked_id);
      if (!iIds.length) { setLoading(false); return; }
      const { data:theyLiked } = await sb.from('dating_likes').select('liker_id').eq('liked_id', me.id).in('liker_id', iIds);
      const mutual = (theyLiked||[]).map((l:any)=>l.liker_id);
      if (!mutual.length) { setLoading(false); return; }
      const { data:profiles } = await sb.from('dating_profiles').select('*').in('user_id', mutual);
      setMatches(profiles||[]); setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'var(--muted)', fontSize:14 }}>Loading matches…</div>;
  if (!matches.length) return (
    <div style={{ textAlign:'center', padding:'56px 24px' }}>
      <div style={{ marginBottom:12, display:'inline-flex', color:'rgba(194,91,78,0.6)' }}><Heart size={44} color="rgba(194,91,78,0.6)" filled={false} /></div>
      <p style={{ fontSize:17, fontWeight:700, color:'var(--white)', marginBottom:8 }}>No matches yet</p>
      <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>When you and someone both like each other, they'll show up here.</p>
    </div>
  );

  return (
    <>
      {viewing && (
        <div style={OVERLAY} onClick={e=>{ if(e.target===e.currentTarget) setViewing(null); }}>
          <div style={{ width:'100%', maxWidth:420, maxHeight:'92vh', overflowY:'auto', borderRadius:28, background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.09)', position:'relative' }}>
            <button onClick={()=>setViewing(null)} style={{ position:'absolute', top:14, right:14, zIndex:10, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'none', color:'var(--white)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            <div style={{ background:'linear-gradient(135deg,rgba(18,161,80,0.12),rgba(18,161,80,0.08))', padding:'12px 20px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(18,36,28,0.09)' }}>
              <span style={{ display:'inline-flex', color:'var(--green)' }}><Heart size={20} color="#12A150" /></span>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--green)' }}>It's a match with {viewing.display_name}!</span>
            </div>
            <ProfileCard profile={viewing} />
            <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(18,36,28,0.09)', display:'flex', gap:12, alignItems:'center' }}>
              <button onClick={()=>setViewing(null)} style={{ flex:1, height:50, borderRadius:14, background:'transparent', border:'1px solid rgba(18,36,28,0.09)', color:'var(--muted)', cursor:'pointer', fontSize:14, fontWeight:700 }}>Close</button>
              <Link href={`/student/dating/chat?to=${viewing.user_id}`} style={{ flex:2, height:50, borderRadius:14, background:'var(--amber)', border:'none', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:800, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <ChatIcon /> Send a message
              </Link>
              <SafetyMenu profile={viewing} onBlocked={()=>{ setMatches(p=>p.filter(x=>x.user_id!==viewing.user_id)); setViewing(null); }}/>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:4 }}>{matches.length} mutual match{matches.length!==1?'es':''}</p>
        {matches.map(m => {
          const pic = allPhotos(m)[0];
          return (
            <div key={m.id} onClick={()=>setViewing(m)} style={{ background:'var(--navy2)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:18, overflow:'hidden', cursor:'pointer' }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(18,161,80,0.35)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(18,36,28,0.09)')}>
              <div style={{ display:'flex', alignItems:'stretch' }}>
                <div style={{ width:80, flexShrink:0, background:'#E7F1EA', position:'relative' }}>
                  {pic ? <img src={pic} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ width:80, height:80, display:'flex', alignItems:'center', justifyContent:'center' }}><Avi name={m.display_name} size={60}/></div>}
                  <div style={{ position:'absolute', bottom:6, right:6, width:12, height:12, borderRadius:'50%', background:'var(--green)', border:'2px solid var(--navy2)' }}/>
                </div>
                <div style={{ flex:1, padding:'14px 16px', minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:16, fontWeight:700, color:'var(--white)' }}>{m.display_name}{m.age?`, ${m.age}`:''}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:'rgba(18,161,80,0.12)', color:'var(--green)', border:'1px solid rgba(18,161,80,0.25)', flexShrink:0 }}>MATCH</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>{[m.gender, m.major, m.year_of_study].filter(Boolean).join(' · ')}</div>
                  {m.bio && <div style={{ fontSize:13, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:8 }}>{m.bio}</div>}
                  {m.interests?.length>0 && (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {m.interests.slice(0,3).map(i=><span key={i} style={{ fontSize:10, padding:'3px 8px', borderRadius:100, background:'rgba(124,107,209,0.1)', color:'#7C6BD1', border:'1px solid rgba(124,107,209,0.15)' }}>{i}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 14px', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:11, color:'var(--amber)', fontWeight:700 }}>View →</span>
                  <Link href={`/student/dating/chat?to=${m.user_id}`} onClick={e=>e.stopPropagation()} style={{ height:38, padding:'0 16px', lineHeight:'38px', borderRadius:100, background:'var(--amber)', color:'#fff', fontSize:12, fontWeight:800, textDecoration:'none', whiteSpace:'nowrap' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><ChatIcon /> Text</span>
                  </Link>
                  <SafetyMenu profile={m} onBlocked={()=>setMatches(p=>p.filter(x=>x.user_id!==m.user_id))}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────────*/
export default function DatingPage() {
  const [me, setMe]               = useState<Me|null>(null);
  const [myProfile, setMyProfile] = useState<DProfile|null>(null);
  const [meId, setMeId]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'discover'|'liked'|'matches'>('discover');
  const [showSetup, setShowSetup] = useState(false);
  const [showEdit, setShowEdit]   = useState(false);
  const [likedCount, setLikedCount] = useState(0);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data:{user} } = await sb.auth.getUser();
      if (!user) { window.location.href='/auth/login'; return; }
      setMeId(user.id);
      const { data:u }  = await sb.from('users').select('plan,full_name,avatar_url').eq('id', user.id).single();
      const { data:sp } = await sb.from('student_profiles').select('university').eq('user_id', user.id).maybeSingle();
      setMe({ id:user.id, plan:u?.plan||'free', university:sp?.university||'', full_name:u?.full_name||'', avatar_url:u?.avatar_url||'' });
      // Campus Connect is free during Beta — load profile/likes for everyone,
      // not just plus/pro members.
      if (BETA_MODE || ['plus','pro'].includes(u?.plan||'')) {
        const { data:dp } = await sb.from('dating_profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (dp) setMyProfile(dp as DProfile); else setShowSetup(true);
        // pending likes → badge on the "Liked You" tab
        const { data:them } = await sb.from('dating_likes').select('liker_id').eq('liked_id', user.id);
        const theirIds = (them||[]).map((l:any)=>l.liker_id);
        if (theirIds.length) {
          const { data:mine } = await sb.from('dating_likes').select('liked_id').eq('liker_id', user.id);
          const myLiked = new Set((mine||[]).map((l:any)=>l.liked_id));
          setLikedCount(theirIds.filter((id:string)=>!myLiked.has(id)).length);
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <StudentLayout title="Campus Connect"><div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400, color:'var(--muted)', fontSize:14 }}>Loading…</div></StudentLayout>;

  // Campus Connect is a FREE beta feature — everyone gets in during Beta.
  // (The premium gate is preserved for post-beta via the feature flag.)
  const isPremium = BETA_MODE || (me ? ['plus','pro'].includes(me.plan) : false);
  const TABS = [
    { key:'discover', label:'Discover', Icon: SearchIcon },
    { key:'liked',    label:'Liked You', Icon: () => <Heart size={14} /> },
    { key:'matches',  label:'Matches',  Icon: () => <Heart size={14} /> },
  ] as const;

  return (
    <StudentLayout title="Campus Connect">
      <div style={{ maxWidth:680, margin:'0 auto 14px', display:'flex', justifyContent:'flex-end' }}>
        <PointsBadge />
      </div>
      {showSetup && me && <SetupModal me={me} onSave={p=>{ setMyProfile(p); setShowSetup(false); }}/>}
      {showEdit && myProfile && me && <EditModal profile={myProfile} me={me} onClose={()=>setShowEdit(false)} onSave={p=>setMyProfile(p)} onDelete={()=>{ setMyProfile(null); setShowEdit(false); setShowSetup(true); }}/>}

      {!isPremium ? <PremiumGate/> : (
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:13 }}>
              <div style={{ width:46, height:46, borderRadius:15, background:'linear-gradient(135deg,#7C6BD1,#12A150)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 20px rgba(124,107,209,0.30)', flexShrink:0 }}><Heart size={22} color="#fff" /></div>
              <div>
                <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.6, color:'var(--white)', marginBottom:2 }}>Campus Connect</h2>
                <p style={{ fontSize:12.5, color:'var(--muted)', display:'inline-flex', alignItems:'center', gap:5 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontWeight:700, color:'#7C6BD1', background:'rgba(124,107,209,0.10)', border:'1px solid rgba(124,107,209,0.22)', borderRadius:100, padding:'2px 9px' }}><LockIcon /> Verified students only</span>
                </p>
              </div>
            </div>
            {myProfile && (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Avi photo={allPhotos(myProfile)[0]} name={myProfile.display_name} size={34}/>
                <button onClick={()=>setShowEdit(true)} style={{ height:34, padding:'0 14px', borderRadius:100, background:'rgba(18,36,28,0.05)', border:'1px solid rgba(18,36,28,0.09)', color:'var(--light)', fontSize:12, cursor:'pointer' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><EditIcon /> Edit</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:4, background:'rgba(18,36,28,0.05)', borderRadius:14, padding:5, marginBottom:24 }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{ flex:1, height:40, borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s', border:'none', background:tab===t.key?'#fff':'transparent', color:tab===t.key?'#7C6BD1':'var(--muted)', boxShadow:tab===t.key?'0 2px 8px rgba(18,36,28,0.08)':'none', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <t.Icon />{t.label}
                {t.key==='liked' && likedCount>0 && (
                  <span style={{ minWidth:17, height:17, borderRadius:100, background:'linear-gradient(135deg,#7C6BD1,#12A150)', color:'#fff', fontSize:10, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>{likedCount>9?'9+':likedCount}</span>
                )}
              </button>
            ))}
          </div>

          {tab==='discover' && me && myProfile && <DiscoverView me={me} meId={meId} myProfile={myProfile}/>}
          {tab==='discover' && me && !myProfile && !showSetup && (
            <div style={{ textAlign:'center', padding:'48px 0' }}>
              <button onClick={()=>setShowSetup(true)} style={{ height:46, padding:'0 32px', borderRadius:100, background:'var(--amber)', color:'#fff', fontWeight:800, border:'none', cursor:'pointer', fontSize:15 }}>Create your profile to start</button>
            </div>
          )}
          {tab==='liked'   && me && <LikedYouView me={me}/>}
          {tab==='matches' && me && <MatchesView me={me}/>}
        </div>
      )}
    </StudentLayout>
  );
}
