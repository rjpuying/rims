"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { receiveDelivery } from "@/app/(dashboard)/deliveries/actions";
import { PaymentSummary } from "@/components/shared/payment-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPeso, manilaDateISO } from "@/lib/format";
import { sackSizeLabels } from "@/lib/validations/inventory";
import { sackSizeTypes } from "@/lib/validations/sale";

export type FormProduct = {
  id: string;
  rice_name: string;
  rice_type: string | null;
  variety: string | null;
};

function num(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

export function ReceiveDeliveryForm({
  products,
  receivedBy,
}: {
  products: FormProduct[];
  receivedBy: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(manilaDateISO());
  const [supplier, setSupplier] = useState("");
  const [riceId, setRiceId] = useState("");
  const [batch, setBatch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sackType, setSackType] = useState<(typeof sackSizeTypes)[number]>("25KG");
  const [otherKg, setOtherKg] = useState("");
  const [price, setPrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const product = products.find((candidate) => candidate.id === riceId);
  const qty = num(quantity);
  const pricePerSack = num(price);
  const paid = amountPaid.trim() === "" ? 0 : num(amountPaid);
  const total =
    Number.isFinite(qty) && Number.isFinite(pricePerSack)
      ? qty * pricePerSack
      : 0;
  const validPaid = Number.isFinite(paid) && paid >= 0 && paid <= total;
  const sackSizeKg =
    sackType === "OTHER" ? (num(otherKg) || 0) : Number(sackType.replace("KG", ""));

  function reset() {
    setSupplier("");
    setRiceId("");
    setBatch("");
    setQuantity("");
    setSackType("25KG");
    setOtherKg("");
    setPrice("");
    setAmountPaid("");
    setNotes("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!date) {
      setError("Enter a valid date.");
      return;
    }
    if (!supplier.trim()) {
      setError("Supplier name is required.");
      return;
    }
    if (!product) {
      setError("Select a rice product.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if (!Number.isFinite(pricePerSack) || pricePerSack < 0) {
      setError("Price per sack must be zero or greater.");
      return;
    }
    if (sackType === "OTHER" && (!Number.isFinite(sackSizeKg) || sackSizeKg <= 0)) {
      setError("Enter the sack size in KG.");
      return;
    }
    if (!validPaid) {
      setError("Amount paid cannot exceed the delivery total.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await receiveDelivery({
      delivery_date: date,
      supplier_name: supplier.trim(),
      amount_paid: paid,
      notes: notes.trim(),
      rice_product_id: product.id,
      sack_size_type: sackType,
      sack_size_kg: sackSizeKg,
      quantity_sacks: qty,
      price_per_sack: pricePerSack,
      batch_number: batch.trim(),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      toast.error(result.message);
      return;
    }
    toast.success(`Delivery ${result.data.transaction_number} saved`, {
      description: `${quantity} sacks · ${product.rice_name} · ${formatPeso(result.data.total_amount)}`,
    });
    reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Receive delivery</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="del-date">Date</Label>
              <Input
                id="del-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="del-supplier">Supplier Name</Label>
              <Input
                id="del-supplier"
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                placeholder="e.g. Nueva Ecija Traders"
                maxLength={120}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Rice</Label>
              <Select value={riceId} onValueChange={setRiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rice" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.rice_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {product ? (
                <p className="text-xs text-muted-foreground">
                  {[product.rice_type, product.variety]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="del-batch">Batch Number (optional)</Label>
              <Input
                id="del-batch"
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                placeholder="e.g. BATCH-042"
                maxLength={80}
              />
            </div>
            <div className="space-y-1">
              <Label>Sack Size</Label>
              <div className="flex gap-2">
                <Select
                  value={sackType}
                  onValueChange={(value) =>
                    setSackType(value as (typeof sackSizeTypes)[number])
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sackSizeTypes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {sackSizeLabels[size]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sackType === "OTHER" ? (
                  <Input
                    type="number"
                    min={1}
                    step="any"
                    value={otherKg}
                    onChange={(event) => setOtherKg(event.target.value)}
                    placeholder="Actual KG"
                    className="w-32"
                    inputMode="decimal"
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="del-qty">Quantity (sacks)</Label>
              <Input
                id="del-qty"
                type="number"
                min={1}
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="del-price">Price per Sack</Label>
              <Input
                id="del-price"
                type="number"
                min={0}
                step="any"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="del-paid">Amount Paid</Label>
              <Input
                id="del-paid"
                type="number"
                min={0}
                step="any"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="del-notes">Notes (optional)</Label>
              <Textarea
                id="del-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Anything worth recording"
              />
            </div>
          </div>

          <PaymentSummary total={total} paid={validPaid ? paid : 0} receivedBy={receivedBy} />

          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? "Saving..." : "Save Delivery"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
