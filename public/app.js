const cfg = window.ZARCOVI_CONFIG;
const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
const statusBox = $("status");

function setStatus(msg) {
  statusBox.textContent = typeof msg === "string" ? msg : JSON.stringify(msg, null, 2);
}

function accountEmail(code) {
  return `${String(code).trim().toLowerCase()}@zarcovi.local`;
}

function cleanCode(code) {
  return String(code || "").trim().toUpperCase();
}

function renderAccount(el, acc) {
  if (!acc) {
    el.innerHTML = `<span class="muted">Conta não encontrada.</span>`;
    return;
  }

  const rows = [
    ["Conta", acc.account_code],
    ["Vila", acc.village || "-"],
    ["Level", acc.level],
    ["Ryos", acc.ryos_visible],
    ["Salário", acc.salary],
    ["Cargo", acc.cargo || "-"],
    ["V. Fogo", acc.fire_will],
    ["V. Pedra", acc.stone_will],
    ["Personagem", acc.character_name || "-"],
    ["Tesouro", acc.treasure]
  ];

  el.innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join("");
}

async function getAccount(code) {
  const { data, error } = await client
    .from("rpg_accounts")
    .select("*")
    .eq("account_code", cleanCode(code))
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function refreshSession() {
  const { data } = await client.auth.getSession();
  const session = data.session;

  if (!session) {
    $("authArea").classList.remove("hidden");
    $("appArea").classList.add("hidden");
    $("logoutBtn").classList.add("hidden");
    return;
  }

  $("authArea").classList.add("hidden");
  $("appArea").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");

  const { data: profile, error } = await client
    .from("user_profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  if (profile?.account_code) renderAccount($("accountCard"), await getAccount(profile.account_code));
}

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const account_code = cleanCode(form.get("account_code"));
  const display_name = String(form.get("display_name") || account_code).trim();
  const password = String(form.get("password") || "");

  try {
    const exists = await getAccount(account_code);
    if (!exists) throw new Error("Essa conta ainda não está sincronizada no banco.");

    const { error } = await client.auth.signUp({
      email: accountEmail(account_code),
      password,
      options: { data: { account_code, display_name } }
    });

    if (error) throw error;
    setStatus("Cadastro criado. Agora entre com a conta e senha.");
  } catch (err) {
    setStatus(`Erro no cadastro: ${err.message}`);
  }
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const account_code = cleanCode(form.get("account_code"));
  const password = String(form.get("password") || "");

  try {
    const { error } = await client.auth.signInWithPassword({ email: accountEmail(account_code), password });
    if (error) throw error;
    setStatus("Login feito.");
    await refreshSession();
  } catch (err) {
    setStatus(`Erro no login: ${err.message}`);
  }
});

$("logoutBtn").addEventListener("click", async () => {
  await client.auth.signOut();
  setStatus("Saiu.");
  await refreshSession();
});

$("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const account_code = cleanCode(new FormData(e.target).get("account_code"));
  try {
    renderAccount($("searchResult"), await getAccount(account_code));
  } catch (err) {
    setStatus(`Erro na busca: ${err.message}`);
  }
});

$("syncForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = new FormData(e.target).get("token");
  try {
    const res = await fetch("/api/sync", { method: "POST", headers: { "x-admin-token": token } });
    const data = await res.json();
    setStatus(data);
  } catch (err) {
    setStatus(`Erro no sync: ${err.message}`);
  }
});

$("ryosForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  try {
    const res = await fetch("/api/add-ryos", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": form.get("token") },
      body: JSON.stringify({
        account_code: cleanCode(form.get("account_code")),
        amount: Number(form.get("amount")),
        reason: form.get("reason") || "Ajuste staff"
      })
    });
    const data = await res.json();
    setStatus(data);
  } catch (err) {
    setStatus(`Erro no ajuste: ${err.message}`);
  }
});

refreshSession().catch(err => setStatus(err.message));
