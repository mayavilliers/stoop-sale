"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { saveSale, unsaveSale } from "@/app/listings/interactions";
import { cn } from "@/lib/utils";

export function SaveHeart({
  listingId,
  initialSaved,
  isLoggedIn,
  className,
}: {
  listingId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  function onClick(e: React.MouseEvent) {
    // The card is a link; keep the heart from opening it.
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?next=/listings/${listingId}`);
      return;
    }

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
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this sale"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-surface/90 shadow-card backdrop-blur transition hover:bg-surface disabled:opacity-70",
        className
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition",
          saved ? "fill-sticker text-sticker" : "text-ink"
        )}
        aria-hidden
      />
    </button>
  );
}
