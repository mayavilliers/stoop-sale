import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SaleCard, type BrowseCardData } from "@/components/listings/sale-card";

export const metadata = { title: "Saved sales — StoopSale" };

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // route is guarded by middleware

  const { data: rows } = await supabase
    .from("saved_sales")
    .select(
      "created_at, listing:sale_listings(id,title,sale_type,status,starts_at,ends_at,neighborhood,city,categories,sale_photos(url,sort_order))"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const cards: BrowseCardData[] = (rows ?? [])
    .map((r) => r.listing)
    .filter((l): l is NonNullable<typeof l> => !!l && l.status !== "DELETED")
    .map((l) => {
      const photos = (l.sale_photos ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
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
      };
    });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
        Saved sales
      </h1>
      <p className="mt-0.5 text-sm text-muted">
        {cards.length > 0
          ? `${cards.length} saved`
          : "Sales you save show up here for easy planning."}
      </p>

      {cards.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line bg-surface/60 p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-paper text-muted">
            <Heart className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-[15px] text-muted">
            Tap the heart on any sale to keep it here while you plan your route.
          </p>
          <Link
            href="/"
            className="mx-auto mt-5 inline-flex h-11 items-center rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card"
          >
            Browse sales
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {cards.map((listing) => (
            <SaleCard key={listing.id} listing={listing} initialSaved isLoggedIn />
          ))}
        </div>
      )}
    </div>
  );
}
