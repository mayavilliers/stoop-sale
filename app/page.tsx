import Link from "next/link";
import { Suspense } from "react";
import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { parseBrowseParams, timeWindow } from "@/lib/browse-filters";
import { haversineMiles } from "@/lib/geo";
import { SaleCard, type BrowseCardData } from "@/components/listings/sale-card";
import { FilterBar } from "@/components/browse/filter-bar";
import { ViewToggle } from "@/components/browse/view-toggle";

export const metadata = { title: "StoopSale — sales near you" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MAX_RESULTS = 100;

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const p = parseBrowseParams(sp);
  const supabase = await createClient();

  let query = supabase
    .from("sale_listings")
    .select(
      "id,title,sale_type,status,starts_at,ends_at,neighborhood,city,latitude,longitude,categories,created_at,sale_photos(url,sort_order)"
    )
    .eq("status", "ACTIVE")
    .eq("is_hidden", false)
    .limit(MAX_RESULTS);

  const win = timeWindow(p.when, p.tzOffsetMin);
  const nowIso = new Date().toISOString();
  if (win.openNow) {
    query = query.lte("starts_at", nowIso).gt("ends_at", nowIso);
  } else {
    if (win.endsAfter) query = query.gt("ends_at", win.endsAfter);
    if (win.startsBefore) query = query.lt("starts_at", win.startsBefore);
  }
  if (p.category) query = query.overlaps("categories", [p.category]);
  if (p.saleType) query = query.eq("sale_type", p.saleType);

  if (p.sort === "newest") query = query.order("created_at", { ascending: false });
  else if (p.sort === "ending") query = query.order("ends_at", { ascending: true });
  else query = query.order("starts_at", { ascending: true }); // starting + distance baseline

  const { data, error } = await query;

  // Which of these has the current user saved? (drives the heart state)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let savedIds = new Set<string>();
  if (user) {
    const { data: saves } = await supabase
      .from("saved_sales")
      .select("listing_id")
      .eq("user_id", user.id);
    savedIds = new Set((saves ?? []).map((s) => s.listing_id));
  }

  const here = p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null;

  let cards: BrowseCardData[] = (data ?? []).map((l) => {
    const photos = (l.sale_photos ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const distanceMiles = here
      ? haversineMiles(here, { lat: l.latitude, lng: l.longitude })
      : null;
    return {
      id: l.id,
      title: l.title,
      sale_type: l.sale_type,
      status: l.status,
      starts_at: l.starts_at,
      ends_at: l.ends_at,
      neighborhood: l.neighborhood,
      city: l.city,
      categories: l.categories,
      photoUrl: photos[0]?.url ?? null,
      distanceMiles,
    };
  });

  if (p.sort === "distance" && here) {
    cards = cards.sort(
      (a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity)
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Sales near you
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {cards.length > 0
              ? `${cards.length} ${cards.length === 1 ? "sale" : "sales"} matching`
              : "Browse what's on around the neighborhood"}
          </p>
        </div>
        <Suspense fallback={null}>
          <ViewToggle />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      {error ? (
        <p className="mt-8 rounded-card border border-sticker/30 bg-sticker/5 px-4 py-3 text-sm text-sticker">
          Something went wrong loading sales. Please refresh.
        </p>
      ) : cards.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {cards.map((listing) => (
            <SaleCard
              key={listing.id}
              listing={listing}
              initialSaved={savedIds.has(listing.id)}
              isLoggedIn={!!user}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-card border border-dashed border-line bg-surface/60 p-12 text-center">
      <span className="mx-auto grid h-12 w-12 -rotate-6 place-items-center rounded-xl bg-kraft/30 text-kraft">
        <Tag className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold">No sales match right now</h2>
      <p className="mx-auto mt-1 max-w-sm text-[15px] text-muted">
        Try widening the time window or clearing a filter. New sales get posted all the time.
      </p>
      <Link
        href="/create"
        className="mx-auto mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card"
      >
        <Tag className="h-4 w-4" aria-hidden />
        List your own sale
      </Link>
    </div>
  );
}
