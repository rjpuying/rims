import { ShieldCheck } from "lucide-react";
import { connection } from "next/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { formatNumber, formatPeso, manilaDateISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type AlertRow = {
  key: string;
  label: string;
  value: string;
  tone: "red" | "amber" | "neutral";
};

const TONE_TEXT: Record<AlertRow["tone"], string> = {
  red: "text-red-700",
  amber: "text-amber-700",
  neutral: "text-foreground",
};

const TONE_DOT: Record<AlertRow["tone"], string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  neutral: "bg-zinc-400",
};

export async function AlertsCard() {
  await connection();
  await requireUser();
  const supabase = await createClient();
  const today = manilaDateISO();

  const [inventoryRes, creditsRes, deliveryRes, palayRes] = await Promise.all([
    supabase
      .from("v_current_rice_inventory")
      .select("stock_status, rejected_sacks"),
    supabase
      .from("v_credit_balances")
      .select("balance")
      .neq("status", "PAID"),
    supabase
      .from("v_delivery_summary")
      .select("unpaid_deliveries, outstanding_balance")
      .eq("business_date", today)
      .maybeSingle(),
    supabase.from("v_palay_inventory").select("quantity_kg, stock_status"),
  ]);

  if (inventoryRes.error) throw new Error(inventoryRes.error.message);
  if (creditsRes.error) throw new Error(creditsRes.error.message);
  if (deliveryRes.error) throw new Error(deliveryRes.error.message);
  if (palayRes.error) throw new Error(palayRes.error.message);

  const inventoryRows = (inventoryRes.data ?? []) as {
    stock_status: string;
    rejected_sacks: number | null;
  }[];
  const openCredits = (creditsRes.data ?? []) as { balance: number | null }[];
  const delivery = deliveryRes.data as {
    unpaid_deliveries: number | null;
    outstanding_balance: number | null;
  } | null;
  const palayRows = (palayRes.data ?? []) as {
    quantity_kg: number | null;
    stock_status: string;
  }[];

  const rows: AlertRow[] = [];

  const lowStock = inventoryRows.filter(
    (row) => row.stock_status === "LOW_STOCK",
  ).length;
  const outOfStock = inventoryRows.filter(
    (row) => row.stock_status === "OUT_OF_STOCK",
  ).length;
  const rejected = inventoryRows.filter(
    (row) => Number(row.rejected_sacks ?? 0) > 0,
  ).length;

  if (lowStock > 0)
    rows.push({
      key: "low",
      label: "Low Stock",
      value: `${formatNumber(lowStock)} items`,
      tone: "amber",
    });
  if (outOfStock > 0)
    rows.push({
      key: "out",
      label: "Out of Stock",
      value: `${formatNumber(outOfStock)} items`,
      tone: "red",
    });
  if (rejected > 0)
    rows.push({
      key: "rejected",
      label: "Rejected Stock",
      value: `${formatNumber(rejected)} items`,
      tone: "red",
    });

  const outstandingCredits = openCredits.reduce(
    (sum, row) => sum + Number(row.balance ?? 0),
    0,
  );
  if (outstandingCredits > 0)
    rows.push({
      key: "credits",
      label: "Outstanding Credits",
      value: `${formatPeso(outstandingCredits)} · ${formatNumber(openCredits.length)} open`,
      tone: "amber",
    });

  const unpaidDeliveries = Number(delivery?.unpaid_deliveries ?? 0);
  if (unpaidDeliveries > 0)
    rows.push({
      key: "deliveries",
      label: "Unpaid Deliveries",
      value: `${formatNumber(unpaidDeliveries)} · ${formatPeso(Number(delivery?.outstanding_balance ?? 0))}`,
      tone: "amber",
    });

  const palayKg = palayRows.reduce(
    (sum, row) => sum + Number(row.quantity_kg ?? 0),
    0,
  );
  const palayOut = palayRows.filter(
    (row) => row.stock_status === "OUT_OF_STOCK",
  ).length;
  if (palayKg > 0 || palayOut > 0)
    rows.push({
      key: "palay",
      label: "Palay Inventory",
      value: `${formatNumber(palayKg)} kg`,
      tone: "neutral",
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>Items that need attention</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="text-sm text-muted-foreground">
              No alerts right now.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      TONE_DOT[row.tone],
                    )}
                  />
                  <span className="truncate text-sm">{row.label}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-sm font-medium tabular-nums",
                    TONE_TEXT[row.tone],
                  )}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function AlertsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-36" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
