import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Db = SupabaseClient<Database>;

/**
 * Cliente Supabase + usuário autenticado. Toda leitura/escrita passa por aqui,
 * então nenhuma query roda sem `user_id` conhecido (o RLS já barra, isso é a
 * segunda camada).
 */
export async function requireUser(): Promise<{ supabase: Db; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}
