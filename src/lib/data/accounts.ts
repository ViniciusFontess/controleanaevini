import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "./user.ts";

export type Account = Tables<"accounts">;
export type AccountKind = "asset" | "liability";

/** Paleta do donut, na ordem do design (Patrimonio.dc.html). */
export const ACCOUNT_COLORS = [
  "#7BA8E8",
  "#9BC0F0",
  "#8FD4A8",
  "#B6D9C4",
  "#C9D2E4",
] as const;

export async function getAccounts(): Promise<Account[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("balance", { ascending: false });

  if (error) throw new Error(`Falha ao carregar contas: ${error.message}`);
  return data ?? [];
}

/** Separa em ativos e passivos preservando a ordem por saldo. */
export function splitAccounts(accounts: readonly Account[]) {
  return {
    assets: accounts.filter((a) => a.kind === "asset"),
    liabilities: accounts.filter((a) => a.kind === "liability"),
  };
}

/** Cor salva na conta, ou uma da paleta pela posição. */
export function accountColor(account: Account, index: number): string {
  return account.color ?? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
}
