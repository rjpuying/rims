"use client";

import { LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/sign-out";
import { initials } from "@/lib/format";

export function UserMenu({
  fullName,
  roleName,
  email,
}: {
  fullName: string;
  roleName: string;
  email: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-full pr-2 pl-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
          {initials(fullName)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
          {fullName}
        </span>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {roleName.replaceAll("_", " ")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
