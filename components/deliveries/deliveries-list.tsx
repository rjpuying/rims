"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatManilaShort, formatNumber, formatPeso } from "@/lib/format";

export type DeliveryItemRow = {
  id: string;
  rice_type: string | null;
  variety: string | null;
  quantity_sacks: number;
  sack_size_type: string;
  sack_size_kg: number;
  price_per_sack: number;
  total_amount: number;
  batch_number: string | null;
  rice_products: { rice_name: string } | null;
};

export type DeliveryRow = {
  id: string;
  transaction_number: string;
  delivery_date: string;
  supplier_name: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  status: string;
  notes: string | null;
  received_by_profile: { full_name: string } | null;
  delivery_items: DeliveryItemRow[];
};

function sackLabel(item: { sack_size_type: string; sack_size_kg: number }): string {
  if (item.sack_size_type === "OTHER") return `${item.sack_size_kg} KG`;
  return item.sack_size_type.replace("KG", " KG");
}

function DeliveryItems({ items }: { items: DeliveryItemRow[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No item details.</p>;
  }
  return (
    <ul className="space-y-1 text-xs">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="font-medium">
              {item.rice_products?.rice_name ?? "Rice"}
            </span>{" "}
            <span className="text-muted-foreground">
              · {sackLabel(item)} · {formatNumber(item.quantity_sacks)} sacks ×{" "}
              {formatPeso(item.price_per_sack)}
              {item.batch_number ? ` · ${item.batch_number}` : ""}
            </span>
          </span>
          <span className="shrink-0 tabular-nums">
            {formatPeso(item.total_amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DeliveriesList({
  rows,
  canCreate,
}: {
  rows: DeliveryRow[];
  canCreate: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium">No deliveries found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Deliveries recorded in this date range will appear here.
          </p>
          {canCreate ? (
            <a
              href="#receive-delivery"
              className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
            >
              Record Delivery
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
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Items</TableHead>
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
                      {formatManilaShort(row.delivery_date)}
                    </TableCell>
                    <TableCell>{row.supplier_name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.delivery_items.length}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPeso(row.total_amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPeso(row.amount_paid)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.payment_status} />
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
                            <DeliveryItems items={row.delivery_items} />
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {row.received_by_profile ? (
                              <p>Received By: {row.received_by_profile.full_name}</p>
                            ) : null}
                            {row.notes ? <p className="mt-1">{row.notes}</p> : null}
                            {row.balance > 0 ? (
                              <p className="mt-1 font-medium text-amber-700">
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
                        {row.supplier_name}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatManilaShort(row.delivery_date)} ·{" "}
                      {row.delivery_items.length}{" "}
                      {row.delivery_items.length === 1 ? "item" : "items"}
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
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <DeliveryItems items={row.delivery_items} />
                    {row.notes || row.received_by_profile ? (
                      <p className="text-xs text-muted-foreground">
                        {row.received_by_profile
                          ? `Received By: ${row.received_by_profile.full_name}`
                          : ""}
                        {row.notes ? ` · ${row.notes}` : ""}
                      </p>
                    ) : null}
                    {row.balance > 0 ? (
                      <p className="text-xs font-medium text-amber-700">
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

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} {rows.length === 1 ? "delivery" : "deliveries"} ·
        tap a row for item details
      </p>
    </div>
  );
}
