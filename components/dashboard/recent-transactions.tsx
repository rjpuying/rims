import { Inbox } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { formatManilaShort, formatPeso } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type RecentRow = {
  created_at: string;
  kind: string;
  transaction_number: string;
  party_name: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  user_id: string | null;
};

const KIND_LABELS: Record<string, string> = {
  SALE: "Sale",
  DELIVERY: "Delivery",
  PALAY: "Palay",
  TRANSFER: "Transfer",
};

export async function RecentTransactions() {
  await requireUser();
  const supabase = await createClient();

  const res = await supabase
    .from("v_recent_transactions")
    .select(
      "created_at, kind, transaction_number, party_name, total_amount, amount_paid, balance, payment_status, user_id",
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (res.error) throw new Error(res.error.message);

  const rows = (res.data ?? []) as RecentRow[];

  const userIds = [
    ...new Set(
      rows
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const names: Record<string, string> = {};
  if (userIds.length > 0) {
    const profilesRes = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    if (!profilesRes.error) {
      for (const profile of profilesRes.data ?? []) {
        names[profile.id] = profile.full_name;
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Latest sales, deliveries, palay, and transfers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y md:hidden">
              {rows.map((row, index) => (
                <li
                  key={`${row.transaction_number}-${index}`}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.party_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {KIND_LABELS[row.kind] ?? row.kind} ·{" "}
                      {row.transaction_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatManilaShort(row.created_at)}
                      {row.user_id && names[row.user_id]
                        ? ` · ${names[row.user_id]}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium tabular-nums">
                      {formatPeso(Number(row.total_amount))}
                    </span>
                    <StatusBadge status={row.payment_status} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={`${row.transaction_number}-${index}`}
                    >
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatManilaShort(row.created_at)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {KIND_LABELS[row.kind] ?? row.kind}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums">
                        {row.transaction_number}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-sm">
                        {row.party_name}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatPeso(Number(row.total_amount))}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.payment_status} />
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-xs text-muted-foreground">
                        {row.user_id && names[row.user_id]
                          ? names[row.user_id]
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
