import { authAdmin, cleanAccountCode, json, qs, readBody, supabaseFetch } from '../../_core/supabase.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await readBody(request);
    const accountCode = cleanAccountCode(body.account_code);
    const password = String(body.password || '');
    const displayName = String(body.display_name || '').trim() || accountCode;
    const email = String(body.email || `${accountCode}@zarcovi-rpg.app`).trim().toLowerCase();

    if (!accountCode) return json({ error: 'Informe a conta Zarcovi.' }, 400);
    if (password.length < 6) return json({ error: 'A senha do app precisa ter pelo menos 6 caracteres.' }, 400);

    const found = await supabaseFetch(
      env,
      `/rest/v1/rpg_accounts?account_code=eq.${qs(accountCode)}&select=account_code&limit=1`,
      { method: 'GET' },
      true
    );

    if (!found?.length) {
      return json({ error: 'Conta não encontrada no banco Zarcovi. Sincronize a planilha primeiro.' }, 404);
    }

    const created = await authAdmin(env, '/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          account_code: accountCode,
          display_name: displayName
        }
      })
    });

    const userId = created?.user?.id || created?.id;
    if (!userId) throw new Error('Usuário criado, mas o Supabase não retornou ID.');

    await supabaseFetch(env, '/rest/v1/user_profiles?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        account_code: accountCode,
        display_name: displayName,
        role: 'user'
      })
    }, true);

    return json({ ok: true, email, account_code: accountCode });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
