import Image from "next/image";
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
          <span className="font-display hidden text-[16px] font-extrabold tracking-[-0.02em] lg:inline">
            Patrimônio
          </span>
        </div>

        <SidebarNav />

        <div className="mt-auto border-t border-line pt-3">
          <div className="mb-2 flex items-center justify-center gap-2.5 lg:justify-start lg:px-3">
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
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

        <main className="min-w-0 flex-1 px-4 pt-5 pb-24 md:px-[26px] md:py-7 lg:px-10 lg:pt-[34px] lg:pb-12">
          <div className="mx-auto max-w-[1120px]">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
