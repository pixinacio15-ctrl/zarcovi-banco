-- ZARCOVI RPG BANCO - SQL LIMPO
-- Use este arquivo quando der erro de coluna antiga.
-- ATENÇÃO: apaga as tabelas antigas deste projeto e cria tudo de novo.

-- LIMPAR VERSÕES ANTIGAS
drop trigger if exists on_auth_user_created_zarcovi on auth.users;
drop table if exists public.ryo_transactions cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.sync_logs cascade;
drop table if exists public.rpg_accounts cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

create extension if not exists pgcrypto;

create table if not exists public.rpg_accounts (
  id uuid primary key default gen_random_uuid(),
  account_code text not null unique,
  village text,
  level integer not null default 1,
  ryos_visible numeric not null default 0,
  salary numeric not null default 0,
  cargo text not null default 'Sem Cargo',
  fire_will numeric not null default 0,
  stone_will numeric not null default 0,
  character_name text,
  treasure numeric not null default 0,
  ranking_position bigint,
  source_row integer,
  source_hash text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_code text not null unique references public.rpg_accounts(account_code) on update cascade on delete restrict,
  display_name text,
  role text not null default 'player' check (role in ('player', 'staff', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ryo_transactions (
  id uuid primary key default gen_random_uuid(),
  account_code text not null references public.rpg_accounts(account_code) on update cascade on delete restrict,
  amount numeric not null,
  balance_before numeric not null default 0,
  balance_after numeric not null default 0,
  reason text not null default 'Ajuste staff',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'google_sheet',
  status text not null default 'ok',
  imported_count integer not null default 0,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rpg_accounts_account_code on public.rpg_accounts(account_code);
create index if not exists idx_rpg_accounts_village on public.rpg_accounts(village);
create index if not exists idx_user_profiles_account_code on public.user_profiles(account_code);
create index if not exists idx_ryo_transactions_account_code on public.ryo_transactions(account_code);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_rpg_accounts_updated_at on public.rpg_accounts;
create trigger trg_rpg_accounts_updated_at
before update on public.rpg_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  code := upper(trim(coalesce(new.raw_user_meta_data->>'account_code', '')));

  if code = '' then
    raise exception 'account_code ausente';
  end if;

  if not exists (select 1 from public.rpg_accounts where account_code = code) then
    raise exception 'Conta Zarcovi não existe no banco sincronizado: %', code;
  end if;

  insert into public.user_profiles (id, account_code, display_name, role)
  values (
    new.id,
    code,
    coalesce(new.raw_user_meta_data->>'display_name', code),
    'player'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_zarcovi on auth.users;
create trigger on_auth_user_created_zarcovi
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.rpg_accounts enable row level security;
alter table public.user_profiles enable row level security;
alter table public.ryo_transactions enable row level security;
alter table public.sync_logs enable row level security;

-- Consulta pública da ficha básica. Se quiser esconder tudo antes do login, troque anon por authenticated.
drop policy if exists "rpg_accounts_select" on public.rpg_accounts;
create policy "rpg_accounts_select"
on public.rpg_accounts
for select
to anon, authenticated
using (true);

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "ryo_transactions_select_own_or_staff" on public.ryo_transactions;
create policy "ryo_transactions_select_own_or_staff"
on public.ryo_transactions
for select
to authenticated
using (
  account_code in (
    select account_code from public.user_profiles where id = auth.uid()
  )
  or exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role in ('staff', 'admin')
  )
);

drop policy if exists "sync_logs_staff_read" on public.sync_logs;
create policy "sync_logs_staff_read"
on public.sync_logs
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role in ('staff', 'admin')
  )
);

-- Conta inicial opcional para liberar cadastro do dono antes do sync.
insert into public.rpg_accounts (
  account_code, village, level, ryos_visible, salary, cargo, fire_will, stone_will, character_name, treasure, last_synced_at
)
values (
  'MY9314', 'MoyaGakure', 1, 8547, 300, 'Sem Cargo', 0, 0, 'Kakuzu', 0, now()
)
on conflict (account_code) do update set
  village = excluded.village,
  level = excluded.level,
  ryos_visible = excluded.ryos_visible,
  salary = excluded.salary,
  cargo = excluded.cargo,
  fire_will = excluded.fire_will,
  stone_will = excluded.stone_will,
  character_name = excluded.character_name,
  treasure = excluded.treasure,
  last_synced_at = now();
