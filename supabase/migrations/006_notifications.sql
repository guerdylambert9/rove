-- Phase 6 (partial): in-app notifications on trip booking

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete cascade,
  type text not null check (
    type in (
      'booking_created',
      'booking_received',
      'coverage_verified',
      'coverage_rejected',
      'agreement_ready',
      'pickup_reminder',
      'return_reminder',
      'deposit_released'
    )
  ),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select
  using (auth.uid () = user_id);

create policy "Users mark own notifications read"
  on public.notifications for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

-- Notify renter and owner when a trip is booked (runs as definer; no client insert policy)
create or replace function public.notify_trip_booked ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle_name text;
  v_renter_name text;
  v_date_range text;
begin
  select v.name
  into v_vehicle_name
  from public.vehicles v
  where v.id = new.vehicle_id;

  v_vehicle_name := coalesce(v_vehicle_name, 'your vehicle');

  select coalesce(p.name, 'A renter')
  into v_renter_name
  from public.profiles p
  where p.id = new.renter_id;

  v_date_range :=
    to_char(new.pickup_date, 'Mon DD')
    || ' – '
    || to_char(new.return_date, 'Mon DD, YYYY');

  insert into public.notifications (user_id, trip_id, type, title, body)
  values
    (
      new.renter_id,
      new.id,
      'booking_created',
      'Booking confirmed',
      format(
        'Your trip in %s (%s) is pending coverage verification.',
        v_vehicle_name,
        v_date_range
      )
    ),
    (
      new.owner_id,
      new.id,
      'booking_received',
      'New booking',
      format(
        '%s booked %s (%s). Coverage is pending verification.',
        v_renter_name,
        v_vehicle_name,
        v_date_range
      )
    );

  return new;
end;
$$;

create trigger on_trip_created_notify
  after insert on public.trips
  for each row
  execute function public.notify_trip_booked ();
