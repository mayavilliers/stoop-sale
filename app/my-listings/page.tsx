import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MyListingCard } from "@/components/listings/my-listing-card";

export const metadata = { title: "My sales — StoopSale" };

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { created, updated } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Route is guarded by middleware; user is present.

  const { data: listings } = await supabase
    .from("sale_listings")
    .select("*")
    .eq("owner_id", user!.id)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  const items = listings ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">My sales</h1>
        <Link
          href="/create"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sticker px-4 text-sm font-semibold text-sticker-ink shadow-card transition hover:brightness-95"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New sale
        </Link>
      </div>

      {created ? (
        <p className="mt-4 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink">
          Your sale is saved.
        </p>
      ) : null}
      {updated ? (
        <p className="mt-4 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink">
          Changes saved.
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-line bg-surface/60 p-10 text-center">
          <span className="mx-auto grid h-12 w-12 -rotate-6 place-items-center rounded-xl bg-sticker text-sticker-ink">
            <Tag className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">No sales yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-[15px] text-muted">
            Clear out the closet, the garage, the record crate. Your first listing takes about a
            minute.
          </p>
          <Link
            href="/create"
            className="mx-auto mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card"
          >
            <Plus className="h-4 w-4" aria-hidden />
            List your first sale
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
