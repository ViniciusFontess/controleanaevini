"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data/user.ts";
import { addMonths, cashDateFor, installmentPlan, isoDate } from "@/lib/data/finance.ts";
import { readAmount, readText, type FormState } from "./form-state.ts";

export async function createTransaction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const description = readText(formData, "description");
  const category = readText(formData, "category");
  const direction = readText(formData, "direction");
  const accountId = readText(formData, "account_id");
  const amount = readAmount(formData, "amount");
  const occurredOn = readText(formData, "occurred_on") || isoDate(new Date());
  const installments = Number(readText(formData, "installments") || "1");

  if (!description) return { error: "Descreva a transação." };
  if (!category) return { error: "Informe uma categoria." };
  if (amount === null) return { error: "Informe um valor numérico válido." };
  if (amount <= 0) return { error: "O valor precisa ser maior que zero." };
  if (direction !== "income" && direction !== "expense") {
    return { error: "Selecione se é receita ou despesa." };
  }
  if (!Number.isInteger(installments) || installments < 1) {
    return { error: "Número de parcelas inválido." };
  }

  const { supabase, userId } = await requireUser();

  // Se caiu num cartão, o dinheiro só sai no vencimento da fatura do ciclo.
  let card: { id: string; closing_day: number; due_day: number } | null = null;
  if (accountId) {
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id, kind, closing_day, due_day")
      .eq("id", accountId)
      .eq("user_id", userId)
      .maybeSingle();

    if (accountError) return { error: `Não foi possível ler a conta: ${accountError.message}` };
    if (!account) return { error: "Conta não encontrada." };

    if (account.kind === "credit_card") {
      if (account.closing_day === null || account.due_day === null) {
        return { error: "Esse cartão está sem fechamento/vencimento configurado." };
      }
      card = { id: account.id, closing_day: account.closing_day, due_day: account.due_day };
    }
  }

  if (installments > 1 && !card) {
    return { error: "Parcelamento só vale para compras no cartão." };
  }

  // Convenção do schema: positivo = receita, negativo = despesa.
  const sign = direction === "income" ? 1 : -1;
  const firstCashDate = card
    ? cashDateFor(occurredOn, card.closing_day, card.due_day)
    : occurredOn;

  const rows =
    installments > 1
      ? buildInstallmentRows({
          userId,
          accountId: accountId || null,
          description,
          category,
          amount,
          sign,
          occurredOn,
          firstCashDate,
          installments,
        })
      : [
          {
            user_id: userId,
            account_id: accountId || null,
            description,
            category,
            amount: sign * amount,
            occurred_on: occurredOn,
            cash_date: firstCashDate,
          },
        ];

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/", "layout");
  return {
    ok: true,
    notice:
      installments > 1
        ? `Compra registrada em ${installments}x.`
        : "Transação registrada.",
  };
}

function buildInstallmentRows(input: {
  userId: string;
  accountId: string | null;
  description: string;
  category: string;
  amount: number;
  sign: number;
  occurredOn: string;
  firstCashDate: string;
  installments: number;
}) {
  const group = crypto.randomUUID();
  const plan = installmentPlan(
    input.amount,
    input.installments,
    input.occurredOn,
    input.firstCashDate,
  );

  return plan.map((parcel) => ({
    user_id: input.userId,
    account_id: input.accountId,
    description: `${input.description} (${parcel.number}/${input.installments})`,
    category: input.category,
    amount: input.sign * parcel.amount,
    occurred_on: parcel.occurredOn,
    cash_date: parcel.cashDate,
    installment_group: group,
    installment_number: parcel.number,
    installment_total: input.installments,
  }));
}

/**
 * Repete um lançamento no mês seguinte, para o que é recorrente mas muda de
 * valor (a fatura, a conta de luz) e você quer conferir antes de confirmar.
 *
 * Não copia vínculo de parcela nem de recorrência: a cópia é um lançamento novo
 * e independente, senão a parcela 3/12 viraria uma 3/12 fantasma em outro mês.
 */
export async function duplicateToNextMonth(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = readText(formData, "id");
  if (!id) return { error: "Lançamento não identificado." };

  const { supabase, userId } = await requireUser();

  const { data: original, error: readError } = await supabase
    .from("transactions")
    .select("description, category, amount, occurred_on, account_id, installment_group")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) return { error: `Não foi possível ler o lançamento: ${readError.message}` };
  if (!original) return { error: "Lançamento não encontrado." };
  if (original.installment_group) {
    return { error: "Parcela não se duplica — as parcelas seguintes já existem." };
  }

  const occurredOn = addMonths(original.occurred_on, 1);
  const cashDate = await resolveCashDate(supabase, userId, original.account_id, occurredOn);

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    account_id: original.account_id,
    description: original.description,
    category: original.category,
    amount: original.amount,
    occurred_on: occurredOn,
    cash_date: cashDate,
  });

  if (error) return { error: `Não foi possível duplicar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, notice: `Repetido em ${occurredOn.split("-").reverse().join("/")}.` };
}

/** Data de saída do dinheiro: pelo ciclo, se for cartão; senão, a própria data. */
async function resolveCashDate(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  accountId: string | null,
  occurredOn: string,
): Promise<string> {
  if (!accountId) return occurredOn;

  const { data: account } = await supabase
    .from("accounts")
    .select("kind, closing_day, due_day")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (
    account?.kind === "credit_card" &&
    account.closing_day !== null &&
    account.due_day !== null
  ) {
    return cashDateFor(occurredOn, account.closing_day, account.due_day);
  }

  return occurredOn;
}

/** Excluir uma parcela apaga a compra inteira — parcela solta não faz sentido. */
export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = readText(formData, "id");
  if (!id) return;

  const { supabase, userId } = await requireUser();

  const { data: transaction } = await supabase
    .from("transactions")
    .select("id, installment_group")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!transaction) return;

  if (transaction.installment_group) {
    await supabase
      .from("transactions")
      .delete()
      .eq("installment_group", transaction.installment_group)
      .eq("user_id", userId);
  } else {
    await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
  }

  revalidatePath("/", "layout");
}
