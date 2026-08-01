"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

/** Sidebar: escondida no mobile, ícones a partir de md, ícone + rótulo a partir de lg. */
export function SidebarNav() {
  const isActive = useIsActive();

  return (
    <nav className="flex flex-col gap-1.5">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-[5px] rounded-[14px] px-1.5 py-3 text-[11px] font-semibold transition lg:flex-row lg:justify-start lg:gap-3.5 lg:px-4 lg:py-[13px] lg:text-[14.5px] ${
            isActive(item.href)
              ? "bg-blue-soft text-blue-strong"
              : "text-muted hover:bg-line-soft hover:text-ink"
          }`}
        >
          {item.icon}
          <span className="hidden lg:inline">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** Bottom bar: só no mobile (<md). */
export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-white/92 px-1.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-[12px] md:hidden"
      aria-label="Navegação principal"
    >
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition ${
            isActive(item.href) ? "text-blue-strong" : "text-muted"
          }`}
        >
          {item.icon}
          <span>{item.shortLabel}</span>
        </Link>
      ))}
    </nav>
  );
}
