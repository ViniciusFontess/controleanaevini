import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { readSupabaseEnv } from "./env";

export function createClient() {
  const { url, key } = readSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
