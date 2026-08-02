# Cozy Couple Visual Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app a warm, personal "couple" feel — a low-opacity couple photo fixed behind every screen, a Playfair Display accent on three headings, a heart favicon matching the existing brand gradient, and a small circular couple photo next to the logout control — without touching any data logic, calculations, or the existing color palette.

**Architecture:** Purely additive presentational layer on top of the existing Next.js App Router app. One new fixed-position component (`PhotoBackdrop`) mounted once in the root layout so it's behind every route (both `(app)` authenticated screens and `/login`/`/signup`). One new Google Font loaded alongside the existing Inter and exposed as a Tailwind `font-display` token. Two small existing components (`Card`, `AuthShell`) get their opaque backgrounds softened so the backdrop shows through. One new `src/app/icon.svg` (Next.js App Router auto-favicon convention) plus a matching update to the existing `BrandMark` glyph.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (`@theme inline` in `globals.css`, no `tailwind.config.js`), `next/font/google`, `next/image`.

## Global Constraints

- No new npm dependencies — only `next/image`, `next/font/google`, and Tailwind, all already in use.
- No changes to any file under `src/lib/data/`, `src/lib/actions/`, `src/lib/auth/`, or any `.test.ts` file — this plan is visual-only.
- No changes to the existing color tokens in `src/app/globals.css`'s `@theme inline` block (`--color-*`).
- Photo opacity on the backdrop is exactly `0.10` per the approved spec (`docs/superpowers/specs/2026-08-02-cozy-couple-visual-theme-design.md`).
- Every task ends with `npm run lint` and `npm run build` passing (no automated tests apply — this is a presentational-only change per the spec's Teste section).

---

### Task 1: Add the couple photos to `public/photos/`

**Files:**
- Create: `public/photos/couple-1.webp` (bar/night photo — used for the small avatar)
- Create: `public/photos/couple-2.webp` (beach photo — used for the fixed backdrop)
- Create: `public/photos/couple-3.webp` (backyard photo — not used yet, kept for future use per spec)

**Interfaces:**
- Produces: the URL paths `/photos/couple-1.webp`, `/photos/couple-2.webp`, `/photos/couple-3.webp`, consumed by `next/image` in Tasks 3 and 6.

- [ ] **Step 1: Copy the three photos into `public/photos/`**

The photos were already extracted from the conversation attachment to
`C:\Users\vinia\AppData\Local\Temp\claude\C--Users-vinia-Desktop-controleanaevini\23799bb4-800d-4727-ac48-c435fe9ea00f\scratchpad\couple-photos\photo1.webp` (bar), `photo2.webp` (beach), `photo3.webp` (backyard).

```bash
mkdir -p "C:/Users/vinia/Desktop/controleanaevini/public/photos"
cp "C:/Users/vinia/AppData/Local/Temp/claude/C--Users-vinia-Desktop-controleanaevini/23799bb4-800d-4727-ac48-c435fe9ea00f/scratchpad/couple-photos/photo1.webp" "C:/Users/vinia/Desktop/controleanaevini/public/photos/couple-1.webp"
cp "C:/Users/vinia/AppData/Local/Temp/claude/C--Users-vinia-Desktop-controleanaevini/23799bb4-800d-4727-ac48-c435fe9ea00f/scratchpad/couple-photos/photo2.webp" "C:/Users/vinia/Desktop/controleanaevini/public/photos/couple-2.webp"
cp "C:/Users/vinia/AppData/Local/Temp/claude/C--Users-vinia-Desktop-controleanaevini/23799bb4-800d-4727-ac48-c435fe9ea00f/scratchpad/couple-photos/photo3.webp" "C:/Users/vinia/Desktop/controleanaevini/public/photos/couple-3.webp"
```

If that source directory no longer exists (temp cleared between sessions),
ask the user to re-share the three photos before continuing — do not
proceed with placeholder images.

- [ ] **Step 2: Verify the files landed correctly**

Run: `ls -la "C:/Users/vinia/Desktop/controleanaevini/public/photos"`
Expected: three `.webp` files, each larger than 50KB (not empty/corrupt).

- [ ] **Step 3: Commit**

```bash
git add public/photos/couple-1.webp public/photos/couple-2.webp public/photos/couple-3.webp
git commit -m "Add couple photos for the visual theme"
```

---

### Task 2: Add Playfair Display as the `font-display` token

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: a Tailwind utility class `font-display` (same pattern as the existing `font-sans`), usable by any component. Consumed by Task 5.

- [ ] **Step 1: Load the font in the root layout**

Edit `src/app/layout.tsx` — replace the whole file:

```tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Patrimônio",
  description: "Controle de patrimônio pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Expose it as a Tailwind token**

Edit `src/app/globals.css` — in the `@theme inline` block, add the new font
line right after the existing `--font-sans` line:

```css
@theme inline {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-playfair), Georgia, serif;

  /* superfícies */
  --color-canvas: #f7f9fc;
```

(Only the two lines shown are new/changed — everything else in the file
stays as-is.)

- [ ] **Step 3: Verify the build picks up the font and token**

Run: `npm run build`
Expected: build succeeds (exit code 0), no TypeScript or CSS errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "Add Playfair Display as the font-display accent token"
```

---

### Task 3: Fixed photo backdrop behind every screen

**Files:**
- Create: `src/components/app/photo-backdrop.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/auth/auth-shell.tsx`
- Modify: `src/components/ui/card.tsx`

**Interfaces:**
- Produces: `PhotoBackdrop` (default-exportless named component, no props), mounted once in the root layout.
- Consumes: `public/photos/couple-2.webp` from Task 1.

- [ ] **Step 1: Create the backdrop component**

Create `src/components/app/photo-backdrop.tsx`:

```tsx
import Image from "next/image";

/**
 * Fixed, low-opacity couple photo behind every screen. Rendered once in the
 * root layout. Negative z-index + fixed positioning keeps it pinned to the
 * viewport and behind all in-flow page content — see the note on CSS
 * stacking order in docs/superpowers/specs/2026-08-02-cozy-couple-visual-theme-design.md
 * if this ever needs touching again: a negative z-index descendant paints
 * behind normal in-flow content in the same stacking context, which is
 * exactly what "fixed background" needs here.
 */
export function PhotoBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/photos/couple-2.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-10"
        style={{ objectPosition: "center 30%" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,249,252,.45)_0%,rgba(247,249,252,.85)_42%,#F7F9FC_75%)]" />
    </div>
  );
}
```

- [ ] **Step 2: Mount it in the root layout**

Edit `src/app/layout.tsx` — add the import and render it as the first
child of `<body>`:

```tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { PhotoBackdrop } from "@/components/app/photo-backdrop";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Patrimônio",
  description: "Controle de patrimônio pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full font-sans">
        <PhotoBackdrop />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Let the backdrop show through on the login/signup pages**

`AuthShell`'s `<main>` currently paints a fully opaque `bg-canvas`, which
sits in normal document flow above the negative-z-index backdrop and hides
it completely. Remove that class. Also soften the auth card itself to match
the "near-opaque" card treatment (see Step 4 for why `/95` +
`backdrop-blur-sm`).

Edit `src/components/auth/auth-shell.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: { text: string; linkLabel: string; href: string };
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--color-blue),var(--color-green))]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 15l5-5 4 4 7-8" />
            </svg>
          </div>
          <span className="font-display text-[16px] font-extrabold tracking-[-0.02em]">
            Patrimônio
          </span>
        </div>

        <div className="rounded-2xl bg-surface/95 p-7 shadow-card backdrop-blur-sm">
          <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 mb-6 text-[14px] text-muted">{subtitle}</p>
          {children}
        </div>

        <p className="mt-6 text-center text-[14px] text-muted">
          {footer.text}{" "}
          <Link href={footer.href} className="font-bold text-blue-strong hover:text-blue-hover">
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
```

(This also applies the `font-display` accent to the wordmark and headline —
part of Task 5's requirement, done here since it's the same lines being
touched. Task 5 covers the two remaining spots.)

- [ ] **Step 4: Soften the shared `Card` component**

Every screen (`dashboard`, `patrimonio`, `fluxo`, `caixa`, `projecao`) is
built from this one `Card` component, so this single change is what makes
cards "near-opaque instead of fully opaque" everywhere at once.

Edit `src/components/ui/card.tsx` — change only the `Card` function's
returned className:

```tsx
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-surface/95 p-[22px] shadow-card backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Verify visually**

Run: `npm run dev`

Open `http://localhost:3000/login` — expected: the beach photo is faintly
visible behind the login card (most visible near the top/edges of the
viewport, fading to solid canvas color lower down). Text and the login
form remain fully legible.

Log in (or create a test account) and check `/`, `/patrimonio`, `/fluxo`,
`/caixa`, `/projecao` — expected: same faint photo behind every screen,
cards stay legible, no layout shift compared to before.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: build succeeds, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/app/photo-backdrop.tsx src/app/layout.tsx src/components/auth/auth-shell.tsx src/components/ui/card.tsx
git commit -m "Add fixed low-opacity couple photo backdrop behind every screen"
```

---

### Task 4: Heart favicon and matching brand mark

**Files:**
- Create: `src/app/icon.svg`
- Delete: `src/app/favicon.ico`
- Modify: `src/components/app/nav-items.tsx`

**Interfaces:**
- Produces: no new exports — `BrandMark`'s existing signature
  (`{ className }: { className?: string }`) is unchanged, only its
  rendered SVG path changes.

- [ ] **Step 1: Create the favicon**

Create `src/app/icon.svg` (Next.js App Router picks up `icon.svg` in
`src/app/` automatically — no code wiring needed):

```svg
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7BA8E8"/>
      <stop offset="1" stop-color="#8FD4A8"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="28" fill="url(#g)"/>
  <path d="M50 74 C 24 58, 20 40, 32 30 C 40 23, 50 27, 50 37 C 50 27, 60 23, 68 30 C 80 40, 76 58, 50 74 Z" fill="#fff"/>
</svg>
```

- [ ] **Step 2: Remove the stale default favicon**

```bash
rm "C:/Users/vinia/Desktop/controleanaevini/src/app/favicon.ico"
```

- [ ] **Step 3: Swap the in-app logo glyph to match**

Edit `src/components/app/nav-items.tsx` — replace only the `BrandMark`
function (everything above it — `NavItem`, `iconProps`, `NAV_ITEMS` —
stays exactly the same):

```tsx
export function BrandMark({ className = "size-[34px]" }: { className?: string }) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--color-blue),var(--color-green))] ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M12 20.5c-.3 0-.6-.1-.8-.3C6.5 16.8 3 13.6 3 9.9 3 7.2 5.1 5 7.7 5c1.5 0 2.9.7 3.8 1.9C12.4 5.7 13.8 5 15.3 5 17.9 5 20 7.2 20 9.9c0 3.7-3.5 6.9-8.2 10.3-.2.2-.5.3-.8.3Z" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, open `http://localhost:3000/login` in a browser.
Expected: the browser tab shows the heart favicon (may take a refresh —
browsers cache favicons aggressively). The logo mark next to "Patrimônio"
in the sidebar/header now shows a heart instead of a checkmark.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/icon.svg src/components/app/nav-items.tsx
git rm src/app/favicon.ico
git commit -m "Replace default favicon with a heart mark matching the brand gradient"
```

---

### Task 5: Apply the `font-display` accent to the dashboard greeting

Task 3 already applied `font-display` to the two auth-page spots (wordmark
and headline in `auth-shell.tsx`). This task covers the third and last
spot named in the spec: the dashboard greeting.

**Files:**
- Modify: `src/app/(app)/page.tsx`

**Interfaces:** none — single className change.

- [ ] **Step 1: Add the class**

Edit `src/app/(app)/page.tsx` — find this block near the top of the
returned JSX (currently around line 53-56):

```tsx
      <div className="mb-[22px]">
        <div className="text-[13px] font-medium text-muted">Bom te ver de novo</div>
        <div className="mt-0.5 text-[13px] font-medium text-muted">{fmtMonthLong(currentMonth)}</div>
      </div>
```

Replace with:

```tsx
      <div className="mb-[22px]">
        <div className="font-display text-[15px] font-semibold text-muted">Bom te ver de novo</div>
        <div className="mt-0.5 text-[13px] font-medium text-muted">{fmtMonthLong(currentMonth)}</div>
      </div>
```

(Bumped to 15px and `font-semibold` because Playfair Display reads better
slightly larger than the 13px caption size it's replacing — the date line
right below stays untouched at 13px so the greeting is still visually the
"headline" of the two.)

- [ ] **Step 2: Verify**

Run: `npm run dev`, log in, open `/`.
Expected: "Bom te ver de novo" renders in the serif Playfair Display font,
noticeably different from the rest of the page (which stays Inter).

Run: `npm run build` and `npm run lint`.
Expected: both succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/page.tsx"
git commit -m "Apply font-display accent to the dashboard greeting"
```

---

### Task 6: Small couple avatar next to the logout control

**Files:**
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `public/photos/couple-1.webp` from Task 1, `LogoutButton` from
  `src/components/app/logout-button.tsx` (unchanged), `BrandMark` from
  `src/components/app/nav-items.tsx` (unchanged import, changed rendering
  from Task 4).

- [ ] **Step 1: Add the avatar to the desktop sidebar**

Edit `src/app/(app)/layout.tsx` — add the `Image` import at the top:

```tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/app/nav-items";
import { BottomNav, SidebarNav } from "@/components/app/sidebar-nav";
import { LogoutButton } from "@/components/app/logout-button";
import { createClient } from "@/lib/supabase/server";
```

Then replace the sidebar footer block (currently):

```tsx
        <div className="mt-auto border-t border-line pt-3">
          <p
            className="mb-1 hidden truncate px-3 text-[12px] font-semibold text-muted lg:block"
            title={user.email ?? undefined}
          >
            {user.email}
          </p>
          <LogoutButton className="w-full justify-center lg:justify-start" />
        </div>
```

with:

```tsx
        <div className="mt-auto border-t border-line pt-3">
          <div className="mb-2 flex items-center gap-2.5 px-3">
            <div className="size-7 flex-none overflow-hidden rounded-full ring-2 ring-white shadow-sm">
              <Image
                src="/photos/couple-1.webp"
                alt=""
                width={28}
                height={28}
                className="size-full object-cover"
                style={{ objectPosition: "center 20%" }}
              />
            </div>
            <p
              className="hidden truncate text-[12px] font-semibold text-muted lg:block"
              title={user.email ?? undefined}
            >
              {user.email}
            </p>
          </div>
          <LogoutButton className="w-full justify-center lg:justify-start" />
        </div>
```

- [ ] **Step 2: Add the avatar to the mobile header**

This is where the logout control actually lives on mobile (the bottom bar
is nav-only — no logout button there, so this is the correct "mobile"
counterpart per the spec). Replace the mobile `<header>` block (currently):

```tsx
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="text-[15px] font-extrabold tracking-[-0.02em]">Patrimônio</span>
          </div>
          <LogoutButton />
        </header>
```

with:

```tsx
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="font-display text-[15px] font-extrabold tracking-[-0.02em]">
              Patrimônio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-7 flex-none overflow-hidden rounded-full ring-2 ring-white shadow-sm">
              <Image
                src="/photos/couple-1.webp"
                alt=""
                width={28}
                height={28}
                className="size-full object-cover"
                style={{ objectPosition: "center 20%" }}
              />
            </div>
            <LogoutButton />
          </div>
        </header>
```

(This also picks up the last remaining `font-display` wordmark spot —
sidebar wordmark still needs it too, see Step 3.)

- [ ] **Step 3: Apply `font-display` to the sidebar wordmark**

In the same file, find (near the top of the returned JSX):

```tsx
          <span className="hidden text-[16px] font-extrabold tracking-[-0.02em] lg:inline">
            Patrimônio
          </span>
```

Replace with:

```tsx
          <span className="font-display hidden text-[16px] font-extrabold tracking-[-0.02em] lg:inline">
            Patrimônio
          </span>
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, log in.

At desktop width (≥1024px): expected small circular photo next to the
email address above the "Sair" button in the sidebar, and the "Patrimônio"
wordmark in Playfair Display.

Resize to mobile width (<768px): expected the top header shows the same
circular photo next to the "Sair" button.

Resize to tablet width (768–1023px): expected the sidebar shows as an
icon-only rail — confirm the avatar still shows there too (it has no `lg:`
restriction, unlike the email text).

Run: `npm run build` and `npm run lint`.
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/layout.tsx"
git commit -m "Add couple avatar next to the logout control, desktop and mobile"
```

---

### Task 7: Final full-app check

**Files:** none — verification only.

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all existing tests still pass (this plan touched no files under
`src/lib/`, so this should be unaffected — this step exists to catch any
accidental regression).

- [ ] **Step 2: Full lint + build**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds, all 8 routes listed in the output (`/`,
`/login`, `/signup`, `/patrimonio`, `/fluxo`, `/caixa`, `/projecao`,
`/auth/confirm`).

- [ ] **Step 3: Manual walkthrough**

Run: `npm run dev`. Walk through: `/login` → sign in → `/` (dashboard) →
`/patrimonio` → `/fluxo` → `/caixa` → `/projecao` → log out → `/login`
again. Confirm at each step: photo backdrop present and faint, cards
legible, favicon correct, no console errors in the browser devtools.

- [ ] **Step 4: Push**

Only if the user asks for it explicitly in this session — otherwise leave
commits local, matching how this repo has been worked so far.

```bash
git push origin main
```
