import type { APIRoute } from 'astro';
import { getSessionUserFromCookies, toStaffSession } from '../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const user = await getSessionUserFromCookies(cookies);

    if (!user) {
      return Response.json({ message: 'No autenticado.' }, { status: 401 });
    }

    return Response.json({
      ok: true,
      session: toStaffSession(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo leer la sesión.';
    return Response.json({ message }, { status: 500 });
  }
};
