import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Optional housekeeping. Public visibility is already derived from `ends_at`,
 * so this only tidies the stored status. Triggered by Vercel Cron (see
 * vercel.json), which sends `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("sale_listings")
    .update({ status: "EXPIRED" })
    .eq("status", "ACTIVE")
    .lt("ends_at", nowIso)
    .select("id");

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ expired: data?.length ?? 0 });
}
