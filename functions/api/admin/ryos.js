import { json, corsHeaders, requireAdminToken, supabaseFetch } from '../../_shared/supabase.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    if (!requireAdminToken(context)) return json({ error: 'ADMIN_TOKEN inválido.' }, 401, corsHeaders());

    const body = await context.request.json();
    const accountCode = String(body.account_code || '').trim().toUpperCase();
    const amount = Number(body.amount || 0);
    const reason = String(body.reason || 'Ajuste manual').trim();

    if (!/^[A-Z]{2}\d{4}$/.test(accountCode)) return json({ error: 'Conta inválida.' }, 400, corsHeaders());
    if (!Number.isFinite(amount) || amount === 0) return json({ error: 'Valor inválido.' }, 400, corsHeaders());

    const found = await supabaseFetch(context, `/rest/v1/zarcovi_accounts?account_code=eq.${encodeURIComponent(accountCode)}&select=*`, { method: 'GET' }, true);
    if (!found.ok) return json({ error: 'Erro ao buscar conta.', detail: found.data }, found.status, corsHeaders());
    const account = found.data?.[0];
    if (!account) return json({ error: 'Conta não encontrada.' }, 404, corsHeaders());

    const before = Number(account.ryos_visible || 0);
    const after = Math.max(0, before + amount);

    const update = await supabaseFetch(context, `/rest/v1/zarcovi_accounts?id=eq.${encodeURIComponent(account.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ ryos_visible: after })
    }, true);
    if (!update.ok) return json({ error: 'Erro ao atualizar ryos.', detail: update.data }, update.status, corsHeaders());

    await supabaseFetch(context, '/rest/v1/ryo_transactions', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.id,
        account_code: accountCode,
        amount,
        before_ryos: before,
        after_ryos: after,
        reason,
        created_by_email: 'admin-token'
      })
    }, true);

    return json({ ok: true, account: update.data?.[0] || null, before, after }, 200, corsHeaders());
  } catch (error) {
    return json({ error: error.message }, 500, corsHeaders());
  }
}
