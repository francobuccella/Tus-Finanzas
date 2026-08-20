-- Tus Finanzas — esquema inicial. Pegar y ejecutar entero en el SQL Editor
-- del proyecto de Supabase (https://supabase.com/dashboard -> tu proyecto ->
-- SQL Editor -> New query -> pegar -> Run).

create extension if not exists pgcrypto;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  kind text not null default 'Cuenta',
  initial_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null default 'Otros',
  amount numeric not null check (amount > 0),
  note text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  category text not null,
  limit_amount numeric not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  ticker text,
  value numeric not null default 0,
  return_pct numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  target numeric not null check (target > 0),
  saved numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.holdings enable row level security;
alter table public.goals enable row level security;

do $$
declare t text;
begin
  foreach t in array array['accounts', 'transactions', 'budgets', 'holdings', 'goals'] loop
    execute format('create policy "select own" on public.%I for select using (user_id = auth.uid())', t);
    execute format('create policy "insert own" on public.%I for insert with check (user_id = auth.uid())', t);
    execute format('create policy "update own" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "delete own" on public.%I for delete using (user_id = auth.uid())', t);
  end loop;
end $$;
