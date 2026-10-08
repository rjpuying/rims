"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleNavGroups } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SideNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const groups = visibleNavGroups(permissions);

  if (groups.length === 0) {
    return (
      <nav
        aria-label="Main navigation"
        data-sidebar-nav
        className="p-3"
      >
        <p
          data-sidebar-empty
          className="px-1 py-2 text-sm text-muted-foreground"
        >
          No menu items available.
        </p>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main navigation"
      data-sidebar-nav
      className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-3"
    >
      {groups.map((group) => (
        <div key={group.label}>
          <p
            data-sidebar-group-label
            className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground first:pt-0"
          >
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    data-sidebar-item
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span data-sidebar-item-text className="truncate">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
