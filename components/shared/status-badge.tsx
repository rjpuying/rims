import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

const STATUS_STYLES: Record<string, string> = {
  IN_STOCK: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  LOW_STOCK: "border-amber-200 bg-amber-50 text-amber-700",
  PARTIALLY_PAID: "border-amber-200 bg-amber-50 text-amber-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  OUT_OF_STOCK: "border-red-200 bg-red-50 text-red-700",
  UNPAID: "border-red-200 bg-red-50 text-red-700",
  OPEN: "border-red-200 bg-red-50 text-red-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  VOIDED: "border-zinc-200 bg-zinc-50 text-zinc-600",
  INACTIVE: "border-zinc-200 bg-zinc-50 text-zinc-600",
  DELIVERY_RECEIVED: "border-sky-200 bg-sky-50 text-sky-700",
  SALE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  STOCK_ADJUSTMENT: "border-amber-200 bg-amber-50 text-amber-700",
  REJECT: "border-red-200 bg-red-50 text-red-700",
  TRANSFER_TO_RESELLER: "border-violet-200 bg-violet-50 text-violet-700",
  REBAGGING_OUT: "border-orange-200 bg-orange-50 text-orange-700",
  REBAGGING_IN: "border-teal-200 bg-teal-50 text-teal-700",
  PALAY_CONVERSION_IN: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

export function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) return null;
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status], className)}
    >
      {statusLabel(status)}
    </Badge>
  );
}
