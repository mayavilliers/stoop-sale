// Imported only by server actions — never bundled to the client.

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  formattedAddress: string;
  approximate: boolean;
};

type GoogleComponent = { long_name: string; short_name: string; types: string[] };

/**
 * Geocode an address to coordinates. Runs server-side only (uses the restricted
 * server key) and is called once on create/update — never on read.
 *
 * If GOOGLE_MAPS_SERVER_KEY is not set, falls back to a deterministic
 * Brooklyn-area coordinate so the create→browse flow is testable in local dev
 * without a Google billing account. Production should always set the key.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return devFallback(address);

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status: string;
    results: {
      geometry: { location: { lat: number; lng: number } };
      address_components: GoogleComponent[];
      formatted_address: string;
    }[];
  };

  if (data.status === "ZERO_RESULTS" || !data.results?.length) return null;
  if (data.status !== "OK") return null;

  const r = data.results[0];
  const pick = (type: string) =>
    r.address_components.find((c) => c.types.includes(type))?.long_name ?? null;

  return {
    latitude: r.geometry.location.lat,
    longitude: r.geometry.location.lng,
    neighborhood: pick("neighborhood") ?? pick("sublocality_level_1") ?? pick("sublocality"),
    city: pick("locality") ?? pick("sublocality"),
    state: pick("administrative_area_level_1"),
    postalCode: pick("postal_code"),
    formattedAddress: r.formatted_address,
    approximate: false,
  };
}

// Deterministic pseudo-geocode around central Brooklyn for keyless local dev.
function devFallback(address: string): GeocodeResult {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) | 0;
  }
  const jitter = (seed: number) => ((Math.abs(seed) % 1000) / 1000 - 0.5) * 0.08;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[geocode] GOOGLE_MAPS_SERVER_KEY not set — using a dev fallback coordinate."
    );
  }
  return {
    latitude: 40.69 + jitter(hash),
    longitude: -73.96 + jitter(hash >> 3),
    neighborhood: null,
    city: "Brooklyn",
    state: "NY",
    postalCode: null,
    formattedAddress: address,
    approximate: true,
  };
}
