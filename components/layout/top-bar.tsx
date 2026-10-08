"use client";

import { Menu } from "lucide-react";
import { NavSheet } from "@/components/layout/nav-sheet";
import { useShell } from "@/components/layout/shell-context";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";

export function TopBarClient({
  fullName,
  roleName,
  email,
  permissions,
}: {
  fullName: string;
  roleName: string;
  email: string;
  permissions: string[];
}) {
  const { toggleCollapsed, sheetOpen, setSheetOpen } = useShell();

  function handleMenuClick() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      toggleCollapsed();
    } else {
      setSheetOpen(true);
    }
  }

  return (
    <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Toggle navigation menu"
        onClick={handleMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <NavSheet
        permissions={permissions}
        fullName={fullName}
        roleName={roleName}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
          BE
        </span>
        <span className="truncate text-sm font-semibold">
          Brick Eight Trading Inc.
        </span>
      </div>
      <div className="ml-auto">
        <UserMenu fullName={fullName} roleName={roleName} email={email} />
      </div>
    </div>
  );
}
