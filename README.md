# Zarcovi RPG Banco

Projeto novo para o banco do RPG Zarcovi usando:

- Supabase PostgreSQL + Auth
- Google Planilhas/Formulários como fonte principal de dados
- Cloudflare Pages + Pages Functions
- GitHub para deploy por commit

Sem scripts Windows. O fluxo é:

1. Cole `supabase/schema.sql` no SQL Editor do Supabase e execute.
2. Configure as variáveis no Cloudflare Pages.
3. Faça commit deste projeto no GitHub.
4. Conecte o repositório no Cloudflare Pages.
5. Use `/admin.html` para sincronizar a planilha.

---

## 1. SQL no Supabase

Abra:

```txt
Supabase Dashboard > SQL Editor > New query
```

Cole todo o conteúdo de:

```txt
supabase/schema.sql
```

Execute.

---

## 2. Variáveis no Cloudflare Pages

Configure em:

```txt
Cloudflare Pages > Projeto > Settings > Environment variables
```

Obrigatórias:

```env
SUPABASE_URL=https://hwbglcdtpprmgkpdyjbo.supabase.co
SUPABASE_ANON_KEY=cole_a_anon_key
SUPABASE_SERVICE_ROLE_KEY=cole_a_service_role_key
ADMIN_TOKEN=crie_um_token_forte
SYNC_SOURCE_URL=url_csv_da_planilha_ou_apps_script
```

A `SUPABASE_ANON_KEY` pode ficar no frontend. A `SUPABASE_SERVICE_ROLE_KEY` nunca deve aparecer no código público.

---

## 3. GitHub + Cloudflare Pages

Faça commit normal:

```bash
git init
git add .
git commit -m "Criar Zarcovi RPG Banco"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

Depois conecte esse repositório no Cloudflare Pages.

Configuração de build:

```txt
Build command: npm run build
Build output directory: public
```

---

## 4. Sincronização da planilha

Depois do deploy, acesse:

```txt
/admin.html
```

Cole o `ADMIN_TOKEN` e clique em sincronizar.

A planilha precisa entregar CSV com estas colunas:

```txt
Vila, CONTA, Level, Ryos Visível, Salário, Cargos, V. Fogo, V. Pedra, Personagem, Tesouro
```

Se sua planilha não exportar limpo, use o arquivo:

```txt
google-apps-script/planilha_para_csv.gs
```

como Web App no Google Apps Script para gerar um CSV normalizado.

---

## 5. Login e cadastro

O jogador se cadastra com:

- email
- senha do app
- nick
- conta Zarcovi

O sistema só deixa cadastrar se a conta Zarcovi existir na tabela sincronizada `zarcovi_accounts`.

---

## Estrutura

```txt
public/                  telas do site
functions/_shared/       núcleo compartilhado da API
functions/api/           rotas Cloudflare Pages Functions
supabase/schema.sql      SQL único para colar no Supabase
google-apps-script/      exportador CSV opcional
docs/                    guias rápidos
.github/workflows/       workflow opcional de deploy
```
