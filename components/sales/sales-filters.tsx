"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { paymentMethods, paymentMethodLabels } from "@/lib/validations/sale";

export type SalesFilterValues = {
  from: string;
  to: string;
  customer: string;
  payment: string;
};

export function SalesFilters({ current }: { current: SalesFilterValues }) {
  const router = useRouter();
  const [payment, setPayment] = useState(current.payment);

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const from = String(data.get("from") ?? "").trim();
    const to = String(data.get("to") ?? "").trim();
    const customer = String(data.get("customer") ?? "").trim();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (customer) params.set("customer", customer);
    if (payment) params.set("payment", payment);
    router.replace(`/sales${params.size > 0 ? `?${params}` : ""}`);
  }

  function reset() {
    setPayment("");
    router.replace("/sales");
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3 rounded-md border p-3"
    >
      <div className="space-y-1">
        <Label htmlFor="filter-from" className="text-xs">
          From
        </Label>
        <Input
          id="filter-from"
          name="from"
          type="date"
          defaultValue={current.from}
          className="h-9 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-to" className="text-xs">
          To
        </Label>
        <Input
          id="filter-to"
          name="to"
          type="date"
          defaultValue={current.to}
          className="h-9 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-customer" className="text-xs">
          Customer
        </Label>
        <Input
          id="filter-customer"
          name="customer"
          defaultValue={current.customer}
          placeholder="Any customer"
          className="h-9 w-44"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Payment</Label>
        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {paymentMethodLabels[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-9">
          Apply Filters
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-9" onClick={reset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
