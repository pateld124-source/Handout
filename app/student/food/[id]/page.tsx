'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { fetchUserPlan, applyDiscount, type UserPlan } from '@/lib/plan-discounts';
import { useCart } from '@/lib/cart-store';
import { QuickOrderModal } from '@/components/food/QuickOrderModal';

const REVIEW_DELAY_MS = 30 * 60 * 1000; // 30 minutes

/* ── SVG icons ── */
const BackIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const StarFilled = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const StarEmpty = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const CartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const MessageIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const FoodIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);
const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ── Review modal ── */
function ReviewModal({ listingId, listingName, vendorId, onClose, onSubmitted }: {
  listingId: string; listingName: string; vendorId: string;
  onClose: () => void; onSubmitted: () => void;
}) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  async function submit() {
    if (rating === 0) { setErr('Pick a star rating first'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Not signed in'); setSaving(false); return; }
    const { error } = await supabase.from('reviews').insert({
      reviewer_id:  user.id,
      reviewee_id:  vendorId,
      listing_type: 'tiffin',
      listing_id:   listingId,
      rating,
      comment: comment.trim() || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    // Mark reviewed in localStorage
    const pending: any[] = JSON.parse(localStorage.getItem('handout_pending_reviews') || '[]');
    const updated = pending.map(p => p.listingId === listingId ? { ...p, reviewed: true } : p);
    localStorage.setItem('handout_pending_reviews', JSON.stringify(updated));
    onSubmitted();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--navy2)', border: '1px solid rgba(18,36,28,0.12)', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(18,36,28,0.07)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <XIcon />
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--white)', marginBottom: 4, letterSpacing: -0.4 }}>How was your meal?</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{listingName}</div>
        </div>

        {/* Star selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
          {[1,2,3,4,5].map(n => (
            <button key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.1s', transform: hover === n || rating === n ? 'scale(1.25)' : 'scale(1)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24"
                fill={n <= (hover || rating) ? '#FBBF24' : 'none'}
                stroke={n <= (hover || rating) ? '#FBBF24' : 'rgba(255,255,255,0.2)'}
                strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#FBBF24', fontWeight: 700, marginTop: -12, marginBottom: 16 }}>
            {['','Terrible','Poor','Okay','Good','Amazing!'][rating]}
          </div>
        )}

        {/* Comment */}
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell others what you liked (optional)…"
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(18,36,28,0.05)', border: '1px solid rgba(18,36,28,0.09)', borderRadius: 12, padding: '12px 14px', color: 'var(--white)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            onFocus={e => (e.target.style.borderColor = 'rgba(18,161,80,0.4)')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(18,36,28,0.09)')}
          />
        </div>

        {err && <div style={{ fontSize: 12, color: '#C25B4E', marginBottom: 12 }}>{err}</div>}

        <button onClick={submit} disabled={saving || rating === 0}
          style={{ width: '100%', height: 46, background: rating > 0 ? 'var(--amber)' : 'rgba(18,36,28,0.06)', border: 'none', borderRadius: 12, color: rating > 0 ? '#ffffff' : 'var(--muted)', fontWeight: 800, fontSize: 14, cursor: rating > 0 && !saving ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          {saving ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS: Record<string,string> = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}>{i <= Math.round(rating) ? <StarFilled /> : <StarEmpty />}</span>
      ))}
    </div>
  );
}

/* ── Normalise weekly_menu keys to lowercase ── */
function normaliseMenu(raw: Record<string, any> | null): Record<string, any> | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Record<string, any> = {};
  Object.entries(raw).forEach(([k, v]) => { out[k.toLowerCase().trim()] = v; });
  return out;
}

/* ── Listing reviews; reviewer names come from public_profiles (users is own-row only) ── */
async function fetchListingReviews(supabase: ReturnType<typeof createClient>, vendorId: string, listingId: string) {
  const { data: rev } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', vendorId)
    .eq('listing_type', 'tiffin')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(8);
  if (!rev?.length) return [];
  const reviewerIds = Array.from(new Set(rev.map(r => r.reviewer_id).filter(Boolean)));
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, full_name, avatar_url')
    .in('id', reviewerIds);
  return rev.map(r => {
    const p = profiles?.find(x => x.id === r.reviewer_id);
    return { ...r, reviewer: p ? { full_name: p.full_name, avatar_url: p.avatar_url } : null };
  });
}

/* ── Plan card ── */
function PlanCard({
  title, badge, price, originalPrice, suffix, desc, discPct, savings,
  inCart, onAdd, onView, isPro,
}: {
  title: string; badge?: string; price: number; originalPrice: number;
  suffix: string; desc: string; discPct: number; savings: number;
  inCart: boolean; onAdd: () => void; onView: () => void; isPro: boolean;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (inCart) { onView(); return; }
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div style={{ background: 'var(--navy2)', border: `1px solid ${inCart ? 'rgba(18,161,80,0.3)' : 'var(--border)'}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)' }}>{title}</span>
          {badge && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(18,161,80,0.12)', color: 'var(--amber)', letterSpacing: 0.5 }}>{badge}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          {isPro && discPct > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', textDecoration: 'line-through' }}>${originalPrice}</span>}
          <span style={{ fontSize: 24, fontWeight: 800, color: isPro && discPct > 0 ? '#12A150' : 'var(--white)', letterSpacing: -1 }}>${price}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{suffix}</span>
        </div>
        {isPro && discPct > 0 && (
          <div style={{ fontSize: 11, color: '#7C6BD1', fontWeight: 700, marginBottom: 6 }}>Pro –{discPct}% · saves ${savings.toFixed(2)}</div>
        )}
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4, marginBottom: 14 }}>{desc}</div>
        <button onClick={handleAdd}
          style={{
            width: '100%', height: 40,
            background: added ? 'rgba(18,161,80,0.12)' : inCart ? 'rgba(18,161,80,0.08)' : 'var(--amber)',
            border: added ? '1px solid rgba(18,161,80,0.3)' : inCart ? '1px solid rgba(18,161,80,0.25)' : 'none',
            borderRadius: 10,
            color: added ? '#12A150' : inCart ? 'var(--amber)' : '#ffffff',
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>
          {added ? <><CheckIcon /> Opening…</> : <><PlusIcon /> Order now</>}
        </button>
      </div>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [plan, setPlan] = useState<UserPlan>('free');
  const [showReviewModal, setShowReviewModal] = useState(false);
  // Simple beta ordering (quantity / time / address) — replaces cart + checkout.
  const [orderPlan, setOrderPlan] = useState<{ name: string; price: number | null } | null>(null);
  const [reviewPrompt, setReviewPrompt] = useState(false); // banner nudge
  const { addItem, hasItem, count: cartCount } = useCart();

  // Check localStorage for pending review after 30 min
  const checkPendingReview = useCallback((listingId: string) => {
    try {
      const pending: any[] = JSON.parse(localStorage.getItem('handout_pending_reviews') || '[]');
      const entry = pending.find(p => p.listingId === listingId && !p.reviewed);
      if (entry && Date.now() - entry.orderedAt >= REVIEW_DELAY_MS) {
        setReviewPrompt(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/auth/login'; return; }

      const [{ data: l }, userPlan] = await Promise.all([
        supabase.from('tiffin_listings')
          .select('*, users:public_profiles(id, full_name, avatar_url)')
          .eq('id', id).single(),
        fetchUserPlan(),
      ]);
      if (!l) { router.push('/student/food'); return; }

      setListing(l);
      setVendor(l.users);
      setPlan(userPlan);
      checkPendingReview(id);

      // Only fetch reviews for this specific tiffin listing
      setReviews(await fetchListingReviews(supabase, l.user_id, id));
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <StudentLayout title="Loading…">
      <div style={{ maxWidth: 760, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 100, background: 'var(--navy2)', borderRadius: 16, opacity: 0.4 }} />)}
      </div>
    </StudentLayout>
  );
  if (!listing) return null;

  const isPro       = plan === 'pro';
  const mealPrice   = parseFloat(listing.price_per_meal)  || 0;
  const monthPrice  = parseFloat(listing.price_per_month) || 0;
  const weekPrice   = parseFloat(listing.price_per_week)  || 0;
  const mealDisc    = applyDiscount(mealPrice,  plan, 'tiffin');
  const monthDisc   = applyDiscount(monthPrice, plan, 'tiffin');
  const weekDisc    = applyDiscount(weekPrice,  plan, 'tiffin');

  const weeklyMenuRaw = listing.weekly_menu as Record<string, any> | null;
  const weeklyMenu    = normaliseMenu(weeklyMenuRaw);
  const menuDays      = weeklyMenu ? DAYS_ORDER.filter(d => weeklyMenu[d] && String(weeklyMenu[d]).trim()) : [];

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const initials = (vendor?.full_name || 'V').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Cart IDs per plan type
  const cartIdMeal  = `tiffin-${id}-meal`;
  const cartIdWeek  = `tiffin-${id}-week`;
  const cartIdMonth = `tiffin-${id}-month`;

  // BETA: ordering is a direct request to the cook — no cart, no checkout, no
  // payment step. The student picks quantity/time/address and the vendor is
  // notified instantly. (The cart flow is preserved in lib/cart-store for when
  // in-app payments launch.)
  function openOrder(type: 'meal' | 'week' | 'monthly') {
    const map = {
      meal:    { price: mealDisc.discounted,  label: `${listing.name} (per meal)` },
      week:    { price: weekDisc.discounted,  label: `${listing.name} (weekly)` },
      monthly: { price: monthDisc.discounted, label: `${listing.name} (monthly)` },
    };
    const c = map[type];
    setOrderPlan({ name: c.label, price: c.price ?? null });
  }

  function handleReviewSubmitted() {
    setShowReviewModal(false);
    setReviewPrompt(false);
    // Refresh reviews
    fetchListingReviews(createClient(), listing.user_id, id).then(setReviews);
  }

  return (
    <StudentLayout title={listing.name}>
      {/* Review prompt banner */}
      {reviewPrompt && !showReviewModal && (
        <div style={{ background: 'linear-gradient(90deg,rgba(251,191,36,0.12),rgba(251,191,36,0.06))', borderBottom: '1px solid rgba(251,191,36,0.2)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span style={{ fontSize: 13, color: 'var(--light)', flex: 1, fontWeight: 600 }}>
            How was your meal from <strong style={{ color: 'var(--white)' }}>{listing.name}</strong>? Leave a review!
          </span>
          <button onClick={() => setShowReviewModal(true)}
            style={{ height: 34, padding: '0 18px', background: '#FBBF24', border: 'none', borderRadius: 8, color: '#1a0f00', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            Rate Now
          </button>
          <button onClick={() => setReviewPrompt(false)}
            style={{ width: 30, height: 30, background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
            <XIcon />
          </button>
        </div>
      )}

      {/* Quick order — quantity, time, address. No cart, no payment. */}
      {orderPlan && (
        <QuickOrderModal
          listingId={id}
          vendorId={listing.user_id}
          itemName={orderPlan.name}
          pricePerMeal={orderPlan.price}
          onClose={() => setOrderPlan(null)}
        />
      )}

      {/* Review modal */}
      {showReviewModal && (
        <ReviewModal
          listingId={id}
          listingName={listing.name}
          vendorId={listing.user_id}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={handleReviewSubmitted}
        />
      )}

      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Back */}
        <button onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>
          <BackIcon /> Back to Food &amp; Tiffin
        </button>

        {/* ── Hero card ── */}
        <div style={{ background: 'var(--navy2)', border: `1px solid ${isPro ? 'rgba(124,107,209,0.2)' : 'var(--border)'}`, borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: 6, background: isPro ? 'linear-gradient(90deg,#7C6BD1,#7C6BD1,#5A4BB8)' : 'linear-gradient(90deg,var(--amber),#0F8A44)' }} />
          <div style={{ padding: '22px 24px 18px' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {vendor?.avatar_url ? (
                <img src={vendor.avatar_url} alt={initials} style={{ width: 60, height: 60, borderRadius: 14, objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 14, background: isPro ? 'rgba(124,107,209,0.12)' : 'rgba(18,161,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: isPro ? '#7C6BD1' : 'var(--amber)', flexShrink: 0 }}>
                  {initials}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 180 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, color: 'var(--white)', margin: '0 0 3px', letterSpacing: -0.5 }}>{listing.name}</h1>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>by <span style={{ color: 'var(--light)', fontWeight: 600 }}>{vendor?.full_name || 'Vendor'}</span></div>
                {avgRating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <StarRow rating={parseFloat(avgRating)} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#FBBF24' }}>{avgRating}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>No reviews yet</div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {listing.cuisine && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(18,161,80,0.08)', color: 'var(--amber)' }}>{listing.cuisine}</span>}
                  {listing.diet_type && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(18,161,80,0.08)', color: '#12A150' }}>{listing.diet_type}</span>}
                  {listing.meals_per_day > 1 && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'rgba(18,36,28,0.06)', color: 'var(--muted)' }}>{listing.meals_per_day}x daily</span>}
                  {isPro && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(124,107,209,0.12)', color: '#7C6BD1' }}>Pro 15% off</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 14, marginTop: 14, borderTop: '1px solid rgba(18,36,28,0.07)' }}>
              {listing.location && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--muted)' }}><LocationIcon /> {listing.location}</div>}
              {vendor?.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--muted)' }}><PhoneIcon /> {vendor.phone}</div>}
            </div>
            {listing.description && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>{listing.description}</p>}
          </div>
        </div>

        <div className="rg-side" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 290px', gap: 20, alignItems: 'start' }}>
          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Weekly menu */}
            <section style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(18,36,28,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(18,161,80,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}>
                  <CalendarIcon />
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--white)' }}>This Week's Menu</span>
              </div>
              {menuDays.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--muted)', opacity: 0.4, marginBottom: 8 }}><FoodIcon /></div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Menu not added yet — contact vendor for details</div>
                </div>
              ) : (
                <div>
                  {menuDays.map((day, i) => (
                    <div key={day} style={{ padding: '12px 20px', borderBottom: i < menuDays.length - 1 ? '1px solid rgba(18,36,28,0.04)' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 0.4, paddingTop: 2, flexShrink: 0 }}>
                        {DAY_LABELS[day]}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--light)', lineHeight: 1.5 }}>
                        {typeof weeklyMenu![day] === 'string'
                          ? weeklyMenu![day]
                          : typeof weeklyMenu![day] === 'object'
                            ? Object.entries(weeklyMenu![day] as Record<string, string>).map(([meal, desc]) => (
                              <div key={meal}><span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{meal}: </span>{desc}</div>
                            ))
                            : String(weeklyMenu![day])}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reviews */}
            <section style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(18,36,28,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
                    <StarIcon />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--white)' }}>Ratings &amp; Reviews</span>
                  {avgRating && <span style={{ fontSize: 13, fontWeight: 800, color: '#FBBF24' }}>{avgRating}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  <button onClick={() => setShowReviewModal(true)}
                    style={{ height: 28, padding: '0 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, color: '#FBBF24', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PlusIcon /> Write a Review
                  </button>
                </div>
              </div>
              {reviews.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--muted)', opacity: 0.3, marginBottom: 8 }}><StarIcon /></div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>No reviews for this tiffin yet — be the first!</div>
                </div>
              ) : reviews.map((r, i) => {
                const rev = r.reviewer as any;
                const ri = (rev?.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={r.id} style={{ padding: '14px 20px', borderBottom: i < reviews.length - 1 ? '1px solid rgba(18,36,28,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {rev?.avatar_url
                        ? <img src={rev.avatar_url} alt={ri} style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(18,36,28,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>{ri}</div>}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{rev?.full_name || 'Student'}</span>
                          <StarRow rating={r.rating} />
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {r.comment && <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          {/* ── RIGHT: ordering ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 }}>
              Choose a Plan
            </div>

            {mealPrice > 0 && (
              <PlanCard
                title="Per Meal" price={mealDisc.discounted} originalPrice={mealPrice}
                suffix="/meal" desc="Order individual meals as needed — great for trying it out."
                discPct={isPro ? 15 : 0} savings={mealPrice - mealDisc.discounted}
                inCart={hasItem(cartIdMeal)} onAdd={() => openOrder('meal')}
                onView={() => router.push('/student/cart')} isPro={isPro}
              />
            )}

            {weekPrice > 0 && (
              <PlanCard
                title="Weekly Plan" price={weekDisc.discounted} originalPrice={weekPrice}
                suffix="/week" desc="Full week of meals delivered daily. Flexible and easy."
                discPct={isPro ? 15 : 0} savings={weekPrice - weekDisc.discounted}
                inCart={hasItem(cartIdWeek)} onAdd={() => openOrder('week')}
                onView={() => router.push('/student/cart')} isPro={isPro}
              />
            )}

            {monthPrice > 0 && (
              <PlanCard
                title="Monthly Plan" badge="BEST VALUE"
                price={monthDisc.discounted} originalPrice={monthPrice}
                suffix="/month"
                desc={mealPrice > 0 ? `≈ $${(monthDisc.discounted / 30).toFixed(2)}/day · Unlimited daily meals` : 'Full month of home-cooked meals.'}
                discPct={isPro ? 15 : 0} savings={monthPrice - monthDisc.discounted}
                inCart={hasItem(cartIdMonth)} onAdd={() => openOrder('monthly')}
                onView={() => router.push('/student/cart')} isPro={isPro}
              />
            )}

            {/* Go to cart shortcut */}
            {cartCount > 0 && (
              <button onClick={() => router.push('/student/cart')}
                style={{ width: '100%', height: 40, background: 'transparent', border: '1px solid rgba(18,161,80,0.2)', borderRadius: 12, color: 'var(--amber)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CartIcon /> Go to cart ({cartCount}) <ArrowIcon />
              </button>
            )}

            {/* Message vendor */}
            <Link
              href={`/student/messages?to=${listing.user_id}&name=${encodeURIComponent(vendor?.full_name || 'Vendor')}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'var(--white)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
              <MessageIcon /> Message Vendor
            </Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
