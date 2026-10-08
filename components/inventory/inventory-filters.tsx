"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { sackSizeLabels, stockStatuses } from "@/lib/validations/inventory";
import { statusLabel } from "@/components/shared/status-badge";

export type InventoryFilterValues = {
  rice: string;
  size: string;
  status: string;
};

export function InventoryFilters({
  products,
  current,
}: {
  products: { id: string; rice_name: string }[];
  current: InventoryFilterValues;
}) {
  const router = useRouter();

  function apply(next: Partial<InventoryFilterValues>) {
    const merged = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.rice) params.set("rice", merged.rice);
    if (merged.size) params.set("size", merged.size);
    if (merged.status) params.set("status", merged.status);
    router.replace(`/inventory${params.size > 0 ? `?${params}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border p-3">
      <div className="space-y-1">
        <Label className="text-xs">Rice</Label>
        <Select
          value={current.rice || "all"}
          onValueChange={(value) => apply({ rice: value === "all" ? "" : value })}
        >
          <SelectTrigger className="h-9 w-44">
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
      <div className="space-y-1">
        <Label className="text-xs">Sack Size</Label>
        <Select
          value={current.size || "all"}
          onValueChange={(value) => apply({ size: value === "all" ? "" : value })}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sizes</SelectItem>
            {Object.entries(sackSizeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Stock Status</Label>
        <Select
          value={current.status || "all"}
          onValueChange={(value) => apply({ status: value === "all" ? "" : value })}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {stockStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9"
        onClick={() => apply({ rice: "", size: "", status: "" })}
      >
        Reset
      </Button>
    </div>
  );
}
