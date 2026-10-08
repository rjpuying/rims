"use client";

import type { ReactNode } from "react";

export function SidebarShell({ children }: { children: ReactNode }) {
  return (
    <aside
      data-sidebar-shell
      className="hidden w-56 shrink-0 overflow-x-hidden border-r bg-muted/30 transition-[width] duration-200 ease-in-out lg:block"
    >
      {children}
    </aside>
  );
}
