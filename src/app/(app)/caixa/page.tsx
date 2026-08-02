import Link from "next/link";
import { ConfirmOccurrence } from "@/components/caixa/confirm-occurrence";
import { Card } from "@/components/ui/card";
import { RecurrencePanel } from "@/components/caixa/recurrence-panel";
import { getCashflow } from "@/lib/data/cashflow";
import { getRecurrences } from "@/lib/data/recurrences";
import { getAccounts, hasLiquidAccount, splitAccounts } from "@/lib/data/accounts";
import { fmt, fmtDayMonth } from "@/lib/format";

export const metadata = { title: "Caixa · Patrimônio" };

export default async function CaixaPage() {
  const [cashflow, accounts, recurrences] = await Promise.all([
    getCashflow(60),
    getAccounts(),
    getRecurrences(),
  ]);
  const { cards } = splitAccounts(accounts);

  const pendingByDate = new Map<string, typeof cashflow.pending>();
  for (const occurrence of cashflow.pending) {
    pendingByDate.set(occurrence.date, [...(pendingByDate.get(occurrence.date) ?? []), occurrence]);
  }

  // Dias de vencimento de fatura, para destacar na linha do tempo.
  const dueDays = new Set(cards.map((card) => card.due_day));

  const activeDays = cashflow.days.filter(
    (day) => day.entradas > 0 || day.saidas > 0 || pendingByDate.has(day.date),
  );
  const lowestBalance = cashflow.days.reduce(
    (min, day) => Math.min(min, day.balance),
    cashflow.openingBalance,
  );

  if (accounts.length === 0) {
    return (
      <>
        <Header />
        <Card>
          <p className="text-[13.5px] text-muted">
            Cadastre suas contas em{" "}
            <Link href="/patrimonio" className="font-semibold text-blue-strong">
              Patrimônio
            </Link>{" "}
            para o caixa saber de onde parte o saldo.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header />

      {!hasLiquidAccount(accounts) ? (
        <Card className="mb-4 border-l-4 border-blue">
          <p className="text-[13.5px] leading-[1.6] text-muted">
            <span className="font-bold text-ink">O caixa está partindo de R$ 0.</span> Suas contas
            cadastradas são investimento, e investimento não é dinheiro disponível. Cadastre sua
            conta corrente em{" "}
            <Link href="/patrimonio" className="font-semibold text-blue-strong">
              Patrimônio
            </Link>{" "}
            marcando <em>“é dinheiro disponível”</em> para a projeção abaixo fazer sentido.
          </p>
        </Card>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <Card>
          <div className="text-[13px] font-semibold text-muted">Saldo em conta hoje</div>
          <div className="mt-2 text-[32px] font-extrabold tracking-[-0.02em]">
            R$ {fmt(cashflow.openingBalance)}
          </div>
          <div className="mt-1 text-[12.5px] text-muted">só contas marcadas como disponíveis</div>
        </Card>
        <Card>
          <div className="text-[13px] font-semibold text-muted">Menor saldo nos 60 dias</div>
          <div
            className={`mt-2 text-[32px] font-extrabold tracking-[-0.02em] ${
              lowestBalance < 0 ? "text-coral-strong" : "text-green-strong"
            }`}
          >
            {lowestBalance < 0 ? "−" : ""}R$ {fmt(Math.abs(lowestBalance))}
          </div>
          <div className="mt-1 text-[12.5px] text-muted">
            {lowestBalance < 0
              ? "o dinheiro não cobre o período — veja onde abaixo"
              : "o saldo se mantém positivo no período"}
          </div>
        </Card>
      </div>

      <RecurrencePanel recurrences={recurrences} />

      {activeDays.length === 0 ? (
        <Card>
          <p className="text-[13.5px] text-muted">
            Nenhum movimento previsto nos próximos 60 dias. Lance uma compra em{" "}
            <Link href="/fluxo" className="font-semibold text-blue-strong">
              Fluxo
            </Link>{" "}
            ou cadastre uma renda recorrente para o caixa ganhar linha do tempo.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {activeDays.map((day) => {
            const pending = pendingByDate.get(day.date) ?? [];
            const isDueDay = dueDays.has(Number(day.date.slice(8, 10)));

            return (
              <Card
                key={day.date}
                className={`px-4 py-3.5 ${isDueDay ? "border-l-4 border-coral" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[14px] font-bold">{fmtDayMonth(day.date)}</span>
                    {isDueDay ? (
                      <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-bold text-coral-strong">
                        vence a fatura
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4 text-[13px]">
                    {day.entradas > 0 ? (
                      <span className="font-bold text-green-strong">+R$ {fmt(day.entradas)}</span>
                    ) : null}
                    {day.saidas > 0 ? (
                      <span className="font-bold text-coral-strong">−R$ {fmt(day.saidas)}</span>
                    ) : null}
                    <span
                      className={`font-extrabold ${
                        day.balance < 0 ? "text-coral-strong" : "text-ink"
                      }`}
                    >
                      {day.balance < 0 ? "−" : ""}R$ {fmt(Math.abs(day.balance))}
                    </span>
                  </div>
                </div>

                {pending.map((occurrence) => (
                  <div
                    key={`${occurrence.recurrenceId}-${occurrence.date}`}
                    className="mt-2.5 flex items-center justify-between gap-3 border-t border-line-soft pt-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold text-muted">
                        {occurrence.name}
                      </div>
                      <div className="text-[11.5px] text-muted">
                        previsto · {occurrence.category}
                      </div>
                    </div>
                    <span
                      className={`text-[13.5px] font-bold ${
                        occurrence.amount >= 0 ? "text-green-strong" : "text-coral-strong"
                      }`}
                    >
                      {occurrence.amount >= 0 ? "+" : "−"}R$ {fmt(Math.abs(occurrence.amount))}
                    </span>
                    <ConfirmOccurrence
                      recurrenceId={occurrence.recurrenceId}
                      date={occurrence.date}
                    />
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Header() {
  return (
    <div className="mb-5">
      <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Caixa</h1>
      <p className="mt-1 text-[14px] text-muted">
        Quando o dinheiro entra e sai de verdade, nos próximos 60 dias
      </p>
    </div>
  );
}
