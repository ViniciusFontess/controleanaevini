"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data/user.ts";
import { readAmount, readText, type FormState } from "./form-state.ts";

function parseAccountForm(formData: FormData):
  | { ok: true; values: { name: string; kind: string; category: string; balance: number; color: string | null } }
  | { ok: false; error: string } {
  const name = readText(formData, "name");
  const kind = readText(formData, "kind");
  const category = readText(formData, "category");
  const balance = readAmount(formData, "balance");
  const color = readText(formData, "color");

  if (!name) return { ok: false, error: "Informe o nome da conta." };
  if (kind !== "asset" && kind !== "liability") {
    return { ok: false, error: "Selecione se é ativo ou passivo." };
  }
  if (!category) return { ok: false, error: "Informe uma categoria." };
  if (balance === null) return { ok: false, error: "Informe um valor numérico válido." };
  if (balance < 0) return { ok: false, error: "Use valores positivos — passivos já contam como dívida." };

  return { ok: true, values: { name, kind, category, balance, color: color || null } };
}

export async function createAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseAccountForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("accounts").insert({ ...parsed.values, user_id: userId });

  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, notice: "Conta adicionada." };
}

export async function updateAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = readText(formData, "id");
  if (!id) return { error: "Conta não identificada." };

  const parsed = parseAccountForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("accounts")
    .update(parsed.values)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { error: `Não foi possível atualizar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, notice: "Conta atualizada." };
}

export async function deleteAccount(formData: FormData): Promise<void> {
  const id = readText(formData, "id");
  if (!id) return;

  const { supabase, userId } = await requireUser();
  await supabase.from("accounts").delete().eq("id", id).eq("user_id", userId);

  revalidatePath("/", "layout");
}
