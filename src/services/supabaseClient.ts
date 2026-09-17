import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const SUPABASE_PROJECT_URL = url || '';

const NOT_CONFIGURED_MESSAGE = 'لم يتم ربط قاعدة البيانات بعد. يرجى التواصل مع إدارة النادي.';

if (!isSupabaseConfigured) {
  console.error('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY غير معرّفة — لن يتم حفظ أي بيانات.');
}

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * Full Supabase client (auth + table writes). Loaded on demand, so regular
 * visitors never download it — only the admin dashboard needs it.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured) return Promise.reject(new Error(NOT_CONFIGURED_MESSAGE));
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  );
  return clientPromise;
}

// Lightweight anonymous REST calls for the public site (content reads + public RPCs).
async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(body?.message || `خطأ في الاتصال بقاعدة البيانات (${res.status})`);
  }
  return body as T;
}

export const publicSelect = <T>(pathWithQuery: string) => rest<T>(pathWithQuery);

export const publicRpc = <T>(fn: string, args: Record<string, unknown>) =>
  rest<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
