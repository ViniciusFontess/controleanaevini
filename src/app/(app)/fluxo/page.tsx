import Link from "next/link";
import { NewTransactionPanel } from "@/components/fluxo/transaction-form";
import { QuickEntry } from "@/components/fluxo/quick-entry";
import { TransactionActions } from "@/components/fluxo/transaction-actions";
import { EditableTransaction } from "@/components/fluxo/editable-transaction";
import { Card } from "@/components/ui/card";
import { getAccounts } from "@/lib/data/accounts";
import { isoDate, monthKey, monthSummary } from "@/lib/data/finance";
import { categoriesOf, getTransactions } from "@/lib/data/transactions";
import { fmt, fmtDayMonth, fmtMonthLong } from "@/lib/format";

export const metadata = { title: "Fluxo de caixa · Patrimônio" };

export default async function FluxoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const now = new Date();

  // Totais do mês são sempre do mês inteiro; o filtro só afeta a lista.
  const [monthTransactions, accounts] = await Promise.all([
    getTransactions({ month: now }),
    getAccounts(),
  ]);

  const summary = monthSummary(monthTransactions);
  const categories = categoriesOf(monthTransactions);

  const payableAccounts = accounts
    .filter((a) => a.kind !== "liability")
    .map((a) => ({ id: a.id, name: a.name, isCard: a.kind === "credit_card" }));

  // O lançamento rápido repete a última receita registrada — na prática, a venda
  // do dia. Sem nenhuma receita ainda, não há o que repetir e ele não aparece.
  const lastIncome = monthTransactions.find((t) => Number(t.amount) > 0);

  const activeCategory = categoria && categories.includes(categoria) ? categoria : null;
  const visible = activeCategory
    ? monthTransactions.filter((t) => t.category === activeCategory)
    : monthTransactions;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Fluxo de caixa</h1>
          <p className="mt-1 text-[14px] text-muted">{fmtMonthLong(monthKey(now))}</p>
        </div>
        <NewTransactionPanel
          today={isoDate(now)}
          knownCategories={categories}
          accounts={payableAccounts}
        />
      </div>

      <Card className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-muted">Saldo do mês</div>
          <div
            className={`mt-1 text-[32px] font-extrabold tracking-[-0.02em] ${
              summary.saldo >= 0 ? "text-green-strong" : "text-coral-strong"
            }`}
          >
            {summary.saldo >= 0 ? "+" : "−"}R$ {fmt(Math.abs(summary.saldo))}
          </div>
        </div>
        <div className="flex gap-[22px]">
          <div>
            <div className="text-[12px] font-semibold text-muted">Entradas</div>
            <div className="mt-0.5 text-[18px] font-bold text-green-strong">
              R$ {fmt(summary.entradas)}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-muted">Saídas</div>
            <div className="mt-0.5 text-[18px] font-bold text-coral-strong">
              R$ {fmt(summary.saidas)}
            </div>
          </div>
        </div>
      </Card>

      {lastIncome ? (
        <QuickEntry
          today={isoDate(now)}
          defaultCategory={lastIncome.category}
          defaultDescription={lastIncome.description}
        />
      ) : null}

      {categories.length > 0 ? (
        <div className="mb-1.5 flex gap-2 overflow-x-auto pb-3">
          <CategoryChip label="Todos" href="/fluxo" active={activeCategory === null} />
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              href={`/fluxo?categoria=${encodeURIComponent(category)}`}
              active={activeCategory === category}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {visible.length === 0 ? (
          <Card>
            <p className="text-[13.5px] text-muted">
              {monthTransactions.length === 0
                ? "Nenhuma transação neste mês ainda. Use “Nova transação” para registrar a primeira."
                : "Nenhuma transação nessa categoria."}
            </p>
          </Card>
        ) : (
          visible.map((transaction) => {
            const isIncome = Number(transaction.amount) >= 0;
            return (
              <Card key={transaction.id} className="flex items-center gap-3.5 px-4 py-3.5">
                <EditableTransaction
                  transaction={{
                    id: transaction.id,
                    description: transaction.description,
                    category: transaction.category,
                    amount: Number(transaction.amount),
                    occurredOn: transaction.occurred_on,
                    accountId: transaction.account_id,
                    installmentLabel:
                      transaction.installment_number && transaction.installment_total
                        ? `${transaction.installment_number}/${transaction.installment_total}`
                        : null,
                  }}
                  accounts={payableAccounts}
                  renderActions={(startEditing) => (
                    <TransactionActions
                      id={transaction.id}
                      description={transaction.description}
                      isFixed={transaction.recurrence_id !== null}
                      isInstallment={transaction.installment_group !== null}
                      onEdit={startEditing}
                    />
                  )}
                >
                  <div
                    className={`flex size-11 flex-none items-center justify-center rounded-[13px] text-[16px] font-extrabold ${
                      isIncome
                        ? "bg-green-soft text-green-strong"
                        : "bg-coral-soft text-coral-strong"
                    }`}
                    aria-hidden="true"
                  >
                    {transaction.category.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold">
                      {transaction.description}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {transaction.category} · {fmtDayMonth(transaction.occurred_on)}
                      {transaction.cash_date !== transaction.occurred_on
                        ? ` · sai ${fmtDayMonth(transaction.cash_date)}`
                        : ""}
                    </div>
                  </div>

                  <div
                    className={`text-[15.5px] font-bold whitespace-nowrap ${
                      isIncome ? "text-green-strong" : "text-coral-strong"
                    }`}
                  >
                    {isIncome ? "+" : "−"}R$ {fmt(Math.abs(Number(transaction.amount)))}
                  </div>
                </EditableTransaction>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}

function CategoryChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex-none rounded-full border px-[15px] py-2.5 text-[13px] font-semibold whitespace-nowrap transition ${
        active
          ? "border-blue bg-blue text-white"
          : "border-line-strong bg-white text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
