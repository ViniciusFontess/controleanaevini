import Link from "next/link";
import { FlowBarsChart } from "@/components/charts/flow-bars-chart";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { Card, Dot } from "@/components/ui/card";
import { getAccounts, splitAccounts } from "@/lib/data/accounts";
import { monthKey, monthlyFlow, monthSummary, netWorth } from "@/lib/data/finance";
import { getSnapshots } from "@/lib/data/snapshots";
import { getTransactions } from "@/lib/data/transactions";
import { fmt, fmtMonthLong } from "@/lib/format";

export const metadata = { title: "Dashboard · Patrimônio" };

export default async function DashboardPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [accounts, snapshots, recentTransactions, monthTransactions] = await Promise.all([
    getAccounts(),
    getSnapshots(12),
    getTransactions({ since: monthKey(sixMonthsAgo) }),
    getTransactions({ month: now }),
  ]);

  const totals = netWorth(accounts);
  const { assets, liabilities } = splitAccounts(accounts);
  const summary = monthSummary(monthTransactions);
  const flow = monthlyFlow(recentTransactions, 6, now);

  // Série do gráfico: snapshots fechados + o valor de hoje, se o mês ainda não fechou.
  const currentMonth = monthKey(now);
  const hasCurrentSnapshot = snapshots.some((s) => s.month_date === currentMonth);
  const series = [
    ...snapshots.map((s) => ({ month: s.month_date, value: Number(s.net_worth) })),
    ...(hasCurrentSnapshot || accounts.length === 0
      ? []
      : [{ month: currentMonth, value: totals.netWorth }]),
  ];

  // Variação: patrimônio de hoje contra o último mês fechado.
  const lastClosed = snapshots.filter((s) => s.month_date !== currentMonth).at(-1);
  const changeAbs = lastClosed ? totals.netWorth - Number(lastClosed.net_worth) : null;
  const changePct =
    lastClosed && Number(lastClosed.net_worth) !== 0
      ? (changeAbs! / Math.abs(Number(lastClosed.net_worth))) * 100
      : null;
  const isUp = (changeAbs ?? 0) >= 0;

  return (
    <>
      <div className="mb-[22px]">
        <div className="text-[13px] font-medium text-muted">Bom te ver de novo</div>
        <div className="mt-0.5 text-[13px] font-medium text-muted">{fmtMonthLong(currentMonth)}</div>
      </div>

      <Card className="mb-4 bg-[linear-gradient(160deg,#fff,#FBFCFE)] px-[26px] py-[30px]">
        <div className="text-[13px] font-semibold tracking-[0.01em] text-muted">
          Patrimônio líquido
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="text-[20px] font-semibold text-muted">R$</span>
          <span className="text-[52px] leading-none font-extrabold tracking-[-0.03em]">
            {fmt(totals.netWorth)}
          </span>
        </div>

        {changeAbs !== null ? (
          <div
            className={`mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] font-bold ${
              isUp ? "bg-green-soft text-green-strong" : "bg-coral-soft text-coral-strong"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={isUp ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
            </svg>
            <span>
              {changePct !== null ? `${isUp ? "+" : "−"}${Math.abs(changePct).toFixed(1)}% · ` : ""}
              {isUp ? "+" : "−"}R$ {fmt(Math.abs(changeAbs))} desde o último fechamento
            </span>
          </div>
        ) : (
          <p className="mt-3.5 text-[13px] text-muted">
            {accounts.length === 0 ? (
              <>
                Nenhuma conta cadastrada ainda —{" "}
                <Link href="/patrimonio" className="font-semibold text-blue-strong">
                  comece pelo Patrimônio
                </Link>
                .
              </>
            ) : (
              <>
                Sem fechamento anterior para comparar. Use{" "}
                <Link href="/projecao" className="font-semibold text-blue-strong">
                  “Fechar mês”
                </Link>{" "}
                para começar o histórico.
              </>
            )}
          </p>
        )}
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-muted">
            <Dot color="#7BA8E8" />
            Total de ativos
          </div>
          <div className="mt-3 text-[27px] font-extrabold tracking-[-0.02em]">
            R$ {fmt(totals.totalAssets)}
          </div>
          <div className="mt-1 text-[12.5px] text-muted">
            {assets.length} {assets.length === 1 ? "item" : "itens"}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-muted">
            <Dot color="#F2A0A0" />
            Total de passivos
          </div>
          <div className="mt-3 text-[27px] font-extrabold tracking-[-0.02em] text-coral-strong">
            R$ {fmt(totals.totalLiabilities)}
          </div>
          <div className="mt-1 text-[12.5px] text-muted">
            {liabilities.length} {liabilities.length === 1 ? "item" : "itens"}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-muted">
            <Dot color="#8FD4A8" />
            Sobra do mês
          </div>
          <div
            className={`mt-3 text-[27px] font-extrabold tracking-[-0.02em] ${
              summary.saldo >= 0 ? "text-green-strong" : "text-coral-strong"
            }`}
          >
            {summary.saldo >= 0 ? "+" : "−"}R$ {fmt(Math.abs(summary.saldo))}
          </div>
          <div className="mt-1 text-[12.5px] text-muted">receitas − despesas</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-[15px] font-bold">Evolução do patrimônio</div>
            <div className="text-[12px] font-semibold text-muted">
              {series.length > 1 ? `${series.length} meses` : "12 meses"}
            </div>
          </div>
          <div className="min-h-[200px]">
            <NetWorthChart points={series} />
          </div>
        </Card>

        <Card>
          <div className="mb-1.5 text-[15px] font-bold">Receitas vs despesas</div>
          <div className="my-1 mb-2 flex gap-4">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
              <Dot color="#8FD4A8" />
              Receitas
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
              <Dot color="#F2A0A0" />
              Despesas
            </div>
          </div>
          <div className="min-h-[200px]">
            <FlowBarsChart data={flow} />
          </div>
        </Card>
      </div>
    </>
  );
}
