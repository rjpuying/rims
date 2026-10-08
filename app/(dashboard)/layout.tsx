import { Suspense } from "react";
import { connection } from "next/server";
import { BottomNavClient } from "@/components/layout/bottom-nav";
import { ShellProvider } from "@/components/layout/shell-context";
import {
  PageSkeleton,
  SideNavSkeleton,
  TopBarSkeleton,
} from "@/components/layout/layout-skeletons";
import { SideNav } from "@/components/layout/side-nav";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { TopBarClient } from "@/components/layout/top-bar";
import { requireUser } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellProvider>
      <div className="flex min-h-svh flex-col bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Suspense fallback={<TopBarSkeleton />}>
            <TopBar />
          </Suspense>
        </header>
        <div className="mx-auto flex w-full max-w-screen-2xl flex-1 self-stretch">
          <SidebarShell>
            <Suspense fallback={<SideNavSkeleton />}>
              <SideNavWrapper />
            </Suspense>
          </SidebarShell>
          <main className="min-w-0 flex-1 px-4 py-4 pb-24 sm:px-6 lg:pb-8">
            <Suspense fallback={<PageSkeleton />}>
              <AuthGuard>{children}</AuthGuard>
            </Suspense>
          </main>
        </div>
        <Suspense fallback={null}>
          <BottomNavWrapper />
        </Suspense>
      </div>
    </ShellProvider>
  );
}

async function TopBar() {
  await connection();
  const user = await requireUser();
  return (
    <TopBarClient
      fullName={user.fullName}
      roleName={user.roleName}
      email={user.email}
      permissions={user.permissions}
    />
  );
}

async function SideNavWrapper() {
  await connection();
  const user = await requireUser();
  return <SideNav permissions={user.permissions} />;
}

async function BottomNavWrapper() {
  await connection();
  const user = await requireUser();
  return <BottomNavClient permissions={user.permissions} />;
}

async function AuthGuard({ children }: { children: React.ReactNode }) {
  await connection();
  await requireUser();
  return <>{children}</>;
}
