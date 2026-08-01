"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/lib/auth/actions";

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOut}>
      <SubmitButton className={className} />
    </form>
  );
}

function SubmitButton({ className }: { className: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title="Sair"
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-muted transition hover:bg-line-soft hover:text-coral-strong disabled:opacity-60 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[18px] flex-none"
        aria-hidden="true"
      >
        <path d="M15 17l5-5-5-5" />
        <path d="M20 12H9" />
        <path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
      </svg>
      <span>{pending ? "Saindo…" : "Sair"}</span>
    </button>
  );
}
