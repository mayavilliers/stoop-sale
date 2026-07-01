"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseListingForm } from "@/lib/validation/listing";
import { geocodeAddress } from "@/lib/geocode";
import type { ListingStatus } from "@/lib/types/database.types";

export type ListingFormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

const MAX_PHOTOS = 8;

/** Ordered, validated photo URLs from the form (cover first). */
function readPhotoUrls(formData: FormData): string[] {
  return formData
    .getAll("photoUrls")
    .map(String)
    .map((u) => u.trim())
    .filter((u) => /^https:\/\/.+/i.test(u))
    .slice(0, MAX_PHOTOS);
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/create");

  const parsed = parseListingForm(formData);
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const geo = await geocodeAddress(parsed.data.address);
  if (!geo) {
    return {
      error: "",
      fieldErrors: { address: "We couldn't find that address. Check it and try again." },
    };
  }

  const publish = formData.get("intent") === "publish";
  const v = parsed.data;

  const { data: created, error } = await supabase
    .from("sale_listings")
    .insert({
      owner_id: user.id,
      title: v.title,
      sale_type: v.saleType,
      description: v.description,
      categories: v.categories,
      address: v.address,
      neighborhood: geo.neighborhood,
      city: geo.city,
      state: geo.state,
      postal_code: geo.postalCode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      // Overall window = earliest session start → latest session end.
      starts_at: v.sessions[0].startsAt,
      ends_at: v.sessions[v.sessions.length - 1].endsAt,
      notes: v.notes || null,
      cash_only: v.cashOnly,
      venmo_accepted: v.venmoAccepted,
      early_birds_ok: v.earlyBirdsOk,
      recurring_weekly: v.recurringWeekly,
      status: publish ? "ACTIVE" : "DRAFT",
    })
    .select("id")
    .single();

  if (error || !created) return { error: "Something went wrong saving your sale. Try again." };

  await supabase.from("sale_sessions").insert(
    v.sessions.map((sess) => ({
      listing_id: created.id,
      starts_at: sess.startsAt,
      ends_at: sess.endsAt,
    }))
  );

  const photoUrls = readPhotoUrls(formData);
  if (photoUrls.length) {
    await supabase
      .from("sale_photos")
      .insert(photoUrls.map((url, i) => ({ listing_id: created.id, url, sort_order: i })));
  }

  revalidatePath("/my-listings");
  revalidatePath("/");
  redirect("/my-listings?created=1");
}

export async function updateListing(
  id: string,
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/listings/${id}/edit`);

  // Ownership is enforced by RLS, but check here too for a clean error + to
  // decide whether the address (and thus geocode) actually changed.
  const { data: existing } = await supabase
    .from("sale_listings")
    .select("owner_id, address, latitude, longitude, neighborhood, city, state, postal_code, status")
    .eq("id", id)
    .single();

  if (!existing || existing.owner_id !== user.id) {
    return { error: "You can only edit your own listings." };
  }

  const parsed = parseListingForm(formData);
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const v = parsed.data;

  let geo = {
    latitude: existing.latitude,
    longitude: existing.longitude,
    neighborhood: existing.neighborhood,
    city: existing.city,
    state: existing.state,
    postalCode: existing.postal_code,
  };

  if (v.address.trim() !== existing.address.trim()) {
    const fresh = await geocodeAddress(v.address);
    if (!fresh) {
      return {
        error: "",
        fieldErrors: { address: "We couldn't find that address. Check it and try again." },
      };
    }
    geo = {
      latitude: fresh.latitude,
      longitude: fresh.longitude,
      neighborhood: fresh.neighborhood,
      city: fresh.city,
      state: fresh.state,
      postalCode: fresh.postalCode,
    };
  }

  const { error } = await supabase
    .from("sale_listings")
    .update({
      title: v.title,
      sale_type: v.saleType,
      description: v.description,
      categories: v.categories,
      address: v.address,
      neighborhood: geo.neighborhood,
      city: geo.city,
      state: geo.state,
      postal_code: geo.postalCode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      starts_at: v.sessions[0].startsAt,
      ends_at: v.sessions[v.sessions.length - 1].endsAt,
      notes: v.notes || null,
      cash_only: v.cashOnly,
      venmo_accepted: v.venmoAccepted,
      early_birds_ok: v.earlyBirdsOk,
      recurring_weekly: v.recurringWeekly,
    })
    .eq("id", id);

  if (error) return { error: "Something went wrong saving your changes. Try again." };

  // Replace the session set with the submitted rows.
  await supabase.from("sale_sessions").delete().eq("listing_id", id);
  await supabase.from("sale_sessions").insert(
    v.sessions.map((sess) => ({ listing_id: id, starts_at: sess.startsAt, ends_at: sess.endsAt }))
  );

  // Replace the photo set with the submitted, ordered list (handles add/remove/reorder).
  const photoUrls = readPhotoUrls(formData);
  await supabase.from("sale_photos").delete().eq("listing_id", id);
  if (photoUrls.length) {
    await supabase
      .from("sale_photos")
      .insert(photoUrls.map((url, i) => ({ listing_id: id, url, sort_order: i })));
  }

  revalidatePath("/my-listings");
  revalidatePath("/");
  revalidatePath(`/listings/${id}`);
  redirect("/my-listings?updated=1");
}

/** Soft delete — sets status to DELETED. RLS guarantees owner-only. */
export async function deleteListing(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("sale_listings").update({ status: "DELETED" }).eq("id", id);
  revalidatePath("/my-listings");
  revalidatePath("/");
}

export async function setListingStatus(
  id: string,
  status: Extract<ListingStatus, "ACTIVE" | "DRAFT">
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("sale_listings").update({ status }).eq("id", id);
  revalidatePath("/my-listings");
  revalidatePath("/");
  revalidatePath(`/listings/${id}`);
}

/**
 * Community "spotted a sale" — lets someone pin a sale they walked past, even
 * without full details. Times are optional; when missing we window it to the
 * rest of today and flag `times_unknown` so the UI says "times unknown".
 */
export async function spotListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/spot");

  const address = String(formData.get("address") ?? "").trim();
  if (address.length < 5) {
    return { error: "", fieldErrors: { address: "Enter the sale's address or corner." } };
  }
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);
  const rawType = String(formData.get("saleType") ?? "OTHER");
  const saleType = (["GARAGE","STOOP","YARD","MOVING","ESTATE","OTHER"] as const).includes(
    rawType as never
  )
    ? (rawType as "GARAGE" | "STOOP" | "YARD" | "MOVING" | "ESTATE" | "OTHER")
    : "OTHER";

  const geo = await geocodeAddress(address);
  if (!geo) {
    return {
      error: "",
      fieldErrors: { address: "We couldn't find that address. Check it and try again." },
    };
  }

  // Optional times; otherwise default to "the rest of today".
  const date = String(formData.get("sessionDate") ?? "");
  const start = String(formData.get("sessionStart") ?? "");
  const end = String(formData.get("sessionEnd") ?? "");
  let startsAt: Date;
  let endsAt: Date;
  let timesUnknown = false;
  if (date && start && end) {
    startsAt = new Date(`${date}T${start}:00`);
    endsAt = new Date(`${date}T${end}:00`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return { error: "", fieldErrors: { sessions: "Check the date and times." } };
    }
  } else {
    timesUnknown = true;
    startsAt = new Date();
    endsAt = new Date();
    endsAt.setHours(23, 59, 0, 0);
  }

  const title =
    String(formData.get("title") ?? "").trim() ||
    `Spotted: sale${geo.neighborhood ? ` in ${geo.neighborhood}` : ""}`;

  const { data: created, error } = await supabase
    .from("sale_listings")
    .insert({
      owner_id: user.id,
      title: title.slice(0, 120),
      sale_type: saleType,
      description: notes,
      categories: ["OTHER"],
      address,
      neighborhood: geo.neighborhood,
      city: geo.city,
      state: geo.state,
      postal_code: geo.postalCode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_community: true,
      times_unknown: timesUnknown,
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error || !created) return { error: "Couldn't post that. Try again." };

  const photoUrls = readPhotoUrls(formData);
  if (photoUrls.length) {
    await supabase
      .from("sale_photos")
      .insert(photoUrls.map((url, i) => ({ listing_id: created.id, url, sort_order: i })));
  }

  revalidatePath("/");
  redirect(`/listings/${created.id}`);
}
