-- Phase 8: availability blocks + reviews

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid (),
  vehicle_id text not null references public.vehicles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists availability_blocks_vehicle_dates_idx
  on public.availability_blocks (vehicle_id, start_date, end_date);

alter table public.availability_blocks enable row level security;

create policy "Anyone can view availability blocks"
  on public.availability_blocks for select
  using (true);

create policy "Owners manage blocks for own vehicles"
  on public.availability_blocks for all
  using (
    exists (
      select 1
      from public.vehicles v
      where v.id = vehicle_id
        and v.owner_id = auth.uid ()
    )
  )
  with check (
    exists (
      select 1
      from public.vehicles v
      where v.id = vehicle_id
        and v.owner_id = auth.uid ()
    )
  );

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid (),
  trip_id uuid not null references public.trips (id) on delete cascade,
  vehicle_id text not null references public.vehicles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('renter', 'owner')),
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now (),
  unique (trip_id, author_id)
);

create index if not exists reviews_vehicle_idx on public.reviews (vehicle_id);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Trip parties can leave one review"
  on public.reviews for insert
  with check (
    auth.uid () = author_id
    and exists (
      select 1
      from public.trips t
      where t.id = trip_id
        and t.vehicle_id = vehicle_id
        and t.state in ('returned', 'deposit_released', 'completed')
        and (
          (role = 'renter' and t.renter_id = auth.uid ())
          or (role = 'owner' and t.owner_id = auth.uid ())
        )
    )
  );

-- Optional map coordinates on vehicles (defaults near West Palm Beach)
alter table public.vehicles
  add column if not exists lat double precision,
  add column if not exists lng double precision;

update public.vehicles
set
  lat = 26.7153 + (coalesce(distance_mi, 5) * 0.008),
  lng = -80.0534 + (coalesce(distance_mi, 5) * 0.004)
where lat is null;
