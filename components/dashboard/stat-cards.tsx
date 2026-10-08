import { connection } from "next/server";
import { Card, CardContent } from "@/components/ui/card";
import { can, requireUser } from "@/lib/auth";
import { formatNumber, formatPeso, manilaDateISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type SalesSummaryRow = {
  transactions: number | null;
  total_amount: number | null;
  credit_amount: number | null;
};

type CreditRow = {
  balance: number | null;
};

type InventoryRow = {
  stock_status: string;
};

export async function StatCards() {
  await connection();
  const user = await requireUser();
  const supabase = await createClient();
  const today = manilaDateISO();

  const [salesRes, creditRes, inventoryRes] = await Promise.all([
    supabase
      .from("v_sales_summary")
      .select("transactions, total_amount, credit_amount")
      .eq("business_date", today)
      .maybeSingle(),
    supabase
      .from("v_credit_balances")
      .select("balance")
      .neq("status", "PAID"),
    supabase.from("v_current_rice_inventory").select("stock_status"),
  ]);

  if (salesRes.error) throw new Error(salesRes.error.message);
  if (creditRes.error) throw new Error(creditRes.error.message);
  if (inventoryRes.error) throw new Error(inventoryRes.error.message);

  const sales = salesRes.data as SalesSummaryRow | null;
  const openCredits = (creditRes.data ?? []) as CreditRow[];
  const inventoryRows = (inventoryRes.data ?? []) as InventoryRow[];

  const outstandingCredits = openCredits.reduce(
    (sum, row) => sum + Number(row.balance ?? 0),
    0,
  );
  const lowStockCount = inventoryRows.filter(
    (row) => row.stock_status !== "IN_STOCK",
  ).length;

  const cards: { label: string; value: string; caption: string }[] = [
    {
      label: "Today's Sales",
      value: formatPeso(Number(sales?.total_amount ?? 0)),
      caption: `${formatNumber(sales?.transactions ?? 0)} transactions`,
    },
    {
      label: "Transactions",
      value: formatNumber(sales?.transactions ?? 0),
      caption: "completed today",
    },
    {
      label: "Credit Sales",
      value: formatPeso(Number(sales?.credit_amount ?? 0)),
      caption: "sold on credit today",
    },
    can(user, "inventory.view")
      ? {
          label: "Low Stock",
          value: formatNumber(lowStockCount),
          caption: "items need attention",
        }
      : {
          label: "Outstanding Credits",
          value: formatPeso(outstandingCredits),
          caption: `${formatNumber(openCredits.length)} open credits`,
        },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.caption}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
