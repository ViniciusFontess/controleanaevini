"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { updateTransaction } from "@/lib/actions/transactions";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";
import type { PayableAccount } from "./transaction-form";
import { TransactionActions } from "./transaction-actions";
import { Field, FormMessages, SubmitButton, inputClass } from "@/components/ui/form-fields";

export type EditableTransactionData = {
  id: string;
  description: string;
  category: string;
  amount: number;
  occurredOn: string;
  accountId: string | null;
  installmentLabel: string | null;
  isFixed: boolean;
  isInstallment: boolean;
};

/**
 * Envolve a linha de um lançamento e troca para o formulário quando editando.
 *
 * Recebe o visual por `children` porque Fluxo e Caixa mostram a mesma transação
 * com layouts diferentes — só o modo de edição é comum aos dois.
 *
 * As ações são montadas aqui dentro, e não recebidas por prop: quem chama é
 * Server Component, e função não atravessa a fronteira server→client (não é
 * serializável no payload RSC). Já quebrou as duas telas em produção assim.
 */
export function EditableTransaction({
  transaction,
  accounts,
  children,
}: {
  transaction: EditableTransactionData;
  accounts: PayableAccount[];
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditForm
        transaction={transaction}
        accounts={accounts}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      {children}
      <TransactionActions
        id={transaction.id}
        description={transaction.description}
        isFixed={transaction.isFixed}
        isInstallment={transaction.isInstallment}
        onEdit={() => setEditing(true)}
      />
    </>
  );
}

function EditForm({
  transaction,
  accounts,
  onDone,
}: {
  transaction: EditableTransactionData;
  accounts: PayableAccount[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(updateTransaction, EMPTY_FORM_STATE);
  const [accountId, setAccountId] = useState(transaction.accountId ?? "");
  const isCard = accounts.some((a) => a.id === accountId && a.isCard);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input type="hidden" name="id" value={transaction.id} />

      {transaction.installmentLabel ? (
        <p className="rounded-xl bg-blue-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-blue-strong">
          Editando só a parcela {transaction.installmentLabel}. As outras não mudam.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Descrição">
          <input
            name="description"
            required
            defaultValue={transaction.description}
            className={inputClass}
          />
        </Field>
        <Field label="Categoria">
          <input
            name="category"
            required
            defaultValue={transaction.category}
            className={inputClass}
          />
        </Field>
        <Field label="Tipo">
          <select
            name="direction"
            defaultValue={transaction.amount >= 0 ? "income" : "expense"}
            className={inputClass}
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </Field>
        <Field label="Valor (R$)">
          <input
            name="amount"
            required
            inputMode="decimal"
            defaultValue={String(Math.abs(transaction.amount))}
            className={inputClass}
          />
        </Field>
        <Field label="Onde">
          <select
            name="account_id"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className={inputClass}
          >
            <option value="">Conta / dinheiro</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
                {account.isCard ? " (cartão)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data">
          <input
            type="date"
            name="occurred_on"
            defaultValue={transaction.occurredOn}
            className={inputClass}
          />
        </Field>
      </div>

      {isCard ? (
        <p className="text-[12.5px] leading-[1.5] text-muted">
          Em cartão, a data acima é a da <strong>compra</strong> — o dinheiro sai no vencimento da
          fatura do ciclo. Se este lançamento é o <strong>pagamento</strong> da fatura, escolha
          “Conta / dinheiro” para ele sair na data que você pôs.
        </p>
      ) : null}

      <FormMessages state={state} />

      <div className="flex gap-2">
        <SubmitButton label="Salvar" pendingLabel="Salvando…" />
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-line-strong bg-white px-4 py-2.5 text-[14px] font-bold text-muted transition hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
