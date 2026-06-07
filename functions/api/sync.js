import { json, options } from "../_shared/response.js";
import { supabaseRequest } from "../_shared/supabase-rest.js";
import { parseCsv, sheetRowsToAccounts } from "../_shared/csv.js";

function checkAdmin(request, env) {
  const token = request.headers.get("x-admin-token") || "";
  return env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!checkAdmin(request, env)) return json({ error: "Token admin inválido." }, 401);

  try {
    if (!env.SYNC_SOURCE_URL) return json({ error: "SYNC_SOURCE_URL não configurada." }, 400);

    const csvRes = await fetch(env.SYNC_SOURCE_URL, { headers: { "user-agent": "zarcovi-sync" } });
    if (!csvRes.ok) throw new Error(`Falha ao baixar planilha: ${csvRes.status}`);

    const csv = await csvRes.text();
    const rows = parseCsv(csv);
    const accounts = sheetRowsToAccounts(rows);

    if (!accounts.length) {
      throw new Error("Nenhuma conta encontrada no CSV.");
    }

    const batchSize = 500;
    let imported = 0;

    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      await supabaseRequest(env, "rpg_accounts?on_conflict=account_code", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: batch
      });
      imported += batch.length;
    }

    await supabaseRequest(env, "sync_logs", {
      method: "POST",
      prefer: "return=minimal",
      body: [{ source: "google_sheet", status: "ok", imported_count: imported, message: "Sync concluído" }]
    });

    return json({ ok: true, imported });
  } catch (error) {
    try {
      await supabaseRequest(env, "sync_logs", {
        method: "POST",
        prefer: "return=minimal",
        body: [{ source: "google_sheet", status: "error", imported_count: 0, message: error.message }]
      });
    } catch {}
    return json({ error: error.message }, 500);
  }
}
