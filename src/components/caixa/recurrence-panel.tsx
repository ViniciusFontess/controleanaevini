"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createRecurrence, deleteRecurrence } from "@/lib/actions/recurrences";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";
import type { Recurrence } from "@/lib/data/recurrences";
import { fmt } from "@/lib/format";
import {
  DeleteButton,
  Field,
  FormMessages,
  SubmitButton,
  inputClass,
} from "@/components/ui/form-fields";
import { Card } from "@/components/ui/card";

export function RecurrencePanel({ recurrences }: { recurrences: Recurrence[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createRecurrence, EMPTY_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card className="mb-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[15px] font-bold">Entradas e saídas fixas</div>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Salário, aluguel, assinaturas. Elas aparecem na projeção, mas só viram lançamento
            quando você confirma.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-xl border border-line-strong bg-white px-3.5 py-2 text-[13px] font-bold text-muted transition hover:text-ink"
        >
          {open ? "Fechar" : "Nova"}
        </button>
      </div>

      {recurrences.length > 0 ? (
        <div className="mb-3 flex flex-col">
          {recurrences.map((recurrence) => (
            <div
              key={recurrence.id}
              className="flex items-center justify-between gap-3 border-t border-line-soft py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{recurrence.name}</div>
                <div className="text-[12px] text-muted">
                  todo dia {recurrence.day_of_month} · {recurrence.category}
                </div>
              </div>
              <span
                className={`text-[14px] font-bold whitespace-nowrap ${
                  Number(recurrence.amount) >= 0 ? "text-green-strong" : "text-coral-strong"
                }`}
              >
                {Number(recurrence.amount) >= 0 ? "+" : "−"}R${" "}
                {fmt(Math.abs(Number(recurrence.amount)))}
              </span>
              <form action={deleteRecurrence}>
                <input type="hidden" name="id" value={recurrence.id} />
                <DeleteButton confirmMessage={`Excluir "${recurrence.name}"?`} />
              </form>
            </div>
          ))}
        </div>
      ) : null}

      {open ? (
        <form ref={formRef} action={formAction} className="flex flex-col gap-3 border-t border-line-soft pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <input name="name" required placeholder="Salário" className={inputClass} />
            </Field>
            <Field label="Categoria">
              <input name="category" required placeholder="Renda" className={inputClass} />
            </Field>
            <Field label="Tipo">
              <select name="direction" defaultValue="income" className={inputClass}>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </Field>
            <Field label="Valor (R$)">
              <input name="amount" required inputMode="decimal" placeholder="0,00" className={inputClass} />
            </Field>
            <Field label="Todo dia" className="sm:col-span-2">
              <input
                name="day_of_month"
                required
                type="number"
                min={1}
                max={31}
                placeholder="5"
                className={inputClass}
              />
            </Field>
          </div>

          <FormMessages state={state} />

          <div>
            <SubmitButton label="Adicionar" pendingLabel="Salvando…" />
          </div>
        </form>
      ) : null}
    </Card>
  );
}
