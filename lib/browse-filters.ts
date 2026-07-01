import type { Category, SaleType } from "@/lib/types/database.types";
import { SALE_TYPE_VALUES, CATEGORY_VALUES } from "@/lib/constants";

export type WhenFilter = "open" | "today" | "tomorrow" | "weekend" | "all";
export type SortKey = "distance" | "starting" | "ending" | "newest";

export const WHEN_OPTIONS: { value: WhenFilter; label: string }[] = [
  { value: "open", label: "Open now" },
  { value: "today", label: "Today" },
  { value: "all", label: "All upcoming" },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "distance", label: "Distance" },
  { value: "starting", label: "Starting soon" },
  { value: "ending", label: "Ending soon" },
  { value: "newest", label: "Newly posted" },
];

export type BrowseParams = {
  when: WhenFilter;
  category: Category | null;
  saleType: SaleType | null;
  sort: SortKey;
  lat: number | null;
  lng: number | null;
  radiusMiles: number | null;
  tzOffsetMin: number; // minutes such that localTime = utcTime + offset
};

const isWhen = (v: unknown): v is WhenFilter =>
  typeof v === "string" && WHEN_OPTIONS.some((w) => w.value === v);
const isSort = (v: unknown): v is SortKey =>
  typeof v === "string" && SORT_OPTIONS.some((s) => s.value === v);

export function parseBrowseParams(sp: Record<string, string | string[] | undefined>): BrowseParams {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;

  const category = get("category");
  const saleType = get("type");
  const lat = Number(get("lat"));
  const lng = Number(get("lng"));
  const radius = Number(get("radius"));
  const tz = Number(get("tz"));

  return {
    when: isWhen(get("when")) ? (get("when") as WhenFilter) : "all",
    category: CATEGORY_VALUES.includes(category as Category) ? (category as Category) : null,
    saleType: SALE_TYPE_VALUES.includes(saleType as SaleType) ? (saleType as SaleType) : null,
    sort: isSort(get("sort")) ? (get("sort") as SortKey) : "starting",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    radiusMiles: Number.isFinite(radius) && radius > 0 ? radius : null,
    tzOffsetMin: Number.isFinite(tz) ? tz : 0,
  };
}

/** UTC instant of local midnight `dayAdd` days from now, given the tz offset. */
function localDayStartUtc(offsetMin: number, dayAdd: number, base = Date.now()): Date {
  const local = new Date(base + offsetMin * 60000);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() + dayAdd);
  return new Date(local.getTime() - offsetMin * 60000);
}

export type TimeWindow = { endsAfter?: string; startsBefore?: string; openNow?: boolean };

/** Build the time constraints for a `when` filter, in the viewer's local days. */
export function timeWindow(when: WhenFilter, offsetMin: number, now = Date.now()): TimeWindow {
  const nowIso = new Date(now).toISOString();
  const dayStart = (add: number) => localDayStartUtc(offsetMin, add, now);

  switch (when) {
    case "open":
      return { openNow: true };
    case "today":
      return { endsAfter: nowIso, startsBefore: dayStart(1).toISOString() };
    case "tomorrow":
      return {
        endsAfter: dayStart(1).toISOString(),
        startsBefore: dayStart(2).toISOString(),
      };
    case "weekend": {
      const localDow = new Date(now + offsetMin * 60000).getUTCDay(); // 0=Sun..6=Sat
      const satAdd = localDow === 0 ? -1 : 6 - localDow; // current weekend if Sat/Sun
      const start = dayStart(satAdd);
      const end = dayStart(satAdd + 2); // through end of Sunday
      const endsAfter = start.getTime() > now ? start.toISOString() : nowIso;
      return { endsAfter, startsBefore: end.toISOString() };
    }
    case "all":
    default:
      return { endsAfter: nowIso };
  }
}
