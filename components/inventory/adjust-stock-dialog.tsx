"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adjustInventory } from "@/app/(dashboard)/inventory/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { formatQty } from "@/lib/format";
import { sackLabel, type StockRow } from "./types";

function signed(value: number): string {
  if (value > 0) return `+${formatQty(value)}`;
  return formatQty(value);
}

export function AdjustStockDialog({
  row,
  open,
  onOpenChange,
}: {
  row: StockRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [sacks, setSacks] = useState(String(row.full_sacks));
  const [loose, setLoose] = useState(String(row.loose_kg));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const newSacks = sacks.trim() === "" ? NaN : Number(sacks);
  const newLoose = loose.trim() === "" ? null : Number(loose);
  const validNumbers =
    Number.isFinite(newSacks) &&
    newSacks >= 0 &&
    (newLoose === null || (Number.isFinite(newLoose) && newLoose >= 0));
  const changed =
    validNumbers &&
    (newSacks !== row.full_sacks ||
      (newLoose !== null && newLoose !== row.loose_kg));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!validNumbers) {
      setError("Stock counts must be zero or greater.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required for inventory adjustments.");
      return;
    }
    if (!changed) {
      setError("This adjustment would not change the stock count.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await adjustInventory({
      rice_product_id: row.rice_product_id,
      sack_size_type: row.sack_size_type,
      sack_size_kg: row.sack_size_kg,
      new_full_sacks: newSacks,
      ...(newLoose !== null ? { new_loose_kg: newLoose } : {}),
      reason: reason.trim(),
      notes: notes.trim(),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      toast.error(result.message);
      return;
    }
    toast.success("Stock adjusted", {
      description: `${row.rice_name} · ${sackLabel(row)}`,
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {row.rice_name} · {sackLabel(row)} — set the physically counted
            level for this sack size.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="adjust-sacks">New full sacks</Label>
              <Input
                id="adjust-sacks"
                type="number"
                min={0}
                step="any"
                value={sacks}
                onChange={(event) => setSacks(event.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adjust-loose">New loose KG</Label>
              <Input
                id="adjust-loose"
                type="number"
                min={0}
                step="any"
                value={loose}
                onChange={(event) => setLoose(event.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Current stock</span>
              <span className="tabular-nums">
                {formatQty(row.full_sacks)} sacks · {formatQty(row.loose_kg)} KG
                loose
              </span>
            </div>
            <div className="flex justify-between gap-3 font-medium">
              <span>After adjustment</span>
              <span className="tabular-nums">
                {validNumbers ? formatQty(newSacks) : "—"} sacks ·{" "}
                {validNumbers ? formatQty(newLoose ?? row.loose_kg) : "—"} KG
                loose
              </span>
            </div>
            {validNumbers ? (
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Change</span>
                <span className="tabular-nums">
                  <span
                    className={
                      newSacks - row.full_sacks < 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  >
                    {signed(newSacks - row.full_sacks)} sacks
                  </span>
                  {newLoose !== null && newLoose !== row.loose_kg ? (
                    <span
                      className={
                        newLoose - row.loose_kg < 0
                          ? "ml-2 text-red-600"
                          : "ml-2 text-emerald-600"
                      }
                    >
                      {signed(newLoose - row.loose_kg)} KG
                    </span>
                  ) : null}
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="adjust-reason">Reason (required)</Label>
            <Input
              id="adjust-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Physical stock count correction"
              maxLength={200}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="adjust-notes">Notes (optional)</Label>
            <Textarea
              id="adjust-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Anything else worth recording"
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
