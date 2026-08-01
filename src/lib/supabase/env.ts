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
  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!url || !key) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const problems = [
      !url &&
        (rawUrl
          ? `NEXT_PUBLIC_SUPABASE_URL não é uma URL http(s) válida (valor recebido: ${JSON.stringify(rawUrl)})`
          : "NEXT_PUBLIC_SUPABASE_URL ausente"),
      !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) ausente",
    ].filter(Boolean);

    throw new Error(
      `Supabase não configurado: ${problems.join("; ")}. ` +
        "Variáveis NEXT_PUBLIC_* são embutidas em tempo de build — depois de " +
        "corrigi-las no Vercel é preciso refazer o deploy (Redeploy sem cache), " +
        "não basta salvar.",
    );
  }

  return { url, key };
}

/**
 * Remove espaços, quebras de linha e aspas que sobram ao colar o valor num
 * painel de configuração. `"https://x.supabase.co"` e `https://x.supabase.co\n`
 * chegam aqui como o mesmo valor limpo.
 */
export function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;

  // [\s\S] em vez da flag /s: o target do tsconfig é ES2017, que não a suporta.
  const trimmed = value.trim().replace(/^(['"])([\s\S]*)\1$/, "$2").trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Normaliza a URL do projeto Supabase.
 *
 * Aceita `iotjvhvcanebowhdvxva.supabase.co` (sem protocolo, o erro de colagem
 * mais comum) e remove barra final. Devolve `undefined` se, mesmo depois disso,
 * não for uma URL http(s) válida — aí o chamador reporta o valor cru.
 *
 * Um valor com outro protocolo é rejeitado em vez de "consertado": a connection
 * string do Postgres (`postgres://…`) fica ao lado da URL da API no painel do
 * Supabase, e prefixar `https://` nela produziria um host absurdo que só falha
 * bem mais adiante.
 */
export function normalizeUrl(value: string | undefined): string | undefined {
  const cleaned = clean(value);
  if (!cleaned) return undefined;

  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(cleaned)?.[1]?.toLowerCase();
  if (scheme && scheme !== "http" && scheme !== "https") return undefined;

  const withScheme = scheme ? cleaned : `https://${cleaned}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
}
