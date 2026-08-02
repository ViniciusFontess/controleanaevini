/**
 * Lógica financeira pura — sem I/O, sem Supabase, sem React.
 * Coberta por finance.test.ts (`npm run test`).
 */

export type AccountLike = {
  kind: string;
  balance: number;
};

export type TransactionLike = {
  amount: number;
  occurred_on: string;
};

export type NetWorthTotals = {
  totalAssets: number;
  totalLiabilities: number;
  openInvoices: number;
  netWorth: number;
};

/**
 * Ativos menos passivos menos faturas em aberto. `balance` de passivo é
 * guardado positivo.
 *
 * Contas do tipo `credit_card` são ignoradas na soma: a dívida do cartão é a
 * fatura, calculada a partir das compras, não um saldo digitado que
 * dessincronizaria na primeira compra esquecida.
 */
export function netWorth(
  accounts: readonly AccountLike[],
  openInvoices = 0,
): NetWorthTotals {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    if (account.kind === "credit_card") continue;

    const value = Number(account.balance) || 0;
    if (account.kind === "liability") {
      totalLiabilities += value;
    } else {
      totalAssets += value;
    }
  }

  return {
    totalAssets,
    totalLiabilities,
    openInvoices,
    netWorth: totalAssets - totalLiabilities - openInvoices,
  };
}

export type MonthSummary = {
  entradas: number;
  saidas: number;
  saldo: number;
};

/** `amount` positivo = receita, negativo = despesa. `saidas` volta positivo. */
export function monthSummary(transactions: readonly TransactionLike[]): MonthSummary {
  let entradas = 0;
  let saidas = 0;

  for (const t of transactions) {
    const value = Number(t.amount) || 0;
    if (value >= 0) entradas += value;
    else saidas += -value;
  }

  return { entradas, saidas, saldo: entradas - saidas };
}

/**
 * Juros compostos mensais sobre o patrimônio atual, com aporte no fim de cada mês.
 * Devolve o saldo ao fim de cada um dos `months` meses (índice 0 = mês 1).
 */
export function projectCompound(
  currentNetWorth: number,
  monthlyContribution: number,
  months: number,
  monthlyRate = 0.003,
): number[] {
  const series: number[] = [];
  let balance = Number(currentNetWorth) || 0;

  for (let i = 0; i < Math.max(0, Math.trunc(months)); i++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    series.push(balance);
  }

  return series;
}

export type MonthlyFlow = {
  /** primeiro dia do mês, formato ISO `YYYY-MM-01` */
  month: string;
  entradas: number;
  saidas: number;
};

/**
 * Agrupa transações por mês e devolve os últimos `count` meses até `reference`
 * (inclusive), preenchendo com zero os meses sem movimento.
 */
export function monthlyFlow(
  transactions: readonly TransactionLike[],
  count: number,
  reference: Date,
): MonthlyFlow[] {
  const buckets = new Map<string, { entradas: number; saidas: number }>();

  const months: MonthlyFlow[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - i, 1));
    const key = monthKey(d);
    buckets.set(key, { entradas: 0, saidas: 0 });
    months.push({ month: key, entradas: 0, saidas: 0 });
  }

  for (const t of transactions) {
    const key = `${t.occurred_on.slice(0, 7)}-01`;
    const bucket = buckets.get(key);
    if (!bucket) continue;

    const value = Number(t.amount) || 0;
    if (value >= 0) bucket.entradas += value;
    else bucket.saidas += -value;
  }

  return months.map((m) => ({ ...m, ...buckets.get(m.month)! }));
}

/** `YYYY-MM-01` em UTC — a chave usada em `snapshots.month_date`. */
export function monthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/** Primeiro e último dia (ISO) do mês de `date`, para filtrar transações. */
export function monthRange(date: Date): { start: string; end: string } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { start: isoDate(start), end: isoDate(end) };
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Último dia válido do mês — para dias 29–31 em meses curtos. */
export function clampDay(year: number, monthIndex: number, day: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Math.min(day, lastDay);
}

/**
 * Data em que o dinheiro sai da conta por uma compra no cartão.
 *
 * Compra até o dia do fechamento entra na fatura daquele mês; a partir do dia
 * seguinte, na do mês seguinte. O vencimento cai no mês do fechamento, ou no
 * seguinte quando `dueDay` vem antes de `closingDay` no calendário (fecha 28,
 * vence 5).
 */
export function cashDateFor(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
): string {
  const purchase = new Date(`${purchaseDate}T00:00:00Z`);
  const afterClosing = purchase.getUTCDate() > closingDay;

  const closingMonthIndex = purchase.getUTCMonth() + (afterClosing ? 1 : 0);
  const dueMonthIndex = closingMonthIndex + (dueDay >= closingDay ? 0 : 1);

  const anchor = new Date(Date.UTC(purchase.getUTCFullYear(), dueMonthIndex, 1));
  const year = anchor.getUTCFullYear();
  const monthIndex = anchor.getUTCMonth();

  return isoDate(new Date(Date.UTC(year, monthIndex, clampDay(year, monthIndex, dueDay))));
}

export type RecurrenceLike = {
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
};

/**
 * Datas em que a recorrência é esperada dentro de [startISO, endISO].
 *
 * Só projeta — nunca cria transação. Uma ocorrência prevista vira fato quando o
 * usuário confirma, para que a projeção jamais afirme que entrou dinheiro que
 * não entrou.
 */
export function occurrencesBetween(
  recurrence: RecurrenceLike,
  startISO: string,
  endISO: string,
): string[] {
  if (!recurrence.active || startISO > endISO) return [];

  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);

  const dates: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const monthIndex = cursor.getUTCMonth();
    const iso = isoDate(
      new Date(Date.UTC(year, monthIndex, clampDay(year, monthIndex, recurrence.day_of_month))),
    );

    const withinWindow = iso >= startISO && iso <= endISO;
    const started = iso >= recurrence.start_date;
    const notEnded = !recurrence.end_date || iso <= recurrence.end_date;

    if (withinWindow && started && notEnded) dates.push(iso);

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return dates;
}

export type CashMovement = { date: string; amount: number };
export type CashDay = {
  date: string;
  entradas: number;
  saidas: number;
  balance: number;
};

/** Saldo dia a dia na janela, incluindo os dias sem nenhum movimento. */
export function runningBalance(
  openingBalance: number,
  movements: readonly CashMovement[],
  startISO: string,
  endISO: string,
): CashDay[] {
  if (startISO > endISO) return [];

  const byDate = new Map<string, { entradas: number; saidas: number }>();
  for (const movement of movements) {
    if (movement.date < startISO || movement.date > endISO) continue;

    const bucket = byDate.get(movement.date) ?? { entradas: 0, saidas: 0 };
    const value = Number(movement.amount) || 0;
    if (value >= 0) bucket.entradas += value;
    else bucket.saidas += -value;
    byDate.set(movement.date, bucket);
  }

  const days: CashDay[] = [];
  let balance = openingBalance;
  const cursor = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);

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
 * Fatura em aberto: compras cujo dinheiro ainda não saiu, devolvida positiva
 * porque é dívida. O próprio dia do vencimento ainda conta como em aberto.
 */
export function openInvoiceTotal(
  cardTransactions: readonly { amount: number; cash_date: string }[],
  todayISO: string,
): number {
  return cardTransactions
    .filter((t) => t.cash_date >= todayISO)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
}

export type Installment = {
  number: number;
  amount: number;
  /** competência da parcela — a compra deslocada N−1 meses */
  occurredOn: string;
  /** quando o dinheiro sai por esta parcela */
  cashDate: string;
};

/** Soma `months` meses a uma data ISO, encurtando o dia em meses curtos. */
function addMonths(isoValue: string, months: number): string {
  const base = new Date(`${isoValue}T00:00:00Z`);
  const anchor = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1));
  const year = anchor.getUTCFullYear();
  const monthIndex = anchor.getUTCMonth();

  return isoDate(
    new Date(Date.UTC(year, monthIndex, clampDay(year, monthIndex, base.getUTCDate()))),
  );
}

/**
 * Divide uma compra em `count` parcelas mensais.
 *
 * A sobra de centavos vai toda na primeira parcela, não espalhada: assim a soma
 * fecha exatamente com o total e o arredondamento aparece num lugar só — que é
 * também como as operadoras costumam fazer.
 */
export function installmentPlan(
  totalAmount: number,
  count: number,
  purchaseDate: string,
  firstCashDate: string,
): Installment[] {
  if (!Number.isInteger(count) || count < 2) {
    throw new Error("Parcelamento exige pelo menos 2 parcelas.");
  }

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count;

  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    amount: (baseCents + (i === 0 ? remainder : 0)) / 100,
    occurredOn: addMonths(purchaseDate, i),
    cashDate: addMonths(firstCashDate, i),
  }));
}
