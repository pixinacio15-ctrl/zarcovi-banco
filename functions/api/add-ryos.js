import { json, options } from "../_shared/response.js";
import { supabaseRequest } from "../_shared/supabase-rest.js";

function checkAdmin(request, env) {
  const token = request.headers.get("x-admin-token") || "";
  return env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!checkAdmin(request, env)) return json({ error: "Token admin inválido." }, 401);

  try {
    const body = await request.json();
    const account = String(body.account_code || "").trim().toUpperCase();
    const amount = Number(body.amount || 0);
    const reason = String(body.reason || "Ajuste staff").trim();

    if (!/^[A-Z]{2}\d{4}$/i.test(account)) return json({ error: "Conta inválida." }, 400);
    if (!Number.isFinite(amount) || amount === 0) return json({ error: "Valor inválido." }, 400);

    const currentRows = await supabaseRequest(env, `rpg_accounts?account_code=eq.${encodeURIComponent(account)}&select=account_code,ryos_visible`);
    const current = currentRows?.[0];
    if (!current) return json({ error: "Conta não encontrada." }, 404);

    const before = Number(current.ryos_visible || 0);
    const after = before + amount;

    await supabaseRequest(env, `rpg_accounts?account_code=eq.${encodeURIComponent(account)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: { ryos_visible: after }
    });

    await supabaseRequest(env, "ryo_transactions", {
      method: "POST",
      prefer: "return=minimal",
      body: [{ account_code: account, amount, balance_before: before, balance_after: after, reason }]
    });

    return json({ ok: true, account_code: account, before, after });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
