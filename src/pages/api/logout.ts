import type { APIRoute } from 'astro';
import { clearAuthCookies } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);
  return Response.json({ ok: true });
};
