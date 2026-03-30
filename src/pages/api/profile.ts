import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
    const supabase = createSupabaseServerClient();
    
    // Get session
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return new Response(JSON.stringify({ error: 'No session' }), { status: 401 });
    }

    await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    const body = await request.json();
    const { fullName } = body;

    const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
    });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ user: data.user }), { status: 200 });
};
