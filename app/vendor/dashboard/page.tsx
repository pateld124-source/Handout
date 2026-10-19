'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VendorShell } from '@/components/layout/VendorShell';
import { createClient } from '@/lib/supabase/client';
import { validatePhone, normalizePhone } from '@/lib/validation';
import { LocationSelect } from '@/components/ui/LocationSelect';

/* ── SVG category + stat icons (20×20, stroke-2) ── */
const FoodCatIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const BabyCatIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const NotaryCatIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const TutorCatIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const RidesCatIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const MovingCatIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const CleanCatIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>;
const BeautyCatIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
const TechCatIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const OtherCatIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
/* stat card icons */
const CalStatIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const DoneStatIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const UpcomStatIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const EarnStatIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
/* quick action icons */
const BoxQAIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const EarnQAIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const UserQAIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
/* inline icons */
const FoodInlineIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const SvcInlineIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const PinIcon        = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const ShopIcon       = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const BellIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const RocketIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;

type CatDef = { id: string; Icon: () => React.JSX.Element; label: string; table: string };
const CATS: CatDef[] = [
  { id: 'food',        Icon: FoodCatIcon,   label: 'Food / Tiffin',  table: 'tiffin_listings' },
  { id: 'babysitting', Icon: BabyCatIcon,   label: 'Babysitting',    table: 'service_listings' },
  { id: 'notary',      Icon: NotaryCatIcon, label: 'Notary',         table: 'service_listings' },
  { id: 'tutoring',    Icon: TutorCatIcon,  label: 'Tutoring',       table: 'service_listings' },
  { id: 'rides',       Icon: RidesCatIcon,  label: 'Airport Rides',  table: 'service_listings' },
  { id: 'moving',      Icon: MovingCatIcon, label: 'Moving Help',    table: 'service_listings' },
  { id: 'cleaning',    Icon: CleanCatIcon,  label: 'Cleaning',       table: 'service_listings' },
  { id: 'beauty',      Icon: BeautyCatIcon, label: 'Beauty',         table: 'service_listings' },
  { id: 'tech',        Icon: TechCatIcon,   label: 'Tech / Repair',  table: 'service_listings' },
  { id: 'other',       Icon: OtherCatIcon,  label: 'Other',          table: 'service_listings' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const I:    React.CSSProperties = { width:'100%', height:44, padding:'0 14px', background:'rgba(18,36,28,0.04)', border:'1px solid rgba(18,36,28,0.12)', borderRadius:10, color:'#12241C', fontSize:14, boxSizing:'border-box' };
const L:    React.CSSProperties = { display:'block', fontSize:12, fontWeight:700, color:'#4c6157', marginBottom:7, letterSpacing:0.3 };
const card: React.CSSProperties = { background:'#FFFFFF', border:'1px solid rgba(18,36,28,0.09)', borderRadius:16, padding:20 };
const QA:   React.CSSProperties = { display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(18,36,28,0.04)', border:'1px solid rgba(18,36,28,0.09)', borderRadius:10, color:'#12241C', fontSize:13, fontWeight:700, textDecoration:'none' };

function Pills({ value, onChange, options, multi }: { value: any; onChange: (v: any) => void; options: string[]; multi?: boolean }) {
  const isOn = (o: string) => multi ? (value as string[]).includes(o) : value === o;
  const click = (o: string) => multi ? onChange(isOn(o) ? (value as string[]).filter(x => x !== o) : [...value, o]) : onChange(o);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => click(o)}
          style={{ padding: '9px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: isOn(o) ? 'rgba(18,161,80,0.14)' : 'rgba(18,36,28,0.04)', color: isOn(o) ? '#12A150' : '#4c6157', border: isOn(o) ? '1px solid rgba(18,161,80,0.5)' : '1px solid rgba(18,36,28,0.12)' }}>
          {isOn(o) ? '● ' : '○ '}{o}
        </button>
      ))}
    </div>
  );
}

function Steps({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
      {labels.map((l, i) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', flex: i < labels.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: i <= step ? '#12A150' : 'rgba(18,36,28,0.06)', color: i <= step ? '#ffffff' : '#7d9188', border: i <= step ? 'none' : '1px solid rgba(18,36,28,0.12)' }}>{i < step ? '✓' : i + 1}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: i <= step ? '#12A150' : '#7d9188', whiteSpace: 'nowrap' }}>{l}</span>
          </div>
          {i < labels.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 8px 18px', background: i < step ? '#12A150' : 'rgba(18,36,28,0.09)', borderRadius: 2 }} />}
        </div>
      ))}
    </div>
  );
}

export default function VendorDashboard() {
  const [foods, setFoods] = useState<any[]>([]);
  const [svcs, setSvcs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0, earnings: 0 });
  const [upRows, setUpRows] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // form state
  const [cat, setCat] = useState('food');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  // food
  const [diet, setDiet] = useState('Veg');
  const [cuisine, setCuisine] = useState('North Indian');
  const [mealsPerDay, setMealsPerDay] = useState('1');
  const [menu, setMenu] = useState<Record<string, string>>({});
  const [priceMeal, setPriceMeal] = useState('');
  const [priceWeek, setPriceWeek] = useState('');
  // services
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState('hr');
  const [subject, setSubject] = useState('Math');
  const [level, setLevel] = useState<string[]>(['Beginner']);
  const [mode, setMode] = useState('Both');
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [rideType, setRideType] = useState('Both');
  const [airports, setAirports] = useState<string[]>(['PHL']);
  const [vehicle, setVehicle] = useState('Sedan');
  const [moveSize, setMoveSize] = useState('Small (1–5 items)');
  const [ages, setAges] = useState<string[]>([]);
  const [cleanType, setCleanType] = useState('Standard');
  const [extra, setExtra] = useState('');
  // common
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  const isFood = cat === 'food';
  const catObj = CATS.find(c => c.id === cat)!;

  async function load(meId: string) {
    const supabase = createClient();
    const [{ data: f }, { data: s }, { data: bk }] = await Promise.all([
      supabase.from('tiffin_listings').select('*').eq('user_id', meId).order('created_at', { ascending: false }),
      supabase.from('service_listings').select('*').eq('user_id', meId).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').eq('provider_id', meId).order('created_at', { ascending: false }),
    ]);
    setFoods(f || []); setSvcs(s || []);
    const b = bk || [];
    setStats({
      total: b.length,
      completed: b.filter(x => x.status === 'completed').length,
      upcoming: b.filter(x => x.status === 'confirmed').length,
      earnings: b.filter(x => x.status === 'completed').reduce((a, x) => a + (Number(x.total_price) || 0), 0),
    });
    const up = b.filter((x: any) => x.status === 'pending' || x.status === 'confirmed').slice(0, 3);
    const sids = Array.from(new Set(up.map((x: any) => x.student_id).filter(Boolean)));
    const nm: Record<string, string> = {};
    if (sids.length) { const { data: us } = await supabase.from('public_profiles').select('id,full_name').in('id', sids); (us || []).forEach((u: any) => { nm[u.id] = u.full_name || 'Student'; }); }
    setUpRows(up.map((x: any) => ({ ...x, sName: nm[x.student_id] || 'Student' })));
    setReady(true);
  }

  function resetForm() {
    setStep(0); setCat('food'); setTitle(''); setDesc(''); setDiet('Veg'); setCuisine('North Indian');
    setMealsPerDay('1'); setMenu({}); setPriceMeal(''); setPriceWeek(''); setRate(''); setRateType('hr');
    setSubject('Math'); setLevel(['Beginner']); setMode('Both'); setDocTypes([]); setRideType('Both');
    setAirports(['PHL']); setVehicle('Sedan'); setMoveSize('Small (1–5 items)'); setAges([]); setCleanType('Standard');
    setExtra(''); setLocation(''); setPhone(''); setErr('');
  }

  const weekSavings = (() => {
    const m = parseFloat(priceMeal), w = parseFloat(priceWeek), n = parseInt(mealsPerDay) || 1;
    if (!m || !w) return null;
    const full = m * n * 7;
    if (w >= full) return { pct: 0, full };
    return { pct: Math.round((1 - w / full) * 100), full };
  })();

  function next() {
    setErr('');
    if (step === 0) {
      if (title.trim().length < 4) { setErr('Give it a title (at least 4 characters).'); return; }
      if (desc.trim().length < 10) { setErr('Add a short description (at least 10 characters).'); return; }
    }
    if (step === 1 && isFood) {
      const filled = DAYS.filter(d => (menu[d] || '').trim().length > 0).length;
      if (filled < 7) { setErr(`Please fill the menu for all 7 days (${7 - filled} missing) — students need to see the full week.`); return; }
    }
    if (step === 1 && cat === 'notary' && docTypes.length === 0) { setErr('Pick at least one document type you handle.'); return; }
    if (step === 1 && cat === 'babysitting' && ages.length === 0) { setErr('Pick at least one age group.'); return; }
    if (step === 2) {
      if (isFood) {
        const m = parseFloat(priceMeal), w = parseFloat(priceWeek);
        if (!m || m <= 0) { setErr('Enter a valid price per meal (a number above 0).'); return; }
        if (!w || w <= 0) { setErr('Enter a valid weekly price (a number above 0).'); return; }
        const full = m * (parseInt(mealsPerDay) || 1) * 7;
        if (w >= full) { setErr(`Weekly must be cheaper than paying daily ($${full.toFixed(0)}) — that's the whole point of the weekly plan.`); return; }
      } else {
        const r = parseFloat(rate);
        if (!r || r <= 0) { setErr('Enter a valid rate (a number above 0).'); return; }
      }
      if (!location.trim()) { setErr('Enter your service location / area.'); return; }
      const phoneErr = validatePhone(phone);
      if (phoneErr) { setErr(phoneErr); return; }
    }
    setStep(s => Math.min(s + 1, 3));
  }

  async function publish(meId: string) {
    setSaving(true); setErr('');
    const supabase = createClient();
    let error: any = null;
    if (isFood) {
      ({ error } = await supabase.from('tiffin_listings').insert({
        user_id: meId, name: title.trim(), description: desc.trim(),
        cuisine, diet_type: diet, price_per_meal: parseFloat(priceMeal),
        price_per_week: parseFloat(priceWeek), meals_per_day: parseInt(mealsPerDay),
        weekly_menu: DAYS.map(d => ({ day: d, items: menu[d].trim() })),
        location: location.trim(), contact_phone: normalizePhone(phone), is_active: true,
      }));
    } else {
      const details: any = { note: extra.trim() || undefined };
      if (cat === 'tutoring') { details.subject = subject; details.levels = level; }
      if (cat === 'notary') { details.mode = mode; details.documents = docTypes; }
      if (cat === 'rides') { details.ride_type = rideType; details.airports = airports; details.vehicle = vehicle; }
      if (cat === 'moving') { details.move_size = moveSize; }
      if (cat === 'babysitting') { details.age_groups = ages; }
      if (cat === 'cleaning') { details.clean_type = cleanType; }
      ({ error } = await supabase.from('service_listings').insert({
        user_id: meId, title: title.trim(), category: catObj.label, description: desc.trim(),
        rate: parseFloat(rate), rate_type: rateType, details,
        location: location.trim(), contact_phone: normalizePhone(phone), is_active: true,
      }));
    }
    setSaving(false);
    if (error) { setErr('Could not publish: ' + error.message + (String(error.message).includes('column') ? ' — run db/upgrade-vendor-forms.sql in Supabase.' : '')); return; }
    setShowAdd(false); resetForm(); load(meId);
  }

  async function removeListing(table: string, id: string, meId: string) {
    if (!confirm('Delete this listing?')) return;
    const supabase = createClient();
    await supabase.from(table).delete().eq('id', id);
    load(meId);
  }

  const STAT_CARDS = [
    { label: 'Total bookings',      value: stats.total,                              Icon: CalStatIcon,   color: '#12A150' },
    { label: 'Completed',           value: stats.completed,                          Icon: DoneStatIcon,  color: '#12A150' },
    { label: 'Accepted / upcoming', value: stats.upcoming,                           Icon: UpcomStatIcon, color: '#7C6BD1' },
    { label: 'Total earnings',      value: `$${stats.earnings.toLocaleString()}`,    Icon: EarnStatIcon,  color: '#E08A1E' },
  ];

  return (
    <VendorShell active="Dashboard" title="Dashboard">
      {(me) => {
        if (me && !ready) load(me.id);
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
              {STAT_CARDS.map(sc => (
                <div key={sc.label} style={{ ...card, borderTop: `3px solid ${sc.color}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, borderRadius: '50%', background: sc.color + '0A', transform: 'translate(20px,-20px)', pointerEvents: 'none' }} />
                  <div style={{ color: sc.color, display: 'inline-flex' }}><sc.Icon /></div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#12241C', marginTop: 8, lineHeight: 1 }}>{ready ? sc.value : <span style={{ opacity: 0.3 }}>—</span>}</div>
                  <div style={{ fontSize: 11, color: '#7d9188', marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{sc.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginBottom: 22 }}>
              <div style={{ ...card, padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid rgba(18,36,28,0.07)' }}>
                  <span style={{ fontWeight: 800, color: '#12241C', fontSize: 14 }}>Upcoming bookings</span>
                  <Link href="/vendor/orders" style={{ color: '#12A150', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
                </div>
                {!ready ? <div style={{ padding: 16, color: '#7d9188', fontSize: 13 }}>Loading…</div> :
                upRows.length === 0 ? <div style={{ padding: 18, color: '#7d9188', fontSize: 13 }}>No requests yet — when students book you, they show up here.</div> :
                upRows.map((b: any) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid rgba(18,36,28,0.05)' }}>
                    <span style={{ display:'inline-flex', color: b.listing_type === 'tiffin' ? '#E08A1E' : '#7C6BD1' }}>{b.listing_type === 'tiffin' ? <FoodInlineIcon /> : <SvcInlineIcon />}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#12241C' }}>{b.sName}</div>
                      <div style={{ fontSize: 11, color: '#7d9188' }}>{new Date(b.created_at).toLocaleDateString()}{b.total_price != null ? ` · $${b.total_price}` : ''}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100, color: b.status === 'pending' ? '#E08A1E' : '#12A150', background: 'rgba(18,36,28,0.05)', border: `1px solid ${b.status === 'pending' ? '#E08A1E' : '#12A150'}44` }}>{b.status === 'confirmed' ? 'accepted' : b.status}</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ fontWeight: 800, color: '#12241C', fontSize: 14, marginBottom: 12 }}>Quick actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => { resetForm(); setShowAdd(true); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(18,161,80,0.1)', border: '1px solid rgba(18,161,80,0.35)', borderRadius: 10, color: '#12A150', fontSize: 13, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>＋ Add new listing</button>
                  <Link href="/vendor/orders"   style={QA}><span style={{ display:'inline-flex', opacity:0.7 }}><BoxQAIcon  /></span> Manage orders</Link>
                  <Link href="/vendor/earnings" style={QA}><span style={{ display:'inline-flex', opacity:0.7 }}><EarnQAIcon /></span> Earnings</Link>
                  <Link href="/vendor/analytics"style={QA}><span style={{ display:'inline-flex', opacity:0.7 }}><RocketIcon /></span> Analytics</Link>
                  <Link href="/vendor/profile"  style={QA}><span style={{ display:'inline-flex', opacity:0.7 }}><UserQAIcon /></span> My profile</Link>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#12241C' }}>My listings</h2>
              <button onClick={() => { resetForm(); setShowAdd(true); }} style={{ padding: '10px 20px', background: '#12A150', color: '#ffffff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Add new service</button>
            </div>

            {ready && foods.length === 0 && svcs.length === 0 && !showAdd && (
              <div style={{ ...card, borderStyle: 'dashed', textAlign: 'center', padding: 44 }}>
                <div style={{ marginBottom: 10, color: '#7d9188', display: 'inline-flex' }}><ShopIcon /></div>
                <p style={{ color: '#4c6157', fontSize: 15, marginBottom: 4 }}>No listings yet.</p>
                <p style={{ color: '#7d9188', fontSize: 13 }}>Tap "+ Add new service" — the new form walks you through it step by step.</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14 }}>
              {foods.map(f => (
                <div key={'f' + f.id} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(18,161,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#E08A1E' }}><FoodCatIcon /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#12241C', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: '#7d9188', marginTop: 2 }}>{f.cuisine} · {f.diet_type}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(18,161,80,0.1)', color: '#12A150', fontWeight: 700 }}>${f.price_per_meal}/meal</span>
                    {f.price_per_week && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(18,161,80,0.1)', color: '#12A150', fontWeight: 700 }}>${f.price_per_week}/week</span>}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(18,161,80,0.1)', color: '#12A150', fontWeight: 700 }}>● Live</span>
                    <button onClick={() => removeListing('tiffin_listings', f.id, me.id)} style={{ padding: '6px 14px', background: 'transparent', color: '#C25B4E', border: '1px solid rgba(194,91,78,0.3)', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
              {svcs.map(s => (
                <div key={'s' + s.id} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,107,209,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#7C6BD1' }}>
                      {(() => { const C = CATS.find(c => c.label === s.category)?.Icon || OtherCatIcon; return <C />; })()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#12241C', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: '#7d9188', marginTop: 2 }}>{s.category}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(18,161,80,0.1)', color: '#12A150', fontWeight: 700 }}>${s.rate}/{s.rate_type}</span>
                    {s.location && <span style={{ fontSize: 11, color: '#7d9188', marginLeft: 8, display:'inline-flex', alignItems:'center', gap:3 }}><PinIcon />{s.location}</span>}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(18,161,80,0.1)', color: '#12A150', fontWeight: 700 }}>● Live</span>
                    <button onClick={() => removeListing('service_listings', s.id, me.id)} style={{ padding: '6px 14px', background: 'transparent', color: '#C25B4E', border: '1px solid rgba(194,91,78,0.3)', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {showAdd && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 16px', overflowY: 'auto' }} onClick={() => setShowAdd(false)}>
                <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: 'var(--navy2)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 20, padding: 26 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: '#12241C', display:'flex', alignItems:'center', gap:8 }}>{catObj && <span style={{ display:'inline-flex', color:'#12A150' }}><catObj.Icon /></span>} New {isFood ? 'Tiffin / Food service' : catObj?.label} listing</h3>
                    <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: '#7d9188', fontSize: 22, cursor: 'pointer' }}>×</button>
                  </div>

                  <Steps step={step} labels={['Basic Info', isFood ? 'Meals & Menu' : 'Details', 'Pricing & Location', 'Review']} />

                  {step === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={L}>What are you offering?</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8 }}>
                          {CATS.map(c => (
                            <button key={c.id} type="button" onClick={() => setCat(c.id)} style={{ padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: cat === c.id ? 'rgba(18,161,80,0.12)' : 'rgba(18,36,28,0.04)', border: cat === c.id ? '1px solid rgba(18,161,80,0.5)' : '1px solid rgba(18,36,28,0.09)' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', color: cat === c.id ? '#12A150' : '#7d9188', marginBottom: 4 }}><c.Icon /></div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: cat === c.id ? '#12A150' : '#4c6157' }}>{c.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><label style={L}>Title</label><input style={I} value={title} onChange={e => setTitle(e.target.value)} placeholder={isFood ? "e.g. Anaya's Home Kitchen" : 'e.g. Math & CS tutoring by a Rowan senior'} /></div>
                      <div><label style={L}>Description</label><textarea style={{ ...I, height: 90, padding: 12, resize: 'vertical' }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tell students what makes your service great…" /></div>
                    </div>
                  )}

                  {step === 1 && isFood && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div><label style={L}>Meal type</label><Pills value={diet} onChange={setDiet} options={['Veg', 'Non-Veg', 'Eggetarian', 'Vegan']} /></div>
                      <div><label style={L}>Cuisine</label><Pills value={cuisine} onChange={setCuisine} options={['North Indian', 'South Indian', 'Gujarati', 'Punjabi', 'Jain', 'Other']} /></div>
                      <div>
                        <label style={L}>Meals per day</label>
                        <select style={{ ...I, cursor: 'pointer' }} value={mealsPerDay} onChange={e => setMealsPerDay(e.target.value)}>
                          <option value="1">1 meal / day</option><option value="2">2 meals / day</option><option value="3">3 meals / day</option>
                        </select>
                      </div>
                      <div>
                        <label style={L}>Weekly menu <span style={{ color: '#7d9188', fontWeight: 400 }}>(required — students must see the full week)</span></label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {DAYS.map(d => (
                            <div key={d} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ width: 86, fontSize: 12, fontWeight: 700, color: '#4c6157', flexShrink: 0 }}>{d}</span>
                              <input style={{ ...I, height: 40 }} value={menu[d] || ''} onChange={e => setMenu(m => ({ ...m, [d]: e.target.value }))} placeholder="e.g. Dal, rice, 2 sabzi, 4 roti, salad" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && !isFood && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {cat === 'tutoring' && <>
                        <div><label style={L}>Subject</label><select style={{ ...I, cursor: 'pointer' }} value={subject} onChange={e => setSubject(e.target.value)}>{['Math', 'Science', 'Computer Science', 'English', 'Business', 'Test Prep', 'Other'].map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label style={L}>Levels you teach</label><Pills multi value={level} onChange={setLevel} options={['Beginner', 'Intermediate', 'Advanced']} /></div>
                      </>}
                      {cat === 'notary' && <>
                        <div><label style={L}>How do you operate?</label><Pills value={mode} onChange={setMode} options={['Online', 'In-person', 'Both']} /></div>
                        <div><label style={L}>Document types you handle</label><Pills multi value={docTypes} onChange={setDocTypes} options={['Affidavits', 'Lease / housing', 'Immigration forms', 'Power of attorney', 'Academic forms', 'Other']} /></div>
                      </>}
                      {cat === 'rides' && <>
                        <div><label style={L}>Ride type</label><Pills value={rideType} onChange={setRideType} options={['Pickup', 'Drop-off', 'Both']} /></div>
                        <div><label style={L}>Airports covered</label><Pills multi value={airports} onChange={setAirports} options={['PHL', 'EWR', 'JFK', 'ACY', 'Other']} /></div>
                        <div><label style={L}>Vehicle</label><select style={{ ...I, cursor: 'pointer' }} value={vehicle} onChange={e => setVehicle(e.target.value)}>{['Sedan (4 seats)', 'SUV (6 seats)', 'Van (7+ seats)'].map(v => <option key={v}>{v}</option>)}</select></div>
                      </>}
                      {cat === 'moving' && <div><label style={L}>Move size you handle</label><Pills value={moveSize} onChange={setMoveSize} options={['Small (1–5 items)', 'Medium (6–15 items)', 'Large (16+ items)']} /></div>}
                      {cat === 'babysitting' && <div><label style={L}>Age groups</label><Pills multi value={ages} onChange={setAges} options={['Infant (0–1)', 'Toddler (1–3)', 'Preschool (3–5)', 'School age (5+)']} /></div>}
                      {cat === 'cleaning' && <div><label style={L}>Cleaning type</label><Pills value={cleanType} onChange={setCleanType} options={['Standard', 'Deep clean', 'Move-in / Move-out']} /></div>}
                      <div><label style={L}>Anything else students should know? <span style={{ color: '#7d9188', fontWeight: 400 }}>(optional)</span></label><input style={I} value={extra} onChange={e => setExtra(e.target.value)} placeholder="e.g. Weekends only, bring your own materials…" /></div>
                    </div>
                  )}

                  {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {isFood ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={L}>Price per meal ($)</label><input style={I} type="number" min="1" value={priceMeal} onChange={e => setPriceMeal(e.target.value)} placeholder="8" /></div>
                            <div><label style={L}>Price per week ($)</label><input style={I} type="number" min="1" value={priceWeek} onChange={e => setPriceWeek(e.target.value)} placeholder="45" /></div>
                          </div>
                          {weekSavings && (
                            <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: weekSavings.pct > 0 ? 'rgba(18,161,80,0.08)' : 'rgba(194,91,78,0.08)', border: `1px solid ${weekSavings.pct > 0 ? 'rgba(18,161,80,0.3)' : 'rgba(194,91,78,0.3)'}`, color: weekSavings.pct > 0 ? '#12A150' : '#C25B4E' }}>
                              {weekSavings.pct > 0
                                ? <>✓ Weekly plan saves students <b>{weekSavings.pct}%</b> vs paying per meal (${weekSavings.full.toFixed(0)}). Bigger commitment, bigger discount — exactly right.</>
                                : <>Your weekly price isn't cheaper than 7 days of meals (${weekSavings.full.toFixed(0)}). Lower it so the week plan is the better deal.</>}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div><label style={L}>Rate ($)</label><input style={I} type="number" min="1" value={rate} onChange={e => setRate(e.target.value)} placeholder="25" /></div>
                          <div><label style={L}>Per</label><select style={{ ...I, cursor: 'pointer' }} value={rateType} onChange={e => setRateType(e.target.value)}><option value="hr">hour</option><option value="session">session</option><option value="trip">trip</option><option value="job">job</option></select></div>
                        </div>
                      )}
                      <div><label style={L}>Location / area</label><LocationSelect value={location} onChange={setLocation} placeholder="e.g. Glassboro, NJ — near Rowan" inputStyle={I} /></div>
                      <div><label style={L}>Contact phone</label><input style={I} type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(normalizePhone(e.target.value))} placeholder="8561234567" maxLength={10} /></div>
                    </div>
                  )}

                  {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                      <div style={{ ...card, padding: 16 }}>
                        <div style={{ fontWeight: 800, color: '#12241C', fontSize: 15, display:'flex', alignItems:'center', gap:6 }}>{catObj && <span style={{ display:'inline-flex', color:'#12A150' }}><catObj.Icon /></span>}{title}</div>
                        <div style={{ color: '#4c6157', marginTop: 6, lineHeight: 1.5 }}>{desc}</div>
                        <div style={{ color: '#7d9188', marginTop: 10 }}>
                          {isFood
                            ? <>{diet} · {cuisine} · {mealsPerDay} meal(s)/day<br /><span style={{ color: '#12A150', fontWeight: 700 }}>${priceMeal}/meal</span> · <span style={{ color: '#12A150', fontWeight: 700 }}>${priceWeek}/week</span>{weekSavings && weekSavings.pct > 0 ? ` (${weekSavings.pct}% off)` : ''}</>
                            : <><span style={{ color: '#12A150', fontWeight: 700 }}>${rate}/{rateType}</span></>}
                          <br />{location} · {phone}
                        </div>
                        {isFood && (
                          <div style={{ marginTop: 10, borderTop: '1px solid rgba(18,36,28,0.07)', paddingTop: 10 }}>
                            {DAYS.map(d => <div key={d} style={{ color: '#4c6157', padding: '2px 0' }}><b style={{ color: '#12241C' }}>{d.slice(0, 3)}:</b> {menu[d]}</div>)}
                          </div>
                        )}
                      </div>
                      <p style={{ color: '#7d9188' }}>Look good? Publish and it goes live on Browse immediately.</p>
                    </div>
                  )}

                  {err && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(194,91,78,0.08)', border: '1px solid rgba(194,91,78,0.3)', borderRadius: 10, color: '#C25B4E', fontSize: 13 }}>{err}</div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <button onClick={() => step === 0 ? setShowAdd(false) : setStep(s => s - 1)} style={{ padding: '11px 20px', background: 'rgba(18,36,28,0.05)', color: '#4c6157', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{step === 0 ? 'Cancel' : '← Back'}</button>
                    {step < 3
                      ? <button onClick={next} style={{ padding: '11px 24px', background: '#12A150', color: '#ffffff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Next: {['Details', 'Pricing', 'Review'][step]} →</button>
                      : <button disabled={saving} onClick={() => publish(me.id)} style={{ padding: '11px 26px', background: '#12A150', color: '#ffffff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Publishing…' : <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><RocketIcon /> Publish listing</span>}</button>}
                  </div>
                </div>
              </div>
            )}
          </>
        );
      }}
    </VendorShell>
  );
}
