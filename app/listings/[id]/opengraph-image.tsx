import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getDisplayState, formatSaleDate, formatSaleTimeRange, effectiveWindow } from "@/lib/listing-status";
import { saleTypeLabel } from "@/lib/constants";

export const runtime = "nodejs";
export const alt = "Sale details on StoopSale";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: l } = await supabase
    .from("sale_listings")
    .select("title,sale_type,status,starts_at,ends_at,recurring_weekly,times_unknown,neighborhood,city,sale_photos(url,sort_order)")
    .eq("id", id)
    .single();

  const title = l?.title ?? "A sale near you";
  const state = l ? getDisplayState(l) : "upcoming";
  const win = l ? effectiveWindow(l) : null;
  const dateLine = win
    ? formatSaleDate(new Date(win.starts).toISOString(), new Date(win.ends).toISOString())
    : "";
  const timeLine =
    l && !l.times_unknown && win
      ? formatSaleTimeRange(new Date(win.starts).toISOString(), new Date(win.ends).toISOString())
      : "";
  const place = l?.neighborhood ?? l?.city ?? "";
  const photo = (l?.sale_photos ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f3ec",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {state === "open" ? (
              <div
                style={{
                  display: "flex",
                  background: "#1c7d38",
                  color: "#ffffff",
                  fontSize: 28,
                  fontWeight: 700,
                  padding: "8px 22px",
                  borderRadius: 999,
                }}
              >
                OPEN NOW
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  background: "#b7d9fc",
                  color: "#16324c",
                  fontSize: 28,
                  fontWeight: 700,
                  padding: "8px 22px",
                  borderRadius: 999,
                }}
              >
                {l ? saleTypeLabel(l.sale_type).toUpperCase() : "SALE"}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 62,
              fontWeight: 800,
              color: "#22271f",
              lineHeight: 1.1,
            }}
          >
            {title.length > 60 ? `${title.slice(0, 57)}…` : title}
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 36, fontWeight: 700, color: "#fc8134" }}>
            {dateLine}
            {timeLine ? ` · ${timeLine}` : ""}
          </div>
          {place ? (
            <div style={{ display: "flex", marginTop: 10, fontSize: 30, color: "#6e7468" }}>{place}</div>
          ) : null}
          <div style={{ display: "flex", marginTop: 40, fontSize: 30, fontWeight: 800, color: "#22271f" }}>
            🏷️ StoopSale
          </div>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={470}
            height={630}
            style={{ objectFit: "cover", width: 470, height: 630 }}
          />
        ) : null}
      </div>
    ),
    size
  );
}
