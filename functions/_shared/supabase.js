export function getEnv(context) {
  const env = context.env || {};
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  for (const key of required) {
    if (!env[key]) throw new Error(`Variável ausente: ${key}`);
  }
  return env;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders
    }
  });
}

export function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, x-admin-token'
  };
}

export async function supabaseFetch(context, path, options = {}, useServiceRole = false) {
  const env = getEnv(context);
  const key = useServiceRole ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  if (useServiceRole && !key) throw new Error('Variável ausente: SUPABASE_SERVICE_ROLE_KEY');

  const res = await fetch(`${env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    return { ok: false, status: res.status, data };
  }
  return { ok: true, status: res.status, data };
}

export async function getUserFromRequest(context) {
  const env = getEnv(context);
  const auth = context.request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function getProfileByUserId(context, userId) {
  const result = await supabaseFetch(
    context,
    `/rest/v1/user_profiles?id=eq.${encodeURIComponent(userId)}&select=*`,
    { method: 'GET' },
    true
  );
  if (!result.ok) return null;
  return Array.isArray(result.data) ? result.data[0] : null;
}

export function requireAdminToken(context) {
  const env = context.env || {};
  const sent = context.request.headers.get('x-admin-token') || '';
  if (!env.ADMIN_TOKEN || sent !== env.ADMIN_TOKEN) {
    return false;
  }
  return true;
}
