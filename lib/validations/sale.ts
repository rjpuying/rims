import { z } from "zod";

export const paymentMethods = [
  "CASH",
  "GCASH",
  "BANK_TRANSFER",
  "CARD",
  "CREDIT",
] as const;

export const paymentMethodLabels: Record<(typeof paymentMethods)[number], string> = {
  CASH: "Cash",
  GCASH: "GCash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CREDIT: "Credit",
};

export const sackSizeTypes = ["25KG", "50KG", "OTHER"] as const;

const nonNegative = z.number().min(0).max(1_000_000_000);

export const saleItemSchema = z
  .object({
    rice_product_id: z.string().uuid(),
    selling_method: z.enum(["PER_SACK", "PER_KG"]),
    sack_size_type: z.enum(sackSizeTypes),
    sack_size_kg: z.number().positive(),
    quantity_sacks: nonNegative,
    quantity_kg: nonNegative,
    price_per_sack: nonNegative,
    price_per_kg: nonNegative,
    discount: nonNegative,
  })
  .superRefine((item, ctx) => {
    if (item.selling_method === "PER_SACK") {
      if (item.quantity_sacks <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Quantity must be greater than zero.",
          path: ["quantity_sacks"],
        });
      }
      if (item.price_per_sack <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Price per sack must be greater than zero.",
          path: ["price_per_sack"],
        });
      }
    } else {
      if (item.quantity_kg <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Quantity in KG must be greater than zero.",
          path: ["quantity_kg"],
        });
      }
      if (item.price_per_kg <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Price per KG must be greater than zero.",
          path: ["price_per_kg"],
        });
      }
    }
    const line =
      item.selling_method === "PER_SACK"
        ? item.quantity_sacks * item.price_per_sack
        : item.quantity_kg * item.price_per_kg;
    if (item.discount > line) {
      ctx.addIssue({
        code: "custom",
        message: "Line discount cannot exceed the line total.",
        path: ["discount"],
      });
    }
  });

export const createSaleSchema = z
  .object({
    customer_name: z.string().trim().max(120, "Customer name is too long.").optional(),
    payment_method: z.enum(paymentMethods),
    amount_paid: nonNegative,
    discount_amount: nonNegative,
    items: z.array(saleItemSchema).min(1, "Add at least one item to this sale."),
  })
  .superRefine((sale, ctx) => {
    const subtotal = sale.items.reduce((sum, item) => {
      const before =
        item.selling_method === "PER_SACK"
          ? item.quantity_sacks * item.price_per_sack
          : item.quantity_kg * item.price_per_kg;
      return sum + before;
    }, 0);
    const itemDiscounts = sale.items.reduce((sum, item) => sum + item.discount, 0);
    const total = subtotal - itemDiscounts - sale.discount_amount;
    if (sale.discount_amount > subtotal - itemDiscounts) {
      ctx.addIssue({
        code: "custom",
        message: "Discount cannot exceed the sale total.",
        path: ["discount_amount"],
      });
    }
    if (sale.amount_paid > total) {
      ctx.addIssue({
        code: "custom",
        message: "Amount paid cannot exceed the sale total.",
        path: ["amount_paid"],
      });
    }
    const balance = total - sale.amount_paid;
    if (balance > 0 && !sale.customer_name) {
      ctx.addIssue({
        code: "custom",
        message: "Customer name is required for credit sales.",
        path: ["customer_name"],
      });
    }
  });

export type CreateSaleInput = z.input<typeof createSaleSchema>;
