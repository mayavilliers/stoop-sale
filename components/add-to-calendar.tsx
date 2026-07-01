import { CalendarPlus } from "lucide-react";

function gcalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Google Calendar template link — zero dependencies, works everywhere. */
export function AddToCalendar({
  title,
  startsAt,
  endsAt,
  address,
  details,
}: {
  title: string;
  startsAt: string;
  endsAt: string;
  address: string;
  details?: string;
}) {
  const url =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${gcalDate(startsAt)}/${gcalDate(endsAt)}` +
    `&location=${encodeURIComponent(address)}` +
    (details ? `&details=${encodeURIComponent(details)}` : "");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[15px] font-medium text-ink transition hover:bg-paper"
    >
      <CalendarPlus className="h-4 w-4" aria-hidden />
      Add to calendar
    </a>
  );
}
