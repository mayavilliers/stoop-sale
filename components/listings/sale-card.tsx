import Link from "next/link";
import Image from "next/image";
import { Tag, MapPin } from "lucide-react";
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
      className="group block overflow-hidden rounded-card border border-line bg-surface shadow-card transition hover:shadow-pop focus-visible:shadow-pop"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-paper">
        {listing.photoUrl ? (
          <Image
            src={listing.photoUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-kraft">
            <Tag className="h-10 w-10 -rotate-6" aria-hidden />
          </div>
        )}
        <div className="absolute left-2.5 top-2.5">
          <StatusBadge state={state} className="shadow-sm" />
        </div>
        {typeof listing.distanceMiles === "number" ? (
          <div className="tabular absolute right-2.5 top-2.5 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-semibold text-paper">
            {formatMiles(listing.distanceMiles)}
          </div>
        ) : null}
      </div>

      <div className="p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          {saleTypeLabel(listing.sale_type)}
        </div>
        <h3 className="mt-1 line-clamp-2 font-display text-[17px] font-bold leading-snug">
          {listing.title}
        </h3>
        <p className="tabular mt-1 text-sm text-muted">
          {formatSaleWindow(listing.starts_at, listing.ends_at)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {place}
        </p>
        {listing.categories.length ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
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
    </Link>
  );
}
