import { createListing } from "@/app/listings/actions";
import { ListingForm } from "@/components/listings/listing-form";

export const metadata = { title: "List a sale — StoopSale" };

export default function CreatePage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">List a sale</h1>
      <p className="mt-1.5 text-[15px] text-muted">
        Add photos, a time window, and what you&apos;re selling. Publish now to go live, or save a
        draft and finish later.
      </p>
      <div className="mt-8">
        <ListingForm mode="create" action={createListing} />
      </div>
    </div>
  );
}
