import type { APIRoute } from 'astro';
import { getSessionUserFromCookies, createSupabaseAdminClient } from '../../lib/auth';

export const prerender = false;

const ADMIN_EMAIL = 'eduardocastroc1@gmail.com';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Validar Admin
    const user = await getSessionUserFromCookies(cookies);
    if (!user || user.email !== ADMIN_EMAIL) {
      return Response.json({ message: 'No autorizado. Solo el Comandante puede registrar operadores.' }, { status: 403 });
    }

    // 2. Leer datos
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return Response.json({ message: 'Todos los campos son obligatorios.' }, { status: 400 });
    }

    // 3. Crear cliente admin (Service Role)
    const supabaseAdmin = createSupabaseAdminClient();

    // 4. Crear usuario en Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmación automática por ser admin
      user_metadata: {
        full_name: fullName,
        role: 'Vendedor'
      }
    });

    if (error) {
      return Response.json({ message: error.message }, { status: 400 });
    }

    return Response.json({
      ok: true,
      user: data.user
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return Response.json({ message }, { status: 500 });
  }
};
