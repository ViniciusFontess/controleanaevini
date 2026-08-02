"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data/user.ts";
import { isoDate } from "@/lib/data/finance.ts";
import { readAmount, readText, type FormState } from "./form-state.ts";

export async function createTransaction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const description = readText(formData, "description");
  const category = readText(formData, "category");
  const direction = readText(formData, "direction");
  const amount = readAmount(formData, "amount");
  const occurredOn = readText(formData, "occurred_on") || isoDate(new Date());

  if (!description) return { error: "Descreva a transação." };
  if (!category) return { error: "Informe uma categoria." };
  if (amount === null) return { error: "Informe um valor numérico válido." };
  if (amount <= 0) return { error: "O valor precisa ser maior que zero." };
  if (direction !== "income" && direction !== "expense") {
    return { error: "Selecione se é receita ou despesa." };
  }

  // Convenção do schema: positivo = receita, negativo = despesa.
  const signedAmount = direction === "income" ? amount : -amount;

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    description,
    category,
    amount: signedAmount,
    occurred_on: occurredOn,
    // Sem cartão escolhido, o dinheiro se move no dia do lançamento.
    // A Task 8 do plano passa a calcular isto pelo ciclo do cartão.
    cash_date: occurredOn,
  });

  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, notice: "Transação registrada." };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = readText(formData, "id");
  if (!id) return;

  const { supabase, userId } = await requireUser();
  await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);

  revalidatePath("/", "layout");
}
