-- Pickup and return-by times on trips

alter table public.trips
  add column if not exists pickup_time time not null default '10:00',
  add column if not exists return_time time not null default '18:00';
