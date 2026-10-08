"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { statusLabel } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ReceivingFilterValues = {
  from: string;
  to: string;
  party: string;
  rice: string;
  payment: string;
};

const PAYMENT_OPTIONS = ["PAID", "PARTIALLY_PAID", "UNPAID"] as const;

export function ReceivingFilters({
  current,
  partyKey,
  partyLabel,
  partyPlaceholder,
  products,
}: {
  current: ReceivingFilterValues;
  partyKey: "supplier" | "farmer";
  partyLabel: string;
  partyPlaceholder: string;
  products: { id: string; rice_name: string }[];
}) {
  const router = useRouter();
  const [rice, setRice] = useState(current.rice);
  const [payment, setPayment] = useState(current.payment);
  const path = partyKey === "supplier" ? "/deliveries" : "/palay";

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const from = String(data.get("from") ?? "").trim();
    const to = String(data.get("to") ?? "").trim();
    const party = String(data.get("party") ?? "").trim();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (party) params.set(partyKey, party);
    if (rice) params.set("rice", rice);
    if (payment) params.set("payment", payment);
    router.replace(`${path}${params.size > 0 ? `?${params}` : ""}`);
  }

  function reset() {
    setRice("");
    setPayment("");
    router.replace(path);
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3 rounded-md border p-3"
    >
      <div className="space-y-1">
        <Label htmlFor="recv-from" className="text-xs">
          From
        </Label>
        <Input
          id="recv-from"
          name="from"
          type="date"
          defaultValue={current.from}
          className="h-9 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="recv-to" className="text-xs">
          To
        </Label>
        <Input
          id="recv-to"
          name="to"
          type="date"
          defaultValue={current.to}
          className="h-9 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="recv-party" className="text-xs">
          {partyLabel}
        </Label>
        <Input
          id="recv-party"
          name="party"
          defaultValue={current.party}
          placeholder={partyPlaceholder}
          className="h-9 w-44"
        />
      </div>
      {products.length > 0 ? (
        <div className="space-y-1">
          <Label className="text-xs">Rice</Label>
          <Select value={rice || "all"} onValueChange={(v) => setRice(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="All rice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rice</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.rice_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="space-y-1">
        <Label className="text-xs">Payment</Label>
        <Select
          value={payment || "all"}
          onValueChange={(v) => setPayment(v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PAYMENT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {statusLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-9">
          Apply Filters
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9"
          onClick={reset}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
