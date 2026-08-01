import type { MonthlyFlow } from "@/lib/data/finance";
import { fmtMonthShort } from "@/lib/format";
import { EmptyChart } from "./empty-chart";

const W = 700;
const H = 240;
const PAD_X = 14;
const PAD_T = 14;
const PAD_B = 30;

export function FlowBarsChart({ data }: { data: readonly MonthlyFlow[] }) {
  const hasMovement = data.some((d) => d.entradas > 0 || d.saidas > 0);

  if (data.length === 0 || !hasMovement) {
    return <EmptyChart message="Sem transações registradas nos últimos meses." />;
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.entradas, d.saidas))) * 1.12;
  const groupWidth = (W - 2 * PAD_X) / data.length;
  const barWidth = groupWidth * 0.26;
  const gap = groupWidth * 0.12;
  const plotHeight = H - PAD_T - PAD_B;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Receitas versus despesas por mês">
      {data.map((d, i) => {
        const cx = PAD_X + groupWidth * i + groupWidth / 2;
        const hIncome = (d.entradas / maxValue) * plotHeight;
        const hExpense = (d.saidas / maxValue) * plotHeight;

        return (
          <g key={d.month}>
            <rect
              x={(cx - barWidth - gap / 2).toFixed(1)}
              y={(H - PAD_B - hIncome).toFixed(1)}
              width={barWidth.toFixed(1)}
              height={hIncome.toFixed(1)}
              rx="5"
              fill="#8FD4A8"
            />
            <rect
              x={(cx + gap / 2).toFixed(1)}
              y={(H - PAD_B - hExpense).toFixed(1)}
              width={barWidth.toFixed(1)}
              height={hExpense.toFixed(1)}
              rx="5"
              fill="#F2A0A0"
            />
            <text
              x={cx.toFixed(1)}
              y={H - 11}
              fontSize="12"
              fill="#B4BCCB"
              textAnchor="middle"
              fontFamily="Inter"
            >
              {fmtMonthShort(d.month)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
