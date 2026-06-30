import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { timeWindow, type WhenFilter } from "@/lib/browse-filters";
import { CATEGORY_VALUES, SALE_TYPE_VALUES } from "@/lib/constants";
import type { Category, SaleType } from "@/lib/types/database.types";
import type { MapMarker } from "@/lib/map-markers";

const WHENS: WhenFilter[] = ["open", "today", "tomorrow", "weekend", "all"];
const MAX = 500;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const bbox = searchParams.get("bbox"); // "west,south,east,north"
  const whenParam = searchParams.get("when");
  const when: WhenFilter = WHENS.includes(whenParam as WhenFilter)
    ? (whenParam as WhenFilter)
    : "all";
  const tz = Number(searchParams.get("tz")) || 0;
  const categoryParam = searchParams.get("category");
  const typeParam = searchParams.get("type");
  const category = CATEGORY_VALUES.includes(categoryParam as Category)
    ? (categoryParam as Category)
    : null;
  const saleType = SALE_TYPE_VALUES.includes(typeParam as SaleType)
    ? (typeParam as SaleType)
    : null;

  const supabase = await createClient();

  let query = supabase
    .from("sale_listings")
    .select(
      "id,title,latitude,longitude,sale_type,status,starts_at,ends_at,neighborhood,categories,sale_photos(url,sort_order)"
    )
    .eq("status", "ACTIVE")
    .eq("is_hidden", false)
    .limit(MAX);

  const win = timeWindow(when, tz);
  const nowIso = new Date().toISOString();
  if (win.openNow) {
    query = query.lte("starts_at", nowIso).gt("ends_at", nowIso);
  } else {
    if (win.endsAfter) query = query.gt("ends_at", win.endsAfter);
    if (win.startsBefore) query = query.lt("starts_at", win.startsBefore);
  }
  if (category) query = query.overlaps("categories", [category]);
  if (saleType) query = query.eq("sale_type", saleType);

  if (bbox) {
    const parts = bbox.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      const [west, south, east, north] = parts;
      query = query
        .gte("latitude", south)
        .lte("latitude", north)
        .gte("longitude", west)
        .lte("longitude", east);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to load sales." }, { status: 500 });
  }

  const markers: MapMarker[] = (data ?? []).map((l) => {
    const photos = (l.sale_photos ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: l.id,
      title: l.title,
      lat: l.latitude,
      lng: l.longitude,
      sale_type: l.sale_type,
      status: l.status,
      starts_at: l.starts_at,
      ends_at: l.ends_at,
      neighborhood: l.neighborhood,
      categories: l.categories,
      photoUrl: photos[0]?.url ?? null,
    };
  });

  return NextResponse.json(
    { markers },
    { headers: { "Cache-Control": "no-store" } }
  );
}
