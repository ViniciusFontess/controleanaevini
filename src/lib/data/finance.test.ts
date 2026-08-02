import assert from "node:assert/strict";
import test from "node:test";
import {
  cashDateFor,
  clampDay,
  installmentPlan,
  monthKey,
  monthRange,
  monthSummary,
  monthlyFlow,
  netWorth,
  projectCompound,
} from "./finance.ts";

test("netWorth subtrai passivos dos ativos", () => {
  const totals = netWorth([
    { kind: "asset", balance: 180000 },
    { kind: "asset", balance: 92000 },
    { kind: "liability", balance: 42000 },
    { kind: "liability", balance: 6350 },
  ]);

  assert.equal(totals.totalAssets, 272000);
  assert.equal(totals.totalLiabilities, 48350);
  assert.equal(totals.netWorth, 223650);
});

test("netWorth com lista vazia devolve zeros", () => {
  assert.deepEqual(netWorth([]), { totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
});

test("netWorth de quem só tem passivo fica negativo", () => {
  assert.equal(netWorth([{ kind: "liability", balance: 5000 }]).netWorth, -5000);
});

test("monthSummary separa entradas de saídas", () => {
  const summary = monthSummary([
    { amount: 8500, occurred_on: "2026-08-01" },
    { amount: 2700, occurred_on: "2026-08-12" },
    { amount: -2200, occurred_on: "2026-08-05" },
    { amount: -980, occurred_on: "2026-08-08" },
  ]);

  assert.equal(summary.entradas, 11200);
  assert.equal(summary.saidas, 3180);
  assert.equal(summary.saldo, 8020);
});

test("monthSummary com lista vazia devolve zeros", () => {
  assert.deepEqual(monthSummary([]), { entradas: 0, saidas: 0, saldo: 0 });
});

test("projectCompound com aporte 0 só compõe juros", () => {
  const series = projectCompound(1000, 0, 3, 0.01);

  assert.equal(series.length, 3);
  assert.ok(Math.abs(series[0] - 1010) < 1e-9);
  assert.ok(Math.abs(series[1] - 1020.1) < 1e-9);
  assert.ok(Math.abs(series[2] - 1030.301) < 1e-9);
});

test("projectCompound com aporte > 0 soma o aporte a cada mês", () => {
  const series = projectCompound(1000, 100, 2, 0.01);

  // mês 1: 1000*1.01 + 100 = 1110 ; mês 2: 1110*1.01 + 100 = 1221.1
  assert.ok(Math.abs(series[0] - 1110) < 1e-9);
  assert.ok(Math.abs(series[1] - 1221.1) < 1e-9);
});

test("projectCompound sem patrimônio inicial acumula só os aportes com juros", () => {
  const series = projectCompound(0, 500, 2, 0);
  assert.deepEqual(series, [500, 1000]);
});

test("projectCompound com 0 meses devolve série vazia", () => {
  assert.deepEqual(projectCompound(1000, 100, 0), []);
});

test("monthlyFlow preenche meses sem movimento com zero", () => {
  const flow = monthlyFlow(
    [
      { amount: 1000, occurred_on: "2026-08-10" },
      { amount: -400, occurred_on: "2026-08-20" },
      { amount: 250, occurred_on: "2026-06-02" },
      // fora da janela de 3 meses: deve ser ignorada
      { amount: 9999, occurred_on: "2026-01-15" },
    ],
    3,
    new Date(Date.UTC(2026, 7, 15)),
  );

  assert.deepEqual(flow, [
    { month: "2026-06-01", entradas: 250, saidas: 0 },
    { month: "2026-07-01", entradas: 0, saidas: 0 },
    { month: "2026-08-01", entradas: 1000, saidas: 400 },
  ]);
});

test("monthKey e monthRange usam UTC e viram o ano corretamente", () => {
  assert.equal(monthKey(new Date(Date.UTC(2026, 0, 31))), "2026-01-01");
  assert.deepEqual(monthRange(new Date(Date.UTC(2026, 1, 10))), {
    start: "2026-02-01",
    end: "2026-02-28",
  });
  assert.deepEqual(monthRange(new Date(Date.UTC(2026, 11, 5))), {
    start: "2026-12-01",
    end: "2026-12-31",
  });
});

// ---------- ciclo da fatura ----------

test("clampDay encurta o dia para o último do mês", () => {
  assert.equal(clampDay(2026, 1, 31), 28); // fevereiro/2026
  assert.equal(clampDay(2024, 1, 31), 29); // bissexto
  assert.equal(clampDay(2026, 3, 31), 30); // abril
  assert.equal(clampDay(2026, 0, 15), 15);
});

test("cashDateFor: compra até o fechamento vence no mesmo mês", () => {
  // cartão do usuário: fecha 18, vence 25
  assert.equal(cashDateFor("2026-10-05", 18, 25), "2026-10-25");
  assert.equal(cashDateFor("2026-10-18", 18, 25), "2026-10-25");
});

test("cashDateFor: compra após o fechamento pula para a fatura seguinte", () => {
  assert.equal(cashDateFor("2026-10-19", 18, 25), "2026-11-25");
  assert.equal(cashDateFor("2026-10-31", 18, 25), "2026-11-25");
});

test("cashDateFor vira o ano", () => {
  assert.equal(cashDateFor("2026-12-20", 18, 25), "2027-01-25");
});

test("cashDateFor com vencimento antes do fechamento cai no mês seguinte", () => {
  // fecha 28, vence 5
  assert.equal(cashDateFor("2026-10-10", 28, 5), "2026-11-05");
  assert.equal(cashDateFor("2026-10-29", 28, 5), "2026-12-05");
});

test("cashDateFor encurta vencimento em mês curto", () => {
  assert.equal(cashDateFor("2026-01-20", 18, 31), "2026-02-28");
});

// ---------- parcelamento ----------

test("installmentPlan divide igual quando não há sobra", () => {
  const plan = installmentPlan(1200, 12, "2026-10-19", "2026-11-25");
  assert.equal(plan.length, 12);
  assert.ok(plan.every((p) => p.amount === 100));
  assert.equal(plan[0].cashDate, "2026-11-25");
  assert.equal(plan[11].cashDate, "2027-10-25");
});

test("installmentPlan espalha a competência um mês por parcela", () => {
  const plan = installmentPlan(1200, 3, "2026-10-19", "2026-11-25");
  assert.deepEqual(
    plan.map((p) => p.occurredOn),
    ["2026-10-19", "2026-11-19", "2026-12-19"],
  );
});

test("installmentPlan põe a sobra de centavos na primeira parcela", () => {
  const plan = installmentPlan(1000, 3, "2026-10-05", "2026-10-25");
  assert.deepEqual(
    plan.map((p) => p.amount),
    [333.34, 333.33, 333.33],
  );
  assert.equal(
    plan.reduce((s, p) => s + p.amount, 0),
    1000,
  );
});

test("installmentPlan encurta o dia em mês curto, nas duas datas", () => {
  const plan = installmentPlan(300, 3, "2026-12-31", "2026-12-31");
  assert.deepEqual(
    plan.map((p) => p.cashDate),
    ["2026-12-31", "2027-01-31", "2027-02-28"],
  );
  assert.deepEqual(
    plan.map((p) => p.occurredOn),
    ["2026-12-31", "2027-01-31", "2027-02-28"],
  );
});

test("installmentPlan recusa contagem inválida", () => {
  assert.throws(() => installmentPlan(100, 1, "2026-10-05", "2026-10-25"));
  assert.throws(() => installmentPlan(100, 0, "2026-10-05", "2026-10-25"));
});
