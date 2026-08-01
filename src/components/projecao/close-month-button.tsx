"use client";

import { useActionState } from "react";
import { createSnapshotForCurrentMonth } from "@/lib/actions/snapshots";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";
import { FormMessages, SubmitButton } from "@/components/ui/form-fields";

export function CloseMonthButton({ alreadyClosed }: { alreadyClosed: boolean }) {
  const [state, formAction] = useActionState(
    createSnapshotForCurrentMonth,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <SubmitButton
        label={alreadyClosed ? "Refazer fechamento" : "Fechar mês"}
        pendingLabel="Gravando…"
        variant={alreadyClosed ? "ghost" : "primary"}
      />
      <FormMessages state={state} />
    </form>
  );
}
