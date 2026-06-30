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
