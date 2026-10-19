'use server';

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from './auth';

const USER_BUCKETS = ['avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents'];
const PAGE_SIZE = 100;
const DELETE_FAILED = 'We could not delete your account. Please try again or contact support.';

async function listObjectPaths(serviceClient: SupabaseClient, bucket: string, prefix: string, search?: string): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await serviceClient.storage.from(bucket).list(prefix, { limit: PAGE_SIZE, offset, search });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) paths.push(...(await listObjectPaths(serviceClient, bucket, path)));
      else paths.push(path);
    }
    if (data.length < PAGE_SIZE) return paths;
  }
}

export async function deleteAccountAction(): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    const serviceClient = createServiceClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    for (const bucket of USER_BUCKETS) {
      const paths = await listObjectPaths(serviceClient, bucket, user.id);
      if (bucket === 'avatars') {
        // Legacy dating photos were stored as dating/<uid>_<timestamp>.<ext>.
        const legacy = await listObjectPaths(serviceClient, bucket, 'dating', `${user.id}_`);
        paths.push(...legacy.filter(p => p.startsWith(`dating/${user.id}_`)));
      }
      for (let i = 0; i < paths.length; i += PAGE_SIZE) {
        const { error } = await serviceClient.storage.from(bucket).remove(paths.slice(i, i + PAGE_SIZE));
        if (error) throw new Error(`remove ${bucket}: ${error.message}`);
      }
    }

    const { error } = await serviceClient.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`deleteUser: ${error.message}`);

    await supabase.auth.signOut().catch(() => {});
    return { ok: true };
  } catch (e) {
    console.error('deleteAccountAction failed:', e);
    return { error: DELETE_FAILED };
  }
}
