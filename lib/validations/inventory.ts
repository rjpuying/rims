import { z } from "zod";
import { sackSizeTypes } from "./sale";

const nonNegative = z.number().min(0).max(1_000_000_000);

export const stockStatuses = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;

export const sackSizeLabels: Record<(typeof sackSizeTypes)[number], string> = {
  "25KG": "25 KG",
  "50KG": "50 KG",
  OTHER: "Other",
};

export const adjustInventorySchema = z.object({
  rice_product_id: z.string().uuid(),
  sack_size_type: z.enum(sackSizeTypes),
  sack_size_kg: z.number().positive(),
  new_full_sacks: nonNegative,
  new_loose_kg: nonNegative.optional(),
  reason: z
    .string()
    .trim()
    .min(1, "A reason is required for inventory adjustments.")
    .max(200, "Reason is too long."),
  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long.")
    .optional()
    .or(z.literal("")),
});

export const recordRejectSchema = z.object({
  rice_product_id: z.string().uuid(),
  sack_size_type: z.enum(sackSizeTypes),
  sack_size_kg: z.number().positive(),
  quantity_sacks: z
    .number()
    .positive("Quantity must be greater than zero.")
    .max(1_000_000_000),
  reason: z
    .string()
    .trim()
    .max(200, "Reason is too long.")
    .optional()
    .or(z.literal("")),
});

export type AdjustInventoryInput = z.input<typeof adjustInventorySchema>;
export type RecordRejectInput = z.input<typeof recordRejectSchema>;
