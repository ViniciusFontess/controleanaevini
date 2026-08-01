"use client";

import { useState } from "react";
import { deleteAccount } from "@/lib/actions/accounts";
import type { Account } from "@/lib/data/accounts";
import { fmt } from "@/lib/format";
import { DeleteButton } from "@/components/ui/form-fields";
import { AccountForm } from "./account-form";

export function AccountRow({
  account,
  barPercent,
}: {
  account: Account;
  /** largura da barra de proporção, 0–100 */
  barPercent: number;
}) {
  const [editing, setEditing] = useState(false);
  const isLiability = account.kind === "liability";

  if (editing) {
    return (
      <div className="border-t border-line-soft py-3">
        <AccountForm account={account} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="group border-t border-line-soft py-3">
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold">{account.name}</div>
          <div className="mt-0.5 text-[12px] text-muted">{account.category}</div>
        </div>

        <div className="flex flex-none items-center gap-1">
          <span
            className={`text-[15px] font-bold whitespace-nowrap ${
              isLiability ? "text-coral-strong" : ""
            }`}
          >
            R$ {fmt(Number(account.balance))}
          </span>

          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Editar ${account.name}`}
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

          <form action={deleteAccount}>
            <input type="hidden" name="id" value={account.id} />
            <DeleteButton confirmMessage={`Excluir "${account.name}"?`} />
          </form>
        </div>
      </div>

      <div className="mt-2.5 h-[5px] overflow-hidden rounded-[5px] bg-line-soft">
        <div
          className="h-full rounded-[5px]"
          style={{
            width: `${barPercent.toFixed(0)}%`,
            background: isLiability ? "#F2A0A0" : "#7BA8E8",
          }}
        />
      </div>
    </div>
  );
}
