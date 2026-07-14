-- Phase 3: Stripe payments + deposit holds

-- payment_pending: trip created, awaiting Stripe checkout
alter table public.trips drop constraint if exists trips_state_check;
alter table public.trips add constraint trips_state_check check (
  state in (
    'requested',
    'payment_pending',
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
);

alter table public.payments
  add column if not exists payment_status text not null default 'pending' check (
    payment_status in ('pending', 'processing', 'paid', 'failed', 'refunded')
  ),
  add column if not exists charge_amount numeric(10, 2),
  add column if not exists deposit_amount numeric(10, 2),
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_deposit_intent_id text;

create policy "Renters can create payment for own pending trip"
  on public.payments for insert
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_id
        and t.renter_id = auth.uid ()
        and t.state = 'payment_pending'
    )
  );

-- Do not notify or mark vehicle rented until payment clears
create or replace function public.sync_vehicle_rental_status (p_vehicle_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return_date date;
begin
  select t.return_date
  into v_return_date
  from public.trips t
  where t.vehicle_id = p_vehicle_id
    and t.state not in (
      'cancelled',
      'completed',
      'deposit_released',
      'payment_pending'
    )
    and t.pickup_date <= current_date
    and t.return_date >= current_date
  order by t.return_date desc
  limit 1;

  if found then
    update public.vehicles
    set
      status = 'rented',
      status_label = 'Rented · returns ' || to_char(v_return_date, 'Mon DD')
    where id = p_vehicle_id;
  else
    update public.vehicles
    set
      status = 'idle',
      status_label = 'Idle · open now'
    where id = p_vehicle_id;
  end if;
end;
$$;

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
  if new.state = 'payment_pending' then
    return new;
  end if;

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

-- Notify parties when payment completes (coverage_pending)
create or replace function public.notify_trip_payment_received ()
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
  if old.state <> 'payment_pending' or new.state <> 'coverage_pending' then
    return new;
  end if;

  select v.name into v_vehicle_name from public.vehicles v where v.id = new.vehicle_id;
  v_vehicle_name := coalesce(v_vehicle_name, 'your vehicle');

  select coalesce(p.name, 'A renter') into v_renter_name
  from public.profiles p where p.id = new.renter_id;

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
      'Payment received',
      format('Your payment for %s (%s) is confirmed.', v_vehicle_name, v_date_range)
    ),
    (
      new.owner_id,
      new.id,
      'booking_received',
      'New paid booking',
      format('%s paid for %s (%s).', v_renter_name, v_vehicle_name, v_date_range)
    );

  perform public.sync_vehicle_rental_status (new.vehicle_id);
  return new;
end;
$$;

drop trigger if exists on_trip_payment_notify on public.trips;
create trigger on_trip_payment_notify
  after update on public.trips
  for each row
  execute function public.notify_trip_payment_received ();
