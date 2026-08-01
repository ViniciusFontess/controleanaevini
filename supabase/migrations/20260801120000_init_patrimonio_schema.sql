-- Patrimonio: initial schema (accounts, transactions, snapshots, goals)
-- All tables are per-user (auth.uid()) with RLS enforced.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('asset','liability')),
  category text not null,
  balance numeric(14,2) not null default 0,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric(14,2) not null, -- positive = receita, negative = despesa
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_date date not null, -- first day of the snapshot month
  total_assets numeric(14,2) not null,
  total_liabilities numeric(14,2) not null,
  net_worth numeric(14,2) not null,
  created_at timestamptz not null default now(),
  unique (user_id, month_date)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  target_date date,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists transactions_user_id_occurred_on_idx on public.transactions(user_id, occurred_on desc);
create index if not exists goals_user_id_idx on public.goals(user_id);

alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.snapshots enable row level security;
alter table public.goals enable row level security;

-- accounts policies
create policy "accounts_select_own" on public.accounts for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "accounts_insert_own" on public.accounts for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "accounts_update_own" on public.accounts for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "accounts_delete_own" on public.accounts for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- transactions policies
create policy "transactions_select_own" on public.transactions for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "transactions_insert_own" on public.transactions for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "transactions_update_own" on public.transactions for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "transactions_delete_own" on public.transactions for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- snapshots policies (insert/select only — a snapshot is a closed record)
create policy "snapshots_select_own" on public.snapshots for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "snapshots_insert_own" on public.snapshots for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "snapshots_delete_own" on public.snapshots for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- goals policies
create policy "goals_select_own" on public.goals for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "goals_insert_own" on public.goals for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "goals_update_own" on public.goals for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "goals_delete_own" on public.goals for delete
  to authenticated using ( (select auth.uid()) = user_id );
