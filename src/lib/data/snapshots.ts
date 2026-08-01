import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "./user.ts";

export type Snapshot = Tables<"snapshots">;

/** Últimos `limit` snapshots, devolvidos em ordem cronológica (mais antigo primeiro). */
export async function getSnapshots(limit = 12): Promise<Snapshot[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("month_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar snapshots: ${error.message}`);

  return (data ?? []).slice().reverse();
}
