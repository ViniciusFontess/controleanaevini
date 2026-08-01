import { smoothPath, verticalScale, type Point } from "@/lib/chart";
import { EmptyChart } from "./empty-chart";

const W = 700;
const H = 250;
const PAD_X = 18;
const PAD_T = 20;
const PAD_B = 34;

/**
 * Histórico (snapshots reais) em azul sólido + projeção em verde tracejado.
 * Se ainda não há histórico, desenha só a projeção a partir do ponto atual.
 */
export function ProjectionChart({
  history,
  future,
}: {
  history: readonly number[];
  future: readonly number[];
}) {
  const all = [...history, ...future];

  if (all.length < 2) {
    return <EmptyChart message="Cadastre suas contas para simular a projeção." minHeight={230} />;
  }

  const { min, range } = verticalScale(all, 0.02);
  const total = all.length;
  const xy = (i: number, v: number): Point => [
    PAD_X + (i / (total - 1)) * (W - 2 * PAD_X),
    PAD_T + (1 - (v - min) / range) * (H - PAD_T - PAD_B),
  ];

  const historyPoints: Point[] = history.map((v, i) => xy(i, v));
  const anchor = historyPoints[historyPoints.length - 1];
  const futurePoints: Point[] = [
    ...(anchor ? [anchor] : []),
    ...future.map((v, i) => xy(history.length + i, v)),
  ];

  const historyLine = smoothPath(historyPoints);
  const futureLine = smoothPath(futurePoints);
  const baseline = H - PAD_B;
  const leftEdge = (historyPoints[0] ?? futurePoints[0])[0].toFixed(1);

  const futureArea =
    futurePoints.length > 1
      ? `${futureLine} L ${futurePoints[futurePoints.length - 1][0].toFixed(1)} ${baseline} L ${futurePoints[0][0].toFixed(1)} ${baseline} Z`
      : "";
  const historyArea =
    historyPoints.length > 1
      ? `${historyLine} L ${anchor[0].toFixed(1)} ${baseline} L ${leftEdge} ${baseline} Z`
      : "";

  const end = futurePoints[futurePoints.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Patrimônio projetado">
      <defs>
        <linearGradient id="proj-future" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD4A8" stopOpacity="0.22" />
          <stop offset="1" stopColor="#8FD4A8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="proj-history" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7BA8E8" stopOpacity="0.18" />
          <stop offset="1" stopColor="#7BA8E8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {historyArea ? <path d={historyArea} fill="url(#proj-history)" /> : null}
      {futureArea ? <path d={futureArea} fill="url(#proj-future)" /> : null}

      {historyPoints.length > 1 ? (
        <path
          d={historyLine}
          fill="none"
          stroke="#7BA8E8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      <path
        d={futureLine}
        fill="none"
        stroke="#3B9A5F"
        strokeWidth="3"
        strokeDasharray="2 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={end[0].toFixed(1)} cy={end[1].toFixed(1)} r="5.5" fill="#3B9A5F" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
