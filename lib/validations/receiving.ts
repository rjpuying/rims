import { z } from "zod";
import { sackSizeTypes } from "./sale";

const nonNegative = z.number().min(0).max(1_000_000_000);
const businessDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""));

export const receiveDeliverySchema = z
  .object({
    delivery_date: businessDate,
    supplier_name: z
      .string()
      .trim()
      .min(1, "Supplier name is required.")
      .max(120, "Supplier name is too long."),
    amount_paid: nonNegative,
    notes: optionalText(500),
    rice_product_id: z.string().uuid(),
    sack_size_type: z.enum(sackSizeTypes),
    sack_size_kg: z.number().positive("Sack size in KG must be greater than zero."),
    quantity_sacks: z
      .number()
      .positive("Quantity must be greater than zero.")
      .max(1_000_000),
    price_per_sack: nonNegative,
    batch_number: optionalText(80),
  })
  .superRefine((delivery, ctx) => {
    const total = delivery.quantity_sacks * delivery.price_per_sack;
    if (delivery.amount_paid > total) {
      ctx.addIssue({
        code: "custom",
        message: "Amount paid cannot exceed the delivery total.",
        path: ["amount_paid"],
      });
    }
  });

export const receivePalaySchema = z
  .object({
    receipt_date: businessDate,
    farmer_name: z
      .string()
      .trim()
      .min(1, "Farmer name is required.")
      .max(120, "Farmer name is too long."),
    amount_paid: nonNegative,
    notes: optionalText(500),
    rice_product_id: z.string().uuid(),
    variety: optionalText(80),
    quantity_kg: z
      .number()
      .positive("Quantity in KG must be greater than zero.")
      .max(1_000_000),
    price_per_kg: nonNegative,
  })
  .superRefine((receipt, ctx) => {
    const total = receipt.quantity_kg * receipt.price_per_kg;
    if (receipt.amount_paid > total) {
      ctx.addIssue({
        code: "custom",
        message: "Amount paid cannot exceed the receipt total.",
        path: ["amount_paid"],
      });
    }
  });

export type ReceiveDeliveryInput = z.input<typeof receiveDeliverySchema>;
export type ReceivePalayInput = z.input<typeof receivePalaySchema>;
