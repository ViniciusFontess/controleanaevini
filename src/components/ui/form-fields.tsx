"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/actions/form-state";

export const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-[14px] font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-muted focus:border-blue focus:ring-4 focus:ring-blue/15";

export const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-muted";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

export function FormMessages({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="rounded-xl bg-coral-soft px-3.5 py-2.5 text-[13px] font-semibold text-coral-strong"
      >
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p
        role="status"
        className="rounded-xl bg-green-soft px-3.5 py-2.5 text-[13px] font-semibold text-green-strong"
      >
        {state.notice}
      </p>
    );
  }
  return null;
}

export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();

  const styles =
    variant === "primary"
      ? "bg-blue-strong text-white hover:bg-blue-hover"
      : "border border-line-strong bg-white text-muted hover:text-ink";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-xl px-4 py-2.5 text-[14px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function DeleteButton({ confirmMessage }: { confirmMessage: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Excluir"
      title="Excluir"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="rounded-lg p-1.5 text-muted transition hover:bg-coral-soft hover:text-coral-strong disabled:opacity-50"
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
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </svg>
    </button>
  );
}
