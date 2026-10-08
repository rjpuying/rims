import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { NoPermissionCard } from "@/components/shared/no-permission-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pos } from "@/components/sales/pos";
import { SalesFilters, type SalesFilterValues } from "@/components/sales/sales-filters";
import { SalesList, type SaleRow } from "@/components/sales/sales-list";
import { ListSkeleton } from "@/components/layout/layout-skeletons";
import { can, requireUser } from "@/lib/auth";
import { manilaDateISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { CatalogProduct } from "@/lib/pos";

export const metadata: Metadata = {
  title: "Sales / POS",
};

type SearchParams = {
  from?: string;
  to?: string;
  customer?: string;
  payment?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function SalesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales / POS"
        description="Create and manage rice sales"
      />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <SalesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SalesContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const user = await requireUser();
  if (!can(user, "sales.view")) {
    return (
      <NoPermissionCard message="You do not have permission to view sales." />
    );
  }

  const params = await searchParams;
  const today = manilaDateISO();
  const filters: SalesFilterValues = {
    from: params.from && DATE_RE.test(params.from) ? params.from : today,
    to: params.to && DATE_RE.test(params.to) ? params.to : today,
    customer: params.customer?.slice(0, 120) ?? "",
    payment: params.payment && /^[A-Z_]+$/.test(params.payment) ? params.payment : "",
  };

  const fromIso = `${filters.from}T00:00:00+08:00`;
  const toIso = `${filters.to}T23:59:59.999+08:00`;

  const supabase = await createClient();
  const canCreate = can(user, "sales.create");

  let catalog: CatalogProduct[] = [];
  let catalogFailed = false;
  if (canCreate) {
    const { data, error } = await supabase.rpc("get_product_catalog");
    if (error) {
      catalogFailed = true;
    } else {
      catalog = (data ?? []) as CatalogProduct[];
    }
  }

  let query = supabase
    .from("sales")
    .select(
      "id, transaction_number, sale_date, customer_name, total_amount, amount_paid, balance, payment_status, payment_method, status, sale_items(id, rice_name_snapshot, selling_method, sack_size_kg, quantity_sacks, quantity_kg, price_per_sack, price_per_kg, line_total)",
    )
    .gte("sale_date", fromIso)
    .lte("sale_date", toIso)
    .order("sale_date", { ascending: false })
    .limit(50);

  if (filters.customer) {
    const escaped = filters.customer.replace(/[%_]/g, "\\$&");
    query = query.ilike("customer_name", `%${escaped}%`);
  }
  if (filters.payment && filters.payment !== "all") {
    query = query.eq("payment_method", filters.payment);
  }

  const { data: sales, error: salesError } = await query;

  const rows = ((sales ?? []) as unknown as SaleRow[]).map((row) => ({
    ...row,
    sale_date: String(row.sale_date),
    items: row.items ?? [],
  }));

  return (
    <>
      {canCreate ? (
        catalogFailed ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Unable to load the rice catalog right now. Please refresh and try
            again.
          </div>
        ) : (
          <Pos catalog={catalog} processedByName={user.fullName} />
        )
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Sales</h2>
        <SalesFilters current={filters} />
        {salesError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load sales right now. Please refresh and try again.
          </div>
        ) : (
          <SalesList rows={rows} canCreate={canCreate} />
        )}
      </section>
    </>
  );
}
