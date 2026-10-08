"use server";

import { revalidatePath } from "next/cache";
import { can, requireUser } from "@/lib/auth";
import { friendlyError } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";
import { receivePalaySchema } from "@/lib/validations/receiving";

export type ReceivePalayResult =
  | {
      ok: true;
      data: {
        id: string;
        transaction_number: string;
        total_amount: number;
        amount_paid: number;
        balance: number;
        payment_status: string;
        total_kg: number;
      };
    }
  | { ok: false; message: string };

function firstIssue(parsed: { error: { issues: { message: string }[] } }) {
  return parsed.error.issues[0]?.message ?? "Please review the form.";
}

export async function receivePalay(
  input: unknown,
): Promise<ReceivePalayResult> {
  const parsed = receivePalaySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed) };
  }

  const user = await requireUser();
  if (!can(user, "palay.create")) {
    return {
      ok: false,
      message: "You do not have permission to record palay receipts.",
    };
  }

  const receipt = parsed.data;
  const payload = {
    receipt_date: `${receipt.receipt_date}T00:00:00+08:00`,
    farmer_name: receipt.farmer_name,
    amount_paid: receipt.amount_paid,
    notes: receipt.notes,
    items: [
      {
        rice_product_id: receipt.rice_product_id,
        variety: receipt.variety,
        quantity_kg: receipt.quantity_kg,
        price_per_kg: receipt.price_per_kg,
      },
    ],
  };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("receive_palay", {
    p_payload: payload,
  });

  if (error) {
    return {
      ok: false,
      message: friendlyError(
        error.message,
        "Unable to save the palay receipt. Please try again.",
      ),
    };
  }

  revalidatePath("/palay");
  revalidatePath("/dashboard");

  const result = data as ReceivePalayResult extends { ok: true; data: infer D }
    ? D
    : never;

  return { ok: true, data: result };
}
