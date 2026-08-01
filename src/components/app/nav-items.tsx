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
  );
}
