import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { signUp } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Criar conta · Patrimônio",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Comece a acompanhar seu patrimônio."
      footer={{ text: "Já tem conta?", linkLabel: "Entrar", href: "/login" }}
    >
      <AuthForm
        action={signUp}
        submitLabel="Criar conta"
        pendingLabel="Criando…"
        passwordHint="Mínimo de 6 caracteres."
        autoComplete="new-password"
      />
    </AuthShell>
  );
}
