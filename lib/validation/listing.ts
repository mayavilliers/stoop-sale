import { z } from "zod";
import { SALE_TYPE_VALUES, CATEGORY_VALUES } from "@/lib/constants";

export type SessionInput = { startsAt: string; endsAt: string };

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Give your sale a title (3+ characters).").max(120),
  saleType: z.enum(SALE_TYPE_VALUES, { message: "Pick a sale type." }),
  description: z.string().trim().max(4000).default(""),
  categories: z
    .array(z.enum(CATEGORY_VALUES))
    .min(1, "Pick at least one category.")
    .max(CATEGORY_VALUES.length),
  address: z.string().trim().min(5, "Enter the sale address."),
  notes: z.string().trim().max(500).optional().default(""),
  cashOnly: z.boolean().default(false),
  venmoAccepted: z.boolean().default(false),
  earlyBirdsOk: z.boolean().default(true),
  recurringWeekly: z.boolean().default(false),
});

export type ListingValues = z.infer<typeof listingSchema> & { sessions: SessionInput[] };

export type ParseResult =
  | { ok: true; data: ListingValues }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

/** Combine a yyyy-mm-dd date + HH:MM time (both local) into a Date. */
function combine(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parse the repeatable day rows into validated session windows. */
export function parseSessions(formData: FormData): SessionInput[] | string {
  const dates = formData.getAll("sessionDate").map(String);
  const starts = formData.getAll("sessionStart").map(String);
  const ends = formData.getAll("sessionEnd").map(String);

  const sessions: SessionInput[] = [];
  for (let i = 0; i < dates.length; i++) {
    if (!dates[i]) continue; // skip empty extra rows
    const s = combine(dates[i], starts[i] ?? "");
    const e = combine(dates[i], ends[i] ?? "");
    if (!s || !e) return "Each day needs a date, a start time, and an end time.";
    if (e.getTime() <= s.getTime()) return "Each day's end time has to be after its start time.";
    sessions.push({ startsAt: s.toISOString(), endsAt: e.toISOString() });
  }
  if (!sessions.length) return "Add at least one sale day.";
  sessions.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return sessions;
}

/** Parse a submitted listing form into validated values or a field-error map. */
export function parseListingForm(formData: FormData): ParseResult {
  const raw = {
    title: formData.get("title"),
    saleType: formData.get("saleType"),
    description: formData.get("description") ?? "",
    categories: formData.getAll("categories"),
    address: formData.get("address"),
    notes: formData.get("notes") ?? "",
    cashOnly: formData.get("cashOnly") === "on",
    venmoAccepted: formData.get("venmoAccepted") === "on",
    earlyBirdsOk: formData.get("earlyBirdsOk") === "on",
    recurringWeekly: formData.get("recurringWeekly") === "on",
  };

  const parsed = listingSchema.safeParse(raw);
  const fieldErrors: Record<string, string> = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
  }

  const sessions = parseSessions(formData);
  if (typeof sessions === "string") fieldErrors.sessions = sessions;

  if (Object.keys(fieldErrors).length || !parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  return { ok: true, data: { ...parsed.data, sessions: sessions as SessionInput[] } };
}
