import { fmt } from "@/lib/format";
import { EmptyChart } from "./empty-chart";

export type DonutSegment = { label: string; value: number; color: string };

const R = 64;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function DonutChart({ segments }: { segments: readonly DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (segments.length === 0 || total <= 0) {
    return <EmptyChart message="Cadastre ativos para ver a composição." minHeight={180} />;
  }

  // Cada arco começa onde o anterior terminou — offsets acumulados antes do render.
  const arcs = segments.reduce<{ segment: DonutSegment; dash: number; offset: number }[]>(
    (acc, segment) => {
      const dash = (segment.value / total) * CIRCUMFERENCE;
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      acc.push({ segment, dash, offset });
      return acc;
    },
    [],
  );

  return (
    <svg viewBox="0 0 180 180" className="block h-auto w-full" role="img" aria-label="Composição dos ativos">
      {arcs.map(({ segment, dash, offset }) => (
        <circle
          key={segment.label}
          cx="90"
          cy="90"
          r={R}
          fill="none"
          stroke={segment.color}
          strokeWidth="24"
          strokeDasharray={`${dash.toFixed(2)} ${(CIRCUMFERENCE - dash).toFixed(2)}`}
          strokeDashoffset={(-offset).toFixed(2)}
          transform="rotate(-90 90 90)"
        />
      ))}

      <text x="90" y="84" fontSize="11" fill="#8A93A6" textAnchor="middle" fontFamily="Inter" fontWeight="600">
        Ativos
      </text>
      <text x="90" y="104" fontSize="19" fill="#1A1F2B" textAnchor="middle" fontFamily="Inter" fontWeight="800">
        {total >= 1000 ? `R$ ${(total / 1000).toFixed(0)}k` : `R$ ${fmt(total)}`}
      </text>
    </svg>
  );
}
