import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { haversineMiles } from "@/lib/geo";

/**
 * Daily digest: for each alert, find sales posted in the last 24h within its
 * radius and send one email via Resend. Requires RESEND_API_KEY; without it,
 * the job reports what it WOULD send (safe no-op for testing).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: alerts }, { data: fresh }] = await Promise.all([
    supabase.from("sale_alerts").select("*"),
    supabase
      .from("sale_listings")
      .select("id,title,neighborhood,city,latitude,longitude,starts_at")
      .eq("status", "ACTIVE")
      .eq("is_hidden", false)
      .gte("created_at", since),
  ]);

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERTS_FROM_EMAIL ?? "StoopSale <alerts@resend.dev>";
  let sent = 0;
  let matchedAlerts = 0;

  for (const a of alerts ?? []) {
    const matches = (fresh ?? []).filter(
      (l) =>
        haversineMiles(
          { lat: a.latitude, lng: a.longitude },
          { lat: l.latitude, lng: l.longitude }
        ) <= a.radius_mi
    );
    if (!matches.length) continue;
    matchedAlerts++;

    if (!apiKey) continue; // dry run without a Resend key

    const items = matches
      .map(
        (l) =>
          `<li style="margin-bottom:8px"><a href="${site}/listings/${l.id}" style="color:#fc8134;font-weight:600">${l.title}</a><br/><span style="color:#6e7468">${l.neighborhood ?? l.city ?? ""}</span></li>`
      )
      .join("");
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px">
        <h2 style="color:#22271f">New sales near ${a.label ?? "you"} 🏷️</h2>
        <ul style="padding-left:18px">${items}</ul>
        <p><a href="${site}" style="color:#fc8134">Browse all sales →</a></p>
        <p style="color:#6e7468;font-size:12px">
          <a href="${site}/api/alerts/unsubscribe?token=${a.token}" style="color:#6e7468">Unsubscribe</a>
        </p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: a.email,
        subject: `${matches.length} new ${matches.length === 1 ? "sale" : "sales"} near ${a.label ?? "you"}`,
        html,
      }),
    });
    if (res.ok) sent++;
  }

  return NextResponse.json({
    alerts: alerts?.length ?? 0,
    freshListings: fresh?.length ?? 0,
    matchedAlerts,
    emailsSent: sent,
    dryRun: !apiKey,
  });
}
