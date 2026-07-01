"use client";

import { Route } from "lucide-react";

type Stop = { lat: number; lng: number };

/**
 * Opens Google Maps with every saved sale as a stop (walking route).
 * Google's directions URL supports up to ~9 waypoints + a destination.
 */
export function RouteButton({ stops }: { stops: Stop[] }) {
  if (stops.length < 2) return null;
  const capped = stops.slice(0, 10);
  const dest = capped[capped.length - 1];
  const waypoints = capped
    .slice(0, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join("|");
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&waypoints=${encodeURIComponent(waypoints)}&travelmode=walking`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card transition hover:brightness-95"
    >
      <Route className="h-4 w-4" aria-hidden />
      Map my route ({capped.length} stops)
    </a>
  );
}
