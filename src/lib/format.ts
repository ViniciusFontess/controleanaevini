/** Formatação pt-BR compartilhada entre server e client components. */

const NUMBER = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MONTH_LONG = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_SHORT = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

const DAY_MONTH = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/** `287450` → `"287.450"` (o "R$" é renderizado à parte no layout). */
export function fmt(value: number): string {
  return NUMBER.format(Math.round(value));
}

/** `"2026-08-01"` → `"Agosto de 2026"` */
export function fmtMonthLong(isoDate: string): string {
  const label = MONTH_LONG.format(new Date(`${isoDate}T00:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** `"2026-08-01"` → `"ago"` */
export function fmtMonthShort(isoDate: string): string {
  return MONTH_SHORT.format(new Date(`${isoDate}T00:00:00Z`)).replace(".", "");
}

/** `"2026-08-05"` → `"05 ago"` */
export function fmtDayMonth(isoDate: string): string {
  return DAY_MONTH.format(new Date(`${isoDate}T00:00:00Z`)).replace(".", "");
}
