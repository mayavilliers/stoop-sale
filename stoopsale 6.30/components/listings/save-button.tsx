"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { saveSale, unsaveSale } from "@/app/listings/interactions";
import { cn } from "@/lib/utils";

export function SaveButton({
  listingId,
  initialSaved,
  isLoggedIn,
}: {
  listingId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?next=/listings/${listingId}`}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[15px] font-medium text-ink transition hover:bg-paper"
      >
        <Heart className="h-4 w-4" aria-hidden />
        Save
      </Link>
    );
  }

  function toggle() {
    const next = !saved;
    setSaved(next); // optimistic
    start(async () => {
      try {
        if (next) await saveSale(listingId);
        else await unsaveSale(listingId);
      } catch {
        setSaved(!next); // revert on failure
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium transition disabled:opacity-70",
        saved
          ? "bg-ink text-paper"
          : "border border-line bg-surface text-ink hover:bg-paper"
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} aria-hidden />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
