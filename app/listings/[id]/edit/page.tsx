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
    .select("*, sale_photos(url, sort_order), sale_sessions(starts_at, ends_at)")
    .eq("id", id)
    .single();

  if (!listing || listing.status === "DELETED") notFound();
  // Defense in depth on top of RLS: never render someone else's listing in the editor.
  if (listing.owner_id !== user.id) redirect("/my-listings");

  const action = updateListing.bind(null, id);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toRow = (iso: string) => {
    const d = new Date(iso);
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  };
  const sessionRows = (listing.sale_sessions ?? [])
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .map((sess) => ({
      date: toRow(sess.starts_at).date,
      start: toRow(sess.starts_at).time,
      end: toRow(sess.ends_at).time,
    }));
  // Older listings created before multi-day support have no session rows.
  const fallbackRows =
    sessionRows.length > 0
      ? sessionRows
      : [
          {
            date: toRow(listing.starts_at).date,
            start: toRow(listing.starts_at).time,
            end: toRow(listing.ends_at).time,
          },
        ];

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
            notes: listing.notes ?? "",
            cashOnly: listing.cash_only,
            venmoAccepted: listing.venmo_accepted,
            earlyBirdsOk: listing.early_birds_ok,
            sessions: fallbackRows,
            recurringWeekly: listing.recurring_weekly,
            hideAddressUntilStart: listing.hide_address_until_start,
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
