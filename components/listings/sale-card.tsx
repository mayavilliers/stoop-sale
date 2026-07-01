import Link from "next/link";
import Image from "next/image";
import { Tag, MapPin, Clock } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getDisplayState, formatSaleWindow } from "@/lib/listing-status";
import { saleTypeLabel, categoryLabel } from "@/lib/constants";
import { formatMiles } from "@/lib/geo";
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
  photoUrl: string | null;
  distanceMiles?: number | null;
};

export function SaleCard({ listing }: { listing: BrowseCardData }) {
  const state = getDisplayState(listing);
  const place = listing.neighborhood ?? listing.city ?? "Brooklyn";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex gap-3 rounded-card border border-line bg-surface p-3 shadow-card transition hover:shadow-pop focus-visible:shadow-pop"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <StatusBadge state={state} />
          {typeof listing.distanceMiles === "number" ? (
            <span className="tabular text-xs font-semibold text-muted">
              {formatMiles(listing.distanceMiles)}
            </span>
          ) : null}
        </div>

        {/* Date & time — the most prominent line on the card. */}
        <p className="tabular mt-2 flex items-start gap-1.5 text-[15px] font-semibold leading-snug text-ink">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sticker" aria-hidden />
          {formatSaleWindow(listing.starts_at, listing.ends_at)}
        </p>

        <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug">
          {listing.title}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
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

      {/* Secondary thumbnail — small, and unobtrusive when there's no photo. */}
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
  );
}
