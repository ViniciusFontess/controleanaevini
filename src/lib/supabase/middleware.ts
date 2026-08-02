import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { readSupabaseEnv } from "./env";

const PUBLIC_PATHS = ["/login", "/signup"];
/**
 * Rotas alcançáveis em qualquer estado de sessão — nem exigem login, nem
 * redirecionam quem já está logado.
 */
const ALWAYS_ALLOWED_PATHS = ["/auth/confirm"];

export async function updateSession(request: NextRequest) {
  try {
    return await refreshSession(request);
  } catch (error) {
    // O middleware roda antes de TODAS as rotas: se ele lança, a plataforma
    // devolve MIDDLEWARE_INVOCATION_FAILED em toda URL, inclusive /login, e o
    // motivo real fica só no log. Aqui registramos a causa e seguimos — o
    // layout autenticado ((app)/layout.tsx) refaz a checagem de sessão e é o
    // guard de verdade, então deixar passar não abre acesso a nada.
    console.error("[middleware] falha ao atualizar a sessão do Supabase:", error);
    return NextResponse.next({ request });
  }
}

async function refreshSession(request: NextRequest) {
  const { url: supabaseUrl, key } = readSupabaseEnv();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAlwaysAllowed = ALWAYS_ALLOWED_PATHS.some((path) => pathname.startsWith(path));
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isAlwaysAllowed) {
    return supabaseResponse;
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
