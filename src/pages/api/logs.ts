import type { APIRoute, AstroCookies } from 'astro';
import { createSupabaseAdminClient, getSessionUserFromCookies } from '../../lib/auth';

export const prerender = false;

async function requireUser(cookies: AstroCookies) {
  const user = await getSessionUserFromCookies(cookies);

  if (!user) {
    return Response.json({ message: 'No autenticado.' }, { status: 401 });
  }

  return null;
}

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const unauthorized = await requireUser(cookies);
    if (unauthorized) return unauthorized;

    const isAll = url.searchParams.get('all') === 'true';
    const limit = isAll ? 100 : 8;

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return Response.json({ logs: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los logs.';
    return Response.json({ message }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const unauthorized = await requireUser(cookies);
    if (unauthorized) return unauthorized;

    const { message } = await request.json();
    const normalizedMessage = String(message || '').trim();

    if (!normalizedMessage) {
      return Response.json({ message: 'El log está vacío.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('logs').insert([{ mensaje: normalizedMessage }]);

    if (error) {
      throw error;
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el log.';
    return Response.json({ message }, { status: 500 });
  }
};
