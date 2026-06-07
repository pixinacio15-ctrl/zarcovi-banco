import { json, corsHeaders, requireAdminToken, supabaseFetch } from '../../_shared/supabase.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  try {
    if (!requireAdminToken(context)) return json({ error: 'ADMIN_TOKEN inválido.' }, 401, corsHeaders());
    const url = new URL(context.request.url);
    const q = String(url.searchParams.get('q') || '').trim().toUpperCase();
    if (!q) return json({ ok: true, accounts: [] }, 200, corsHeaders());

    const result = await supabaseFetch(
      context,
      `/rest/v1/zarcovi_accounts?or=(account_code.ilike.*${encodeURIComponent(q)}*,village.ilike.*${encodeURIComponent(q)}*,character_name.ilike.*${encodeURIComponent(q)}*)&select=*&limit=50&order=level.desc`,
      { method: 'GET' },
      true
    );
    if (!result.ok) return json({ error: 'Erro na busca.', detail: result.data }, result.status, corsHeaders());
    return json({ ok: true, accounts: result.data }, 200, corsHeaders());
  } catch (error) {
    return json({ error: error.message }, 500, corsHeaders());
  }
}
