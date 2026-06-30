"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/types/database.types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN") redirect("/");
  return supabase;
}

export async function setListingHidden(listingId: string, hidden: boolean): Promise<void> {
  const supabase = await requireAdmin();
  // RLS "admins update any listing" authorizes this.
  await supabase.from("sale_listings").update({ is_hidden: hidden }).eq("id", listingId);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/listings/${listingId}`);
}

export async function resolveReport(
  reportId: string,
  status: Extract<ReportStatus, "REVIEWED" | "DISMISSED">
): Promise<void> {
  const supabase = await requireAdmin();
  await supabase.from("reports").update({ status }).eq("id", reportId);
  revalidatePath("/admin");
}
