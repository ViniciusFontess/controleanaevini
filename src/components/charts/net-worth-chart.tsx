import { fmtMonthShort } from "@/lib/format";
import { smoothPath, verticalScale, xAt, type Point } from "@/lib/chart";
import { EmptyChart } from "./empty-chart";

export type NetWorthPoint = { month: string; value: number };

const W = 700;
const H = 240;
const PAD_X = 18;
const PAD_T = 22;
const PAD_B = 34;

export function NetWorthChart({ points }: { points: readonly NetWorthPoint[] }) {
  if (points.length === 0) {
    return (
      <EmptyChart message="Nenhum fechamento de mês ainda. Use “Fechar mês” na tela de Projeção para começar a série." />
    );
  }

  const values = points.map((p) => p.value);
  const { min, range } = verticalScale(values, 0.06);

  const coords: Point[] = points.map((p, i) => [
    xAt(i, points.length, PAD_X, W),
    PAD_T + (1 - (p.value - min) / range) * (H - PAD_T - PAD_B),
  ]);

  const line = smoothPath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  const area = `${line} L ${last[0].toFixed(1)} ${H - PAD_B} L ${first[0].toFixed(1)} ${H - PAD_B} Z`;

  // Com 12 pontos, rotula mês sim mês não para não embolar o eixo.
  const labelStep = points.length > 6 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Evolução do patrimônio líquido">
      <defs>
        <linearGradient id="nw-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7BA8E8" stopOpacity="0.28" />
          <stop offset="1" stopColor="#7BA8E8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {points.length > 1 ? <path d={area} fill="url(#nw-gradient)" /> : null}
      <path
        d={line}
        fill="none"
        stroke="#7BA8E8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="5.5" fill="#7BA8E8" stroke="#fff" strokeWidth="3" />

      {points.map((p, i) =>
        i % labelStep === (labelStep === 2 ? 1 : 0) ? (
          <text
            key={p.month}
            x={coords[i][0].toFixed(1)}
            y={H - 12}
            fontSize="12"
            fill="#B4BCCB"
            textAnchor="middle"
            fontFamily="Inter"
          >
            {fmtMonthShort(p.month)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
