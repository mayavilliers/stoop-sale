"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { unsaveSale } from "@/app/listings/interactions";

export function RemoveSavedButton({ listingId }: { listingId: string }) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);

  if (gone) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setGone(true); // optimistic hide
        start(() => unsaveSale(listingId));
      }}
      disabled={pending}
      aria-label="Remove from saved"
      className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-ink shadow-card backdrop-blur transition hover:bg-surface"
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
  );
}
