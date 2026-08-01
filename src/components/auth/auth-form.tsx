"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/lib/auth/actions";

type AuthFormProps = {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  pendingLabel: string;
  passwordHint?: string;
  autoComplete: "current-password" | "new-password";
};

const fieldClass =
  "w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[15px] font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-muted focus:border-blue focus:ring-4 focus:ring-blue/15";

const labelClass = "block text-[13px] font-semibold text-muted";

export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  passwordHint,
  autoComplete,
}: AuthFormProps) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className={labelClass} htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@exemplo.com"
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass} htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={fieldClass}
        />
        {passwordHint ? (
          <p className="text-[12.5px] text-muted">{passwordHint}</p>
        ) : null}
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-coral-soft px-4 py-3 text-[13.5px] font-semibold text-coral-strong"
        >
          {state.error}
        </p>
      ) : null}

      {state.notice ? (
        <p
          role="status"
          className="rounded-xl bg-green-soft px-4 py-3 text-[13.5px] font-semibold text-green-strong"
        >
          {state.notice}
        </p>
      ) : null}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-xl bg-blue-strong px-4 py-3.5 text-[15px] font-bold text-white transition hover:bg-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
