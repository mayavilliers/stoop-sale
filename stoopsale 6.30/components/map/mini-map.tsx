"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Navigation } from "lucide-react";
import { directionsToCoords } from "@/lib/geo";

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

export function MiniMap({
  lat,
  lng,
  address,
}: {
  lat: number;
  lng: number;
  address: string;
}) {
  const [phase, setPhase] = useState<"loading" | "ready" | "fallback">("loading");
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) {
      setPhase("fallback");
      return;
    }
    done.current = true;
    let cancelled = false;

    (async () => {
      try {
        const loader = new Loader({ apiKey: key, version: "weekly" });
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          loader.importLibrary("maps"),
          loader.importLibrary("marker"),
        ]);
        if (cancelled || !ref.current) return;
        const map = new Map(ref.current, {
          center: { lat, lng },
          zoom: 15,
          mapId: MAP_ID,
          disableDefaultUI: true,
          gestureHandling: "cooperative",
        });
        const dot = document.createElement("div");
        dot.className = "ss-marker ss-marker--live";
        const d = document.createElement("span");
        d.className = "ss-marker__dot";
        dot.appendChild(d);
        dot.appendChild(document.createTextNode("Here"));
        new AdvancedMarkerElement({ position: { lat, lng }, content: dot, map });
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("fallback");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (phase === "fallback") {
    return (
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-[15px] text-ink">{address}</p>
        <a
          href={directionsToCoords(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-sticker hover:underline"
        >
          Open in Google Maps
          <Navigation className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="relative h-56 w-full bg-paper">
        <div ref={ref} className="h-full w-full" />
        {phase === "loading" ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            Loading map…
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line bg-surface px-4 py-2.5">
        <span className="text-sm text-ink">{address}</span>
        <a
          href={directionsToCoords(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-sticker hover:underline"
        >
          Directions
          <Navigation className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
