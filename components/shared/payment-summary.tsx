import { StatusBadge, statusLabel } from "@/components/shared/status-badge";
import { formatPeso } from "@/lib/format";

export function paymentStatusFor(total: number, paid: number): string {
  if (paid >= total) return "PAID";
  if (paid <= 0) return "UNPAID";
  return "PARTIALLY_PAID";
}

export function PaymentSummary({
  total,
  paid,
  receivedBy,
}: {
  total: number;
  paid: number;
  receivedBy?: string;
}) {
  const balance = Math.max(0, total - paid);
  const status = paymentStatusFor(total, paid);

  return (
    <div className="space-y-1.5 rounded-md border bg-muted/40 p-3 text-sm">
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Total</span>
        <span className="font-medium tabular-nums">{formatPeso(total)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Amount Paid</span>
        <span className="tabular-nums">{formatPeso(paid)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Balance</span>
        <span className="tabular-nums">{formatPeso(balance)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Payment Status</span>
        <StatusBadge status={status} />
      </div>
      {receivedBy ? (
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Received By</span>
          <span>{receivedBy}</span>
        </div>
      ) : null}
      <span className="sr-only">{statusLabel(status)}</span>
    </div>
  );
}
