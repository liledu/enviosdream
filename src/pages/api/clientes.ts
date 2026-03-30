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

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const unauthorized = await requireUser(cookies);
    if (unauthorized) return unauthorized;

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from('clientes').select('*').order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return Response.json({ clients: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los clientes.';
    return Response.json({ message }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const unauthorized = await requireUser(cookies);
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const selectedId = body.id ? Number(body.id) : null;

    const payload = {
      codigo: String(body.codigo || '').trim() || undefined,
      nombre: String(body.nombre || '').trim() || 'Sin nombre',
      celular: String(body.celular || '').trim() || 'No registrado',
      direccion: String(body.direccion || '').trim() || 'Direccion no registrada',
    };

    const supabase = createSupabaseAdminClient();

    if (selectedId) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', selectedId);
      if (error) throw error;
      return Response.json({ ok: true, message: 'Cliente actualizado en Supabase.' });
    }

    const { error } = await supabase.from('clientes').insert([payload]);
    if (error) throw error;

    return Response.json({ ok: true, message: 'Cliente creado en Supabase.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el cliente.';
    return Response.json({ message }, { status: 500 });
  }
};
