"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data/user.ts";
import { monthKey, netWorth } from "@/lib/data/finance.ts";
import type { FormState } from "./form-state.ts";

/**
 * "Fechar mês": soma as contas atuais e grava o snapshot do mês corrente.
 *
 * `snapshots` tem unique(user_id, month_date) e **não** tem policy de UPDATE
 * (é um registro fechado), então refazer o mês é delete + insert, não upsert.
 */
export async function createSnapshotForCurrentMonth(
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await requireUser();

  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("kind, balance")
    .eq("user_id", userId);

  if (accountsError) {
    return { error: `Não foi possível ler suas contas: ${accountsError.message}` };
  }
  if (!accounts || accounts.length === 0) {
    return { error: "Cadastre ao menos uma conta antes de fechar o mês." };
  }

  const totals = netWorth(accounts);
  const month = monthKey(new Date());

  const { error: deleteError } = await supabase
    .from("snapshots")
    .delete()
    .eq("user_id", userId)
    .eq("month_date", month);

  if (deleteError) {
    return { error: `Não foi possível refazer o mês: ${deleteError.message}` };
  }

  const { error: insertError } = await supabase.from("snapshots").insert({
    user_id: userId,
    month_date: month,
    total_assets: totals.totalAssets,
    total_liabilities: totals.totalLiabilities,
    net_worth: totals.netWorth,
  });

  if (insertError) {
    return { error: `Não foi possível fechar o mês: ${insertError.message}` };
  }

  revalidatePath("/", "layout");
  return { ok: true, notice: "Mês fechado — snapshot gravado." };
}
