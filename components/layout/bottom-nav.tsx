"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EllipsisVertical } from "lucide-react";
import { useShell } from "@/components/layout/shell-context";
import { BOTTOM_NAV_HREFS, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function BottomNavClient({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const { setSheetOpen } = useShell();
  const primaryItems = NAV_ITEMS.filter(
    (item) =>
      BOTTOM_NAV_HREFS.includes(item.href) &&
      permissions.includes(item.permission),
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <nav
        aria-label="Primary navigation"
        className="flex h-16 items-stretch"
      >
        {primaryItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 px-1 text-center",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="max-w-full truncate text-[11px] leading-tight">
                {item.label.replace(" / POS", "").replace(" Received", "")}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-muted-foreground hover:text-foreground"
        >
          <EllipsisVertical className="h-5 w-5" />
          <span className="text-[11px] leading-tight">More</span>
        </button>
      </nav>
    </div>
  );
}
