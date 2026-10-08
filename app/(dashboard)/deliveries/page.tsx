import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeliveriesList, type DeliveryRow } from "@/components/deliveries/deliveries-list";
import { ReceiveDeliveryForm } from "@/components/deliveries/receive-delivery-form";
import { ListSkeleton } from "@/components/layout/layout-skeletons";
import { NoPermissionCard } from "@/components/shared/no-permission-card";
import { PageHeader } from "@/components/shared/page-header";
import {
  ReceivingFilters,
  type ReceivingFilterValues,
} from "@/components/receiving/receiving-filters";
import { can, requireUser } from "@/lib/auth";
import { manilaDateISO } from "@/lib/format";
import type { CatalogProduct } from "@/lib/pos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Delivery Received",
};

type SearchParams = {
  from?: string;
  to?: string;
  supplier?: string;
  rice?: string;
  payment?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_VALUES = new Set(["PAID", "PARTIALLY_PAID", "UNPAID"]);

const DELIVERY_FIELDS =
  "id, transaction_number, delivery_date, supplier_name, total_amount, amount_paid, balance, payment_status, status, notes, received_by_profile:profiles!deliveries_received_by_fkey(full_name), delivery_items(id, rice_type, variety, quantity_sacks, sack_size_type, sack_size_kg, price_per_sack, total_amount, batch_number, rice_products(rice_name))";
const DELIVERY_FIELDS_BY_RICE =
  "id, transaction_number, delivery_date, supplier_name, total_amount, amount_paid, balance, payment_status, status, notes, received_by_profile:profiles!deliveries_received_by_fkey(full_name), delivery_items!inner(id, rice_type, variety, quantity_sacks, sack_size_type, sack_size_kg, price_per_sack, total_amount, batch_number, rice_products(rice_name))";

export default function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Delivery Received"
        description="Record received delivery batches"
      />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <DeliveriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DeliveriesContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const user = await requireUser();
  if (!can(user, "delivery.view")) {
    return (
      <NoPermissionCard message="You do not have permission to view deliveries." />
    );
  }

  const params = await searchParams;
  const today = manilaDateISO();
  const filters: ReceivingFilterValues = {
    from: params.from && DATE_RE.test(params.from) ? params.from : today,
    to: params.to && DATE_RE.test(params.to) ? params.to : today,
    party: params.supplier?.slice(0, 120) ?? "",
    rice: params.rice && UUID_RE.test(params.rice) ? params.rice : "",
    payment:
      params.payment && PAYMENT_VALUES.has(params.payment)
        ? params.payment
        : "",
  };

  const fromIso = `${filters.from}T00:00:00+08:00`;
  const toIso = `${filters.to}T23:59:59.999+08:00`;
  const canCreate = can(user, "delivery.create");

  const supabase = await createClient();

  let products: CatalogProduct[] = [];
  let catalogFailed = false;
  const { data: catalog, error: catalogError } =
    await supabase.rpc("get_product_catalog");
  if (catalogError) {
    catalogFailed = true;
  } else {
    products = (catalog ?? []) as CatalogProduct[];
  }

  let query = supabase
    .from("deliveries")
    .select(filters.rice ? DELIVERY_FIELDS_BY_RICE : DELIVERY_FIELDS)
    .gte("delivery_date", fromIso)
    .lte("delivery_date", toIso)
    .order("delivery_date", { ascending: false })
    .limit(50);

  if (filters.party) {
    const escaped = filters.party.replace(/[%_]/g, "\\$&");
    query = query.ilike("supplier_name", `%${escaped}%`);
  }
  if (filters.payment) {
    query = query.eq("payment_status", filters.payment);
  }
  if (filters.rice) {
    query = query.eq("delivery_items.rice_product_id", filters.rice);
  }

  const { data: deliveries, error: deliveriesError } = await query;

  const rows = ((deliveries ?? []) as unknown as DeliveryRow[]).map((row) => ({
    ...row,
    delivery_date: String(row.delivery_date),
    delivery_items: row.delivery_items ?? [],
  }));

  return (
    <div className="space-y-5">
      {canCreate ? (
        catalogFailed ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Unable to load the rice catalog right now. Please refresh and try
            again.
          </div>
        ) : (
          <div id="receive-delivery">
            <ReceiveDeliveryForm
              products={products.map((product) => ({
                id: product.id,
                rice_name: product.rice_name,
                rice_type: product.rice_type,
                variety: product.variety,
              }))}
              receivedBy={user.fullName}
            />
          </div>
        )
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Deliveries</h2>
        <ReceivingFilters
          current={filters}
          partyKey="supplier"
          partyLabel="Supplier"
          partyPlaceholder="Any supplier"
          products={products.map((product) => ({
            id: product.id,
            rice_name: product.rice_name,
          }))}
        />
        {deliveriesError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Unable to load deliveries right now. Please refresh and try again.
          </div>
        ) : (
          <DeliveriesList rows={rows} canCreate={canCreate} />
        )}
      </section>
    </div>
  );
}
