import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  /** rótulo da sidebar (desktop) */
  label: string;
  /** rótulo da bottom bar (mobile), mais curto */
  shortLabel: string;
  icon: ReactNode;
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-6",
  "aria-hidden": true,
} as const;

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Início",
    icon: (
      <svg {...iconProps}>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 9v11h14V9" />
      </svg>
    ),
  },
  {
    href: "/patrimonio",
    label: "Patrimônio",
    shortLabel: "Patrimônio",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <circle cx="17" cy="14.5" r="1.2" />
      </svg>
    ),
  },
  {
    href: "/fluxo",
    label: "Fluxo de caixa",
    shortLabel: "Fluxo",
    icon: (
      <svg {...iconProps}>
        <path d="M4 8h13" />
        <path d="M14 5l3 3-3 3" />
        <path d="M20 16H7" />
        <path d="M10 13l-3 3 3 3" />
      </svg>
    ),
  },
  {
    href: "/caixa",
    label: "Caixa",
    shortLabel: "Caixa",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="7" width="18" height="12" rx="2.5" />
        <path d="M3 11h18" />
        <path d="M7 3h10l1 4H6z" />
      </svg>
    ),
  },
  {
    href: "/projecao",
    label: "Projeção",
    shortLabel: "Projeção",
    icon: (
      <svg {...iconProps}>
        <path d="M4 16l5-5 4 3 7-8" />
        <path d="M20 6h-4" />
        <path d="M20 6v4" />
      </svg>
    ),
  },
];

export function BrandMark({ className = "size-[34px]" }: { className?: string }) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--color-blue),var(--color-green))] ${className}`}
    >
      <svg className="size-[55%]" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M12 20.5c-.3 0-.6-.1-.8-.3C6.5 16.8 3 13.6 3 9.9 3 7.2 5.1 5 7.7 5c1.5 0 2.9.7 3.8 1.9C12.4 5.7 13.8 5 15.3 5 17.9 5 20 7.2 20 9.9c0 3.7-3.5 6.9-8.2 10.3-.2.2-.5.3-.8.3Z" />
      </svg>
    </div>
  );
}
