import { json, corsHeaders, requireAdminToken, supabaseFetch } from '../../_shared/supabase.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    if (!requireAdminToken(context)) return json({ error: 'ADMIN_TOKEN inválido.' }, 401, corsHeaders());
    const body = await context.request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || 'staff').trim();
    if (!email || !['player', 'staff', 'admin', 'owner'].includes(role)) return json({ error: 'Email ou cargo inválido.' }, 400, corsHeaders());

    const result = await supabaseFetch(context, `/rest/v1/user_profiles?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ role })
    }, true);
    if (!result.ok) return json({ error: 'Erro ao promover usuário.', detail: result.data }, result.status, corsHeaders());
    return json({ ok: true, profile: result.data?.[0] || null }, 200, corsHeaders());
  } catch (error) {
    return json({ error: error.message }, 500, corsHeaders());
  }
}
