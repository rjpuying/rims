"use server";

import { revalidatePath } from "next/cache";
import { can, requireUser } from "@/lib/auth";
import { friendlyError } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";
import { receiveDeliverySchema } from "@/lib/validations/receiving";

export type ReceiveDeliveryResult =
  | {
      ok: true;
      data: {
        id: string;
        transaction_number: string;
        total_amount: number;
        amount_paid: number;
        balance: number;
        payment_status: string;
      };
    }
  | { ok: false; message: string };

function firstIssue(parsed: { error: { issues: { message: string }[] } }) {
  return parsed.error.issues[0]?.message ?? "Please review the form.";
}

export async function receiveDelivery(
  input: unknown,
): Promise<ReceiveDeliveryResult> {
  const parsed = receiveDeliverySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed) };
  }

  const user = await requireUser();
  if (!can(user, "delivery.create")) {
    return {
      ok: false,
      message: "You do not have permission to record deliveries.",
    };
  }

  const delivery = parsed.data;
  const payload = {
    delivery_date: `${delivery.delivery_date}T00:00:00+08:00`,
    supplier_name: delivery.supplier_name,
    amount_paid: delivery.amount_paid,
    notes: delivery.notes,
    items: [
      {
        rice_product_id: delivery.rice_product_id,
        sack_size_type: delivery.sack_size_type,
        sack_size_kg: delivery.sack_size_kg,
        quantity_sacks: delivery.quantity_sacks,
        price_per_sack: delivery.price_per_sack,
        batch_number: delivery.batch_number,
      },
    ],
  };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("receive_delivery", {
    p_payload: payload,
  });

  if (error) {
    return {
      ok: false,
      message: friendlyError(
        error.message,
        "Unable to save the delivery. Please try again.",
      ),
    };
  }

  revalidatePath("/deliveries");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  const result = data as ReceiveDeliveryResult extends { ok: true; data: infer D }
    ? D
    : never;

  return { ok: true, data: result };
}
