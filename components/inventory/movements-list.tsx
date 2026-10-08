import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatManilaShort, formatQty } from "@/lib/format";
import { sackLabel } from "@/components/inventory/types";

export type MovementRow = {
  id: string;
  rice_product_id: string;
  rice_name: string;
  movement_type: string;
  sack_size_type: string;
  sack_size_kg: number;
  full_sacks_change: number | null;
  loose_kg_change: number | null;
  rejected_sacks_change: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

function signed(value: number): string {
  const formatted = formatQty(Math.abs(value));
  return value < 0 ? `-${formatted}` : `+${formatted}`;
}

function changeParts(row: MovementRow): string[] {
  const parts: string[] = [];
  const sacks = Number(row.full_sacks_change ?? 0);
  const loose = Number(row.loose_kg_change ?? 0);
  const rejected = Number(row.rejected_sacks_change ?? 0);
  if (sacks !== 0) parts.push(`${signed(sacks)} sacks`);
  if (loose !== 0) parts.push(`${signed(loose)} KG`);
  if (rejected !== 0) parts.push(`${signed(rejected)} rejected`);
  return parts;
}

function MovementChanges({ row }: { row: MovementRow }) {
  const parts = changeParts(row);
  return (
    <span className="tabular-nums">
      {parts.map((part, index) => (
        <span key={part} className={index > 0 ? "ml-2" : undefined}>
          {part}
        </span>
      ))}
    </span>
  );
}

export function MovementsList({ rows }: { rows: MovementRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No inventory movements.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Rice</TableHead>
              <TableHead>Sack Size</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatManilaShort(row.created_at)}
                </TableCell>
                <TableCell className="font-medium">{row.rice_name}</TableCell>
                <TableCell className="tabular-nums">
                  {sackLabel({
                    sack_size_type: row.sack_size_type,
                    sack_size_kg: row.sack_size_kg,
                  })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.movement_type} />
                </TableCell>
                <TableCell>
                  <MovementChanges row={row} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.created_by_name ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {rows.map((row) => (
          <Card key={row.id} className="py-3">
            <CardContent className="px-4 py-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {row.rice_name}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {sackLabel({
                        sack_size_type: row.sack_size_type,
                        sack_size_kg: row.sack_size_kg,
                      })}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatManilaShort(row.created_at)}
                    {row.created_by_name ? ` · ${row.created_by_name}` : ""}
                  </p>
                  {row.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.notes}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 space-y-1 text-right">
                  <StatusBadge status={row.movement_type} />
                  <p className="text-xs">
                    <MovementChanges row={row} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing the {rows.length} most recent{" "}
        {rows.length === 1 ? "movement" : "movements"}
      </p>
    </div>
  );
}
