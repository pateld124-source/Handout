export function publicStorageUrl(url: unknown, bucket: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string | null {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.origin !== new URL(String(supabaseUrl)).origin || u.username || u.password) return null;
    // getPublicUrl encodes '%' as %25, so encoded dots/slashes only appear in crafted URLs.
    if (/%2e|%2f|%5c/i.test(u.pathname)) return null;
    return u.pathname.startsWith(`/storage/v1/object/public/${bucket}/`) ? u.href : null;
  } catch {
    return null;
  }
}
