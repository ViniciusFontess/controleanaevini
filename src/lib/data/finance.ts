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
  netWorth: number;
};

/** Ativos menos passivos. `balance` de passivo é guardado positivo. */
export function netWorth(accounts: readonly AccountLike[]): NetWorthTotals {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    const value = Number(account.balance) || 0;
    if (account.kind === "liability") {
      totalLiabilities += value;
    } else {
      totalAssets += value;
    }
  }

  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
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
