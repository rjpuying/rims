"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { friendlyError } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";
import { createSaleSchema } from "@/lib/validations/sale";

export type CreateSaleResult =
  | {
      ok: true;
      data: {
        transaction_number: string;
        subtotal: number;
        discount_amount: number;
        total_amount: number;
        amount_paid: number;
        balance: number;
        payment_status: string;
      };
    }
  | { ok: false; message: string };

function friendlySaleError(raw: string): string {
  return friendlyError(raw, "Unable to complete sale. Please try again.");
}

export async function createSale(input: unknown): Promise<CreateSaleResult> {
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Please review the sale form." };
  }

  const user = await requireUser();
  if (!user.permissions.includes("sales.create")) {
    return {
      ok: false,
      message: "You do not have permission to create sales.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("process_sale", {
    p_payload: parsed.data,
  });

  if (error) {
    return { ok: false, message: friendlySaleError(error.message) };
  }

  revalidatePath("/sales");
  revalidatePath("/dashboard");

  const result = data as {
    transaction_number: string;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    amount_paid: number;
    balance: number;
    payment_status: string;
  };

  return { ok: true, data: result };
}
