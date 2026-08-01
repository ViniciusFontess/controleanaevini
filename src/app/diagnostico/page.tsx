import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Rota de diagnóstico temporária.
 *
 * Em produção o Next esconde a mensagem de erro real e mostra só "a server
 * error occurred". Esta página testa cada camada isoladamente e imprime o que
 * deu errado, sem nunca revelar valores de chave — só presença, host e a
 * mensagem do Postgres.
 *
 * Apague `src/app/diagnostico` (e a entrada em PUBLIC_PATHS do middleware)
 * quando o app estiver de pé.
 */
export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnóstico" };

type Check = { name: string; ok: boolean; detail: string };

const TABLES = ["accounts", "transactions", "snapshots", "goals"] as const;

export default async function DiagnosticoPage() {
  const checks: Check[] = [];

  // ---- 1. variáveis de ambiente (embutidas no build) ----
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = publishable ?? anon;

  checks.push({
    name: "NEXT_PUBLIC_SUPABASE_URL",
    ok: Boolean(url),
    detail: url ? `definida (host: ${safeHost(url)})` : "AUSENTE no bundle deste deploy",
  });

  checks.push({
    name: "Chave publishable/anon",
    ok: Boolean(key),
    detail: key
      ? `definida via ${publishable ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY"} (${key.length} caracteres, começa com "${key.slice(0, 8)}…")`
      : "AUSENTE: nem NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nem NEXT_PUBLIC_SUPABASE_ANON_KEY estão no bundle",
  });

  if (!url || !key) {
    checks.push({
      name: "Conclusão",
      ok: false,
      detail:
        "As variáveis NEXT_PUBLIC_* são embutidas em tempo de BUILD. Salvá-las no " +
        "Vercel não basta: é preciso Redeploy com 'Use existing Build Cache' " +
        "DESMARCADO, e elas precisam estar marcadas para o ambiente Production.",
    });
    return <Report checks={checks} />;
  }

  // ---- 2. o banco responde? cada tabela existe? ----
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser();
    checks.push({
      name: "Conexão com o Supabase Auth",
      ok: !error,
      detail: error
        ? `${error.name}: ${error.message}`
        : data.user
          ? `respondeu — sessão ativa (${data.user.email})`
          : "respondeu — sem sessão ativa (normal se você não fez login)",
    });
  } catch (error) {
    checks.push({
      name: "Conexão com o Supabase Auth",
      ok: false,
      detail: `não foi possível alcançar o servidor: ${messageOf(error)}`,
    });
    return <Report checks={checks} />;
  }

  for (const table of TABLES) {
    try {
      const { error } = await supabase.from(table).select("id").limit(1);
      checks.push({
        name: `Tabela public.${table}`,
        ok: !error,
        detail: error
          ? `${error.code ?? "erro"}: ${error.message}${
              error.code === "42P01" ? "  ← a tabela NÃO existe: rode a migration" : ""
            }`
          : "existe e responde",
      });
    } catch (error) {
      checks.push({
        name: `Tabela public.${table}`,
        ok: false,
        detail: messageOf(error),
      });
    }
  }

  return <Report checks={checks} />;
}

function Report({ checks }: { checks: Check[] }) {
  const failed = checks.filter((c) => !c.ok);

  return (
    <main className="mx-auto max-w-[760px] px-5 py-10">
      <h1 className="text-[24px] font-extrabold tracking-[-0.02em]">Diagnóstico</h1>
      <p className="mt-1 mb-6 text-[14px] text-muted">
        {failed.length === 0
          ? "Tudo respondendo. Se o app ainda falha, o problema é outro."
          : `${failed.length} verificação(ões) falhando — a primeira em vermelho é a causa.`}
      </p>

      <ul className="flex flex-col gap-2.5">
        {checks.map((check) => (
          <li
            key={check.name}
            className={`rounded-xl border p-3.5 ${
              check.ok ? "border-line-strong bg-surface" : "border-coral bg-coral-soft"
            }`}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true">{check.ok ? "✓" : "✗"}</span>
              <span className="text-[14px] font-bold">{check.name}</span>
            </div>
            <p className="mt-1 font-mono text-[12.5px] leading-[1.5] break-words text-ink/80">
              {check.detail}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[12.5px] text-muted">
        Esta página não exibe o valor de nenhuma chave. Apague a pasta{" "}
        <code>src/app/diagnostico</code> quando terminar.
      </p>
    </main>
  );
}

function safeHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return `valor inválido — não é uma URL ("${value.slice(0, 30)}")`;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
