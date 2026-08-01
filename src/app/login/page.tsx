import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { signIn } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Entrar · Patrimônio",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse seu controle de patrimônio."
      footer={{ text: "Ainda não tem conta?", linkLabel: "Criar conta", href: "/signup" }}
    >
      {erro === "confirmacao" ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-coral-soft px-4 py-3 text-[13.5px] font-semibold text-coral-strong"
        >
          Não conseguimos confirmar esse link. Ele pode ter expirado — tente entrar ou criar a
          conta de novo.
        </p>
      ) : null}
      <AuthForm
        action={signIn}
        submitLabel="Entrar"
        pendingLabel="Entrando…"
        autoComplete="current-password"
      />
    </AuthShell>
  );
}
