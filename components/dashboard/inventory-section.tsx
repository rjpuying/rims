import { Wheat } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { can, requireUser } from "@/lib/auth";
import { formatQty } from "@/lib/format";
import { resolveImageUrl } from "@/lib/pos";
import { createClient } from "@/lib/supabase/server";

type InventoryRow = {
  rice_product_id: string;
  rice_name: string;
  variety: string | null;
  image_url: string | null;
  sack_size_kg: number;
  full_sacks: number;
  loose_kg: number;
  rejected_sacks: number;
  stock_status: string;
};

type ProductGroup = {
  rice_product_id: string;
  rice_name: string;
  variety: string | null;
  image_url: string | null;
  rows: InventoryRow[];
  worstStatus: string;
};

const STATUS_RANK: Record<string, number> = {
  IN_STOCK: 0,
  LOW_STOCK: 1,
  OUT_OF_STOCK: 2,
};

export async function InventorySection() {
  const user = await requireUser();
  if (!can(user, "inventory.view")) return null;

  const supabase = await createClient();
  const res = await supabase
    .from("v_current_rice_inventory")
    .select(
      "rice_product_id, rice_name, variety, image_url, sack_size_kg, full_sacks, loose_kg, rejected_sacks, stock_status",
    )
    .order("rice_name")
    .order("sack_size_kg");

  if (res.error) throw new Error(res.error.message);

  const groups = new Map<string, ProductGroup>();
  for (const raw of res.data ?? []) {
    const row = raw as InventoryRow;
    let group = groups.get(row.rice_product_id);
    if (!group) {
      group = {
        rice_product_id: row.rice_product_id,
        rice_name: row.rice_name,
        variety: row.variety,
        image_url: row.image_url,
        rows: [],
        worstStatus: "IN_STOCK",
      };
      groups.set(row.rice_product_id, group);
    }
    group.rows.push(row);
    const currentRank = STATUS_RANK[group.worstStatus] ?? 0;
    const rowRank = STATUS_RANK[row.stock_status] ?? 0;
    if (rowRank > currentRank) group.worstStatus = row.stock_status;
  }

  const products = [...groups.values()];

  return (
    <section aria-label="Inventory">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Current stock by sack size
          </p>
        </div>
        <Link
          href="/inventory"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No inventory yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((group) => (
            <Card key={group.rice_product_id}>
              <CardContent className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                  {group.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(group.image_url)}
                      alt={group.rice_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Wheat className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {group.rice_name}
                    </p>
                    <StatusBadge status={group.worstStatus} />
                  </div>
                  {group.variety ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {group.variety}
                    </p>
                  ) : null}
                  <ul className="mt-2 space-y-1">
                    {group.rows.map((row) => {
                      const rejected = Number(row.rejected_sacks ?? 0);
                      return (
                        <li
                          key={`${row.rice_product_id}-${row.sack_size_kg}`}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-medium tabular-nums">
                            {formatQty(row.sack_size_kg)} KG
                          </span>
                          <span className="truncate text-right text-muted-foreground tabular-nums">
                            {formatQty(row.full_sacks)} sacks
                            {Number(row.loose_kg) > 0
                              ? ` + ${formatQty(row.loose_kg)} kg loose`
                              : ""}
                            {rejected > 0 ? (
                              <span className="text-red-600">
                                {" "}
                                · {formatQty(rejected)} rejected
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function InventorySectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full" />
      ))}
    </div>
  );
}
