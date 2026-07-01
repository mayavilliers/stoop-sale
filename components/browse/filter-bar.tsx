"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Navigation, Loader2, X } from "lucide-react";
import { CATEGORIES, SALE_TYPES } from "@/lib/constants";
import { WHEN_OPTIONS, SORT_OPTIONS } from "@/lib/browse-filters";
import { cn } from "@/lib/utils";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);

  const when = params.get("when") ?? "all";
  const category = params.get("category") ?? "";
  const type = params.get("type") ?? "";
  const sort = params.get("sort") ?? "starting";
  const hasLocation = params.has("lat") && params.has("lng");
  const locationLabel = params.get("loc");
  const radius = params.get("radius") ?? "";

  function commit(next: URLSearchParams) {
    // Always carry the viewer's tz offset so day filters use local days.
    next.set("tz", String(-new Date().getTimezoneOffset()));
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  }

  async function searchPlace() {
    const q = placeQuery.trim();
    if (q.length < 2) return;
    setPlaceLoading(true);
    setPlaceError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setPlaceError(data.error ?? "We couldn't find that place.");
        return;
      }
      const next = new URLSearchParams(params.toString());
      next.set("lat", Number(data.lat).toFixed(5));
      next.set("lng", Number(data.lng).toFixed(5));
      next.set("loc", String(data.label));
      next.set("sort", "distance");
      if (!next.get("radius")) next.set("radius", "2");
      setPlaceQuery("");
      commit(next);
    } catch {
      setPlaceError("We couldn't find that place.");
    } finally {
      setPlaceLoading(false);
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setDenied(true);
      return;
    }
    setLocating(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const next = new URLSearchParams(params.toString());
        next.set("lat", pos.coords.latitude.toFixed(5));
        next.set("lng", pos.coords.longitude.toFixed(5));
        next.delete("loc");
        next.set("sort", "distance");
        if (!next.get("radius")) next.set("radius", "2");
        commit(next);
      },
      () => {
        setLocating(false);
        setDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function clearLocation() {
    const next = new URLSearchParams(params.toString());
    next.delete("lat");
    next.delete("lng");
    next.delete("loc");
    next.delete("radius");
    if (next.get("sort") === "distance") next.set("sort", "starting");
    commit(next);
  }

  return (
    <div className="space-y-3">
      {/* When chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {WHEN_OPTIONS.map((opt) => {
          const active = when === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setParam("when", opt.value === "all" ? null : opt.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                active || (opt.value === "all" && when === "all")
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-surface text-ink hover:bg-paper"
              )}
            >
              {opt.value === "open" ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-live" />
                  {opt.label}
                </span>
              ) : (
                opt.label
              )}
            </button>
          );
        })}
      </div>

      {/* Selects + location */}
      <div className="flex flex-wrap items-center gap-2">
        <SelectControl
          label="Category"
          value={category}
          onChange={(v) => setParam("category", v || null)}
          options={CATEGORIES}
        />
        <SelectControl
          label="Type"
          value={type}
          onChange={(v) => setParam("type", v || null)}
          options={SALE_TYPES}
        />
        <SelectControl
          label="Sort"
          value={sort}
          onChange={(v) => setParam("sort", v)}
          options={SORT_OPTIONS}
          includeAll={false}
          disabledOption={!hasLocation ? "distance" : undefined}
        />

        {hasLocation ? (
          <>
            <button
              onClick={clearLocation}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink bg-ink px-3 text-sm font-medium text-paper"
            >
              <Navigation className="h-3.5 w-3.5" aria-hidden />
              {locationLabel ? `Near ${locationLabel}` : "Near you"}
              <X className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </button>
            <label className="relative inline-flex">
              <span className="sr-only">Radius</span>
              <select
                value={radius || "2"}
                onChange={(e) => setParam("radius", e.target.value)}
                className="h-9 appearance-none rounded-full border border-line bg-surface pl-3.5 pr-8 text-sm font-medium text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              >
                {["0.5", "1", "2", "5", "10", "25"].map((r) => (
                  <option key={r} value={r}>
                    Within {r} mi
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </label>
          </>
        ) : (
          <button
            onClick={useMyLocation}
            disabled={locating || pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink transition hover:bg-paper disabled:opacity-60"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Navigation className="h-3.5 w-3.5" aria-hidden />
            )}
            Use my location
          </button>
        )}
      </div>

      {!hasLocation ? (
        <div className="flex max-w-md items-center gap-2">
          <input
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchPlace();
              }
            }}
            placeholder="Or type a zip, city, or neighborhood…"
            className="h-9 flex-1 rounded-full border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            aria-label="Search near a place"
          />
          <button
            onClick={searchPlace}
            disabled={placeLoading || placeQuery.trim().length < 2}
            className="h-9 shrink-0 rounded-full bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {placeLoading ? "…" : "Go"}
          </button>
        </div>
      ) : null}
      {placeError ? <p className="text-xs text-terra">{placeError}</p> : null}

      {denied ? (
        <p className="text-xs text-muted">
          Location is off, so distance sorting isn&apos;t available. You can still browse by time
          and category.
        </p>
      ) : null}
    </div>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
  includeAll = true,
  disabledOption,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  includeAll?: boolean;
  disabledOption?: string;
}) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border border-line bg-surface pl-3.5 pr-8 text-sm font-medium text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
      >
        {includeAll ? <option value="">{label}: All</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.value === disabledOption}>
            {o.label}
            {o.value === disabledOption ? " (turn on location)" : ""}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
