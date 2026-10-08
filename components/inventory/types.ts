export type StockRow = {
  id: string;
  rice_product_id: string;
  rice_name: string;
  rice_type: string | null;
  variety: string | null;
  image_url: string | null;
  low_stock_threshold: number;
  sack_size_type: string;
  sack_size_kg: number;
  full_sacks: number;
  loose_kg: number;
  rejected_sacks: number;
  stock_status: string;
  updated_at: string;
};

export type ProductOption = {
  id: string;
  rice_name: string;
};

export function sackLabel(row: Pick<StockRow, "sack_size_type" | "sack_size_kg">): string {
  if (row.sack_size_type === "OTHER") {
    return `${row.sack_size_kg} KG`;
  }
  return `${row.sack_size_type.replace("KG", " KG")}`;
}
