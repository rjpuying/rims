"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordReject } from "@/app/(dashboard)/inventory/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatQty } from "@/lib/format";
import { sackLabel, type StockRow } from "./types";

export function RejectStockDialog({
  row,
  open,
  onOpenChange,
}: {
  row: StockRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const qty = quantity.trim() === "" ? NaN : Number(quantity);
  const overStock = Number.isFinite(qty) && qty > row.full_sacks;
  const validQty =
    Number.isFinite(qty) && qty > 0 && qty <= row.full_sacks && !overStock;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if (overStock) {
      setError(
        `Only ${formatQty(row.full_sacks)} sacks are available. You entered ${formatQty(qty)}.`,
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await recordReject({
      rice_product_id: row.rice_product_id,
      sack_size_type: row.sack_size_type,
      sack_size_kg: row.sack_size_kg,
      quantity_sacks: qty,
      reason: reason.trim(),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      toast.error(result.message);
      return;
    }
    toast.success("Stock rejected", {
      description: `${formatQty(qty)} sacks · ${row.rice_name} · ${sackLabel(row)}`,
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject stock</DialogTitle>
          <DialogDescription>
            {row.rice_name} · {sackLabel(row)} — rejected sacks move out of
            sellable stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="reject-qty">Quantity (sacks)</Label>
            <Input
              id="reject-qty"
              type="number"
              min={1}
              max={row.full_sacks}
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              inputMode="decimal"
              placeholder={`Up to ${formatQty(row.full_sacks)}`}
            />
            {overStock ? (
              <p className="text-xs font-medium text-red-600">
                Only {formatQty(row.full_sacks)} sacks are available.
              </p>
            ) : null}
          </div>

          <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Available before</span>
              <span className="tabular-nums">
                {formatQty(row.full_sacks)} sacks
              </span>
            </div>
            <div className="flex justify-between gap-3 font-medium">
              <span>Available after</span>
              <span className="tabular-nums">
                {validQty ? formatQty(row.full_sacks - qty) : "—"} sacks
              </span>
            </div>
            <div className="flex justify-between gap-3 font-medium text-red-600">
              <span>Rejected after</span>
              <span className="tabular-nums">
                {validQty
                  ? formatQty(row.rejected_sacks + qty)
                  : formatQty(row.rejected_sacks)}{" "}
                sacks
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Input
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Damaged sacks from delivery"
              maxLength={200}
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !validQty}>
              {submitting ? "Saving..." : "Reject Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
