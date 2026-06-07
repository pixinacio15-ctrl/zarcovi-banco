import { json, corsHeaders, supabaseFetch } from '../_shared/supabase.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
  const result = await supabaseFetch(
    context,
    '/rest/v1/rpc/public_ranking',
    { method: 'POST', body: JSON.stringify({ limit_count: limit }) },
    false
  );
  if (!result.ok) return json({ error: 'Erro ao carregar ranking.', detail: result.data }, result.status, corsHeaders());
  return json({ ok: true, ranking: result.data }, 200, corsHeaders());
}
