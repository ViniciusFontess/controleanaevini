"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { EMPTY_FORM_STATE } from "@/lib/actions/form-state";
import type { Account } from "@/lib/data/accounts";
import { Field, FormMessages, SubmitButton, inputClass } from "@/components/ui/form-fields";

type AccountFormProps = {
  /** Conta existente = modo edição; ausente = modo criação. */
  account?: Account;
  defaultKind?: "asset" | "liability";
  onDone?: () => void;
};

export function AccountForm({ account, defaultKind = "asset", onDone }: AccountFormProps) {
  const isEdit = Boolean(account);
  const [state, formAction] = useActionState(
    isEdit ? updateAccount : createAccount,
    EMPTY_FORM_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<string>(account?.kind ?? defaultKind);
  const isCard = kind === "credit_card";

  useEffect(() => {
    if (!state.ok) return;
    if (isEdit) {
      onDone?.();
    } else {
      formRef.current?.reset();
    }
  }, [state, isEdit, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <input
            name="name"
            required
            defaultValue={account?.name}
            placeholder="Imóvel, Reserva de emergência…"
            className={inputClass}
          />
        </Field>

        <Field label="Categoria">
          <input
            name="category"
            required
            defaultValue={account?.category}
            placeholder="Imobilizado, Renda fixa…"
            className={inputClass}
          />
        </Field>

        <Field label="Tipo">
          <select
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className={inputClass}
          >
            <option value="asset">Ativo</option>
            <option value="liability">Passivo</option>
            <option value="credit_card">Cartão de crédito</option>
          </select>
        </Field>

        {isCard ? (
          <>
            <Field label="Fecha no dia">
              <input
                name="closing_day"
                required
                type="number"
                min={1}
                max={31}
                defaultValue={account?.closing_day ?? ""}
                placeholder="18"
                className={inputClass}
              />
            </Field>
            <Field label="Vence no dia">
              <input
                name="due_day"
                required
                type="number"
                min={1}
                max={31}
                defaultValue={account?.due_day ?? ""}
                placeholder="25"
                className={inputClass}
              />
            </Field>
          </>
        ) : (
          <Field label="Valor (R$)">
            <input
              name="balance"
              required
              inputMode="decimal"
              defaultValue={account ? String(account.balance) : ""}
              placeholder="0,00"
              className={inputClass}
            />
          </Field>
        )}
      </div>

      {isCard ? (
        <p className="text-[12.5px] leading-[1.5] text-muted">
          O saldo do cartão não é digitado: a fatura é calculada a partir das compras. Uma compra
          feita depois do fechamento já cai na fatura do mês seguinte.
        </p>
      ) : null}

      {kind === "asset" ? (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line-strong bg-white p-3">
          <input
            type="checkbox"
            name="liquid"
            defaultChecked={account?.liquid ?? false}
            className="mt-0.5 size-4 flex-none accent-[var(--color-blue-strong)]"
          />
          <span className="text-[12.5px] leading-[1.5] text-muted">
            <span className="font-semibold text-ink">É dinheiro disponível</span> — conta corrente,
            carteira, algo que você usa no dia a dia. Só o que estiver marcado entra no saldo da
            tela de Caixa. Investimento fica desmarcado: continua no seu patrimônio, mas não é
            caixa.
          </span>
        </label>
      ) : null}

      <FormMessages state={state} />

      <div className="flex gap-2">
        <SubmitButton
          label={isEdit ? "Salvar" : "Adicionar conta"}
          pendingLabel="Salvando…"
        />
        {isEdit ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border border-line-strong bg-white px-4 py-2.5 text-[14px] font-bold text-muted transition hover:text-ink"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** Botão "Nova conta" que revela o formulário de criação. */
export function NewAccountPanel() {
  const [open, setOpen] = useState(false);

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
        Nova conta
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-line-strong bg-blue-tint p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-bold">Nova conta</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] font-semibold text-muted hover:text-ink"
        >
          Fechar
        </button>
      </div>
      <AccountForm />
    </div>
  );
}
