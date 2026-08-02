"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";
import { FormMessages, SubmitButton, inputClass } from "@/components/ui/form-fields";

/**
 * Lançamento de uma linha para a receita que se repete todo dia (a venda).
 * Um campo de valor e pronto — o resto vem preenchido e o foco volta para o
 * valor depois de salvar, para lançar várias seguidas.
 */
export function QuickEntry({
  today,
  defaultCategory,
  defaultDescription,
}: {
  today: string;
  defaultCategory: string;
  defaultDescription: string;
}) {
  const [state, formAction] = useActionState(createTransaction, EMPTY_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    amountRef.current?.focus();
  }, [state]);

  return (
    <div className="mb-4 rounded-2xl border border-line-strong bg-green-soft/40 p-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2.5">
        <input type="hidden" name="direction" value="income" />
        <input type="hidden" name="occurred_on" value={today} />
        <input type="hidden" name="description" value={defaultDescription} />
        <input type="hidden" name="category" value={defaultCategory} />

        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[140px] flex-1">
            <label htmlFor="quick-amount" className="mb-1.5 block text-[12.5px] font-semibold text-muted">
              Venda de hoje · {defaultCategory}
            </label>
            <input
              id="quick-amount"
              ref={amountRef}
              name="amount"
              required
              inputMode="decimal"
              placeholder="0,00"
              className={inputClass}
            />
          </div>
          <SubmitButton label="Lançar" pendingLabel="…" />
        </div>

        <FormMessages state={state} />
      </form>
    </div>
  );
}
