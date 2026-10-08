"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Wheat } from "lucide-react";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { RejectStockDialog } from "@/components/inventory/reject-stock-dialog";
import { sackLabel, type StockRow } from "@/components/inventory/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatManilaShort, formatQty } from "@/lib/format";
import { resolveImageUrl } from "@/lib/pos";
import { cn } from "@/lib/utils";

const STATUS_RANK: Record<string, number> = {
  IN_STOCK: 0,
  LOW_STOCK: 1,
  OUT_OF_STOCK: 2,
};

type ProductGroup = {
  rice_product_id: string;
  rice_name: string;
  rice_type: string | null;
  variety: string | null;
  image_url: string | null;
  rows: StockRow[];
  worstStatus: string;
};

function groupRows(rows: StockRow[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();
  for (const row of rows) {
    let group = groups.get(row.rice_product_id);
    if (!group) {
      group = {
        rice_product_id: row.rice_product_id,
        rice_name: row.rice_name,
        rice_type: row.rice_type,
        variety: row.variety,
        image_url: row.image_url,
        rows: [],
        worstStatus: "IN_STOCK",
      };
      groups.set(row.rice_product_id, group);
    }
    group.rows.push(row);
    const current = STATUS_RANK[group.worstStatus] ?? 0;
    if ((STATUS_RANK[row.stock_status] ?? 0) > current) {
      group.worstStatus = row.stock_status;
    }
  }
  return [...groups.values()];
}

function RowActions({
  row,
  canAdjust,
  canReject,
  onAdjust,
  onReject,
  className,
}: {
  row: StockRow;
  canAdjust: boolean;
  canReject: boolean;
  onAdjust: (row: StockRow) => void;
  onReject: (row: StockRow) => void;
  className?: string;
}) {
  if (!canAdjust && !canReject) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {canAdjust ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => onAdjust(row)}
        >
          Adjust
        </Button>
      ) : null}
      {canReject && row.full_sacks > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
          onClick={() => onReject(row)}
        >
          Reject
        </Button>
      ) : null}
    </div>
  );
}

export function StockList({
  rows,
  canAdjust,
  canReject,
  filtered,
}: {
  rows: StockRow[];
  canAdjust: boolean;
  canReject: boolean;
  filtered: boolean;
}) {
  const [adjustFor, setAdjustFor] = useState<StockRow | null>(null);
  const [rejectFor, setRejectFor] = useState<StockRow | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium">
            {filtered ? "No inventory matches your filters." : "No inventory yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered
              ? "Try a different rice, sack size, or stock status."
              : "Stock received through deliveries and palay purchases will appear here."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const groups = groupRows(rows);
  const showActions = canAdjust || canReject;

  return (
    <div className="space-y-3">
      {/* Desktop table */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rice</TableHead>
              <TableHead>Sack Size</TableHead>
              <TableHead className="text-right">Full Sacks</TableHead>
              <TableHead className="text-right">Loose KG</TableHead>
              <TableHead className="text-right">Rejected</TableHead>
              <TableHead>Status</TableHead>
              {showActions ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                      {row.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveImageUrl(row.image_url)}
                          alt={row.rice_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Wheat className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.rice_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[row.rice_type, row.variety].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {sackLabel(row)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatQty(row.full_sacks)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQty(row.loose_kg)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    row.rejected_sacks > 0
                      ? "font-medium text-red-600"
                      : "text-muted-foreground",
                  )}
                >
                  {formatQty(row.rejected_sacks)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.stock_status} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <RowActions
                      row={row}
                      canAdjust={canAdjust}
                      canReject={canReject}
                      onAdjust={setAdjustFor}
                      onReject={setRejectFor}
                      className="justify-end"
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {groups.map((group) => {
          const expanded = expandedProduct === group.rice_product_id;
          return (
            <Card key={group.rice_product_id} className="py-0">
              <CardContent className="px-4 py-3">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() =>
                    setExpandedProduct(expanded ? null : group.rice_product_id)
                  }
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                    {group.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveImageUrl(group.image_url)}
                        alt={group.rice_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Wheat className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {group.rice_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[group.rice_type, group.variety]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <StatusBadge status={group.worstStatus} />
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {group.rows.map((row) => {
                        const rejected = Number(row.rejected_sacks ?? 0);
                        return (
                          <li
                            key={row.id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-medium tabular-nums">
                              {sackLabel(row)}
                            </span>
                            <span className="truncate text-right text-muted-foreground tabular-nums">
                              {formatQty(row.full_sacks)} sacks
                              {Number(row.loose_kg) > 0
                                ? ` + ${formatQty(row.loose_kg)} KG loose`
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
                </button>

                {expanded ? (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {group.rows.map((row) => (
                      <div
                        key={`${row.id}-detail`}
                        className="space-y-2 rounded-md border bg-muted/40 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium">{sackLabel(row)}</span>
                          <StatusBadge status={row.stock_status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {row.low_stock_threshold > 0
                            ? `Low-stock threshold: ${formatQty(row.low_stock_threshold)} sacks · `
                            : ""}
                          Updated {formatManilaShort(row.updated_at)}
                        </p>
                        <RowActions
                          row={row}
                          canAdjust={canAdjust}
                          canReject={canReject}
                          onAdjust={setAdjustFor}
                          onReject={setRejectFor}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {adjustFor ? (
        <AdjustStockDialog
          key={adjustFor.id}
          row={adjustFor}
          open
          onOpenChange={(open) => {
            if (!open) setAdjustFor(null);
          }}
        />
      ) : null}
      {rejectFor ? (
        <RejectStockDialog
          key={rejectFor.id}
          row={rejectFor}
          open
          onOpenChange={(open) => {
            if (!open) setRejectFor(null);
          }}
        />
      ) : null}
    </div>
  );
}
