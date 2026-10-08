"use server";

import { revalidatePath } from "next/cache";
import { can, requireUser } from "@/lib/auth";
import { friendlyError } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";
import {
  adjustInventorySchema,
  recordRejectSchema,
} from "@/lib/validations/inventory";

export type InventoryActionResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string };

function firstIssue(parsed: { error: { issues: { message: string }[] } }) {
  return parsed.error.issues[0]?.message ?? "Please review the form.";
}

export async function adjustInventory(
  input: unknown,
): Promise<InventoryActionResult> {
  const parsed = adjustInventorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed) };
  }

  const user = await requireUser();
  if (!can(user, "inventory.adjust")) {
    return {
      ok: false,
      message: "You do not have permission to adjust inventory.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_inventory", {
    p_payload: parsed.data,
  });

  if (error) {
    return {
      ok: false,
      message: friendlyError(
        error.message,
        "Unable to adjust inventory. Please try again.",
      ),
    };
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return { ok: true, data: data as Record<string, unknown> };
}

export async function recordReject(
  input: unknown,
): Promise<InventoryActionResult> {
  const parsed = recordRejectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed) };
  }

  const user = await requireUser();
  if (!can(user, "inventory.reject")) {
    return {
      ok: false,
      message: "You do not have permission to reject stock.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_reject", {
    p_payload: parsed.data,
  });

  if (error) {
    return {
      ok: false,
      message: friendlyError(
        error.message,
        "Unable to reject stock. Please try again.",
      ),
    };
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return { ok: true, data: data as Record<string, unknown> };
}
