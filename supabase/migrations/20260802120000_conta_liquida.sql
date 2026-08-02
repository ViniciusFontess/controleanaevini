-- Distingue dinheiro disponível de dinheiro investido.
--
-- Ambos contam igual no patrimônio líquido; só a tela de Caixa muda, porque ela
-- projeta o saldo da conta e não pode partir de dinheiro que está rendendo em
-- renda fixa.
--
-- O default é `false` de propósito: superestimar o caixa é o erro perigoso (faz
-- o app dizer "tranquilo" quando não está). Subestimar aparece na hora, como um
-- saldo zerado que o usuário corrige.

alter table public.accounts
  add column if not exists liquid boolean not null default false;

comment on column public.accounts.liquid is
  'Conta corrente/dinheiro: soma no saldo inicial da tela de Caixa. Investimento fica false.';

-- Só ativo pode ser líquido; passivo e cartão nunca são caixa.
alter table public.accounts drop constraint if exists accounts_liquid_check;
alter table public.accounts add constraint accounts_liquid_check
  check (kind = 'asset' or liquid = false);
