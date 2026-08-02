"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data/user.ts";
import { readAmount, readText, type FormState } from "./form-state.ts";

export async function createRecurrence(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = readText(formData, "name");
  const category = readText(formData, "category");
  const direction = readText(formData, "direction");
  const amount = readAmount(formData, "amount");
  const dayOfMonth = Number(readText(formData, "day_of_month"));

  if (!name) return { error: "Dê um nome à recorrência." };
  if (!category) return { error: "Informe uma categoria." };
  if (amount === null || amount <= 0) return { error: "Informe um valor maior que zero." };
  if (direction !== "income" && direction !== "expense") {
    return { error: "Selecione se é receita ou despesa." };
  }
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return { error: "Informe um dia do mês entre 1 e 31." };
  }

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("recurrences").insert({
    user_id: userId,
    name,
    category,
    amount: (direction === "income" ? 1 : -1) * amount,
    day_of_month: dayOfMonth,
  });

  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, notice: "Recorrência criada." };
}

export async function deleteRecurrence(formData: FormData): Promise<void> {
  const id = readText(formData, "id");
  if (!id) return;

  const { supabase, userId } = await requireUser();
  await supabase.from("recurrences").delete().eq("id", id).eq("user_id", userId);

  revalidatePath("/", "layout");
}

/**
 * Materializa uma ocorrência prevista: a previsão vira fato.
 *
 * Recusa se já existir transação daquela recorrência no mesmo mês — sem essa
 * guarda, dois cliques (ou dois dispositivos) gerariam receita em dobro.
 */
export async function confirmOccurrence(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const recurrenceId = readText(formData, "recurrence_id");
  const date = readText(formData, "date");
  if (!recurrenceId || !date) return { error: "Ocorrência não identificada." };

  const { supabase, userId } = await requireUser();

  const { data: recurrence, error: readError } = await supabase
    .from("recurrences")
    .select("*")
    .eq("id", recurrenceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) return { error: `Não foi possível ler a recorrência: ${readError.message}` };
  if (!recurrence) return { error: "Recorrência não encontrada." };

  const monthStart = `${date.slice(0, 7)}-01`;
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("recurrence_id", recurrenceId)
    .gte("occurred_on", monthStart)
    .lt("occurred_on", nextMonthStart(monthStart))
    .maybeSingle();

  if (existing) return { error: "Essa ocorrência já foi confirmada neste mês." };

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    description: recurrence.name,
    category: recurrence.category,
    amount: recurrence.amount,
    occurred_on: date,
    cash_date: date,
    recurrence_id: recurrenceId,
    account_id: recurrence.account_id,
  });

  if (error) return { error: `Não foi possível confirmar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, notice: "Confirmado." };
}

function nextMonthStart(monthStartISO: string): string {
  const date = new Date(`${monthStartISO}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10);
}
