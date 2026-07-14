-- Paid trips must block the car for the whole booked day until return time,
-- not only after pickup time (regression: 4 PM booking looked free at 3:59).

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
      'payment_pending',
      'returned'
    )
    and t.pickup_date <= current_date
    and t.return_date >= current_date
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

-- Refresh fleet status now
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
