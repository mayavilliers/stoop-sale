import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  if (/^[0-9a-f-]{36}$/i.test(token)) {
    const supabase = createAdminClient();
    await supabase.from("sale_alerts").delete().eq("token", token);
  }
  return NextResponse.redirect(`${origin}/?unsubscribed=1`);
}
