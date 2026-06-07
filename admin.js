import { getUserFromRequest } from '../../_security/auth.js';
import { json, qs, supabaseFetch } from '../../_core/supabase.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUserFromRequest(request, env);
    const profiles = await supabaseFetch(
      env,
      `/rest/v1/user_profiles?user_id=eq.${qs(user.id)}&select=*`,
      { method: 'GET' },
      true
    );
    const profile = profiles?.[0] || null;
    return json({ user, profile });
  } catch (err) {
    return json({ error: err.message }, 401);
  }
}
