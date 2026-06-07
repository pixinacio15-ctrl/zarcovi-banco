-- ============================================================
-- ZARCOVI RPG BANCO - SQL ÚNICO PARA COLAR NO SUPABASE
-- Projeto novo: Supabase + Cloudflare Pages + GitHub
-- Execute este arquivo inteiro no Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

-- ----------------------------
-- Tipos
-- ----------------------------
do $$ begin
  create type public.zarcovi_role as enum ('player', 'staff', 'admin', 'owner');
exception when duplicate_object then null;
end $$;

-- ----------------------------
-- Contas oficiais vindas da planilha/forms
-- ----------------------------
create table if not exists public.zarcovi_accounts (
  id uuid primary key default gen_random_uuid(),
  account_code text not null unique,
  village text,
  level integer not null default 1 check (level >= 0),
  ryos_visible numeric(20,2) not null default 0 check (ryos_visible >= 0),
  salary numeric(20,2) not null default 0 check (salary >= 0),
  cargos text not null default 'Sem Cargo',
  will_fire integer not null default 0,
  will_stone integer not null default 0,
  character_name text,
  treasure numeric(30,2) not null default 0 check (treasure >= 0),
  source_row integer,
  source_hash text,
  is_active boolean not null default true,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_zarcovi_accounts_code on public.zarcovi_accounts (account_code);
create index if not exists idx_zarcovi_accounts_village on public.zarcovi_accounts (village);
create index if not exists idx_zarcovi_accounts_level on public.zarcovi_accounts (level desc);
create index if not exists idx_zarcovi_accounts_ryos on public.zarcovi_accounts (ryos_visible desc);

-- ----------------------------
-- Perfil do usuário do app, ligado ao Supabase Auth
-- ----------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nick text not null,
  zarcovi_account_id uuid references public.zarcovi_accounts(id) on delete set null,
  zarcovi_account_code text,
  role public.zarcovi_role not null default 'player',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_user_profiles_email on public.user_profiles (lower(email));
create unique index if not exists uq_user_profiles_account_code on public.user_profiles (upper(zarcovi_account_code)) where zarcovi_account_code is not null;
create index if not exists idx_user_profiles_role on public.user_profiles (role);

-- ----------------------------
-- Histórico financeiro/manual staff
-- ----------------------------
create table if not exists public.ryo_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.zarcovi_accounts(id) on delete cascade,
  account_code text not null,
  amount numeric(20,2) not null,
  before_ryos numeric(20,2) not null,
  after_ryos numeric(20,2) not null,
  reason text not null default 'Ajuste manual',
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ryo_transactions_account on public.ryo_transactions (account_code, created_at desc);

-- ----------------------------
-- Rodadas de sincronização da planilha/forms
-- ----------------------------
create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  status text not null check (status in ('running', 'success', 'error')),
  total_rows integer not null default 0,
  inserted_rows integer not null default 0,
  updated_rows integer not null default 0,
  ignored_rows integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- ----------------------------
-- Logs simples do sistema
-- ----------------------------
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info',
  area text not null default 'system',
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------
-- Trigger updated_at
-- ----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_zarcovi_accounts_updated_at on public.zarcovi_accounts;
create trigger trg_zarcovi_accounts_updated_at
before update on public.zarcovi_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- ----------------------------
-- Helpers de segurança
-- ----------------------------
create or replace function public.current_user_role()
returns public.zarcovi_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.user_profiles where id = auth.uid()), 'player'::public.zarcovi_role);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('staff', 'admin', 'owner');
$$;

-- ----------------------------
-- RPC: perfil atual
-- ----------------------------
create or replace function public.my_profile()
returns table (
  user_id uuid,
  email text,
  nick text,
  role public.zarcovi_role,
  account_code text,
  village text,
  level integer,
  ryos_visible numeric,
  salary numeric,
  cargos text,
  will_fire integer,
  will_stone integer,
  character_name text,
  treasure numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.nick,
    p.role,
    a.account_code,
    a.village,
    a.level,
    a.ryos_visible,
    a.salary,
    a.cargos,
    a.will_fire,
    a.will_stone,
    a.character_name,
    a.treasure
  from public.user_profiles p
  left join public.zarcovi_accounts a on a.id = p.zarcovi_account_id
  where p.id = auth.uid() and p.is_blocked = false;
$$;

-- ----------------------------
-- RPC: ranking público limitado
-- ----------------------------
create or replace function public.public_ranking(limit_count integer default 50)
returns table (
  position bigint,
  account_code text,
  village text,
  level integer,
  ryos_visible numeric,
  character_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    row_number() over(order by a.level desc, a.ryos_visible desc, a.account_code asc) as position,
    a.account_code,
    a.village,
    a.level,
    a.ryos_visible,
    a.character_name
  from public.zarcovi_accounts a
  where a.is_active = true
  order by a.level desc, a.ryos_visible desc, a.account_code asc
  limit greatest(1, least(coalesce(limit_count, 50), 100));
$$;

-- ----------------------------
-- RLS
-- ----------------------------
alter table public.zarcovi_accounts enable row level security;
alter table public.user_profiles enable row level security;
alter table public.ryo_transactions enable row level security;
alter table public.sync_runs enable row level security;
alter table public.system_logs enable row level security;

-- Limpa políticas antigas se reexecutar o SQL
DROP POLICY IF EXISTS "accounts_select_authenticated" ON public.zarcovi_accounts;
DROP POLICY IF EXISTS "accounts_staff_all" ON public.zarcovi_accounts;
DROP POLICY IF EXISTS "profiles_self_select" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_staff_select" ON public.user_profiles;
DROP POLICY IF EXISTS "transactions_self_select" ON public.ryo_transactions;
DROP POLICY IF EXISTS "transactions_staff_select" ON public.ryo_transactions;
DROP POLICY IF EXISTS "sync_staff_select" ON public.sync_runs;
DROP POLICY IF EXISTS "logs_staff_select" ON public.system_logs;

create policy "accounts_select_authenticated"
on public.zarcovi_accounts for select
to authenticated
using (is_active = true);

create policy "accounts_staff_all"
on public.zarcovi_accounts for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "profiles_self_select"
on public.user_profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_self_update"
on public.user_profiles for update
to authenticated
using (id = auth.uid() and is_blocked = false)
with check (id = auth.uid() and role = public.current_user_role());

create policy "profiles_staff_select"
on public.user_profiles for select
to authenticated
using (public.is_staff());

create policy "transactions_self_select"
on public.ryo_transactions for select
to authenticated
using (
  account_code in (
    select zarcovi_account_code
    from public.user_profiles
    where id = auth.uid()
  )
);

create policy "transactions_staff_select"
on public.ryo_transactions for select
to authenticated
using (public.is_staff());

create policy "sync_staff_select"
on public.sync_runs for select
to authenticated
using (public.is_staff());

create policy "logs_staff_select"
on public.system_logs for select
to authenticated
using (public.is_staff());

-- ----------------------------
-- Grants
-- ----------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on public.zarcovi_accounts to authenticated;
grant select on public.user_profiles to authenticated;
grant select on public.ryo_transactions to authenticated;
grant select on public.sync_runs to authenticated;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.public_ranking(integer) to anon, authenticated;

-- Service role já ignora RLS; usado pelas Cloudflare Functions para sync/admin.

-- ----------------------------
-- Conta exemplo opcional: pode apagar depois
-- ----------------------------
insert into public.system_logs(level, area, message, payload)
values ('info', 'setup', 'Schema Zarcovi RPG Banco instalado', jsonb_build_object('installed_at', now()))
on conflict do nothing;
