# Primeiro passo: SQL

Cole o arquivo abaixo no Supabase SQL Editor:

```txt
supabase/schema.sql
```

Ele cria:

- `zarcovi_accounts`
- `user_profiles`
- `ryo_transactions`
- `sync_runs`
- `system_logs`
- RLS
- políticas de segurança
- funções `my_profile()` e `public_ranking()`

Depois do SQL executado, o site já pode cadastrar usuários quando a planilha for sincronizada.
