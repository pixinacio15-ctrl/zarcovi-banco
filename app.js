<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Zarcovi RPG Banco</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div class="bg"></div>

  <header class="topbar">
    <div>
      <strong>Zarcovi RPG Banco</strong>
      <span>Banco de contas, ryos e níveis</span>
    </div>
    <nav>
      <button data-page="home">Início</button>
      <button data-page="login">Login</button>
      <button data-page="register">Cadastro</button>
      <button data-page="account">Minha Conta</button>
      <button data-page="staff">Staff</button>
      <button id="logoutBtn" class="ghost">Sair</button>
    </nav>
  </header>

  <main class="wrap">
    <section id="home" class="page active hero">
      <div class="card hero-card">
        <p class="badge">Zarcovi RPG</p>
        <h1>Banco oficial conectado à planilha</h1>
        <p>
          Consulte sua conta, veja ryos, level, vila, salário, personagem, tesouro e ranking.
        </p>
        <div class="notice">
          Nunca use a senha real da sua conta Zarcovi. Crie uma senha apenas para este app.
        </div>
        <div class="actions">
          <button data-page="register">Criar acesso</button>
          <button data-page="login" class="secondary">Entrar</button>
        </div>
      </div>
    </section>

    <section id="login" class="page grid2">
      <div class="card">
        <h2>Login</h2>
        <label>Email</label>
        <input id="loginEmail" type="email" placeholder="sua-conta@zarcovi-rpg.app" />
        <label>Senha do app</label>
        <input id="loginPassword" type="password" placeholder="Senha criada para o app" />
        <button id="loginBtn">Entrar</button>
        <p id="loginMsg" class="msg"></p>
      </div>
      <div class="card soft">
        <h3>Usando conta Zarcovi?</h3>
        <p>Se você cadastrou sem email, tente:</p>
        <code>CODIGO@zarcovi-rpg.app</code>
        <p>Exemplo:</p>
        <code>MY9314@zarcovi-rpg.app</code>
      </div>
    </section>

    <section id="register" class="page grid2">
      <div class="card">
        <h2>Criar acesso</h2>
        <label>Conta Zarcovi</label>
        <input id="regAccount" placeholder="Ex: MY9314" />
        <label>Nome no app</label>
        <input id="regName" placeholder="Seu nome ou apelido" />
        <label>Email opcional</label>
        <input id="regEmail" type="email" placeholder="Se vazio, será gerado automaticamente" />
        <label>Senha do app</label>
        <input id="regPassword" type="password" placeholder="Não use senha real da conta Zarcovi" />
        <button id="registerBtn">Cadastrar</button>
        <p id="registerMsg" class="msg"></p>
      </div>
      <div class="card danger">
        <h3>Aviso importante</h3>
        <p>Nunca use a senha real da sua conta Zarcovi.</p>
        <p>Crie uma senha nova somente para este app.</p>
      </div>
    </section>

    <section id="account" class="page">
      <div class="card">
        <h2>Minha Conta</h2>
        <button id="loadMeBtn">Carregar meus dados</button>
        <div id="accountBox" class="stats"></div>
        <h3>Histórico de ryos</h3>
        <div id="historyBox" class="list"></div>
      </div>
    </section>

    <section id="staff" class="page grid2">
      <div class="card">
        <h2>Painel Staff</h2>
        <label>ADMIN_TOKEN</label>
        <input id="adminToken" type="password" placeholder="Cole o token admin" />
        <button id="syncBtn">Sincronizar planilha</button>
        <p id="syncMsg" class="msg"></p>

        <hr />

        <label>Buscar conta</label>
        <input id="searchAccount" placeholder="Ex: MY9314" />
        <button id="searchBtn">Buscar</button>
        <div id="searchResult" class="stats"></div>
      </div>

      <div class="card">
        <h2>Ações Admin</h2>
        <label>Conta</label>
        <input id="adminAccount" placeholder="Ex: MY9314" />
        <label>Alterar ryos</label>
        <input id="ryoAmount" type="number" placeholder="Ex: 500 ou -500" />
        <label>Motivo</label>
        <input id="ryoReason" placeholder="Ex: Recompensa de missão" />
        <button id="adjustRyosBtn">Aplicar ryos</button>
        <p id="ryoMsg" class="msg"></p>

        <hr />

        <label>Promover conta</label>
        <input id="promoteAccount" placeholder="Ex: MY9314" />
        <label>Cargo</label>
        <select id="promoteRole">
          <option value="staff">staff</option>
          <option value="admin">admin</option>
          <option value="owner">owner</option>
        </select>
        <button id="promoteBtn">Promover</button>
        <p id="promoteMsg" class="msg"></p>
      </div>
    </section>
  </main>

  <script src="/config.js"></script>
  <script src="/app.js"></script>
</body>
</html>
