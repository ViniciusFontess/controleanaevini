import { redirect } from "next/navigation";
import { BrandMark } from "@/components/app/nav-items";
import { BottomNav, SidebarNav } from "@/components/app/sidebar-nav";
import { LogoutButton } from "@/components/app/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redundante com o middleware, mas o layout precisa do usuário pra montar a UI.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 z-40 hidden h-screen w-[76px] flex-none flex-col border-r border-line bg-surface px-3 py-[22px] md:flex lg:w-[230px] lg:px-4 lg:py-[26px]">
        <div className="flex items-center gap-[11px] px-2 pt-1.5 pb-[22px]">
          <BrandMark />
          <span className="hidden text-[16px] font-extrabold tracking-[-0.02em] lg:inline">
            Patrimônio
          </span>
        </div>

        <SidebarNav />

        <div className="mt-auto border-t border-line pt-3">
          <p
            className="mb-1 hidden truncate px-3 text-[12px] font-semibold text-muted lg:block"
            title={user.email ?? undefined}
          >
            {user.email}
          </p>
          <LogoutButton className="w-full justify-center lg:justify-start" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="text-[15px] font-extrabold tracking-[-0.02em]">Patrimônio</span>
          </div>
          <LogoutButton />
        </header>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-24 md:px-[26px] md:py-7 lg:px-10 lg:pt-[34px] lg:pb-12">
          <div className="mx-auto max-w-[1120px]">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
