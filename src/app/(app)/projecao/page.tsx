import { CloseMonthButton } from "@/components/projecao/close-month-button";
import { ProjectionPanel } from "@/components/projecao/projection-panel";
import { getAccounts } from "@/lib/data/accounts";
import { monthKey, netWorth } from "@/lib/data/finance";
import { getSnapshots } from "@/lib/data/snapshots";
import { fmtMonthLong } from "@/lib/format";

export const metadata = { title: "Projeção · Patrimônio" };

export default async function ProjecaoPage() {
  const [accounts, snapshots] = await Promise.all([getAccounts(), getSnapshots(12)]);

  const totals = netWorth(accounts);
  const currentMonth = monthKey(new Date());
  const alreadyClosed = snapshots.some((s) => s.month_date === currentMonth);

  // Histórico do gráfico: meses já fechados (o mês corrente entra pelo valor de hoje).
  const history = [
    ...snapshots.filter((s) => s.month_date !== currentMonth).map((s) => Number(s.net_worth)),
    totals.netWorth,
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Projeção</h1>
          <p className="mt-1 text-[14px] text-muted">Simule o crescimento do seu patrimônio</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <CloseMonthButton alreadyClosed={alreadyClosed} />
          <p className="text-[12px] text-muted">
            {alreadyClosed
              ? `${fmtMonthLong(currentMonth)} já fechado`
              : `Grava o snapshot de ${fmtMonthLong(currentMonth)}`}
          </p>
        </div>
      </div>

      <ProjectionPanel currentNetWorth={totals.netWorth} history={history} />
    </>
  );
}
