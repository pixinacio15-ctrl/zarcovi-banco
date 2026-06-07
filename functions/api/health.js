import { json, options } from "../_shared/response.js";

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return options();
  return json({
    ok: true,
    project: "Zarcovi RPG Banco",
    supabase: Boolean(env.SUPABASE_URL),
    sync_source: Boolean(env.SYNC_SOURCE_URL)
  });
}
