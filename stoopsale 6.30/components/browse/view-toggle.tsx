"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewToggle() {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  const onMap = pathname.startsWith("/map");

  const base =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition";
  const active = "bg-ink text-paper";
  const idle = "text-ink hover:bg-black/5";

  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-0.5">
      <Link href={`/${suffix}`} className={cn(base, onMap ? idle : active)}>
        <List className="h-4 w-4" aria-hidden />
        List
      </Link>
      <Link href={`/map${suffix}`} className={cn(base, onMap ? active : idle)}>
        <MapIcon className="h-4 w-4" aria-hidden />
        Map
      </Link>
    </div>
  );
}
