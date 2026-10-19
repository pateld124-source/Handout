import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { comingSoonFeatureForPath } from '@/config/features';

// Protected route prefixes — any path starting with these requires an active session.
const PROTECTED = ['/student', '/provider', '/vendor', '/admin', '/onboarding'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this path requires auth
  const isProtected = PROTECTED.some(prefix => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  // Build a Supabase client that can read the session cookie
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // @supabase/ssr@0.3.0 server client uses get/set/remove (not getAll/setAll).
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin pages: being signed in is not enough, the account must be an admin.
  if (pathname.startsWith('/admin')) {
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (me?.role !== 'admin') {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      homeUrl.search = '';
      return NextResponse.redirect(homeUrl);
    }
  }

  // ── BETA MODE gate ──────────────────────────────────────────────────────
  // Coming-soon routes are preserved but redirected to the Coming Soon page
  // while the beta flag is on. Flipping BETA_MODE off re-enables them with no
  // other changes. Only runs for signed-in users (checked above).
  const comingSoonFeature = comingSoonFeatureForPath(pathname);
  if (comingSoonFeature) {
    const csUrl = request.nextUrl.clone();
    csUrl.pathname = '/coming-soon';
    csUrl.search = '';
    csUrl.searchParams.set('feature', comingSoonFeature);
    return NextResponse.redirect(csUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
