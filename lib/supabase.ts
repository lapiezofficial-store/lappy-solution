import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rprmjhzjiuaktkubfuqt.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_75VfJ7bsDZvhM2wAiT-Q0Q_vbwU5K1O';

export const supabase = createClient(supabaseUrl, supabaseKey);

function getSafeTarget(redirectTo?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!redirectTo) {
    return origin ? `${origin}/auth/callback` : '/auth/callback';
  }
  if (redirectTo.startsWith('/auth/callback')) {
    return origin ? `${origin}${redirectTo}` : redirectTo;
  }
  const cleanNext = redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.startsWith('/\\')
    ? redirectTo
    : '/account';
  return origin ? `${origin}/auth/callback?next=${encodeURIComponent(cleanNext)}` : `/auth/callback?next=${encodeURIComponent(cleanNext)}`;
}

export async function signInWithGoogle(redirectTo?: string) {
  // If Google provider is enabled in Supabase it can be used, otherwise handled gracefully by client StoreContext
  try {
    const target = getSafeTarget(redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: target,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.warn('Supabase OAuth notice:', err?.message || err);
    throw err;
  }
}

export async function signOutCustomer() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type { User };

