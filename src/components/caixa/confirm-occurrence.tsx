"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { confirmOccurrence } from "@/lib/actions/recurrences";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";

export function ConfirmOccurrence({
  recurrenceId,
  date,
}: {
  recurrenceId: string;
  date: string;
}) {
  const [state, formAction] = useActionState(confirmOccurrence, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="recurrence_id" value={recurrenceId} />
      <input type="hidden" name="date" value={date} />
      <ConfirmButton />
      {state.error ? (
        <span className="text-[11px] font-semibold text-coral-strong">{state.error}</span>
      ) : null}
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-line-strong bg-white px-2.5 py-1 text-[11.5px] font-bold text-muted transition hover:border-green hover:text-green-strong disabled:opacity-60"
    >
      {pending ? "…" : "Confirmar"}
    </button>
  );
}
