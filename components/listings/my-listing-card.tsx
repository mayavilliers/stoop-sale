"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2, Eye, EyeOff, CloudRain, Printer } from "lucide-react";
import { deleteListing, setListingStatus, setPostponed } from "@/app/listings/actions";
import { ShareButton } from "@/components/share-button";
import { StatusBadge } from "@/components/status-badge";
import { getDisplayState, formatSaleWindow } from "@/lib/listing-status";
import { saleTypeLabel } from "@/lib/constants";
import type { SaleListing } from "@/lib/types/database.types";

export function MyListingCard({ listing }: { listing: SaleListing }) {
  const [pending, start] = useTransition();
  const state = getDisplayState(listing);
  const isDraft = listing.status === "DRAFT";

  function onDelete() {
    if (!confirm("Delete this sale? This can't be undone.")) return;
    start(() => deleteListing(listing.id));
  }
  function onToggle() {
    start(() => setListingStatus(listing.id, isDraft ? "ACTIVE" : "DRAFT"));
  }
  function onPostpone() {
    if (listing.postponed_note) {
      start(() => setPostponed(listing.id, null));
      return;
    }
    const note = prompt(
      "Add a short note shoppers will see (e.g. \"Rained out — back next Saturday\"):",
      "Rained out — back next Saturday"
    );
    if (note === null) return;
    start(() => setPostponed(listing.id, note || "Postponed"));
  }

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge state={state} />
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {saleTypeLabel(listing.sale_type)}
            </span>
            {listing.postponed_note ? (
              <span className="rounded-full bg-terra px-2 py-0.5 text-[11px] font-semibold text-terra-ink">
                Postponed
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate font-display text-lg font-bold">{listing.title}</h3>
          <p className="tabular mt-0.5 text-sm text-muted">
            {formatSaleWindow(listing.starts_at, listing.ends_at)}
          </p>
          {listing.neighborhood ? (
            <p className="mt-0.5 text-sm text-muted">{listing.neighborhood}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/listings/${listing.id}/edit`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink transition hover:bg-paper"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Edit
        </Link>

        <button
          onClick={onToggle}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink transition hover:bg-paper disabled:opacity-60"
        >
          {isDraft ? (
            <>
              <Eye className="h-4 w-4" aria-hidden />
              Publish
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" aria-hidden />
              Unpublish
            </>
          )}
        </button>

        <button
          onClick={onPostpone}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink transition hover:bg-paper disabled:opacity-60"
        >
          <CloudRain className="h-4 w-4" aria-hidden />
          {listing.postponed_note ? "Un-postpone" : "Postpone"}
        </button>

        <Link
          href={`/listings/${listing.id}/flyer`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink transition hover:bg-paper"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Flyer
        </Link>

        <ShareButton
          title={listing.title}
          text="Come by my sale!"
          path={`/listings/${listing.id}`}
          className="h-9 px-3.5 text-sm"
        />

        <button
          onClick={onDelete}
          disabled={pending}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-terra transition hover:bg-terra/10 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete
        </button>
      </div>
    </div>
  );
}
