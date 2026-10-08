import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  InventoryFilters,
  type InventoryFilterValues,
} from "@/components/inventory/inventory-filters";
import {
  MovementsList,
  type MovementRow,
} from "@/components/inventory/movements-list";
import { StockList } from "@/components/inventory/stock-list";
import type { ProductOption, StockRow } from "@/components/inventory/types";
import { NoPermissionCard } from "@/components/shared/no-permission-card";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/layout/layout-skeletons";
import { can, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sackSizeTypes } from "@/lib/validations/sale";
import { stockStatuses } from "@/lib/validations/inventory";

export const metadata: Metadata = {
  title: "Inventory",
};

type SearchParams = {
  rice?: string;
  size?: string;
  status?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="Current stock across sack sizes"
      />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <InventoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function InventoryContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const user = await requireUser();
  if (!can(user, "inventory.view")) {
    return (
      <NoPermissionCard message="You do not have permission to view inventory." />
    );
  }

  const params = await searchParams;
  const filters: InventoryFilterValues = {
    rice: params.rice && UUID_RE.test(params.rice) ? params.rice : "",
    size:
      params.size && (sackSizeTypes as readonly string[]).includes(params.size)
        ? params.size
        : "",
    status:
      params.status && (stockStatuses as readonly string[]).includes(params.status)
        ? params.status
        : "",
  };

  const supabase = await createClient();
  const canAdjust = can(user, "inventory.adjust");
  const canReject = can(user, "inventory.reject");

  const inventoryRes = await supabase
    .from("v_current_rice_inventory")
    .select(
      "id, rice_product_id, rice_name, rice_type, variety, image_url, low_stock_threshold, sack_size_type, sack_size_kg, full_sacks, loose_kg, rejected_sacks, stock_status, updated_at",
    )
    .order("rice_name")
    .order("sack_size_kg")
    .limit(500);

  if (inventoryRes.error) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Unable to load inventory right now. Please refresh and try again.
      </div>
    );
  }

  const allRows = (inventoryRes.data ?? []) as unknown as StockRow[];

  const seen = new Set<string>();
  const products: ProductOption[] = [];
  for (const row of allRows) {
    if (seen.has(row.rice_product_id)) continue;
    seen.add(row.rice_product_id);
    products.push({ id: row.rice_product_id, rice_name: row.rice_name });
  }

  const rows = allRows.filter((row) => {
    if (filters.rice && row.rice_product_id !== filters.rice) return false;
    if (filters.size && row.sack_size_type !== filters.size) return false;
    if (filters.status && row.stock_status !== filters.status) return false;
    return true;
  });
  const filtered = Boolean(filters.rice || filters.size || filters.status);

  const movementsRes = await supabase
    .from("v_inventory_movements")
    .select(
      "id, rice_product_id, rice_name, movement_type, sack_size_type, sack_size_kg, full_sacks_change, loose_kg_change, rejected_sacks_change, reference_type, reference_id, notes, created_by, created_by_name, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(15);

  const movements = ((movementsRes.data ?? []) as unknown as MovementRow[]) ?? [];

  return (
    <div className="space-y-5">
      <InventoryFilters products={products} current={filters} />

      <section className="space-y-3">
        <StockList
          rows={rows}
          canAdjust={canAdjust}
          canReject={canReject}
          filtered={filtered}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Recent movements</h2>
          <p className="text-sm text-muted-foreground">
            The last stock changes across deliveries, sales, and adjustments
          </p>
        </div>
        {movementsRes.error ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Unable to load movements right now. Please refresh and try again.
          </div>
        ) : (
          <MovementsList rows={movements} />
        )}
      </section>
    </div>
  );
}
