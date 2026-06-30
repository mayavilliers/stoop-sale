import { describe, it, expect } from "vitest";
import { parseBrowseParams, timeWindow } from "@/lib/browse-filters";

describe("parseBrowseParams", () => {
  it("applies sensible defaults", () => {
    const p = parseBrowseParams({});
    expect(p.when).toBe("all");
    expect(p.sort).toBe("starting");
    expect(p.category).toBeNull();
    expect(p.saleType).toBeNull();
    expect(p.lat).toBeNull();
    expect(p.lng).toBeNull();
  });

  it("accepts valid values and rejects invalid ones", () => {
    const p = parseBrowseParams({
      when: "weekend",
      sort: "distance",
      category: "RECORDS",
      type: "STOOP",
      lat: "40.73",
      lng: "-73.95",
      tz: "-240",
    });
    expect(p.when).toBe("weekend");
    expect(p.sort).toBe("distance");
    expect(p.category).toBe("RECORDS");
    expect(p.saleType).toBe("STOOP");
    expect(p.lat).toBeCloseTo(40.73);
    expect(p.lng).toBeCloseTo(-73.95);
    expect(p.tzOffsetMin).toBe(-240);
  });

  it("drops unknown enum values", () => {
    const p = parseBrowseParams({ category: "NOPE", type: "FAKE", when: "someday" });
    expect(p.category).toBeNull();
    expect(p.saleType).toBeNull();
    expect(p.when).toBe("all");
  });
});

describe("timeWindow", () => {
  const NOW = new Date("2026-07-01T17:00:00.000Z").getTime(); // Wed, noon ET (tz -240)

  it("open: requires now within window", () => {
    expect(timeWindow("open", -240, NOW)).toEqual({ openNow: true });
  });

  it("all: only excludes already-ended sales", () => {
    const w = timeWindow("all", -240, NOW);
    expect(w.endsAfter).toBe(new Date(NOW).toISOString());
    expect(w.startsBefore).toBeUndefined();
  });

  it("today: bounded by the end of the local day", () => {
    const w = timeWindow("today", -240, NOW);
    expect(w.endsAfter).toBe(new Date(NOW).toISOString());
    // local midnight (ET) of the next day, in UTC = 04:00Z on 2026-07-02
    expect(w.startsBefore).toBe("2026-07-02T04:00:00.000Z");
  });

  it("tomorrow: spans the following local day", () => {
    const w = timeWindow("tomorrow", -240, NOW);
    expect(w.endsAfter).toBe("2026-07-02T04:00:00.000Z");
    expect(w.startsBefore).toBe("2026-07-03T04:00:00.000Z");
  });

  it("weekend: covers the upcoming Sat–Sun in local time", () => {
    const w = timeWindow("weekend", -240, NOW);
    // Upcoming Saturday is 2026-07-04; local midnight = 04:00Z
    expect(w.endsAfter).toBe("2026-07-04T04:00:00.000Z");
    // Through end of Sunday 2026-07-05 → local midnight Monday = 2026-07-06 04:00Z
    expect(w.startsBefore).toBe("2026-07-06T04:00:00.000Z");
  });
});
