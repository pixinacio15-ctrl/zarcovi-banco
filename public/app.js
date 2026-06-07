const cfg = window.ZARCOVI_CONFIG;
const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
const statusEl = document.querySelector('#status');
const dashboard = document.querySelector('#dashboard');
const profileGrid = document.querySelector('#profileGrid');
const profileTitle = document.querySelector('#profileTitle');

function setStatus(msg, type = 'info') {
  statusEl.textContent = msg || '';
  statusEl.style.color = type === 'error' ? 'var(--danger)' : type === 'ok' ? 'var(--ok)' : 'var(--accent)';
}

function stat(label, value) {
  return `<div class="stat"><span>${label}</span><strong>${value ?? '-'}</strong></div>`;
}

async function api(path, options = {}) {
  const { data } = await client.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Erro na requisição.');
  return json;
}

document.querySelector('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setStatus('Entrando...');
  const { error } = await client.auth.signInWithPassword({
    email: form.get('email'),
    password: form.get('password')
  });
  if (error) return setStatus(error.message, 'error');
  await loadMe();
  setStatus('Login realizado.', 'ok');
});

document.querySelector('#registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setStatus('Criando acesso...');
  try {
    const result = await fetch('/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nick: form.get('nick'),
        account_code: form.get('account_code'),
        email: form.get('email'),
        password: form.get('password')
      })
    });
    const data = await result.json();
    if (!result.ok) throw new Error(data.error || 'Erro ao cadastrar.');
    setStatus('Cadastro criado. Agora faça login.', 'ok');
    event.currentTarget.reset();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.querySelector('#logoutBtn').addEventListener('click', async () => {
  await client.auth.signOut();
  dashboard.classList.add('hidden');
  setStatus('Você saiu.', 'ok');
});

document.querySelector('#refreshRanking').addEventListener('click', loadRanking);

async function loadMe() {
  const { data } = await client.auth.getSession();
  if (!data.session) return;
  try {
    const me = await api('/api/accounts/me');
    const p = me.profile;
    if (!p) return;
    dashboard.classList.remove('hidden');
    profileTitle.textContent = `${p.nick || 'Jogador'} • ${p.account_code || 'sem conta'}`;
    profileGrid.innerHTML = [
      stat('Vila', p.village),
      stat('Level', p.level),
      stat('Ryos', Number(p.ryos_visible || 0).toLocaleString('pt-BR')),
      stat('Salário', Number(p.salary || 0).toLocaleString('pt-BR')),
      stat('Cargo', p.cargos),
      stat('Fogo', p.will_fire),
      stat('Pedra', p.will_stone),
      stat('Personagem', p.character_name),
      stat('Tesouro', Number(p.treasure || 0).toLocaleString('pt-BR'))
    ].join('');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function loadRanking() {
  try {
    const data = await api('/api/ranking?limit=50');
    const rows = data.ranking || [];
    document.querySelector('#rankingTable').innerHTML = `
      <thead><tr><th>#</th><th>Conta</th><th>Vila</th><th>Level</th><th>Ryos</th><th>Personagem</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.position}</td><td>${r.account_code}</td><td>${r.village || '-'}</td><td>${r.level}</td><td>${Number(r.ryos_visible || 0).toLocaleString('pt-BR')}</td><td>${r.character_name || '-'}</td></tr>`).join('')}</tbody>`;
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

loadMe();
loadRanking();
