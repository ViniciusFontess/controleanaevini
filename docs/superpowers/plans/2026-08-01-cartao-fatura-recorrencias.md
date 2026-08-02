# Cartão, fatura, parcelamento e recorrências — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Representar o mês real do usuário — compra no cartão hoje, dinheiro
saindo no vencimento — com parcelamento e recorrências, e uma tela que responde
"o dinheiro sobrevive até o dia 25?".

**Architecture:** A transação ganha uma segunda data (`cash_date`). Fluxo agrupa
por `occurred_on` (competência), a tela nova de Caixa agrupa por `cash_date`. O
cartão é uma conta que guarda seu ciclo; a fatura não é registro, é consulta.
Parcelas são N transações criadas na compra, com `installment_group` comum.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase
(Postgres 17 + RLS), `node --test` para lógica pura.

## Global Constraints

- Toda lógica de data usa **UTC**. O código existente já faz isso
  (`monthKey`, `monthRange`); misturar fuso local reintroduz erro de um dia.
- Datas trafegam como **string ISO `YYYY-MM-DD`**, não `Date`. É o formato que o
  Postgres devolve e o que o resto do `finance.ts` já usa.
- `target` do tsconfig é **ES2017**: nada de flag `/s` em regex, `??=`, nem
  `Object.hasOwn`. O `tsc` reprova no build, mesmo que o `node --test` passe.
- Toda função pura nova vive em `src/lib/data/finance.ts` e é testada em
  `finance.test.ts` com `node --test`. Sem framework de teste novo.
- Toda tabela nova tem RLS habilitado com as quatro policies por
  `(select auth.uid()) = user_id`, `TO authenticated`.
- Valores monetários são `numeric(14,2)`. Em JS, arredondar para centavos ao
  dividir parcela — nunca deixar float cru chegar no banco.
- `npm run lint`, `npm test` e `npm run build` passam ao fim de cada task.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20260801130000_cartao_fatura_recorrencias.sql` | Schema: cartão, `cash_date`, parcelas, `recurrences` |
| `src/lib/data/finance.ts` | Matemática pura: ciclo, parcelas, ocorrências, saldo correndo |
| `src/lib/data/finance.test.ts` | Testes das acima |
| `src/lib/data/accounts.ts` | Passa a conhecer `credit_card` e fatura em aberto |
| `src/lib/data/recurrences.ts` | Leitura de recorrências (novo) |
| `src/lib/data/cashflow.ts` | Monta a série da tela de Caixa (novo) |
| `src/lib/actions/transactions.ts` | Criação com cartão e parcelas |
| `src/lib/actions/recurrences.ts` | CRUD de recorrência, confirmar ocorrência (novo) |
| `src/app/(app)/caixa/page.tsx` | Tela nova |
| `src/components/caixa/*` | Componentes da tela de Caixa |

---

### Task 1: Migração de schema

**Files:**
- Create: `supabase/migrations/20260801130000_cartao_fatura_recorrencias.sql`
- Modify: `src/lib/supabase/database.types.ts` (regenerado)

**Interfaces:**
- Produces: colunas `accounts.closing_day`, `accounts.due_day`;
  `transactions.account_id`, `transactions.cash_date`,
  `transactions.recurrence_id`, `transactions.installment_group`,
  `transactions.installment_number`, `transactions.installment_total`;
  tabela `recurrences`.

- [ ] **Step 1: Escrever a migration**

```sql
-- accounts: cartão de crédito com ciclo próprio
alter table public.accounts drop constraint if exists accounts_kind_check;
alter table public.accounts add constraint accounts_kind_check
  check (kind in ('asset','liability','credit_card'));

alter table public.accounts add column if not exists closing_day smallint;
alter table public.accounts add column if not exists due_day smallint;

alter table public.accounts drop constraint if exists accounts_cycle_check;
alter table public.accounts add constraint accounts_cycle_check check (
  (kind <> 'credit_card' and closing_day is null and due_day is null)
  or
  (kind = 'credit_card'
     and closing_day between 1 and 31
     and due_day between 1 and 31)
);

-- recurrences: a regra, nunca o fato
create table if not exists public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric(14,2) not null,          -- positivo = receita, negativo = despesa
  day_of_month smallint not null check (day_of_month between 1 and 31),
  account_id uuid references public.accounts(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- transactions: segunda data, origem e parcelamento
alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null,
  add column if not exists cash_date date,
  add column if not exists recurrence_id uuid references public.recurrences(id) on delete set null,
  add column if not exists installment_group uuid,
  add column if not exists installment_number smallint,
  add column if not exists installment_total smallint;

-- o que já existe era tudo à vista
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

create index if not exists transactions_user_cash_date_idx
  on public.transactions(user_id, cash_date);
create index if not exists transactions_installment_group_idx
  on public.transactions(installment_group) where installment_group is not null;
create index if not exists recurrences_user_id_idx on public.recurrences(user_id);

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
```

- [ ] **Step 2: Aplicar e conferir que os dados existentes sobreviveram**

Aplicar via MCP `apply_migration` no projeto `iotjvhvcanebowhdvxva`, depois:

```sql
select count(*) as total, count(cash_date) as com_cash_date,
       count(*) filter (where cash_date = occurred_on) as iguais
from public.transactions;
```

Esperado: os três números iguais (12 hoje). Se `com_cash_date` for menor que
`total`, o `set not null` teria falhado — investigar antes de seguir.

- [ ] **Step 3: Regenerar os tipos**

MCP `generate_typescript_types`, salvando em
`src/lib/supabase/database.types.ts`. Conferir que `recurrences` aparece e que
`transactions.Row` tem `cash_date: string`.

- [ ] **Step 4: Verificar que o app ainda compila**

Run: `npm run build`
Expected: compila. As telas atuais não usam os campos novos, então nada quebra.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations src/lib/supabase/database.types.ts
git commit -m "Add credit-card cycle, cash_date, instalments and recurrences"
```

---

### Task 2: Matemática do ciclo da fatura

**Files:**
- Modify: `src/lib/data/finance.ts`
- Test: `src/lib/data/finance.test.ts`

**Interfaces:**
- Consumes: `isoDate`, `monthKey` (já existem).
- Produces:
  - `clampDay(year: number, monthIndex: number, day: number): number`
  - `cashDateFor(purchaseDate: string, closingDay: number, dueDay: number): string`

- [ ] **Step 1: Escrever os testes que falham**

```ts
test("clampDay encurta o dia para o último do mês", () => {
  assert.equal(clampDay(2026, 1, 31), 28); // fevereiro/2026
  assert.equal(clampDay(2024, 1, 31), 29); // bissexto
  assert.equal(clampDay(2026, 3, 31), 30); // abril
  assert.equal(clampDay(2026, 0, 15), 15);
});

test("cashDateFor: compra até o fechamento vence no mesmo mês", () => {
  // fecha 18, vence 25
  assert.equal(cashDateFor("2026-10-05", 18, 25), "2026-10-25");
  assert.equal(cashDateFor("2026-10-18", 18, 25), "2026-10-25");
});

test("cashDateFor: compra após o fechamento pula para a fatura seguinte", () => {
  assert.equal(cashDateFor("2026-10-19", 18, 25), "2026-11-25");
  assert.equal(cashDateFor("2026-10-31", 18, 25), "2026-11-25");
});

test("cashDateFor vira o ano", () => {
  assert.equal(cashDateFor("2026-12-20", 18, 25), "2027-01-25");
});

test("cashDateFor com vencimento antes do fechamento cai no mês seguinte", () => {
  // fecha 28, vence 5
  assert.equal(cashDateFor("2026-10-10", 28, 5), "2026-11-05");
  assert.equal(cashDateFor("2026-10-29", 28, 5), "2026-12-05");
});

test("cashDateFor encurta vencimento em mês curto", () => {
  assert.equal(cashDateFor("2026-01-20", 18, 31), "2026-02-28");
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: FAIL — `clampDay is not defined`.

- [ ] **Step 3: Implementar**

```ts
/** Último dia válido do mês, para dias 29–31 em meses curtos. */
export function clampDay(year: number, monthIndex: number, day: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Math.min(day, lastDay);
}

/**
 * Data em que o dinheiro sai da conta por uma compra no cartão.
 *
 * Compra até o dia do fechamento entra na fatura daquele mês; a partir do dia
 * seguinte, na do mês seguinte. O vencimento cai no mês do fechamento, ou no
 * seguinte quando `dueDay` é anterior a `closingDay` no calendário.
 */
export function cashDateFor(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
): string {
  const purchase = new Date(`${purchaseDate}T00:00:00Z`);
  const afterClosing = purchase.getUTCDate() > closingDay;

  const closingMonth = purchase.getUTCMonth() + (afterClosing ? 1 : 0);
  const dueMonthIndex = closingMonth + (dueDay >= closingDay ? 0 : 1);

  const anchor = new Date(Date.UTC(purchase.getUTCFullYear(), dueMonthIndex, 1));
  const year = anchor.getUTCFullYear();
  const monthIndex = anchor.getUTCMonth();

  return isoDate(new Date(Date.UTC(year, monthIndex, clampDay(year, monthIndex, dueDay))));
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/finance.ts src/lib/data/finance.test.ts
git commit -m "Compute when a card purchase actually leaves the account"
```

---

### Task 3: Geração de parcelas

**Files:**
- Modify: `src/lib/data/finance.ts`
- Test: `src/lib/data/finance.test.ts`

**Interfaces:**
- Consumes: `cashDateFor`, `clampDay`, `isoDate` (Task 2).
- Produces:
  - `type Installment = { number: number; amount: number; occurredOn: string; cashDate: string }`
  - `installmentPlan(totalAmount: number, count: number, purchaseDate: string, firstCashDate: string): Installment[]`

`occurredOn` é a competência da parcela — a data da compra deslocada N−1 meses.
Sem ela, as 12 parcelas cairiam todas no mês da compra e o Fluxo mostraria
R$ 1.200 em outubro, exatamente o que a decisão 5 da spec descarta.

- [ ] **Step 1: Escrever os testes que falham**

```ts
test("installmentPlan divide igual quando não há sobra", () => {
  const plan = installmentPlan(1200, 12, "2026-10-19", "2026-11-25");
  assert.equal(plan.length, 12);
  assert.ok(plan.every((p) => p.amount === 100));
  assert.equal(plan[0].cashDate, "2026-11-25");
  assert.equal(plan[11].cashDate, "2027-10-25");
});

test("installmentPlan espalha a competência um mês por parcela", () => {
  const plan = installmentPlan(1200, 3, "2026-10-19", "2026-11-25");
  assert.deepEqual(plan.map((p) => p.occurredOn), [
    "2026-10-19",
    "2026-11-19",
    "2026-12-19",
  ]);
});

test("installmentPlan põe a sobra de centavos na primeira parcela", () => {
  const plan = installmentPlan(1000, 3, "2026-10-05", "2026-10-25");
  assert.deepEqual(plan.map((p) => p.amount), [333.34, 333.33, 333.33]);
  // o total tem que fechar exatamente
  assert.equal(plan.reduce((s, p) => s + p.amount, 0), 1000);
});

test("installmentPlan encurta o dia em mês curto, nas duas datas", () => {
  const plan = installmentPlan(300, 3, "2026-12-31", "2026-12-31");
  assert.deepEqual(plan.map((p) => p.cashDate), [
    "2026-12-31",
    "2027-01-31",
    "2027-02-28",
  ]);
  assert.deepEqual(plan.map((p) => p.occurredOn), [
    "2026-12-31",
    "2027-01-31",
    "2027-02-28",
  ]);
});

test("installmentPlan recusa contagem inválida", () => {
  assert.throws(() => installmentPlan(100, 1, "2026-10-05", "2026-10-25"));
  assert.throws(() => installmentPlan(100, 0, "2026-10-05", "2026-10-25"));
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: FAIL — `installmentPlan is not defined`.

- [ ] **Step 3: Implementar**

```ts
export type Installment = { number: number; amount: number; cashDate: string };

/**
 * Divide uma compra em `count` parcelas mensais a partir de `firstCashDate`.
 *
 * A sobra de centavos vai na primeira parcela — concentrada, não espalhada, para
 * que a soma feche exatamente com o total e o usuário veja o arredondamento num
 * lugar só (é também como a maioria das operadoras faz).
 */
export function installmentPlan(
  totalAmount: number,
  count: number,
  firstCashDate: string,
): Installment[] {
  if (!Number.isInteger(count) || count < 2) {
    throw new Error("Parcelamento exige pelo menos 2 parcelas.");
  }

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count;

  const first = new Date(`${firstCashDate}T00:00:00Z`);
  const day = first.getUTCDate();

  return Array.from({ length: count }, (_, i) => {
    const monthIndex = first.getUTCMonth() + i;
    const anchor = new Date(Date.UTC(first.getUTCFullYear(), monthIndex, 1));
    const year = anchor.getUTCFullYear();
    const month = anchor.getUTCMonth();

    return {
      number: i + 1,
      amount: (baseCents + (i === 0 ? remainder : 0)) / 100,
      cashDate: isoDate(new Date(Date.UTC(year, month, clampDay(year, month, day)))),
    };
  });
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/finance.ts src/lib/data/finance.test.ts
git commit -m "Split an instalment purchase into dated parcels"
```

---

### Task 4: Ocorrências previstas de uma recorrência

**Files:**
- Modify: `src/lib/data/finance.ts`
- Test: `src/lib/data/finance.test.ts`

**Interfaces:**
- Consumes: `clampDay`, `isoDate`.
- Produces:
  - `type RecurrenceLike = { day_of_month: number; start_date: string; end_date: string | null; active: boolean }`
  - `occurrencesBetween(recurrence: RecurrenceLike, startISO: string, endISO: string): string[]`

- [ ] **Step 1: Escrever os testes que falham**

```ts
const salario: RecurrenceLike = {
  day_of_month: 5,
  start_date: "2026-01-01",
  end_date: null,
  active: true,
};

test("occurrencesBetween devolve um dia por mês dentro da janela", () => {
  assert.deepEqual(occurrencesBetween(salario, "2026-10-01", "2026-12-31"), [
    "2026-10-05",
    "2026-11-05",
    "2026-12-05",
  ]);
});

test("occurrencesBetween respeita os limites da janela", () => {
  assert.deepEqual(occurrencesBetween(salario, "2026-10-06", "2026-11-04"), []);
});

test("occurrencesBetween encurta o dia em mês curto", () => {
  const rec = { ...salario, day_of_month: 31 };
  assert.deepEqual(occurrencesBetween(rec, "2026-02-01", "2026-02-28"), ["2026-02-28"]);
});

test("occurrencesBetween ignora recorrência inativa ou fora do período", () => {
  assert.deepEqual(occurrencesBetween({ ...salario, active: false }, "2026-10-01", "2026-12-31"), []);
  assert.deepEqual(
    occurrencesBetween({ ...salario, end_date: "2026-10-31" }, "2026-10-01", "2026-12-31"),
    ["2026-10-05"],
  );
  assert.deepEqual(
    occurrencesBetween({ ...salario, start_date: "2026-11-15" }, "2026-10-01", "2026-12-31"),
    ["2026-12-05"],
  );
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: FAIL — `occurrencesBetween is not defined`.

- [ ] **Step 3: Implementar**

```ts
export type RecurrenceLike = {
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
};

/** Datas em que a recorrência é esperada dentro de [startISO, endISO]. */
export function occurrencesBetween(
  recurrence: RecurrenceLike,
  startISO: string,
  endISO: string,
): string[] {
  if (!recurrence.active) return [];

  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  if (start > end) return [];

  const dates: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const iso = isoDate(
      new Date(Date.UTC(year, month, clampDay(year, month, recurrence.day_of_month))),
    );

    const withinWindow = iso >= startISO && iso <= endISO;
    const started = iso >= recurrence.start_date;
    const notEnded = !recurrence.end_date || iso <= recurrence.end_date;

    if (withinWindow && started && notEnded) dates.push(iso);

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return dates;
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/finance.ts src/lib/data/finance.test.ts
git commit -m "Project the dates a recurrence is expected to land on"
```

---

### Task 5: Saldo correndo e fatura em aberto

**Files:**
- Modify: `src/lib/data/finance.ts`
- Test: `src/lib/data/finance.test.ts`

**Interfaces:**
- Produces:
  - `type CashMovement = { date: string; amount: number }`
  - `type CashDay = { date: string; entradas: number; saidas: number; balance: number }`
  - `runningBalance(openingBalance: number, movements: readonly CashMovement[], startISO: string, endISO: string): CashDay[]`
  - `openInvoiceTotal(cardTransactions: readonly { amount: number; cash_date: string }[], todayISO: string): number`

- [ ] **Step 1: Escrever os testes que falham**

```ts
test("runningBalance acumula dia a dia e mantém dias vazios", () => {
  const days = runningBalance(
    1000,
    [
      { date: "2026-10-02", amount: 500 },
      { date: "2026-10-02", amount: -200 },
      { date: "2026-10-04", amount: -100 },
    ],
    "2026-10-01",
    "2026-10-04",
  );

  assert.deepEqual(days.map((d) => [d.date, d.balance]), [
    ["2026-10-01", 1000],
    ["2026-10-02", 1300],
    ["2026-10-03", 1300],
    ["2026-10-04", 1200],
  ]);
  assert.equal(days[1].entradas, 500);
  assert.equal(days[1].saidas, 200);
});

test("runningBalance com janela vazia não quebra", () => {
  assert.deepEqual(runningBalance(0, [], "2026-10-02", "2026-10-01"), []);
});

test("runningBalance ignora movimento fora da janela", () => {
  const days = runningBalance(0, [{ date: "2026-09-30", amount: 999 }], "2026-10-01", "2026-10-01");
  assert.equal(days[0].balance, 0);
});

test("openInvoiceTotal soma só o que ainda não venceu", () => {
  const compras = [
    { amount: -100, cash_date: "2026-10-25" }, // futura
    { amount: -50, cash_date: "2026-11-25" },  // futura
    { amount: -900, cash_date: "2026-09-25" }, // já paga
  ];
  assert.equal(openInvoiceTotal(compras, "2026-10-01"), 150);
});

test("openInvoiceTotal considera o próprio dia do vencimento como em aberto", () => {
  assert.equal(openInvoiceTotal([{ amount: -100, cash_date: "2026-10-25" }], "2026-10-25"), 100);
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: FAIL — `runningBalance is not defined`.

- [ ] **Step 3: Implementar**

```ts
export type CashMovement = { date: string; amount: number };
export type CashDay = { date: string; entradas: number; saidas: number; balance: number };

/** Saldo dia a dia na janela, incluindo dias sem movimento. */
export function runningBalance(
  openingBalance: number,
  movements: readonly CashMovement[],
  startISO: string,
  endISO: string,
): CashDay[] {
  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  if (start > end) return [];

  const byDate = new Map<string, { entradas: number; saidas: number }>();
  for (const movement of movements) {
    if (movement.date < startISO || movement.date > endISO) continue;
    const bucket = byDate.get(movement.date) ?? { entradas: 0, saidas: 0 };
    if (movement.amount >= 0) bucket.entradas += movement.amount;
    else bucket.saidas += -movement.amount;
    byDate.set(movement.date, bucket);
  }

  const days: CashDay[] = [];
  let balance = openingBalance;
  const cursor = new Date(start);

  while (cursor <= end) {
    const date = isoDate(cursor);
    const { entradas, saidas } = byDate.get(date) ?? { entradas: 0, saidas: 0 };
    balance += entradas - saidas;
    days.push({ date, entradas, saidas, balance });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

/**
 * Fatura em aberto: compras cujo dinheiro ainda não saiu, devolvido positivo
 * (é dívida). O próprio dia do vencimento conta como em aberto.
 */
export function openInvoiceTotal(
  cardTransactions: readonly { amount: number; cash_date: string }[],
  todayISO: string,
): number {
  return cardTransactions
    .filter((t) => t.cash_date >= todayISO)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/finance.ts src/lib/data/finance.test.ts
git commit -m "Compute the running cash balance and the open invoice total"
```

---

### Task 6: Patrimônio líquido descontando a fatura

**Files:**
- Modify: `src/lib/data/finance.ts`, `src/lib/data/accounts.ts`
- Modify: `src/app/(app)/page.tsx`, `src/app/(app)/patrimonio/page.tsx`
- Test: `src/lib/data/finance.test.ts`

**Interfaces:**
- Consumes: `openInvoiceTotal` (Task 5), `netWorth` (existente).
- Produces: `netWorth` passa a aceitar `openInvoices` e devolver o campo novo
  `openInvoices` em `NetWorthTotals`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
test("netWorth desconta a fatura em aberto", () => {
  const totals = netWorth(
    [
      { kind: "asset", balance: 10000 },
      { kind: "liability", balance: 2000 },
      { kind: "credit_card", balance: 0 }, // saldo de cartão é derivado, não somado
    ],
    1500,
  );

  assert.equal(totals.totalAssets, 10000);
  assert.equal(totals.totalLiabilities, 2000);
  assert.equal(totals.openInvoices, 1500);
  assert.equal(totals.netWorth, 6500);
});

test("netWorth sem fatura se comporta como antes", () => {
  const totals = netWorth([{ kind: "asset", balance: 100 }]);
  assert.equal(totals.netWorth, 100);
  assert.equal(totals.openInvoices, 0);
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node --test src/lib/data/finance.test.ts`
Expected: FAIL — `openInvoices` é `undefined` e o total ignora a fatura.

- [ ] **Step 3: Implementar**

Em `finance.ts`, `netWorth` ganha segundo parâmetro opcional e passa a ignorar
contas `credit_card` na soma (o saldo delas é derivado):

```ts
export type NetWorthTotals = {
  totalAssets: number;
  totalLiabilities: number;
  openInvoices: number;
  netWorth: number;
};

export function netWorth(
  accounts: readonly AccountLike[],
  openInvoices = 0,
): NetWorthTotals {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    const value = Number(account.balance) || 0;
    // Cartão não entra: sua dívida é a fatura, calculada a partir das compras.
    if (account.kind === "credit_card") continue;
    if (account.kind === "liability") totalLiabilities += value;
    else totalAssets += value;
  }

  return {
    totalAssets,
    totalLiabilities,
    openInvoices,
    netWorth: totalAssets - totalLiabilities - openInvoices,
  };
}
```

- [ ] **Step 4: Rodar para ver passar, e ligar nas telas**

Run: `node --test src/lib/data/finance.test.ts` → PASS.

Em `page.tsx` e `patrimonio/page.tsx`, passar o total de fatura em aberto para
`netWorth` e exibir cartões na seção de Passivos com o valor da fatura.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data src/app/\(app\)
git commit -m "Count the open invoice as debt in net worth"
```

---

### Task 7: Camada de dados de cartão e recorrência

**Files:**
- Modify: `src/lib/data/accounts.ts`
- Create: `src/lib/data/recurrences.ts`, `src/lib/data/cashflow.ts`

**Interfaces:**
- Consumes: `occurrencesBetween`, `runningBalance`, `openInvoiceTotal`.
- Produces:
  - `getCards(): Promise<Account[]>` — contas `kind = 'credit_card'`
  - `getOpenInvoices(): Promise<number>`
  - `getRecurrences(): Promise<Recurrence[]>`
  - `getCashflow(days: number): Promise<{ days: CashDay[]; pending: PendingOccurrence[] }>`
  - `type PendingOccurrence = { recurrenceId: string; name: string; date: string; amount: number }`

- [ ] **Step 1: Escrever `recurrences.ts`**

Segue o padrão de `accounts.ts`: `requireUser()`, filtro por `user_id`, erro
descritivo em português. Ordena por `day_of_month`.

- [ ] **Step 2: Escrever `cashflow.ts`**

Monta a janela: saldo de abertura = soma das contas `asset`; movimentos =
transações com `cash_date` na janela + ocorrências previstas ainda não
materializadas. Uma ocorrência está materializada quando existe transação com
aquele `recurrence_id` e `occurred_on` no mesmo mês.

- [ ] **Step 3: Rodar lint e build**

Run: `npm run lint && npm run build`
Expected: ambos passam.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data
git commit -m "Read cards, recurrences and the cash-flow window"
```

---

### Task 8: Lançamento com cartão e parcelas

**Files:**
- Modify: `src/lib/actions/transactions.ts`
- Modify: `src/components/fluxo/transaction-form.tsx`

**Interfaces:**
- Consumes: `cashDateFor`, `installmentPlan`, `getCards`.
- Produces: `createTransaction` passa a aceitar `account_id` e `installments`.

- [ ] **Step 1: Estender `createTransaction`**

Lê `account_id` e `installments` do FormData. Se a conta for cartão, calcula
`cashDateFor`; se `installments >= 2`, gera `installmentPlan` e insere N linhas
com o mesmo `installment_group` (`crypto.randomUUID()`). Fora do cartão,
`cash_date = occurred_on` e `installments` é ignorado.

- [ ] **Step 2: Estender `deleteTransaction` para agir no grupo**

Se a transação tem `installment_group`, apaga o grupo inteiro.

- [ ] **Step 3: Atualizar o formulário**

Campo "Onde" (conta ou cartão, cartão como padrão quando existir) e campo de
parcelas visível só quando a conta escolhida é cartão.

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm test && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions src/components/fluxo
git commit -m "Log purchases against a card, splitting instalments"
```

---

### Task 9: Tela de Caixa

**Files:**
- Create: `src/app/(app)/caixa/page.tsx`, `src/components/caixa/cash-day-row.tsx`,
  `src/components/caixa/confirm-occurrence.tsx`
- Create: `src/lib/actions/recurrences.ts`
- Modify: `src/components/app/nav-items.tsx`

**Interfaces:**
- Consumes: `getCashflow` (Task 7).
- Produces: action `confirmOccurrence(formData)` — cria a transação a partir da
  ocorrência prevista, com `recurrence_id` preenchido. Recusa em silêncio se já
  existir transação daquela recorrência no mês (evita duplicar).

- [ ] **Step 1: Criar a action com a guarda de duplicidade**

- [ ] **Step 2: Criar a tela, com estado vazio**

Usuário sem contas nem recorrências vê convite a cadastrar, não tela quebrada.
Destacar visualmente o dia do vencimento da fatura e qualquer dia com saldo
negativo.

- [ ] **Step 3: Adicionar "Caixa" à navegação**

Entre "Fluxo" e "Projeção", nos dois navs (sidebar e bottom bar).

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm test && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app src/components src/lib/actions
git commit -m "Add the cash view answering whether the money lasts to the due date"
```

---

### Task 10: Lançamento rápido de venda

**Files:**
- Create: `src/components/fluxo/quick-entry.tsx`
- Modify: `src/app/(app)/fluxo/page.tsx`

- [ ] **Step 1: Criar o componente**

Um campo de valor, categoria pré-preenchida com a última usada em receita, data
de hoje, botão salvar. Após salvar, limpa o valor e mantém o foco — o usuário
lança várias vendas seguidas.

- [ ] **Step 2: Verificar**

Run: `npm run lint && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/fluxo src/app/\(app\)/fluxo
git commit -m "Add one-field quick entry for daily sales"
```

---

### Task 11: Remover a rota de diagnóstico

**Files:**
- Delete: `src/app/diagnostico/`
- Modify: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Apagar a pasta e a entrada em `ALWAYS_ALLOWED_PATHS`**

- [ ] **Step 2: Verificar que `/diagnostico` passa a dar 404 e o resto segue**

Run: `npm run build && npx next start` e conferir `/` e `/login`.

- [ ] **Step 3: Commit**

```bash
git rm -r src/app/diagnostico
git add src/lib/supabase/middleware.ts
git commit -m "Remove the temporary diagnostic route"
```

---

## Ordem e verificação

Tasks 1–6 são a fundação e não mudam nada visível: dá para rodar todas antes de
o usuário ver diferença. Task 6 é a primeira que muda um número na tela (o
patrimônio cai) — vale avisar antes de subir.

Ao fim de cada task: `npm run lint`, `npm test`, `npm run build`.

Ao fim do plano, o teste de aceitação é o mês real do usuário: cadastrar o cartão
(fecha 18, vence 25), lançar uma compra dia 19, e confirmar que ela aparece no
Fluxo de outubro e na tela de Caixa saindo em 25 de novembro.
