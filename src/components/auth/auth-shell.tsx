import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/app/nav-items";

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
          <BrandMark />
          <span className="font-display text-[16px] font-bold tracking-[-0.02em]">
            Patrimônio
          </span>
        </div>

        <div className="rounded-2xl bg-surface/95 p-7 shadow-card">
          <h1 className="font-display text-[24px] font-bold tracking-[-0.02em]">{title}</h1>
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
