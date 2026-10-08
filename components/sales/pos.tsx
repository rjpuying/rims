"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Wheat } from "lucide-react";
import { toast } from "sonner";
import { createSale } from "@/app/(dashboard)/sales/actions";
import { PosConfirmDialog } from "@/components/sales/pos-confirm-dialog";
import { PosItemDialog } from "@/components/sales/pos-item-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  cartItemDiscounts,
  cartSubtotal,
  lineTotal,
  resolveImageUrl,
  simulateCart,
  type CatalogProduct,
  type CartItem,
} from "@/lib/pos";
import { paymentMethods, paymentMethodLabels } from "@/lib/validations/sale";

function num(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function Pos({
  catalog,
  processedByName,
}: {
  catalog: CatalogProduct[];
  processedByName: string;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    (typeof paymentMethods)[number]
  >("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editor, setEditor] = useState<
    { product: CatalogProduct; initial: CartItem | null } | null
  >(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const subtotal = cartSubtotal(items);
  const itemDiscounts = cartItemDiscounts(items);
  const discountAmount = num(orderDiscount);
  const total =
    Math.round((subtotal - itemDiscounts - discountAmount) * 100) / 100;
  const paid = num(amountPaid);
  const balance = Math.round((total - paid) * 100) / 100;

  const outOfStock = useMemo(
    () =>
      new Set(
        catalog
          .filter(
            (product) =>
              product.stock.every(
                (entry) => entry.full_sacks === 0 && entry.loose_kg === 0,
              ),
          )
          .map((product) => product.id),
      ),
    [catalog],
  );

  function resetForm() {
    setCustomer("");
    setItems([]);
    setOrderDiscount("");
    setPaymentMethod("CASH");
    setAmountPaid("");
    setError(null);
  }

  function validate(): string | null {
    if (items.length === 0) {
      return "Add at least one item to this sale.";
    }
    if (discountAmount > subtotal - itemDiscounts) {
      return "Discount cannot exceed the sale total.";
    }
    if (paid > total) {
      return "Amount paid cannot exceed the sale total.";
    }
    if (balance > 0 && customer.trim().length === 0) {
      return "Customer name is required for credit sales.";
    }
    const simulation = simulateCart(catalog, items);
    const failed = simulation.find((preview) => !preview.ok);
    if (failed) {
      return failed.message ?? "This sale exceeds available inventory.";
    }
    return null;
  }

  function handleOpenConfirm() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createSale({
        customer_name: customer.trim() || undefined,
        payment_method: paymentMethod,
        amount_paid: paid,
        discount_amount: discountAmount,
        items: items.map((item) => ({
          rice_product_id: item.rice_product_id,
          selling_method: item.selling_method,
          sack_size_type: item.sack_size_type,
          sack_size_kg: item.sack_size_kg,
          quantity_sacks: item.quantity_sacks,
          quantity_kg: item.quantity_kg,
          price_per_sack: item.price_per_sack,
          price_per_kg: item.price_per_kg,
          discount: item.discount,
        })),
      });

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        setConfirmOpen(false);
        return;
      }

      toast.success(`Sale ${result.data.transaction_number} completed`, {
        description: `${formatPeso(result.data.total_amount)} · ${paymentMethodLabels[paymentMethod]}`,
      });
      setConfirmOpen(false);
      resetForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card id="pos" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="text-base">New Sale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer Name</Label>
              <Input
                id="customer"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                placeholder="Optional for cash sales"
                maxLength={120}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Select Rice</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {catalog.map((product) => {
                  const looseTotal = product.stock.reduce(
                    (sum, entry) => sum + entry.loose_kg,
                    0,
                  );
                  const soldOut = outOfStock.has(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setEditor({ product, initial: null })}
                      className="group rounded-lg border bg-card p-3 text-left transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-2 flex h-16 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImageUrl(product.image_url)}
                            alt={product.rice_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Wheat className="h-6 w-6" />
                        )}
                      </div>
                      <p className="truncate text-sm font-medium">
                        {product.rice_name}
                      </p>
                      {product.variety ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {product.variety}
                        </p>
                      ) : null}
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {product.stock.map((entry) => (
                          <p key={entry.sack_size_kg} className="tabular-nums">
                            {entry.sack_size_kg} KG — {entry.full_sacks} sacks
                          </p>
                        ))}
                        {looseTotal > 0 ? (
                          <p className="tabular-nums">Loose — {looseTotal} KG</p>
                        ) : null}
                        {soldOut ? (
                          <p className="font-medium text-red-600">Out of stock</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
                {catalog.length === 0 ? (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    No rice products available.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Selected Items</p>
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No items yet. Tap a rice product to add it.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-start gap-2 rounded-md border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.rice_name}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {item.sack_size_kg} KG ·{" "}
                          {item.selling_method === "PER_SACK"
                            ? `${item.quantity_sacks} sacks × ${formatPeso(item.price_per_sack)}`
                            : `${item.quantity_kg} KG × ${formatPeso(item.price_per_kg)}`}
                          {item.discount > 0
                            ? ` · −${formatPeso(item.discount)}`
                            : ""}
                        </p>
                        <p className="mt-0.5 text-sm font-medium tabular-nums">
                          {formatPeso(lineTotal(item))}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${item.rice_name}`}
                          onClick={() => {
                            const product = catalog.find(
                              (entry) => entry.id === item.rice_product_id,
                            );
                            if (product) {
                              setEditor({ product, initial: item });
                            }
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${item.rice_name}`}
                          onClick={() =>
                            setItems((prev) =>
                              prev.filter((entry) => entry.key !== item.key),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3 rounded-md border bg-muted/40 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatPeso(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item discounts</span>
                <span className="tabular-nums">
                  −{formatPeso(itemDiscounts)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <Label htmlFor="order-discount" className="text-muted-foreground">
                  Discount
                </Label>
                <Input
                  id="order-discount"
                  inputMode="decimal"
                  value={orderDiscount}
                  onChange={(event) => setOrderDiscount(event.target.value)}
                  placeholder="0.00"
                  className="h-8 w-28 text-right tabular-nums"
                />
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPeso(total)}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(
                      value as (typeof paymentMethods)[number],
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {paymentMethodLabels[method]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount-paid">Amount Paid</Label>
                <Input
                  id="amount-paid"
                  inputMode="decimal"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  placeholder="0.00"
                  className="tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Balance</span>
              <span
                className={
                  balance > 0
                    ? "font-medium tabular-nums text-amber-700"
                    : "font-medium tabular-nums text-emerald-700"
                }
              >
                {formatPeso(Math.max(balance, 0))}
                {balance > 0 ? " (credit)" : ""}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Processed By: <span className="font-medium">{processedByName}</span>
            </p>

            {error ? (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={submitting}
              onClick={handleOpenConfirm}
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </CardContent>

      {editor ? (
        <PosItemDialog
          key={`${editor.product.id}:${editor.initial?.key ?? "new"}`}
          product={editor.product}
          initial={editor.initial}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onCommit={(item) => {
            setItems((prev) => {
              const exists = prev.some((entry) => entry.key === item.key);
              if (exists) {
                return prev.map((entry) => (entry.key === item.key ? item : entry));
              }
              return [...prev, item];
            });
            setError(null);
            setEditor(null);
          }}
        />
      ) : null}

      {confirmOpen ? (
        <PosConfirmDialog
          catalog={catalog}
          items={items}
          paymentMethod={paymentMethod}
          amountPaid={paid}
          total={total}
          balance={balance}
          submitting={submitting}
          onOpenChange={setConfirmOpen}
          onConfirm={() => void handleConfirm()}
        />
      ) : null}
    </Card>
  );
}
