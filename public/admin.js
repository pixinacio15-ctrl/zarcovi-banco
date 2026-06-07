const statusEl = document.querySelector('#status');
const tokenInput = document.querySelector('#adminToken');
tokenInput.value = localStorage.getItem('zarcovi_admin_token') || '';

function setStatus(msg, type = 'info') {
  statusEl.textContent = msg || '';
  statusEl.style.color = type === 'error' ? 'var(--danger)' : type === 'ok' ? 'var(--ok)' : 'var(--accent)';
}

function token() { return localStorage.getItem('zarcovi_admin_token') || tokenInput.value || ''; }

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': token(),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na API.');
  return data;
}

document.querySelector('#saveToken').addEventListener('click', () => {
  localStorage.setItem('zarcovi_admin_token', tokenInput.value);
  setStatus('Token salvo neste navegador.', 'ok');
});

document.querySelector('#syncBtn').addEventListener('click', async () => {
  setStatus('Sincronizando planilha...');
  try {
    const source_url = document.querySelector('#syncUrl').value.trim() || undefined;
    const data = await api('/api/sync', { method: 'POST', body: JSON.stringify({ source_url }) });
    setStatus(`Sincronizado: ${data.synced} contas.`, 'ok');
  } catch (error) { setStatus(error.message, 'error'); }
});

document.querySelector('#searchBtn').addEventListener('click', search);
document.querySelector('#searchQ').addEventListener('keydown', e => { if (e.key === 'Enter') search(); });

async function search() {
  setStatus('Buscando...');
  try {
    const q = encodeURIComponent(document.querySelector('#searchQ').value.trim());
    const data = await api(`/api/admin/search?q=${q}`);
    const rows = data.accounts || [];
    document.querySelector('#searchTable').innerHTML = `
      <thead><tr><th>Conta</th><th>Vila</th><th>Level</th><th>Ryos</th><th>Cargo</th><th>Personagem</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.account_code}</td><td>${r.village || '-'}</td><td>${r.level}</td><td>${Number(r.ryos_visible || 0).toLocaleString('pt-BR')}</td><td>${r.cargos || '-'}</td><td>${r.character_name || '-'}</td></tr>`).join('')}</tbody>`;
    setStatus(`${rows.length} resultado(s).`, 'ok');
  } catch (error) { setStatus(error.message, 'error'); }
}

document.querySelector('#ryosBtn').addEventListener('click', async () => {
  setStatus('Aplicando ajuste...');
  try {
    const data = await api('/api/admin/ryos', {
      method: 'POST',
      body: JSON.stringify({
        account_code: document.querySelector('#ryosAccount').value,
        amount: Number(document.querySelector('#ryosAmount').value),
        reason: document.querySelector('#ryosReason').value
      })
    });
    setStatus(`Ryos atualizados: ${data.before} → ${data.after}`, 'ok');
  } catch (error) { setStatus(error.message, 'error'); }
});

document.querySelector('#promoteBtn').addEventListener('click', async () => {
  setStatus('Aplicando cargo...');
  try {
    const data = await api('/api/admin/promote', {
      method: 'POST',
      body: JSON.stringify({
        email: document.querySelector('#promoteEmail').value,
        role: document.querySelector('#promoteRole').value
      })
    });
    setStatus(`Cargo aplicado: ${data.profile?.email || ''} → ${data.profile?.role || ''}`, 'ok');
  } catch (error) { setStatus(error.message, 'error'); }
});
