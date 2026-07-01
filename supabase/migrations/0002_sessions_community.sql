-- ============================================================================
-- StoopSale — migration 0002
-- Multi-date sessions, weekly recurrence, community-spotted sales.
-- Apply after 0001 (SQL editor or `supabase db push`).
-- ============================================================================

-- A sale can now have multiple time windows (e.g. Sat AND Sun, 10am–4pm).
-- The parent listing keeps starts_at = earliest session start and
-- ends_at = latest session end so existing queries/sorting keep working.
create table public.sale_sessions (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.sale_listings(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  created_at timestamptz not null default now(),
  constraint session_ends_after_starts check (ends_at > starts_at)
);
create index sale_sessions_listing_idx on public.sale_sessions (listing_id);

alter table public.sale_listings
  add column recurring_weekly boolean not null default false,
  add column is_community     boolean not null default false,
  add column times_unknown    boolean not null default false;

-- RLS: sessions readable when the parent listing is readable; owner-managed.
alter table public.sale_sessions enable row level security;

create policy "sessions readable with listing"
  on public.sale_sessions for select
  using (exists (
    select 1 from public.sale_listings l
    where l.id = listing_id
      and ((l.status = 'ACTIVE' and l.is_hidden = false)
           or l.owner_id = auth.uid()
           or public.is_admin())
  ));

create policy "owners manage own sessions"
  on public.sale_sessions for all
  using (exists (select 1 from public.sale_listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.sale_listings l where l.id = listing_id and l.owner_id = auth.uid()));
