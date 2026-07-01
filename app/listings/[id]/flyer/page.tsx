import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatSaleDate, formatSaleTimeRange } from "@/lib/listing-status";
import { saleTypeLabel } from "@/lib/constants";
import { PrintButton } from "@/components/listings/print-button";

export const metadata = { title: "Sale flyer — StoopSale" };

/**
 * A printable street flyer with a QR code to the listing. Tape it to the
 * lamppost — every paper sign becomes a link back to the sale.
 */
export default async function FlyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/listings/${id}/flyer`);

  const { data: listing } = await supabase
    .from("sale_listings")
    .select("*, sale_sessions(starts_at, ends_at)")
    .eq("id", id)
    .single();
  if (!listing || listing.status === "DELETED") notFound();
  if (listing.owner_id !== user.id) redirect(`/listings/${id}`);

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const url = `${site}/listings/${listing.id}`;
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: { dark: "#22271f", light: "#ffffff" },
  });

  const sessions = (listing.sale_sessions ?? [])
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const days = sessions.length
    ? sessions
    : [{ starts_at: listing.starts_at, ends_at: listing.ends_at }];

  return (
    <div className="mx-auto max-w-xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">
          Print this, tape it up — the QR code sends people straight to your listing.
        </p>
        <PrintButton />
      </div>

      <div className="rounded-card border-4 border-ink bg-surface p-8 text-center print:rounded-none print:border-8">
        <div className="inline-flex -rotate-2 items-center gap-2 rounded-lg bg-sticker px-4 py-2">
          <Tag className="h-6 w-6 text-sticker-ink" aria-hidden />
          <span className="font-display text-2xl font-extrabold uppercase tracking-wide text-sticker-ink">
            {saleTypeLabel(listing.sale_type)}
          </span>
        </div>

        <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-ink">
          {listing.title}
        </h1>

        <div className="mt-5 space-y-1">
          {days.map((d) => (
            <p key={d.starts_at} className="text-2xl font-bold text-ink">
              {formatSaleDate(d.starts_at, d.starts_at)}
              <span className="text-muted"> · </span>
              {listing.times_unknown ? "come by!" : formatSaleTimeRange(d.starts_at, d.ends_at)}
            </p>
          ))}
          {listing.recurring_weekly ? (
            <p className="text-lg font-semibold text-ink/80">Every week!</p>
          ) : null}
        </div>

        <p className="mt-3 text-xl text-ink/90">{listing.address}</p>

        <div
          className="mx-auto mt-6 w-48 print:w-56"
          // QR generated server-side from this listing's URL only.
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="mt-2 text-sm font-medium text-muted">
          Scan for photos, details &amp; directions
        </p>
        <p className="mt-4 font-display text-lg font-bold text-sticker">stoopsale · {site.replace(/^https?:\/\//, "")}</p>
      </div>
    </div>
  );
}
