import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/layout-skeletons";
import { PalayReceiptsList, type PalayRow } from "@/components/palay/palay-receipts-list";
import { ReceivePalayForm } from "@/components/palay/receive-palay-form";
import { NoPermissionCard } from "@/components/shared/no-permission-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ReceivingFilters,
  type ReceivingFilterValues,
} from "@/components/receiving/receiving-filters";
import { Card, CardContent } from "@/components/ui/card";
import { can, requireUser } from "@/lib/auth";
import { formatNumber, manilaDateISO } from "@/lib/format";
import type { CatalogProduct } from "@/lib/pos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Palay Received",
};

type SearchParams = {
  from?: string;
  to?: string;
  farmer?: string;
  rice?: string;
  payment?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_VALUES = new Set(["PAID", "PARTIALLY_PAID", "UNPAID"]);

const PALAY_FIELDS =
  "id, transaction_number, receipt_date, farmer_name, total_amount, amount_paid, balance, payment_status, status, notes, received_by_profile:profiles!palay_receipts_received_by_fkey(full_name), palay_receipt_items(id, rice_name_snapshot, variety, quantity_kg, price_per_kg, total_amount)";
const PALAY_FIELDS_BY_RICE =
  "id, transaction_number, receipt_date, farmer_name, total_amount, amount_paid, balance, payment_status, status, notes, received_by_profile:profiles!palay_receipts_received_by_fkey(full_name), palay_receipt_items!inner(id, rice_name_snapshot, variety, quantity_kg, price_per_kg, total_amount)";

type PalayStockRow = {
  id: string;
  rice_name: string;
  variety: string | null;
  quantity_kg: number;
  stock_status: string;
};

export default function PalayPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Palay Received"
        description="Record palay purchases from farmers"
      />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <PalayContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PalayContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const user = await requireUser();
  if (!can(user, "palay.view")) {
    return (
      <NoPermissionCard message="You do not have permission to view palay receipts." />
    );
  }

  const params = await searchParams;
  const today = manilaDateISO();
  const filters: ReceivingFilterValues = {
    from: params.from && DATE_RE.test(params.from) ? params.from : today,
    to: params.to && DATE_RE.test(params.to) ? params.to : today,
    party: params.farmer?.slice(0, 120) ?? "",
    rice: params.rice && UUID_RE.test(params.rice) ? params.rice : "",
    payment:
      params.payment && PAYMENT_VALUES.has(params.payment)
        ? params.payment
        : "",
  };

  const fromIso = `${filters.from}T00:00:00+08:00`;
  const toIso = `${filters.to}T23:59:59.999+08:00`;
  const canCreate = can(user, "palay.create");

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
    .from("palay_receipts")
    .select(filters.rice ? PALAY_FIELDS_BY_RICE : PALAY_FIELDS)
    .gte("receipt_date", fromIso)
    .lte("receipt_date", toIso)
    .order("receipt_date", { ascending: false })
    .limit(50);

  if (filters.party) {
    const escaped = filters.party.replace(/[%_]/g, "\\$&");
    query = query.ilike("farmer_name", `%${escaped}%`);
  }
  if (filters.payment) {
    query = query.eq("payment_status", filters.payment);
  }
  if (filters.rice) {
    query = query.eq("palay_receipt_items.rice_product_id", filters.rice);
  }

  const { data: receipts, error: receiptsError } = await query;

  const rows = ((receipts ?? []) as unknown as PalayRow[]).map((row) => ({
    ...row,
    receipt_date: String(row.receipt_date),
    palay_receipt_items: row.palay_receipt_items ?? [],
  }));

  const stockRes = await supabase
    .from("v_palay_inventory")
    .select("id, rice_name, variety, quantity_kg, stock_status")
    .gt("quantity_kg", 0)
    .order("rice_name");

  const stock = (stockRes.data ?? []) as unknown as PalayStockRow[];

  return (
    <div className="space-y-5">
      {canCreate ? (
        catalogFailed ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Unable to load the rice catalog right now. Please refresh and try
            again.
          </div>
        ) : (
          <div id="receive-palay">
            <ReceivePalayForm
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
        <h2 className="text-lg font-medium">Palay receipts</h2>
        <ReceivingFilters
          current={filters}
          partyKey="farmer"
          partyLabel="Farmer"
          partyPlaceholder="Any farmer"
          products={products.map((product) => ({
            id: product.id,
            rice_name: product.rice_name,
          }))}
        />
        {receiptsError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Unable to load palay receipts right now. Please refresh and try
            again.
          </div>
        ) : (
          <PalayReceiptsList rows={rows} canCreate={canCreate} />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Palay inventory</h2>
          <p className="text-sm text-muted-foreground">
            Palay is tracked in kilograms only
          </p>
        </div>
        {stockRes.error || stock.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {stockRes.error
                ? "Unable to load palay inventory right now."
                : "No palay inventory yet."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stock.map((row) => (
              <Card key={row.id}>
                <CardContent className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.rice_name}
                    </p>
                    {row.variety ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {row.variety}
                      </p>
                    ) : null}
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {formatNumber(row.quantity_kg)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        KG
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={row.stock_status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
