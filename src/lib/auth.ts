import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

export const ACCESS_COOKIE = 'sb-access-token';
export const REFRESH_COOKIE = 'sb-refresh-token';

const authCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 7,
};

function getSupabaseEnv() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === 'tu_url_aqui' || anonKey === 'tu_llave_anon_aqui') {
    throw new Error('Configura PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env.local');
  }

  return { url, anonKey };
}

export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Configura SUPABASE_SERVICE_ROLE_KEY en .env.local');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function setAuthCookies(cookies: AstroCookies, session: Session) {
  cookies.set(ACCESS_COOKIE, session.access_token, authCookieOptions);
  cookies.set(REFRESH_COOKIE, session.refresh_token, authCookieOptions);
}

export function clearAuthCookies(cookies: AstroCookies) {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
}

export async function getSessionUserFromCookies(cookies: AstroCookies) {
  const accessToken = cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookies.get(REFRESH_COOKIE)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session?.user) {
    clearAuthCookies(cookies);
    return null;
  }

  setAuthCookies(cookies, data.session);
  return data.session.user;
}

export function toStaffSession(user: User) {
  const fallbackName = user.email?.split('@')[0] || 'Usuario';

  return {
    email: user.email || '',
    username: user.email || fallbackName,
    name: user.user_metadata?.full_name || fallbackName,
    role: user.user_metadata?.role || 'Vendedor',
  };
}
