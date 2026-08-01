"use client";

import { useMemo, useState } from "react";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { Card } from "@/components/ui/card";
import { projectCompound } from "@/lib/data/finance";
import { fmt } from "@/lib/format";

const MONTHLY_RATE = 0.003;
const HORIZONS = [6, 12, 24] as const;

export function ProjectionPanel({
  currentNetWorth,
  history,
}: {
  /** patrimônio líquido real, calculado a partir das contas no Supabase */
  currentNetWorth: number;
  /** série histórica real vinda de `snapshots` */
  history: number[];
}) {
  const [contribution, setContribution] = useState(1500);
  const [horizon, setHorizon] = useState<number>(12);

  const future = useMemo(
    () => projectCompound(currentNetWorth, contribution, 24, MONTHLY_RATE),
    [currentNetWorth, contribution],
  );

  const pct = (value: number) =>
    currentNetWorth > 0
      ? `+${(((value - currentNetWorth) / currentNetWorth) * 100).toFixed(0)}%`
      : "—";

  // O ponto de partida da projeção é o patrimônio de hoje, mesmo sem histórico.
  const chartHistory = history.length > 0 ? history : [currentNetWorth];

  return (
    <>
      <Card className="mb-4">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-[15px] font-bold">Patrimônio projetado</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
              <span className="h-[3px] w-4 rounded-[3px] bg-blue" aria-hidden="true" />
              Histórico
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
              <span
                className="h-[3px] w-4 rounded-[3px] bg-[repeating-linear-gradient(90deg,#8FD4A8_0_5px,transparent_5px_9px)]"
                aria-hidden="true"
              />
              Projeção
            </div>
          </div>
        </div>
        <div className="min-h-[230px]">
          <ProjectionChart history={chartHistory} future={future.slice(0, horizon)} />
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="aporte" className="text-[15px] font-bold">
            Aporte mensal
          </label>
          <div className="text-[24px] font-extrabold tracking-[-0.02em] text-blue-strong">
            R$ {fmt(contribution)}
          </div>
        </div>
        <input
          id="aporte"
          type="range"
          min={0}
          max={6000}
          step={100}
          value={contribution}
          onChange={(event) => setContribution(Number(event.target.value))}
          className="mt-[18px] w-full"
        />
        <div className="mt-2 flex justify-between text-[11.5px] font-semibold text-muted">
          <span>R$ 0</span>
          <span>R$ 6.000</span>
        </div>
        <p className="mt-3.5 text-[12.5px] leading-[1.5] text-muted">
          Considerando rendimento médio de ~0,3% ao mês sobre o patrimônio + seus aportes.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {HORIZONS.map((months) => {
          const value = future[months - 1] ?? currentNetWorth;
          const active = horizon === months;

          return (
            <button
              key={months}
              type="button"
              onClick={() => setHorizon(months)}
              aria-pressed={active}
              className={`rounded-2xl border-[1.5px] p-[22px] text-left shadow-card transition ${
                active ? "border-blue bg-blue-tint" : "border-transparent bg-surface"
              }`}
            >
              <div className="text-[13px] font-semibold text-muted">Em {months} meses</div>
              <div className="mt-2.5 text-[24px] font-extrabold tracking-[-0.02em]">
                R$ {fmt(value)}
              </div>
              <div className="mt-1 text-[12.5px] font-bold text-green-strong">{pct(value)}</div>
            </button>
          );
        })}
      </div>
    </>
  );
}
