'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { BETA_MODE } from '@/config/features';

// ─────────────────────────────────────────────────────────────
// IN-MEMORY RATE LIMITER (simple, free, no external dependencies)
// ─────────────────────────────────────────────────────────────
type RateLimitBucket = { count: number; reset: number };
const rateLimits = new Map<string, RateLimitBucket>();

function rateLimit(key: string, max: number, windowMs: number): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const bucket = rateLimits.get(key);
  if (!bucket || now > bucket.reset) {
    rateLimits.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, resetIn: windowMs };
  }
  if (bucket.count >= max) {
    return { allowed: false, resetIn: Math.ceil((bucket.reset - now) / 1000) };
  }
  bucket.count++;
  return { allowed: true, resetIn: 0 };
}

async function getClientKey() {
  const h = await headers();
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown';
}

// ─────────────────────────────────────────────────────────────
// INPUT SANITIZATION (strip HTML, control chars, length limits)
// ─────────────────────────────────────────────────────────────
function sanitize(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '')   // strip control chars
    .trim()
    .slice(0, maxLength);
}

// ─────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────────────────────
const SignUpSchema = z.object({
  fullName: z.string().min(2, 'Name too short').max(80, 'Name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name has invalid characters'),
  email: z.string().email('Invalid email').max(120),
  password: z.string().min(8, 'Password must be 8+ characters').max(128, 'Password too long'),
  role: z.enum(['student', 'provider']),
  honeypot: z.string().max(0, 'Bot detected'),  // must be empty
});

const SignInSchema = z.object({
  email: z.string().email('Invalid email').max(120),
  password: z.string().min(1, 'Password required').max(128),
  honeypot: z.string().max(0, 'Bot detected'),
});

const OnboardingSchema = z.object({
  university: z.string().min(2).max(120),
  city:       z.string().min(2).max(80),
  budgetMin:  z.coerce.number().min(0).max(100000),
  budgetMax:  z.coerce.number().min(0).max(100000),
  moveInDate: z.string().max(40).optional(),
  genderPreference: z.enum(['male', 'female', 'no_preference']).default('no_preference'),
  preferences: z.array(z.string().max(40)).max(20),
});

// ─────────────────────────────────────────────────────────────
// AUTH ACTIONS
// ─────────────────────────────────────────────────────────────
export type ActionResult = { error?: string; ok?: boolean };

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  // 1. Rate limit (5 signups per IP per hour)
  const ip = await getClientKey();
  const rl = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) return { error: `Too many signups. Try again in ${rl.resetIn}s.` };

  // 2. Sanitize + validate
  const raw = {
    fullName: sanitize(String(formData.get('fullName') ?? ''), 80),
    email:    sanitize(String(formData.get('email')    ?? ''), 120).toLowerCase(),
    password:        String(formData.get('password')   ?? ''),
    role:            String(formData.get('role')       ?? 'student'),
    honeypot:        String(formData.get('website')    ?? ''),  // honeypot field
  };

  const parsed = SignUpSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // 3. Call Supabase
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, role: parsed.data.role },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: 'Signup failed' };

  // 4. If session created (email confirmation off), redirect to the right dashboard
  if (data.session) {
    revalidatePath('/', 'layout');
    const role = parsed.data.role;
    redirect(role === 'provider' ? '/vendor/dashboard' : '/student/dashboard');
  }
  // Otherwise redirect to login (email confirmation needed)
  redirect('/auth/login?signup=success');
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const ip = await getClientKey();
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) return { error: `Too many login attempts. Try again in ${rl.resetIn}s.` };

  const raw = {
    email:    sanitize(String(formData.get('email') ?? ''), 120).toLowerCase(),
    password:        String(formData.get('password') ?? ''),
    honeypot:        String(formData.get('website') ?? ''),
  };

  const parsed = SignInSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: error.message };
  if (!data.session) return { error: 'No session created' };

  // Look up their role + verification status to route them correctly
  const { data: profile } = await supabase
    .from('users')
    .select('role, verification_status')
    .eq('id', data.user.id)
    .single();
  const role = profile?.role || 'student';
  const status = profile?.verification_status || 'unsubmitted';

  revalidatePath('/', 'layout');
  if (role === 'admin') redirect('/admin/users');
  if (role === 'vendor' || role === 'provider') redirect('/vendor/dashboard');
  // Students must pass verification before reaching the dashboard — disabled
  // during Beta, where verification is optional.
  if (!BETA_MODE && status !== 'approved') redirect('/onboarding');
  redirect('/student/dashboard');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

export async function saveOnboardingAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const raw = {
    university: sanitize(String(formData.get('university') ?? ''), 120),
    city:       sanitize(String(formData.get('city') ?? ''), 80),
    budgetMin:  formData.get('budgetMin'),
    budgetMax:  formData.get('budgetMax'),
    moveInDate: sanitize(String(formData.get('moveInDate') ?? ''), 40),
    genderPreference: String(formData.get('genderPreference') ?? 'no_preference'),
    preferences: (formData.getAll('preferences') as string[]).map(s => sanitize(s, 40)).filter(Boolean),
  };

  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase.from('student_profiles').upsert({
    user_id: user.id,
    university: parsed.data.university,
    city: parsed.data.city,
    budget_min: parsed.data.budgetMin,
    budget_max: parsed.data.budgetMax,
    move_in_date: parsed.data.moveInDate || null,
    gender_preference: parsed.data.genderPreference,
    preferences: parsed.data.preferences,
    is_looking_for_roommate: true,
  });

  if (error) return { error: error.message };
  revalidatePath('/student/dashboard');
  redirect('/student/dashboard');
}

// ─────────────────────────────────────────────────────────────
// CONTENT ACTIONS (sanitized)
// ─────────────────────────────────────────────────────────────
const MessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export async function sendMessageAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const ip = await getClientKey();
  const rl = rateLimit(`msg:${user.id}`, 30, 60 * 1000);  // 30 messages/min/user
  if (!rl.allowed) return { error: 'Slow down. Too many messages.' };

  const raw = {
    receiverId: String(formData.get('receiverId') ?? ''),
    content: sanitize(String(formData.get('content') ?? ''), 2000),
  };
  const parsed = MessageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase.from('messages').insert({
    sender_id: user.id,
    receiver_id: parsed.data.receiverId,
    content: parsed.data.content,
    is_read: false,
  });
  if (error) return { error: error.message };
  // The receiver's notification is created by a DB trigger on messages.
  return { ok: true };
}

const CommunityPostSchema = z.object({
  title:   z.string().min(5, 'Title too short').max(150, 'Title too long'),
  content: z.string().min(10, 'Post too short').max(5000, 'Post too long'),
});

export async function createCommunityPostAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const ip = await getClientKey();
  const rl = rateLimit(`post:${user.id}`, 5, 10 * 60 * 1000);  // 5 posts / 10 min
  if (!rl.allowed) return { error: 'Too many posts. Try later.' };

  const raw = {
    title:   sanitize(String(formData.get('title') ?? ''), 150),
    content: sanitize(String(formData.get('content') ?? ''), 5000),
  };
  const parsed = CommunityPostSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase.from('community_posts').insert({
    author_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    likes: 0,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath('/student/community');
  return { ok: true };
}

// NOTE: a previous createBookingAction was removed here. It inserted columns
// that don't exist on the `bookings` table (service_name, service_type,
// scheduled_date, price) and would fail at runtime. It was also unused — the
// live booking flow runs client-side in app/student/services and app/browse/[id],
// inserting the correct columns (listing_type, listing_id, total_price,
// arrival_date, scheduled_time, hours). If a server-side booking action is
// needed later, build it against that real schema.
