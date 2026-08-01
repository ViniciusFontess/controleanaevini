export type FormState = {
  error?: string;
  ok?: boolean;
  /** mensagem de sucesso exibida ao usuário */
  notice?: string;
};

export const EMPTY_FORM_STATE: FormState = {};

/** Lê um campo numérico de um FormData, aceitando vírgula decimal. */
export function readAmount(formData: FormData, field: string): number | null {
  const raw = String(formData.get(field) ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function readText(formData: FormData, field: string): string {
  return String(formData.get(field) ?? "").trim();
}
