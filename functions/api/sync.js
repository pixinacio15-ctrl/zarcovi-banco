import { json, corsHeaders, requireAdminToken, supabaseFetch } from '../_shared/supabase.js';
import { normalizeAccountsCSV } from '../_shared/csv.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  let syncRunId = null;
  try {
    if (!requireAdminToken(context)) {
      return json({ error: 'ADMIN_TOKEN inválido.' }, 401, corsHeaders());
    }

    const env = context.env || {};
    const body = await safeJson(context.request);
    const sourceUrl = body.source_url || env.SYNC_SOURCE_URL;
    if (!sourceUrl) return json({ error: 'Configure SYNC_SOURCE_URL ou envie source_url.' }, 400, corsHeaders());

    const run = await supabaseFetch(context, '/rest/v1/sync_runs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ source_url: sourceUrl, status: 'running' })
    }, true);
    if (run.ok) syncRunId = run.data?.[0]?.id || null;

    const csvRes = await fetch(sourceUrl, { headers: { 'cache-control': 'no-cache' } });
    if (!csvRes.ok) throw new Error(`Falha ao baixar CSV: HTTP ${csvRes.status}`);
    const csv = await csvRes.text();
    const accounts = normalizeAccountsCSV(csv);

    if (!accounts.length) throw new Error('Nenhuma conta válida encontrada no CSV.');

    const chunks = chunk(accounts, 500);
    let changed = 0;
    for (const part of chunks) {
      const result = await supabaseFetch(context, '/rest/v1/zarcovi_accounts?on_conflict=account_code', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(part.map(a => ({ ...a, is_active: true, synced_at: new Date().toISOString() })))
      }, true);
      if (!result.ok) throw new Error(`Erro no upsert: ${JSON.stringify(result.data)}`);
      changed += part.length;
    }

    if (syncRunId) {
      await supabaseFetch(context, `/rest/v1/sync_runs?id=eq.${encodeURIComponent(syncRunId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'success',
          total_rows: accounts.length,
          updated_rows: changed,
          finished_at: new Date().toISOString()
        })
      }, true);
    }

    return json({ ok: true, total: accounts.length, synced: changed }, 200, corsHeaders());
  } catch (error) {
    if (syncRunId) {
      await supabaseFetch(context, `/rest/v1/sync_runs?id=eq.${encodeURIComponent(syncRunId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'error', error_message: error.message, finished_at: new Date().toISOString() })
      }, true).catch(() => null);
    }
    return json({ error: error.message || 'Erro ao sincronizar.' }, 500, corsHeaders());
  }
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

async function safeJson(request) {
  try { return await request.json(); } catch { return {}; }
}
