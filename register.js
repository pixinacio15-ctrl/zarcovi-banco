# Zarcovi RPG Banco

Banco funcional para o RPG Zarcovi usando:

- Supabase PostgreSQL
- Supabase Auth
- Cloudflare Pages
- Cloudflare Pages Functions
- GitHub
- Google Planilhas/Formulários como fonte principal

## Fluxo simples

1. Abra o Supabase.
2. Vá em **SQL Editor**.
3. Cole o arquivo `supabase/schema.sql`.
4. Execute.
5. Suba todos os arquivos deste projeto no GitHub.
6. Conecte o repositório no Cloudflare Pages.
7. Configure:

```txt
Build command: npm run build
Build output directory: public
Deploy command: vazio
```

8. Adicione as variáveis no Cloudflare Pages.
9. Faça deploy.
10. Acesse o site.

## Variáveis necessárias

```env
SUPABASE_URL=https://hwbglcdtpprmgkpdyjbo.supabase.co
SUPABASE_ANON_KEY=cole_a_anon_key
SUPABASE_SERVICE_ROLE_KEY=cole_a_service_role_key
ADMIN_TOKEN=crie_um_token_forte
SYNC_SOURCE_URL=https://docs.google.com/spreadsheets/d/1cUVGRl63tyJvxRK-9nlAhnLBdgunEy9OU-sKYNIx83Y/export?format=csv&gid=1529142004
```

## Importante

A `SUPABASE_ANON_KEY` pode ficar no frontend.

A `SUPABASE_SERVICE_ROLE_KEY` não pode ir para GitHub público.
Use apenas nas variáveis do Cloudflare Pages.

## Cadastro

O usuário cria acesso usando:

- Conta Zarcovi
- Email opcional
- Senha do app

Aviso mostrado no site:

> Nunca use a senha real da sua conta Zarcovi. Crie uma senha apenas para este app.

## Sync

O endpoint `/api/sync`:

- recebe `ADMIN_TOKEN`;
- lê `SYNC_SOURCE_URL`;
- baixa CSV da planilha;
- encontra colunas como `Vila`, `CONTA`, `Level`, `Ryos Visível`, `Salário`, `Cargos`, `V. Fogo`, `V. Pedra`, `Personagem`, `Tesouro`;
- importa para `rpg_accounts`;
- registra em `sync_logs`.

## Estrutura

```txt
public/                  site
functions/api/           API Cloudflare Pages
functions/_core/         núcleo Supabase e CSV
functions/_security/     auth e admin token
supabase/schema.sql      SQL único para colar
google-apps-script/      exportador CSV opcional
COMANDOS_COPIAR_COLAR.txt
```

## Não usar

Não use `wrangler deploy`.
Não coloque comando de implantação.
Não use `.bat`.

No Cloudflare Pages:

```txt
Build command: npm run build
Build output directory: public
Deploy command: vazio
```
