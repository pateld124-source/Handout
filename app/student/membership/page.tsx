import { StudentLayout } from '@/components/layout/StudentLayout';
import { createClient } from '@/lib/supabase/server';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { PageTransition } from '@/components/motion/PageTransition';
import Link from 'next/link';

/* ── Membership page callout icons ── */
const MsgCallIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const RoomCallIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const HeartCallIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const MoneyCallIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

const plans = [
  {
    id:'free', name:'Free', price:0, period:'forever',
    desc:'Explore Handout. No card needed, ever.',
    badge: null, featured: false,
    features:[
      { label:'Browse all listings',               included:true  },
      { label:'2 roommate inquiries/month',         included:true  },
      { label:'3 messages/day',                     included:true  },
      { label:'Post 1 handout (notes/doc)',          included:true  },
      { label:'Community (read-only)',               included:true  },
      { label:'Direct vendor contact',              included:false },
      { label:'Priority booking',                   included:false },
      { label:'Verified student badge',             included:false },
      { label:'Campus Connect',                  included:false },
      { label:'Group booking',                      included:false },
    ],
    cta:'Current plan', disabled:true,
  },
  {
    id:'plus', name:'Plus', price:9, period:'month',
    desc:'Everything you need, daily. The plan most students choose.',
    badge:'Most Popular', featured:true,
    features:[
      { label:'Browse all listings',               included:true  },
      { label:'Unlimited roommate matches',         included:true  },
      { label:'Unlimited messages',                 included:true  },
      { label:'Direct contact with all vendors',   included:true  },
      { label:'Priority booking slot',             included:true  },
      { label:'Verified student badge',            included:true  },
      { label:'Advanced search & filters',         included:true  },
      { label:'Save & favourite listings',         included:true  },
      { label:'Campus Connect (dating)',         included:true  },
      { label:'Group booking',                     included:false },
    ],
    cta:'Upgrade to Plus', disabled:false,
  },
  {
    id:'pro', name:'Pro', price:19, period:'month',
    desc:'For campus leaders who do everything through Handout.',
    badge:'Best Value', featured:false,
    features:[
      { label:'Everything in Plus',                included:true  },
      { label:'10% off all service bookings',      included:true  },
      { label:'15% off bulk tiffin (3+ orders)',   included:true  },
      { label:'Exclusive vendor deals & coupons',  included:true  },
      { label:'$5/month campus credit',            included:true  },
      { label:'Group booking (up to 5 people)',    included:true  },
      { label:'Post unlimited handout listings',   included:true  },
      { label:'Spending & savings analytics',      included:true  },
      { label:'Export bookings (expense reports)', included:true  },
      { label:'24-hr priority support',            included:true  },
      { label:'Early access to new features',      included:true  },
      { label:'Custom profile link',               included:true  },
    ],
    cta:'Upgrade to Pro', disabled:false,
  },
];

const BRICOLAGE = "'Bricolage Grotesque', sans-serif";

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase.from('users').select('plan').eq('id', user?.id ?? '').single();
  const currentPlan = userData?.plan ?? 'free';

  return (
    <StudentLayout title="Membership">
      <PageTransition>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <h1 style={{ fontFamily:BRICOLAGE, fontSize:'clamp(36px,4.5vw,56px)', fontWeight:800, letterSpacing:-2, lineHeight:1, color:'#12241C', marginBottom:12 }}>
              Simple, <span style={{ color:'#12A150' }}>transparent</span> pricing.
            </h1>
            <p style={{ fontSize:16, color:'#4c6157', maxWidth:440, margin:'0 auto' }}>Upgrade any time. Cancel any time.</p>
          </div>

          {/* Plans */}
          <div className="rg-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:48 }}>
            {plans.map((plan,i) => {
              const isCurrentPlan = currentPlan === plan.id;
              const f = plan.featured;
              return (
                <ScrollReveal key={plan.id} delay={i*100} direction="up">
                  <div style={{
                    border: f ? '1.5px solid #12A150' : '1.5px solid rgba(18,36,28,0.09)',
                    borderRadius:22, padding:'34px 28px',
                    background: f ? '#12A150' : '#fff',
                    boxShadow: f ? '0 20px 44px rgba(18,161,80,0.28)' : 'none',
                    position:'relative', height:'100%', display:'flex', flexDirection:'column',
                  }}>
                    {plan.badge && (
                      <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'#12241C', color:'#7fe0a6', fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', padding:'6px 15px', borderRadius:100, whiteSpace:'nowrap' }}>{plan.badge}</div>
                    )}
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color: f ? 'rgba(255,255,255,.75)' : '#7d9188', marginBottom:14 }}>{plan.name}</div>
                    <div style={{ fontFamily:BRICOLAGE, fontSize:52, fontWeight:800, letterSpacing:-2, lineHeight:1, color: f ? '#fff' : '#12241C' }}>
                      {plan.price === 0 ? '$0' : `$${plan.price}`}
                    </div>
                    <div style={{ fontSize:13, color: f ? 'rgba(255,255,255,.8)' : '#7d9188', margin:'6px 0 6px' }}>
                      {plan.price === 0 ? 'forever' : 'per month'}
                      {plan.id === 'pro' && <span style={{ marginLeft:8, background:'#E7F1EA', color:'#0F8A44', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:100 }}>Effectively $14 with credit</span>}
                    </div>
                    <p style={{ fontSize:13.5, color: f ? 'rgba(255,255,255,.85)' : '#4c6157', marginBottom:20, marginTop:6, lineHeight:1.5 }}>{plan.desc}</p>
                    {isCurrentPlan && (
                      <div style={{ alignSelf:'flex-start', marginBottom:14, fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:100, background: f ? 'rgba(255,255,255,.2)' : '#E7F1EA', color: f ? '#fff' : '#0F8A44' }}>✓ Current plan</div>
                    )}
                    <div style={{ height:1, background: f ? 'rgba(255,255,255,.22)' : 'rgba(18,36,28,0.09)', marginBottom:20 }}/>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:11, marginBottom:26 }}>
                      {plan.features.map((ft: any) => (
                        <div key={ft.label} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13.5 }}>
                          <span style={{ flexShrink:0, marginTop:1, fontSize:13, fontWeight:800, color: ft.included ? (f ? '#fff' : '#12A150') : (f ? 'rgba(255,255,255,.35)' : 'rgba(18,36,28,0.2)') }}>
                            {ft.included ? '✓' : '✕'}
                          </span>
                          <span style={{ color: ft.included ? (f ? 'rgba(255,255,255,.92)' : '#4c6157') : (f ? 'rgba(255,255,255,.45)' : 'rgba(18,36,28,0.32)') }}>{ft.label}</span>
                        </div>
                      ))}
                    </div>
                    {isCurrentPlan || plan.id === 'free' ? (
                      <div style={{ display:'block', textAlign:'center', padding:'13px', borderRadius:13, fontSize:13.5, fontWeight:700, background: f ? 'rgba(255,255,255,.25)' : '#EDEFEE', color: f ? '#fff' : '#6b7d74', cursor:'not-allowed' }}>
                        {isCurrentPlan ? 'Current plan' : 'Free forever'}
                      </div>
                    ) : (
                      <a href={`/student/checkout?plan=${plan.id}`}
                        style={{ display:'block', textAlign:'center', padding:'13px', borderRadius:13, fontSize:13.5, fontWeight:700, textDecoration:'none', background: f ? '#fff' : '#E7F1EA', color: f ? '#12A150' : '#0F8A44' }}>
                        {plan.cta}
                      </a>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Comparison callout */}
          <ScrollReveal delay={50}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:48 }}>
              {[
                { Icon: MsgCallIcon,   color:'#12A150', bg:'rgba(18,161,80,.1)',   title:'Free caps you at 3 msgs/day', sub:'Plus users send unlimited messages, all day.' },
                { Icon: RoomCallIcon,  color:'#2E7D5B', bg:'rgba(46,125,91,.12)',  title:'Free = 2 roommate leads/month', sub:'Plus gives unlimited matches so you actually find someone.' },
                { Icon: HeartCallIcon, color:'#C25B4E', bg:'rgba(194,91,78,.12)',  title:'Campus Connect is Plus-only', sub:'The dating feature is locked on Free — completely.' },
                { Icon: MoneyCallIcon, color:'#E08A1E', bg:'rgba(226,138,30,.12)', title:'Pro pays for itself', sub:'$5 credit + 10% off bookings + 15% off tiffin — most Pro users save more than $19/mo.' },
              ].map(c => (
                <div key={c.title} className="ft-card" style={{ borderRadius:16, padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
                  <span style={{ display:'inline-flex', flexShrink:0, width:42, height:42, borderRadius:12, background:c.bg, color:c.color, alignItems:'center', justifyContent:'center' }}><c.Icon /></span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#12241C', marginBottom:4 }}>{c.title}</div>
                    <div style={{ fontSize:12, color:'#7d9188', lineHeight:1.5 }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* FAQ */}
          <ScrollReveal>
            <div style={{ background:'#fff', border:'1px solid rgba(18,36,28,0.09)', borderRadius:20, padding:32 }}>
              <h3 style={{ fontFamily:BRICOLAGE, fontSize:22, fontWeight:800, letterSpacing:-0.5, color:'#12241C', marginBottom:20 }}>Frequently asked questions</h3>
              {[
                { q:'Can I cancel anytime?', a:'Yes — cancel from your settings at any time. You keep access until the end of your billing period.' },
                { q:'Is there a free trial?', a:'All paid plans include a 14-day free trial. No credit card required to start.' },
                { q:'Can I switch plans?', a:'Upgrade or downgrade at any time. Changes take effect immediately with prorated billing.' },
                { q:'What payment methods do you accept?', a:'We accept all major credit cards, debit cards via Stripe. Apple Pay and Google Pay coming soon.' },
              ].map((item,i) => (
                <div key={i} style={{ paddingBottom:16, marginBottom:16, borderBottom:i<3?'1px solid rgba(18,36,28,0.09)':'none' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#12241C', marginBottom:6 }}>{item.q}</div>
                  <div style={{ fontSize:14, color:'#4c6157', lineHeight:1.6 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p style={{ textAlign:'center', fontSize:13, color:'#7d9188', marginTop:28 }}>
              All plans include a 14-day free trial. No hidden fees. <Link href="/landing" style={{ color:'#12A150', fontWeight:700 }}>Learn more →</Link>
            </p>
          </ScrollReveal>
        </div>
      </PageTransition>
    </StudentLayout>
  );
}
