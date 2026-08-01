"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";
import { Field, FormMessages, SubmitButton, inputClass } from "@/components/ui/form-fields";

export function NewTransactionPanel({
  today,
  knownCategories,
}: {
  /** data ISO calculada no server, pra não divergir entre server e client render */
  today: string;
  knownCategories: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTransaction, EMPTY_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-strong px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-blue-hover"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="size-[16px]"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nova transação
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-line-strong bg-blue-tint p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-bold">Nova transação</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] font-semibold text-muted hover:text-ink"
        >
          Fechar
        </button>
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Descrição">
            <input
              name="description"
              required
              placeholder="Salário, Mercado…"
              className={inputClass}
            />
          </Field>

          <Field label="Categoria">
            <input
              name="category"
              required
              list="categorias-conhecidas"
              placeholder="Renda, Alimentação…"
              className={inputClass}
            />
            <datalist id="categorias-conhecidas">
              {knownCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Tipo">
            <select name="direction" defaultValue="expense" className={inputClass}>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </Field>

          <Field label="Valor (R$)">
            <input
              name="amount"
              required
              inputMode="decimal"
              placeholder="0,00"
              className={inputClass}
            />
          </Field>

          <Field label="Data" className="sm:col-span-2">
            <input type="date" name="occurred_on" defaultValue={today} className={inputClass} />
          </Field>
        </div>

        <FormMessages state={state} />

        <div>
          <SubmitButton label="Registrar" pendingLabel="Salvando…" />
        </div>
      </form>
    </div>
  );
}
