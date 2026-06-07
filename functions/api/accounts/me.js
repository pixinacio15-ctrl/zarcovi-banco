import { json, corsHeaders, getUserFromRequest, supabaseFetch } from '../../_shared/supabase.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  try {
    const user = await getUserFromRequest(context);
    if (!user) return json({ error: 'Não autenticado.' }, 401, corsHeaders());

    const result = await supabaseFetch(
      context,
      '/rest/v1/rpc/my_profile',
      { method: 'POST', body: JSON.stringify({}) },
      false
    );
    if (!result.ok) return json({ error: 'Erro ao carregar perfil.', detail: result.data }, result.status, corsHeaders());
    return json({ ok: true, user, profile: Array.isArray(result.data) ? result.data[0] : result.data }, 200, corsHeaders());
  } catch (error) {
    return json({ error: error.message }, 500, corsHeaders());
  }
}
