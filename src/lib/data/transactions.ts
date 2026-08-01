import type { Tables } from "@/lib/supabase/database.types";
import { monthRange } from "./finance.ts";
import { requireUser } from "./user.ts";

export type Transaction = Tables<"transactions">;

type GetTransactionsOptions = {
  /** Mês a filtrar; omitido = todas as transações do usuário. */
  month?: Date;
  /** Data inicial ISO (inclusive) — usada pelos gráficos de N meses. */
  since?: string;
  category?: string;
};

export async function getTransactions(
  options: GetTransactionsOptions = {},
): Promise<Transaction[]> {
  const { supabase, userId } = await requireUser();

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.month) {
    const { start, end } = monthRange(options.month);
    query = query.gte("occurred_on", start).lte("occurred_on", end);
  }

  if (options.since) {
    query = query.gte("occurred_on", options.since);
  }

  if (options.category) {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Falha ao carregar transações: ${error.message}`);
  return data ?? [];
}

/** Categorias distintas do próprio usuário — nada de lista fixa. */
export function categoriesOf(transactions: readonly Transaction[]): string[] {
  return Array.from(new Set(transactions.map((t) => t.category))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}
