-- ============================================================================
-- StoopSale — migration 0003 ("growth kit")
-- Email alerts, address privacy, sale postponement.
-- ============================================================================

-- Neighborhood email alerts ("tell me when a sale pops up near me").
create table public.sale_alerts (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  latitude    double precision not null,
  longitude   double precision not null,
  radius_mi   double precision not null default 2,
  label       text,                                   -- "Greenpoint", "11222", …
  token       uuid not null default gen_random_uuid(),-- unsubscribe token
  created_at  timestamptz not null default now(),
  unique (email, latitude, longitude)
);
create index sale_alerts_geo_idx on public.sale_alerts (latitude, longitude);

alter table public.sale_alerts enable row level security;
-- Anyone (including logged-out visitors) may sign up; nobody can read the list
-- through the public API. The digest cron uses the service role, which bypasses RLS.
create policy "anyone can create an alert"
  on public.sale_alerts for insert with check (true);

-- Address privacy: hide the exact address until the sale starts.
alter table public.sale_listings
  add column hide_address_until_start boolean not null default false,
  add column postponed_note text;
