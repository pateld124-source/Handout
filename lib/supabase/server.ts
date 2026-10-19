import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// NOTE: @supabase/ssr@0.3.0 (the installed version) only supports the
// get/set/remove cookie API on the SERVER client — NOT getAll/setAll (that was
// added in 0.4.0). With getAll/setAll, 0.3.0 reads no cookie, so getUser()
// always returns null and every protected route redirects to login. These
// get/set/remove handlers are what this version understands.
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Cannot connect to the database: missing NEXT_PUBLIC_SUPABASE_URL or ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY on the server. Check .env.local and restart.'
    );
  }
  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set(name, value, options); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set(name, '', { ...options, maxAge: 0 }); } catch {}
        },
      },
    }
  );
}

export async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
  return data;
}
