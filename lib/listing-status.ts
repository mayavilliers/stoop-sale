import { format, isSameDay } from "date-fns";

export type DisplayState = "draft" | "upcoming" | "open" | "ended";

type Windowish = {
  status: string;
  starts_at: string;
  ends_at: string;
  recurring_weekly?: boolean;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * For weekly-recurring sales, roll the window forward to its next occurrence.
 * Non-recurring sales return their stored window unchanged.
 */
export function effectiveWindow(
  l: Pick<Windowish, "starts_at" | "ends_at" | "recurring_weekly">,
  now = Date.now()
): { starts: number; ends: number } {
  let starts = new Date(l.starts_at).getTime();
  let ends = new Date(l.ends_at).getTime();
  if (l.recurring_weekly) {
    while (ends <= now) {
      starts += WEEK_MS;
      ends += WEEK_MS;
    }
  }
  return { starts, ends };
}

/**
 * The single source of truth for whether a sale is live. Derived from time so a
 * missed "expire" cron can never leave an ended sale showing as open. If the
 * sale has multiple sessions, it's open when ANY session is open (recurring
 * sessions are projected to their next weekly occurrence).
 */
export function getDisplayState(
  listing: Windowish,
  sessions?: { starts_at: string; ends_at: string }[]
): DisplayState {
  if (listing.status === "DRAFT") return "draft";
  const now = Date.now();
  const recurring = !!listing.recurring_weekly;

  const windows =
    sessions && sessions.length
      ? sessions.map((s) =>
          effectiveWindow({ ...s, recurring_weekly: recurring }, now)
        )
      : [effectiveWindow(listing, now)];

  if (windows.some((w) => w.starts <= now && now < w.ends)) return "open";
  if (windows.some((w) => w.starts > now)) return "upcoming";
  return "ended";
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
