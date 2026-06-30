import Link from "next/link";
import { MapPinOff, List } from "lucide-react";

export function MapFallback({
  variant,
  onRetry,
}: {
  variant: "no-key" | "error";
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper text-muted">
        <MapPinOff className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-display text-xl font-bold">
        {variant === "no-key" ? "Map isn't configured yet" : "The map didn't load"}
      </h2>
      <p className="max-w-sm text-[15px] text-muted">
        {variant === "no-key" ? (
          <>
            Add a Google Maps browser key (<code className="tabular">NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY</code>)
            to enable the map. Browsing still works in the list view.
          </>
        ) : (
          <>Check your connection or your Google Maps key restrictions, then try again.</>
        )}
      </p>
      <div className="mt-1 flex gap-2">
        {variant === "error" && onRetry ? (
          <button
            onClick={onRetry}
            className="inline-flex h-10 items-center rounded-full bg-sticker px-4 text-sm font-semibold text-sticker-ink shadow-card"
          >
            Try again
          </button>
        ) : null}
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-paper"
        >
          <List className="h-4 w-4" aria-hidden />
          Browse the list
        </Link>
      </div>
    </div>
  );
}
