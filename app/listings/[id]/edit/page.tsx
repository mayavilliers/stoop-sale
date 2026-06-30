import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateListing } from "@/app/listings/actions";
import { ListingForm } from "@/components/listings/listing-form";

export const metadata = { title: "Edit sale — StoopSale" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/listings/${id}/edit`);

  const { data: listing } = await supabase
    .from("sale_listings")
    .select("*, sale_photos(url, sort_order)")
    .eq("id", id)
    .single();

  if (!listing || listing.status === "DELETED") notFound();
  // Defense in depth on top of RLS: never render someone else's listing in the editor.
  if (listing.owner_id !== user.id) redirect("/my-listings");

  const action = updateListing.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <Link
        href="/my-listings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to my sales
      </Link>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">Edit sale</h1>
      <div className="mt-8">
        <ListingForm
          mode="edit"
          action={action}
          initial={{
            title: listing.title,
            saleType: listing.sale_type,
            description: listing.description,
            categories: listing.categories,
            address: listing.address,
            startsAt: listing.starts_at,
            endsAt: listing.ends_at,
            notes: listing.notes ?? "",
            cashOnly: listing.cash_only,
            venmoAccepted: listing.venmo_accepted,
            earlyBirdsOk: listing.early_birds_ok,
            rainDate: listing.rain_date,
            photos: (listing.sale_photos ?? [])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((p) => p.url),
          }}
        />
      </div>
    </div>
  );
}
