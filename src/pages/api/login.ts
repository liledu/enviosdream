import type { APIRoute } from 'astro';
import { createSupabaseServerClient, setAuthCookies, toStaffSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '');

    if (!normalizedUsername || !normalizedPassword) {
      return Response.json({ message: 'Usuario y contraseña son obligatorios.' }, { status: 400 });
    }

    const email = normalizedUsername.includes('@')
      ? normalizedUsername
      : `${normalizedUsername.toLowerCase()}@empresa.com`;

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: normalizedPassword,
    });

    if (error || !data.session || !data.user) {
      return Response.json({ message: 'Credenciales incorrectas.' }, { status: 401 });
    }

    setAuthCookies(cookies, data.session);

    return Response.json({
      ok: true,
      session: toStaffSession(data.user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
    return Response.json({ message }, { status: 500 });
  }
};
