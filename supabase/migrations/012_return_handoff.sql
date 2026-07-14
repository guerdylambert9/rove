-- Return handoff: free vehicle after return time or when trip is marked returned.
-- Also ignore returned trips for overlap / rental status.

create or replace function public.sync_vehicle_rental_status (p_vehicle_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return_date date;
  v_return_time time;
begin
  select t.return_date, coalesce(t.return_time, time '18:00')
  into v_return_date, v_return_time
  from public.trips t
  where t.vehicle_id = p_vehicle_id
    and t.state not in (
      'cancelled',
      'completed',
      'deposit_released',
      'payment_pending',
      'returned'
    )
    and (t.pickup_date + coalesce(t.pickup_time, time '10:00')) <= now()
    and (t.return_date + coalesce(t.return_time, time '18:00')) > now()
  order by t.return_date desc, t.return_time desc nulls last
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
      and t.state not in (
        'cancelled',
        'completed',
        'deposit_released',
        'returned'
      )
      and t.pickup_date <= new.return_date
      and t.return_date >= new.pickup_date
  ) then
    raise exception 'Vehicle is already booked for overlapping dates';
  end if;

  return new;
end;
$$;

-- Refresh all vehicles now that return_time is considered
do $$
declare
  v record;
begin
  for v in select id from public.vehicles
  loop
    perform public.sync_vehicle_rental_status (v.id);
  end loop;
end;
$$;
