-- ============================================================================
-- StoopSale — initial schema
-- Supabase Postgres. Run via `supabase db reset` (local) or push to a project.
-- Privacy model: seller email lives ONLY in auth.users and is never exposed.
-- The public `profiles` table intentionally has no email column.
-- Authorization is enforced at the database level via Row Level Security.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------
create type user_role     as enum ('USER', 'ADMIN');
create type sale_type     as enum ('GARAGE', 'STOOP', 'YARD', 'MOVING', 'ESTATE', 'OTHER');
create type category      as enum (
  'FURNITURE','CLOTHING','KIDS_BABY','BOOKS','RECORDS','ELECTRONICS',
  'HOME_GOODS','VINTAGE','TOOLS','FREE_STUFF','OTHER'
);
-- EXPIRED is optional housekeeping (set by an optional cron). Public visibility
-- is still derived from ends_at in queries, so a missed cron run never leaks an
-- ended sale as "live".
create type listing_status as enum ('DRAFT', 'ACTIVE', 'EXPIRED', 'DELETED');
create type report_reason  as enum ('SPAM','INAPPROPRIATE','SCAM','WRONG_LOCATION','ALREADY_ENDED','OTHER');
create type report_status  as enum ('OPEN','REVIEWED','DISMISSED');

-- ---------- Helper: updated_at ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Helper: am I an admin? (SECURITY DEFINER avoids RLS recursion) ---
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  );
$$;

-- ===========================================================================
-- profiles  (1:1 with auth.users; NO email column by design)
-- ===========================================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  image      text,
  role       user_role not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- sale_listings
-- ===========================================================================
create table public.sale_listings (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id) on delete cascade,

  title          text not null,
  sale_type      sale_type not null,
  description    text not null default '',
  categories     category[] not null default '{}',

  address        text not null,
  neighborhood   text,
  city           text,
  state          text,
  postal_code    text,
  latitude       double precision not null,
  longitude      double precision not null,

  starts_at      timestamptz not null,
  ends_at        timestamptz not null,

  notes          text,
  cash_only      boolean not null default false,
  venmo_accepted boolean not null default false,
  early_birds_ok boolean not null default true,
  rain_date      timestamptz,

  status         listing_status not null default 'DRAFT',
  reported_count integer not null default 0,
  is_hidden      boolean not null default false,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint ends_after_starts check (ends_at > starts_at)
);

create index sale_listings_status_idx    on public.sale_listings (status);
create index sale_listings_starts_idx    on public.sale_listings (starts_at);
create index sale_listings_ends_idx      on public.sale_listings (ends_at);
create index sale_listings_owner_idx     on public.sale_listings (owner_id);
create index sale_listings_geo_idx       on public.sale_listings (latitude, longitude);

create trigger sale_listings_updated_at
  before update on public.sale_listings
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- sale_photos
-- ===========================================================================
create table public.sale_photos (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.sale_listings(id) on delete cascade,
  url        text not null,
  width      integer,
  height     integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index sale_photos_listing_idx on public.sale_photos (listing_id);

-- ===========================================================================
-- saved_sales
-- ===========================================================================
create table public.saved_sales (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.sale_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
create index saved_sales_listing_idx on public.saved_sales (listing_id);

-- ===========================================================================
-- reports  (reporter_id nullable → anonymous reports allowed)
-- ===========================================================================
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.sale_listings(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      report_reason not null,
  details     text,
  status      report_status not null default 'OPEN',
  created_at  timestamptz not null default now()
);
create index reports_listing_idx on public.reports (listing_id);
create index reports_status_idx  on public.reports (status);

-- ===========================================================================
-- RPC: submit a report + bump reported_count atomically.
-- SECURITY DEFINER so anonymous/non-owner users can flag a listing without
-- being granted UPDATE on sale_listings.
-- ===========================================================================
create or replace function public.submit_report(
  p_listing_id uuid,
  p_reason     report_reason,
  p_details    text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.reports (listing_id, reporter_id, reason, details)
  values (p_listing_id, auth.uid(), p_reason, p_details);

  update public.sale_listings
     set reported_count = reported_count + 1
   where id = p_listing_id;
end;
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles      enable row level security;
alter table public.sale_listings enable row level security;
alter table public.sale_photos   enable row level security;
alter table public.saved_sales   enable row level security;
alter table public.reports       enable row level security;

-- profiles: public read (name/image only — no email exists here); self-update.
create policy "profiles are publicly readable"
  on public.profiles for select using (true);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- sale_listings: public sees ACTIVE & not-hidden; owners see their own; admins see all.
create policy "public reads active listings"
  on public.sale_listings for select
  using (status = 'ACTIVE' and is_hidden = false);
create policy "owners read own listings"
  on public.sale_listings for select
  using (auth.uid() = owner_id);
create policy "admins read all listings"
  on public.sale_listings for select
  using (public.is_admin());
create policy "owners insert own listings"
  on public.sale_listings for insert
  with check (auth.uid() = owner_id);
create policy "owners update own listings"
  on public.sale_listings for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "admins update any listing"
  on public.sale_listings for update
  using (public.is_admin()) with check (public.is_admin());
-- No client DELETE policy: deletion is a soft delete (status = 'DELETED') via UPDATE.

-- sale_photos: readable when the parent listing is readable; mutable by listing owner.
create policy "photos readable with listing"
  on public.sale_photos for select
  using (exists (
    select 1 from public.sale_listings l
    where l.id = listing_id
      and ((l.status = 'ACTIVE' and l.is_hidden = false)
           or l.owner_id = auth.uid()
           or public.is_admin())
  ));
create policy "owners manage own photos"
  on public.sale_photos for all
  using (exists (select 1 from public.sale_listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.sale_listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- saved_sales: each user manages only their own rows.
create policy "users read own saves"
  on public.saved_sales for select using (auth.uid() = user_id);
create policy "users insert own saves"
  on public.saved_sales for insert with check (auth.uid() = user_id);
create policy "users delete own saves"
  on public.saved_sales for delete using (auth.uid() = user_id);

-- reports: anyone may file (anon allowed); only admins may read/triage.
create policy "anyone can file a report"
  on public.reports for insert with check (true);
create policy "admins read reports"
  on public.reports for select using (public.is_admin());
create policy "admins update reports"
  on public.reports for update using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- Storage: public-read bucket for sale photos.
-- Authenticated users may write only under a folder named with their own uid:
--   sale-photos/<auth.uid()>/<listing_id>/<file>
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('sale-photos', 'sale-photos', true)
on conflict (id) do nothing;

create policy "sale photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'sale-photos');

create policy "users upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'sale-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update their own objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'sale-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'sale-photos' and (storage.foldername(name))[1] = auth.uid()::text);
