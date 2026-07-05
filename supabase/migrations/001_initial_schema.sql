-- Phase 1: Backend foundations + auth
-- Data model: User (profiles), Vehicle, Trip, Coverage, Agreement, Payment

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  phone text,
  roles text[] not null default '{renter}',
  identity_verified boolean not null default false,
  license_info jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
create table public.vehicles (
  id text primary key,
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  year integer not null,
  host_display_name text not null,
  price_per_day numeric(10, 2) not null,
  rating numeric(3, 1),
  trips_count integer not null default 0,
  distance_mi numeric(6, 1),
  seats integer not null,
  range text not null,
  drive text not null default 'Auto',
  badge text,
  gradient text not null,
  status text not null default 'idle' check (status in ('idle', 'rented')),
  status_label text,
  photos text[] not null default '{}',
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vehicles_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Trips (schema for later phases; no writes in Phase 1)
-- ---------------------------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid (),
  vehicle_id text not null references public.vehicles (id) on delete restrict,
  renter_id uuid not null references public.profiles (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  pickup_date date not null,
  return_date date not null,
  days integer not null check (days > 0),
  state text not null default 'requested' check (
    state in (
      'requested',
      'coverage_pending',
      'coverage_verified',
      'agreement_signed',
      'confirmed',
      'in_progress',
      'returned',
      'deposit_released',
      'completed',
      'cancelled',
      'disputed'
    )
  ),
  price_breakdown jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trips_updated_at
  before update on public.trips
  for each row
  execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Coverage
-- ---------------------------------------------------------------------------
create table public.coverages (
  id uuid primary key default gen_random_uuid (),
  trip_id uuid not null unique references public.trips (id) on delete cascade,
  type text not null check (type in ('own', 'protection')),
  proof_file_ref text,
  acknowledgment_text text,
  acknowledged_at timestamptz,
  verification_status text not null default 'pending' check (
    verification_status in ('pending', 'verified', 'rejected')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger coverages_updated_at
  before update on public.coverages
  for each row
  execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Agreements
-- ---------------------------------------------------------------------------
create table public.agreements (
  id uuid primary key default gen_random_uuid (),
  trip_id uuid not null unique references public.trips (id) on delete cascade,
  document_ref text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agreements_updated_at
  before update on public.agreements
  for each row
  execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid (),
  trip_id uuid not null unique references public.trips (id) on delete cascade,
  provider_reference text,
  amount numeric(10, 2) not null,
  deposit_hold_status text not null default 'none' check (
    deposit_hold_status in ('none', 'authorized', 'captured', 'released', 'failed')
  ),
  payout_status text not null default 'pending' check (
    payout_status in ('pending', 'scheduled', 'paid', 'failed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payments_updated_at
  before update on public.payments
  for each row
  execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.coverages enable row level security;
alter table public.agreements enable row level security;
alter table public.payments enable row level security;

-- Profiles: users read/update their own row
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid () = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid () = id);

-- Vehicles: public read (browse works before sign-in)
create policy "Anyone can view available vehicles"
  on public.vehicles for select
  using (available = true);

-- Trips: renter or owner can view their trips
create policy "Parties can view their trips"
  on public.trips for select
  using (auth.uid () = renter_id or auth.uid () = owner_id);

create policy "Renters can create trips"
  on public.trips for insert
  with check (auth.uid () = renter_id);

create policy "Parties can update their trips"
  on public.trips for update
  using (auth.uid () = renter_id or auth.uid () = owner_id);

-- Coverage: visible to trip parties
create policy "Parties can view coverage"
  on public.coverages for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.renter_id = auth.uid () or t.owner_id = auth.uid ())
    )
  );

-- Agreements: visible to trip parties
create policy "Parties can view agreements"
  on public.agreements for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.renter_id = auth.uid () or t.owner_id = auth.uid ())
    )
  );

-- Payments: visible to trip parties
create policy "Parties can view payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.renter_id = auth.uid () or t.owner_id = auth.uid ())
    )
  );

-- ---------------------------------------------------------------------------
-- Seed fleet (matches former src/data/cars.js)
-- ---------------------------------------------------------------------------
insert into public.vehicles (
  id,
  name,
  year,
  host_display_name,
  price_per_day,
  rating,
  trips_count,
  distance_mi,
  seats,
  range,
  drive,
  badge,
  gradient,
  status,
  status_label
) values
  (
    'model3',
    'Tesla Model 3',
    2023,
    'Kevin',
    78,
    4.9,
    132,
    3,
    5,
    '272 mi',
    'Auto',
    '★ 4.9 · Superhost',
    'linear-gradient(120deg, #134074, #3A86FF)',
    'rented',
    'Rented · back Jul 6'
  ),
  (
    'wrangler',
    'Jeep Wrangler',
    2021,
    'You',
    64,
    4.8,
    47,
    5,
    4,
    '340 mi',
    'Auto',
    'Instant book',
    'linear-gradient(120deg, #0B2545, #5B6B7B)',
    'idle',
    'Idle · open now'
  ),
  (
    'civic',
    'Honda Civic',
    2022,
    'Kevin',
    52,
    4.9,
    88,
    6,
    5,
    '400 mi',
    'Auto',
    '★ 4.9',
    'linear-gradient(120deg, #1F3A4D, #5DB7AB)',
    'rented',
    'Rented · back Jul 5'
  );
