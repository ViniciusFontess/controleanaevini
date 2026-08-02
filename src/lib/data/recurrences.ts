import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "./user.ts";

export type Recurrence = Tables<"recurrences">;

export async function getRecurrences(): Promise<Recurrence[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("recurrences")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_month", { ascending: true });

  if (error) throw new Error(`Falha ao carregar recorrências: ${error.message}`);
  return data ?? [];
}
