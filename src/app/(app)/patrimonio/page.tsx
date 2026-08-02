import { DonutChart } from "@/components/charts/donut-chart";
import { AccountRow } from "@/components/patrimonio/account-row";
import { NewAccountPanel } from "@/components/patrimonio/account-form";
import { Card, Dot } from "@/components/ui/card";
import { accountColor, getAccounts, splitAccounts, type Account } from "@/lib/data/accounts";
import { getOpenInvoiceByCard } from "@/lib/data/cashflow";
import { netWorth } from "@/lib/data/finance";
import { fmt } from "@/lib/format";

export const metadata = { title: "Patrimônio · Patrimônio" };

export default async function PatrimonioPage() {
  const [accounts, invoiceByCard] = await Promise.all([
    getAccounts(),
    getOpenInvoiceByCard(),
  ]);

  const { assets, liabilities, cards } = splitAccounts(accounts);
  const openInvoices = [...invoiceByCard.values()].reduce((sum, v) => sum + v, 0);
  const totals = netWorth(accounts, openInvoices);

  // O cartão entra em Passivos pela fatura em aberto, não pela coluna balance.
  const liabilityRows = [
    ...liabilities.map((account) => ({ account, value: Number(account.balance) })),
    ...cards.map((account) => ({ account, value: invoiceByCard.get(account.id) ?? 0 })),
  ].sort((a, b) => b.value - a.value);

  const segments = assets
    .filter((a) => Number(a.balance) > 0)
    .map((a, i) => ({
      label: a.name,
      value: Number(a.balance),
      color: accountColor(a, i),
    }));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Patrimônio</h1>
          <p className="mt-1 text-[14px] text-muted">Composição dos seus ativos e passivos</p>
        </div>
        <NewAccountPanel />
      </div>

      <Card className="mb-4">
        <div className="mb-[18px] text-[15px] font-bold">Composição dos ativos</div>
        <div className="flex flex-col items-center gap-[18px] md:flex-row md:items-center md:justify-between">
          <div className="w-[210px] flex-none">
            <DonutChart segments={segments} />
          </div>
          <div className="flex w-full flex-1 flex-col gap-3">
            {segments.length === 0 ? (
              <p className="text-[13.5px] text-muted">
                Nenhum ativo cadastrado ainda. Use “Nova conta” para adicionar o primeiro.
              </p>
            ) : (
              segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-3">
                  <span
                    className="size-[11px] flex-none rounded-[4px]"
                    style={{ background: segment.color }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-[14px] font-semibold">{segment.label}</span>
                  <span className="text-[13px] font-semibold text-muted">
                    {((segment.value / totals.totalAssets) * 100).toFixed(0)}%
                  </span>
                  <span className="min-w-[96px] text-right text-[14px] font-bold">
                    R$ {fmt(segment.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AccountList
          title="Ativos"
          dotColor="#7BA8E8"
          total={totals.totalAssets}
          accounts={assets}
          emptyMessage="Nenhum ativo cadastrado."
        />
        <LiabilityList
          total={totals.totalLiabilities + openInvoices}
          rows={liabilityRows}
        />
      </div>
    </>
  );
}

function AccountList({
  title,
  dotColor,
  total,
  totalClassName = "",
  accounts,
  emptyMessage,
}: {
  title: string;
  dotColor: string;
  total: number;
  totalClassName?: string;
  accounts: Account[];
  emptyMessage: string;
}) {
  // Guarda para lista vazia: Math.max(...[]) devolveria -Infinity.
  const maxBalance = accounts.length > 0 ? Math.max(...accounts.map((a) => Number(a.balance))) : 0;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[15px] font-bold">
          <Dot color={dotColor} />
          {title}
        </div>
        <div className={`text-[15px] font-extrabold ${totalClassName}`}>R$ {fmt(total)}</div>
      </div>

      {accounts.length === 0 ? (
        <p className="border-t border-line-soft pt-3 text-[13.5px] text-muted">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              barPercent={maxBalance > 0 ? (Number(account.balance) / maxBalance) * 100 : 0}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Passivos mistura duas coisas com valores de origem diferente: dívidas comuns,
 * cujo saldo é digitado, e cartões, cuja "dívida" é a fatura calculada a partir
 * das compras. Por isso não reaproveita AccountList.
 */
function LiabilityList({
  total,
  rows,
}: {
  total: number;
  rows: { account: Account; value: number }[];
}) {
  const maxValue = rows.length > 0 ? Math.max(...rows.map((r) => r.value)) : 0;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[15px] font-bold">
          <Dot color="#F2A0A0" />
          Passivos
        </div>
        <div className="text-[15px] font-extrabold text-coral-strong">R$ {fmt(total)}</div>
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-line-soft pt-3 text-[13.5px] text-muted">
          Nenhum passivo cadastrado.
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map(({ account, value }) =>
            account.kind === "credit_card" ? (
              <div key={account.id} className="border-t border-line-soft py-3">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px] font-semibold">{account.name}</div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      Fatura em aberto · fecha dia {account.closing_day}, vence dia{" "}
                      {account.due_day}
                    </div>
                  </div>
                  <div className="text-[15px] font-bold whitespace-nowrap text-coral-strong">
                    R$ {fmt(value)}
                  </div>
                </div>
                <div className="mt-2.5 h-[5px] overflow-hidden rounded-[5px] bg-line-soft">
                  <div
                    className="h-full rounded-[5px] bg-coral"
                    style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <AccountRow
                key={account.id}
                account={account}
                barPercent={maxValue > 0 ? (value / maxValue) * 100 : 0}
              />
            ),
          )}
        </div>
      )}
    </Card>
  );
}
