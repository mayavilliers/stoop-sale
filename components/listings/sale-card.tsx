import Link from "next/link";
import Image from "next/image";
import { Tag, MapPin, Clock, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getDisplayState, formatSaleDate, formatSaleTimeRange, effectiveWindow } from "@/lib/listing-status";
import { saleTypeLabel, categoryLabel } from "@/lib/constants";
import { formatMiles } from "@/lib/geo";
import { SaveHeart } from "@/components/listings/save-heart";
import type { Category, SaleType } from "@/lib/types/database.types";

export type BrowseCardData = {
  id: string;
  title: string;
  sale_type: SaleType;
  status: string;
  starts_at: string;
  ends_at: string;
  neighborhood: string | null;
  city: string | null;
  categories: Category[];
  recurring_weekly?: boolean;
  is_community?: boolean;
  times_unknown?: boolean;
  postponed_note?: string | null;
  photoUrl: string | null;
  distanceMiles?: number | null;
};

export function SaleCard({
  listing,
  initialSaved = false,
  isLoggedIn = false,
}: {
  listing: BrowseCardData;
  initialSaved?: boolean;
  isLoggedIn?: boolean;
}) {
  const state = getDisplayState(listing);
  const place = listing.neighborhood ?? listing.city ?? "Brooklyn";
  const win = effectiveWindow(listing);
  const winStart = new Date(win.starts).toISOString();
  const winEnd = new Date(win.ends).toISOString();

  return (
    <div className="relative">
      <Link
        href={`/listings/${listing.id}`}
        className="group flex gap-3 rounded-card border border-line bg-surface p-3 shadow-card transition hover:shadow-pop focus-visible:shadow-pop"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top row: status + distance (heart is overlaid top-right) */}
          <div className="flex items-center gap-2 pr-10">
            <StatusBadge state={state} />
            {listing.postponed_note ? (
              <span className="rounded-full bg-terra px-2 py-0.5 text-[11px] font-semibold text-terra-ink">
                Postponed
              </span>
            ) : null}
            {typeof listing.distanceMiles === "number" ? (
              <span className="tabular text-xs font-semibold text-muted">
                {formatMiles(listing.distanceMiles)}
              </span>
            ) : null}
          </div>

          {/* Date + time as two clean rows */}
          <div className="mt-2 space-y-0.5">
            <p className="flex items-center gap-1.5 text-[15px] font-bold leading-snug text-ink">
              <Calendar className="h-4 w-4 shrink-0 text-sticker" aria-hidden />
              {formatSaleDate(winStart, winEnd)}
              {listing.recurring_weekly ? (
                <span className="rounded-full bg-sky px-2 py-0.5 text-[11px] font-semibold text-sky-ink">
                  Weekly
                </span>
              ) : null}
            </p>
            <p className="tabular flex items-center gap-1.5 text-[15px] font-bold leading-snug text-ink">
              <Clock className="h-4 w-4 shrink-0 text-sticker" aria-hidden />
              {listing.times_unknown
                ? "Times unknown"
                : formatSaleTimeRange(winStart, winEnd)}
            </p>
          </div>

          <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug">
            {listing.title}
          </h3>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {listing.is_community ? "Spotted · " : ""}
              {saleTypeLabel(listing.sale_type)} · {place}
            </span>
          </p>

          {listing.categories.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {listing.categories.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink/80"
                >
                  {categoryLabel(c)}
                </span>
              ))}
              {listing.categories.length > 3 ? (
                <span className="px-1 py-0.5 text-xs text-muted">
                  +{listing.categories.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Secondary thumbnail — small, unobtrusive when there's no photo. */}
        <div className="relative h-24 w-24 shrink-0 self-center overflow-hidden rounded-xl bg-paper sm:h-28 sm:w-28">
          {listing.photoUrl ? (
            <Image
              src={listing.photoUrl}
              alt=""
              fill
              sizes="112px"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-kraft/70">
              <Tag className="h-7 w-7 -rotate-6" aria-hidden />
            </div>
          )}
        </div>
      </Link>

      {/* Save heart — sibling of the link so it never opens the card. */}
      <SaveHeart
        listingId={listing.id}
        initialSaved={initialSaved}
        isLoggedIn={isLoggedIn}
        className="absolute right-2.5 top-2.5 z-10"
      />
    </div>
  );
}
