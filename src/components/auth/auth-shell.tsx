import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: { text: string; linkLabel: string; href: string };
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--color-blue),var(--color-green))]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 15l5-5 4 4 7-8" />
            </svg>
          </div>
          <span className="font-display text-[16px] font-extrabold tracking-[-0.02em]">
            Patrimônio
          </span>
        </div>

        <div className="rounded-2xl bg-surface/95 p-7 shadow-card backdrop-blur-sm">
          <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 mb-6 text-[14px] text-muted">{subtitle}</p>
          {children}
        </div>

        <p className="mt-6 text-center text-[14px] text-muted">
          {footer.text}{" "}
          <Link href={footer.href} className="font-bold text-blue-strong hover:text-blue-hover">
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
