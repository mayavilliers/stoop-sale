"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AlertState = { ok?: boolean; error?: string } | undefined;

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  radius: z.coerce.number().positive().max(50).default(2),
  label: z.string().trim().max(80).optional(),
});

/** Sign up for a "new sales near me" email digest. Works logged-out. */
export async function createAlert(_prev: AlertState, formData: FormData): Promise<AlertState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    radius: formData.get("radius") ?? 2,
    label: formData.get("label") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("sale_alerts").insert({
    email: v.email.toLowerCase(),
    latitude: v.lat,
    longitude: v.lng,
    radius_mi: v.radius,
    label: v.label || null,
  });
  // Duplicate (same email + spot) is fine — treat as success.
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { error: "Couldn't save that. Try again." };
  }
  return { ok: true };
}
