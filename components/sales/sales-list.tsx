"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatManilaShort, formatPeso } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/validations/sale";
import { StatusBadge, statusLabel } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

export type SaleItemRow = {
  id: string;
  rice_name_snapshot: string;
  selling_method: string;
  sack_size_kg: number;
  quantity_sacks: number;
  quantity_kg: number;
  price_per_sack: number;
  price_per_kg: number;
  line_total: number;
};

export type SaleRow = {
  id: string;
  transaction_number: string;
  sale_date: string;
  customer_name: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  payment_method: string;
  status: string;
  items: SaleItemRow[];
};

function itemSummary(item: SaleItemRow): string {
  const qty =
    item.selling_method === "PER_SACK"
      ? `${item.quantity_sacks} sacks`
      : `${item.quantity_kg} KG`;
  const price =
    item.selling_method === "PER_SACK"
      ? formatPeso(item.price_per_sack)
      : formatPeso(item.price_per_kg);
  return `${qty} × ${price}`;
}

function SaleItems({ items }: { items: SaleItemRow[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No item details.</p>;
  }
  return (
    <ul className="space-y-1 text-xs">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start justify-between gap-3"
        >
          <span className="min-w-0">
            <span className="font-medium">{item.rice_name_snapshot}</span>{" "}
            <span className="text-muted-foreground">
              · {item.sack_size_kg} KG · {itemSummary(item)}
            </span>
          </span>
          <span className="shrink-0 tabular-nums">
            {formatPeso(item.line_total)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SalesList({
  rows,
  canCreate,
}: {
  rows: SaleRow[];
  canCreate: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium">No sales yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales recorded today will appear here.
          </p>
          {canCreate ? (
            <a
              href="#pos"
              className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
            >
              Create Sale
            </a>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Transaction #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const expanded = expandedId === row.id;
              return (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                  >
                    <TableCell className="pr-0">
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.transaction_number}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatManilaShort(row.sale_date)}
                    </TableCell>
                    <TableCell>{row.customer_name ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.items.length}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPeso(row.total_amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPeso(row.amount_paid)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {row.status !== "COMPLETED" ? (
                          <StatusBadge status={row.status} />
                        ) : null}
                        <StatusBadge status={row.payment_status} />
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded ? (
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={8} className="py-3">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Items
                            </p>
                            <SaleItems items={row.items} />
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>
                              Payment:{" "}
                              {paymentMethodLabels[
                                row.payment_method as keyof typeof paymentMethodLabels
                              ] ?? statusLabel(row.payment_method)}
                            </p>
                            {row.balance > 0 ? (
                              <p className="font-medium text-amber-700">
                                Balance: {formatPeso(row.balance)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {rows.map((row) => {
          const expanded = expandedId === row.id;
          return (
            <Card key={row.id} className="py-3">
              <CardContent className="px-4 py-0">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.transaction_number}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {row.customer_name ?? "Walk-in"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatManilaShort(row.sale_date)} · {row.items.length}{" "}
                      {row.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatPeso(row.total_amount)}
                    </p>
                    <div className="mt-1 flex justify-end">
                      <StatusBadge status={row.payment_status} />
                    </div>
                  </div>
                </button>
                {expanded ? (
                  <div className="mt-3 border-t pt-3">
                    <SaleItems items={row.items} />
                    {row.balance > 0 ? (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Balance: {formatPeso(row.balance)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className={cn("text-xs text-muted-foreground")}>
        Showing {rows.length} {rows.length === 1 ? "sale" : "sales"} · tap a row
        for item details
      </p>
    </div>
  );
}
