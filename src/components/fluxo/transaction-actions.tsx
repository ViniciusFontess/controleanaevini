"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteTransaction, duplicateToNextMonth } from "@/lib/actions/transactions";
import { promoteToRecurrence } from "@/lib/actions/recurrences";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";
import { DeleteButton } from "@/components/ui/form-fields";

export function TransactionActions({
  id,
  description,
  isFixed,
  isInstallment,
  onEdit,
}: {
  id: string;
  description: string;
  /** já virou recorrência — não faz sentido promover de novo */
  isFixed: boolean;
  /** parcela de uma compra: as seguintes já existem, duplicar criaria lixo */
  isInstallment: boolean;
  onEdit?: () => void;
}) {
  const [promoteState, promoteAction] = useActionState(promoteToRecurrence, EMPTY_FORM_STATE);
  const [duplicateState, duplicateAction] = useActionState(
    duplicateToNextMonth,
    EMPTY_FORM_STATE,
  );

  const message = promoteState.error ?? duplicateState.error ?? null;

  return (
    <div className="flex flex-none flex-col items-end gap-1">
      <div className="flex items-center gap-0.5">
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar ${description}`}
            title="Editar"
            className="rounded-lg p-1.5 text-muted transition hover:bg-line-soft hover:text-blue-strong"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[17px]"
              aria-hidden="true"
            >
              <path d="M4 20h4l10-10a2.5 2.5 0 0 0-4-4L4 16v4z" />
            </svg>
          </button>
        ) : null}

        {isFixed ? (
          <span
            title="Já é um gasto fixo"
            className="rounded-full bg-blue-soft px-2 py-0.5 text-[10.5px] font-bold text-blue-strong"
          >
            fixo
          </span>
        ) : (
          <form action={promoteAction}>
            <input type="hidden" name="transaction_id" value={id} />
            <IconButton
              label="Repete todo mês"
              hoverClass="hover:bg-blue-soft hover:text-blue-strong"
            >
              <path d="M17 2l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </IconButton>
          </form>
        )}

        {isInstallment ? null : (
          <form action={duplicateAction}>
            <input type="hidden" name="id" value={id} />
            <IconButton
              label="Repetir no mês que vem"
              hoverClass="hover:bg-line-soft hover:text-ink"
            >
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </IconButton>
          </form>
        )}

        <form action={deleteTransaction}>
          <input type="hidden" name="id" value={id} />
          <DeleteButton
            confirmMessage={
              isInstallment
                ? `Excluir "${description}" apaga todas as parcelas dessa compra. Continuar?`
                : `Excluir "${description}"?`
            }
          />
        </form>
      </div>

      {message ? (
        <span className="text-right text-[11px] font-semibold text-coral-strong">{message}</span>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  hoverClass,
  children,
}: {
  label: string;
  hoverClass: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      className={`rounded-lg p-1.5 text-muted transition disabled:opacity-50 ${hoverClass}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[17px]"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
