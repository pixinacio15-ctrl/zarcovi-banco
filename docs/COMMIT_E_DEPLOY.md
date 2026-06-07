# Commit e deploy

## Fluxo simples

1. Execute o SQL no Supabase:

```txt
supabase/schema.sql
```

2. Troque a anon key em:

```txt
public/config.js
wrangler.toml
```

3. Faça commit:

```bash
git init
git add .
git commit -m "Criar banco Zarcovi RPG"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

4. No Cloudflare Pages, conecte o repo.

Build:

```txt
npm run build
```

Output:

```txt
public
```

5. Configure secrets:

```env
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_TOKEN
SYNC_SOURCE_URL
```

6. Abra `/admin.html` e sincronize.
