export type CatalogStock = {
  sack_size_type: "25KG" | "50KG" | "OTHER";
  sack_size_kg: number;
  full_sacks: number;
  loose_kg: number;
  rejected_sacks: number;
};

export type CatalogProduct = {
  id: string;
  rice_name: string;
  rice_type: string | null;
  variety: string | null;
  image_url: string | null;
  low_stock_threshold: number;
  stock: CatalogStock[];
};

export type CartItem = {
  key: string;
  rice_product_id: string;
  rice_name: string;
  selling_method: "PER_SACK" | "PER_KG";
  sack_size_type: "25KG" | "50KG" | "OTHER";
  sack_size_kg: number;
  quantity_sacks: number;
  quantity_kg: number;
  price_per_sack: number;
  price_per_kg: number;
  discount: number;
};

export function lineBefore(item: CartItem): number {
  const raw =
    item.selling_method === "PER_SACK"
      ? item.quantity_sacks * item.price_per_sack
      : item.quantity_kg * item.price_per_kg;
  return Math.round(raw * 100) / 100;
}

export function lineTotal(item: CartItem): number {
  return Math.round((lineBefore(item) - item.discount) * 100) / 100;
}

export function cartSubtotal(items: CartItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + lineBefore(item), 0) * 100) / 100;
}

export function cartItemDiscounts(items: CartItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.discount, 0) * 100) / 100;
}

export function stockFor(product: CatalogProduct, sackSizeKg: number): CatalogStock | undefined {
  return product.stock.find((entry) => entry.sack_size_kg === sackSizeKg);
}

export type ItemPreview = {
  item: CartItem;
  ok: boolean;
  message?: string;
  before: { sacks: number; loose: number };
  after: { sacks: number; loose: number };
};

/**
 * Simulates the sale in cart order the same way process_sale() does:
 * PER_SACK deducts full sacks; PER_KG consumes loose KG first and only then
 * opens whole sacks as needed.
 */
export function simulateCart(
  catalog: CatalogProduct[],
  items: CartItem[],
): ItemPreview[] {
  const balances = new Map<string, { sacks: number; loose: number; sizeKg: number }>();
  for (const product of catalog) {
    for (const entry of product.stock) {
      balances.set(`${product.id}:${entry.sack_size_kg}`, {
        sacks: entry.full_sacks,
        loose: entry.loose_kg,
        sizeKg: entry.sack_size_kg,
      });
    }
  }

  return items.map((item) => {
    const balance = balances.get(`${item.rice_product_id}:${item.sack_size_kg}`);
    if (!balance) {
      return {
        item,
        ok: false,
        message: "Selected sack size is no longer available.",
        before: { sacks: 0, loose: 0 },
        after: { sacks: 0, loose: 0 },
      };
    }

    const before = { sacks: balance.sacks, loose: balance.loose };

    if (item.selling_method === "PER_SACK") {
      if (item.quantity_sacks <= 0) {
        return { item, ok: false, message: "Quantity must be greater than zero.", before, after: before };
      }
      if (balance.sacks < item.quantity_sacks) {
        return {
          item,
          ok: false,
          message: `Only ${balance.sacks} sacks are available. You entered ${item.quantity_sacks}.`,
          before,
          after: before,
        };
      }
      balance.sacks -= item.quantity_sacks;
    } else {
      if (item.quantity_kg <= 0) {
        return { item, ok: false, message: "Quantity in KG must be greater than zero.", before, after: before };
      }
      const totalKg = balance.sacks * balance.sizeKg + balance.loose;
      if (totalKg < item.quantity_kg) {
        return {
          item,
          ok: false,
          message: `Only ${totalKg} KG is available. You entered ${item.quantity_kg} KG.`,
          before,
          after: before,
        };
      }
      let opened = 0;
      if (balance.loose < item.quantity_kg) {
        opened = Math.ceil((item.quantity_kg - balance.loose) / balance.sizeKg);
      }
      balance.sacks -= opened;
      balance.loose = balance.loose + opened * balance.sizeKg - item.quantity_kg;
    }

    return {
      item,
      ok: true,
      before,
      after: { sacks: balance.sacks, loose: balance.loose },
    };
  });
}

export function resolveImageUrl(imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/")) {
    return imageUrl;
  }
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${origin}/storage/v1/object/public/rice-images/${imageUrl}`;
}
