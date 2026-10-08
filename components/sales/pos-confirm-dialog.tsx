"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatPeso } from "@/lib/format";
import { paymentMethodLabels, type paymentMethods } from "@/lib/validations/sale";
import {
  lineBefore,
  simulateCart,
  type CatalogProduct,
  type CartItem,
} from "@/lib/pos";

export function PosConfirmDialog({
  catalog,
  items,
  paymentMethod,
  amountPaid,
  total,
  balance,
  submitting,
  onOpenChange,
  onConfirm,
}: {
  catalog: CatalogProduct[];
  items: CartItem[];
  paymentMethod: (typeof paymentMethods)[number];
  amountPaid: number;
  total: number;
  balance: number;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const previews = simulateCart(catalog, items);

  return (
    <Dialog open onOpenChange={(open) => !submitting && onOpenChange(open)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Sale</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {previews.map((preview) => {
            const item = preview.item;
            return (
              <div
                key={item.key}
                className="rounded-md border p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.rice_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sack_size_kg} KG ·{" "}
                      {item.selling_method === "PER_SACK"
                        ? `${item.quantity_sacks} sacks × ${formatPeso(item.price_per_sack)}`
                        : `${item.quantity_kg} KG × ${formatPeso(item.price_per_kg)}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatPeso(lineBefore(item) - item.discount)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-muted px-2 py-1.5">
                    <span className="text-muted-foreground">Current stock</span>
                    <p className="font-medium tabular-nums">
                      {preview.before.sacks} sacks
                      {item.selling_method === "PER_KG"
                        ? ` + ${preview.before.loose} KG loose`
                        : ""}
                    </p>
                  </div>
                  <div className="rounded bg-muted px-2 py-1.5">
                    <span className="text-muted-foreground">After sale</span>
                    <p
                      className={
                        preview.ok
                          ? "font-medium tabular-nums"
                          : "font-medium tabular-nums text-destructive"
                      }
                    >
                      {preview.ok ? (
                        <>
                          {preview.after.sacks} sacks
                          {item.selling_method === "PER_KG"
                            ? ` + ${preview.after.loose} KG loose`
                            : ""}
                        </>
                      ) : (
                        (preview.message ?? "Unavailable")
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold tabular-nums">{formatPeso(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="tabular-nums">
              {formatPeso(amountPaid)}{" "}
              <span className="text-muted-foreground">
                · {paymentMethodLabels[paymentMethod]}
              </span>
            </dd>
          </div>
          {balance > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Balance (credit)</dt>
              <dd className="font-medium tabular-nums text-amber-700">
                {formatPeso(balance)}
              </dd>
            </div>
          ) : null}
        </dl>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={onConfirm}>
            {submitting ? "Processing…" : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
