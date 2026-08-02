# Cartão de crédito, fatura, parcelamento e recorrências

Data: 2026-08-01
Status: aguardando revisão do usuário

## Problema

O app modela uma transação como valor + data + categoria. Isso não representa o
mês real do usuário:

- Quase todo gasto passa no cartão. A compra acontece num dia, mas o dinheiro só
  sai no vencimento da fatura — até 36 dias depois. Hoje o app trata os dois como
  o mesmo evento, então erra nas duas pontas: parece que houve saída de caixa no
  dia da compra, e a fatura não existe como dívida.
- Compras parceladas comprometem meses futuros. Não há como representá-las.
- Há receita diária (venda de brownie), salário fixo e rendas mensais. As
  recorrentes precisam ser relançadas na mão todo mês.
- A pergunta que o usuário mais faz — "o dinheiro sobrevive até o vencimento?" —
  não tem tela que responda.

## Decisões tomadas

Cada uma foi confirmada com o usuário antes de virar spec.

| # | Decisão | Alternativa recusada | Por quê |
|---|---|---|---|
| 1 | Dois regimes, em telas separadas: Fluxo por competência, Caixa por data de movimentação | Só um dos dois | As duas perguntas são legítimas e brigam entre si; separar evita que uma contamine a outra |
| 2 | Cartão é uma conta com `closing_day`/`due_day` | Data de pagamento fixa por app | Cada cartão tem seu ciclo; sem isso, compras no fim do ciclo caem na fatura errada |
| 3 | Fatura não é registro, é consulta | Tabela `invoices` com status e total | Total gravado e soma das transações divergem no primeiro edit; a fatura emerge dos dados |
| 4 | Parcelas são N transações criadas na compra, agrupadas | Uma compra + expansão em tempo de leitura | Cada parcela já carrega seu `cash_date`; a tela de Caixa funciona sem código novo |
| 5 | Parcela entra no Fluxo pelo valor da parcela, não pelo total | Total no mês da compra | Fluxo responde "quanto gastei este mês"; o total distorceria um mês e limparia os outros 11 |
| 6 | Recorrência só projeta; vira transação quando confirmada | Materializar automática | Projeção com entrada fantasma é pior que projeção nenhuma — o erro só aparece quando a fatura não passa |
| 7 | Venda de brownie é receita comum | Atividade de negócio com margem | É um app de patrimônio pessoal; a dimensão de negócio pode ser adicionada depois sem refazer nada |

## Premissas

Se alguma for falsa, o modelo muda e a spec precisa voltar.

- **A fatura é sempre paga integralmente no vencimento.** Rotativo e parcelamento
  de fatura ficam fora: eles transformam a fatura de evento em dívida com saldo e
  juros. *(Perguntado ao usuário; sem resposta até a escrita desta spec.)*
- Investimento continua como conta de ativo com saldo atualizado à mão. Sem
  aporte, rendimento ou carteira.
- Um único usuário por conta; nada de compartilhamento.

## Modelo de dados

### `accounts` (alterada)

- `kind` passa a aceitar `credit_card`, além de `asset` e `liability`.
- `closing_day smallint` e `due_day smallint` — obrigatórios quando
  `kind = 'credit_card'`, nulos nos demais. Constraint garante isso.
- Para `credit_card`, `balance` deixa de ser usado: o saldo é derivado das
  transações. Saldo manual dessincronizaria na primeira compra esquecida.

### `transactions` (alterada)

- `account_id uuid null references accounts(id)` — onde aconteceu. Nulo nas
  transações existentes, que eram todas à vista.
- `cash_date date not null` — quando o dinheiro se move. Igual a `occurred_on`
  fora do cartão; calculado pelo ciclo quando `account_id` é um cartão.
- `recurrence_id uuid null references recurrences(id)` — qual recorrência esta
  transação satisfaz.
- `installment_group uuid null`, `installment_number smallint null`,
  `installment_total smallint null` — parcelas da mesma compra.

Índice em `(user_id, cash_date)` para a tela de Caixa, que sempre consulta por
janela de datas.

### `recurrences` (nova)

`id, user_id, name, category, amount (assinado), day_of_month, account_id,
start_date, end_date null, active bool, created_at`

RLS por `user_id` nos quatro comandos, igual às demais tabelas.

Uma ocorrência prevista está materializada quando existe transação com aquele
`recurrence_id` no período. Não há tabela de ocorrências — o mesmo princípio da
decisão 3.

### Migração

Aditiva, sem perda. `cash_date` é preenchido com `occurred_on` no que já existe
(correto: eram transações à vista). A constraint de `kind` precisa ser dropada e
recriada para aceitar o novo valor.

## Cálculo do ciclo

Função pura em `finance.ts`, testada com `node --test` como o resto da lógica
financeira.

```
cashDateFor(purchaseDate, closingDay, dueDay) -> Date
```

Compra no dia ≤ `closingDay` fecha naquele mês; a partir de `closingDay + 1` vai
para o mês seguinte. O vencimento é o `dueDay` do mês do fechamento, ou do mês
seguinte quando `dueDay < closingDay`.

Casos cobertos por teste:

- véspera, dia e dia seguinte ao fechamento
- virada de ano (compra em dezembro vencendo em janeiro)
- fevereiro, e `dueDay`/`closingDay` 29–31 em meses curtos (clamp para o último
  dia do mês)
- cartão com `dueDay < closingDay` (fecha 28, vence 5 — vencimento no mês
  seguinte)
- parcelamento: a parcela N vence N−1 meses depois da primeira

## Patrimônio líquido

Passa a ser `ativos − passivos − faturas em aberto`, onde fatura em aberto é a
soma das transações de cartão com `cash_date` futuro.

**O número exibido vai cair quando isso subir**, e o novo é o correto: a compra
de ontem já é dívida, mesmo que o dinheiro saia no dia 25.

## Telas

### Fluxo (existente, alterada)

Continua por competência. Cada linha passa a indicar conta ou cartão, e parcela
aparece como `Notebook (3/12)`.

Editar ou excluir uma parcela age sobre o grupo inteiro, com confirmação
explícita dizendo quantas parcelas serão afetadas.

### Caixa (nova)

Os próximos 60 dias em ordem, com saldo correndo. Cada dia mostra entradas e
saídas por `cash_date`; o dia do vencimento mostra a fatura consolidada.
Recorrências previstas aparecem em cinza com ação de confirmar — contam na
projeção, nunca no passado.

Estado vazio precisa funcionar: usuário sem contas, sem recorrências e sem
transações vê um convite a cadastrar, não uma tela quebrada.

### Lançamento rápido (novo)

Para a venda diária: campo de valor, categoria lembrada do último lançamento,
data de hoje. Um toque para salvar, sem sair da tela.

### Patrimônio (existente, alterada)

Cartões aparecem em Passivos com a fatura em aberto como valor.

## Erros e casos de borda

- Cartão sem `closing_day`/`due_day` é impedido na constraint, não só no
  formulário.
- Parcelamento exige `installment_total >= 2`; 1x é compra normal.
- Recorrência com `day_of_month` 29–31 em mês curto cai no último dia do mês.
- Confirmar uma recorrência duas vezes não pode gerar transação duplicada.
- Tela de Caixa com listas vazias não pode quebrar (`Math.max(...[])` etc.).

## Testes

Lógica pura em `finance.ts`, coberta por `node --test` — o padrão já existente no
projeto:

- `cashDateFor` nos casos listados acima
- geração de parcelas: 12x gera 12 datas, uma por mês, somando o total original
  (com a sobra de centavos na primeira parcela, não espalhada)
- ocorrências previstas de uma recorrência numa janela de datas
- saldo correndo da tela de Caixa, incluindo janela sem nenhum movimento

## Fora de escopo

- Rotativo e pagamento parcial de fatura
- Open Finance / importação automática (é integração regulada, não modelagem)
- Rendimento de investimento
- Dimensão de negócio para o brownie (decisão 7 — adicionável depois)
