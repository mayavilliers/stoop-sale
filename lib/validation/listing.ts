import { z } from "zod";
import { SALE_TYPE_VALUES, CATEGORY_VALUES } from "@/lib/constants";

const datetimeString = z
  .string()
  .min(1, "Required")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date and time");

export const listingSchema = z
  .object({
    title: z.string().trim().min(3, "Give your sale a title (3+ characters).").max(120),
    saleType: z.enum(SALE_TYPE_VALUES, { message: "Pick a sale type." }),
    description: z.string().trim().max(4000).default(""),
    categories: z
      .array(z.enum(CATEGORY_VALUES))
      .min(1, "Pick at least one category.")
      .max(CATEGORY_VALUES.length),
    address: z.string().trim().min(5, "Enter the sale address."),
    startsAt: datetimeString,
    endsAt: datetimeString,
    notes: z.string().trim().max(500).optional().default(""),
    cashOnly: z.boolean().default(false),
    venmoAccepted: z.boolean().default(false),
    earlyBirdsOk: z.boolean().default(true),
    rainDate: z.string().optional().nullable(),
  })
  .refine((v) => new Date(v.endsAt).getTime() > new Date(v.startsAt).getTime(), {
    message: "The end time has to be after the start time.",
    path: ["endsAt"],
  });

export type ListingValues = z.infer<typeof listingSchema>;

export type ParseResult =
  | { ok: true; data: ListingValues }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

/** Parse a submitted listing form into validated values or a field-error map. */
export function parseListingForm(formData: FormData): ParseResult {
  const raw = {
    title: formData.get("title"),
    saleType: formData.get("saleType"),
    description: formData.get("description") ?? "",
    categories: formData.getAll("categories"),
    address: formData.get("address"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    notes: formData.get("notes") ?? "",
    cashOnly: formData.get("cashOnly") === "on",
    venmoAccepted: formData.get("venmoAccepted") === "on",
    earlyBirdsOk: formData.get("earlyBirdsOk") === "on",
    rainDate: (formData.get("rainDate") as string) || null,
  };

  const parsed = listingSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    error: "Please fix the highlighted fields.",
    fieldErrors,
  };
}
