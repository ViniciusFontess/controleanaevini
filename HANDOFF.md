# Handoff — Patrimônio (controle de patrimônio pessoal)

## Objetivo
Transformar o protótipo visual `Patrimonio.dc.html` (gerado no Claude Design) em um
app **real e funcional**: Next.js + TypeScript + Tailwind, dados 100% vindos do
Supabase (nada mockado — nem os gráficos, nem os totais, nem as transações).

Requisitos completos do usuário (não resumir, seguir à risca):

> Este projeto é um app funcional de controle de patrimônio pessoal, não um
> protótipo estático. O arquivo `Patrimonio.dc.html` contém apenas a camada
> visual/HTML — a tarefa é transformar isso em uma aplicação real e operacional,
> conectada ao Supabase.
>
> - Todos os valores exibidos (patrimônio líquido, ativos, passivos, transações,
>   gráficos) devem vir do banco de dados real via Supabase, não de dados fixos.
> - Formulários de cadastro (contas, transações) devem gravar de verdade no Supabase.
> - Gráficos devem renderizar com dados reais das tabelas, não arrays hardcoded.
> - Cálculos (patrimônio líquido, sobra do mês, projeção) devem ser derivados dos
>   dados do banco, não escritos como texto estático.
>
> Stack: Next.js + TypeScript, Tailwind (portando os estilos do HTML). Supabase
> client para toda leitura/escrita. Tipos gerados via `supabase gen types typescript`.
>
> Funcionalidades mínimas:
> 1. Autenticação (Supabase Auth)
> 2. CRUD de contas (ativos e passivos) — refletindo em tempo real no patrimônio líquido
> 3. CRUD de transações (receitas/despesas) — refletindo no saldo do mês
> 4. Botão "fechar mês" que grava um snapshot em `snapshots`
> 5. Gráfico de evolução do patrimônio líquido puxando de `snapshots`
> 6. Cálculo de projeção (patrimônio atual + aporte mensal × juros compostos), dinâmico
>
> Referência visual: seguir fielmente layout, cores (pastel: azul, verde, coral,
> preto suave) e responsividade (mobile bottom bar / desktop sidebar) do
> `Patrimonio.dc.html`. A estética não muda — só a funcionalidade por trás.
>
> Testar persistência real a cada módulo: recarregar a página e confirmar que os
> dados vieram do Supabase, não de estado local perdido no refresh.

## Estado atual (o que já foi feito)

- **Supabase**: projeto `iotjvhvcanebowhdvxva` (region ca-central-1, Postgres 17).
  O schema descrito pelo usuário como "já criado" **não existia** — foi criado do
  zero via migration (ver abaixo). `get_advisors` (security) rodou limpo, sem
  findings.
- **Migration aplicada** (via MCP `apply_migration`, e salva em
  `supabase/migrations/20260801120000_init_patrimonio_schema.sql`):
  - `accounts(id, user_id, name, kind['asset'|'liability'], category, balance numeric(14,2), color, created_at)`
  - `transactions(id, user_id, description, category, amount numeric(14,2) — positivo=receita/negativo=despesa, occurred_on date, created_at)`
  - `snapshots(id, user_id, month_date date, total_assets, total_liabilities, net_worth, created_at, unique(user_id, month_date))`
  - `goals(id, user_id, name, target_amount, target_date, created_at)` — schema
    existe mas **não faz parte do escopo mínimo de UI**, não construir tela para
    ela a menos que o usuário peça.
  - RLS habilitado em todas, políticas `select/insert/update/delete` por
    `(select auth.uid()) = user_id`, `TO authenticated`. `snapshots` não tem policy
    de `update` (é um registro fechado, só select/insert/delete).
- **Tipos TS** gerados via MCP `generate_typescript_types` e salvos em
  `src/lib/supabase/database.types.ts`.
- **Next.js scaffold** (App Router, TS, Tailwind v4, `src/` dir, `@/*` alias) criado
  com `create-next-app` numa pasta temporária e mesclado na raiz do repo (não
  sobrescreveu `README.md`, `Patrimonio.dc.html`, `support.js`).
  - **Tailwind v4**: não há `tailwind.config.js` — tema é definido via `@theme`
    inline em `src/app/globals.css`. Ainda **não portei** a paleta pastel do
    design pra lá (ver "Próximos passos").
- **Supabase clients** (padrão `@supabase/ssr` para App Router):
  - `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
  - `src/lib/supabase/server.ts` — server client (`createServerClient`, async,
    usa `cookies()` do `next/headers`)
  - `src/lib/supabase/middleware.ts` — `updateSession()`: refresca sessão e
    redireciona não-autenticados para `/login` (exceto `/login` e `/signup`), e
    autenticados que acessam `/login`/`/signup` de volta pra `/`.
  - `src/middleware.ts` — chama `updateSession`, matcher exclui assets estáticos.
- **Env vars**: `.env.local` (gitignorado, `.env*` já está no `.gitignore` do
  scaffold) com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (chave `sb_publishable_...`, não a legacy anon nem a service_role — nunca usar
  service_role no client). `.env.example` criado com as chaves vazias, versionado.
- **Dependências instaladas**: `@supabase/supabase-js`, `@supabase/ssr`.
- **Ainda não instalado supabase CLI local** (`supabase --version` → not found).
  Todas as operações de schema foram feitas via MCP (`execute_sql`/`apply_migration`
  no project_id `iotjvhvcanebowhdvxva`). Se precisar rodar `supabase gen types`
  localmente, primeiro `npx supabase login` + `npx supabase link --project-ref
  iotjvhvcanebowhdvxva`.

### Auditoria: estático vs. dinâmico no `Patrimonio.dc.html`

| Elemento no Design | Hoje (estático) | Vira (dinâmico) |
|---|---|---|
| `nwSeries` (12 valores) | array hardcoded | `snapshots` do usuário, ordenado por `month_date` |
| `ativosData` / `passivosData` | arrays hardcoded | linhas de `accounts` (`kind='asset'`/`'liability'`) |
| `transData` | array hardcoded | linhas de `transactions`, filtradas por mês |
| `bars` (receitas/despesas 6 meses) | array hardcoded | agregação de `transactions` por mês (últimos 6) |
| `nwStr`, `ativosStr`, `passivosStr`, `sobraStr` | derivados de arrays fixos | somas calculadas a partir das queries reais |
| `donutChart`, `netWorthChart`, `barsChart`, `projChart` | SVG de dados fixos | mesma lógica de desenho SVG, alimentada por dados reais |
| `aporteMensal` (slider) | state local — OK, mantém | mesma coisa, mas a série `fut` parte do net worth real |
| `proj6/12/24` | projeção sobre array fixo | juros compostos sobre patrimônio real + aporte |
| `mesAtual` | texto fixo | mês corrente real (`new Date()`) |
| Layout, cores, grid, responsividade, nav | 100% estático | fica igual — só migra o CSS pra Tailwind |
| Auth, formulários de cadastro | inexistente | login/signup, forms de conta/transação, botão "fechar mês" |

O template original usa uma sintaxe própria do Claude Design (`x-dc`, `sc-for`,
`{{ }}`, `support.js` como runtime React sem build). **Isso não é o formato final**
— é só a referência visual. No app real, vira JSX normal com `.map()`, sem
`support.js`, sem `<x-dc>`. `support.js` e `Patrimonio.dc.html` continuam no repo
como referência de design, mas não são importados pelo app Next.js.

## Próximos passos (nessa ordem)

1. **Tema Tailwind** — portar pra `src/app/globals.css` (`@theme inline`) a
   paleta pastel do design: azul `#7BA8E8`/`#5B8FD9`/`#9BC0F0`, verde
   `#8FD4A8`/`#3B9A5F`, coral `#F2A0A0`/`#D45B5B`, preto suave `#1A1F2B`, bg
   `#F7F9FC`, cinza texto `#8A93A6`, borda `#EDF1F7`/`#F0F3F8`/`#E4EAF3`, fonte
   Inter (usar `next/font/google` em vez do link do `<head>` do HTML original).
2. **Auth** — páginas `/login` e `/signup` (Server Actions chamando
   `supabase.auth.signInWithPassword` / `signUp`), botão de logout (Server
   Action `signOut`). Atenção: se confirmação de e-mail estiver ativa no projeto,
   `signUp` não retorna sessão imediata — tratar esse caso (mensagem "verifique
   seu e-mail") em vez de assumir login automático.
3. **App shell** — sidebar (desktop, `md:`/`lg:` breakpoints) + bottombar
   (mobile) igual ao HTML, com Server Component de layout autenticado em
   `src/app/(app)/layout.tsx` (route group) que busca o usuário e redireciona se
   não autenticado (redundante com o middleware, mas necessário pro layout saber
   quem é o usuário pra mostrar dados).
4. **Camada de dados** (`src/lib/data/*.ts`): funções server-side (usar
   `src/lib/supabase/server.ts`) para:
   - `getAccounts(userId)`, `createAccount`, `updateAccount`, `deleteAccount`
   - `getTransactions(userId, {month?, category?})`, `createTransaction`, `deleteTransaction`
   - `getSnapshots(userId, limit=12)`, `createSnapshotForCurrentMonth` (soma
     accounts atuais e faz upsert em `snapshots` pro mês corrente — respeitar o
     `unique(user_id, month_date)`)
   - funções puras de cálculo (sem I/O, fáceis de testar): `netWorth(accounts)`,
     `monthSummary(transactions)` (entradas/saídas/saldo), `projectCompound(currentNetWorth, monthlyContribution, months, monthlyRate=0.003)`
     — **essas são a lógica financeira crítica, escrever um self-check simples**
     (`node --test` embutido, sem framework) cobrindo pelo menos: net worth com
     ativos e passivos, projeção com aporte 0 (deve só compor juros) e com aporte
     >0.
5. **Tela Dashboard** (`/`) — hero de patrimônio líquido, cards de resumo, os
   dois gráficos (evolução via `snapshots`, receitas x despesas via
   `transactions` últimos 6 meses agrupados por mês). Empty state decente pra
   usuário novo sem dados (não pode quebrar com arrays vazios — `Math.max(...[])`
   etc. precisam de guarda).
6. **Tela Patrimônio** (`/patrimonio`) — lista de contas (ativos/passivos) com
   CRUD (modal ou seção inline de form), donut chart real, barras de proporção
   reais.
7. **Tela Fluxo** (`/fluxo`) — lista de transações com chips de filtro por
   categoria (categorias vêm das transações existentes do usuário, não uma
   lista fixa), form de nova transação, saldo/entradas/saídas do mês corrente.
8. **Tela Projeção** (`/projecao`) — slider de aporte (client component,
   `'use client'`), projeção calculada com `projectCompound` a partir do net
   worth real; botão "Fechar mês" chama `createSnapshotForCurrentMonth` e dá
   feedback visual.
9. **Verificação de persistência** — depois de cada módulo, rodar `npm run dev`,
   criar dado, dar refresh (F5) na página e confirmar que sumiu do estado do
   React mas continua vindo do Supabase (ou seja: os dados sobrevivem ao reload
   porque vêm do banco, não de `useState` inicial).
10. Rodar `npm run lint` e `npm run build` no final pra garantir que não há
    erros de tipo/lint antes de considerar pronto.

## Task list (recriar com TaskCreate na nova sessão)

1. ~~Configure Supabase env vars and clients~~ — feito
2. ~~Generate Supabase TS types~~ — feito
3. Auth pages (login/signup/logout) — **em andamento, retomar daqui**
4. Tailwind theme + app shell
5. Data layer: queries, mutations, finance calc utils (+ self-check)
6. Dashboard screen (real data)
7. Patrimonio screen: accounts CRUD + donut
8. Fluxo screen: transactions CRUD + filters
9. Projecao screen + fechar mês
10. End-to-end persistence verification (+ `npm run lint` / `npm run build`)

## Referências úteis

- Projeto Supabase: `iotjvhvcanebowhdvxva` (usar MCP Supabase tools, ou
  `npx supabase login && npx supabase link --project-ref iotjvhvcanebowhdvxva`
  se precisar do CLI local).
- Design original (só visual, não copiar a sintaxe `x-dc`): `Patrimonio.dc.html`,
  `support.js`.
- `.env.example` tem as chaves necessárias; `.env.local` já está preenchido
  localmente (não versionado).
