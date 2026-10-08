import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AlertsCard, AlertsCardSkeleton } from "@/components/dashboard/alerts-card";
import {
  InventorySection,
  InventorySectionSkeleton,
} from "@/components/dashboard/inventory-section";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { StatCards } from "@/components/dashboard/stat-cards";
import {
  ListSkeleton,
  StatCardsSkeleton,
} from "@/components/layout/layout-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { formatManilaDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <Suspense fallback={<PageHeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <Suspense fallback={<InventorySectionSkeleton />}>
        <InventorySection />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ListSkeleton rows={5} />}>
            <RecentTransactions />
          </Suspense>
        </div>
        <Suspense fallback={<AlertsCardSkeleton />}>
          <AlertsCard />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardHeader() {
  await connection();
  return <PageHeader title="Dashboard" description={formatManilaDate()} />;
}

function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
