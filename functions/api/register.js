import { json, corsHeaders, supabaseFetch } from '../_shared/supabase.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const nick = String(body.nick || '').trim();
    const accountCode = String(body.account_code || '').trim().toUpperCase();

    if (!email || !password || !nick || !accountCode) {
      return json({ error: 'Preencha email, senha, nick e conta Zarcovi.' }, 400, corsHeaders());
    }
    if (password.length < 6) {
      return json({ error: 'A senha precisa ter no mínimo 6 caracteres.' }, 400, corsHeaders());
    }
    if (!/^[A-Z]{2}\d{4}$/.test(accountCode)) {
      return json({ error: 'Conta Zarcovi inválida. Use formato tipo MY9314.' }, 400, corsHeaders());
    }

    const accountResult = await supabaseFetch(
      context,
      `/rest/v1/zarcovi_accounts?account_code=eq.${encodeURIComponent(accountCode)}&select=id,account_code,is_active`,
      { method: 'GET' },
      true
    );
    if (!accountResult.ok) return json({ error: 'Erro ao consultar conta Zarcovi.', detail: accountResult.data }, 500, corsHeaders());
    const account = Array.isArray(accountResult.data) ? accountResult.data[0] : null;
    if (!account || !account.is_active) {
      return json({ error: 'Conta Zarcovi não encontrada na planilha sincronizada.' }, 404, corsHeaders());
    }

    const createUser = await supabaseFetch(
      context,
      '/auth/v1/admin/users',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { nick, account_code: accountCode }
        })
      },
      true
    );
    if (!createUser.ok) return json({ error: 'Erro ao criar login.', detail: createUser.data }, createUser.status, corsHeaders());

    const userId = createUser.data.id;
    const profile = await supabaseFetch(
      context,
      '/rest/v1/user_profiles',
      {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          id: userId,
          email,
          nick,
          zarcovi_account_id: account.id,
          zarcovi_account_code: accountCode,
          role: 'player'
        })
      },
      true
    );
    if (!profile.ok) return json({ error: 'Login criado, mas falhou ao criar perfil.', detail: profile.data }, profile.status, corsHeaders());

    return json({ ok: true, message: 'Conta criada. Faça login para entrar.', profile: profile.data?.[0] || null }, 201, corsHeaders());
  } catch (error) {
    return json({ error: error.message || 'Erro interno.' }, 500, corsHeaders());
  }
}
