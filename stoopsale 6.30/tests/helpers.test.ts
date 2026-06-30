import { describe, it, expect } from "vitest";
import { haversineMiles, formatMiles } from "@/lib/geo";
import { getDisplayState, formatSaleWindow } from "@/lib/listing-status";

describe("haversineMiles", () => {
  it("is ~0 for the same point", () => {
    expect(haversineMiles({ lat: 40.69, lng: -73.96 }, { lat: 40.69, lng: -73.96 })).toBeCloseTo(0, 5);
  });

  it("matches a known distance (NYC ↔ Philadelphia ≈ 80 mi)", () => {
    const nyc = { lat: 40.7128, lng: -74.006 };
    const philly = { lat: 39.9526, lng: -75.1652 };
    const d = haversineMiles(nyc, philly);
    expect(d).toBeGreaterThan(75);
    expect(d).toBeLessThan(85);
  });
});

describe("formatMiles", () => {
  it("formats near, mid, and far distances", () => {
    expect(formatMiles(0.05)).toBe("<0.1 mi");
    expect(formatMiles(0.42)).toBe("0.4 mi");
    expect(formatMiles(12.6)).toBe("13 mi");
  });
});

describe("getDisplayState", () => {
  const base = (over: Partial<{ status: string; starts_at: string; ends_at: string }>) => ({
    status: "ACTIVE",
    starts_at: new Date(Date.now() - 3600_000).toISOString(),
    ends_at: new Date(Date.now() + 3600_000).toISOString(),
    ...over,
  });

  it("returns draft for DRAFT regardless of time", () => {
    expect(getDisplayState(base({ status: "DRAFT" }))).toBe("draft");
  });
  it("returns open when now is within the window", () => {
    expect(getDisplayState(base({}))).toBe("open");
  });
  it("returns upcoming when the start is in the future", () => {
    expect(
      getDisplayState(
        base({
          starts_at: new Date(Date.now() + 3600_000).toISOString(),
          ends_at: new Date(Date.now() + 7200_000).toISOString(),
        })
      )
    ).toBe("upcoming");
  });
  it("returns ended when the end is in the past", () => {
    expect(
      getDisplayState(
        base({
          starts_at: new Date(Date.now() - 7200_000).toISOString(),
          ends_at: new Date(Date.now() - 3600_000).toISOString(),
        })
      )
    ).toBe("ended");
  });
});

describe("formatSaleWindow", () => {
  it("renders a same-day window as one date with a time range", () => {
    const start = "2026-07-04T13:00:00.000Z";
    const end = "2026-07-04T19:00:00.000Z";
    const out = formatSaleWindow(start, end);
    expect(out).toContain("·");
    expect(out).toContain("–");
  });
});
