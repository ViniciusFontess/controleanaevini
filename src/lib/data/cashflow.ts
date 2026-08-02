import { cashOnHand, getAccounts } from "./accounts.ts";
import { getRecurrences } from "./recurrences.ts";
import {
  isoDate,
  occurrencesBetween,
  runningBalance,
  type CashDay,
  type CashMovement,
} from "./finance.ts";
import { requireUser } from "./user.ts";

/** Uma ocorrência prevista que ainda não virou transação. */
export type PendingOccurrence = {
  recurrenceId: string;
  name: string;
  category: string;
  date: string;
  amount: number;
};

export type Cashflow = {
  days: CashDay[];
  pending: PendingOccurrence[];
  openingBalance: number;
  start: string;
  end: string;
};

/**
 * Janela de caixa dos próximos `days` dias.
 *
 * Junta o que já é fato (transações, pela `cash_date`) com o que é só previsão
 * (recorrências ainda não confirmadas). As duas coisas entram no saldo
 * projetado, mas só as primeiras existem como transação — a previsão nunca é
 * gravada sozinha.
 */
export async function getCashflow(days = 60): Promise<Cashflow> {
  const { supabase, userId } = await requireUser();

  const today = new Date();
  const start = isoDate(today);
  const end = isoDate(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days)),
  );

  const [accounts, recurrences, { data: transactions, error }] = await Promise.all([
    getAccounts(),
    getRecurrences(),
    supabase
      .from("transactions")
      .select("id, description, amount, cash_date, recurrence_id, occurred_on")
      .eq("user_id", userId)
      .gte("cash_date", start)
      .lte("cash_date", end),
  ]);

  if (error) throw new Error(`Falha ao carregar o fluxo de caixa: ${error.message}`);

  const movements: CashMovement[] = (transactions ?? []).map((t) => ({
    date: t.cash_date,
    amount: Number(t.amount) || 0,
  }));

  // Uma ocorrência está materializada quando já existe transação daquela
  // recorrência no mesmo mês — a mesma ideia da fatura: derivar, não guardar.
  const materialised = new Set(
    (transactions ?? [])
      .filter((t) => t.recurrence_id)
      .map((t) => `${t.recurrence_id}:${t.occurred_on.slice(0, 7)}`),
  );

  const pending: PendingOccurrence[] = [];
  for (const recurrence of recurrences) {
    for (const date of occurrencesBetween(recurrence, start, end)) {
      if (materialised.has(`${recurrence.id}:${date.slice(0, 7)}`)) continue;

      pending.push({
        recurrenceId: recurrence.id,
        name: recurrence.name,
        category: recurrence.category,
        date,
        amount: Number(recurrence.amount) || 0,
      });
      movements.push({ date, amount: Number(recurrence.amount) || 0 });
    }
  }

  const openingBalance = cashOnHand(accounts);

  return {
    days: runningBalance(openingBalance, movements, start, end),
    pending: pending.sort((a, b) => a.date.localeCompare(b.date)),
    openingBalance,
    start,
    end,
  };
}

/**
 * Fatura em aberto por cartão, para listar em Passivos.
 *
 * Duas queries simples em vez de um join embutido do PostgREST: o join não é
 * coberto por tipo nem por teste e só falharia em produção, e a diferença de
 * uma ida ao banco é irrelevante nesta escala.
 */
export async function getOpenInvoiceByCard(): Promise<Map<string, number>> {
  const { supabase, userId } = await requireUser();
  const today = isoDate(new Date());

  const { data: cards, error: cardsError } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", "credit_card");

  if (cardsError) throw new Error(`Falha ao carregar cartões: ${cardsError.message}`);

  const cardIds = (cards ?? []).map((c) => c.id);
  if (cardIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("transactions")
    .select("account_id, amount")
    .eq("user_id", userId)
    .in("account_id", cardIds)
    .gte("cash_date", today);

  if (error) throw new Error(`Falha ao calcular faturas por cartão: ${error.message}`);

  const byCard = new Map<string, number>();
  for (const t of data ?? []) {
    if (!t.account_id) continue;
    byCard.set(t.account_id, (byCard.get(t.account_id) ?? 0) + Math.abs(Number(t.amount) || 0));
  }
  return byCard;
}

/** Total das faturas em aberto, para o patrimônio líquido. */
export async function getOpenInvoiceTotal(): Promise<number> {
  const byCard = await getOpenInvoiceByCard();
  return [...byCard.values()].reduce((sum, value) => sum + value, 0);
}
