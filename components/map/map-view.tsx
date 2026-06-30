"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { X, Navigation, Tag } from "lucide-react";
import type { MapMarker, MapApiResponse } from "@/lib/map-markers";
import { getDisplayState, formatSaleWindow } from "@/lib/listing-status";
import { saleTypeLabel } from "@/lib/constants";
import { directionsToCoords } from "@/lib/geo";
import { MapFallback } from "@/components/map/map-fallback";

type Phase = "loading" | "ready" | "error" | "no-key";

const DEFAULT_CENTER = { lat: 40.69, lng: -73.96 }; // Brooklyn
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function markerContent(m: MapMarker): HTMLDivElement {
  const el = document.createElement("div");
  const state = getDisplayState(m);
  el.className = "ss-marker" + (state === "open" ? " ss-marker--live" : "");
  const dot = document.createElement("span");
  dot.className = "ss-marker__dot";
  el.appendChild(dot);
  el.appendChild(document.createTextNode(saleTypeLabel(m.sale_type).replace(" sale", "")));
  return el;
}

export function MapView() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const advancedClassRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const fetchSeq = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  // Filter querystring (everything the API needs except bbox).
  const filterKey = ["when", "category", "type", "tz"]
    .map((k) => `${k}=${params.get(k) ?? ""}`)
    .join("&");
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);

  const fetchInBounds = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const bbox = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`;

    const qs = new URLSearchParams();
    for (const k of ["when", "category", "type", "tz"]) {
      const v = params.get(k);
      if (v) qs.set(k, v);
    }
    qs.set("bbox", bbox);

    const seq = ++fetchSeq.current;
    try {
      const res = await fetch(`/api/listings?${qs.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as MapApiResponse;
      if (seq !== fetchSeq.current) return; // a newer fetch superseded this one
      renderMarkers(data.markers);
      setCount(data.markers.length);
    } catch {
      /* transient fetch error — keep existing markers */
    }
  }, [params]);

  const renderMarkers = useCallback((markers: MapMarker[]) => {
    const map = mapRef.current;
    const AdvancedMarker = advancedClassRef.current;
    if (!map || !AdvancedMarker) return;

    clustererRef.current?.clearMarkers();
    markersRef.current = [];

    for (const m of markers) {
      const content = markerContent(m);
      const marker = new AdvancedMarker({ position: { lat: m.lat, lng: m.lng }, content });
      content.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelected(m);
      });
      markersRef.current.push(marker);
    }

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: markersRef.current });
    } else {
      clustererRef.current.addMarkers(markersRef.current);
    }
  }, []);

  // Initialize the map once.
  useEffect(() => {
    if (initialized.current) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) {
      setPhase("no-key");
      return;
    }
    initialized.current = true;
    let cancelled = false;

    (async () => {
      try {
        const loader = new Loader({ apiKey: key, version: "weekly" });
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          loader.importLibrary("maps"),
          loader.importLibrary("marker"),
        ]);
        if (cancelled || !containerRef.current) return;
        advancedClassRef.current = AdvancedMarkerElement;

        const map = new Map(containerRef.current, {
          center: hasLoc ? { lat, lng } : DEFAULT_CENTER,
          zoom: 13,
          mapId: MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapRef.current = map;

        if (hasLoc) {
          const dot = document.createElement("div");
          dot.style.cssText =
            "width:14px;height:14px;border-radius:999px;background:#2b6fff;border:2px solid #fff;box-shadow:0 0 0 3px rgba(43,111,255,0.3)";
          new AdvancedMarkerElement({ position: { lat, lng }, content: dot, map });
        }

        map.addListener("idle", () => {
          if (idleTimer.current) clearTimeout(idleTimer.current);
          idleTimer.current = setTimeout(fetchInBounds, 300);
        });
        map.addListener("click", () => setSelected(null));

        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change (map already mounted).
  useEffect(() => {
    if (phase === "ready") fetchInBounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, phase]);

  function retry() {
    initialized.current = false;
    setPhase("loading");
    // Re-run init on next tick by toggling a state the effect depends on isn't
    // wired; simplest reliable retry is a full reload of the map route.
    window.location.reload();
  }

  if (phase === "no-key") return <MapFallback variant="no-key" />;
  if (phase === "error") return <MapFallback variant="error" onRetry={retry} />;

  return (
    <div className="relative h-[calc(100dvh-13rem)] min-h-[420px] overflow-hidden rounded-card border border-line">
      <div ref={containerRef} className="h-full w-full" />

      {phase === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-paper">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
            Loading map…
          </div>
        </div>
      ) : null}

      {phase === "ready" && count !== null ? (
        <div className="tabular pointer-events-none absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-paper shadow">
          {count} {count === 1 ? "sale" : "sales"} in view
        </div>
      ) : null}

      {selected ? <PreviewCard marker={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function PreviewCard({ marker, onClose }: { marker: MapMarker; onClose: () => void }) {
  const state = getDisplayState(marker);
  return (
    <div className="absolute inset-x-3 bottom-3 z-10 animate-fade-up sm:left-3 sm:right-auto sm:w-80">
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-pop">
        <div className="relative flex gap-3 p-3">
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-paper text-muted hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
            {marker.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={marker.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-kraft">
                <Tag className="h-6 w-6 -rotate-6" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 pr-6">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {state === "open" ? "Open now" : state === "upcoming" ? "Upcoming" : "Ended"}
            </div>
            <h3 className="mt-0.5 line-clamp-2 font-display text-[15px] font-bold leading-snug">
              {marker.title}
            </h3>
            <p className="tabular mt-0.5 line-clamp-1 text-xs text-muted">
              {formatSaleWindow(marker.starts_at, marker.ends_at)}
            </p>
          </div>
        </div>
        <div className="flex border-t border-line">
          <Link
            href={`/listings/${marker.id}`}
            className="flex-1 py-2.5 text-center text-sm font-semibold text-ink hover:bg-paper"
          >
            View details
          </Link>
          <a
            href={directionsToCoords(marker.lat, marker.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 border-l border-line px-4 text-sm font-semibold text-sticker hover:bg-sticker/5"
          >
            <Navigation className="h-4 w-4" aria-hidden />
            Go
          </a>
        </div>
      </div>
    </div>
  );
}
