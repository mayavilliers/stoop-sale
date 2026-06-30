"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReportReason } from "@/lib/types/database.types";

const REPORT_REASONS: ReportReason[] = [
  "SPAM",
  "INAPPROPRIATE",
  "SCAM",
  "WRONG_LOCATION",
  "ALREADY_ENDED",
  "OTHER",
];

export async function saveSale(listingId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/listings/${listingId}`);

  // Unique (user_id, listing_id) makes this idempotent; ignore duplicate inserts.
  await supabase.from("saved_sales").insert({ user_id: user.id, listing_id: listingId });
  revalidatePath("/saved");
  revalidatePath(`/listings/${listingId}`);
}

export async function unsaveSale(listingId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/listings/${listingId}`);

  await supabase
    .from("saved_sales")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listingId);
  revalidatePath("/saved");
  revalidatePath(`/listings/${listingId}`);
}

export type ReportState = { ok?: boolean; error?: string } | undefined;

export async function submitReport(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  const listingId = String(formData.get("listingId") ?? "");
  const reason = String(formData.get("reason") ?? "") as ReportReason;
  const details = String(formData.get("details") ?? "").trim();

  if (!listingId) return { error: "Something went wrong. Try again." };
  if (!REPORT_REASONS.includes(reason)) return { error: "Pick a reason." };

  const supabase = await createClient();
  // submit_report is SECURITY DEFINER: anonymous reports are allowed, and it
  // bumps reported_count without granting broad update rights.
  const { error } = await supabase.rpc("submit_report", {
    p_listing_id: listingId,
    p_reason: reason,
    p_details: details || null,
  });

  if (error) return { error: "Couldn't send the report. Try again." };
  return { ok: true };
}
