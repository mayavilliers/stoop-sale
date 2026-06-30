import { Suspense } from "react";
import { FilterBar } from "@/components/browse/filter-bar";
import { ViewToggle } from "@/components/browse/view-toggle";
import { MapView } from "@/components/map/map-view";

export const metadata = { title: "Map — StoopSale" };

export default function MapPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Sales near you
        </h1>
        <Suspense fallback={null}>
          <ViewToggle />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      <div className="mt-5">
        <Suspense fallback={<div className="h-[60vh] rounded-card border border-line bg-surface/60" />}>
          <MapView />
        </Suspense>
      </div>
    </div>
  );
}
