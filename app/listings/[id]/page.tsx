import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Navigation, Tag, Wallet, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import {
  getDisplayState,
  formatSaleDate,
  formatSaleTimeRange,
  effectiveWindow,
} from "@/lib/listing-status";
import { Calendar, Repeat } from "lucide-react";
import { saleTypeLabel, categoryLabel } from "@/lib/constants";
import { directionsToCoords } from "@/lib/geo";
import { SaveButton } from "@/components/listings/save-button";
import { ReportButton } from "@/components/listings/report-button";
import { MiniMap } from "@/components/map/mini-map";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("sale_listings").select("title").eq("id", id).single();
  return { title: data?.title ? `${data.title} — StoopSale` : "Sale — StoopSale" };
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("sale_listings")
    .select("*, sale_photos(url, sort_order), sale_sessions(starts_at, ends_at)")
    .eq("id", id)
    .single();

  // RLS returns nothing for drafts/hidden/deleted you don't own → treat as not found.
  if (!listing || listing.status === "DELETED") notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialSaved = false;
  if (user) {
    const { data: saved } = await supabase
      .from("saved_sales")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listing.id)
      .maybeSingle();
    initialSaved = !!saved;
  }

  const sessions = (listing.sale_sessions ?? [])
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const state = getDisplayState(listing, sessions);
  const photos = (listing.sale_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
  const place = listing.neighborhood ?? listing.city ?? "Brooklyn";

  const flags = [
    listing.cash_only ? "Cash only" : null,
    listing.venmo_accepted ? "Venmo accepted" : null,
    listing.early_birds_ok ? "Early birds okay" : "No early birds",
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to sales
      </Link>

      {/* Gallery */}
      <div className="mt-4 overflow-hidden rounded-card border border-line bg-paper">
        <div className="relative aspect-[16/10] w-full">
          {photos[0] ? (
            <Image
              src={photos[0].url}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-kraft">
              <Tag className="h-14 w-14 -rotate-6" aria-hidden />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge state={state} className="shadow-sm" />
          </div>
        </div>
        {photos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto p-2">
            {photos.slice(1).map((ph) => (
              <div
                key={ph.url}
                className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line"
              >
                <Image src={ph.url} alt="" fill sizes="96px" className="object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Header */}
      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          {saleTypeLabel(listing.sale_type)}
        </div>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight">
          {listing.title}
        </h1>
        <div className="mt-3 space-y-1">
          {(sessions.length ? sessions : [{ starts_at: listing.starts_at, ends_at: listing.ends_at }]).map(
            (sess) => {
              const w = effectiveWindow({
                starts_at: sess.starts_at,
                ends_at: sess.ends_at,
                recurring_weekly: listing.recurring_weekly,
              });
              const ws = new Date(w.starts).toISOString();
              const we = new Date(w.ends).toISOString();
              return (
                <p
                  key={sess.starts_at}
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[16px] font-semibold text-ink"
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0 text-sticker" aria-hidden />
                    {formatSaleDate(ws, ws)}
                  </span>
                  <span className="tabular flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 text-sticker" aria-hidden />
                    {listing.times_unknown ? "Times unknown" : formatSaleTimeRange(ws, we)}
                  </span>
                </p>
              );
            }
          )}
          {listing.recurring_weekly ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-sky-ink">
              <Repeat className="h-4 w-4" aria-hidden />
              Repeats every week
            </p>
          ) : null}
          {listing.is_community ? (
            <p className="text-sm text-muted">
              Spotted by a neighbor — details may be incomplete.
            </p>
          ) : null}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted">
          <MapPin className="h-4 w-4" aria-hidden />
          {place}
        </p>
      </div>

      {state === "ended" ? (
        <div className="mt-4 rounded-card border border-line bg-paper px-4 py-3 text-sm text-muted">
          This sale has ended. It&apos;s kept here for reference but won&apos;t show up in browse.
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={directionsToCoords(listing.latitude, listing.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card transition hover:brightness-95"
        >
          <Navigation className="h-4 w-4" aria-hidden />
          Directions
        </a>
        <SaveButton listingId={listing.id} initialSaved={initialSaved} isLoggedIn={!!user} />
        <span className="ml-auto">
          <ReportButton listingId={listing.id} />
        </span>
      </div>

      {/* Description */}
      {listing.description ? (
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold">Details</h2>
          <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
            {listing.description}
          </p>
        </section>
      ) : null}

      {/* Categories */}
      {listing.categories.length ? (
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold">What&apos;s for sale</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {listing.categories.map((c) => (
              <span
                key={c}
                className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink"
              >
                {categoryLabel(c)}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Notes + payment */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Good to know</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {flags.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-sm font-medium text-ink/80"
            >
              <Wallet className="h-3.5 w-3.5 text-muted" aria-hidden />
              {f}
            </span>
          ))}
        </div>
        {listing.notes ? (
          <p className="mt-3 text-[15px] leading-relaxed text-ink/90">{listing.notes}</p>
        ) : null}
      </section>

      {/* Map preview */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Where</h2>
        <div className="mt-2">
          <MiniMap lat={listing.latitude} lng={listing.longitude} address={listing.address} />
        </div>
      </section>
    </div>
  );
}
