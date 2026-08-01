-- Diagnóstico: rode no SQL Editor do Supabase para ver o que já existe.
-- Não altera nada.

-- 1) As quatro tabelas existem e o RLS está ligado?
select
  t.tablename,
  t.rowsecurity as rls_ligado,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = t.tablename) as politicas
from pg_tables t
where t.schemaname = 'public'
  and t.tablename in ('accounts', 'transactions', 'snapshots', 'goals')
order by t.tablename;

-- Esperado: 4 linhas, rls_ligado = true, e
--   accounts 4, transactions 4, snapshots 3, goals 4

-- 2) Quantas linhas cada tabela tem (todas, ignorando RLS)?
select 'accounts' as tabela, count(*) from public.accounts
union all select 'transactions', count(*) from public.transactions
union all select 'snapshots', count(*) from public.snapshots
union all select 'goals', count(*) from public.goals;

-- 3) Existe algum usuário cadastrado?
select id, email, email_confirmed_at, created_at
from auth.users
order by created_at desc
limit 5;
