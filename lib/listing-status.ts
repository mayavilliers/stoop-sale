import { format, isSameDay } from "date-fns";

export type DisplayState = "draft" | "upcoming" | "open" | "ended";

/**
 * The single source of truth for whether a sale is live. Derived from time so a
 * missed "expire" cron can never leave an ended sale showing as open.
 */
export function getDisplayState(listing: {
  status: string;
  starts_at: string;
  ends_at: string;
}): DisplayState {
  if (listing.status === "DRAFT") return "draft";
  const now = Date.now();
  if (new Date(listing.ends_at).getTime() <= now) return "ended";
  if (new Date(listing.starts_at).getTime() > now) return "upcoming";
  return "open";
}

export const DISPLAY_STATE_LABEL: Record<DisplayState, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  open: "Open now",
  ended: "Ended",
};

/** "Sat, Jul 4 · 9:00 AM – 3:00 PM" or spans days when needed. */
export function formatSaleWindow(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const day = format(start, "EEE, MMM d");
  const startTime = format(start, "h:mm a");
  const endTime = format(end, "h:mm a");
  if (isSameDay(start, end)) {
    return `${day} · ${startTime} – ${endTime}`;
  }
  return `${day}, ${startTime} → ${format(end, "EEE, MMM d")}, ${endTime}`;
}

// ---- Card formatters: date and time on separate, clean lines ----

function timePart(d: Date): string {
  // "10am" on the hour, "10:30am" otherwise (lowercase, no space).
  return d.getMinutes() === 0 ? format(d, "haaa") : format(d, "h:mmaaa");
}

/** "10am - 12pm" — the readable time range for a card. */
export function formatSaleTimeRange(startsAt: string, endsAt: string): string {
  return `${timePart(new Date(startsAt))} - ${timePart(new Date(endsAt))}`;
}

/**
 * "Wed, July 1", or "Wed, July 1 - Thu, July 2" for multi-day sales.
 * The year is only shown when the sale isn't in the current year.
 */
export function formatSaleDate(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const thisYear = new Date().getFullYear();
  const needYear = start.getFullYear() !== thisYear || end.getFullYear() !== thisYear;
  const pattern = needYear ? "EEE, MMMM d, yyyy" : "EEE, MMMM d";
  if (isSameDay(start, end)) return format(start, pattern);
  return `${format(start, pattern)} - ${format(end, pattern)}`;
}
