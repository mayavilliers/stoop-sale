import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";

/** Geocode a zip / city / neighborhood typed into the browse filter. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) {
    return NextResponse.json({ error: "Type a zip, city, or neighborhood." }, { status: 400 });
  }
  const geo = await geocodeAddress(q);
  if (!geo) {
    return NextResponse.json({ error: "We couldn't find that place." }, { status: 404 });
  }
  const label = geo.neighborhood ?? geo.city ?? q;
  return NextResponse.json({ lat: geo.latitude, lng: geo.longitude, label });
}
