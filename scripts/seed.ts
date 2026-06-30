/**
 * Seed script — run with: npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses the service role key (full access, bypasses RLS) so it must only ever
 * run locally / in trusted CI — never ship it to the browser.
 *
 * Re-running is safe: it deletes the seed users first (cascading their data)
 * and recreates everything fresh.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database, Category, SaleType } from "../lib/types/database.types";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
  );
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- time helpers ----------------------------------------------------------
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const iso = (d: Date) => d.toISOString();
const from = (ms: number) => new Date(Date.now() + ms);

function nextSaturday(hour: number): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  const delta = (6 - d.getDay() + 7) % 7 || 7; // always the upcoming Saturday
  d.setDate(d.getDate() + delta);
  return d;
}

// ---- seed users ------------------------------------------------------------
const USERS = [
  { email: "maya@stoopsale.test", password: "password123", name: "Maya R.", role: "USER" as const },
  { email: "dev@stoopsale.test", password: "password123", name: "Dev T.", role: "USER" as const },
  { email: "admin@stoopsale.test", password: "password123", name: "Admin", role: "ADMIN" as const },
];

async function resetUsers() {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const wanted = new Set(USERS.map((u) => u.email));
  for (const u of data.users) {
    if (u.email && wanted.has(u.email)) {
      await admin.auth.admin.deleteUser(u.id); // cascades profile + listings + photos + saves
    }
  }
}

async function createUsers() {
  const ids: Record<string, string> = {};
  for (const u of USERS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name },
    });
    if (error || !data.user) throw error ?? new Error(`Failed to create ${u.email}`);
    ids[u.email] = data.user.id;

    // handle_new_user trigger created the profile; set role/name explicitly.
    await admin.from("profiles").update({ name: u.name, role: u.role }).eq("id", data.user.id);
  }
  return ids;
}

type SeedListing = {
  title: string;
  sale_type: SaleType;
  description: string;
  categories: Category[];
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  starts_at: string;
  ends_at: string;
  notes?: string;
  cash_only?: boolean;
  venmo_accepted?: boolean;
  status?: "ACTIVE" | "DRAFT";
  owner: string;
  photoSeeds: string[];
};

function buildListings(): SeedListing[] {
  const sat = nextSaturday(9);
  const satEnd = new Date(sat.getTime() + 6 * HOUR);
  return [
    {
      title: "Greenpoint stoop sale — records & lamps",
      sale_type: "STOOP",
      description:
        "Clearing out the apartment before a move. Lots of vinyl (soul, disco, some jazz), three good lamps, a rug, and kitchen things. Come dig.",
      categories: ["RECORDS", "HOME_GOODS", "FURNITURE"],
      address: "125 Green St, Brooklyn, NY 11222",
      neighborhood: "Greenpoint",
      latitude: 40.7304,
      longitude: -73.954,
      starts_at: iso(from(-2 * HOUR)),
      ends_at: iso(from(4 * HOUR)),
      notes: "Cash or Venmo. Early birds totally fine.",
      venmo_accepted: true,
      owner: "maya@stoopsale.test",
      photoSeeds: ["records1", "lamp1", "rug1"],
    },
    {
      title: "Williamsburg moving sale — everything must go",
      sale_type: "MOVING",
      description:
        "Couch, dining table + 4 chairs, bookshelf, and two boxes of free books on the curb. Flexible on price for the big stuff if you can haul it today.",
      categories: ["FURNITURE", "BOOKS", "FREE_STUFF"],
      address: "200 N 7th St, Brooklyn, NY 11211",
      neighborhood: "Williamsburg",
      latitude: 40.7181,
      longitude: -73.9571,
      starts_at: iso(from(3 * HOUR)),
      ends_at: iso(from(7 * HOUR)),
      notes: "Cash only. Bring muscle for the couch.",
      cash_only: true,
      owner: "dev@stoopsale.test",
      photoSeeds: ["couch1", "table1"],
    },
    {
      title: "Park Slope yard sale — kids & baby gear",
      sale_type: "YARD",
      description:
        "Outgrown it all: stroller, high chair, a mountain of clothes 0–3T, books, and toys. Saturday morning, rain or shine (covered porch).",
      categories: ["KIDS_BABY", "CLOTHING", "BOOKS"],
      address: "450 7th Ave, Brooklyn, NY 11215",
      neighborhood: "Park Slope",
      latitude: 40.671,
      longitude: -73.9814,
      starts_at: iso(sat),
      ends_at: iso(satEnd),
      notes: "Venmo accepted. Rain date next Sunday.",
      venmo_accepted: true,
      owner: "maya@stoopsale.test",
      photoSeeds: ["kids1", "toys1", "clothes1"],
    },
    {
      title: "Bed-Stuy garage sale — tools & vintage",
      sale_type: "GARAGE",
      description:
        "A workshop's worth of hand tools, a few power tools, plus vintage radios and a couple of mid-century chairs. Serious browsers welcome.",
      categories: ["TOOLS", "VINTAGE", "ELECTRONICS", "FURNITURE"],
      address: "300 Halsey St, Brooklyn, NY 11216",
      neighborhood: "Bedford-Stuyvesant",
      latitude: 40.6845,
      longitude: -73.945,
      starts_at: iso(from(6 * DAY)),
      ends_at: iso(from(6 * DAY + 5 * HOUR)),
      notes: "Cash preferred.",
      cash_only: true,
      owner: "dev@stoopsale.test",
      photoSeeds: ["tools1", "vintage1"],
    },
    {
      title: "Fort Greene stoop sale (ended)",
      sale_type: "STOOP",
      description:
        "Books, plants, and odds and ends. Thanks to everyone who stopped by!",
      categories: ["BOOKS", "HOME_GOODS"],
      address: "12 S Portland Ave, Brooklyn, NY 11217",
      neighborhood: "Fort Greene",
      latitude: 40.689,
      longitude: -73.975,
      starts_at: iso(from(-2 * DAY)),
      ends_at: iso(from(-2 * DAY + 5 * HOUR)),
      owner: "maya@stoopsale.test",
      photoSeeds: ["books1"],
    },
    {
      title: "Cobble Hill estate sale (draft — not yet posted)",
      sale_type: "ESTATE",
      description:
        "Full apartment estate sale. Still cataloguing — details and photos coming soon.",
      categories: ["FURNITURE", "VINTAGE", "HOME_GOODS"],
      address: "100 Court St, Brooklyn, NY 11201",
      neighborhood: "Cobble Hill",
      latitude: 40.686,
      longitude: -73.996,
      starts_at: iso(from(9 * DAY)),
      ends_at: iso(from(9 * DAY + 6 * HOUR)),
      status: "DRAFT",
      owner: "dev@stoopsale.test",
      photoSeeds: [],
    },
  ];
}

async function insertListings(userIds: Record<string, string>) {
  const listings = buildListings();
  const inserted: { id: string; owner: string }[] = [];

  for (const l of listings) {
    const { data, error } = await admin
      .from("sale_listings")
      .insert({
        owner_id: userIds[l.owner],
        title: l.title,
        sale_type: l.sale_type,
        description: l.description,
        categories: l.categories,
        address: l.address,
        neighborhood: l.neighborhood,
        city: "Brooklyn",
        state: "NY",
        latitude: l.latitude,
        longitude: l.longitude,
        starts_at: l.starts_at,
        ends_at: l.ends_at,
        notes: l.notes ?? null,
        cash_only: l.cash_only ?? false,
        venmo_accepted: l.venmo_accepted ?? false,
        status: l.status ?? "ACTIVE",
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error(`Failed to insert ${l.title}`);

    inserted.push({ id: data.id, owner: l.owner });

    if (l.photoSeeds.length) {
      const photos = l.photoSeeds.map((seed, i) => ({
        listing_id: data.id,
        url: `https://picsum.photos/seed/${seed}/800/600`,
        width: 800,
        height: 600,
        sort_order: i,
      }));
      const { error: pErr } = await admin.from("sale_photos").insert(photos);
      if (pErr) throw pErr;
    }
  }
  return inserted;
}

async function insertExtras(
  userIds: Record<string, string>,
  listings: { id: string; owner: string }[]
) {
  // Maya saves two sales she didn't post.
  const devSales = listings.filter((l) => l.owner === "dev@stoopsale.test").slice(0, 2);
  if (devSales.length) {
    await admin.from("saved_sales").insert(
      devSales.map((l) => ({ user_id: userIds["maya@stoopsale.test"], listing_id: l.id }))
    );
  }

  // One open report for the admin queue.
  const target = listings.find((l) => l.owner === "dev@stoopsale.test");
  if (target) {
    await admin.from("reports").insert({
      listing_id: target.id,
      reporter_id: userIds["maya@stoopsale.test"],
      reason: "WRONG_LOCATION",
      details: "Pin looks a block off from the address.",
    });
    await admin.from("sale_listings").update({ reported_count: 1 }).eq("id", target.id);
  }
}

async function main() {
  console.log("Resetting existing seed users…");
  await resetUsers();
  console.log("Creating users…");
  const userIds = await createUsers();
  console.log("Inserting listings + photos…");
  const listings = await insertListings(userIds);
  console.log("Inserting saves + a report…");
  await insertExtras(userIds, listings);

  console.log("\n✅ Seed complete.");
  console.log("   Log in with any of these (password: password123):");
  USERS.forEach((u) => console.log(`   • ${u.email}${u.role === "ADMIN" ? "  (admin)" : ""}`));
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
