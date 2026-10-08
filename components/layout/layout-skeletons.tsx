import { Skeleton } from "@/components/ui/skeleton";

export function TopBarSkeleton() {
  return (
    <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
      <Skeleton className="h-8 w-8 lg:hidden" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="ml-auto h-8 w-8 rounded-full" />
    </div>
  );
}

export function SideNavSkeleton() {
  return (
    <nav className="space-y-2 p-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </nav>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 w-full lg:col-span-2" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}
