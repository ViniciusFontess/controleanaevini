-- Cartão de crédito, fatura, parcelamento e recorrências.
--
-- Aditiva e re-executável: nenhuma coluna é removida e nada é apagado. As
-- transações que já existiam eram todas à vista, então recebem
-- cash_date = occurred_on, que é o valor correto para elas.

-- ---------- accounts: cartão com ciclo próprio ----------

alter table public.accounts drop constraint if exists accounts_kind_check;
alter table public.accounts add constraint accounts_kind_check
  check (kind in ('asset', 'liability', 'credit_card'));

alter table public.accounts add column if not exists closing_day smallint;
alter table public.accounts add column if not exists due_day smallint;

-- Um cartão sem ciclo não tem como calcular quando o dinheiro sai; barrar aqui
-- e não só no formulário.
alter table public.accounts drop constraint if exists accounts_cycle_check;
alter table public.accounts add constraint accounts_cycle_check check (
  (kind <> 'credit_card' and closing_day is null and due_day is null)
  or
  (kind = 'credit_card'
     and closing_day between 1 and 31
     and due_day between 1 and 31)
);

-- ---------- recurrences: a regra, nunca o fato ----------

create table if not exists public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric(14,2) not null, -- positivo = receita, negativo = despesa
  day_of_month smallint not null check (day_of_month between 1 and 31),
  account_id uuid references public.accounts(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- transactions: segunda data, origem e parcelamento ----------

alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null,
  add column if not exists cash_date date,
  add column if not exists recurrence_id uuid references public.recurrences(id) on delete set null,
  add column if not exists installment_group uuid,
  add column if not exists installment_number smallint,
  add column if not exists installment_total smallint;

update public.transactions set cash_date = occurred_on where cash_date is null;
alter table public.transactions alter column cash_date set not null;

alter table public.transactions drop constraint if exists transactions_installment_check;
alter table public.transactions add constraint transactions_installment_check check (
  (installment_group is null and installment_number is null and installment_total is null)
  or
  (installment_group is not null
     and installment_total >= 2
     and installment_number between 1 and installment_total)
);

-- ---------- índices ----------

-- A tela de Caixa sempre consulta por janela de cash_date.
create index if not exists transactions_user_cash_date_idx
  on public.transactions(user_id, cash_date);
create index if not exists transactions_installment_group_idx
  on public.transactions(installment_group) where installment_group is not null;
create index if not exists recurrences_user_id_idx on public.recurrences(user_id);

-- ---------- RLS de recurrences ----------

alter table public.recurrences enable row level security;

drop policy if exists "recurrences_select_own" on public.recurrences;
drop policy if exists "recurrences_insert_own" on public.recurrences;
drop policy if exists "recurrences_update_own" on public.recurrences;
drop policy if exists "recurrences_delete_own" on public.recurrences;

create policy "recurrences_select_own" on public.recurrences for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "recurrences_insert_own" on public.recurrences for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "recurrences_update_own" on public.recurrences for update
  to authenticated using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );
create policy "recurrences_delete_own" on public.recurrences for delete
  to authenticated using ( (select auth.uid()) = user_id );
