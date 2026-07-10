-- Keep vehicle status in sync with active trips (browse + owner fleet)

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
    and t.state not in ('cancelled', 'completed', 'deposit_released')
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

create or replace function public.on_trip_change_sync_vehicle ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_vehicle_rental_status (old.vehicle_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.vehicle_id is distinct from new.vehicle_id then
    perform public.sync_vehicle_rental_status (old.vehicle_id);
  end if;

  perform public.sync_vehicle_rental_status (new.vehicle_id);
  return new;
end;
$$;

create trigger on_trip_change_sync_vehicle
  after insert or update or delete on public.trips
  for each row
  execute function public.on_trip_change_sync_vehicle ();

-- Prevent overlapping bookings for the same vehicle
create or replace function public.prevent_trip_overlap ()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.trips t
    where t.vehicle_id = new.vehicle_id
      and t.id is distinct from new.id
      and t.state not in ('cancelled', 'completed', 'deposit_released')
      and t.pickup_date <= new.return_date
      and t.return_date >= new.pickup_date
  ) then
    raise exception 'Vehicle is already booked for overlapping dates';
  end if;

  return new;
end;
$$;

create trigger on_trip_prevent_overlap
  before insert or update on public.trips
  for each row
  execute function public.prevent_trip_overlap ();

-- Backfill vehicles that already have active trips
do $$
declare
  v record;
begin
  for v in
    select distinct vehicle_id
    from public.trips
  loop
    perform public.sync_vehicle_rental_status (v.vehicle_id);
  end loop;
end;
$$;
