# Tema visual "casal aconchegante"

Data: 2026-08-02
Status: aprovado pelo usuário

## Problema

O app hoje é visualmente correto mas genérico — nada nele comunica que é o
app financeiro de um casal específico. O usuário pediu pra deixar "com cara
de casal", mais aconchegante, usando fotos reais do casal, com favicon
próprio, e explicitamente pediu pra passar pelo processo de brainstorm antes
de implementar.

## Decisões tomadas

Cada uma foi confirmada com o usuário (duas perguntas via terminal + preview
visual ao vivo em localhost antes da aprovação final).

| # | Decisão | Alternativa recusada | Por quê |
|---|---|---|---|
| 1 | Fundo com foto em todas as telas do app (não só login) | Só login/cadastro; ou hero grande só no dashboard | Usuário escolheu explicitamente "fundo sutil no app inteiro" na pergunta de placement |
| 2 | Uma foto fixa (a da praia, mais céu/respiro) | Alternar entre as 3 fotos por sessão | Usuário escolheu "foto fixa" — visual previsível, menos estado pra gerenciar |
| 3 | Opacidade bem baixa ("bem clarinha") | Versão mais "presente" (~32%) mostrada no preview | Usuário pediu explicitamente clarinha, mesmo sem conseguir confirmar visualmente no preview local (limitação do preview, não da decisão) |
| 4 | Paleta de cores existente mantida (azul/verde/coral pastel) | Recolorir o app pro tema do casal | Já implementada e testada em ~15 componentes; o pedido foi "aconchegante", não "trocar identidade" |
| 5 | Playfair Display como fonte de acento, só em 3 pontos (wordmark, título do login, saudação do dashboard); Inter continua em 100% dos números/dados/formulários | Trocar a fonte do app inteiro (ex.: pares "Handwritten Charm" ou "Soft Rounded" sugeridos pela busca de tipografia) | Zero risco pros componentes já construídos; cursivo/infantil não combina com um app de dinheiro usado todo dia |
| 6 | Favicon = `icon.svg` no App Router, coração no mesmo gradiente do logo já existente na sidebar | Ícone genérico ou crop de foto (ilegível em 16px) | Reaproveita a marca já existente, fica coerente entre aba do navegador e logo dentro do app |
| 7 | Foto circular pequena (outra das 3 fotos) perto do botão "Sair" na sidebar/bottombar | Nenhum touch adicional | Reforça a identidade de casal além do fundo, custo de implementação baixo |

## Fora de escopo

- Nenhuma dependência nova (CSS/Tailwind + `next/image` + `next/font/google`,
  já disponíveis).
- Nenhuma mudança na lógica de dados, cálculos financeiros ou gráficos.
- Nenhuma mudança na paleta de cores existente.
- Sem tela de configuração pra trocar a foto — é fixa no código por ora.

## Implementação

### Fotos

As 3 fotos do casal (extraídas do anexo da conversa, formato `.webp`)
precisam ir para `public/photos/` no projeto Next.js:
- `couple-1.webp` (bar/noite) — usada no avatar circular
- `couple-2.webp` (praia) — usada como fundo fixo
- `couple-3.webp` (quintal) — não usada nesta rodada, mantida disponível pra
  uso futuro

Usar `next/image` (otimização automática, já suportado pelo Next.js) tanto
pro fundo quanto pro avatar circular.

### Fundo

Um componente de layout (`src/components/app/photo-backdrop.tsx` ou similar)
renderizado uma vez no layout raiz (`src/app/layout.tsx`), não em cada
página — evita reimportar a imagem em cada tela e mantém o fundo estável
durante navegação entre rotas. Estrutura:
1. `next/image` com a foto, `position: fixed`, `inset: 0`, `z-index` abaixo
   de todo o conteúdo, `opacity: 0.10` (token único, fácil de ajustar depois
   se o usuário quiser mais ou menos presença).
2. Uma camada de scrim (gradiente) por cima usando a cor de fundo já
   existente do app (`#F7F9FC`), garantindo contraste 4.5:1 pro texto em
   qualquer card.
3. Cards continuam com fundo quase opaco (branco ~92-95%) — não é
   glassmorphism cheio; dashboard financeiro denso não pode perder
   legibilidade.

### Tipografia

- Adicionar Playfair Display via `next/font/google` em
  `src/app/layout.tsx`, exposto como token Tailwind `font-display`, ao lado
  do Inter já carregado.
- Aplicar só em: wordmark "Patrimônio" (sidebar + bottombar, se houver
  texto), headline de `/login` e `/signup`, e a saudação do dashboard
  (`"Bom te ver de novo"` / equivalente).
- Nenhum outro texto muda de fonte.

### Favicon / logo

- Criar `src/app/icon.svg` (convenção do App Router do Next.js — vira
  favicon automaticamente, sem precisar gerar múltiplos tamanhos/ico à
  mão).
- SVG: quadrado arredondado com o gradiente `#7BA8E8` → `#8FD4A8` já usado
  no mark da sidebar, com um coração no lugar do check atual.
- Atualizar o mark da sidebar/bottombar pra usar o mesmo SVG (fonte única
  de verdade pro ícone da marca).

### Avatar de casal

- Componente pequeno (`<div className="rounded-full ...">` com
  `next/image`) usando `couple-1.webp`, posicionado ao lado do botão de
  logout existente — na sidebar (desktop) e também na bottombar (mobile),
  já que o botão de logout hoje mora nesses dois componentes
  (`sidebar-nav.tsx` / navegação mobile) e o pedido do usuário foi cobrir o
  app inteiro, não só desktop.

## Teste

Isso é puramente visual — sem lógica nova pra cobrir com `node --test`.
Verificação manual: abrir `npm run dev`, conferir que o fundo aparece em
todas as 4 telas do app (dashboard, patrimônio, fluxo, projeção) e nas
telas de login/cadastro, que os cards continuam legíveis (contraste),
que o favicon aparece na aba, e que o app builda sem erro
(`npm run build`, `npm run lint`).
