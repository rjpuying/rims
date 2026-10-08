"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPeso } from "@/lib/format";
import { stockFor, type CatalogProduct, type CartItem } from "@/lib/pos";

function num(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PosItemDialog({
  product,
  initial,
  onOpenChange,
  onCommit,
}: {
  product: CatalogProduct;
  initial: CartItem | null;
  onOpenChange: (open: boolean) => void;
  onCommit: (item: CartItem) => void;
}) {
  const firstStock = product.stock[0];
  const [method, setMethod] = useState<"PER_SACK" | "PER_KG">(
    initial?.selling_method ?? "PER_SACK",
  );
  const [sizeKg, setSizeKg] = useState<string>(
    initial ? String(initial.sack_size_kg) : String(firstStock?.sack_size_kg ?? ""),
  );
  const [quantity, setQuantity] = useState(
    initial
      ? initial.selling_method === "PER_SACK"
        ? String(initial.quantity_sacks)
        : String(initial.quantity_kg)
      : "",
  );
  const [price, setPrice] = useState(
    initial
      ? initial.selling_method === "PER_SACK"
        ? String(initial.price_per_sack)
        : String(initial.price_per_kg)
      : "",
  );
  const [discount, setDiscount] = useState(
    initial ? String(initial.discount) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const stock = useMemo(
    () => stockFor(product, Number(sizeKg)),
    [product, sizeKg],
  );

  const line =
    method === "PER_SACK"
      ? Math.round(num(quantity) * num(price) * 100) / 100
      : Math.round(num(quantity) * num(price) * 100) / 100;

  function handleCommit() {
    const qty = num(quantity);
    const unitPrice = num(price);
    const disc = num(discount);

    if (!stock) {
      setError("Select a valid sack size.");
      return;
    }
    if (qty <= 0) {
      setError(
        method === "PER_SACK"
          ? "Quantity must be greater than zero."
          : "Quantity in KG must be greater than zero.",
      );
      return;
    }
    if (unitPrice <= 0) {
      setError(
        method === "PER_SACK"
          ? "Price per sack must be greater than zero."
          : "Price per KG must be greater than zero.",
      );
      return;
    }
    if (disc > line) {
      setError("Line discount cannot exceed the line total.");
      return;
    }
    if (method === "PER_SACK" && qty > stock.full_sacks) {
      setError(
        `Only ${stock.full_sacks} sacks are available. You entered ${qty}.`,
      );
      return;
    }
    if (method === "PER_KG") {
      const totalKg = stock.full_sacks * stock.sack_size_kg + stock.loose_kg;
      if (qty > totalKg) {
        setError(`Only ${totalKg} KG is available. You entered ${qty} KG.`);
        return;
      }
    }

    onCommit({
      key: initial?.key ?? crypto.randomUUID(),
      rice_product_id: product.id,
      rice_name: product.rice_name,
      selling_method: method,
      sack_size_type: stock.sack_size_type,
      sack_size_kg: stock.sack_size_kg,
      quantity_sacks: method === "PER_SACK" ? qty : 0,
      quantity_kg: method === "PER_KG" ? qty : 0,
      price_per_sack: method === "PER_SACK" ? unitPrice : 0,
      price_per_kg: method === "PER_KG" ? unitPrice : 0,
      discount: disc,
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit item" : "Add item"} · {product.rice_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Selling Method</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as "PER_SACK" | "PER_KG")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_SACK">Per Sack</SelectItem>
                  <SelectItem value="PER_KG">Per KG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sack Size</Label>
              <Select value={sizeKg} onValueChange={setSizeKg}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product.stock.map((entry) => (
                    <SelectItem key={entry.sack_size_kg} value={String(entry.sack_size_kg)}>
                      {entry.sack_size_type === "OTHER"
                        ? `${entry.sack_size_kg} kg`
                        : `${entry.sack_size_kg} KG`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {stock ? (
            <p className="text-xs text-muted-foreground">
              Available: {stock.full_sacks} sacks
              {stock.loose_kg > 0 ? ` + ${stock.loose_kg} KG loose` : ""}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">
                {method === "PER_SACK" ? "Quantity (sacks)" : "Quantity (KG)"}
              </Label>
              <Input
                id="qty"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">
                {method === "PER_SACK" ? "Price per sack" : "Price per KG"}
              </Label>
              <Input
                id="price"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                inputMode="decimal"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Line Total</Label>
              <div className="flex h-9 items-center rounded-md border border-dashed px-3 text-sm font-medium tabular-nums">
                {formatPeso(line)}
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCommit}>
            {initial ? "Update item" : "Add to sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
