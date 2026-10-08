"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { receivePalay } from "@/app/(dashboard)/palay/actions";
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
import { formatNumber, formatPeso, manilaDateISO } from "@/lib/format";

export type FormProduct = {
  id: string;
  rice_name: string;
  rice_type: string | null;
  variety: string | null;
};

function num(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

export function ReceivePalayForm({
  products,
  receivedBy,
}: {
  products: FormProduct[];
  receivedBy: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(manilaDateISO());
  const [farmer, setFarmer] = useState("");
  const [riceId, setRiceId] = useState("");
  const [variety, setVariety] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const product = products.find((candidate) => candidate.id === riceId);
  const kg = num(quantityKg);
  const price = num(pricePerKg);
  const paid = amountPaid.trim() === "" ? 0 : num(amountPaid);
  const total = Number.isFinite(kg) && Number.isFinite(price) ? kg * price : 0;
  const validPaid = Number.isFinite(paid) && paid >= 0 && paid <= total;

  function reset() {
    setFarmer("");
    setRiceId("");
    setVariety("");
    setQuantityKg("");
    setPricePerKg("");
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
    if (!farmer.trim()) {
      setError("Farmer name is required.");
      return;
    }
    if (!product) {
      setError("Select a rice product.");
      return;
    }
    if (!Number.isFinite(kg) || kg <= 0) {
      setError("Quantity in KG must be greater than zero.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Price per KG must be zero or greater.");
      return;
    }
    if (!validPaid) {
      setError("Amount paid cannot exceed the receipt total.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await receivePalay({
      receipt_date: date,
      farmer_name: farmer.trim(),
      amount_paid: paid,
      notes: notes.trim(),
      rice_product_id: product.id,
      variety: variety.trim(),
      quantity_kg: kg,
      price_per_kg: price,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      toast.error(result.message);
      return;
    }
    toast.success(`Palay receipt ${result.data.transaction_number} saved`, {
      description: `${formatNumber(result.data.total_kg)} KG · ${product.rice_name} · ${formatPeso(result.data.total_amount)}`,
    });
    reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Receive palay</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pal-date">Date</Label>
              <Input
                id="pal-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pal-farmer">Farmer Name</Label>
              <Input
                id="pal-farmer"
                value={farmer}
                onChange={(event) => setFarmer(event.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                maxLength={120}
              />
            </div>

            <div className="space-y-1">
              <Label>Rice Name</Label>
              <Select
                value={riceId}
                onValueChange={(value) => {
                  setRiceId(value);
                  const selected = products.find(
                    (candidate) => candidate.id === value,
                  );
                  if (selected) setVariety(selected.variety ?? "");
                }}
              >
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
            </div>
            <div className="space-y-1">
              <Label htmlFor="pal-variety">Variety</Label>
              <Input
                id="pal-variety"
                value={variety}
                onChange={(event) => setVariety(event.target.value)}
                placeholder="e.g. Dinorado"
                maxLength={80}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pal-kg">Quantity (KG)</Label>
              <Input
                id="pal-kg"
                type="number"
                min={1}
                step="any"
                value={quantityKg}
                onChange={(event) => setQuantityKg(event.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pal-price">Price per KG</Label>
              <Input
                id="pal-price"
                type="number"
                min={0}
                step="any"
                value={pricePerKg}
                onChange={(event) => setPricePerKg(event.target.value)}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pal-paid">Amount Paid</Label>
              <Input
                id="pal-paid"
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
              <Label htmlFor="pal-notes">Notes (optional)</Label>
              <Textarea
                id="pal-notes"
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
            {submitting ? "Saving..." : "Save Palay Receipt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
