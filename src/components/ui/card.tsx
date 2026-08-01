import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-surface p-[22px] shadow-card ${className}`}>{children}</div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">{title}</h1>
      {subtitle ? <p className="mt-1 text-[14px] text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <span
      className="size-[9px] flex-none rounded-[3px]"
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}
