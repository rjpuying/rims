"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { initials } from "@/lib/format";
import { visibleNavGroups } from "@/lib/navigation";
import { signOut } from "@/lib/sign-out";
import { cn } from "@/lib/utils";

type NavSheetProps = {
  permissions: string[];
  fullName: string;
  roleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NavSheet({
  permissions,
  fullName,
  roleName,
  open,
  onOpenChange,
}: NavSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = visibleNavGroups(permissions);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-72 flex-col gap-0 p-0 sm:max-w-xs"
      >
        <SheetHeader className="border-b px-4 py-3 text-left">
          <SheetTitle className="text-sm font-semibold">
            Brick Eight Trading Inc.
          </SheetTitle>
          <SheetDescription className="text-xs">
            Rice POS &amp; Inventory Management
          </SheetDescription>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-3">
          {groups.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No menu items available. Contact the administrator.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground first:pt-0">
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
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                            active
                              ? "bg-accent font-medium text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initials(fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {roleName.replaceAll("_", " ")}
              </p>
            </div>
          </div>
          <Separator className="my-3" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
