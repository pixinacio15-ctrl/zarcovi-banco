# Zarcovi RPG Banco

Projeto simples:

1. Cola `supabase/schema.sql` no Supabase.
2. Sobe os arquivos no GitHub.
3. Conecta no Cloudflare Pages.
4. Configura variáveis.
5. Sincroniza a planilha pelo painel Staff.

## Build no Cloudflare Pages

```txt
Build command: npm run build
Build output directory: public
Framework preset: None
```

## Variáveis

```env
SUPABASE_URL=https://hwbglcdtpprmgkpdyjbo.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
ADMIN_TOKEN=seu_token_admin
SYNC_SOURCE_URL=url_csv_da_planilha
```

## Arquivo principal de comandos

Leia:

```txt
COMANDOS_COPIAR_COLAR.txt
```


## Correção account_code
Se aparecer `column account_code does not exist`, rode novamente `supabase/schema.sql`. Esta versão limpa tabelas antigas antes de criar tudo.
