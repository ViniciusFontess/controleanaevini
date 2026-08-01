/**
 * Resolve as credenciais públicas do Supabase.
 *
 * As referências a `process.env.NEXT_PUBLIC_*` precisam ser **estáticas**: o
 * Next.js as substitui pelo literal em tempo de build. Um lookup dinâmico
 * (`process.env[nome]`) chega como `undefined` no bundle do Edge/browser.
 *
 * Aceitamos os dois nomes de chave em uso no ecossistema:
 * - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — chave nova (`sb_publishable_...`)
 * - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — nome legado, e o que a integração
 *   Vercel↔Supabase injeta automaticamente no projeto
 */
export function readSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    ].filter(Boolean);

    throw new Error(
      `Supabase não configurado: faltando ${missing.join(" e ")}. ` +
        "Variáveis NEXT_PUBLIC_* são embutidas em tempo de build — depois de " +
        "adicioná-las no Vercel é preciso refazer o deploy (Redeploy sem cache), " +
        "não basta salvar.",
    );
  }

  return { url, key };
}
